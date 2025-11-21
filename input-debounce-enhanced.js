// input-debounce-enhanced.js - Enhanced Input Debouncing System
// Centralized debouncing with configurable delays and smart batching
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  // Debounce configuration by input type
  var DEBOUNCE_CONFIG = {
    // Text inputs - longer delay for typing
    text: 400,
    search: 300,
    textarea: 500,
    
    // Numeric inputs - medium delay
    number: 250,
    currency: 250,
    
    // Select and checkbox - immediate or very short
    select: 50,
    checkbox: 0,
    radio: 0,
    
    // Custom delays for specific fields
    custom: {
      'clientNameInput': 400,
      'clientLocationInput': 400,
      'notesInput': 500,
      'hourlyRateInput': 250,
      'baseFeeInput': 250,
      'searchInput': 300
    }
  };

  // Active debounce timers
  var debounceTimers = {};
  
  // Batch update queue for related inputs
  var updateQueue = {};
  var batchTimer = null;

  /**
   * Enhanced debounce function with configurable options
   */
  function debounce(func, wait, options) {
    var timeout;
    var lastArgs;
    var lastThis;
    var maxWait = options && options.maxWait;
    var leading = options && options.leading;
    var trailing = options && options.trailing !== false; // Default true
    var maxing = maxWait !== undefined;
    var lastCallTime;
    var lastInvokeTime = 0;

    function invokeFunc(time) {
      var args = lastArgs;
      var thisArg = lastThis;

      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      return func.apply(thisArg, args);
    }

    function leadingEdge(time) {
      lastInvokeTime = time;
      timeout = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : undefined;
    }

    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime;
      var timeSinceLastInvoke = time - lastInvokeTime;
      var timeWaiting = wait - timeSinceLastCall;

      return maxing
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }

    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime;
      var timeSinceLastInvoke = time - lastInvokeTime;

      return (lastCallTime === undefined || 
              timeSinceLastCall >= wait ||
              timeSinceLastCall < 0 ||
              (maxing && timeSinceLastInvoke >= maxWait));
    }

    function timerExpired() {
      var time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timeout = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
      timeout = undefined;

      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return undefined;
    }

    function cancel() {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timeout = undefined;
    }

    function flush() {
      return timeout === undefined ? undefined : trailingEdge(Date.now());
    }

    function debounced() {
      var time = Date.now();
      var isInvoking = shouldInvoke(time);

      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timeout === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          timeout = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timeout === undefined) {
        timeout = setTimeout(timerExpired, wait);
      }
      return undefined;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }

  /**
   * Throttle function - ensures function is called at most once per interval
   */
  function throttle(func, wait, options) {
    var leading = true;
    var trailing = true;

    if (options) {
      leading = options.leading !== false;
      trailing = options.trailing !== false;
    }

    return debounce(func, wait, {
      leading: leading,
      maxWait: wait,
      trailing: trailing
    });
  }

  /**
   * Get optimal debounce delay for an input element
   */
  function getDebounceDelay(element) {
    // Check for custom delay on element
    if (element.dataset && element.dataset.debounceDelay) {
      return parseInt(element.dataset.debounceDelay, 10);
    }

    // Check for custom delay by ID
    if (element.id && DEBOUNCE_CONFIG.custom[element.id]) {
      return DEBOUNCE_CONFIG.custom[element.id];
    }

    // Determine by input type
    var type = element.type || 'text';
    var tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea') {
      return DEBOUNCE_CONFIG.textarea;
    }

    if (tagName === 'select') {
      return DEBOUNCE_CONFIG.select;
    }

    if (type === 'number' || element.classList.contains('currency-input')) {
      return DEBOUNCE_CONFIG.number;
    }

    if (type === 'checkbox' || type === 'radio') {
      return DEBOUNCE_CONFIG.checkbox;
    }

    if (element.classList.contains('search-input')) {
      return DEBOUNCE_CONFIG.search;
    }

    return DEBOUNCE_CONFIG.text;
  }

  /**
   * Apply debouncing to an input element
   */
  function applyDebounce(element, callback, customDelay) {
    var delay = customDelay !== undefined ? customDelay : getDebounceDelay(element);
    var elementId = element.id || 'element_' + Math.random().toString(36).substr(2, 9);

    // Cancel existing debounce if any
    if (debounceTimers[elementId]) {
      debounceTimers[elementId].cancel();
    }

    // Create debounced callback
    var debouncedCallback = debounce(callback, delay, {
      trailing: true,
      leading: false
    });

    debounceTimers[elementId] = debouncedCallback;

    // For change events, execute immediately
    element.addEventListener('change', function() {
      debouncedCallback.flush();
    });

    return debouncedCallback;
  }

  /**
   * Batch updates for related inputs
   */
  function batchUpdate(groupId, callback) {
    if (!updateQueue[groupId]) {
      updateQueue[groupId] = [];
    }

    updateQueue[groupId].push(callback);

    // Clear existing batch timer
    if (batchTimer) {
      clearTimeout(batchTimer);
    }

    // Schedule batch execution
    batchTimer = setTimeout(function() {
      Object.keys(updateQueue).forEach(function(gid) {
        var callbacks = updateQueue[gid];
        
        // Execute all callbacks in the group
        callbacks.forEach(function(cb) {
          try {
            cb();
          } catch (e) {
            console.error('[DEBOUNCE] Batch callback error:', e);
          }
        });
      });

      // Clear queue
      updateQueue = {};
      batchTimer = null;
    }, 50); // Very short delay for batching
  }

  /**
   * Auto-apply debouncing to all inputs in a container
   */
  function autoApplyDebouncing(container, callback) {
    container = container || document;
    
    var inputs = container.querySelectorAll('input, textarea, select');
    var appliedCount = 0;

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      
      // Skip if already has debounced listener
      if (input.dataset.debounced === 'true') {
        continue;
      }

      // Skip certain types
      var type = input.type || 'text';
      if (type === 'submit' || type === 'button' || type === 'hidden') {
        continue;
      }

      var debouncedHandler = applyDebounce(input, function() {
        if (callback) {
          callback.call(input);
        } else if (window.APP && window.APP.recalculate) {
          window.APP.recalculate();
        }
      });

      input.addEventListener('input', debouncedHandler);
      input.dataset.debounced = 'true';
      appliedCount++;
    }

    console.log('[DEBOUNCE] Applied debouncing to ' + appliedCount + ' input(s)');
    return appliedCount;
  }

  /**
   * Cancel all pending debounced operations
   */
  function cancelAll() {
    Object.keys(debounceTimers).forEach(function(key) {
      if (debounceTimers[key] && debounceTimers[key].cancel) {
        debounceTimers[key].cancel();
      }
    });
    debounceTimers = {};
    
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
    updateQueue = {};
  }

  /**
   * Flush all pending debounced operations
   */
  function flushAll() {
    Object.keys(debounceTimers).forEach(function(key) {
      if (debounceTimers[key] && debounceTimers[key].flush) {
        debounceTimers[key].flush();
      }
    });
  }

  /**
   * Get debounce statistics
   */
  function getStats() {
    return {
      activeTimers: Object.keys(debounceTimers).length,
      queuedUpdates: Object.keys(updateQueue).reduce(function(sum, key) {
        return sum + updateQueue[key].length;
      }, 0),
      hasBatchTimer: batchTimer !== null
    };
  }

  /**
   * Configure debounce delays
   */
  function configure(config) {
    if (config.text !== undefined) DEBOUNCE_CONFIG.text = config.text;
    if (config.search !== undefined) DEBOUNCE_CONFIG.search = config.search;
    if (config.textarea !== undefined) DEBOUNCE_CONFIG.textarea = config.textarea;
    if (config.number !== undefined) DEBOUNCE_CONFIG.number = config.number;
    if (config.currency !== undefined) DEBOUNCE_CONFIG.currency = config.currency;
    
    if (config.custom) {
      Object.keys(config.custom).forEach(function(key) {
        DEBOUNCE_CONFIG.custom[key] = config.custom[key];
      });
    }
  }

  // Public API
  var InputDebounceEnhanced = {
    debounce: debounce,
    throttle: throttle,
    applyDebounce: applyDebounce,
    autoApply: autoApplyDebouncing,
    batchUpdate: batchUpdate,
    cancelAll: cancelAll,
    flushAll: flushAll,
    getStats: getStats,
    configure: configure,
    getDelay: getDebounceDelay,
    config: DEBOUNCE_CONFIG
  };

  // Register with APP if available
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('inputDebounceEnhanced', InputDebounceEnhanced);
  }

  // Global access
  window.InputDebounceEnhanced = InputDebounceEnhanced;

  console.log('[INPUT-DEBOUNCE] Enhanced input debouncing system loaded');

})();
