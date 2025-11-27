// test-checklist.js - Manual Test Checklist Manager
// Track manual testing progress with interactive checklist
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[TEST-CHECKLIST] Skipped in test mode');
    return;
  }

  var STORAGE_KEY = 'tts_manual_test_checklist';

  /**
   * Manual test checklist items
   */
  var CHECKLIST_ITEMS = [
    {
      category: 'Critical Path Tests',
      items: [
        { id: 'quote-creation', text: 'Can create new quote from scratch', completed: false },
        { id: 'quote-fields-save', text: 'All quote fields save correctly', completed: false },
        { id: 'quote-calculations', text: 'Quote calculations are accurate', completed: false },
        { id: 'gst-calculation', text: 'GST calculated correctly (10%)', completed: false },
        { id: 'line-items', text: 'Can add/edit/delete line items', completed: false },
        { id: 'quote-save', text: 'Can save quote as draft', completed: false },
        { id: 'quote-send', text: 'Can mark quote as sent', completed: false },
        { id: 'invoice-creation', text: 'Can create invoice from quote', completed: false },
        { id: 'payment-recording', text: 'Can record manual payment', completed: false },
        { id: 'invoice-status', text: 'Invoice status updates correctly', completed: false }
      ]
    },
    {
      category: 'Mobile Tests (iOS Safari)',
      items: [
        { id: 'mobile-load', text: 'App loads on iOS Safari', completed: false },
        { id: 'touch-gestures', text: 'Touch gestures work correctly', completed: false },
        { id: 'mobile-forms', text: 'Forms are usable on mobile', completed: false },
        { id: 'no-horizontal-scroll', text: 'No horizontal scrolling issues', completed: false },
        { id: 'touch-targets', text: 'Buttons are touch-friendly (44x44 min)', completed: false },
        { id: 'readable-text', text: 'Text is readable without zoom', completed: false }
      ]
    },
    {
      category: 'Offline Functionality',
      items: [
        { id: 'offline-works', text: 'App works when offline', completed: false },
        { id: 'offline-quotes', text: 'Can create quotes offline', completed: false },
        { id: 'offline-storage', text: 'Data saves to localStorage', completed: false },
        { id: 'no-data-loss', text: 'No data loss when offline', completed: false },
        { id: 'offline-indicator', text: 'Offline indicator shows', completed: false }
      ]
    },
    {
      category: 'Performance',
      items: [
        { id: 'load-time', text: 'App loads in <3 seconds', completed: false },
        { id: 'quote-speed', text: 'Quote creation is instant', completed: false },
        { id: 'search-responsive', text: 'Search/filter is responsive', completed: false },
        { id: 'no-lag', text: 'No lag when scrolling', completed: false },
        { id: 'smooth-animations', text: 'Smooth animations', completed: false }
      ]
    },
    {
      category: 'Data Validation',
      items: [
        { id: 'empty-validation', text: 'Cannot save empty quote', completed: false },
        { id: 'phone-validation', text: 'Phone numbers validated', completed: false },
        { id: 'email-validation', text: 'Email addresses validated', completed: false },
        { id: 'price-validation', text: 'Prices cannot be negative', completed: false },
        { id: 'required-fields', text: 'Required fields enforced', completed: false }
      ]
    },
    {
      category: 'Error Handling',
      items: [
        { id: 'save-errors', text: 'Shows error for failed saves', completed: false },
        { id: 'storage-full', text: 'Recovers from localStorage full', completed: false },
        { id: 'corrupted-data', text: 'Handles corrupted data gracefully', completed: false },
        { id: 'network-errors', text: 'Network errors shown clearly', completed: false },
        { id: 'no-js-errors', text: 'No JavaScript errors in console', completed: false }
      ]
    },
    {
      category: 'Production Readiness',
      items: [
        { id: 'all-tests-pass', text: 'All automated tests pass', completed: false },
        { id: 'no-console-errors', text: 'No console errors', completed: false },
        { id: 'performance-ok', text: 'Performance acceptable', completed: false },
        { id: 'offline-works', text: 'Offline mode works', completed: false },
        { id: 'backup-ready', text: 'Data backup exists', completed: false }
      ]
    }
  ];

  /**
   * Load checklist state from localStorage
   */
  function loadChecklistState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('[TEST-CHECKLIST] Failed to load state:', e);
    }
    return null;
  }

  /**
   * Save checklist state to localStorage
   */
  function saveChecklistState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[TEST-CHECKLIST] Failed to save state:', e);
    }
  }

  /**
   * Merge saved state with checklist items
   */
  function mergeChecklistState() {
    var saved = loadChecklistState();
    if (!saved) return CHECKLIST_ITEMS;

    var merged = JSON.parse(JSON.stringify(CHECKLIST_ITEMS));

    for (var i = 0; i < merged.length; i++) {
      var category = merged[i];

      for (var j = 0; j < category.items.length; j++) {
        var item = category.items[j];

        // Find in saved state
        if (saved[item.id] !== undefined) {
          item.completed = saved[item.id];
        }
      }
    }

    return merged;
  }

  /**
   * Toggle checklist item
   */
  function toggleItem(itemId) {
    var state = loadChecklistState() || {};
    state[itemId] = !state[itemId];
    saveChecklistState(state);
    renderChecklist();
    updateProgress();
  }

  /**
   * Reset checklist
   */
  function resetChecklist() {
    if (confirm('Are you sure you want to reset the checklist?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderChecklist();
      updateProgress();

      if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
        UIComponents.showToast('Checklist reset', 'success');
      }
    }
  }

  /**
   * Update progress bar
   */
  function updateProgress() {
    var checklist = mergeChecklistState();
    var total = 0;
    var completed = 0;

    for (var i = 0; i < checklist.length; i++) {
      for (var j = 0; j < checklist[i].items.length; j++) {
        total++;
        if (checklist[i].items[j].completed) {
          completed++;
        }
      }
    }

    var percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    var progressBar = document.getElementById('checklist-progress-bar');
    if (progressBar) {
      progressBar.style.width = percentage + '%';
      progressBar.setAttribute('aria-valuenow', percentage);
    }

    var progressText = document.getElementById('checklist-progress-text');
    if (progressText) {
      progressText.textContent = completed + ' / ' + total + ' (' + percentage + '%)';
    }

    // Update color based on completion
    if (progressBar) {
      if (percentage === 100) {
        progressBar.style.backgroundColor = '#10b981'; // Green
      } else if (percentage >= 50) {
        progressBar.style.backgroundColor = '#3b82f6'; // Blue
      } else {
        progressBar.style.backgroundColor = '#6b7280'; // Gray
      }
    }
  }

  /**
   * Render checklist
   */
  function renderChecklist() {
    var container = document.getElementById('manual-test-checklist');
    if (!container) return;

    var checklist = mergeChecklistState();
    var html = '';

    for (var i = 0; i < checklist.length; i++) {
      var category = checklist[i];

      html += '<div class="checklist-category">';
      html += '<h4 class="checklist-category-title">' + escapeHtml(category.category) + '</h4>';
      html += '<div class="checklist-items">';

      for (var j = 0; j < category.items.length; j++) {
        var item = category.items[j];
        var checked = item.completed ? ' checked' : '';

        html += '<label class="checklist-item">';
        html += '<input type="checkbox" class="checklist-checkbox" ';
        html += 'data-item-id="' + item.id + '"' + checked + '>';
        html += '<span class="checklist-text">' + escapeHtml(item.text) + '</span>';
        html += '</label>';
      }

      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;

    // Wire up event listeners
    var checkboxes = container.querySelectorAll('.checklist-checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener('change', function() {
        var itemId = this.getAttribute('data-item-id');
        toggleItem(itemId);
      });
    }
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Export checklist results
   */
  function exportChecklistResults() {
    var checklist = mergeChecklistState();
    var report = '';

    report += '========================================\n';
    report += 'Manual Test Checklist Results\n';
    report += '========================================\n';
    report += 'Date: ' + new Date().toISOString() + '\n\n';

    var total = 0;
    var completed = 0;

    for (var i = 0; i < checklist.length; i++) {
      var category = checklist[i];

      report += category.category + ':\n';
      report += '-'.repeat(40) + '\n';

      for (var j = 0; j < category.items.length; j++) {
        var item = category.items[j];
        total++;
        if (item.completed) completed++;

        report += (item.completed ? '[✓] ' : '[ ] ') + item.text + '\n';
      }

      report += '\n';
    }

    var percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    report += '========================================\n';
    report += 'Completion: ' + completed + ' / ' + total + ' (' + percentage + '%)\n';
    report += '========================================\n';

    // Download as text file
    var blob = new Blob([report], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'manual-test-checklist-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
      UIComponents.showToast('Checklist exported', 'success');
    }
  }

  /**
   * Initialize checklist
   */
  function init() {
    console.log('[TEST-CHECKLIST] Initializing...');

    renderChecklist();
    updateProgress();

    // Wire up buttons
    var resetBtn = document.getElementById('reset-checklist-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetChecklist);
    }

    var exportBtn = document.getElementById('export-checklist-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportChecklistResults);
    }

    console.log('[TEST-CHECKLIST] Initialized');
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('testChecklist', {
      renderChecklist: renderChecklist,
      resetChecklist: resetChecklist,
      exportChecklistResults: exportChecklistResults,
      init: init
    });
  }

  // Global API
  window.TestChecklist = {
    renderChecklist: renderChecklist,
    resetChecklist: resetChecklist,
    exportChecklistResults: exportChecklistResults,
    init: init
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
