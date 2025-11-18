// contract-automation.js - Contract automation for reminders and renewals
// Dependencies: contract-manager.js, followup-automation.js (if available)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var automationInterval = null;
  var CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

  /**
   * Initialize contract automation
   */
  function init() {
    console.log('[CONTRACT-AUTOMATION] Initializing...');

    // Run initial check
    runAutomationChecks();

    // Set up interval for periodic checks
    startAutomation();

    console.log('[CONTRACT-AUTOMATION] Initialized');
  }

  /**
   * Start automation interval
   */
  function startAutomation() {
    if (automationInterval) {
      clearInterval(automationInterval);
    }

    automationInterval = setInterval(function() {
      runAutomationChecks();
    }, CHECK_INTERVAL);

    console.log('[CONTRACT-AUTOMATION] Auto-check started (every hour)');
  }

  /**
   * Stop automation interval
   */
  function stopAutomation() {
    if (automationInterval) {
      clearInterval(automationInterval);
      automationInterval = null;
      console.log('[CONTRACT-AUTOMATION] Auto-check stopped');
    }
  }

  /**
   * Run all automation checks
   */
  function runAutomationChecks() {
    console.log('[CONTRACT-AUTOMATION] Running automation checks...');

    var results = {
      remindersSent: 0,
      quotesGenerated: 0,
      contractsRenewed: 0,
      warnings: []
    };

    // Send service reminders
    results.remindersSent = sendServiceReminders();

    // Auto-generate quotes for upcoming services
    results.quotesGenerated = autoGenerateQuotes();

    // Check for expiring contracts
    results.warnings = checkExpiringContracts();

    // Auto-renew contracts
    results.contractsRenewed = autoRenewContracts();

    console.log('[CONTRACT-AUTOMATION] Checks complete:', results);
    return results;
  }

  /**
   * Send service reminders
   */
  function sendServiceReminders() {
    var upcoming = window.ContractManager.getUpcomingServices(7); // Next 7 days
    var remindersSent = 0;

    for (var i = 0; i < upcoming.length; i++) {
      var item = upcoming[i];
      var contract = item.contract;

      // Send reminder 3 days before if not sent yet
      if (item.daysUntil <= 3 && !contract.nextService.reminderSent) {
        var sent = sendServiceReminder(contract);
        if (sent) {
          contract.nextService.reminderSent = true;
          window.ContractManager.saveContract(contract);
          remindersSent++;
        }
      }
    }

    if (remindersSent > 0) {
      console.log('[CONTRACT-AUTOMATION] Sent ' + remindersSent + ' service reminders');
    }

    return remindersSent;
  }

  /**
   * Send individual service reminder
   */
  function sendServiceReminder(contract) {
    if (!contract.nextService || !contract.nextService.scheduledDate) {
      return false;
    }

    var serviceDate = new Date(contract.nextService.scheduledDate);
    var dateStr = serviceDate.toLocaleDateString();

    var message = 'Hi ' + contract.client.name + ', ' +
      'your scheduled ' + contract.category + ' service is coming up on ' + dateStr + '. ' +
      'Please confirm or let us know if you need to reschedule.';

    // Send via CommunicationManager if available
    if (window.CommunicationManager) {
      try {
        window.CommunicationManager.sendMessage({
          clientId: contract.client.id,
          type: 'sms',
          subject: 'Service Reminder',
          message: message,
          contractId: contract.id
        });
        return true;
      } catch (e) {
        console.error('[CONTRACT-AUTOMATION] Failed to send reminder:', e);
        return false;
      }
    }

    // If FollowupAutomation is available, create a task
    if (window.TaskManager) {
      try {
        window.TaskManager.createTask({
          quoteId: null,
          clientId: contract.client.id,
          type: 'phone-call',
          priority: 'normal',
          title: 'Service Reminder - ' + contract.contractNumber,
          description: 'Call to remind about upcoming service on ' + dateStr,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          followUpMessage: message
        });
        return true;
      } catch (e) {
        console.error('[CONTRACT-AUTOMATION] Failed to create reminder task:', e);
        return false;
      }
    }

    console.log('[CONTRACT-AUTOMATION] Reminder needed for:', contract.contractNumber);
    return false;
  }

  /**
   * Auto-generate quotes for upcoming services
   */
  function autoGenerateQuotes() {
    var upcoming = window.ContractManager.getUpcomingServices(7); // Next 7 days
    var quotesGenerated = 0;

    for (var i = 0; i < upcoming.length; i++) {
      var item = upcoming[i];
      var contract = item.contract;

      // Generate quote 5 days before if not generated yet
      if (item.daysUntil <= 5 && !item.quoteGenerated) {
        var quote = generateQuoteForContract(contract);
        if (quote) {
          contract.nextService.quoteGenerated = true;
          contract.nextService.quoteId = quote.id;
          window.ContractManager.saveContract(contract);
          quotesGenerated++;
        }
      }
    }

    if (quotesGenerated > 0) {
      console.log('[CONTRACT-AUTOMATION] Generated ' + quotesGenerated + ' quotes');
    }

    return quotesGenerated;
  }

  /**
   * Generate quote for contract
   */
  function generateQuoteForContract(contract) {
    try {
      // Create quote object
      var quote = {
        id: 'quote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        createdDate: new Date().toISOString(),
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        isRecurring: true,

        // Client info
        clientName: contract.client.name,
        clientEmail: contract.client.email,
        clientPhone: contract.client.phone,
        clientLocation: contract.client.address,

        // Quote details
        quoteTitle: 'Service Quote - ' + contract.contractNumber,
        scheduledDate: contract.nextService.scheduledDate,

        // Line items from contract services
        items: contract.services.map(function(service) {
          return {
            description: service.description,
            specifications: service.specifications,
            quantity: service.quantity,
            unitPrice: service.unitPrice,
            total: service.quantity * service.unitPrice
          };
        }),

        // Pricing
        subtotal: contract.pricing.subtotal,
        gst: contract.pricing.gst,
        total: contract.pricing.total,

        // Notes
        notes: 'Part of ' + contract.type + ' maintenance contract',
        internalNotes: 'Auto-generated from contract ' + contract.contractNumber
      };

      // Save quote (using existing quote storage if available)
      if (window.StorageManager && window.StorageManager.saveQuote) {
        var savedQuote = window.StorageManager.saveQuote(quote);
        console.log('[CONTRACT-AUTOMATION] Quote generated:', savedQuote.id);
        return savedQuote;
      } else {
        // Save to localStorage directly
        var quotes = JSON.parse(localStorage.getItem('tts_contract_quotes') || '[]');
        quotes.push(quote);
        localStorage.setItem('tts_contract_quotes', JSON.stringify(quotes));
        console.log('[CONTRACT-AUTOMATION] Quote generated:', quote.id);
        return quote;
      }
    } catch (e) {
      console.error('[CONTRACT-AUTOMATION] Failed to generate quote:', e);
      return null;
    }
  }

  /**
   * Check for expiring contracts
   */
  function checkExpiringContracts() {
    var contracts = window.ContractManager.getContractsByStatus('active');
    var warnings = [];

    var now = new Date();
    var warningThreshold = 30; // 30 days notice

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (!contract.terms.endDate) continue; // Ongoing contract

      var endDate = new Date(contract.terms.endDate);
      var daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd > 0 && daysUntilEnd <= warningThreshold) {
        warnings.push({
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          clientName: contract.client.name,
          endDate: contract.terms.endDate,
          daysUntilEnd: daysUntilEnd,
          autoRenew: contract.terms.autoRenew
        });

        // Send expiring contract notification
        sendExpiringContractNotification(contract, daysUntilEnd);
      }
    }

    if (warnings.length > 0) {
      console.log('[CONTRACT-AUTOMATION] ' + warnings.length + ' contracts expiring soon');
    }

    return warnings;
  }

  /**
   * Send expiring contract notification
   */
  function sendExpiringContractNotification(contract, daysUntilEnd) {
    var message = 'Your maintenance contract ' + contract.contractNumber +
      ' is expiring in ' + daysUntilEnd + ' days. ';

    if (contract.terms.autoRenew) {
      message += 'It will automatically renew unless you notify us.';
    } else {
      message += 'Please let us know if you would like to renew.';
    }

    // Create task for follow-up
    if (window.TaskManager) {
      try {
        window.TaskManager.createTask({
          clientId: contract.client.id,
          type: 'phone-call',
          priority: 'high',
          title: 'Contract Renewal - ' + contract.contractNumber,
          description: 'Discuss contract renewal with client',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          followUpMessage: message
        });
      } catch (e) {
        console.error('[CONTRACT-AUTOMATION] Failed to create renewal task:', e);
      }
    }

    console.log('[CONTRACT-AUTOMATION] Expiring contract notification sent:', contract.contractNumber);
  }

  /**
   * Auto-renew contracts
   */
  function autoRenewContracts() {
    var contracts = window.ContractManager.getContractsByStatus('active');
    var renewed = 0;

    var now = new Date();

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (!contract.terms.autoRenew || !contract.terms.endDate) continue;

      var endDate = new Date(contract.terms.endDate);

      // Renew on the end date
      if (now >= endDate) {
        var success = renewContract(contract);
        if (success) {
          renewed++;
        }
      }
    }

    if (renewed > 0) {
      console.log('[CONTRACT-AUTOMATION] Renewed ' + renewed + ' contracts');
    }

    return renewed;
  }

  /**
   * Renew contract
   */
  function renewContract(contract) {
    try {
      // Calculate new end date
      var newEndDate = new Date(contract.terms.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + contract.terms.duration);

      // Update contract
      contract.terms.endDate = newEndDate.toISOString();

      // Add renewal note
      if (!contract.renewalHistory) {
        contract.renewalHistory = [];
      }

      contract.renewalHistory.push({
        date: new Date().toISOString(),
        previousEndDate: contract.terms.endDate,
        newEndDate: newEndDate.toISOString(),
        automatic: true
      });

      window.ContractManager.saveContract(contract);

      console.log('[CONTRACT-AUTOMATION] Contract renewed:', contract.contractNumber);

      // Send renewal confirmation
      sendRenewalConfirmation(contract);

      return true;
    } catch (e) {
      console.error('[CONTRACT-AUTOMATION] Failed to renew contract:', e);
      return false;
    }
  }

  /**
   * Send renewal confirmation
   */
  function sendRenewalConfirmation(contract) {
    var message = 'Your maintenance contract ' + contract.contractNumber +
      ' has been automatically renewed. ' +
      'New end date: ' + new Date(contract.terms.endDate).toLocaleDateString() + '.';

    // Send via CommunicationManager if available
    if (window.CommunicationManager) {
      try {
        window.CommunicationManager.sendMessage({
          clientId: contract.client.id,
          type: 'email',
          subject: 'Contract Renewed - ' + contract.contractNumber,
          message: message,
          contractId: contract.id
        });
      } catch (e) {
        console.error('[CONTRACT-AUTOMATION] Failed to send renewal confirmation:', e);
      }
    }

    console.log('[CONTRACT-AUTOMATION] Renewal confirmation sent:', contract.contractNumber);
  }

  /**
   * Process service completion
   * Called after a service is completed to update contract
   */
  function processServiceCompletion(contractId, serviceData) {
    var contract = window.ContractManager.getContract(contractId);
    if (!contract) return false;

    // Record service completion
    window.ContractManager.recordServiceCompletion(contractId, serviceData);

    // Calculate next service date
    window.ContractManager.calculateNextServiceDate(contract);

    // Save contract
    window.ContractManager.saveContract(contract);

    console.log('[CONTRACT-AUTOMATION] Service completion processed:', contractId);
    return true;
  }

  /**
   * Manual trigger for automation checks
   */
  function triggerManualCheck() {
    console.log('[CONTRACT-AUTOMATION] Manual check triggered');
    return runAutomationChecks();
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Delay init slightly to ensure other modules are loaded
    setTimeout(init, 1000);
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractAutomation', {
      runChecks: runAutomationChecks,
      startAutomation: startAutomation,
      stopAutomation: stopAutomation,
      processServiceCompletion: processServiceCompletion
    });
  }

  // Global API
  window.ContractAutomation = {
    runChecks: runAutomationChecks,
    startAutomation: startAutomation,
    stopAutomation: stopAutomation,
    sendServiceReminders: sendServiceReminders,
    autoGenerateQuotes: autoGenerateQuotes,
    checkExpiringContracts: checkExpiringContracts,
    autoRenewContracts: autoRenewContracts,
    processServiceCompletion: processServiceCompletion,
    triggerManualCheck: triggerManualCheck
  };

  console.log('[CONTRACT-AUTOMATION] Module loaded');
})();
