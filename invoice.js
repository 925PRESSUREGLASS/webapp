// invoice.js - Invoice generation and management system
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var INVOICES_KEY = 'invoice-database';
  var INVOICE_SETTINGS_KEY = 'invoice-settings';
  var invoices = [];
  var settings = {
    nextInvoiceNumber: 1001,
    invoicePrefix: 'INV-',
    paymentTermsDays: 7,
    bankName: '',
    accountName: '',
    bsb: '',
    accountNumber: '',
    abn: '',
    includeGST: true
  };

  var INVOICE_STATUSES = {
    draft: { label: 'Draft', color: '#94a3b8', icon: '📝' },
    sent: { label: 'Sent', color: '#38bdf8', icon: '📤' },
    paid: { label: 'Paid', color: '#22c55e', icon: '✓' },
    overdue: { label: 'Overdue', color: '#ef4444', icon: '⚠' },
    cancelled: { label: 'Cancelled', color: '#64748b', icon: '✗' }
  };

  // Load invoices from storage
  function loadInvoices() {
    try {
      var stored = localStorage.getItem(INVOICES_KEY);
      invoices = stored ? JSON.parse(stored) : [];
      return invoices;
    } catch (e) {
      console.error('Failed to load invoices:', e);
      return [];
    }
  }

  // Save invoices to storage
  function saveInvoices() {
    try {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
      return true;
    } catch (e) {
      console.error('Failed to save invoices:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to save invoice data');
      }
      return false;
    }
  }

  // Load settings
  function loadSettings() {
    try {
      var stored = localStorage.getItem(INVOICE_SETTINGS_KEY);
      if (stored) {
        var loadedSettings = JSON.parse(stored);
        Object.keys(loadedSettings).forEach(function(key) {
          settings[key] = loadedSettings[key];
        });
      }
      return settings;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return settings;
    }
  }

  // Save settings
  function saveSettings() {
    try {
      localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  // Generate next invoice number
  function getNextInvoiceNumber() {
    var number = settings.invoicePrefix + settings.nextInvoiceNumber;
    settings.nextInvoiceNumber++;
    saveSettings();
    return number;
  }

  // Convert current quote to invoice
  function convertQuoteToInvoice() {
    if (!window.APP || !window.APP.getState) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Unable to access quote data');
      }
      return null;
    }

    var state = window.APP.getState();

    // Validate quote has items
    var hasItems = (state.windowLines && state.windowLines.length > 0) ||
                   (state.pressureLines && state.pressureLines.length > 0);

    if (!hasItems) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Quote must have at least one line item');
      }
      return null;
    }

    // Get totals from DOM
    var totalText = document.getElementById('totalIncGstDisplay');
    var total = totalText ? parseFloat(totalText.textContent.replace(/[$,]/g, '')) : 0;

    var subtotalText = document.getElementById('subtotalDisplay');
    var subtotal = subtotalText ? parseFloat(subtotalText.textContent.replace(/[$,]/g, '')) : 0;

    var gstText = document.getElementById('gstDisplay');
    var gst = gstText ? parseFloat(gstText.textContent.replace(/[$,]/g, '')) : 0;

    // Create invoice
    var invoice = {
      id: 'invoice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: getNextInvoiceNumber(),
      createdDate: Date.now(),
      invoiceDate: Date.now(),
      dueDate: Date.now() + (settings.paymentTermsDays * 24 * 60 * 60 * 1000),
      status: 'draft',

      // Client info
      clientName: state.clientName || '',
      clientLocation: state.clientLocation || '',
      clientEmail: '',
      clientPhone: '',

      // Quote info
      quoteTitle: state.quoteTitle || 'Untitled Invoice',
      jobType: state.jobType || '',

      // Line items
      windowLines: state.windowLines || [],
      pressureLines: state.pressureLines || [],

      // Totals
      subtotal: subtotal,
      gst: gst,
      total: total,

      // Payment info
      amountPaid: 0,
      balance: total,
      payments: [],

      // Notes
      internalNotes: state.internalNotes || '',
      clientNotes: state.clientNotes || '',

      // Metadata
      statusHistory: [
        { status: 'draft', timestamp: Date.now(), note: 'Invoice created' }
      ]
    };

    // Try to get client details from database
    if (window.ClientDatabase && invoice.clientName) {
      var client = window.ClientDatabase.getByName(invoice.clientName);
      if (client) {
        invoice.clientEmail = client.email || '';
        invoice.clientPhone = client.phone || '';
      }
    }

    // Add to invoices array
    invoices.unshift(invoice);
    saveInvoices();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('Invoice ' + invoice.invoiceNumber + ' created!');
    }

    return invoice;
  }

  // Update invoice status
  function updateInvoiceStatus(invoiceId, newStatus, note) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return false;
    }

    if (!INVOICE_STATUSES[newStatus]) {
      console.error('Invalid status:', newStatus);
      return false;
    }

    invoice.status = newStatus;
    invoice.statusHistory.push({
      status: newStatus,
      timestamp: Date.now(),
      note: note || ''
    });

    saveInvoices();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('Status updated to: ' + INVOICE_STATUSES[newStatus].label);
    }

    return true;
  }

  // Record payment
  function recordPayment(invoiceId, paymentData) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return false;
    }

    var payment = {
      id: 'payment_' + Date.now(),
      amount: parseFloat(paymentData.amount) || 0,
      method: paymentData.method || 'cash',
      date: paymentData.date || Date.now(),
      reference: paymentData.reference || '',
      notes: paymentData.notes || ''
    };

    if (payment.amount <= 0) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Payment amount must be greater than zero');
      }
      return false;
    }

    if (payment.amount > invoice.balance) {
      if (!confirm('Payment amount ($' + payment.amount.toFixed(2) + ') exceeds balance ($' + invoice.balance.toFixed(2) + '). Continue?')) {
        return false;
      }
    }

    invoice.payments.push(payment);
    invoice.amountPaid += payment.amount;
    invoice.balance = invoice.total - invoice.amountPaid;

    // Update status if fully paid
    if (invoice.balance <= 0.01) { // Account for floating point
      updateInvoiceStatus(invoiceId, 'paid', 'Fully paid');
    } else if (invoice.status === 'overdue') {
      updateInvoiceStatus(invoiceId, 'sent', 'Partial payment received');
    }

    saveInvoices();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('Payment recorded: $' + payment.amount.toFixed(2));
    }

    return true;
  }

  // Get invoice by ID
  function getInvoice(invoiceId) {
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].id === invoiceId) {
        return invoices[i];
      }
    }
    return null;
  }

  // Get invoice by number
  function getInvoiceByNumber(invoiceNumber) {
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].invoiceNumber === invoiceNumber) {
        return invoices[i];
      }
    }
    return null;
  }

  // Get all invoices
  function getAllInvoices() {
    return invoices.slice(0).sort(function(a, b) {
      return b.createdDate - a.createdDate;
    });
  }

  // Get filtered invoices
  function getInvoicesByStatus(status) {
    return invoices.filter(function(invoice) {
      return invoice.status === status;
    });
  }

  // Check for overdue invoices and update status
  function checkOverdueInvoices() {
    var now = Date.now();
    var overdueCount = 0;

    invoices.forEach(function(invoice) {
      if (invoice.status === 'sent' && invoice.dueDate < now && invoice.balance > 0) {
        invoice.status = 'overdue';
        invoice.statusHistory.push({
          status: 'overdue',
          timestamp: now,
          note: 'Automatically marked overdue'
        });
        overdueCount++;
      }
    });

    if (overdueCount > 0) {
      saveInvoices();
    }

    return overdueCount;
  }

  // Get invoice statistics
  function getInvoiceStats() {
    var stats = {
      total: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      averageInvoice: 0
    };

    invoices.forEach(function(invoice) {
      stats[invoice.status]++;
      stats.totalRevenue += invoice.total;
      stats.totalPaid += invoice.amountPaid;
      stats.totalOutstanding += invoice.balance;
    });

    stats.averageInvoice = stats.total > 0 ? stats.totalRevenue / stats.total : 0;

    return stats;
  }

  // Delete invoice
  function deleteInvoice(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return false;
    }

    if (invoice.status === 'paid' && invoice.amountPaid > 0) {
      if (!confirm('This invoice has payments recorded. Are you sure you want to delete it?')) {
        return false;
      }
    }

    if (!confirm('Delete invoice ' + invoice.invoiceNumber + '? This cannot be undone.')) {
      return false;
    }

    invoices = invoices.filter(function(inv) {
      return inv.id !== invoiceId;
    });

    saveInvoices();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('Invoice deleted');
    }

    return true;
  }

  // Show invoice list
  function showInvoiceList() {
    var modal = createInvoiceListModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
    renderInvoiceList();
  }

  // Create invoice list modal
  function createInvoiceListModal() {
    var existing = document.getElementById('invoiceListModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'invoiceListModal';
    modal.className = 'invoice-modal';
    modal.innerHTML =
      '<div class="invoice-modal-content">' +
        '<div class="invoice-modal-header">' +
          '<h2>Invoice Management</h2>' +
          '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="invoice-modal-body">' +
          '<div class="invoice-toolbar">' +
            '<button type="button" class="btn btn-primary" id="createInvoiceBtn">Create Invoice from Quote</button>' +
            '<button type="button" class="btn btn-secondary" id="invoiceSettingsBtn">⚙ Settings</button>' +
          '</div>' +
          '<div id="invoiceListContainer"></div>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.invoice-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    modal.querySelector('#createInvoiceBtn').onclick = function() {
      var invoice = convertQuoteToInvoice();
      if (invoice) {
        renderInvoiceList();
      }
    };

    modal.querySelector('#invoiceSettingsBtn').onclick = function() {
      showSettingsModal();
    };

    return modal;
  }

  // Render invoice list
  function renderInvoiceList() {
    var container = document.getElementById('invoiceListContainer');
    if (!container) return;

    checkOverdueInvoices();
    var allInvoices = getAllInvoices();

    if (allInvoices.length === 0) {
      container.innerHTML = '<p class="invoice-list-empty">No invoices yet. Create your first invoice!</p>';
      return;
    }

    var stats = getInvoiceStats();

    var html = '<div class="invoice-stats-summary">';
    html += '<div class="invoice-stat"><span>Total</span><strong>' + stats.total + '</strong></div>';
    html += '<div class="invoice-stat"><span>Outstanding</span><strong>$' + stats.totalOutstanding.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-stat"><span>Paid</span><strong>$' + stats.totalPaid.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-stat"><span>Overdue</span><strong style="color: #ef4444;">' + stats.overdue + '</strong></div>';
    html += '</div>';

    html += '<div class="invoice-list">';

    allInvoices.forEach(function(invoice) {
      var statusData = INVOICE_STATUSES[invoice.status];
      var daysUntilDue = Math.floor((invoice.dueDate - Date.now()) / (1000 * 60 * 60 * 24));

      html += '<div class="invoice-card">';
      html += '<div class="invoice-card-header">';
      html += '<div class="invoice-number">' + invoice.invoiceNumber + '</div>';
      html += '<div class="invoice-status" style="background-color: ' + statusData.color + ';">';
      html += statusData.icon + ' ' + statusData.label;
      html += '</div>';
      html += '</div>';

      html += '<div class="invoice-card-body">';
      html += '<div class="invoice-info-row"><strong>' + escapeHtml(invoice.clientName || 'No client') + '</strong></div>';
      html += '<div class="invoice-info-row">' + escapeHtml(invoice.quoteTitle) + '</div>';
      html += '<div class="invoice-info-row"><span>Amount:</span> $' + invoice.total.toFixed(2) + '</div>';
      html += '<div class="invoice-info-row"><span>Paid:</span> $' + invoice.amountPaid.toFixed(2) + '</div>';
      html += '<div class="invoice-info-row"><span>Balance:</span> <strong>$' + invoice.balance.toFixed(2) + '</strong></div>';

      if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
        var dueDateText = invoice.status === 'overdue' ?
          '<strong style="color: #ef4444;">Overdue by ' + Math.abs(daysUntilDue) + ' days</strong>' :
          'Due in ' + daysUntilDue + ' days';
        html += '<div class="invoice-info-row"><span>Due:</span> ' + dueDateText + '</div>';
      }

      html += '</div>';

      html += '<div class="invoice-card-actions">';
      html += '<button type="button" class="btn btn-small btn-secondary" onclick="window.InvoiceManager.viewInvoice(\'' + invoice.id + '\')">View</button>';
      if (invoice.balance > 0 && invoice.status !== 'cancelled') {
        html += '<button type="button" class="btn btn-small btn-primary" onclick="window.InvoiceManager.recordPayment(\'' + invoice.id + '\')">Record Payment</button>';
      }
      html += '<button type="button" class="btn btn-small btn-ghost" onclick="window.InvoiceManager.deleteInvoice(\'' + invoice.id + '\')">Delete</button>';
      html += '</div>';

      html += '</div>';
    });

    html += '</div>';

    container.innerHTML = html;
  }

  // Show settings modal
  function showSettingsModal() {
    // Implementation to be added
    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo('Settings modal coming soon');
    }
  }

  // View invoice details
  function viewInvoice(invoiceId) {
    // Implementation to be added - will open invoice detail view
    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo('Invoice detail view coming soon');
    }
  }

  // Record payment (show modal)
  function showRecordPaymentModal(invoiceId) {
    // Implementation to be added
    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo('Payment modal coming soon');
    }
  }

  // HTML escape helper
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add "Invoices" button to UI
  function addInvoiceButton() {
    var notesFooter = document.querySelector('.notes-footer');
    if (!notesFooter) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'manageInvoicesBtn';
    button.className = 'btn btn-secondary';
    button.textContent = '📄 Invoices';
    button.onclick = showInvoiceList;

    notesFooter.appendChild(button);
  }

  // Initialize
  function init() {
    loadInvoices();
    loadSettings();
    addInvoiceButton();

    // Check for overdue invoices daily
    checkOverdueInvoices();

    console.log('Invoice manager initialized (' + invoices.length + ' invoices)');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on window load
  window.addEventListener('load', function() {
    setTimeout(function() {
      addInvoiceButton();
    }, 500);
  });

  // Export public API
  window.InvoiceManager = {
    create: convertQuoteToInvoice,
    get: getInvoice,
    getByNumber: getInvoiceByNumber,
    getAll: getAllInvoices,
    getByStatus: getInvoicesByStatus,
    updateStatus: updateInvoiceStatus,
    recordPayment: recordPayment,
    delete: deleteInvoice,
    getStats: getInvoiceStats,
    showList: showInvoiceList,
    viewInvoice: viewInvoice,
    settings: settings,
    saveSettings: saveSettings
  };

})();
