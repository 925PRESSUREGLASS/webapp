// error-handler.js - Comprehensive error handling and user feedback
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // LocalStorage quota checker
  function checkLocalStorageQuota() {
    try {
      var testKey = '__quota_test__';
      var data = new Array(1024).join('a'); // 1KB
      var used = 0;

      // Test current usage
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Convert to MB
      var usedMB = (used / 1024 / 1024).toFixed(2);
      var limitMB = 5; // Most browsers limit to 5-10MB

      // Warn if over 80% capacity
      if (used > (limitMB * 1024 * 1024 * 0.8)) {
        showWarning('Storage nearly full (' + usedMB + 'MB used). Consider exporting old quotes.');
        return false;
      }

      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        showError('Storage quota exceeded! Please export and delete old quotes.');
        return false;
      }
      return true;
    }
  }

  // Wrap localStorage operations with error handling
  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        showError('Cannot save: Storage quota exceeded. Please export quotes and clear old data.');
        return false;
      } else if (e.name === 'SecurityError') {
        showError('Cannot save: Storage blocked by browser settings.');
        return false;
      } else {
        showError('Failed to save: ' + e.message);
        return false;
      }
    }
  }

  function safeLocalStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      showError('Failed to load data: ' + e.message);
      return null;
    }
  }

  // Form validation
  function validateNumber(value, min, max, fieldName) {
    var num = parseFloat(value);

    if (isNaN(num)) {
      showWarning(fieldName + ' must be a valid number');
      return false;
    }

    if (min !== undefined && num < min) {
      showWarning(fieldName + ' must be at least ' + min);
      return false;
    }

    if (max !== undefined && num > max) {
      showWarning(fieldName + ' cannot exceed ' + max);
      return false;
    }

    return true;
  }

  // Validate quote before export
  function validateQuote(state) {
    var errors = [];

    if (!state.quoteTitle || state.quoteTitle.trim() === '') {
      errors.push('Quote title is empty');
    }

    if (!state.clientName || state.clientName.trim() === '') {
      errors.push('Client name is empty');
    }

    var hasLines = (state.windowLines && state.windowLines.length > 0) ||
                   (state.pressureLines && state.pressureLines.length > 0);

    if (!hasLines) {
      errors.push('No line items added');
    }

    if (errors.length > 0) {
      showWarning('Quote validation:\n' + errors.join('\n'));
      return false;
    }

    return true;
  }

  // Network status monitoring
  var isOnline = navigator.onLine;

  function updateOnlineStatus() {
    isOnline = navigator.onLine;
    if (!isOnline) {
      showInfo('Working offline - Changes will be saved locally');
    }
  }

  window.addEventListener('online', function() {
    isOnline = true;
    showInfo('Back online');
  });

  window.addEventListener('offline', function() {
    isOnline = false;
    showWarning('No internet connection - Working offline');
  });

  // Global error handler
  window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);

    // Don't show toast for script loading errors
    if (event.filename) {
      return;
    }

    showError('An unexpected error occurred. Please refresh the page.');
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An error occurred: ' + (event.reason.message || event.reason));
  });

  // Helper functions for toast notifications
  function showError(message) {
    if (window.KeyboardShortcuts && window.KeyboardShortcuts.showToast) {
      window.KeyboardShortcuts.showToast(message, 'error');
    } else {
      console.error(message);
      alert('Error: ' + message);
    }
  }

  function showWarning(message) {
    if (window.KeyboardShortcuts && window.KeyboardShortcuts.showToast) {
      window.KeyboardShortcuts.showToast(message, 'warning');
    } else {
      console.warn(message);
      alert('Warning: ' + message);
    }
  }

  function showInfo(message) {
    if (window.KeyboardShortcuts && window.KeyboardShortcuts.showToast) {
      window.KeyboardShortcuts.showToast(message, 'info');
    } else {
      console.info(message);
    }
  }

  function showSuccess(message) {
    if (window.KeyboardShortcuts && window.KeyboardShortcuts.showToast) {
      window.KeyboardShortcuts.showToast(message, 'success');
    } else {
      console.log(message);
    }
  }

  // Input field validation on blur
  function setupFieldValidation() {
    // Number inputs
    var numberInputs = document.querySelectorAll('input[type="number"]');
    for (var i = 0; i < numberInputs.length; i++) {
      numberInputs[i].addEventListener('blur', function(event) {
        var input = event.target;
        var value = parseFloat(input.value);
        var min = parseFloat(input.getAttribute('min'));
        var max = parseFloat(input.getAttribute('max'));
        var label = input.parentElement.querySelector('.field-label');
        var fieldName = label ? label.textContent : 'This field';

        if (isNaN(value)) {
          showWarning(fieldName + ' must be a number');
          input.value = input.defaultValue || min || 0;
          return;
        }

        if (!isNaN(min) && value < min) {
          showWarning(fieldName + ' must be at least ' + min);
          input.value = min;
        }

        if (!isNaN(max) && value > max) {
          showWarning(fieldName + ' cannot exceed ' + max);
          input.value = max;
        }
      });
    }

    // Check storage on page load
    checkLocalStorageQuota();

    // Check storage periodically (every 5 minutes)
    setInterval(checkLocalStorageQuota, 5 * 60 * 1000);
  }

  // Initialize
  function init() {
    updateOnlineStatus();
    setupFieldValidation();
    DEBUG.log('[ERROR-HANDLER] Error handling initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.ErrorHandler = {
    showError: showError,
    showWarning: showWarning,
    showInfo: showInfo,
    showSuccess: showSuccess,
    validateQuote: validateQuote,
    validateNumber: validateNumber,
    checkQuota: checkLocalStorageQuota,
    safeSetItem: safeLocalStorageSet,
    safeGetItem: safeLocalStorageGet,
    isOnline: function() { return isOnline; }
  };

})();
