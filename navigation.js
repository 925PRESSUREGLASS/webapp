// navigation.js - Centralized Navigation System
// Dependencies: None (standalone)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)
//
// Purpose: Provide centralized navigation between app pages

(function() {
  'use strict';

  // ============================================
  // PAGE NAVIGATION
  // ============================================

  /**
   * Navigate to a specific page in the application
   * @param {string} pageName - Name of the page to navigate to
   * @param {Object} params - Optional parameters for the page
   */
  function navigateTo(pageName, params) {
    console.log('[NAV] Navigating to:', pageName, params);

    // Get all page elements
    var mainApp = document.querySelector('.app');
    var pageElements = {
      'tasks': document.getElementById('page-tasks'),
      'customers': document.getElementById('page-customers'),
      'jobs': document.getElementById('page-jobs'),
      'active-job': document.getElementById('page-active-job'),
      'pricing-insights': document.getElementById('page-pricing-insights'),
      'contracts': document.getElementById('page-contracts'),
      'analytics-dashboard': document.getElementById('page-analytics-dashboard'),
      'help': document.getElementById('page-help'),
      'settings': document.getElementById('page-settings')
    };

    // Hide all pages first
    if (mainApp) {
      mainApp.style.display = 'none';
    }
    
    for (var key in pageElements) {
      if (pageElements.hasOwnProperty(key) && pageElements[key]) {
        pageElements[key].style.display = 'none';
      }
    }

    // Handle navigation based on page name
    switch (pageName) {
      case 'home':
      case 'quotes':
      case 'quote':
        // Show main quote app
        if (mainApp) {
          mainApp.style.display = 'block';
        }
        console.log('[NAV] Navigated to quotes page');
        break;

      case 'tasks':
        if (pageElements.tasks) {
          pageElements.tasks.style.display = 'block';
          // Refresh task list if available
          if (window.TaskDashboard && window.TaskDashboard.renderTaskList) {
            window.TaskDashboard.renderTaskList();
          }
          console.log('[NAV] Navigated to tasks page');
        }
        break;

      case 'customers':
        if (pageElements.customers) {
          pageElements.customers.style.display = 'block';
          // Use the showCustomersPage function if available
          if (window.showCustomersPage) {
            window.showCustomersPage();
          }
          console.log('[NAV] Navigated to customers page');
        }
        break;

      case 'jobs':
        if (pageElements.jobs) {
          pageElements.jobs.style.display = 'block';
          // Initialize jobs page if available
          if (window.JobTracking && window.JobTracking.showJobsPage) {
            window.JobTracking.showJobsPage();
          }
          console.log('[NAV] Navigated to jobs page');
        }
        break;

      case 'active-job':
        if (pageElements['active-job']) {
          pageElements['active-job'].style.display = 'block';
          console.log('[NAV] Navigated to active job page');
        }
        break;

      case 'pricing-insights':
        if (pageElements['pricing-insights']) {
          pageElements['pricing-insights'].style.display = 'block';
          console.log('[NAV] Navigated to pricing insights page');
        }
        break;

      case 'contracts':
        if (pageElements.contracts) {
          pageElements.contracts.style.display = 'block';
          // Initialize contracts page if available
          if (window.ContractUI && window.ContractUI.showContractsPage) {
            window.ContractUI.showContractsPage();
          }
          console.log('[NAV] Navigated to contracts page');
        }
        break;

      case 'analytics-dashboard':
      case 'analytics':
        if (pageElements['analytics-dashboard']) {
          pageElements['analytics-dashboard'].style.display = 'block';
          // Initialize analytics if available
          if (window.AnalyticsDashboard && window.AnalyticsDashboard.init) {
            window.AnalyticsDashboard.init();
          }
          console.log('[NAV] Navigated to analytics dashboard');
        }
        break;

      case 'help':
        if (pageElements.help) {
          pageElements.help.style.display = 'block';
          // Initialize help system if available
          if (window.HelpSystem && window.HelpSystem.init) {
            window.HelpSystem.init();
          }
          console.log('[NAV] Navigated to help page');
        }
        break;

      case 'settings':
        if (pageElements.settings) {
          pageElements.settings.style.display = 'block';
          console.log('[NAV] Navigated to settings page');
        }
        break;

      default:
        console.warn('[NAV] Unknown page:', pageName);
        // Default to showing main app
        if (mainApp) {
          mainApp.style.display = 'block';
        }
        break;
    }

    // Update active state on navigation buttons (optional)
    updateActiveNavButton(pageName);

    // Scroll to top of page
    window.scrollTo(0, 0);
  }

  /**
   * Update active state on navigation buttons
   * @param {string} pageName - Name of the current page
   */
  function updateActiveNavButton(pageName) {
    // Remove active class from all nav buttons
    var navButtons = document.querySelectorAll('.hdr-actions button');
    for (var i = 0; i < navButtons.length; i++) {
      navButtons[i].classList.remove('btn-active');
    }

    // Add active class to current page button
    var buttonMap = {
      'tasks': 'tasksPageBtn',
      'customers': 'customersPageBtn',
      'jobs': 'jobsPageBtn',
      'contracts': 'contractsPageBtn',
      'analytics-dashboard': 'analyticsPageBtn',
      'analytics': 'analyticsPageBtn',
      'help': 'helpPageBtn',
      'settings': 'settingsPageBtn'
    };

    var buttonId = buttonMap[pageName];
    if (buttonId) {
      var button = document.getElementById(buttonId);
      if (button) {
        button.classList.add('btn-active');
      }
    }
  }

  /**
   * Go back to the previous page (simplified - just goes to quotes)
   */
  function goBack() {
    navigateTo('quotes');
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Check if we're on a specific page
   * @param {string} pageName - Name of the page to check
   * @returns {boolean}
   */
  function isOnPage(pageName) {
    if (pageName === 'quotes' || pageName === 'home') {
      var mainApp = document.querySelector('.app');
      return mainApp && mainApp.style.display !== 'none';
    }

    var pageElement = document.getElementById('page-' + pageName);
    return pageElement && pageElement.style.display !== 'none';
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    console.log('[NAV] Navigation system initialized');
    
    // Set up event listeners for navigation buttons
    setupNavigationButtons();
  }

  /**
   * Set up click handlers for navigation buttons
   */
  function setupNavigationButtons() {
    // This is a fallback - prefer using onclick or data-action attributes
    var navButtons = document.querySelectorAll('[data-nav-target]');
    for (var i = 0; i < navButtons.length; i++) {
      navButtons[i].addEventListener('click', function() {
        var target = this.getAttribute('data-nav-target');
        if (target) {
          navigateTo(target);
        }
      });
    }
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('navigation', {
      navigateTo: navigateTo,
      goBack: goBack,
      isOnPage: isOnPage,
      init: init
    });
  }

  // Export global navigation function for inline onclick handlers
  window.navigateTo = navigateTo;
  window.goBack = goBack;
  window.isOnPage = isOnPage;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[NAV] Navigation module loaded');
})();
