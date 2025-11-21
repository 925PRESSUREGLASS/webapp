// calculation-optimizer.js - Smart Calculation Optimization
// Reduces unnecessary recalculations with memoization and change detection
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  // Cache for calculation results
  var calculationCache = {};
  
  // Track input state for change detection
  var lastInputState = {};
  
  // Statistics
  var stats = {
    totalCalculations: 0,
    cachedCalculations: 0,
    skippedCalculations: 0,
    cacheHitRate: 0
  };

  /**
   * Generate cache key from input values
   */
  function generateCacheKey(inputs) {
    var keys = Object.keys(inputs).sort();
    var values = keys.map(function(key) {
      return key + '=' + String(inputs[key]);
    });
    return values.join('|');
  }

  /**
   * Check if inputs have actually changed
   */
  function hasInputsChanged(currentInputs, namespace) {
    namespace = namespace || 'default';
    var lastState = lastInputState[namespace];
    
    if (!lastState) {
      return true;
    }

    var keys = Object.keys(currentInputs);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (currentInputs[key] !== lastState[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Memoized calculation wrapper
   */
  function memoize(fn, options) {
    options = options || {};
    var cacheSize = options.cacheSize || 100;
    var ttl = options.ttl || 5000; // 5 seconds default TTL
    var namespace = options.namespace || 'default';
    
    var cache = {};
    var cacheKeys = [];

    return function() {
      var args = Array.prototype.slice.call(arguments);
      var key = generateCacheKey(args);
      var now = Date.now();

      // Check cache
      if (cache[key]) {
        var entry = cache[key];
        
        // Check if expired
        if (now - entry.timestamp < ttl) {
          stats.cachedCalculations++;
          stats.cacheHitRate = stats.cachedCalculations / stats.totalCalculations;
          return entry.result;
        } else {
          // Expired, remove from cache
          delete cache[key];
          var index = cacheKeys.indexOf(key);
          if (index !== -1) {
            cacheKeys.splice(index, 1);
          }
        }
      }

      // Calculate
      stats.totalCalculations++;
      var result = fn.apply(this, args);

      // Store in cache
      cache[key] = {
        result: result,
        timestamp: now
      };
      cacheKeys.push(key);

      // Evict oldest if cache is full
      if (cacheKeys.length > cacheSize) {
        var oldestKey = cacheKeys.shift();
        delete cache[oldestKey];
      }

      stats.cacheHitRate = stats.cachedCalculations / stats.totalCalculations;
      return result;
    };
  }

  /**
   * Smart recalculate - only recalculate if inputs changed
   */
  function smartRecalculate(calculateFn, getInputsFn, namespace) {
    namespace = namespace || 'default';
    
    return function() {
      var currentInputs = getInputsFn ? getInputsFn() : {};
      
      // Check if inputs actually changed
      if (!hasInputsChanged(currentInputs, namespace)) {
        stats.skippedCalculations++;
        return false; // Skipped
      }

      // Update last state
      lastInputState[namespace] = currentInputs;

      // Perform calculation
      if (calculateFn) {
        calculateFn();
      }

      return true; // Calculated
    };
  }

  /**
   * Collect current input values from DOM
   */
  function collectInputValues(inputIds) {
    var values = {};
    
    inputIds.forEach(function(id) {
      var element = document.getElementById(id);
      if (element) {
        values[id] = element.value || '';
      }
    });

    return values;
  }

  /**
   * Batch calculations for related operations
   */
  function batchCalculate(calculations, delay) {
    delay = delay || 100;
    var batchTimer = null;
    var pendingCalculations = [];

    return function(calculationId) {
      if (calculationId && pendingCalculations.indexOf(calculationId) === -1) {
        pendingCalculations.push(calculationId);
      }

      if (batchTimer) {
        clearTimeout(batchTimer);
      }

      batchTimer = setTimeout(function() {
        // Execute all pending calculations
        pendingCalculations.forEach(function(id) {
          if (calculations[id]) {
            try {
              calculations[id]();
            } catch (e) {
              console.error('[CALC-OPTIMIZER] Calculation error:', id, e);
            }
          }
        });

        pendingCalculations = [];
        batchTimer = null;
      }, delay);
    };
  }

  /**
   * Optimize APP.recalculate if available
   */
  function optimizeAppRecalculate() {
    if (!window.APP || typeof window.APP.recalculate !== 'function') {
      return false;
    }

    var originalRecalculate = window.APP.recalculate;
    var inputIds = [
      'baseFeeInput',
      'hourlyRateInput',
      'minimumJobInput',
      'highReachModifierInput',
      'insideMultiplierInput',
      'outsideMultiplierInput',
      'pressureHourlyRateInput',
      'setupBufferMinutesInput',
      'clientNameInput',
      'clientLocationInput'
    ];

    // Create smart recalculate
    var smartRecalc = smartRecalculate(
      originalRecalculate,
      function() {
        return collectInputValues(inputIds);
      },
      'app-recalculate'
    );

    // Replace APP.recalculate
    window.APP.recalculate = function() {
      var calculated = smartRecalc();
      
      if (!calculated && window.DEBUG) {
        console.log('[CALC-OPTIMIZER] Skipped recalculation - no input changes');
      }
    };

    console.log('[CALC-OPTIMIZER] Optimized APP.recalculate');
    return true;
  }

  /**
   * Wrap calculation-heavy functions
   */
  function wrapCalculation(fn, name, options) {
    var wrapped = memoize(fn, options);
    var namespace = 'calc_' + (name || 'unnamed');

    return function() {
      if (window.PerformanceMonitorEnhanced) {
        return window.PerformanceMonitorEnhanced.wrapCalculation(wrapped, name).apply(this, arguments);
      }
      return wrapped.apply(this, arguments);
    };
  }

  /**
   * Clear all caches
   */
  function clearCache() {
    calculationCache = {};
    lastInputState = {};
    console.log('[CALC-OPTIMIZER] Caches cleared');
  }

  /**
   * Get optimization statistics
   */
  function getStats() {
    return {
      totalCalculations: stats.totalCalculations,
      cachedCalculations: stats.cachedCalculations,
      skippedCalculations: stats.skippedCalculations,
      cacheHitRate: (stats.cacheHitRate * 100).toFixed(1) + '%',
      savings: stats.skippedCalculations + stats.cachedCalculations,
      savingsPercent: stats.totalCalculations > 0 ? 
        (((stats.skippedCalculations + stats.cachedCalculations) / stats.totalCalculations) * 100).toFixed(1) + '%' : 
        '0%'
    };
  }

  /**
   * Initialize optimizations
   */
  function init() {
    // Optimize APP.recalculate if available
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          optimizeAppRecalculate();
        }, 1000);
      });
    } else {
      setTimeout(function() {
        optimizeAppRecalculate();
      }, 1000);
    }

    console.log('[CALC-OPTIMIZER] Calculation optimizer initialized');
  }

  // Public API
  var CalculationOptimizer = {
    memoize: memoize,
    smartRecalculate: smartRecalculate,
    batchCalculate: batchCalculate,
    wrapCalculation: wrapCalculation,
    collectInputValues: collectInputValues,
    clearCache: clearCache,
    getStats: getStats,
    init: init,
    optimizeAppRecalculate: optimizeAppRecalculate
  };

  // Register with APP if available
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('calculationOptimizer', CalculationOptimizer);
  }

  // Global access
  window.CalculationOptimizer = CalculationOptimizer;

  // Auto-initialize
  init();

  console.log('[CALC-OPTIMIZER] Calculation optimization module loaded');

})();
