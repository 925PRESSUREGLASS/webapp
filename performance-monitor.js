// performance-monitor.js - ES5 Performance Measurement Tool
// Paste-ready script to measure TicTacStick performance
// NO build tools required - works in iOS Safari 12+

(function() {
  'use strict';

  // Performance metrics storage
  var metrics = {
    loadTime: {},
    calculationTime: [],
    storageIO: {},
    memoryUsage: {}
  };

  // ===================================
  // 1. INITIAL LOAD TIME MEASUREMENT
  // ===================================

  function measureLoadTime() {
    if (!window.performance || !window.performance.timing) {
      console.warn('Performance API not available');
      return null;
    }

    var timing = window.performance.timing;
    var navigationStart = timing.navigationStart;

    var loadMetrics = {
      // DNS lookup
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,

      // TCP connection
      tcpTime: timing.connectEnd - timing.connectStart,

      // Time to first byte
      ttfb: timing.responseStart - navigationStart,

      // DOM content loaded (app is interactive)
      domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,

      // Fully loaded (all resources)
      fullyLoaded: timing.loadEventEnd - navigationStart,

      // DOM processing
      domProcessing: timing.domComplete - timing.domLoading,

      // JavaScript parse and execution
      jsExecutionTime: timing.domComplete - timing.domContentLoadedEventStart
    };

    metrics.loadTime = loadMetrics;
    return loadMetrics;
  }

  // ===================================
  // 2. CALCULATION PERFORMANCE
  // ===================================

  function measureCalculation(calculationFunction) {
    var startTime = performance.now();

    // Run the calculation
    var result = calculationFunction();

    var endTime = performance.now();
    var duration = endTime - startTime;

    // Store measurement
    metrics.calculationTime.push({
      timestamp: Date.now(),
      duration: duration,
      type: 'calculation'
    });

    // Warn if slow
    if (duration > 50) {
      console.warn('SLOW CALCULATION: ' + duration.toFixed(2) + 'ms (target: <50ms)');
    }

    return {
      result: result,
      duration: duration
    };
  }

  // Wrapper for APP.modules.calc.calculateTotals
  function wrapCalculationFunction() {
    if (!window.APP || !APP.modules || !APP.modules.calc) {
      console.warn('APP.modules.calc not available yet');
      return;
    }

    var originalCalc = APP.modules.calc.calculateTotals;

    APP.modules.calc.calculateTotals = function(state) {
      return measureCalculation(function() {
        return originalCalc(state);
      }).result;
    };

    console.log('✓ Calculation performance monitoring enabled');
  }

  // ===================================
  // 3. LOCALSTORAGE I/O MEASUREMENT
  // ===================================

  function measureStorageRead(key) {
    var startTime = performance.now();
    var data = localStorage.getItem(key);
    var endTime = performance.now();
    var duration = endTime - startTime;

    var sizeBytes = data ? data.length : 0;
    var sizeKB = (sizeBytes / 1024).toFixed(2);

    metrics.storageIO.read = metrics.storageIO.read || [];
    metrics.storageIO.read.push({
      key: key,
      duration: duration,
      sizeKB: sizeKB
    });

    if (duration > 10) {
      console.warn('SLOW STORAGE READ: ' + duration.toFixed(2) + 'ms for ' + sizeKB + 'KB');
    }

    return data;
  }

  function measureStorageWrite(key, value) {
    var sizeBytes = value.length;
    var sizeKB = (sizeBytes / 1024).toFixed(2);

    var startTime = performance.now();

    try {
      localStorage.setItem(key, value);
      var endTime = performance.now();
      var duration = endTime - startTime;

      metrics.storageIO.write = metrics.storageIO.write || [];
      metrics.storageIO.write.push({
        key: key,
        duration: duration,
        sizeKB: sizeKB
      });

      if (duration > 20) {
        console.warn('SLOW STORAGE WRITE: ' + duration.toFixed(2) + 'ms for ' + sizeKB + 'KB');
      }

      return true;
    } catch (e) {
      console.error('Storage write failed:', e);
      return false;
    }
  }

  // Get total localStorage usage
  function getStorageUsage() {
    var totalBytes = 0;
    var itemCount = 0;
    var breakdown = {};

    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        var value = localStorage.getItem(key);
        var bytes = value.length;
        totalBytes += bytes;
        itemCount++;

        breakdown[key] = {
          sizeKB: (bytes / 1024).toFixed(2),
          sizeMB: (bytes / 1024 / 1024).toFixed(2)
        };
      }
    }

    metrics.storageIO.usage = {
      totalMB: (totalBytes / 1024 / 1024).toFixed(2),
      totalKB: (totalBytes / 1024).toFixed(2),
      itemCount: itemCount,
      breakdown: breakdown
    };

    return metrics.storageIO.usage;
  }

  // ===================================
  // 4. MEMORY USAGE (approximate)
  // ===================================

  function measureMemory() {
    // Check if Performance Memory API is available (Chrome only)
    if (performance.memory) {
      metrics.memoryUsage = {
        usedJSHeapMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        totalJSHeapMB: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limitMB: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      };
    } else {
      // Estimate based on localStorage + DOM
      var storageUsage = getStorageUsage();
      metrics.memoryUsage = {
        estimatedStorageMB: storageUsage.totalMB,
        note: 'Precise memory API not available in this browser'
      };
    }

    return metrics.memoryUsage;
  }

  // ===================================
  // 5. COMPREHENSIVE REPORT
  // ===================================

  function generateReport() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  🎯 TICTACSTICK PERFORMANCE REPORT');
    console.log('═══════════════════════════════════════════════');
    console.log('\n');

    // Load time metrics
    if (metrics.loadTime.fullyLoaded) {
      console.log('📊 LOAD TIME METRICS:');
      console.log('  • DOM Content Loaded: ' + metrics.loadTime.domContentLoaded + 'ms');
      console.log('  • Fully Loaded: ' + metrics.loadTime.fullyLoaded + 'ms');
      console.log('  • Time to First Byte: ' + metrics.loadTime.ttfb + 'ms');
      console.log('  • JavaScript Execution: ' + metrics.loadTime.jsExecutionTime + 'ms');
      console.log('  • Target: <1500ms DOMContentLoaded ✓');
      console.log('\n');
    }

    // Calculation metrics
    if (metrics.calculationTime.length > 0) {
      var calcTimes = metrics.calculationTime.map(function(m) { return m.duration; });
      var avgCalc = calcTimes.reduce(function(a, b) { return a + b; }, 0) / calcTimes.length;
      var maxCalc = Math.max.apply(null, calcTimes);

      console.log('⚡ CALCULATION PERFORMANCE:');
      console.log('  • Measurements: ' + metrics.calculationTime.length);
      console.log('  • Average: ' + avgCalc.toFixed(2) + 'ms');
      console.log('  • Max: ' + maxCalc.toFixed(2) + 'ms');
      console.log('  • Target: <50ms ' + (avgCalc < 50 ? '✓' : '✗ NEEDS OPTIMIZATION'));
      console.log('\n');
    }

    // Storage metrics
    var usage = getStorageUsage();
    console.log('💾 LOCALSTORAGE USAGE:');
    console.log('  • Total Size: ' + usage.totalMB + ' MB');
    console.log('  • Items: ' + usage.itemCount);
    console.log('  • Target: <3MB ' + (parseFloat(usage.totalMB) < 3 ? '✓' : '✗ CLEANUP NEEDED'));

    // Show largest items
    var items = Object.keys(usage.breakdown).map(function(key) {
      return { key: key, size: parseFloat(usage.breakdown[key].sizeKB) };
    }).sort(function(a, b) { return b.size - a.size; });

    console.log('\n  Largest items:');
    items.slice(0, 5).forEach(function(item) {
      console.log('    • ' + item.key + ': ' + item.size + ' KB');
    });
    console.log('\n');

    // Memory metrics
    var memory = measureMemory();
    console.log('🧠 MEMORY USAGE:');
    if (memory.usedJSHeapMB) {
      console.log('  • Used Heap: ' + memory.usedJSHeapMB + ' MB');
      console.log('  • Total Heap: ' + memory.totalJSHeapMB + ' MB');
      console.log('  • Limit: ' + memory.limitMB + ' MB');
    } else {
      console.log('  • Estimated (localStorage): ' + memory.estimatedStorageMB + ' MB');
      console.log('  • ' + memory.note);
    }
    console.log('\n');

    console.log('═══════════════════════════════════════════════');
    console.log('  Run PerformanceMonitor.export() to save data');
    console.log('═══════════════════════════════════════════════');
    console.log('\n');

    return metrics;
  }

  // ===================================
  // 6. LIGHTHOUSE-STYLE SCORING
  // ===================================

  function calculateScore() {
    var score = 100;
    var issues = [];

    // Load time scoring
    if (metrics.loadTime.domContentLoaded) {
      if (metrics.loadTime.domContentLoaded > 2000) {
        score -= 20;
        issues.push('Slow load time: ' + metrics.loadTime.domContentLoaded + 'ms');
      } else if (metrics.loadTime.domContentLoaded > 1500) {
        score -= 10;
        issues.push('Moderate load time: ' + metrics.loadTime.domContentLoaded + 'ms');
      }
    }

    // Calculation time scoring
    if (metrics.calculationTime.length > 0) {
      var calcTimes = metrics.calculationTime.map(function(m) { return m.duration; });
      var avgCalc = calcTimes.reduce(function(a, b) { return a + b; }, 0) / calcTimes.length;

      if (avgCalc > 100) {
        score -= 25;
        issues.push('Very slow calculations: ' + avgCalc.toFixed(2) + 'ms avg');
      } else if (avgCalc > 50) {
        score -= 15;
        issues.push('Slow calculations: ' + avgCalc.toFixed(2) + 'ms avg');
      }
    }

    // Storage scoring
    var usage = getStorageUsage();
    var sizeMB = parseFloat(usage.totalMB);

    if (sizeMB > 5) {
      score -= 20;
      issues.push('Excessive storage: ' + sizeMB + 'MB');
    } else if (sizeMB > 3) {
      score -= 10;
      issues.push('High storage: ' + sizeMB + 'MB');
    }

    return {
      score: Math.max(0, score),
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
      issues: issues
    };
  }

  // ===================================
  // PUBLIC API
  // ===================================

  window.PerformanceMonitor = {
    // Manual measurement functions
    measureCalculation: measureCalculation,
    measureStorageRead: measureStorageRead,
    measureStorageWrite: measureStorageWrite,

    // Automatic monitoring
    startMonitoring: function() {
      // Measure load time on next event loop
      setTimeout(measureLoadTime, 0);

      // Wrap calculation function
      if (document.readyState === 'complete') {
        wrapCalculationFunction();
      } else {
        window.addEventListener('load', wrapCalculationFunction);
      }

      console.log('✓ Performance monitoring started');
    },

    // Generate reports
    report: generateReport,
    score: calculateScore,

    // Export data
    export: function() {
      var report = {
        timestamp: new Date().toISOString(),
        metrics: metrics,
        score: calculateScore()
      };

      console.log('Export data:');
      console.log(JSON.stringify(report, null, 2));

      return report;
    },

    // Get raw metrics
    getMetrics: function() {
      return metrics;
    },

    // Reset metrics
    reset: function() {
      metrics = {
        loadTime: {},
        calculationTime: [],
        storageIO: {},
        memoryUsage: {}
      };
      console.log('✓ Metrics reset');
    }
  };

  // Auto-start monitoring
  if (document.readyState === 'complete') {
    PerformanceMonitor.startMonitoring();
  } else {
    window.addEventListener('load', function() {
      PerformanceMonitor.startMonitoring();
    });
  }

  console.log('✓ PerformanceMonitor loaded. Use PerformanceMonitor.report() to see metrics.');

})();

// ===================================
// USAGE EXAMPLES
// ===================================

/*

// 1. View performance report
PerformanceMonitor.report();

// 2. Get score
var score = PerformanceMonitor.score();
console.log('Performance Score:', score.score, '(' + score.grade + ')');

// 3. Export data for analysis
var data = PerformanceMonitor.export();

// 4. Measure a specific calculation
var result = PerformanceMonitor.measureCalculation(function() {
  return APP.modules.calc.calculateTotals(APP.modules.app.state);
});
console.log('Calculation took:', result.duration, 'ms');

// 5. Measure storage operations
PerformanceMonitor.measureStorageWrite('test-key', JSON.stringify({data: 'test'}));
var data = PerformanceMonitor.measureStorageRead('test-key');

// 6. Reset and re-measure
PerformanceMonitor.reset();

*/
