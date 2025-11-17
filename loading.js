// loading.js - Loading states for async operations
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var loadingOverlay = null;

  // Create loading overlay
  function createOverlay() {
    if (loadingOverlay) return loadingOverlay;

    var overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML =
      '<div class="loading-spinner">' +
        '<div class="spinner-ring"></div>' +
        '<div class="loading-text">Processing...</div>' +
      '</div>';

    document.body.appendChild(overlay);
    loadingOverlay = overlay;
    return overlay;
  }

  // Show loading overlay
  function show(message) {
    var overlay = createOverlay();
    var textEl = overlay.querySelector('.loading-text');
    if (textEl && message) {
      textEl.textContent = message;
    }
    overlay.classList.add('loading-overlay-visible');
    document.body.style.overflow = 'hidden';
  }

  // Hide loading overlay
  function hide() {
    if (loadingOverlay) {
      loadingOverlay.classList.remove('loading-overlay-visible');
      document.body.style.overflow = '';
    }
  }

  // Show loading for a specific element
  function showElement(elementId, message) {
    var element = document.getElementById(elementId);
    if (!element) return;

    var loader = document.createElement('div');
    loader.className = 'element-loader';
    loader.innerHTML =
      '<div class="element-spinner"></div>' +
      '<div class="element-loader-text">' + (message || 'Loading...') + '</div>';

    element.style.position = 'relative';
    element.appendChild(loader);
  }

  // Hide element loading
  function hideElement(elementId) {
    var element = document.getElementById(elementId);
    if (!element) return;

    var loader = element.querySelector('.element-loader');
    if (loader) {
      element.removeChild(loader);
    }
  }

  // Wrap async function with loading state
  function withLoading(asyncFn, message) {
    return function() {
      show(message || 'Processing...');

      var args = Array.prototype.slice.call(arguments);
      var result = asyncFn.apply(this, args);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.then(function(value) {
          hide();
          return value;
        }).catch(function(error) {
          hide();
          throw error;
        });
      }

      // Handle callbacks (setTimeout style)
      setTimeout(hide, 100);
      return result;
    };
  }

  // Button loading state
  function setButtonLoading(buttonId, isLoading) {
    var button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.setAttribute('data-original-text', button.textContent);
      button.innerHTML = '<span class="btn-spinner"></span> Processing...';
      button.classList.add('btn-loading');
    } else {
      button.disabled = false;
      var originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
      }
      button.classList.remove('btn-loading');
    }
  }

  // Initialize
  function init() {
    DEBUG.log('[LOADING] Loading states initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.LoadingState = {
    show: show,
    hide: hide,
    showElement: showElement,
    hideElement: hideElement,
    withLoading: withLoading,
    setButtonLoading: setButtonLoading
  };

})();
