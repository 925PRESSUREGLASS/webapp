// invoice.js - Invoice generation and management system
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var INVOICES_KEY = 'invoice-database';
  var INVOICE_SETTINGS_KEY = 'invoice-settings';

  // Encryption configuration
  // NOTE: Encryption is disabled by default for backward compatibility
  // This is now user-configurable via settings UI (see settings.enableEncryption)
  var ENABLE_ENCRYPTION = false;  // Will be set from settings after loading
  var ENCRYPTION_KEY = 'tictacstick-2025-invoice-secure';

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
    includeGST: true,
    enableEncryption: false
  };

  // Initialize encryption based on settings
  // This is called after settings are loaded
  function initializeEncryption() {
    ENABLE_ENCRYPTION = settings.enableEncryption || false;
    if (ENABLE_ENCRYPTION && window.Security && window.Security.SecureStorage) {
      window.Security.SecureStorage.setKey(ENCRYPTION_KEY);
      console.log('[INVOICE] Encryption enabled for invoice data');
    } else {
      console.log('[INVOICE] Encryption disabled (using unencrypted storage)');
    }
  }

  var INVOICE_STATUSES = {
    draft: { label: 'Draft', color: '#94a3b8', icon: '📝' },
    sent: { label: 'Sent', color: '#38bdf8', icon: '📤' },
    paid: { label: 'Paid', color: '#22c55e', icon: '✓' },
    overdue: { label: 'Overdue', color: '#ef4444', icon: '⚠' },
    cancelled: { label: 'Cancelled', color: '#64748b', icon: '✗' }
  };

  // Load invoices from storage (supports encrypted and unencrypted modes)
  function loadInvoices() {
    try {
      if (settings.enableEncryption && window.Security && window.Security.SecureStorage) {
        // Try to load encrypted data first
        invoices = window.Security.SecureStorage.getItem(INVOICES_KEY, null);

        // If no encrypted data, try to migrate from unencrypted
        if (invoices === null || invoices === undefined) {
          var unencryptedData = localStorage.getItem(INVOICES_KEY);
          if (unencryptedData) {
            // Migrate unencrypted data to encrypted
            invoices = window.Security.safeJSONParse(unencryptedData, null, []);
            if (invoices && invoices.length > 0) {
              // Save as encrypted
              window.Security.SecureStorage.setItem(INVOICES_KEY, invoices);
              console.log('[INVOICE] Migrated ' + invoices.length + ' invoices to encrypted storage');
            }
          } else {
            invoices = [];
          }
        }
      } else {
        // Load unencrypted data (default mode)
        invoices = window.Security.safeJSONParse(
          localStorage.getItem(INVOICES_KEY),
          null,
          []
        );
      }
      return invoices;
    } catch (e) {
      console.error('[INVOICE] Failed to load invoices:', e);
      return [];
    }
  }

  // Save invoices to storage (supports encrypted and unencrypted modes)
  function saveInvoices() {
    try {
      if (settings.enableEncryption && window.Security && window.Security.SecureStorage) {
        window.Security.SecureStorage.setItem(INVOICES_KEY, invoices);
      } else {
        // Save unencrypted (default mode)
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
      }
      return true;
    } catch (e) {
      console.error('[INVOICE] Failed to save invoices:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to save invoice data');
      }
      return false;
    }
  }

  // Load settings (always loads from unencrypted storage first to check enableEncryption flag)
  function loadSettings() {
    try {
      var loadedSettings = null;

      // Always try unencrypted storage first to get the enableEncryption flag
      var unencryptedData = localStorage.getItem(INVOICE_SETTINGS_KEY);
      if (unencryptedData) {
        loadedSettings = window.Security.safeJSONParse(unencryptedData, null, null);
      }

      // If enableEncryption flag is set in loaded settings, try encrypted storage
      if (loadedSettings && loadedSettings.enableEncryption &&
          window.Security && window.Security.SecureStorage) {
        // Temporarily set encryption flag to load encrypted data
        var tempEncryption = ENABLE_ENCRYPTION;
        ENABLE_ENCRYPTION = true;
        window.Security.SecureStorage.setKey(ENCRYPTION_KEY);

        var encryptedSettings = window.Security.SecureStorage.getItem(INVOICE_SETTINGS_KEY, null);
        if (encryptedSettings) {
          loadedSettings = encryptedSettings;
          console.log('[INVOICE] Loaded encrypted settings');
        }

        // Restore encryption flag (will be set properly in initializeEncryption)
        ENABLE_ENCRYPTION = tempEncryption;
      }

      if (loadedSettings) {
        Object.keys(loadedSettings).forEach(function(key) {
          settings[key] = loadedSettings[key];
        });
      }
      return settings;
    } catch (e) {
      console.error('[INVOICE] Failed to load settings:', e);
      return settings;
    }
  }

  // Save settings (supports encrypted and unencrypted modes)
  function saveSettings() {
    try {
      if (settings.enableEncryption && window.Security && window.Security.SecureStorage) {
        window.Security.SecureStorage.setItem(INVOICE_SETTINGS_KEY, settings);
      } else {
        // Save unencrypted (default mode)
        localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(settings));
      }
      return true;
    } catch (e) {
      console.error('[INVOICE] Failed to save settings:', e);
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

  // Get highest invoice number from existing invoices
  // Used to prevent duplicate invoice numbers when changing settings
  function getHighestInvoiceNumber() {
    if (invoices.length === 0) {
      return 0;
    }

    var highest = 0;
    for (var i = 0; i < invoices.length; i++) {
      var invoiceNumber = invoices[i].invoiceNumber;
      // Extract numeric part from invoice number (e.g., "INV-1005" -> 1005)
      var numericPart = invoiceNumber.replace(/[^0-9]/g, '');
      var num = parseInt(numericPart) || 0;
      if (num > highest) {
        highest = num;
      }
    }
    return highest;
  }

  /**
   * Generate description for window line item
   * @param {object} line - Window line item from quote
   * @returns {string} - Description for invoice
   */
  function generateWindowLineDescription(line) {
    var parts = [];

    // Window type
    if (line.windowTypeId) {
      parts.push(line.windowTypeId.charAt(0).toUpperCase() + line.windowTypeId.slice(1) + ' windows');
    } else {
      parts.push('Window cleaning');
    }

    // Panes
    if (line.panes) {
      parts.push('(' + line.panes + ' panes)');
    }

    // Inside/outside
    var sides = [];
    if (line.inside) sides.push('inside');
    if (line.outside) sides.push('outside');
    if (sides.length > 0) {
      parts.push('- ' + sides.join(' & '));
    }

    // High reach
    if (line.highReach) {
      parts.push('- high reach');
    }

    // Location
    if (line.location && line.location.trim() !== '') {
      parts.push('at ' + line.location);
    }

    // Use custom title if provided
    if (line.title && line.title !== 'Window Line') {
      return line.title + ' - ' + parts.join(' ');
    }

    return parts.join(' ');
  }

  /**
   * Generate description for pressure line item
   * @param {object} line - Pressure line item from quote
   * @returns {string} - Description for invoice
   */
  function generatePressureLineDescription(line) {
    var parts = [];

    // Surface type
    if (line.surfaceId) {
      parts.push(line.surfaceId.charAt(0).toUpperCase() + line.surfaceId.slice(1) + ' pressure cleaning');
    } else {
      parts.push('Pressure cleaning');
    }

    // Area
    if (line.areaSqm) {
      parts.push('(' + line.areaSqm + ' sqm)');
    }

    // Access
    if (line.access && line.access !== 'easy') {
      parts.push('- ' + line.access + ' access');
    }

    // Notes
    if (line.notes && line.notes.trim() !== '') {
      parts.push('- ' + line.notes);
    }

    // Use custom title if provided
    if (line.title && line.title !== 'Pressure Line') {
      return line.title + ' - ' + parts.join(' ');
    }

    return parts.join(' ');
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

    // Generate quote ID for tracking
    var quoteId = 'quote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Helper function to get default customer name
    function getDefaultCustomerName() {
      try {
        var counters = JSON.parse(localStorage.getItem('tictacstick_default_counters') || '{"customer":0,"quote":0}');
        counters.customer++;
        localStorage.setItem('tictacstick_default_counters', JSON.stringify(counters));
        return 'customer_' + counters.customer;
      } catch (e) {
        return 'customer_' + Date.now();
      }
    }

    // Helper function to get default quote title
    function getDefaultQuoteName() {
      try {
        var counters = JSON.parse(localStorage.getItem('tictacstick_default_counters') || '{"customer":0,"quote":0}');
        counters.quote++;
        localStorage.setItem('tictacstick_default_counters', JSON.stringify(counters));
        return 'Quote_' + counters.quote;
      } catch (e) {
        return 'Quote_' + Date.now();
      }
    }

    // Apply defaults for missing fields
    var clientName = state.clientName && state.clientName.trim() !== '' ? state.clientName : getDefaultCustomerName();
    var clientLocation = state.clientLocation && state.clientLocation.trim() !== '' ? state.clientLocation : 'Location pending';
    var quoteTitle = state.quoteTitle && state.quoteTitle.trim() !== '' ? state.quoteTitle : getDefaultQuoteName();
    var jobType = state.jobType && state.jobType !== '' ? state.jobType : 'residential';

    // Create invoice
    var invoice = {
      id: 'invoice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: getNextInvoiceNumber(),
      createdDate: Date.now(),
      invoiceDate: Date.now(),
      dueDate: Date.now() + (settings.paymentTermsDays * 24 * 60 * 60 * 1000),
      status: 'draft',

      // Client info (with defaults applied)
      clientName: clientName,
      clientLocation: clientLocation,
      clientEmail: '',
      clientPhone: '',

      // Quote info (with defaults applied)
      quoteId: quoteId,
      quoteTitle: quoteTitle,
      jobType: jobType,

      // Line items - add descriptions for validation
      windowLines: (state.windowLines || []).map(function(line) {
        var invoiceLine = JSON.parse(JSON.stringify(line)); // Deep copy
        // Add description field if missing
        if (!invoiceLine.description || invoiceLine.description.trim() === '') {
          invoiceLine.description = generateWindowLineDescription(line);
        }
        return invoiceLine;
      }),
      pressureLines: (state.pressureLines || []).map(function(line) {
        var invoiceLine = JSON.parse(JSON.stringify(line)); // Deep copy
        // Add description field if missing
        if (!invoiceLine.description || invoiceLine.description.trim() === '') {
          invoiceLine.description = generatePressureLineDescription(line);
        }
        return invoiceLine;
      }),

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

    // VALIDATION: Validate invoice before saving
    if (window.InvoiceValidation) {
      var validationResult = window.InvoiceValidation.validateInvoice(invoice, { isNew: true });
      if (!validationResult.isValid) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Invoice validation failed: ' + validationResult.errors[0].message);
        }
        return null;
      }
    }

    // Add to invoices array
    invoices.unshift(invoice);
    saveInvoices();

    // Save quote to history for tracking (optional, non-blocking)
    if (window.QuoteAnalytics && window.QuoteAnalytics.save) {
      try {
        window.QuoteAnalytics.save();
      } catch (e) {
        console.warn('[INVOICE] Failed to save quote to history:', e);
      }
    }

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

    // VALIDATION: Validate payment before recording
    if (window.InvoiceValidation) {
      var validationResult = window.InvoiceValidation.validatePayment(payment, invoice);
      if (!validationResult.isValid) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Payment validation failed: ' + validationResult.errors[0].message);
        }
        return false;
      }
    }

    // Additional check: warn if payment exceeds balance
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

  // Search and filter state
  var searchState = {
    query: '',
    statusFilter: 'all',
    sortBy: 'date'
  };

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
            '<button type="button" class="btn btn-secondary" id="showAgingReportBtn">📊 Aging Report</button>' +
            '<button type="button" class="btn btn-secondary" id="invoiceSettingsBtn">⚙ Settings</button>' +
          '</div>' +
          '<div class="invoice-search-filter">' +
            '<div class="search-box">' +
              '<input type="text" id="invoiceSearchInput" placeholder="Search by invoice number, client name..." class="form-control" />' +
            '</div>' +
            '<div class="filter-controls">' +
              '<select id="invoiceStatusFilter" class="form-control">' +
                '<option value="all">All Status</option>' +
                '<option value="draft">Draft</option>' +
                '<option value="sent">Sent</option>' +
                '<option value="paid">Paid</option>' +
                '<option value="overdue">Overdue</option>' +
                '<option value="cancelled">Cancelled</option>' +
              '</select>' +
              '<select id="invoiceSortBy" class="form-control">' +
                '<option value="date">Sort by Date</option>' +
                '<option value="number">Sort by Number</option>' +
                '<option value="client">Sort by Client</option>' +
                '<option value="amount">Sort by Amount</option>' +
                '<option value="balance">Sort by Balance</option>' +
              '</select>' +
            '</div>' +
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

    modal.querySelector('#showAgingReportBtn').onclick = function() {
      showAgingReport();
    };

    modal.querySelector('#invoiceSettingsBtn').onclick = function() {
      showSettingsModal();
    };

    // Search and filter event listeners
    var searchInput = modal.querySelector('#invoiceSearchInput');
    var statusFilter = modal.querySelector('#invoiceStatusFilter');
    var sortBy = modal.querySelector('#invoiceSortBy');

    searchInput.oninput = function() {
      searchState.query = searchInput.value.toLowerCase();
      renderInvoiceList();
    };

    statusFilter.onchange = function() {
      searchState.statusFilter = statusFilter.value;
      renderInvoiceList();
    };

    sortBy.onchange = function() {
      searchState.sortBy = sortBy.value;
      renderInvoiceList();
    };

    // Restore previous search state
    if (searchState.query) {
      searchInput.value = searchState.query;
    }
    if (searchState.statusFilter) {
      statusFilter.value = searchState.statusFilter;
    }
    if (searchState.sortBy) {
      sortBy.value = searchState.sortBy;
    }

    return modal;
  }

  // Filter and sort invoices based on search state
  function getFilteredInvoices() {
    var filtered = invoices.slice(0);

    // Apply status filter
    if (searchState.statusFilter && searchState.statusFilter !== 'all') {
      filtered = filtered.filter(function(invoice) {
        return invoice.status === searchState.statusFilter;
      });
    }

    // Apply search query
    if (searchState.query) {
      filtered = filtered.filter(function(invoice) {
        var searchableText = [
          invoice.invoiceNumber,
          invoice.clientName,
          invoice.clientLocation,
          invoice.quoteTitle
        ].join(' ').toLowerCase();
        return searchableText.indexOf(searchState.query) !== -1;
      });
    }

    // Apply sorting
    filtered.sort(function(a, b) {
      switch (searchState.sortBy) {
        case 'number':
          return a.invoiceNumber.localeCompare(b.invoiceNumber);
        case 'client':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'amount':
          return b.total - a.total;
        case 'balance':
          return b.balance - a.balance;
        case 'date':
        default:
          return b.createdDate - a.createdDate;
      }
    });

    return filtered;
  }

  // Render invoice list
  function renderInvoiceList() {
    var container = document.getElementById('invoiceListContainer');
    if (!container) return;

    checkOverdueInvoices();
    var allInvoices = getFilteredInvoices();

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
      html += '<button type="button" class="btn btn-small btn-secondary" onclick="window.InvoiceManager.viewInvoice(\'' + invoice.id + '\')" aria-label="View invoice ' + escapeHtml(invoice.invoiceNumber) + ' for ' + escapeHtml(invoice.clientName || 'unknown client') + '">View</button>';
      html += '<button type="button" class="btn btn-small btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')" aria-label="Edit invoice ' + escapeHtml(invoice.invoiceNumber) + ' for ' + escapeHtml(invoice.clientName || 'unknown client') + '">Edit</button>';
      if (invoice.balance > 0 && invoice.status !== 'cancelled') {
        html += '<button type="button" class="btn btn-small btn-primary" onclick="window.InvoiceManager.recordPayment(\'' + invoice.id + '\')" aria-label="Record payment for invoice ' + escapeHtml(invoice.invoiceNumber) + ' for ' + escapeHtml(invoice.clientName || 'unknown client') + '">Record Payment</button>';
      }
      html += '<button type="button" class="btn btn-small btn-ghost" onclick="window.InvoiceManager.deleteInvoice(\'' + invoice.id + '\')" aria-label="Delete invoice ' + escapeHtml(invoice.invoiceNumber) + ' for ' + escapeHtml(invoice.clientName || 'unknown client') + '">Delete</button>';
      html += '</div>';

      html += '</div>';
    });

    html += '</div>';

    container.innerHTML = html;
  }

  // Show settings modal
  function showSettingsModal() {
    var modal = createSettingsModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create settings modal
  function createSettingsModal() {
    var existing = document.getElementById('invoiceSettingsModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'invoiceSettingsModal';
    modal.className = 'invoice-modal';
    modal.innerHTML =
      '<div class="invoice-modal-content invoice-modal-small">' +
        '<div class="invoice-modal-header">' +
          '<h2>Invoice Settings</h2>' +
          '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="invoice-modal-body">' +
          '<form id="invoiceSettingsForm" class="settings-form">' +
            '<div class="form-group">' +
              '<label for="invoicePrefix">Invoice Prefix</label>' +
              '<input type="text" id="invoicePrefix" value="' + escapeHtml(settings.invoicePrefix) + '" placeholder="INV-" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="nextInvoiceNumber">Next Invoice Number</label>' +
              '<input type="number" id="nextInvoiceNumber" value="' + settings.nextInvoiceNumber + '" min="1" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paymentTermsDays">Payment Terms (days)</label>' +
              '<input type="number" id="paymentTermsDays" value="' + settings.paymentTermsDays + '" min="0" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="bankName">Bank Name</label>' +
              '<input type="text" id="bankName" value="' + escapeHtml(settings.bankName) + '" placeholder="e.g. Commonwealth Bank" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="accountName">Account Name</label>' +
              '<input type="text" id="accountName" value="' + escapeHtml(settings.accountName) + '" placeholder="e.g. 925 Pressure Glass" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="bsb">BSB</label>' +
              '<input type="text" id="bsb" value="' + escapeHtml(settings.bsb) + '" placeholder="123-456" maxlength="7" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="accountNumber">Account Number</label>' +
              '<input type="text" id="accountNumber" value="' + escapeHtml(settings.accountNumber) + '" placeholder="12345678" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="abn">ABN</label>' +
              '<input type="text" id="abn" value="' + escapeHtml(settings.abn) + '" placeholder="12 345 678 901" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="enableEncryption">Enable Encrypted Storage</label>' +
              '<div class="form-checkbox-wrapper">' +
                '<input type="checkbox" id="enableEncryption" class="form-checkbox" ' + (settings.enableEncryption ? 'checked' : '') + ' />' +
                '<label for="enableEncryption">Enable encryption</label>' +
              '</div>' +
              '<p class="form-hint">Encrypts invoice data in browser storage. Requires page reload to take effect.</p>' +
            '</div>' +
            '<div class="form-actions">' +
              '<button type="button" class="btn btn-secondary" id="cancelSettingsBtn">Cancel</button>' +
              '<button type="submit" class="btn btn-primary">Save Settings</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.invoice-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#cancelSettingsBtn').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#invoiceSettingsForm').onsubmit = function(e) {
      e.preventDefault();

      settings.invoicePrefix = document.getElementById('invoicePrefix').value;
      var newInvoiceNumber = parseInt(document.getElementById('nextInvoiceNumber').value) || 1001;

      // BUG FIX #2: Prevent decreasing invoice number to avoid duplicates
      // This maintains tax compliance and prevents duplicate invoice numbers
      var highestExisting = getHighestInvoiceNumber();
      if (newInvoiceNumber <= highestExisting) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Cannot decrease invoice number to ' + newInvoiceNumber + '. Highest existing invoice is ' + highestExisting + '. This prevents duplicate invoice numbers and maintains tax compliance.');
        }
        return;
      }

      settings.nextInvoiceNumber = newInvoiceNumber;
      settings.paymentTermsDays = parseInt(document.getElementById('paymentTermsDays').value) || 7;
      settings.bankName = document.getElementById('bankName').value;
      settings.accountName = document.getElementById('accountName').value;

      // SECURITY: Validate BSB and ABN if provided
      var bsbValue = document.getElementById('bsb').value;
      var abnValue = document.getElementById('abn').value;

      if (bsbValue && window.Security) {
        var bsbValidation = window.Security.validateBSB(bsbValue);
        if (!bsbValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Invalid BSB: ' + bsbValidation.error);
          }
          return;
        }
      }

      if (abnValue && window.Security) {
        var abnValidation = window.Security.validateABN(abnValue);
        if (!abnValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Invalid ABN: ' + abnValidation.error);
          }
          return;
        }
      }

      settings.bsb = bsbValue;
      settings.accountNumber = document.getElementById('accountNumber').value;
      settings.abn = abnValue;
      settings.enableEncryption = document.getElementById('enableEncryption').checked;

      // Get encryption setting
      var previousEncryptionSetting = settings.enableEncryption;
      settings.enableEncryption = document.getElementById('enableEncryption').checked;

      saveSettings();

      // If encryption setting changed, notify user that reload is required
      if (previousEncryptionSetting !== settings.enableEncryption) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess('Settings saved. Please reload the page for encryption changes to take effect.');
        }
      } else {
        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess('Settings saved');
        }
      }

      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    return modal;
  }

  // View invoice details
  function viewInvoice(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return;
    }

    var modal = createInvoiceDetailModal(invoice);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create invoice detail modal
  function createInvoiceDetailModal(invoice) {
    var existing = document.getElementById('invoiceDetailModal');
    if (existing) {
      existing.remove();
    }

    var statusData = INVOICE_STATUSES[invoice.status];
    var dueDate = new Date(invoice.dueDate);
    var invoiceDate = new Date(invoice.invoiceDate);

    var modal = document.createElement('div');
    modal.id = 'invoiceDetailModal';
    modal.className = 'invoice-modal';

    var html = '<div class="invoice-modal-content">';
    html += '<div class="invoice-modal-header">';
    html += '<h2>Invoice ' + invoice.invoiceNumber + '</h2>';
    html += '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="invoice-modal-body">';

    // Status and key info
    html += '<div class="invoice-detail-header">';
    html += '<div class="invoice-status" style="background-color: ' + statusData.color + ';">';
    html += statusData.icon + ' ' + statusData.label;
    html += '</div>';
    html += '<div class="invoice-detail-dates">';
    html += '<div><strong>Invoice Date:</strong> ' + invoiceDate.toLocaleDateString() + '</div>';
    html += '<div><strong>Due Date:</strong> ' + dueDate.toLocaleDateString() + '</div>';
    if (invoice.quoteId) {
      html += '<div><strong>Quote ID:</strong> <code>' + escapeHtml(invoice.quoteId) + '</code></div>';
    }
    html += '</div>';
    html += '</div>';

    // Client info
    html += '<div class="invoice-section">';
    html += '<h3>Client Details</h3>';
    html += '<div class="invoice-detail-row"><strong>' + escapeHtml(invoice.clientName || 'No client name') + '</strong></div>';
    if (invoice.clientLocation) {
      html += '<div class="invoice-detail-row">' + escapeHtml(invoice.clientLocation) + '</div>';
    }
    if (invoice.clientEmail) {
      html += '<div class="invoice-detail-row">Email: ' + escapeHtml(invoice.clientEmail) + '</div>';
    }
    if (invoice.clientPhone) {
      html += '<div class="invoice-detail-row">Phone: ' + escapeHtml(invoice.clientPhone) + '</div>';
    }
    html += '</div>';

    // Financial summary
    html += '<div class="invoice-section">';
    html += '<h3>Financial Summary</h3>';
    html += '<div class="invoice-summary-grid">';
    html += '<div class="invoice-summary-row"><span>Subtotal:</span> <strong>$' + invoice.subtotal.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-summary-row"><span>GST (10%):</span> <strong>$' + invoice.gst.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-summary-row invoice-total-row"><span>Total:</span> <strong>$' + invoice.total.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-summary-row invoice-paid-row"><span>Paid:</span> <strong>$' + invoice.amountPaid.toFixed(2) + '</strong></div>';
    html += '<div class="invoice-summary-row invoice-balance-row"><span>Balance Due:</span> <strong>$' + invoice.balance.toFixed(2) + '</strong></div>';
    html += '</div>';
    html += '</div>';

    // Payment history
    if (invoice.payments && invoice.payments.length > 0) {
      html += '<div class="invoice-section">';
      html += '<h3>Payment History</h3>';
      invoice.payments.forEach(function(payment) {
        var paymentDate = new Date(payment.date);
        html += '<div class="payment-record">';
        html += '<div class="payment-record-row">';
        html += '<span>' + paymentDate.toLocaleDateString() + '</span>';
        html += '<strong>$' + payment.amount.toFixed(2) + '</strong>';
        html += '</div>';
        html += '<div class="payment-record-details">';
        html += 'Method: ' + payment.method;
        if (payment.reference) {
          html += ' | Ref: ' + escapeHtml(payment.reference);
        }
        html += '</div>';
        if (payment.notes) {
          html += '<div class="payment-record-notes">' + escapeHtml(payment.notes) + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // Actions
    html += '<div class="invoice-detail-actions">';
    html += '<button type="button" class="btn btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')" aria-label="Edit invoice ' + escapeHtml(invoice.invoiceNumber) + '">Edit Invoice</button>';
    if (invoice.balance > 0 && invoice.status !== 'cancelled') {
      html += '<button type="button" class="btn btn-primary" onclick="window.InvoiceManager.showPaymentModal(\'' + invoice.id + '\')" aria-label="Record payment for invoice ' + escapeHtml(invoice.invoiceNumber) + '">Record Payment</button>';
    }
    html += '<button type="button" class="btn btn-secondary" onclick="window.InvoiceManager.changeStatus(\'' + invoice.id + '\')" aria-label="Change status of invoice ' + escapeHtml(invoice.invoiceNumber) + '">Change Status</button>';
    html += '<button type="button" class="btn btn-ghost" onclick="window.InvoiceManager.printInvoice(\'' + invoice.id + '\')" aria-label="Print invoice ' + escapeHtml(invoice.invoiceNumber) + '">Print Invoice</button>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    modal.innerHTML = html;

    // Event listener
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

    return modal;
  }

  // Show record payment modal
  function showRecordPaymentModal(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return;
    }

    if (invoice.balance <= 0) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showInfo('Invoice is already paid in full');
      }
      return;
    }

    var modal = createPaymentModal(invoice);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create payment modal
  function createPaymentModal(invoice) {
    var existing = document.getElementById('paymentModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'invoice-modal';
    modal.innerHTML =
      '<div class="invoice-modal-content invoice-modal-small">' +
        '<div class="invoice-modal-header">' +
          '<h2>Record Payment</h2>' +
          '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="invoice-modal-body">' +
          '<div class="payment-summary">' +
            '<div>Invoice: <strong>' + invoice.invoiceNumber + '</strong></div>' +
            '<div>Balance Due: <strong>$' + invoice.balance.toFixed(2) + '</strong></div>' +
          '</div>' +
          '<form id="paymentForm" class="payment-form">' +
            '<div class="form-group">' +
              '<label for="paymentAmount">Amount *</label>' +
              '<input type="number" id="paymentAmount" step="0.01" min="0.01" max="' + invoice.balance + '" value="' + invoice.balance.toFixed(2) + '" required />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paymentMethod">Payment Method *</label>' +
              '<select id="paymentMethod" required>' +
                '<option value="cash">Cash</option>' +
                '<option value="eft">EFT/Bank Transfer</option>' +
                '<option value="card">Credit/Debit Card</option>' +
                '<option value="cheque">Cheque</option>' +
                '<option value="other">Other</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paymentDate">Payment Date *</label>' +
              '<input type="date" id="paymentDate" value="' + new Date().toISOString().split('T')[0] + '" required />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paymentReference">Reference/Transaction ID</label>' +
              '<input type="text" id="paymentReference" placeholder="Optional" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="paymentNotes">Notes</label>' +
              '<textarea id="paymentNotes" rows="2" placeholder="Optional"></textarea>' +
            '</div>' +
            '<div class="form-actions">' +
              '<button type="button" class="btn btn-secondary" id="cancelPaymentBtn">Cancel</button>' +
              '<button type="submit" class="btn btn-primary">Record Payment</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.invoice-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#cancelPaymentBtn').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#paymentForm').onsubmit = function(e) {
      e.preventDefault();

      // SECURITY: Validate payment amount before processing
      var amountValue = document.getElementById('paymentAmount').value;
      if (window.Security) {
        var amountValidation = window.Security.validateCurrency(amountValue, 'Payment amount');
        if (!amountValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError(amountValidation.error);
          }
          return;
        }
      }

      var paymentData = {
        amount: amountValue,
        method: document.getElementById('paymentMethod').value,
        date: new Date(document.getElementById('paymentDate').value).getTime(),
        reference: document.getElementById('paymentReference').value,
        notes: document.getElementById('paymentNotes').value
      };

      var success = recordPayment(invoice.id, paymentData);
      if (success) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);

        // Refresh invoice list if visible
        renderInvoiceList();

        // Close detail modal and reopen with updated data
        var detailModal = document.getElementById('invoiceDetailModal');
        if (detailModal) {
          detailModal.classList.remove('active');
          setTimeout(function() {
            detailModal.remove();
            viewInvoice(invoice.id);
          }, 300);
        }
      }
    };

    return modal;
  }

  // Change invoice status
  function changeInvoiceStatus(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) return;

    // Create status change modal
    var modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'changeStatusModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'changeStatusTitle');

    var content = '<div class="modal-content">';
    content += '<div class="modal-header">';
    content += '<h2 class="modal-title" id="changeStatusTitle">Change Invoice Status</h2>';
    content += '<button class="modal-close" aria-label="Close" onclick="this.closest(\'.modal\').remove()">&times;</button>';
    content += '</div>';
    content += '<div class="modal-body">';
    content += '<p>Current status: <strong>' + INVOICE_STATUSES[invoice.status].label + '</strong></p>';
    content += '<div class="form-group">';
    content += '<label class="form-label">Select new status:</label>';

    // Create radio button for each status
    var statuses = Object.keys(INVOICE_STATUSES);
    for (var i = 0; i < statuses.length; i++) {
      var statusKey = statuses[i];
      var statusInfo = INVOICE_STATUSES[statusKey];
      var checked = statusKey === invoice.status ? 'checked' : '';

      content += '<div class="form-checkbox-wrapper" style="margin: 8px 0;">';
      content += '<input type="radio" id="status_' + statusKey + '" name="invoiceStatus" value="' + statusKey + '" class="form-checkbox" ' + checked + '>';
      content += '<label for="status_' + statusKey + '" style="display: inline-flex; align-items: center; gap: 8px;">';
      content += '<span style="font-size: 1.2em;">' + statusInfo.icon + '</span>';
      content += '<span>' + statusInfo.label + '</span>';
      content += '</label>';
      content += '</div>';
    }

    content += '</div>';
    content += '</div>';
    content += '<div class="modal-footer">';
    content += '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove()">Cancel</button>';
    content += '<button type="button" class="btn btn-primary" id="confirmStatusChange">Update Status</button>';
    content += '</div>';
    content += '</div>';

    modal.innerHTML = content;
    document.body.appendChild(modal);

    // Handle confirm button
    document.getElementById('confirmStatusChange').addEventListener('click', function() {
      var selectedRadio = document.querySelector('input[name="invoiceStatus"]:checked');
      if (selectedRadio) {
        var newStatus = selectedRadio.value;
        if (newStatus !== invoice.status) {
          updateInvoiceStatus(invoiceId, newStatus);
          renderInvoiceList();

          // Show success toast
          if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Invoice status updated to ' + INVOICE_STATUSES[newStatus].label, 'success');
          }

          // Refresh detail view
          var detailModal = document.getElementById('invoiceDetailModal');
          if (detailModal) {
            detailModal.classList.remove('active');
            setTimeout(function() {
              detailModal.remove();
              viewInvoice(invoiceId);
            }, 300);
          }
        }
        modal.remove();
      }
    });

    // Handle escape key
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });
  }

  // Print invoice
  function printInvoiceView(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return;
    }

    // Create print container
    var printContainer = document.createElement('div');
    printContainer.id = 'invoicePrintContainer';
    printContainer.className = 'invoice-print-view';

    // Format dates
    var invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString();
    var dueDate = new Date(invoice.dueDate).toLocaleDateString();

    // Build print HTML
    var html = '<div class="invoice-print-page">';

    // Header
    html += '<div class="invoice-print-header">';
    html += '<div class="invoice-print-logo">';
    html += '<h1>Tic-Tac-Stick</h1>';
    html += '<p>Window Cleaning & Pressure Cleaning</p>';
    html += '</div>';
    html += '<div class="invoice-print-title">';
    html += '<h2>INVOICE</h2>';
    html += '<div class="invoice-print-number">' + escapeHtml(invoice.invoiceNumber) + '</div>';
    html += '</div>';
    html += '</div>';

    // Invoice details and client info
    html += '<div class="invoice-print-details">';
    html += '<div class="invoice-print-info-section">';
    html += '<div class="invoice-print-info-row"><strong>Invoice Date:</strong> <span>' + invoiceDate + '</span></div>';
    html += '<div class="invoice-print-info-row"><strong>Due Date:</strong> <span>' + dueDate + '</span></div>';
    if (invoice.quoteTitle) {
      html += '<div class="invoice-print-info-row"><strong>Job:</strong> <span>' + escapeHtml(invoice.quoteTitle) + '</span></div>';
    }
    html += '</div>';
    html += '<div class="invoice-print-client">';
    html += '<h3>Bill To:</h3>';
    html += '<p><strong>' + escapeHtml(invoice.clientName) + '</strong></p>';
    if (invoice.clientLocation) html += '<p>' + escapeHtml(invoice.clientLocation) + '</p>';
    if (invoice.clientEmail) html += '<p>' + escapeHtml(invoice.clientEmail) + '</p>';
    if (invoice.clientPhone) html += '<p>' + escapeHtml(invoice.clientPhone) + '</p>';
    html += '</div>';
    html += '</div>';

    // Line items
    html += '<table class="invoice-print-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th>Description</th>';
    html += '<th class="invoice-print-align-right">Amount</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    // Add window cleaning lines
    if (invoice.windowLines && invoice.windowLines.length > 0) {
      invoice.windowLines.forEach(function(line) {
        html += '<tr>';
        html += '<td>' + escapeHtml(line.description) + '</td>';
        html += '<td class="invoice-print-align-right">$' + parseFloat(line.price).toFixed(2) + '</td>';
        html += '</tr>';
      });
    }

    // Add pressure cleaning lines
    if (invoice.pressureLines && invoice.pressureLines.length > 0) {
      invoice.pressureLines.forEach(function(line) {
        html += '<tr>';
        html += '<td>' + escapeHtml(line.description) + '</td>';
        html += '<td class="invoice-print-align-right">$' + parseFloat(line.price).toFixed(2) + '</td>';
        html += '</tr>';
      });
    }

    html += '</tbody>';
    html += '</table>';

    // Totals
    html += '<div class="invoice-print-totals">';
    html += '<div class="invoice-print-totals-row">';
    html += '<span>Subtotal:</span>';
    html += '<span>$' + parseFloat(invoice.subtotal).toFixed(2) + '</span>';
    html += '</div>';
    if (invoice.gst > 0) {
      html += '<div class="invoice-print-totals-row">';
      html += '<span>GST (10%):</span>';
      html += '<span>$' + parseFloat(invoice.gst).toFixed(2) + '</span>';
      html += '</div>';
    }
    html += '<div class="invoice-print-totals-row invoice-print-total">';
    html += '<span>Total:</span>';
    html += '<span>$' + parseFloat(invoice.total).toFixed(2) + '</span>';
    html += '</div>';

    // Payment info if partially paid
    if (invoice.amountPaid > 0) {
      html += '<div class="invoice-print-totals-row invoice-print-paid">';
      html += '<span>Amount Paid:</span>';
      html += '<span>-$' + parseFloat(invoice.amountPaid).toFixed(2) + '</span>';
      html += '</div>';
      html += '<div class="invoice-print-totals-row invoice-print-balance">';
      html += '<span>Balance Due:</span>';
      html += '<span>$' + parseFloat(invoice.balance).toFixed(2) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // Payment terms and bank details
    html += '<div class="invoice-print-footer">';
    if (invoice.balance > 0) {
      html += '<div class="invoice-print-payment-terms">';
      html += '<h4>Payment Terms</h4>';
      html += '<p>Payment due within ' + settings.paymentTermsDays + ' days of invoice date.</p>';
      html += '</div>';
    }

    if (settings.bankName || settings.accountName) {
      html += '<div class="invoice-print-bank-details">';
      html += '<h4>Bank Details</h4>';
      if (settings.bankName) html += '<p><strong>Bank:</strong> ' + escapeHtml(settings.bankName) + '</p>';
      if (settings.accountName) html += '<p><strong>Account Name:</strong> ' + escapeHtml(settings.accountName) + '</p>';
      if (settings.bsb) html += '<p><strong>BSB:</strong> ' + escapeHtml(settings.bsb) + '</p>';
      if (settings.accountNumber) html += '<p><strong>Account Number:</strong> ' + escapeHtml(settings.accountNumber) + '</p>';
      html += '</div>';
    }

    if (settings.abn) {
      html += '<div class="invoice-print-abn">';
      html += '<p><strong>ABN:</strong> ' + escapeHtml(settings.abn) + '</p>';
      html += '</div>';
    }

    if (invoice.clientNotes) {
      html += '<div class="invoice-print-notes">';
      html += '<h4>Notes</h4>';
      html += '<p>' + escapeHtml(invoice.clientNotes).replace(/\n/g, '<br>') + '</p>';
      html += '</div>';
    }

    html += '<div class="invoice-print-thank-you">';
    html += '<p>Thank you for your business!</p>';
    html += '</div>';

    html += '</div>'; // Close footer
    html += '</div>'; // Close page

    printContainer.innerHTML = html;
    document.body.appendChild(printContainer);

    // Trigger print
    setTimeout(function() {
      window.print();

      // Clean up after print
      setTimeout(function() {
        document.body.removeChild(printContainer);
      }, 500);
    }, 100);
  }

  // Get aging report - outstanding balances by age
  function getAgingReport() {
    var now = Date.now();
    var report = {
      current: { count: 0, total: 0, invoices: [] },         // 0-30 days
      days30: { count: 0, total: 0, invoices: [] },          // 31-60 days
      days60: { count: 0, total: 0, invoices: [] },          // 61-90 days
      days90Plus: { count: 0, total: 0, invoices: [] },      // 90+ days
      totalOutstanding: 0,
      totalCount: 0
    };

    invoices.forEach(function(invoice) {
      // Only include invoices with outstanding balance
      if (invoice.balance <= 0 || invoice.status === 'cancelled') {
        return;
      }

      var daysOverdue = Math.floor((now - invoice.dueDate) / (1000 * 60 * 60 * 24));
      var balance = parseFloat(invoice.balance);

      var invoiceData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        dueDate: invoice.dueDate,
        balance: balance,
        daysOverdue: daysOverdue
      };

      // Categorize by age
      if (daysOverdue <= 0) {
        // Current (not yet due)
        report.current.count++;
        report.current.total += balance;
        report.current.invoices.push(invoiceData);
      } else if (daysOverdue <= 30) {
        // 1-30 days overdue
        report.current.count++;
        report.current.total += balance;
        report.current.invoices.push(invoiceData);
      } else if (daysOverdue <= 60) {
        // 31-60 days overdue
        report.days30.count++;
        report.days30.total += balance;
        report.days30.invoices.push(invoiceData);
      } else if (daysOverdue <= 90) {
        // 61-90 days overdue
        report.days60.count++;
        report.days60.total += balance;
        report.days60.invoices.push(invoiceData);
      } else {
        // 90+ days overdue
        report.days90Plus.count++;
        report.days90Plus.total += balance;
        report.days90Plus.invoices.push(invoiceData);
      }

      report.totalCount++;
      report.totalOutstanding += balance;
    });

    return report;
  }

  // Show aging report modal
  function showAgingReport() {
    var modal = createAgingReportModal();
    document.body.appendChild(modal);
    setTimeout(function() {
      modal.classList.add('active');
    }, 10);
  }

  // Create aging report modal
  function createAgingReportModal() {
    var existing = document.getElementById('agingReportModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'agingReportModal';
    modal.className = 'invoice-modal';

    var report = getAgingReport();

    var html = '<div class="invoice-modal-content">';
    html += '<div class="invoice-modal-header">';
    html += '<h2>Accounts Receivable Aging Report</h2>';
    html += '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="invoice-modal-body">';

    // Summary stats
    html += '<div class="aging-summary">';
    html += '<div class="aging-stat aging-stat-total">';
    html += '<span>Total Outstanding</span>';
    html += '<strong>$' + report.totalOutstanding.toFixed(2) + '</strong>';
    html += '<small>' + report.totalCount + ' invoice' + (report.totalCount !== 1 ? 's' : '') + '</small>';
    html += '</div>';
    html += '</div>';

    // Aging buckets
    html += '<div class="aging-buckets">';

    // Current (0-30 days)
    html += '<div class="aging-bucket aging-bucket-current">';
    html += '<div class="aging-bucket-header">';
    html += '<h3>Current (0-30 days)</h3>';
    html += '<div class="aging-bucket-total">$' + report.current.total.toFixed(2) + '</div>';
    html += '</div>';
    if (report.current.count > 0) {
      html += '<div class="aging-bucket-list">';
      report.current.invoices.forEach(function(inv) {
        var dayText = inv.daysOverdue <= 0 ?
          'Due in ' + Math.abs(inv.daysOverdue) + ' days' :
          inv.daysOverdue + ' days overdue';
        html += '<div class="aging-invoice-item" data-invoice-id="' + inv.id + '">';
        html += '<div class="aging-invoice-info">';
        html += '<strong>' + escapeHtml(inv.invoiceNumber) + '</strong>';
        html += '<span>' + escapeHtml(inv.clientName) + '</span>';
        html += '<small>' + dayText + '</small>';
        html += '</div>';
        html += '<div class="aging-invoice-amount">$' + inv.balance.toFixed(2) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<p class="aging-bucket-empty">No invoices in this category</p>';
    }
    html += '</div>';

    // 31-60 days
    html += '<div class="aging-bucket aging-bucket-30">';
    html += '<div class="aging-bucket-header">';
    html += '<h3>31-60 Days Overdue</h3>';
    html += '<div class="aging-bucket-total">$' + report.days30.total.toFixed(2) + '</div>';
    html += '</div>';
    if (report.days30.count > 0) {
      html += '<div class="aging-bucket-list">';
      report.days30.invoices.forEach(function(inv) {
        html += '<div class="aging-invoice-item" data-invoice-id="' + inv.id + '">';
        html += '<div class="aging-invoice-info">';
        html += '<strong>' + escapeHtml(inv.invoiceNumber) + '</strong>';
        html += '<span>' + escapeHtml(inv.clientName) + '</span>';
        html += '<small>' + inv.daysOverdue + ' days overdue</small>';
        html += '</div>';
        html += '<div class="aging-invoice-amount">$' + inv.balance.toFixed(2) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<p class="aging-bucket-empty">No invoices in this category</p>';
    }
    html += '</div>';

    // 61-90 days
    html += '<div class="aging-bucket aging-bucket-60">';
    html += '<div class="aging-bucket-header">';
    html += '<h3>61-90 Days Overdue</h3>';
    html += '<div class="aging-bucket-total">$' + report.days60.total.toFixed(2) + '</div>';
    html += '</div>';
    if (report.days60.count > 0) {
      html += '<div class="aging-bucket-list">';
      report.days60.invoices.forEach(function(inv) {
        html += '<div class="aging-invoice-item" data-invoice-id="' + inv.id + '">';
        html += '<div class="aging-invoice-info">';
        html += '<strong>' + escapeHtml(inv.invoiceNumber) + '</strong>';
        html += '<span>' + escapeHtml(inv.clientName) + '</span>';
        html += '<small>' + inv.daysOverdue + ' days overdue</small>';
        html += '</div>';
        html += '<div class="aging-invoice-amount">$' + inv.balance.toFixed(2) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<p class="aging-bucket-empty">No invoices in this category</p>';
    }
    html += '</div>';

    // 90+ days
    html += '<div class="aging-bucket aging-bucket-90">';
    html += '<div class="aging-bucket-header">';
    html += '<h3>90+ Days Overdue</h3>';
    html += '<div class="aging-bucket-total">$' + report.days90Plus.total.toFixed(2) + '</div>';
    html += '</div>';
    if (report.days90Plus.count > 0) {
      html += '<div class="aging-bucket-list">';
      report.days90Plus.invoices.forEach(function(inv) {
        html += '<div class="aging-invoice-item" data-invoice-id="' + inv.id + '">';
        html += '<div class="aging-invoice-info">';
        html += '<strong>' + escapeHtml(inv.invoiceNumber) + '</strong>';
        html += '<span>' + escapeHtml(inv.clientName) + '</span>';
        html += '<small>' + inv.daysOverdue + ' days overdue</small>';
        html += '</div>';
        html += '<div class="aging-invoice-amount">$' + inv.balance.toFixed(2) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      html += '<p class="aging-bucket-empty">No invoices in this category</p>';
    }
    html += '</div>';

    html += '</div>'; // Close aging-buckets

    html += '</div>'; // Close modal body
    html += '</div>'; // Close modal content

    modal.innerHTML = html;

    // Event listeners
    modal.querySelector('.invoice-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      }
    };

    // Click on invoice items to view details
    var invoiceItems = modal.querySelectorAll('.aging-invoice-item');
    for (var i = 0; i < invoiceItems.length; i++) {
      invoiceItems[i].onclick = function() {
        var invoiceId = this.getAttribute('data-invoice-id');
        modal.classList.remove('active');
        setTimeout(function() {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
          viewInvoice(invoiceId);
        }, 300);
      };
    }

    return modal;
  }

  // HTML escape helper
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Edit invoice
  function editInvoice(invoiceId) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Invoice not found');
      }
      return;
    }

    // BUG FIX #1: Prevent editing paid invoices with recorded payments
    // This prevents data corruption and maintains audit trail integrity
    if (invoice.status === 'paid' && invoice.amountPaid > 0) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Cannot edit paid invoices with recorded payments. This protects data integrity and audit compliance.');
      }
      return;
    }

    var modal = createEditInvoiceModal(invoice);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create edit invoice modal
  function createEditInvoiceModal(invoice) {
    var existing = document.getElementById('editInvoiceModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'editInvoiceModal';
    modal.className = 'invoice-modal';

    var invoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];
    var dueDate = new Date(invoice.dueDate).toISOString().split('T')[0];

    modal.innerHTML =
      '<div class="invoice-modal-content invoice-modal-medium">' +
        '<div class="invoice-modal-header">' +
          '<h2>Edit Invoice ' + invoice.invoiceNumber + '</h2>' +
          '<button type="button" class="invoice-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="invoice-modal-body">' +
          '<form id="editInvoiceForm">' +
            '<div class="form-row">' +
              '<div class="form-group">' +
                '<label for="editClientName">Client Name *</label>' +
                '<input type="text" id="editClientName" value="' + escapeHtml(invoice.clientName || '') + '" required />' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="editClientLocation">Location</label>' +
                '<input type="text" id="editClientLocation" value="' + escapeHtml(invoice.clientLocation || '') + '" />' +
              '</div>' +
            '</div>' +
            '<div class="form-row">' +
              '<div class="form-group">' +
                '<label for="editClientEmail">Email</label>' +
                '<input type="email" id="editClientEmail" value="' + escapeHtml(invoice.clientEmail || '') + '" />' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="editClientPhone">Phone</label>' +
                '<input type="tel" id="editClientPhone" value="' + escapeHtml(invoice.clientPhone || '') + '" />' +
              '</div>' +
            '</div>' +
            '<div class="form-row">' +
              '<div class="form-group">' +
                '<label for="editInvoiceDate">Invoice Date *</label>' +
                '<input type="date" id="editInvoiceDate" value="' + invoiceDate + '" required />' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="editDueDate">Due Date *</label>' +
                '<input type="date" id="editDueDate" value="' + dueDate + '" required />' +
              '</div>' +
            '</div>' +
            '<div class="form-row">' +
              '<div class="form-group">' +
                '<label for="editSubtotal">Subtotal *</label>' +
                '<input type="number" id="editSubtotal" step="0.01" value="' + invoice.subtotal.toFixed(2) + '" required />' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="editGST">GST (10%) *</label>' +
                '<input type="number" id="editGST" step="0.01" value="' + invoice.gst.toFixed(2) + '" readonly style="background: rgba(31, 41, 55, 0.3);" title="GST is automatically calculated as 10% of subtotal" />' +
                '<small style="display: block; margin-top: 4px; color: #9ca3af;">Automatically calculated as 10% of subtotal</small>' +
              '</div>' +
              '<div class="form-group">' +
                '<label for="editTotal">Total *</label>' +
                '<input type="number" id="editTotal" step="0.01" value="' + invoice.total.toFixed(2) + '" readonly style="background: rgba(31, 41, 55, 0.3);" />' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="editQuoteTitle">Quote Title / Description</label>' +
              '<textarea id="editQuoteTitle" rows="2">' + escapeHtml(invoice.quoteTitle || '') + '</textarea>' +
            '</div>' +
            (invoice.quoteId ?
              '<div class="form-group">' +
                '<label>Quote ID</label>' +
                '<input type="text" value="' + escapeHtml(invoice.quoteId) + '" readonly style="background: rgba(31, 41, 55, 0.3); font-family: monospace;" title="Original quote identifier" />' +
              '</div>' : '') +
            '<div class="form-group">' +
              '<label for="editInvoiceStatus">Status</label>' +
              '<select id="editInvoiceStatus">' +
                '<option value="draft"' + (invoice.status === 'draft' ? ' selected' : '') + '>Draft</option>' +
                '<option value="sent"' + (invoice.status === 'sent' ? ' selected' : '') + '>Sent</option>' +
                '<option value="paid"' + (invoice.status === 'paid' ? ' selected' : '') + '>Paid</option>' +
                '<option value="overdue"' + (invoice.status === 'overdue' ? ' selected' : '') + '>Overdue</option>' +
                '<option value="cancelled"' + (invoice.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-actions">' +
              '<button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>' +
              '<button type="submit" class="btn btn-primary">Save Changes</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.invoice-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#cancelEditBtn').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    // Calculate total when subtotal or GST changes
    var subtotalInput = modal.querySelector('#editSubtotal');
    var gstInput = modal.querySelector('#editGST');
    var totalInput = modal.querySelector('#editTotal');

    function updateTotal() {
      var subtotal = parseFloat(subtotalInput.value) || 0;
      var gst = parseFloat(gstInput.value) || 0;
      totalInput.value = (subtotal + gst).toFixed(2);
    }

    // PERFORMANCE: Debounce function to limit calculation frequency
    var debounceTimer;
    function debounce(func, delay) {
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          func.apply(context, args);
        }, delay);
      };
    }

    subtotalInput.oninput = debounce(function() {
      // Auto-calculate GST when subtotal changes
      var subtotal = parseFloat(subtotalInput.value) || 0;
      gstInput.value = (subtotal * 0.1).toFixed(2);
      updateTotal();
    }, 300);

    // GST field is read-only, no manual input allowed (BUG FIX #3)
    // GST is always calculated as 10% of subtotal for tax compliance

    // Form submission
    modal.querySelector('#editInvoiceForm').onsubmit = function(e) {
      e.preventDefault();

      // SECURITY: Validate inputs before processing
      var clientEmail = document.getElementById('editClientEmail').value;
      var clientPhone = document.getElementById('editClientPhone').value;
      var subtotalValue = document.getElementById('editSubtotal').value;
      var gstValue = document.getElementById('editGST').value;

      // Validate email if provided
      if (clientEmail && window.Security) {
        var emailValidation = window.Security.validateEmail(clientEmail);
        if (!emailValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Invalid email format: ' + emailValidation.error);
          }
          return;
        }
      }

      // Validate phone if provided
      if (clientPhone && window.Security) {
        var phoneValidation = window.Security.validatePhone(clientPhone);
        if (!phoneValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Invalid phone format: ' + phoneValidation.error);
          }
          return;
        }
      }

      // Validate currency fields
      if (window.Security) {
        var subtotalValidation = window.Security.validateCurrency(subtotalValue, 'Subtotal');
        if (!subtotalValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError(subtotalValidation.error);
          }
          return;
        }

        var gstValidation = window.Security.validateCurrency(gstValue, 'GST');
        if (!gstValidation.isValid) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError(gstValidation.error);
          }
          return;
        }
      }

      // Update invoice data
      invoice.clientName = document.getElementById('editClientName').value;
      invoice.clientLocation = document.getElementById('editClientLocation').value;
      invoice.clientEmail = document.getElementById('editClientEmail').value;
      invoice.clientPhone = document.getElementById('editClientPhone').value;
      invoice.invoiceDate = new Date(document.getElementById('editInvoiceDate').value).getTime();
      invoice.dueDate = new Date(document.getElementById('editDueDate').value).getTime();
      invoice.subtotal = parseFloat(document.getElementById('editSubtotal').value);
      invoice.gst = parseFloat(document.getElementById('editGST').value);

      // BUG FIX #3: Validate GST is exactly 10% of subtotal
      // This ensures tax compliance and prevents incorrect GST reporting
      var expectedGST = parseFloat((invoice.subtotal * 0.10).toFixed(2));
      var actualGST = parseFloat(invoice.gst.toFixed(2));
      if (Math.abs(actualGST - expectedGST) > 0.01) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('GST must be exactly 10% of subtotal. Expected: $' + expectedGST.toFixed(2) + ', but got: $' + actualGST.toFixed(2) + '. This ensures tax compliance.');
        }
        return;
      }

      invoice.total = parseFloat(document.getElementById('editTotal').value);
      invoice.quoteTitle = document.getElementById('editQuoteTitle').value;

      var newStatus = document.getElementById('editInvoiceStatus').value;
      if (newStatus !== invoice.status) {
        invoice.status = newStatus;
        invoice.statusHistory.push({
          status: newStatus,
          timestamp: Date.now(),
          note: 'Status changed via edit'
        });
      }

      // Recalculate balance
      invoice.balance = invoice.total - invoice.amountPaid;

      // Save changes
      saveInvoices();

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Invoice updated successfully');
      }

      // Close modal and refresh list
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
      renderInvoiceList();
    };

    return modal;
  }

  // Add "Invoices" button to UI
  function addInvoiceButton() {
    // Check if button already exists to prevent duplicates
    if (document.getElementById('manageInvoicesBtn')) {
      return;
    }

    // Add to summary panel instead of notes footer
    var summaryPanel = document.getElementById('summaryBody');
    if (!summaryPanel) return;

    // Create invoice action section
    var invoiceSection = document.createElement('div');
    invoiceSection.className = 'invoice-action-section';
    invoiceSection.innerHTML =
      '<div class="invoice-action-header">' +
        '<h3>Invoice Management</h3>' +
      '</div>' +
      '<div class="invoice-action-buttons">' +
        '<button type="button" id="manageInvoicesBtn" class="btn btn-primary">📄 Manage Invoices</button>' +
        '<button type="button" id="createInvoiceDirectBtn" class="btn btn-secondary">➕ Create Invoice</button>' +
      '</div>';

    // Add event listeners
    summaryPanel.appendChild(invoiceSection);

    document.getElementById('manageInvoicesBtn').onclick = showInvoiceList;
    document.getElementById('createInvoiceDirectBtn').onclick = function() {
      if (window.APP && window.APP.getState) {
        var state = window.APP.getState();
        if (!state.clientName) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Please enter client name before creating an invoice');
          }
          return;
        }
        convertQuoteToInvoice();
      }
    };
  }

  // Initialize
  function init() {
    loadSettings();
    initializeEncryption();
    loadInvoices();
    addInvoiceButton();

    // Check for overdue invoices daily
    checkOverdueInvoices();

    DEBUG.log('[INVOICE] Invoice manager initialized (' + invoices.length + ' invoices)');
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

  /**
   * Get current settings
   * Returns a copy of settings object to prevent external modifications
   * @returns {object} Copy of current settings
   */
  function getSettings() {
    // Return a copy to prevent external modifications
    var settingsCopy = {};
    for (var key in settings) {
      if (settings.hasOwnProperty(key)) {
        settingsCopy[key] = settings[key];
      }
    }
    return settingsCopy;
  }

  /**
   * Update settings programmatically
   * Merges provided settings with existing settings and saves
   * @param {object} newSettings - Settings to update
   * @returns {boolean} Success status
   */
  function updateSettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      console.error('[INVOICE] Invalid settings provided to updateSettings');
      return false;
    }

    var previousEncryptionSetting = settings.enableEncryption;

    // Merge new settings with existing settings
    for (var key in newSettings) {
      if (newSettings.hasOwnProperty(key) && settings.hasOwnProperty(key)) {
        settings[key] = newSettings[key];
      }
    }

    // Save updated settings
    var success = saveSettings();

    // Re-initialize encryption if the setting changed
    if (success && previousEncryptionSetting !== settings.enableEncryption) {
      initializeEncryption();
      console.log('[INVOICE] Encryption setting changed to:', settings.enableEncryption);
    }

    return success;
  }

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
    deleteInvoice: deleteInvoice,
    getStats: getInvoiceStats,
    showList: showInvoiceList,
    viewInvoice: viewInvoice,
    editInvoice: editInvoice,
    showPaymentModal: showRecordPaymentModal,
    changeStatus: changeInvoiceStatus,
    printInvoice: printInvoiceView,
    settings: settings,
    saveSettings: saveSettings,
    getSettings: getSettings,
    updateSettings: updateSettings
  };

  // Alias for backward compatibility and test compatibility
  window.InvoiceSystem = window.InvoiceManager;

})();
