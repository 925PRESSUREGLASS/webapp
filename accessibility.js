// accessibility.js - ARIA labels and accessibility enhancements
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Add ARIA labels to dynamically created elements
  function enhanceAccessibility() {
    // Theme toggle button
    var themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn && !themeBtn.getAttribute('aria-label')) {
      themeBtn.setAttribute('aria-label', 'Toggle dark/light theme');
      themeBtn.setAttribute('role', 'button');
    }

    // Export CSV button
    var exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn && !exportBtn.getAttribute('aria-label')) {
      exportBtn.setAttribute('aria-label', 'Export quote to CSV/Excel file');
    }

    // Save to history button
    var historyBtn = document.getElementById('saveToHistoryBtn');
    if (historyBtn && !historyBtn.getAttribute('aria-label')) {
      historyBtn.setAttribute('aria-label', 'Save current quote to history');
    }

    // Photo controls
    var photoInput = document.getElementById('photoFileInput');
    if (photoInput && !photoInput.getAttribute('aria-label')) {
      photoInput.setAttribute('aria-label', 'Select photos to upload');
    }

    // Add window line button
    var addWindowBtn = document.getElementById('addWindowLineBtn');
    if (addWindowBtn && !addWindowBtn.getAttribute('aria-label')) {
      addWindowBtn.setAttribute('aria-label', 'Add new window cleaning line item');
    }

    // Add pressure line button
    var addPressureBtn = document.getElementById('addPressureLineBtn');
    if (addPressureBtn && !addPressureBtn.getAttribute('aria-label')) {
      addPressureBtn.setAttribute('aria-label', 'Add new pressure cleaning line item');
    }

    // Save/Load buttons
    var saveBtn = document.getElementById('saveBtn');
    if (saveBtn && !saveBtn.getAttribute('aria-label')) {
      saveBtn.setAttribute('aria-label', 'Save current quote to browser storage');
    }

    var loadBtn = document.getElementById('loadBtn');
    if (loadBtn && !loadBtn.getAttribute('aria-label')) {
      loadBtn.setAttribute('aria-label', 'Load saved quote from browser storage');
    }

    var clearBtn = document.getElementById('clearBtn');
    if (clearBtn && !clearBtn.getAttribute('aria-label')) {
      clearBtn.setAttribute('aria-label', 'Clear all quote data and start fresh');
    }

    // Toast container - announce messages to screen readers
    var toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
      toastContainer.setAttribute('aria-live', 'polite');
      toastContainer.setAttribute('aria-atomic', 'true');
      toastContainer.setAttribute('role', 'status');
    }

    // Analytics panel
    var analyticsContainer = document.getElementById('analyticsContainer');
    if (analyticsContainer) {
      analyticsContainer.setAttribute('aria-label', 'Analytics dashboard showing quote history and statistics');
      analyticsContainer.setAttribute('role', 'region');
    }

    // Photo gallery
    var photoGallery = document.getElementById('photoGallery');
    if (photoGallery) {
      photoGallery.setAttribute('aria-label', 'Photo gallery for attached images');
      photoGallery.setAttribute('role', 'region');
    }
  }

  // Enhance line item buttons with ARIA labels
  function enhanceLineItemButtons() {
    // Delete buttons
    var deleteButtons = document.querySelectorAll('.delete-btn');
    for (var i = 0; i < deleteButtons.length; i++) {
      if (!deleteButtons[i].getAttribute('aria-label')) {
        deleteButtons[i].setAttribute('aria-label', 'Delete this line item');
        deleteButtons[i].setAttribute('role', 'button');
      }
    }

    // Duplicate buttons
    var duplicateButtons = document.querySelectorAll('.duplicate-btn');
    for (var j = 0; j < duplicateButtons.length; j++) {
      if (!duplicateButtons[j].getAttribute('aria-label')) {
        duplicateButtons[j].setAttribute('aria-label', 'Duplicate this line item');
        duplicateButtons[j].setAttribute('role', 'button');
      }
    }

    // Accordion toggle buttons
    var accordionToggles = document.querySelectorAll('.sec-hdr');
    for (var k = 0; k < accordionToggles.length; k++) {
      if (!accordionToggles[k].getAttribute('aria-label')) {
        var sectionTitle = accordionToggles[k].querySelector('.sec-title');
        var title = sectionTitle ? sectionTitle.textContent.trim() : 'Section';
        accordionToggles[k].setAttribute('aria-label', 'Toggle ' + title + ' section');
        accordionToggles[k].setAttribute('role', 'button');
        accordionToggles[k].setAttribute('aria-expanded', 'false');
      }
    }
  }

  // Enhance form inputs with better labels
  function enhanceFormInputs() {
    // Quote title
    var quoteTitleInput = document.getElementById('quoteTitleInput');
    if (quoteTitleInput) {
      quoteTitleInput.setAttribute('aria-label', 'Quote title or description');
    }

    // Client name
    var clientNameInput = document.getElementById('clientNameInput');
    if (clientNameInput) {
      clientNameInput.setAttribute('aria-label', 'Client name');
    }

    // Client location
    var clientLocationInput = document.getElementById('clientLocationInput');
    if (clientLocationInput) {
      clientLocationInput.setAttribute('aria-label', 'Client location or address');
    }

    // Job type
    var jobTypeSelect = document.getElementById('jobTypeSelect');
    if (jobTypeSelect) {
      jobTypeSelect.setAttribute('aria-label', 'Job type classification');
    }

    // Internal notes
    var internalNotes = document.getElementById('internalNotes');
    if (internalNotes) {
      internalNotes.setAttribute('aria-label', 'Internal notes (not visible to client)');
    }

    // Client notes
    var clientNotes = document.getElementById('clientNotes');
    if (clientNotes) {
      clientNotes.setAttribute('aria-label', 'Client-facing notes to include in quote');
    }

    // Settings inputs
    var baseFee = document.getElementById('baseFeeInput');
    if (baseFee) {
      baseFee.setAttribute('aria-label', 'Base callout fee in dollars');
    }

    var hourlyRate = document.getElementById('hourlyRateInput');
    if (hourlyRate) {
      hourlyRate.setAttribute('aria-label', 'Hourly rate for window cleaning');
    }

    var pressureRate = document.getElementById('pressureHourlyRateInput');
    if (pressureRate) {
      pressureRate.setAttribute('aria-label', 'Hourly rate for pressure cleaning');
    }

    var minimumJob = document.getElementById('minimumJobInput');
    if (minimumJob) {
      minimumJob.setAttribute('aria-label', 'Minimum job charge in dollars');
    }

    var highReachModifier = document.getElementById('highReachModifierPercentInput');
    if (highReachModifier) {
      highReachModifier.setAttribute('aria-label', 'High reach modifier percentage');
    }
  }

  // Add skip links for keyboard navigation
  function addSkipLinks() {
    var skipLinksExist = document.getElementById('skip-links');
    if (skipLinksExist) return;

    var skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML =
      '<a href="#windowLinesSection" class="skip-link">Skip to window lines</a>' +
      '<a href="#pressureLinesSection" class="skip-link">Skip to pressure lines</a>' +
      '<a href="#summarySection" class="skip-link">Skip to quote summary</a>';

    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  // Add focus indicators for keyboard navigation
  function enhanceFocusIndicators() {
    var style = document.getElementById('accessibility-focus-styles');
    if (style) return;

    var focusStyles = document.createElement('style');
    focusStyles.id = 'accessibility-focus-styles';
    focusStyles.textContent =
      '.skip-links { position: absolute; top: -100px; left: 0; z-index: 100000; }' +
      '.skip-link { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }' +
      '.skip-link:focus { position: static; width: auto; height: auto; padding: 10px 20px; background: #6c63ff; color: white; text-decoration: none; border-radius: 4px; margin: 10px; display: inline-block; }' +
      'button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #6c63ff; outline-offset: 2px; }' +
      '[data-theme="light"] button:focus-visible, [data-theme="light"] input:focus-visible, [data-theme="light"] select:focus-visible, [data-theme="light"] textarea:focus-visible { outline-color: #5b54d6; }';

    document.head.appendChild(focusStyles);
  }

  // Announce dynamic content changes to screen readers
  function announceChange(message, priority) {
    var announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', priority || 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
    }

    announcer.textContent = '';
    setTimeout(function() {
      announcer.textContent = message;
    }, 100);
  }

  // Monitor DOM changes and enhance new elements
  function setupMutationObserver() {
    var observer = new MutationObserver(function(mutations) {
      var shouldEnhance = false;

      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          shouldEnhance = true;
        }
      });

      if (shouldEnhance) {
        setTimeout(function() {
          enhanceLineItemButtons();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize all accessibility enhancements
  function init() {
    enhanceAccessibility();
    enhanceLineItemButtons();
    enhanceFormInputs();
    addSkipLinks();
    enhanceFocusIndicators();
    setupMutationObserver();

    console.log('Accessibility enhancements initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-enhance on certain events
  window.addEventListener('load', function() {
    setTimeout(function() {
      enhanceAccessibility();
      enhanceLineItemButtons();
      enhanceFormInputs();
    }, 500);
  });

  // Export public API
  window.Accessibility = {
    enhance: enhanceAccessibility,
    enhanceLineItems: enhanceLineItemButtons,
    enhanceForms: enhanceFormInputs,
    announce: announceChange
  };

})();
