// performance-monitor-enhanced.js - Enhanced Performance Monitoring
// Tracks load times, calculation performance, and alerts on degradation
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  // Performance metrics storage
  var metrics = {
    pageLoad: {
      start: Date.now(),
      domReady: null,
      appInit: null,
      firstPaint: null,
      total: null
    },
    calculations: {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity
    },
    storage: {
      reads: 0,
      writes: 0,
      totalReadTime: 0,
      totalWriteTime: 0
    },
    memory: {
      usagePercent: 0,
      quotaMB: 0,
      usedMB: 0,
      lastCheck: null
    }
  };

  // Performance thresholds (for alerts)
  var thresholds = {
    pageLoadMs: 2000,      // Warn if page load > 2s
    calcTimeMs: 100,       // Warn if single calc > 100ms
    storageQuotaPct: 75,   // Warn if LocalStorage > 75% full
    memoryUsageMB: 50      // Warn if using > 50MB
  };

  // Alert history (prevent spam)
  var lastAlerts = {};

  /**
   * Mark page load milestones
   */
  function markPageLoadMilestone(milestone) {
    var now = Date.now();
    if (milestone === 'domReady') {
      metrics.pageLoad.domReady = now - metrics.pageLoad.start;
    } else if (milestone === 'appInit') {
      metrics.pageLoad.appInit = now - metrics.pageLoad.start;
    } else if (milestone === 'firstPaint') {
      metrics.pageLoad.firstPaint = now - metrics.pageLoad.start;
    } else if (milestone === 'complete') {
      metrics.pageLoad.total = now - metrics.pageLoad.start;
      checkThreshold('pageLoad', metrics.pageLoad.total, thresholds.pageLoadMs);
    }
  }

  /**
   * Track a calculation performance
   */
  function trackCalculation(name, duration) {
    metrics.calculations.count++;
    metrics.calculations.totalTime += duration;
    metrics.calculations.avgTime = metrics.calculations.totalTime / metrics.calculations.count;
    
    if (duration > metrics.calculations.maxTime) {
      metrics.calculations.maxTime = duration;
    }
    if (duration < metrics.calculations.minTime) {
      metrics.calculations.minTime = duration;
    }

    checkThreshold('calculation', duration, thresholds.calcTimeMs);
  }

  /**
   * Wrap a calculation function with performance tracking
   */
  function wrapCalculation(fn, name) {
    return function() {
      var start = Date.now();
      var result = fn.apply(this, arguments);
      var duration = Date.now() - start;
      trackCalculation(name || 'unknown', duration);
      return result;
    };
  }

  /**
   * Track storage operation
   */
  function trackStorageRead(duration) {
    metrics.storage.reads++;
    metrics.storage.totalReadTime += duration;
  }

  function trackStorageWrite(duration) {
    metrics.storage.writes++;
    metrics.storage.totalWriteTime += duration;
  }

  /**
   * Check LocalStorage quota usage
   */
  function checkStorageQuota() {
    if (!window.localStorage) {
      return;
    }

    try {
      var total = 0;
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }

      // Estimate 5MB quota (typical for iOS Safari)
      var quotaBytes = 5 * 1024 * 1024;
      var usedBytes = total * 2; // UTF-16 encoding (2 bytes per char)
      var usagePercent = (usedBytes / quotaBytes) * 100;

      metrics.memory.quotaMB = quotaBytes / (1024 * 1024);
      metrics.memory.usedMB = usedBytes / (1024 * 1024);
      metrics.memory.usagePercent = usagePercent;
      metrics.memory.lastCheck = new Date().toISOString();

      checkThreshold('storageQuota', usagePercent, thresholds.storageQuotaPct);

      return {
        usedMB: metrics.memory.usedMB.toFixed(2),
        quotaMB: metrics.memory.quotaMB,
        usagePercent: usagePercent.toFixed(1)
      };
    } catch (e) {
      console.error('[PERF-MONITOR] Storage quota check failed:', e);
      return null;
    }
  }

  /**
   * Check if a metric exceeds threshold and alert
   */
  function checkThreshold(metricName, value, threshold) {
    if (value > threshold) {
      var alertKey = metricName + '_' + Math.floor(value);
      var now = Date.now();

      // Only alert once per minute for same metric
      if (!lastAlerts[alertKey] || (now - lastAlerts[alertKey]) > 60000) {
        lastAlerts[alertKey] = now;
        
        var message = '[PERF-ALERT] ' + metricName + ' exceeded threshold: ' + 
                      value.toFixed(0) + ' > ' + threshold;
        
        if (console.warn) {
          console.warn(message);
        }

        // Dispatch custom event for external monitoring
        if (typeof CustomEvent !== 'undefined') {
          var event = new CustomEvent('performance:alert', {
            detail: {
              metric: metricName,
              value: value,
              threshold: threshold,
              timestamp: now
            }
          });
          window.dispatchEvent(event);
        }
      }
    }
  }

  /**
   * Get current performance report
   */
  function getReport() {
    var storageInfo = checkStorageQuota();
    
    return {
      pageLoad: metrics.pageLoad,
      calculations: {
        count: metrics.calculations.count,
        avgTime: metrics.calculations.avgTime.toFixed(2) + 'ms',
        maxTime: metrics.calculations.maxTime + 'ms',
        minTime: metrics.calculations.minTime === Infinity ? 'N/A' : metrics.calculations.minTime + 'ms'
      },
      storage: {
        reads: metrics.storage.reads,
        writes: metrics.storage.writes,
        avgReadTime: metrics.storage.reads > 0 ? 
          (metrics.storage.totalReadTime / metrics.storage.reads).toFixed(2) + 'ms' : 'N/A',
        avgWriteTime: metrics.storage.writes > 0 ? 
          (metrics.storage.totalWriteTime / metrics.storage.writes).toFixed(2) + 'ms' : 'N/A'
      },
      memory: storageInfo,
      thresholds: thresholds
    };
  }

  /**
   * Export metrics as JSON for logging/analytics
   */
  function exportMetrics() {
    return JSON.stringify(getReport(), null, 2);
  }

  /**
   * Reset all metrics
   */
  function reset() {
    metrics.calculations.count = 0;
    metrics.calculations.totalTime = 0;
    metrics.calculations.avgTime = 0;
    metrics.calculations.maxTime = 0;
    metrics.calculations.minTime = Infinity;
    
    metrics.storage.reads = 0;
    metrics.storage.writes = 0;
    metrics.storage.totalReadTime = 0;
    metrics.storage.totalWriteTime = 0;

    lastAlerts = {};
    
    console.log('[PERF-MONITOR] Metrics reset');
  }

  /**
   * Start monitoring (auto-track page load events)
   */
  function init() {
    // Track DOM ready
    if (document.readyState === 'complete') {
      markPageLoadMilestone('domReady');
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        markPageLoadMilestone('domReady');
      });
    }

    // Track window load
    window.addEventListener('load', function() {
      markPageLoadMilestone('complete');
    });

    // Track APP initialization
    document.addEventListener('app:initialized', function() {
      markPageLoadMilestone('appInit');
    });

    // Check storage quota periodically (every 5 minutes)
    setInterval(checkStorageQuota, 5 * 60 * 1000);
    checkStorageQuota(); // Initial check

    console.log('[PERF-MONITOR] Initialized - monitoring performance metrics');
  }

  // Public API
  var PerformanceMonitorEnhanced = {
    init: init,
    trackCalculation: trackCalculation,
    wrapCalculation: wrapCalculation,
    trackStorageRead: trackStorageRead,
    trackStorageWrite: trackStorageWrite,
    checkStorageQuota: checkStorageQuota,
    getReport: getReport,
    exportMetrics: exportMetrics,
    reset: reset,
    setThreshold: function(name, value) {
      if (thresholds.hasOwnProperty(name + 'Ms') || thresholds.hasOwnProperty(name + 'Pct') || thresholds.hasOwnProperty(name + 'MB')) {
        thresholds[name] = value;
      }
    }
  };

  // Register with APP if available
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('performanceMonitorEnhanced', PerformanceMonitorEnhanced);
  }

  // Global access
  window.PerformanceMonitorEnhanced = PerformanceMonitorEnhanced;

  // Auto-initialize
  init();

  console.log('[PERF-MONITOR] Enhanced performance monitoring loaded');
})();
