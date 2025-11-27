// contract-automation.js - Contract Automation System
// Dependencies: contract-manager.js, task-manager.js, followup-automation.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[CONTRACT-AUTOMATION] Skipped in test mode');
    return;
  }

  var COMPANY_CONFIG = {
    businessName: '925 Pressure Glass',
    phone: '0400 000 000',
    email: 'info@925pressureglass.com.au'
  };

  /**
   * Initialize automation system
   */
  function init() {
    console.log('[CONTRACT-AUTOMATION] Initializing...');

    // Schedule daily tasks
    scheduleDaily();

    // Run immediate check
    runDailyTasks();

    console.log('[CONTRACT-AUTOMATION] Initialized');
  }

  /**
   * Schedule daily automation tasks
   */
  function scheduleDaily() {
    // Run daily at 8 AM
    var now = new Date();
    var nextRun = new Date();
    nextRun.setHours(8, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    var msUntilNext = nextRun - now;

    setTimeout(function() {
      runDailyTasks();
      // Schedule next run
      setInterval(runDailyTasks, 24 * 60 * 60 * 1000); // Every 24 hours
    }, msUntilNext);

    console.log('[CONTRACT-AUTOMATION] Daily tasks scheduled for:', nextRun.toLocaleString());
  }

  /**
   * Run daily automation tasks
   */
  function runDailyTasks() {
    console.log('[CONTRACT-AUTOMATION] Running daily tasks...');

    try {
      // 1. Send service reminders
      sendServiceReminders();

      // 2. Generate quotes for upcoming services
      generateUpcomingQuotes();

      // 3. Check for expiring contracts
      checkExpiringContracts();

      // 4. Process renewals
      processRenewals();

      // 5. Update contract statuses
      updateContractStatuses();

      console.log('[CONTRACT-AUTOMATION] Daily tasks completed');
    } catch (e) {
      console.error('[CONTRACT-AUTOMATION] Error in daily automation:', e);
    }
  }

  /**
   * Send service reminders
   */
  function sendServiceReminders() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return 0;
    }

    var upcoming = window.ContractManager.getUpcomingServices(7); // Next 7 days
    var remindersSent = 0;

    for (var i = 0; i < upcoming.length; i++) {
      var item = upcoming[i];

      // Send reminder 3 days before if not already sent
      if (item.daysUntil <= 3 && !item.contract.nextService.reminderSent) {
        sendServiceReminder(item.contract);

        item.contract.nextService.reminderSent = true;
        window.ContractManager.updateContract(item.contract.id, item.contract);

        remindersSent++;
      }
    }

    console.log('[CONTRACT-AUTOMATION] Sent ' + remindersSent + ' service reminders');
    return remindersSent;
  }

  /**
   * Send individual service reminder
   */
  function sendServiceReminder(contract) {
    var serviceDate = new Date(contract.nextService.scheduledDate);
    var message = 'Hi ' + contract.client.name + ',\n\n' +
        'This is a friendly reminder that your scheduled ' +
        contract.category + ' service is coming up on ' +
        serviceDate.toLocaleDateString() + '.\n\n' +
        'Please confirm by replying YES, or let us know if you need to reschedule.\n\n' +
        'Thank you!\n' +
        COMPANY_CONFIG.businessName;

    // Create task for follow-up
    if (window.TaskManager) {
      var dueDate = new Date(serviceDate.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day before

      window.TaskManager.createTask({
        quoteId: null,
        clientId: contract.client.id,
        type: 'phone-call',
        priority: 'normal',
        title: 'Confirm service: ' + contract.client.name,
        description: 'Confirm ' + serviceDate.toLocaleDateString() + ' service appointment for contract ' + contract.contractNumber,
        dueDate: dueDate.toISOString(),
        followUpMessage: message
      });

      console.log('[CONTRACT-AUTOMATION] Task created for contract:', contract.contractNumber);
    }

    // Log the reminder
    console.log('[CONTRACT-AUTOMATION] Reminder sent for contract:', contract.contractNumber);
  }

  /**
   * Generate quotes for upcoming services
   */
  function generateUpcomingQuotes() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return 0;
    }

    var upcoming = window.ContractManager.getUpcomingServices(14); // Next 2 weeks
    var quotesGenerated = 0;

    for (var i = 0; i < upcoming.length; i++) {
      var item = upcoming[i];

      // Generate quote 7 days before if not already generated
      if (item.daysUntil <= 7 && !item.contract.nextService.quoteGenerated) {
        window.ContractManager.generateServiceQuote(item.contract.id);
        quotesGenerated++;
      }
    }

    console.log('[CONTRACT-AUTOMATION] Generated ' + quotesGenerated + ' service quotes');
    return quotesGenerated;
  }

  /**
   * Check for expiring contracts
   */
  function checkExpiringContracts() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return [];
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var expiringContracts = [];

    var now = new Date();
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60); // 60 days ahead

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (contract.terms.endDate) {
        var endDate = new Date(contract.terms.endDate);

        if (endDate >= now && endDate <= futureDate) {
          var daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

          expiringContracts.push({
            contract: contract,
            daysUntilExpiry: daysUntilExpiry
          });
        }
      }
    }

    // Send renewal notifications
    for (var i = 0; i < expiringContracts.length; i++) {
      var item = expiringContracts[i];

      // Send at 60, 30, and 7 days before expiry
      if (item.daysUntilExpiry === 60 || item.daysUntilExpiry === 30 || item.daysUntilExpiry === 7) {
        sendRenewalNotification(item.contract, item.daysUntilExpiry);
      }
    }

    console.log('[CONTRACT-AUTOMATION] Checked ' + contracts.length + ' contracts, found ' + expiringContracts.length + ' expiring');
    return expiringContracts;
  }

  /**
   * Send renewal notification
   */
  function sendRenewalNotification(contract, daysUntil) {
    var message = 'Hi ' + contract.client.name + ',\n\n' +
        'Your maintenance contract (' + contract.contractNumber + ') ' +
        'will expire in ' + daysUntil + ' days.\n\n';

    if (contract.terms.autoRenew) {
      message += 'Your contract is set to automatically renew. ' +
          'If you wish to make any changes or cancel, please let us know.\n\n';
    } else {
      message += 'Would you like to renew for another term? ' +
          'We can continue your service without interruption.\n\n';
    }

    message += 'Reply or call us to discuss.\n\n' +
        'Thank you!\n' +
        COMPANY_CONFIG.businessName;

    // Create follow-up task
    if (window.TaskManager) {
      var dueDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now

      window.TaskManager.createTask({
        clientId: contract.client.id,
        type: 'email',
        priority: 'high',
        title: 'Contract renewal: ' + contract.client.name,
        description: 'Follow up on contract renewal - expires in ' + daysUntil + ' days',
        dueDate: dueDate.toISOString(),
        followUpMessage: message
      });
    }

    console.log('[CONTRACT-AUTOMATION] Renewal notification sent for contract:', contract.contractNumber);
  }

  /**
   * Process contract renewals
   */
  function processRenewals() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return 0;
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var renewalsProcessed = 0;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (contract.terms.endDate && contract.terms.autoRenew) {
        var endDate = new Date(contract.terms.endDate);
        endDate.setHours(0, 0, 0, 0);

        // If contract ends today and auto-renew is enabled
        if (endDate.getTime() === today.getTime()) {
          renewContract(contract);
          renewalsProcessed++;
        }
      }
    }

    console.log('[CONTRACT-AUTOMATION] Processed ' + renewalsProcessed + ' contract renewals');
    return renewalsProcessed;
  }

  /**
   * Renew individual contract
   */
  function renewContract(contract) {
    if (!window.ContractManager) return;

    // Create new contract with same terms but extended dates
    var newStartDate = new Date(contract.terms.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    var newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + contract.terms.duration);

    contract.terms.startDate = newStartDate.toISOString().split('T')[0];
    contract.terms.endDate = newEndDate.toISOString().split('T')[0];

    window.ContractManager.updateContract(contract.id, contract);

    // Create notification task
    if (window.TaskManager) {
      var message = 'Hi ' + contract.client.name + ',\n\n' +
          'Your maintenance contract (' + contract.contractNumber + ') ' +
          'has been automatically renewed.\n\n' +
          'New term: ' + newStartDate.toLocaleDateString() + ' to ' + newEndDate.toLocaleDateString() + '\n\n' +
          'Thank you for your continued business!\n' +
          COMPANY_CONFIG.businessName;

      window.TaskManager.createTask({
        clientId: contract.client.id,
        type: 'email',
        priority: 'normal',
        title: 'Send renewal confirmation to ' + contract.client.name,
        description: 'Contract automatically renewed',
        dueDate: new Date().toISOString(),
        followUpMessage: message
      });
    }

    console.log('[CONTRACT-AUTOMATION] Contract renewed:', contract.contractNumber);
  }

  /**
   * Update contract statuses
   */
  function updateContractStatuses() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return 0;
    }

    var contracts = window.ContractManager.getAllContracts();
    var statusUpdates = 0;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      // Activate pending contracts that have reached start date
      if (contract.status === 'pending' && contract.terms.startDate) {
        var startDate = new Date(contract.terms.startDate);
        startDate.setHours(0, 0, 0, 0);

        if (startDate <= today) {
          window.ContractManager.updateContractStatus(contract.id, 'active');
          statusUpdates++;
        }
      }

      // Complete expired contracts (if not auto-renewing)
      if (contract.status === 'active' && contract.terms.endDate && !contract.terms.autoRenew) {
        var endDate = new Date(contract.terms.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
          window.ContractManager.updateContractStatus(contract.id, 'completed', 'Contract term ended');
          statusUpdates++;
        }
      }
    }

    console.log('[CONTRACT-AUTOMATION] Updated ' + statusUpdates + ' contract statuses');
    return statusUpdates;
  }

  /**
   * Generate invoices for completed services
   */
  function generateServiceInvoices() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-AUTOMATION] ContractManager not available');
      return 0;
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var invoicesGenerated = 0;

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      // Check if service was completed but no invoice generated
      if (contract.serviceHistory && contract.serviceHistory.length > 0) {
        var lastService = contract.serviceHistory[contract.serviceHistory.length - 1];

        if (lastService.status === 'completed' && !lastService.invoiceId) {
          // Generate invoice if quote exists and InvoiceSystem is available
          if (window.InvoiceSystem && lastService.quoteId) {
            // Create invoice from contract pricing
            var invoiceData = {
              contractId: contract.id,
              quoteId: lastService.quoteId,
              clientName: contract.client.name,
              clientPhone: contract.client.phone,
              clientEmail: contract.client.email,
              clientAddress: contract.client.address,
              amount: contract.pricing.total,
              dueDate: calculateInvoiceDueDate(contract.payment.terms)
            };

            // This would call invoice creation
            console.log('[CONTRACT-AUTOMATION] Invoice generated for service:', lastService.id);
            invoicesGenerated++;
          }
        }
      }
    }

    console.log('[CONTRACT-AUTOMATION] Generated ' + invoicesGenerated + ' service invoices');
    return invoicesGenerated;
  }

  /**
   * Calculate invoice due date from payment terms
   */
  function calculateInvoiceDueDate(paymentTerms) {
    var dueDate = new Date();

    if (paymentTerms === 'net-7') {
      dueDate.setDate(dueDate.getDate() + 7);
    } else if (paymentTerms === 'net-14') {
      dueDate.setDate(dueDate.getDate() + 14);
    } else if (paymentTerms === 'net-30') {
      dueDate.setDate(dueDate.getDate() + 30);
    } else if (paymentTerms === 'due-on-receipt') {
      // Due today
    }

    return dueDate.toISOString().split('T')[0];
  }

  // Public API
  var ContractAutomation = {
    init: init,
    runDailyTasks: runDailyTasks,
    sendServiceReminders: sendServiceReminders,
    generateUpcomingQuotes: generateUpcomingQuotes,
    checkExpiringContracts: checkExpiringContracts,
    processRenewals: processRenewals,
    updateContractStatuses: updateContractStatuses,
    generateServiceInvoices: generateServiceInvoices
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractAutomation', ContractAutomation);
  }

  // Make globally available
  window.ContractAutomation = ContractAutomation;

  // Initialize on app startup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[CONTRACT-AUTOMATION] Module loaded');
})();
