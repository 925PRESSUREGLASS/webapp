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
  // KEYBOARD ACCESSIBILITY HELPERS
  // ============================================

  /**
   * Get focusable elements within a container
   * @param {HTMLElement} container
   * @returns {Array}
   */
  function getFocusable(container) {
    if (!container) return [];
    var focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var nodes = container.querySelectorAll(focusableSelectors);
    var elements = [];
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].disabled && nodes[i].offsetParent !== null) {
        elements.push(nodes[i]);
      }
    }
    return elements;
  }

  /**
   * Enable keyboard navigation for modal overlays
   * @param {HTMLElement} overlay
   * @param {Object} options
   */
  function setupModalNavigation(overlay, options) {
    if (!overlay) return;

    var modal = overlay.querySelector('.modal');
    if (modal) {
      modal.setAttribute('tabindex', '-1');
      if (!modal.getAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }
      if (options && options.labelledBy) {
        modal.setAttribute('aria-labelledby', options.labelledBy);
      }
    }

    var closeHandler = options && options.onClose ? options.onClose : null;
    var submitHandler = options && options.onSubmit ? options.onSubmit : null;
    var initialSelector = options && options.initialFocusSelector ? options.initialFocusSelector : null;

    var focusables = getFocusable(overlay);
    setTimeout(function() {
      var initialEl = initialSelector ? overlay.querySelector(initialSelector) : focusables[0];
      if (initialEl) {
        initialEl.focus();
      } else if (modal) {
        modal.focus();
      }
    }, 0);

    overlay.addEventListener('keydown', function(event) {
      var key = event.key || event.keyCode;
      if (key === 'Escape' || key === 'Esc' || key === 27) {
        event.preventDefault();
        if (closeHandler) {
          closeHandler();
        }
        return;
      }

      if (key === 'Enter' || key === 13) {
        if (submitHandler && event.target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          submitHandler();
        }
        return;
      }

      if (key === 'Tab' || key === 9) {
        focusables = getFocusable(overlay);
        if (focusables.length === 0) return;
        var active = document.activeElement;
        var idx = focusables.indexOf ? focusables.indexOf(active) : Array.prototype.indexOf.call(focusables, active);
        var nextIdx = idx;

        if (event.shiftKey) {
          nextIdx = idx <= 0 ? focusables.length - 1 : idx - 1;
        } else {
          nextIdx = idx >= focusables.length - 1 ? 0 : idx + 1;
        }

        if (focusables[nextIdx]) {
          event.preventDefault();
          focusables[nextIdx].focus();
        }
        return;
      }

      if (key === 'ArrowDown' || key === 'Down' || key === 40 || key === 'ArrowRight' || key === 'Right' || key === 39) {
        focusables = getFocusable(overlay);
        var current = document.activeElement;
        var currentIdx = focusables.indexOf ? focusables.indexOf(current) : Array.prototype.indexOf.call(focusables, current);
        var forward = currentIdx >= 0 ? currentIdx + 1 : 0;
        if (forward >= focusables.length) forward = 0;
        if (focusables[forward]) {
          event.preventDefault();
          focusables[forward].focus();
        }
      }

      if (key === 'ArrowUp' || key === 'Up' || key === 38 || key === 'ArrowLeft' || key === 'Left' || key === 37) {
        focusables = getFocusable(overlay);
        var activeEl = document.activeElement;
        var activeIdx = focusables.indexOf ? focusables.indexOf(activeEl) : Array.prototype.indexOf.call(focusables, activeEl);
        var backward = activeIdx <= 0 ? focusables.length - 1 : activeIdx - 1;
        if (focusables[backward]) {
          event.preventDefault();
          focusables[backward].focus();
        }
      }
    });
  }

  /**
   * Enable arrow-key navigation for table-like containers
   * @param {HTMLElement} container
   * @param {string} itemSelector
   * @param {Function} activateCallback
   */
  function enableKeyboardTableNavigation(container, itemSelector, activateCallback) {
    if (!container) return;

    container.setAttribute('role', 'grid');

    function ensureFocusable() {
      var rows = container.querySelectorAll(itemSelector);
      for (var i = 0; i < rows.length; i++) {
        rows[i].setAttribute('tabindex', rows[i].getAttribute('tabindex') || '0');
        rows[i].setAttribute('role', rows[i].getAttribute('role') || 'row');
      }
    }

    ensureFocusable();

    container.addEventListener('keydown', function(event) {
      var key = event.key || event.keyCode;
      var rows = container.querySelectorAll(itemSelector);
      if (!rows.length) return;

      var active = document.activeElement;
      var index = Array.prototype.indexOf.call(rows, active);

      if (key === 'ArrowDown' || key === 'Down' || key === 40 || key === 'ArrowRight' || key === 'Right' || key === 39) {
        var next = index >= 0 ? index + 1 : 0;
        if (next >= rows.length) next = rows.length - 1;
        if (rows[next]) {
          event.preventDefault();
          rows[next].focus();
        }
      } else if (key === 'ArrowUp' || key === 'Up' || key === 38 || key === 'ArrowLeft' || key === 'Left' || key === 37) {
        var prev = index >= 0 ? index - 1 : 0;
        if (prev < 0) prev = 0;
        if (rows[prev]) {
          event.preventDefault();
          rows[prev].focus();
        }
      } else if (key === 'Enter' || key === 13) {
        if (activateCallback && rows[index]) {
          event.preventDefault();
          activateCallback(rows[index]);
        }
      } else if (key === 'Escape' || key === 'Esc' || key === 27) {
        if (active && active.blur) {
          active.blur();
        }
      }
    });
  }

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
      },
      setupModalNavigation: setupModalNavigation,
      enableKeyboardTableNavigation: enableKeyboardTableNavigation
    });
  }

  // Global API
  window.EventHandlers = {
    init: init,
    registerAction: function(name, handler) {
      actionHandlers[name] = handler;
      console.log('[EVENT-HANDLERS] Registered custom action:', name);
    },
    setupModalNavigation: setupModalNavigation,
    enableKeyboardTableNavigation: enableKeyboardTableNavigation
  };

})();
