// production-readiness.js - Production Readiness Checker
// Comprehensive production deployment readiness validation
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[PRODUCTION-READINESS] Skipped in test mode');
    return;
  }

  var _lastResults = null;

  /**
   * Run complete production readiness check
   */
  function runProductionReadinessCheck() {
    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION READINESS CHECK');
    console.log('='.repeat(50) + '\n');

    var results = {
      timestamp: new Date().toISOString(),
      passed: [],
      warnings: [],
      failed: [],
      score: 0
    };

    // 1. Test Suite Results
    checkTestSuites(results);

    // 2. Module Availability
    checkModules(results);

    // 3. LocalStorage Health
    checkLocalStorage(results);

    // 4. Performance Metrics
    checkPerformance(results);

    // 5. Browser Compatibility
    checkBrowserCompatibility(results);

    // 6. Error Tracking
    checkErrorTracking(results);

    // 7. Data Validation
    checkDataValidation(results);

    // 8. Security Checks
    checkSecurity(results);

    // Calculate score
    var totalChecks = results.passed.length + results.warnings.length + results.failed.length;
    if (totalChecks > 0) {
      results.score = Math.round(
        ((results.passed.length + (results.warnings.length * 0.5)) / totalChecks) * 100
      );
    }

    // Print summary
    printSummary(results);

    _lastResults = results;
    return results;
  }

  /**
   * Check test suite results
   */
  function checkTestSuites(results) {
    console.log('\n--- Checking Test Suites ---');

    if (typeof TestFramework === 'undefined') {
      results.warnings.push('TestFramework not loaded - cannot verify test results');
      console.log('⚠️  TestFramework not loaded');
      return;
    }

    var testResults = TestFramework.getResults();

    if (testResults.total === 0) {
      results.warnings.push('No tests have been run yet');
      console.log('⚠️  No tests have been run');
    } else {
      var passRate = (testResults.passed / testResults.total) * 100;

      if (passRate === 100) {
        results.passed.push('All tests passing (100%)');
        console.log('✓ All ' + testResults.total + ' tests passing');
      } else if (passRate >= 90) {
        results.warnings.push('Most tests passing (' + passRate.toFixed(1) + '%)');
        console.log('⚠️  ' + testResults.failed + ' test(s) failing (' + passRate.toFixed(1) + '% pass rate)');
      } else {
        results.failed.push('Too many tests failing (' + testResults.failed + ' failed)');
        console.log('✗ ' + testResults.failed + ' test(s) failing');
      }
    }
  }

  /**
   * Check critical modules
   */
  function checkModules(results) {
    console.log('\n--- Checking Critical Modules ---');

    var requiredModules = [
      { name: 'APP', global: 'APP' },
      { name: 'AppStorage', global: 'AppStorage' },
      { name: 'Money', global: 'Money' },
      { name: 'InvoiceSystem', global: 'InvoiceSystem' },
      { name: 'ClientDatabase', global: 'ClientDatabase' },
      { name: 'TaskManager', global: 'TaskManager' },
      { name: 'AnalyticsEngine', global: 'AnalyticsEngine' },
      { name: 'UIComponents', global: 'UIComponents' }
    ];

    var missing = [];

    for (var i = 0; i < requiredModules.length; i++) {
      var module = requiredModules[i];
      if (typeof window[module.global] === 'undefined') {
        missing.push(module.name);
      }
    }

    if (missing.length === 0) {
      results.passed.push('All critical modules loaded');
      console.log('✓ All ' + requiredModules.length + ' critical modules loaded');
    } else {
      results.failed.push('Missing modules: ' + missing.join(', '));
      console.log('✗ Missing modules: ' + missing.join(', '));
    }
  }

  /**
   * Check localStorage health
   */
  function checkLocalStorage(results) {
    console.log('\n--- Checking LocalStorage ---');

    try {
      // Test write
      localStorage.setItem('_test', 'test');
      localStorage.removeItem('_test');

      results.passed.push('LocalStorage available and writable');
      console.log('✓ LocalStorage available and writable');

      // Check usage
      var usage = 0;
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usage += localStorage[key].length + key.length;
        }
      }

      var usageMB = (usage / 1024 / 1024).toFixed(2);
      var quotaMB = 5; // Typical quota

      if (usage / 1024 / 1024 < 4) {
        results.passed.push('LocalStorage usage healthy (' + usageMB + ' MB)');
        console.log('✓ Usage: ' + usageMB + ' MB / ~' + quotaMB + ' MB');
      } else {
        results.warnings.push('LocalStorage usage high (' + usageMB + ' MB)');
        console.log('⚠️  Usage: ' + usageMB + ' MB / ~' + quotaMB + ' MB');
      }

    } catch (e) {
      results.failed.push('LocalStorage not available: ' + e.message);
      console.log('✗ LocalStorage error: ' + e.message);
    }
  }

  /**
   * Check performance metrics
   */
  function checkPerformance(results) {
    console.log('\n--- Checking Performance ---');

    // Check page load time
    if (performance && performance.timing) {
      var loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      var loadSeconds = (loadTime / 1000).toFixed(2);

      if (loadTime < 3000) {
        results.passed.push('Page load time acceptable (' + loadSeconds + 's)');
        console.log('✓ Page load: ' + loadSeconds + 's');
      } else {
        results.warnings.push('Page load time slow (' + loadSeconds + 's)');
        console.log('⚠️  Page load: ' + loadSeconds + 's');
      }
    }

    // Check memory usage
    if (performance.memory) {
      var memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);

      if (performance.memory.usedJSHeapSize < 100 * 1024 * 1024) {
        results.passed.push('Memory usage healthy (' + memoryMB + ' MB)');
        console.log('✓ Memory: ' + memoryMB + ' MB');
      } else {
        results.warnings.push('Memory usage high (' + memoryMB + ' MB)');
        console.log('⚠️  Memory: ' + memoryMB + ' MB');
      }
    }
  }

  /**
   * Check browser compatibility
   */
  function checkBrowserCompatibility(results) {
    console.log('\n--- Checking Browser Compatibility ---');

    var userAgent = navigator.userAgent;
    var browser = 'Unknown';
    var version = 'Unknown';

    // Detect browser
    if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'Safari';
      var match = userAgent.match(/Version\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      var match = userAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      var match = userAgent.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    }

    console.log('  Browser: ' + browser + ' ' + version);

    // Check for required APIs
    var requiredAPIs = [
      { name: 'localStorage', check: 'localStorage' in window },
      { name: 'JSON', check: typeof JSON !== 'undefined' },
      { name: 'Array.isArray', check: typeof Array.isArray === 'function' },
      { name: 'querySelector', check: 'querySelector' in document }
    ];

    var missingAPIs = [];
    for (var i = 0; i < requiredAPIs.length; i++) {
      if (!requiredAPIs[i].check) {
        missingAPIs.push(requiredAPIs[i].name);
      }
    }

    if (missingAPIs.length === 0) {
      results.passed.push('All required browser APIs available');
      console.log('✓ All required APIs available');
    } else {
      results.failed.push('Missing APIs: ' + missingAPIs.join(', '));
      console.log('✗ Missing APIs: ' + missingAPIs.join(', '));
    }
  }

  /**
   * Check error tracking
   */
  function checkErrorTracking(results) {
    console.log('\n--- Checking Error Tracking ---');

    if (typeof window.onerror === 'function' || typeof ErrorHandler !== 'undefined') {
      results.passed.push('Error tracking configured');
      console.log('✓ Error tracking configured');
    } else {
      results.warnings.push('No error tracking detected');
      console.log('⚠️  No error tracking detected');
    }
  }

  /**
   * Check data validation
   */
  function checkDataValidation(results) {
    console.log('\n--- Checking Data Validation ---');

    if (typeof InvoiceValidation !== 'undefined') {
      results.passed.push('Invoice validation module loaded');
      console.log('✓ Invoice validation available');
    } else {
      results.warnings.push('Invoice validation module not loaded');
      console.log('⚠️  Invoice validation not available');
    }

    if (typeof Security !== 'undefined' && Security.escapeHTML) {
      results.passed.push('Security/XSS protection available');
      console.log('✓ XSS protection available');
    } else {
      results.warnings.push('Security module not loaded');
      console.log('⚠️  Security module not available');
    }
  }

  /**
   * Check security
   */
  function checkSecurity(results) {
    console.log('\n--- Checking Security ---');

    // Check for HTTPS in production
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      results.passed.push('Using secure protocol (HTTPS)');
      console.log('✓ Secure protocol (HTTPS)');
    } else {
      results.failed.push('Not using HTTPS - required for production');
      console.log('✗ Not using HTTPS');
    }

    // Check for console logging in production
    var debugEnabled = localStorage.getItem('debug-enabled') === 'true';
    if (debugEnabled) {
      results.warnings.push('Debug mode is enabled - disable for production');
      console.log('⚠️  Debug mode enabled');
    } else {
      results.passed.push('Debug mode disabled');
      console.log('✓ Debug mode disabled');
    }
  }

  /**
   * Print summary
   */
  function printSummary(results) {
    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION READINESS SUMMARY');
    console.log('='.repeat(50));

    console.log('\n✓ Passed:   ' + results.passed.length);
    console.log('⚠️  Warnings: ' + results.warnings.length);
    console.log('✗ Failed:   ' + results.failed.length);

    console.log('\nReadiness Score: ' + results.score + '/100');

    if (results.score === 100) {
      console.log('\n🎉 PRODUCTION READY! All checks passed.');
    } else if (results.score >= 90) {
      console.log('\n✅ MOSTLY READY - Address warnings before deployment');
    } else if (results.score >= 75) {
      console.log('\n⚠️  CAUTION - Several issues need attention');
    } else {
      console.log('\n❌ NOT READY - Critical issues must be fixed');
    }

    if (results.failed.length > 0) {
      console.log('\nCritical Issues:');
      for (var i = 0; i < results.failed.length; i++) {
        console.log('  ✗ ' + results.failed[i]);
      }
    }

    if (results.warnings.length > 0) {
      console.log('\nWarnings:');
      for (var i = 0; i < results.warnings.length; i++) {
        console.log('  ⚠️  ' + results.warnings[i]);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  /**
   * Get last results
   */
  function getLastResults() {
    return _lastResults;
  }

  /**
   * Export readiness report
   */
  function exportReadinessReport() {
    if (!_lastResults) {
      var msg = 'No readiness check has been run. Run check first.';
      console.log(msg);
      if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
        UIComponents.showToast(msg, 'warning');
      }
      return;
    }

    var report = generateReport(_lastResults);

    var blob = new Blob([report], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'production-readiness-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
      UIComponents.showToast('Readiness report exported', 'success');
    }
  }

  /**
   * Generate readiness report
   */
  function generateReport(results) {
    var report = '';

    report += '========================================\n';
    report += 'TicTacStick Production Readiness Report\n';
    report += '========================================\n';
    report += 'Date: ' + results.timestamp + '\n';
    report += 'Score: ' + results.score + '/100\n';
    report += '========================================\n\n';

    report += 'PASSED (' + results.passed.length + '):\n';
    for (var i = 0; i < results.passed.length; i++) {
      report += '  ✓ ' + results.passed[i] + '\n';
    }

    report += '\nWARNINGS (' + results.warnings.length + '):\n';
    for (var i = 0; i < results.warnings.length; i++) {
      report += '  ⚠️  ' + results.warnings[i] + '\n';
    }

    report += '\nFAILED (' + results.failed.length + '):\n';
    for (var i = 0; i < results.failed.length; i++) {
      report += '  ✗ ' + results.failed[i] + '\n';
    }

    report += '\n========================================\n';

    if (results.score === 100) {
      report += 'STATUS: PRODUCTION READY ✓\n';
    } else if (results.score >= 90) {
      report += 'STATUS: MOSTLY READY - Address warnings\n';
    } else if (results.score >= 75) {
      report += 'STATUS: CAUTION - Several issues need attention\n';
    } else {
      report += 'STATUS: NOT READY - Critical issues must be fixed\n';
    }

    report += '========================================\n';

    return report;
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('productionReadiness', {
      runProductionReadinessCheck: runProductionReadinessCheck,
      getLastResults: getLastResults,
      exportReadinessReport: exportReadinessReport
    });
  }

  // Global API
  window.ProductionReadiness = {
    runCheck: runProductionReadinessCheck,
    getLastResults: getLastResults,
    exportReport: exportReadinessReport
  };

  console.log('[PRODUCTION-READINESS] Initialized');
})();
