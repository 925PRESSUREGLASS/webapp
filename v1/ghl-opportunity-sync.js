// ghl-opportunity-sync.js - GoHighLevel Opportunity Sync Module
// Syncs quotes and invoices to GHL as opportunities with line items
// Dependencies: ghl-client.js, app.js, invoice.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[GHL-OPP-SYNC] Skipped in test mode');
    return;
  }

  /**
   * Default pipeline configuration
   * These should be configured by the user to match their GHL pipelines
   */
  var PIPELINE_CONFIG = {
    quotePipelineId: '',
    quotePipelineStages: {
      draft: '',
      sent: '',
      accepted: '',
      declined: ''
    },
    invoicePipelineId: '',
    invoicePipelineStages: {
      draft: '',
      sent: '',
      paid: '',
      overdue: '',
      cancelled: ''
    }
  };

  /**
   * Load pipeline configuration from localStorage
   */
  function loadPipelineConfig() {
    try {
      var saved = localStorage.getItem('ghl_pipeline_config');
      if (saved) {
        var config = JSON.parse(saved);
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            PIPELINE_CONFIG[key] = config[key];
          }
        }
        console.log('[GHL-OPP-SYNC] Pipeline config loaded');
      }
    } catch (e) {
      console.error('[GHL-OPP-SYNC] Failed to load pipeline config:', e);
    }
  }

  /**
   * Save pipeline configuration to localStorage
   */
  function savePipelineConfig() {
    try {
      localStorage.setItem('ghl_pipeline_config', JSON.stringify(PIPELINE_CONFIG));
      console.log('[GHL-OPP-SYNC] Pipeline config saved');
    } catch (e) {
      console.error('[GHL-OPP-SYNC] Failed to save pipeline config:', e);
    }
  }

  /**
   * Update pipeline configuration
   */
  function updatePipelineConfig(updates) {
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        PIPELINE_CONFIG[key] = updates[key];
      }
    }
    savePipelineConfig();
  }

  /**
   * Get pipeline configuration
   */
  function getPipelineConfig() {
    return PIPELINE_CONFIG;
  }

  /**
   * Check if GHL is available and configured
   */
  function isGHLAvailable() {
    return window.GHLClient && window.GHLClient.isConfigured();
  }

  /**
   * Check if opportunity sync is enabled
   */
  function isOpportunitySyncEnabled() {
    if (!isGHLAvailable()) return false;

    var config = window.GHLClient.getConfig();
    return config.features && config.features.opportunitySync === true;
  }

  /**
   * Format quote/invoice line items as GHL note/description
   */
  function formatLineItems(quote) {
    var lines = [];

    lines.push('=== QUOTE DETAILS ===');
    lines.push('Quote Title: ' + (quote.quoteTitle || 'Untitled'));
    lines.push('Client: ' + (quote.clientName || 'Unknown'));
    lines.push('Location: ' + (quote.clientLocation || 'Unknown'));
    lines.push('Job Type: ' + (quote.jobType || 'Unknown'));
    lines.push('');

    // Window cleaning lines
    if (quote.windowLines && quote.windowLines.length > 0) {
      lines.push('=== WINDOW CLEANING ===');
      for (var i = 0; i < quote.windowLines.length; i++) {
        var line = quote.windowLines[i];
        var lineText = line.type + ' x' + line.quantity;
        if (line.highReach) {
          lineText += ' (High Reach)';
        }
        lineText += ' - $' + (line.subtotal || 0).toFixed(2);
        lines.push(lineText);
      }
      lines.push('');
    }

    // Pressure cleaning lines
    if (quote.pressureLines && quote.pressureLines.length > 0) {
      lines.push('=== PRESSURE CLEANING ===');
      for (var j = 0; j < quote.pressureLines.length; j++) {
        var pLine = quote.pressureLines[j];
        var pLineText = pLine.surface + ' - ' + pLine.area + ' ' + pLine.unit;
        pLineText += ' - $' + (pLine.subtotal || 0).toFixed(2);
        lines.push(pLineText);
      }
      lines.push('');
    }

    // Totals
    lines.push('=== PRICING ===');
    lines.push('Base Fee: $' + (quote.baseFee || 0).toFixed(2));
    lines.push('Subtotal: $' + (quote.subtotal || 0).toFixed(2));

    if (quote.gst !== undefined && quote.gst !== null) {
      lines.push('GST (10%): $' + quote.gst.toFixed(2));
    }

    lines.push('Total (Inc GST): $' + (quote.totalIncGst || 0).toFixed(2));
    lines.push('');

    // Notes
    if (quote.internalNotes) {
      lines.push('=== INTERNAL NOTES ===');
      lines.push(quote.internalNotes);
      lines.push('');
    }

    if (quote.clientNotes) {
      lines.push('=== CLIENT NOTES ===');
      lines.push(quote.clientNotes);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Create or update contact in GHL from quote client data
   */
  function syncClientToContact(quote, callback) {
    if (!isGHLAvailable()) {
      if (callback) callback(new Error('GHL not available'));
      return;
    }

    // Check if contact already exists (by ghlContactId)
    if (quote.ghlContactId) {
      console.log('[GHL-OPP-SYNC] Contact already exists:', quote.ghlContactId);
      if (callback) callback(null, { contact: { id: quote.ghlContactId } });
      return;
    }

    // Parse client name into first/last name
    var nameParts = (quote.clientName || 'Unknown Client').split(' ');
    var firstName = nameParts[0] || '';
    var lastName = nameParts.slice(1).join(' ') || '';

    // Parse client email (if available)
    var email = quote.clientEmail || '';
    var phone = quote.clientPhone || '';

    // Search for existing contact by email or phone
    if (email || phone) {
      var searchQuery = email || phone;
      window.GHLClient.searchContacts(searchQuery, function(searchError, searchResult) {
        if (!searchError && searchResult.contacts && searchResult.contacts.length > 0) {
          // Found existing contact
          var existingContact = searchResult.contacts[0];
          console.log('[GHL-OPP-SYNC] Found existing contact:', existingContact.id);

          // Store GHL contact ID in quote
          quote.ghlContactId = existingContact.id;

          if (callback) callback(null, { contact: existingContact });
        } else {
          // Create new contact
          createNewContact();
        }
      });
    } else {
      // No email or phone, create new contact
      createNewContact();
    }

    function createNewContact() {
      var contactData = {
        firstName: firstName,
        lastName: lastName,
        name: quote.clientName || 'Unknown Client',
        email: email,
        phone: phone,
        address: quote.clientLocation || '',
        source: 'TicTacStick Quote Engine',
        tags: ['TicTacStick', 'Quote']
      };

      console.log('[GHL-OPP-SYNC] Creating new contact...');

      window.GHLClient.createContact(contactData, function(error, response) {
        if (error) {
          console.error('[GHL-OPP-SYNC] Failed to create contact:', error);
          if (callback) callback(error);
          return;
        }

        console.log('[GHL-OPP-SYNC] Contact created:', response.contact.id);

        // Store GHL contact ID in quote
        quote.ghlContactId = response.contact.id;

        if (callback) callback(null, response);
      });
    }
  }

  /**
   * Map quote status to pipeline stage
   */
  function getQuotePipelineStage(status) {
    var stages = PIPELINE_CONFIG.quotePipelineStages;

    switch (status) {
      case 'draft':
        return stages.draft;
      case 'sent':
        return stages.sent;
      case 'accepted':
        return stages.accepted;
      case 'declined':
        return stages.declined;
      default:
        return stages.draft;
    }
  }

  /**
   * Map invoice status to pipeline stage
   */
  function getInvoicePipelineStage(status) {
    var stages = PIPELINE_CONFIG.invoicePipelineStages;

    switch (status) {
      case 'draft':
        return stages.draft;
      case 'sent':
        return stages.sent;
      case 'paid':
        return stages.paid;
      case 'overdue':
        return stages.overdue;
      case 'cancelled':
        return stages.cancelled;
      default:
        return stages.draft;
    }
  }

  /**
   * Sync quote to GHL as opportunity
   */
  function syncQuoteToOpportunity(quote, callback) {
    if (!isOpportunitySyncEnabled()) {
      var error = new Error('Opportunity sync disabled');
      console.log('[GHL-OPP-SYNC]', error.message);
      if (callback) callback(error);
      return;
    }

    if (!PIPELINE_CONFIG.quotePipelineId) {
      var pipelineError = new Error('Quote pipeline not configured');
      console.error('[GHL-OPP-SYNC]', pipelineError.message);
      if (callback) callback(pipelineError);
      return;
    }

    console.log('[GHL-OPP-SYNC] Syncing quote to GHL:', quote.quoteTitle || 'Untitled');

    // Step 1: Sync client to contact
    syncClientToContact(quote, function(contactError, contactResult) {
      if (contactError) {
        console.error('[GHL-OPP-SYNC] Failed to sync contact:', contactError);
        if (callback) callback(contactError);
        return;
      }

      var contactId = contactResult.contact.id;

      // Step 2: Create or update opportunity
      if (quote.ghlOpportunityId) {
        // Update existing opportunity
        updateExistingOpportunity(quote, contactId, callback);
      } else {
        // Create new opportunity
        createNewOpportunity(quote, contactId, callback);
      }
    });
  }

  /**
   * Create new opportunity from quote
   */
  function createNewOpportunity(quote, contactId, callback) {
    var oppName = (quote.quoteTitle || 'Quote') + ' - ' + (quote.clientName || 'Unknown');
    var pipelineStage = getQuotePipelineStage(quote.status || 'draft');

    var opportunityData = {
      name: oppName,
      pipelineId: PIPELINE_CONFIG.quotePipelineId,
      pipelineStageId: pipelineStage,
      status: 'open',
      contactId: contactId,
      monetaryValue: Math.round((quote.totalIncGst || 0) * 100), // Convert to cents
      source: 'TicTacStick',
      notes: formatLineItems(quote)
    };

    console.log('[GHL-OPP-SYNC] Creating new opportunity...');

    window.GHLClient.createOpportunity(opportunityData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to create opportunity:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity created:', response.opportunity.id);

      // Store GHL opportunity ID in quote
      quote.ghlOpportunityId = response.opportunity.id;
      quote.ghlSyncStatus = 'synced';
      quote.ghlLastSync = new Date().toISOString();

      // Save quote if using quote-workflow system
      if (window.QuoteWorkflow && window.QuoteWorkflow.saveQuote) {
        window.QuoteWorkflow.saveQuote(quote);
      }

      if (callback) callback(null, response);
    });
  }

  /**
   * Update existing opportunity
   */
  function updateExistingOpportunity(quote, contactId, callback) {
    var pipelineStage = getQuotePipelineStage(quote.status || 'draft');

    var updates = {
      name: (quote.quoteTitle || 'Quote') + ' - ' + (quote.clientName || 'Unknown'),
      pipelineStageId: pipelineStage,
      monetaryValue: Math.round((quote.totalIncGst || 0) * 100), // Convert to cents
      notes: formatLineItems(quote)
    };

    console.log('[GHL-OPP-SYNC] Updating opportunity:', quote.ghlOpportunityId);

    window.GHLClient.updateOpportunity(quote.ghlOpportunityId, updates, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to update opportunity:', error);

        // Mark sync as failed
        quote.ghlSyncStatus = 'failed';

        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity updated:', quote.ghlOpportunityId);

      // Update sync status
      quote.ghlSyncStatus = 'synced';
      quote.ghlLastSync = new Date().toISOString();

      // Save quote if using quote-workflow system
      if (window.QuoteWorkflow && window.QuoteWorkflow.saveQuote) {
        window.QuoteWorkflow.saveQuote(quote);
      }

      if (callback) callback(null, response);
    });
  }

  /**
   * Sync invoice to GHL as opportunity
   */
  function syncInvoiceToOpportunity(invoice, callback) {
    if (!isOpportunitySyncEnabled()) {
      var error = new Error('Opportunity sync disabled');
      console.log('[GHL-OPP-SYNC]', error.message);
      if (callback) callback(error);
      return;
    }

    if (!PIPELINE_CONFIG.invoicePipelineId) {
      var pipelineError = new Error('Invoice pipeline not configured');
      console.error('[GHL-OPP-SYNC]', pipelineError.message);
      if (callback) callback(pipelineError);
      return;
    }

    console.log('[GHL-OPP-SYNC] Syncing invoice to GHL:', invoice.invoiceNumber || 'Untitled');

    // Step 1: Sync client to contact
    var quoteData = {
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      clientLocation: invoice.clientAddress,
      ghlContactId: invoice.ghlContactId
    };

    syncClientToContact(quoteData, function(contactError, contactResult) {
      if (contactError) {
        console.error('[GHL-OPP-SYNC] Failed to sync contact:', contactError);
        if (callback) callback(contactError);
        return;
      }

      var contactId = contactResult.contact.id;

      // Update invoice with contact ID
      invoice.ghlContactId = contactId;

      // Step 2: Create or update opportunity
      if (invoice.ghlOpportunityId) {
        // Update existing opportunity
        updateExistingInvoiceOpportunity(invoice, contactId, callback);
      } else {
        // Create new opportunity
        createNewInvoiceOpportunity(invoice, contactId, callback);
      }
    });
  }

  /**
   * Create new opportunity from invoice
   */
  function createNewInvoiceOpportunity(invoice, contactId, callback) {
    var oppName = 'Invoice ' + (invoice.invoiceNumber || 'Unknown') + ' - ' + (invoice.clientName || 'Unknown');
    var pipelineStage = getInvoicePipelineStage(invoice.status || 'draft');

    var opportunityData = {
      name: oppName,
      pipelineId: PIPELINE_CONFIG.invoicePipelineId,
      pipelineStageId: pipelineStage,
      status: invoice.status === 'paid' ? 'won' : 'open',
      contactId: contactId,
      monetaryValue: Math.round((invoice.totalIncGst || 0) * 100), // Convert to cents
      source: 'TicTacStick',
      notes: formatInvoiceDetails(invoice)
    };

    console.log('[GHL-OPP-SYNC] Creating new invoice opportunity...');

    window.GHLClient.createOpportunity(opportunityData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to create invoice opportunity:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Invoice opportunity created:', response.opportunity.id);

      // Store GHL opportunity ID in invoice
      invoice.ghlOpportunityId = response.opportunity.id;
      invoice.ghlSyncStatus = 'synced';
      invoice.ghlLastSync = new Date().toISOString();

      // Save invoice
      if (window.InvoiceSystem && window.InvoiceSystem.saveInvoice) {
        window.InvoiceSystem.saveInvoice(invoice);
      }

      if (callback) callback(null, response);
    });
  }

  /**
   * Update existing invoice opportunity
   */
  function updateExistingInvoiceOpportunity(invoice, contactId, callback) {
    var pipelineStage = getInvoicePipelineStage(invoice.status || 'draft');

    var updates = {
      name: 'Invoice ' + (invoice.invoiceNumber || 'Unknown') + ' - ' + (invoice.clientName || 'Unknown'),
      pipelineStageId: pipelineStage,
      status: invoice.status === 'paid' ? 'won' : 'open',
      monetaryValue: Math.round((invoice.totalIncGst || 0) * 100), // Convert to cents
      notes: formatInvoiceDetails(invoice)
    };

    console.log('[GHL-OPP-SYNC] Updating invoice opportunity:', invoice.ghlOpportunityId);

    window.GHLClient.updateOpportunity(invoice.ghlOpportunityId, updates, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to update invoice opportunity:', error);

        // Mark sync as failed
        invoice.ghlSyncStatus = 'failed';

        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Invoice opportunity updated:', invoice.ghlOpportunityId);

      // Update sync status
      invoice.ghlSyncStatus = 'synced';
      invoice.ghlLastSync = new Date().toISOString();

      // Save invoice
      if (window.InvoiceSystem && window.InvoiceSystem.saveInvoice) {
        window.InvoiceSystem.saveInvoice(invoice);
      }

      if (callback) callback(null, response);
    });
  }

  /**
   * Format invoice details for GHL notes
   */
  function formatInvoiceDetails(invoice) {
    var lines = [];

    lines.push('=== INVOICE DETAILS ===');
    lines.push('Invoice Number: ' + (invoice.invoiceNumber || 'Unknown'));
    lines.push('Client: ' + (invoice.clientName || 'Unknown'));
    lines.push('Date Issued: ' + (invoice.dateIssued || new Date().toISOString().split('T')[0]));
    lines.push('Due Date: ' + (invoice.dueDate || 'Unknown'));
    lines.push('Status: ' + (invoice.status || 'Unknown'));
    lines.push('');

    // Line items (from quote)
    if (invoice.quote) {
      var quoteLines = formatLineItems(invoice.quote);
      lines.push(quoteLines);
    }

    // Payment history
    if (invoice.payments && invoice.payments.length > 0) {
      lines.push('=== PAYMENT HISTORY ===');
      for (var i = 0; i < invoice.payments.length; i++) {
        var payment = invoice.payments[i];
        var paymentLine = payment.date + ' - $' + payment.amount.toFixed(2);
        paymentLine += ' (' + payment.method + ')';
        lines.push(paymentLine);
      }
      lines.push('');
      lines.push('Amount Paid: $' + (invoice.amountPaid || 0).toFixed(2));
      lines.push('Balance Due: $' + ((invoice.totalIncGst || 0) - (invoice.amountPaid || 0)).toFixed(2));
    }

    return lines.join('\n');
  }

  /**
   * Sync current quote from app state
   */
  function syncCurrentQuote(callback) {
    if (!window.APP || !window.APP.getState) {
      var error = new Error('APP not available');
      console.error('[GHL-OPP-SYNC]', error.message);
      if (callback) callback(error);
      return;
    }

    var state = window.APP.getState();

    // Add default status if not present
    if (!state.status) {
      state.status = 'draft';
    }

    syncQuoteToOpportunity(state, callback);
  }

  /**
   * Auto-sync on quote status change
   */
  function handleQuoteStatusChange(quote) {
    if (!isOpportunitySyncEnabled()) return;

    console.log('[GHL-OPP-SYNC] Quote status changed, auto-syncing...');

    syncQuoteToOpportunity(quote, function(error) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Auto-sync failed:', error);
        if (window.UIComponents) {
          window.UIComponents.showToast('Failed to sync to GHL: ' + error.message, 'error');
        }
      } else {
        console.log('[GHL-OPP-SYNC] Auto-sync successful');
        if (window.UIComponents) {
          window.UIComponents.showToast('Synced to GoHighLevel', 'success');
        }
      }
    });
  }

  /**
   * Auto-sync on invoice status change
   */
  function handleInvoiceStatusChange(invoice) {
    if (!isOpportunitySyncEnabled()) return;

    console.log('[GHL-OPP-SYNC] Invoice status changed, auto-syncing...');

    syncInvoiceToOpportunity(invoice, function(error) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Auto-sync failed:', error);
        if (window.UIComponents) {
          window.UIComponents.showToast('Failed to sync to GHL: ' + error.message, 'error');
        }
      } else {
        console.log('[GHL-OPP-SYNC] Auto-sync successful');
        if (window.UIComponents) {
          window.UIComponents.showToast('Synced to GoHighLevel', 'success');
        }
      }
    });
  }

  /**
   * Initialize opportunity sync
   */
  function init() {
    // Load pipeline config
    loadPipelineConfig();

    // Listen for quote/invoice status changes
    if (window.APP && window.APP.on) {
      window.APP.on('quote-status-changed', function(quote) {
        handleQuoteStatusChange(quote);
      });

      window.APP.on('invoice-status-changed', function(invoice) {
        handleInvoiceStatusChange(invoice);
      });
    }

    console.log('[GHL-OPP-SYNC] Initialized');
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var GHLOpportunitySync = {
    // Configuration
    loadPipelineConfig: loadPipelineConfig,
    savePipelineConfig: savePipelineConfig,
    updatePipelineConfig: updatePipelineConfig,
    getPipelineConfig: getPipelineConfig,

    // Status checks
    isGHLAvailable: isGHLAvailable,
    isOpportunitySyncEnabled: isOpportunitySyncEnabled,

    // Sync methods
    syncQuoteToOpportunity: syncQuoteToOpportunity,
    syncInvoiceToOpportunity: syncInvoiceToOpportunity,
    syncCurrentQuote: syncCurrentQuote,

    // Helpers
    syncClientToContact: syncClientToContact,
    formatLineItems: formatLineItems,
    formatInvoiceDetails: formatInvoiceDetails
  };

  // Make globally available
  window.GHLOpportunitySync = GHLOpportunitySync;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlOpportunitySync', GHLOpportunitySync);
  }

  console.log('[GHL-OPP-SYNC] Module loaded');
})();
