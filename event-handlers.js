// event-handlers.js - Centralized Event Delegation System
// Dependencies: None (standalone)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)
//
// Purpose: Replace inline onclick handlers with data-action attributes
// Pattern: <button data-action="navigate" data-target="analytics">Analytics</button>

(function() {
  'use strict';

  // ============================================
  // ACTION HANDLERS REGISTRY
  // ============================================

  var actionHandlers = {
    // Navigation actions
    navigate: function(element) {
      var target = element.getAttribute('data-target');
      if (target && window.navigateTo) {
        window.navigateTo(target);
      }
    },

    // Modal actions
    openModal: function(element) {
      var modalId = element.getAttribute('data-modal-id');
      if (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) {
          modal.style.display = 'flex';
        }
      }
    },

    closeModal: function(element) {
      var modalId = element.getAttribute('data-modal-id');
      if (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) {
          modal.style.display = 'none';
        }
      }
    },

    // Webhook settings
    openWebhookSettings: function() {
      if (window.openGHLSettings) {
        window.openGHLSettings();
      } else {
        alert('GHL Settings module not loaded yet');
      }
    },

    closeWebhookSettings: function() {
      if (window.closeWebhookSettings) {
        window.closeWebhookSettings();
      }
    },

    saveWebhookSettings: function() {
      if (window.saveWebhookSettings) {
        window.saveWebhookSettings();
      }
    },

    testWebhookEndpoint: function() {
      if (window.testWebhookEndpoint) {
        window.testWebhookEndpoint();
      }
    },

    registerWebhookWithGHL: function() {
      if (window.registerWebhookWithGHL) {
        window.registerWebhookWithGHL();
      }
    },

    unregisterWebhookFromGHL: function() {
      if (window.unregisterWebhookFromGHL) {
        window.unregisterWebhookFromGHL();
      }
    },

    viewEventQueue: function() {
      if (window.viewEventQueue) {
        window.viewEventQueue();
      }
    },

    clearEventQueue: function() {
      if (window.clearEventQueue) {
        window.clearEventQueue();
      }
    },

    triggerManualSync: function() {
      if (window.triggerManualSync) {
        window.triggerManualSync();
      }
    },

    // Customer/Client management
    showCustomersPage: function() {
      if (window.showCustomersPage) {
        window.showCustomersPage();
      }
    },

    openAddCustomerModal: function() {
      if (window.openAddCustomerModal) {
        window.openAddCustomerModal();
      }
    },

    backToQuotes: function() {
      if (window.backToQuotes) {
        window.backToQuotes();
      }
    },

    // Test runner
    openTestRunner: function() {
      if (window.openTestRunner) {
        window.openTestRunner();
      }
    },

    // Location helper
    fillCurrentLocation: function() {
      if (window.fillCurrentLocation) {
        window.fillCurrentLocation();
      }
    },

    // Analytics
    exportAnalyticsDashboard: function() {
      if (window.exportAnalyticsDashboard) {
        window.exportAnalyticsDashboard();
      }
    },

    showAnalyticsMetricsTab: function(element) {
      var tab = element.getAttribute('data-tab');
      if (tab && window.showAnalyticsMetricsTab) {
        window.showAnalyticsMetricsTab(tab);
      }
    },

    // Task management
    showNewTaskModal: function() {
      if (window.showNewTaskModal) {
        window.showNewTaskModal();
      }
    },

    filterTasks: function(element) {
      var filter = element.getAttribute('data-filter');
      if (filter && window.filterTasks) {
        window.filterTasks(filter);
      }
    },

    // Contract wizard
    openContractWizard: function() {
      if (window.openContractWizard) {
        window.openContractWizard();
      }
    },

    closeContractWizard: function() {
      if (window.closeContractWizard) {
        window.closeContractWizard();
      }
    },

    selectContractType: function(element) {
      var type = element.getAttribute('data-contract-type');
      if (type && window.selectContractType) {
        window.selectContractType(type);
      }
    },

    contractWizardNext: function(element) {
      var step = parseInt(element.getAttribute('data-step'), 10);
      if (!isNaN(step) && window.contractWizardNext) {
        window.contractWizardNext(step);
      }
    },

    contractWizardBack: function(element) {
      var step = parseInt(element.getAttribute('data-step'), 10);
      if (!isNaN(step) && window.contractWizardBack) {
        window.contractWizardBack(step);
      }
    },

    addContractService: function() {
      if (window.addContractService) {
        window.addContractService();
      }
    },

    updateContractPricing: function() {
      if (window.updateContractPricing) {
        window.updateContractPricing();
      }
    },

    saveContractDraft: function() {
      if (window.saveContractDraft) {
        window.saveContractDraft();
      }
    },

    createContractFinal: function() {
      if (window.createContractFinal) {
        window.createContractFinal();
      }
    },

    createContractFromWizard: function() {
      if (window.createContractFromWizard) {
        window.createContractFromWizard();
      }
    },

    loadClientDetails: function(element) {
      var clientId = element.value; // For select elements
      if (window.loadClientDetails) {
        window.loadClientDetails(clientId);
      }
    },

    toggleNewClientForm: function() {
      if (window.toggleNewClientForm) {
        window.toggleNewClientForm();
      }
    },

    selectServiceCategory: function(element) {
      var category = element.getAttribute('data-category');
      if (category && window.selectServiceCategory) {
        window.selectServiceCategory(category);
      }
    }
  };

  // ============================================
  // EVENT DELEGATION HANDLER
  // ============================================

  /**
   * Main click event handler with delegation
   * @param {Event} event - Click event
   */
  function handleClick(event) {
    var target = event.target;

    // Traverse up the DOM to find element with data-action
    while (target && target !== document.body) {
      var action = target.getAttribute('data-action');

      if (action && actionHandlers[action]) {
        // Prevent default if it's a link or button
        if (target.tagName === 'A' || target.tagName === 'BUTTON') {
          event.preventDefault();
        }

        // Execute the action handler
        try {
          actionHandlers[action](target);
        } catch (e) {
          console.error('[EVENT-HANDLERS] Error executing action:', action, e);
        }

        return;
      }

      // Also check for card-clickable divs (used in task dashboard)
      if (target.classList && target.classList.contains('card-clickable')) {
        var cardAction = target.getAttribute('data-action');
        if (cardAction && actionHandlers[cardAction]) {
          try {
            actionHandlers[cardAction](target);
          } catch (e) {
            console.error('[EVENT-HANDLERS] Error executing card action:', cardAction, e);
          }
          return;
        }
      }

      target = target.parentElement;
    }
  }

  /**
   * Main change event handler for select elements
   * @param {Event} event - Change event
   */
  function handleChange(event) {
    var target = event.target;
    var action = target.getAttribute('data-action');

    if (action && actionHandlers[action]) {
      try {
        actionHandlers[action](target);
      } catch (e) {
        console.error('[EVENT-HANDLERS] Error executing change action:', action, e);
      }
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize event delegation system
   */
  function init() {
    // Remove any existing listeners (for hot reload scenarios)
    document.body.removeEventListener('click', handleClick);
    document.body.removeEventListener('change', handleChange);

    // Attach event listeners
    document.body.addEventListener('click', handleClick);
    document.body.addEventListener('change', handleChange);

    console.log('[EVENT-HANDLERS] Event delegation system initialized');
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('eventHandlers', {
      init: init,
      registerAction: function(name, handler) {
        actionHandlers[name] = handler;
      }
    });
  }

  // Global API
  window.EventHandlers = {
    init: init,
    registerAction: function(name, handler) {
      actionHandlers[name] = handler;
      console.log('[EVENT-HANDLERS] Registered custom action:', name);
    }
  };

})();
