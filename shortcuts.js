// shortcuts.js - Keyboard shortcuts for power users
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Keyboard shortcut configuration
  var shortcuts = {
    // Save preset: Cmd/Ctrl + S
    savePreset: {
      key: 's',
      ctrl: true,
      description: 'Save current settings as preset'
    },
    // Add window line: Cmd/Ctrl + W
    addWindow: {
      key: 'w',
      ctrl: true,
      description: 'Add new window line'
    },
    // Add pressure line: Cmd/Ctrl + P
    addPressure: {
      key: 'p',
      ctrl: true,
      description: 'Add new pressure cleaning line'
    },
    // Export PDF: Cmd/Ctrl + E
    exportPdf: {
      key: 'e',
      ctrl: true,
      description: 'Export quote to PDF'
    },
    // Copy summary: Cmd/Ctrl + C (when not in input)
    copySummary: {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Copy summary to clipboard'
    },
    // Open window wizard: Cmd/Ctrl + Shift + W
    windowWizard: {
      key: 'w',
      ctrl: true,
      shift: true,
      description: 'Open window wizard'
    },
    // Open pressure wizard: Cmd/Ctrl + Shift + P
    pressureWizard: {
      key: 'p',
      ctrl: true,
      shift: true,
      description: 'Open pressure wizard'
    },
    // Toggle config panel: Cmd/Ctrl + 1
    toggleConfig: {
      key: '1',
      ctrl: true,
      description: 'Toggle settings panel'
    },
    // Focus quote title: Cmd/Ctrl + T
    focusTitle: {
      key: 't',
      ctrl: true,
      description: 'Focus quote title field'
    },
    // Open invoices: Cmd/Ctrl + I
    openInvoices: {
      key: 'i',
      ctrl: true,
      description: 'Open invoice list'
    },
    // Open client database: Cmd/Ctrl + D
    openClients: {
      key: 'd',
      ctrl: true,
      description: 'Open client database'
    },
    // Open analytics: Cmd/Ctrl + A
    openAnalytics: {
      key: 'a',
      ctrl: true,
      description: 'Open analytics dashboard'
    }
  };

  // Check if element is an input/textarea
  function isInputElement(element) {
    if (!element) return false;
    var tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }

  // Handle keyboard shortcuts
  function handleKeydown(event) {
    var key = event.key.toLowerCase();
    var ctrl = event.ctrlKey || event.metaKey; // metaKey for Mac Cmd
    var shift = event.shiftKey;
    var alt = event.altKey;

    // ESC always closes modals
    if (key === 'escape') {
      closeActiveModal();
      return;
    }

    // Check if we're in an input field
    var inInput = isInputElement(event.target);

    // Cmd/Ctrl + S: Save preset
    if (ctrl && !shift && key === 's') {
      event.preventDefault();
      savePresetAction();
      return;
    }

    // Cmd/Ctrl + W: Add window line (only if not in input)
    if (ctrl && !shift && key === 'w' && !inInput) {
      event.preventDefault();
      addWindowLineAction();
      return;
    }

    // Cmd/Ctrl + P: Add pressure line (override print dialog)
    if (ctrl && !shift && key === 'p' && !inInput) {
      event.preventDefault();
      addPressureLineAction();
      return;
    }

    // Cmd/Ctrl + E: Export PDF
    if (ctrl && !shift && key === 'e') {
      event.preventDefault();
      exportPdfAction();
      return;
    }

    // Cmd/Ctrl + Shift + C: Copy summary
    if (ctrl && shift && key === 'c') {
      event.preventDefault();
      copySummaryAction();
      return;
    }

    // Cmd/Ctrl + Shift + W: Window wizard
    if (ctrl && shift && key === 'w') {
      event.preventDefault();
      openWindowWizardAction();
      return;
    }

    // Cmd/Ctrl + Shift + P: Pressure wizard
    if (ctrl && shift && key === 'p') {
      event.preventDefault();
      openPressureWizardAction();
      return;
    }

    // Cmd/Ctrl + 1: Toggle config
    if (ctrl && key === '1') {
      event.preventDefault();
      toggleConfigAction();
      return;
    }

    // Cmd/Ctrl + T: Focus title
    if (ctrl && !shift && key === 't') {
      event.preventDefault();
      focusTitleAction();
      return;
    }

    // Cmd/Ctrl + I: Open invoices
    if (ctrl && !shift && key === 'i' && !inInput) {
      event.preventDefault();
      openInvoicesAction();
      return;
    }

    // Cmd/Ctrl + D: Open client database
    if (ctrl && !shift && key === 'd' && !inInput) {
      event.preventDefault();
      openClientsAction();
      return;
    }

    // Cmd/Ctrl + A: Open analytics (override select all when not in input)
    if (ctrl && !shift && key === 'a' && !inInput) {
      event.preventDefault();
      openAnalyticsAction();
      return;
    }

    // ? (question mark): Show help
    if (key === '?' && !inInput && !ctrl && !alt) {
      event.preventDefault();
      showShortcutsHelp();
      return;
    }
  }

  // Action functions
  function savePresetAction() {
    var btn = document.getElementById('savePresetBtn');
    if (btn) {
      btn.click();
      showToast('Saving preset...', 'info');
    }
  }

  function addWindowLineAction() {
    var btn = document.getElementById('addWindowLineBtn');
    if (btn) {
      btn.click();
      showToast('Window line added', 'success');
    }
  }

  function addPressureLineAction() {
    var btn = document.getElementById('addPressureLineBtn');
    if (btn) {
      btn.click();
      showToast('Pressure line added', 'success');
    }
  }

  function exportPdfAction() {
    var btn = document.getElementById('generatePdfBtn');
    if (btn) {
      btn.click();
      showToast('Exporting to PDF...', 'info');
    }
  }

  function copySummaryAction() {
    var btn = document.getElementById('copySummaryBtn');
    if (btn) {
      btn.click();
      showToast('Summary copied to clipboard', 'success');
    }
  }

  function openWindowWizardAction() {
    var btn = document.getElementById('openWindowWizardBtn');
    if (btn) {
      btn.click();
    }
  }

  function openPressureWizardAction() {
    var btn = document.getElementById('openPressureWizardBtn');
    if (btn) {
      btn.click();
    }
  }

  function toggleConfigAction() {
    var btn = document.querySelector('button[data-target="configBody"]');
    if (btn) {
      btn.click();
      showToast('Settings toggled', 'info');
    }
  }

  function focusTitleAction() {
    var input = document.getElementById('quoteTitleInput');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function openInvoicesAction() {
    if (window.InvoiceManager && window.InvoiceManager.showList) {
      window.InvoiceManager.showList();
      showToast('Opening invoices...', 'info');
    } else {
      showToast('Invoice system not available', 'error');
    }
  }

  function openClientsAction() {
    if (window.ClientDatabase && window.ClientDatabase.showList) {
      window.ClientDatabase.showList();
      showToast('Opening client database...', 'info');
    } else {
      showToast('Client database not available', 'error');
    }
  }

  function openAnalyticsAction() {
    if (window.QuoteAnalytics && window.QuoteAnalytics.renderDashboard) {
      window.QuoteAnalytics.renderDashboard('all');
      showToast('Loading analytics...', 'info');
    } else {
      showToast('Analytics not available', 'error');
    }
  }

  function closeActiveModal() {
    var overlay = document.getElementById('wizardOverlay');
    if (overlay && overlay.style.display !== 'none') {
      var closeBtn = document.getElementById('wizardCloseBtn');
      if (closeBtn) {
        closeBtn.click();
      }
    }
  }

  // Toast notification function
  function showToast(message, type) {
    // Check if toast container exists
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Create toast
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;

    // Add to container
    container.appendChild(toast);

    // Trigger animation
    setTimeout(function() {
      toast.classList.add('toast-show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(function() {
      toast.classList.remove('toast-show');
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Show keyboard shortcuts help
  function showShortcutsHelp() {
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    var modKey = isMac ? '⌘' : 'Ctrl';

    // Create modal overlay
    var overlay = document.createElement('div');
    overlay.className = 'shortcuts-help-overlay';
    overlay.id = 'shortcutsHelpOverlay';

    // Create modal dialog
    var dialog = document.createElement('div');
    dialog.className = 'shortcuts-help-dialog';

    // Build header
    var header = document.createElement('div');
    header.className = 'shortcuts-help-header';

    var title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    header.appendChild(title);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'shortcuts-help-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close help dialog');
    closeBtn.onclick = closeShortcutsHelp;
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    // Build content
    var content = document.createElement('div');
    content.className = 'shortcuts-help-content';

    var shortcuts = [
      { keys: modKey + ' + S', description: 'Save current settings as preset' },
      { keys: modKey + ' + W', description: 'Add new window cleaning line' },
      { keys: modKey + ' + P', description: 'Add new pressure cleaning line' },
      { keys: modKey + ' + E', description: 'Export quote to PDF' },
      { keys: modKey + ' + I', description: 'Open invoice list' },
      { keys: modKey + ' + D', description: 'Open client database' },
      { keys: modKey + ' + A', description: 'Open analytics dashboard' },
      { keys: modKey + ' + Shift + C', description: 'Copy summary to clipboard' },
      { keys: modKey + ' + Shift + W', description: 'Open window wizard' },
      { keys: modKey + ' + Shift + P', description: 'Open pressure wizard' },
      { keys: modKey + ' + 1', description: 'Toggle settings panel' },
      { keys: modKey + ' + T', description: 'Focus quote title field' },
      { keys: 'ESC', description: 'Close active modal' },
      { keys: '?', description: 'Show this help dialog' }
    ];

    var table = document.createElement('table');
    table.className = 'shortcuts-help-table';

    for (var i = 0; i < shortcuts.length; i++) {
      var row = document.createElement('tr');

      var keyCell = document.createElement('td');
      keyCell.className = 'shortcuts-help-key';
      var kbd = document.createElement('kbd');
      kbd.textContent = shortcuts[i].keys;
      keyCell.appendChild(kbd);
      row.appendChild(keyCell);

      var descCell = document.createElement('td');
      descCell.className = 'shortcuts-help-desc';
      descCell.textContent = shortcuts[i].description;
      row.appendChild(descCell);

      table.appendChild(row);
    }

    content.appendChild(table);

    // Add tip at bottom
    var tip = document.createElement('p');
    tip.className = 'shortcuts-help-tip';
    tip.textContent = 'Tip: Press ? anytime to view these shortcuts';
    content.appendChild(tip);

    dialog.appendChild(content);
    overlay.appendChild(dialog);

    // Add to page
    document.body.appendChild(overlay);

    // Add active class after a brief delay for animation
    setTimeout(function() {
      overlay.classList.add('active');
    }, 10);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeShortcutsHelp();
      }
    });

    // Close on ESC key
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        closeShortcutsHelp();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Store handler for cleanup
    overlay.setAttribute('data-esc-handler', 'attached');
  }

  // Close keyboard shortcuts help
  function closeShortcutsHelp() {
    var overlay = document.getElementById('shortcutsHelpOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  // Initialize keyboard shortcuts
  function init() {
    document.addEventListener('keydown', handleKeydown);

    // Add click handler for help button
    var helpBtn = document.getElementById('keyboardShortcutsBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', showShortcutsHelp);
    }

    DEBUG.log('[SHORTCUTS] Keyboard shortcuts enabled. Press ? for help.');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.KeyboardShortcuts = {
    showHelp: showShortcutsHelp,
    showToast: showToast
  };

})();
