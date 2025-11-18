// invoice-manager.js - Invoice Management and Payment Tracking
// Dependencies: payment-config.js, storage.js, security.js
// iOS Safari 12+ compatible (ES5 syntax only)

(function() {
  'use strict';

  var STORAGE_KEY = 'tts_invoices';
  var RECEIPTS_KEY = 'tts_receipts';

  /**
   * Create new invoice object
   */
  function createInvoice(config) {
    var invoiceNumber = window.PaymentConfig.getNextInvoiceNumber();
    var now = new Date().toISOString();

    return {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: invoiceNumber,
      quoteId: config.quoteId || null,
      clientId: config.clientId || null,

      // Invoice details
      status: config.status || 'draft', // draft, sent, paid, overdue, cancelled, refunded, partially-paid
      type: config.type || 'full', // full, deposit, progress, final

      // Amounts (store in cents to avoid floating point errors)
      subtotal: config.subtotal || 0,
      gst: config.gst || 0,
      total: config.total || 0,
      amountPaid: 0,
      amountDue: config.total || 0,

      // Dates
      dateCreated: now,
      dateIssued: config.dateIssued || null,
      dateDue: config.dateDue || null,
      datePaid: null,

      // Line items
      items: config.items || [],

      // Payment info
      payments: [],
      paymentMethod: null,
      paymentLink: null,

      // Client info (snapshot at time of invoice creation)
      client: config.client || {},

      // Notes
      notes: config.notes || '',
      internalNotes: config.internalNotes || '',

      // Links
      pdfUrl: null,

      // Metadata
      createdBy: config.createdBy || 'system',
      lastModified: now
    };
  }

  /**
   * Create invoice from quote
   */
  function createFromQuote(quote, invoiceType) {
    invoiceType = invoiceType || 'full';

    // Calculate amounts
    var subtotal = quote.subtotal || (quote.total / 1.1);
    var gst = quote.gst || (quote.total - subtotal);
    var total = quote.total || 0;

    // Adjust amounts for deposit invoices
    if (invoiceType === 'deposit') {
      var depositAmount = window.PaymentConfig.calculateDepositAmount(total);
      total = depositAmount;
      subtotal = depositAmount / 1.1;
      gst = depositAmount - subtotal;
    }

    // Calculate due date
    var dueDate = window.PaymentConfig.calculateDueDate();

    // Build invoice
    var invoice = createInvoice({
      quoteId: quote.id,
      clientId: quote.client ? quote.client.id : null,
      type: invoiceType,
      status: 'draft',
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      dateDue: dueDate,
      items: quote.items || [],
      client: {
        name: quote.client ? quote.client.name : '',
        email: quote.client ? quote.client.email : '',
        phone: quote.client ? quote.client.phone : '',
        address: quote.client ? quote.client.address : '',
        ghlId: quote.client ? quote.client.ghlId : null
      },
      notes: invoiceType === 'deposit' ?
        'Deposit payment (' + window.PaymentConfig.getConfig().options.depositPercentage + '% of total)' :
        window.PaymentConfig.getConfig().options.paymentTerms
    });

    // Save invoice
    saveInvoice(invoice);

    console.log('[INVOICE-MANAGER] Invoice created from quote:', invoice.invoiceNumber);

    return invoice;
  }

  /**
   * Get all invoices
   */
  function getAllInvoices() {
    try {
      var invoices = localStorage.getItem(STORAGE_KEY);
      return invoices ? JSON.parse(invoices) : [];
    } catch (e) {
      console.error('[INVOICE-MANAGER] Failed to load invoices:', e);
      return [];
    }
  }

  /**
   * Save all invoices
   */
  function saveInvoices(invoices) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      return true;
    } catch (e) {
      console.error('[INVOICE-MANAGER] Failed to save invoices:', e);
      return false;
    }
  }

  /**
   * Get invoice by ID
   */
  function getInvoice(invoiceId) {
    var invoices = getAllInvoices();
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].id === invoiceId) {
        return invoices[i];
      }
    }
    return null;
  }

  /**
   * Get invoice by number
   */
  function getInvoiceByNumber(invoiceNumber) {
    var invoices = getAllInvoices();
    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].invoiceNumber === invoiceNumber) {
        return invoices[i];
      }
    }
    return null;
  }

  /**
   * Save invoice
   */
  function saveInvoice(invoice) {
    var invoices = getAllInvoices();
    var updated = false;

    invoice.lastModified = new Date().toISOString();

    for (var i = 0; i < invoices.length; i++) {
      if (invoices[i].id === invoice.id) {
        invoices[i] = invoice;
        updated = true;
        break;
      }
    }

    if (!updated) {
      invoices.push(invoice);
    }

    var success = saveInvoices(invoices);

    if (success) {
      console.log('[INVOICE-MANAGER] Invoice saved:', invoice.invoiceNumber);
    }

    return success;
  }

  /**
   * Delete invoice
   */
  function deleteInvoice(invoiceId) {
    var invoices = getAllInvoices();
    var filtered = invoices.filter(function(inv) {
      return inv.id !== invoiceId;
    });

    if (filtered.length < invoices.length) {
      saveInvoices(filtered);
      console.log('[INVOICE-MANAGER] Invoice deleted:', invoiceId);
      return true;
    }

    return false;
  }

  /**
   * Update invoice status
   */
  function updateStatus(invoiceId, newStatus) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      console.error('[INVOICE-MANAGER] Invoice not found:', invoiceId);
      return false;
    }

    var oldStatus = invoice.status;
    invoice.status = newStatus;

    // Update related dates
    if (newStatus === 'sent' && !invoice.dateIssued) {
      invoice.dateIssued = new Date().toISOString();
    }

    if (newStatus === 'paid' && !invoice.datePaid) {
      invoice.datePaid = new Date().toISOString();
      invoice.amountDue = 0;
    }

    saveInvoice(invoice);

    console.log('[INVOICE-MANAGER] Status updated:', oldStatus, '→', newStatus);

    return true;
  }

  /**
   * Record payment
   */
  function recordPayment(invoiceId, paymentData) {
    var invoice = getInvoice(invoiceId);
    if (!invoice) {
      console.error('[INVOICE-MANAGER] Invoice not found');
      return null;
    }

    var payment = {
      id: 'pmt_' + Date.now(),
      amount: paymentData.amount || 0,
      method: paymentData.method || 'unknown',
      reference: paymentData.reference || '',
      transactionId: paymentData.transactionId || null,
      date: new Date().toISOString(),
      status: paymentData.status || 'completed',
      gateway: paymentData.gateway || null,
      notes: paymentData.notes || ''
    };

    // Add to payments array
    invoice.payments.push(payment);

    // Update amounts
    invoice.amountPaid = Math.round((invoice.amountPaid + payment.amount) * 100) / 100;
    invoice.amountDue = Math.round((invoice.total - invoice.amountPaid) * 100) / 100;

    // Update status based on payment
    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
      invoice.datePaid = payment.date;
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially-paid';
    }

    saveInvoice(invoice);

    console.log('[INVOICE-MANAGER] Payment recorded:', payment.amount, 'for invoice', invoice.invoiceNumber);

    // Generate receipt
    var receipt = generateReceipt(invoice, payment);

    // Send notification
    var config = window.PaymentConfig.getConfig();
    if (config.receipt.emailReceipts && invoice.client.email) {
      sendPaymentConfirmation(invoice, payment);
    }

    return payment;
  }

  /**
   * Generate receipt
   */
  function generateReceipt(invoice, payment) {
    var receiptNumber = window.PaymentConfig.getNextReceiptNumber();

    var receipt = {
      id: 'rct_' + Date.now(),
      receiptNumber: receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      payment: payment,
      client: invoice.client,
      dateIssued: new Date().toISOString()
    };

    // Save receipt
    var receipts = getReceipts();
    receipts.push(receipt);
    saveReceipts(receipts);

    console.log('[INVOICE-MANAGER] Receipt generated:', receiptNumber);

    return receipt;
  }

  /**
   * Get all receipts
   */
  function getReceipts() {
    try {
      var receipts = localStorage.getItem(RECEIPTS_KEY);
      return receipts ? JSON.parse(receipts) : [];
    } catch (e) {
      console.error('[INVOICE-MANAGER] Failed to load receipts:', e);
      return [];
    }
  }

  /**
   * Save receipts
   */
  function saveReceipts(receipts) {
    try {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (e) {
      console.error('[INVOICE-MANAGER] Failed to save receipts:', e);
    }
  }

  /**
   * Get receipt by ID
   */
  function getReceipt(receiptId) {
    var receipts = getReceipts();
    for (var i = 0; i < receipts.length; i++) {
      if (receipts[i].id === receiptId) {
        return receipts[i];
      }
    }
    return null;
  }

  /**
   * Send payment confirmation
   */
  function sendPaymentConfirmation(invoice, payment) {
    console.log('[INVOICE-MANAGER] Sending payment confirmation for:', invoice.invoiceNumber);

    // Integration with CommunicationManager if available
    if (window.CommunicationManager && invoice.client.ghlId) {
      var emailBody = generatePaymentConfirmationEmail(invoice, payment);

      window.CommunicationManager.sendEmail(
        invoice.client.ghlId,
        'Payment Received - ' + invoice.invoiceNumber,
        emailBody,
        function(error) {
          if (error) {
            console.error('[INVOICE-MANAGER] Failed to send payment confirmation:', error);
          } else {
            console.log('[INVOICE-MANAGER] Payment confirmation sent');
          }
        }
      );
    }
  }

  /**
   * Generate payment confirmation email
   */
  function generatePaymentConfirmationEmail(invoice, payment) {
    var html = '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;">';
    html += '<div style="max-width: 600px; margin: 0 auto; padding: 20px;">';
    html += '<div style="background: #10b981; color: white; padding: 20px; text-align: center;">';
    html += '<h1>✓ Payment Received</h1></div>';
    html += '<div style="padding: 20px; background: #f9fafb; margin-top: 20px;">';
    html += '<h2>Thank you for your payment!</h2>';
    html += '<p>We have received your payment of <strong>$' + payment.amount.toFixed(2) + '</strong>.</p>';
    html += '<div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">';
    html += '<h3>Payment Details</h3>';
    html += '<p><strong>Invoice #:</strong> ' + invoice.invoiceNumber + '</p>';
    html += '<p><strong>Amount Paid:</strong> $' + payment.amount.toFixed(2) + '</p>';
    html += '<p><strong>Payment Method:</strong> ' + payment.method + '</p>';
    html += '<p><strong>Date:</strong> ' + new Date(payment.date).toLocaleString() + '</p>';
    if (invoice.amountDue > 0) {
      html += '<p><strong>Remaining Balance:</strong> $' + invoice.amountDue.toFixed(2) + '</p>';
    }
    html += '</div>';
    html += '<p>Thank you for your business!</p>';
    html += '<p>Best regards,<br>925 Pressure Glass</p>';
    html += '</div></div></body></html>';

    return html;
  }

  /**
   * Get invoices for quote
   */
  function getInvoicesForQuote(quoteId) {
    var invoices = getAllInvoices();
    return invoices.filter(function(inv) {
      return inv.quoteId === quoteId;
    });
  }

  /**
   * Get invoices for client
   */
  function getInvoicesForClient(clientId) {
    var invoices = getAllInvoices();
    return invoices.filter(function(inv) {
      return inv.clientId === clientId;
    });
  }

  /**
   * Get outstanding invoices
   */
  function getOutstandingInvoices() {
    var invoices = getAllInvoices();
    return invoices.filter(function(inv) {
      return inv.status === 'sent' ||
             inv.status === 'overdue' ||
             inv.status === 'partially-paid';
    });
  }

  /**
   * Get overdue invoices
   */
  function getOverdueInvoices() {
    var invoices = getAllInvoices();
    var now = new Date();

    return invoices.filter(function(inv) {
      if (inv.status !== 'sent' && inv.status !== 'partially-paid') {
        return false;
      }

      if (!inv.dateDue) {
        return false;
      }

      var dueDate = new Date(inv.dateDue);
      return dueDate < now;
    });
  }

  /**
   * Check and update overdue invoices
   */
  function checkOverdueInvoices() {
    var invoices = getAllInvoices();
    var now = new Date();
    var updated = 0;

    for (var i = 0; i < invoices.length; i++) {
      var invoice = invoices[i];

      if ((invoice.status === 'sent' || invoice.status === 'partially-paid') && invoice.dateDue) {
        var dueDate = new Date(invoice.dateDue);

        if (dueDate < now && invoice.status !== 'overdue') {
          invoice.status = 'overdue';
          updated++;

          // Send overdue reminder
          sendOverdueReminder(invoice);
        }
      }
    }

    if (updated > 0) {
      saveInvoices(invoices);
      console.log('[INVOICE-MANAGER] Updated', updated, 'invoices to overdue status');
    }

    return updated;
  }

  /**
   * Send overdue reminder
   */
  function sendOverdueReminder(invoice) {
    var config = window.PaymentConfig.getConfig();
    if (!config.reminders.enabled) {
      return;
    }

    console.log('[INVOICE-MANAGER] Sending overdue reminder for:', invoice.invoiceNumber);

    // Create task for follow-up
    if (window.TaskManager) {
      window.TaskManager.createTask({
        quoteId: invoice.quoteId,
        clientId: invoice.clientId,
        type: 'payment-reminder',
        priority: 'high',
        title: 'Payment Overdue - ' + invoice.invoiceNumber,
        description: 'Follow up on overdue invoice of $' + invoice.amountDue.toFixed(2),
        dueDate: new Date().toISOString()
      });
    }
  }

  /**
   * Get payment summary statistics
   */
  function getPaymentSummary() {
    var invoices = getAllInvoices();

    var summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      invoiceCount: invoices.length,
      paidCount: 0,
      overdueCount: 0,
      draftCount: 0
    };

    for (var i = 0; i < invoices.length; i++) {
      var invoice = invoices[i];

      if (invoice.status !== 'draft' && invoice.status !== 'cancelled') {
        summary.totalInvoiced += invoice.total;
        summary.totalPaid += invoice.amountPaid;
        summary.totalOutstanding += invoice.amountDue;
      }

      if (invoice.status === 'paid') {
        summary.paidCount++;
      }

      if (invoice.status === 'overdue') {
        summary.overdueCount++;
        summary.totalOverdue += invoice.amountDue;
      }

      if (invoice.status === 'draft') {
        summary.draftCount++;
      }
    }

    // Round to 2 decimals
    summary.totalInvoiced = Math.round(summary.totalInvoiced * 100) / 100;
    summary.totalPaid = Math.round(summary.totalPaid * 100) / 100;
    summary.totalOutstanding = Math.round(summary.totalOutstanding * 100) / 100;
    summary.totalOverdue = Math.round(summary.totalOverdue * 100) / 100;

    return summary;
  }

  /**
   * Search invoices
   */
  function searchInvoices(query) {
    if (!query) return getAllInvoices();

    var invoices = getAllInvoices();
    var lowerQuery = query.toLowerCase();

    return invoices.filter(function(inv) {
      return (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().indexOf(lowerQuery) !== -1) ||
             (inv.client.name && inv.client.name.toLowerCase().indexOf(lowerQuery) !== -1) ||
             (inv.client.email && inv.client.email.toLowerCase().indexOf(lowerQuery) !== -1) ||
             (inv.notes && inv.notes.toLowerCase().indexOf(lowerQuery) !== -1);
    });
  }

  /**
   * Filter invoices by status
   */
  function filterByStatus(status) {
    if (status === 'all') return getAllInvoices();

    var invoices = getAllInvoices();
    return invoices.filter(function(inv) {
      return inv.status === status;
    });
  }

  // Initialize - schedule periodic overdue check
  function init() {
    // Check overdue invoices every hour
    setInterval(function() {
      checkOverdueInvoices();
    }, 3600000);

    console.log('[INVOICE-MANAGER] Initialized');
  }

  // Public API
  var InvoiceManager = {
    createInvoice: createInvoice,
    createFromQuote: createFromQuote,
    getInvoice: getInvoice,
    getInvoiceByNumber: getInvoiceByNumber,
    getAllInvoices: getAllInvoices,
    saveInvoice: saveInvoice,
    deleteInvoice: deleteInvoice,
    updateStatus: updateStatus,
    recordPayment: recordPayment,
    getReceipt: getReceipt,
    getReceipts: getReceipts,
    getInvoicesForQuote: getInvoicesForQuote,
    getInvoicesForClient: getInvoicesForClient,
    getOutstandingInvoices: getOutstandingInvoices,
    getOverdueInvoices: getOverdueInvoices,
    checkOverdueInvoices: checkOverdueInvoices,
    getPaymentSummary: getPaymentSummary,
    searchInvoices: searchInvoices,
    filterByStatus: filterByStatus,
    init: init
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('invoiceManager', InvoiceManager);
  }

  // Make globally available
  window.InvoiceManager = InvoiceManager;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[INVOICE-MANAGER] Module loaded');
})();
