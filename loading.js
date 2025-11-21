// loading.js - Loading states for async operations
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var loadingOverlay = null;
  var overlayMessageEl = null;
  var overlayAnnouncer = null;

  function normalizeOptions(input, fallbackMessage) {
    var opts = {
      message: fallbackMessage || 'Processing...',
      reducedMotion: false
    };

    if (typeof input === 'string') {
      opts.message = input;
    } else if (input && typeof input === 'object') {
      if (input.message) opts.message = input.message;
      if (input.reducedMotion) opts.reducedMotion = true;
    }

    var mediaReduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaReduce && mediaReduce.matches) {
      opts.reducedMotion = true;
    }

    return opts;
  }

  // Create loading overlay
  function createOverlay() {
    if (loadingOverlay) return loadingOverlay;

    var overlay = document.createElement('div');
    overlay.className = 'loading-overlay';

    var spinnerWrap = document.createElement('div');
    spinnerWrap.className = 'loading-overlay__panel';

    var spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    var spinnerRing = document.createElement('div');
    spinnerRing.className = 'spinner-ring';
    spinner.appendChild(spinnerRing);

    var text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = 'Processing...';
    overlayMessageEl = text;

    var announcer = document.createElement('div');
    announcer.className = 'loading-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.textContent = 'Processing...';
    overlayAnnouncer = announcer;

    spinnerWrap.appendChild(spinner);
    spinnerWrap.appendChild(text);
    spinnerWrap.appendChild(announcer);

    overlay.appendChild(spinnerWrap);

    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.setAttribute('aria-busy', 'false');

    document.body.appendChild(overlay);
    loadingOverlay = overlay;
    return overlay;
  }

  // Show loading overlay
  function show(message) {
    var opts = normalizeOptions(message, 'Processing...');
    var overlay = createOverlay();
    if (overlayMessageEl) overlayMessageEl.textContent = opts.message;
    if (overlayAnnouncer) overlayAnnouncer.textContent = opts.message;
    if (opts.reducedMotion) {
      overlay.classList.add('loading-reduced-motion');
    } else {
      overlay.classList.remove('loading-reduced-motion');
    }
    overlay.classList.add('loading-overlay-visible');
    overlay.setAttribute('aria-busy', 'true');
    document.body.style.overflow = 'hidden';
  }

  // Hide loading overlay
  function hide() {
    if (loadingOverlay) {
      loadingOverlay.classList.remove('loading-overlay-visible');
      loadingOverlay.classList.remove('loading-reduced-motion');
      loadingOverlay.setAttribute('aria-busy', 'false');
      document.body.style.overflow = '';
    }
  }

  // Show loading for a specific element
  function showElement(elementId, message) {
    var element =
      typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!element) return;

    var opts = normalizeOptions(message, 'Loading...');

    var existing = element.querySelector('.element-loader');
    if (existing) {
      element.removeChild(existing);
    }

    var loader = document.createElement('div');
    loader.className = 'element-loader';

    var spinner = document.createElement('div');
    spinner.className = 'element-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    var text = document.createElement('div');
    text.className = 'element-loader-text';
    text.textContent = opts.message;

    var sr = document.createElement('div');
    sr.className = 'loading-announcer';
    sr.setAttribute('role', 'status');
    sr.setAttribute('aria-live', 'polite');
    sr.textContent = opts.message;

    loader.appendChild(spinner);
    loader.appendChild(text);
    loader.appendChild(sr);

    if (opts.reducedMotion) {
      loader.classList.add('loading-reduced-motion');
    }

    element.style.position = 'relative';
    element.setAttribute('aria-busy', 'true');
    element.appendChild(loader);
  }

  // Hide element loading
  function hideElement(elementId) {
    var element =
      typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!element) return;

    var loader = element.querySelector('.element-loader');
    if (loader) {
      element.removeChild(loader);
    }
    element.removeAttribute('aria-busy');
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
    var button =
      typeof buttonId === 'string' ? document.getElementById(buttonId) : buttonId;
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      if (!button.getAttribute('data-original-text')) {
        button.setAttribute('data-original-text', button.textContent);
      }
      button.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span class="btn-loading-text">Processing...</span>';
      button.classList.add('btn-loading');
      button.setAttribute('aria-busy', 'true');
    } else {
      button.disabled = false;
      var originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
      }
      button.classList.remove('btn-loading');
      button.removeAttribute('aria-busy');
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
