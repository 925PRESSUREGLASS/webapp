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

    var helpText = [
      'KEYBOARD SHORTCUTS',
      '',
      modKey + ' + S - Save preset',
      modKey + ' + W - Add window line',
      modKey + ' + P - Add pressure line',
      modKey + ' + E - Export to PDF',
      modKey + ' + Shift + C - Copy summary',
      modKey + ' + Shift + W - Window wizard',
      modKey + ' + Shift + P - Pressure wizard',
      modKey + ' + 1 - Toggle settings',
      modKey + ' + T - Focus quote title',
      'ESC - Close modal',
      '? - Show this help'
    ].join('\n');

    alert(helpText);
  }

  // Initialize keyboard shortcuts
  function init() {
    document.addEventListener('keydown', handleKeydown);
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
