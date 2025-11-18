// test-runner.js - Test Runner Controller and UI
// Control test execution and display results
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Capture console output
  var originalConsoleLog = console.log;
  var originalConsoleError = console.error;
  var testConsoleOutput = '';
  var isCapturing = false;

  /**
   * Override console to capture output
   */
  function captureConsole() {
    if (isCapturing) return;
    isCapturing = true;
    testConsoleOutput = '';

    console.log = function() {
      var message = Array.prototype.slice.call(arguments).join(' ');
      testConsoleOutput += message + '\n';
      originalConsoleLog.apply(console, arguments);
    };

    console.error = function() {
      var message = Array.prototype.slice.call(arguments).join(' ');
      testConsoleOutput += 'ERROR: ' + message + '\n';
      originalConsoleError.apply(console, arguments);
    };
  }

  /**
   * Restore original console
   */
  function restoreConsole() {
    if (!isCapturing) return;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    isCapturing = false;
  }

  /**
   * Run all tests
   */
  function runAllTests() {
    clearTestConsole();
    captureConsole();

    if (typeof UIComponents !== 'undefined' && UIComponents.showLoading) {
      UIComponents.showLoading('Running tests...');
    }

    // Run after short delay to show loading
    setTimeout(function() {
      try {
        if (typeof TestFramework === 'undefined') {
          throw new Error('TestFramework not loaded');
        }

        var results = TestFramework.runTests();

        restoreConsole();
        displayResults(results);
        updateTestConsole();

        if (typeof UIComponents !== 'undefined' && UIComponents.hideLoading) {
          UIComponents.hideLoading();
        }

        if (results.failed === 0) {
          showToast('All tests passed! ✓', 'success');
        } else {
          showToast(results.failed + ' test(s) failed', 'error');
        }
      } catch (error) {
        restoreConsole();
        if (typeof UIComponents !== 'undefined' && UIComponents.hideLoading) {
          UIComponents.hideLoading();
        }
        showToast('Test error: ' + error.message, 'error');
        console.error('Test execution error:', error);
      }
    }, 100);
  }

  /**
   * Run specific test suite
   */
  function runTestSuite(suiteName) {
    if (!suiteName) {
      suiteName = prompt('Enter test suite name (or leave blank for all):');
      if (suiteName === null) return; // User cancelled
    }

    clearTestConsole();
    captureConsole();

    if (typeof UIComponents !== 'undefined' && UIComponents.showLoading) {
      UIComponents.showLoading('Running tests...');
    }

    setTimeout(function() {
      try {
        if (typeof TestFramework === 'undefined') {
          throw new Error('TestFramework not loaded');
        }

        var results = TestFramework.runTests(suiteName);

        restoreConsole();
        displayResults(results);
        updateTestConsole();

        if (typeof UIComponents !== 'undefined' && UIComponents.hideLoading) {
          UIComponents.hideLoading();
        }

        if (results.failed === 0) {
          showToast('Tests passed! ✓', 'success');
        } else {
          showToast(results.failed + ' test(s) failed', 'error');
        }
      } catch (error) {
        restoreConsole();
        if (typeof UIComponents !== 'undefined' && UIComponents.hideLoading) {
          UIComponents.hideLoading();
        }
        showToast('Test error: ' + error.message, 'error');
        console.error('Test execution error:', error);
      }
    }, 100);
  }

  /**
   * Run unit tests only
   */
  function runUnitTests() {
    runTestSuite('Module');
  }

  /**
   * Run integration tests only
   */
  function runIntegrationTests() {
    runTestSuite('Workflow');
  }

  /**
   * Run performance tests only
   */
  function runPerformanceTests() {
    runTestSuite('Performance');
  }

  /**
   * Display test results
   */
  function displayResults(results) {
    var summaryEl = document.getElementById('test-results-summary');
    if (summaryEl) {
      summaryEl.style.display = 'block';
    }

    var totalEl = document.getElementById('test-total');
    if (totalEl) {
      totalEl.textContent = results.total;
    }

    var passedEl = document.getElementById('test-passed');
    if (passedEl) {
      passedEl.textContent = results.passed;
    }

    var failedEl = document.getElementById('test-failed');
    if (failedEl) {
      failedEl.textContent = results.failed;
    }

    var skippedEl = document.getElementById('test-skipped');
    if (skippedEl) {
      skippedEl.textContent = results.skipped;
    }

    var passRate = results.total > 0 ?
      ((results.passed / results.total) * 100).toFixed(1) : 0;

    var passRateEl = document.getElementById('test-pass-rate');
    if (passRateEl) {
      passRateEl.textContent = passRate + '%';

      // Color code pass rate
      if (passRate >= 90) {
        passRateEl.style.color = '#10b981'; // Green
      } else if (passRate >= 70) {
        passRateEl.style.color = '#f59e0b'; // Orange
      } else {
        passRateEl.style.color = '#ef4444'; // Red
      }
    }
  }

  /**
   * Update test console
   */
  function updateTestConsole() {
    var consoleEl = document.getElementById('test-console');
    if (consoleEl) {
      consoleEl.textContent = testConsoleOutput;
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  /**
   * Clear test console
   */
  function clearTestConsole() {
    testConsoleOutput = '';
    var consoleEl = document.getElementById('test-console');
    if (consoleEl) {
      consoleEl.textContent = '';
    }

    var summaryEl = document.getElementById('test-results-summary');
    if (summaryEl) {
      summaryEl.style.display = 'none';
    }
  }

  /**
   * Download test results
   */
  function downloadTestResults() {
    if (!testConsoleOutput) {
      showToast('No test results to download. Run tests first.', 'warning');
      return;
    }

    var results = TestFramework.getResults();
    var report = generateTestReport(results);

    var blob = new Blob([report], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'test-results-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    showToast('Test results downloaded', 'success');
  }

  /**
   * Generate test report
   */
  function generateTestReport(results) {
    var report = '';
    report += '========================================\n';
    report += 'TicTacStick Test Results\n';
    report += '========================================\n';
    report += 'Date: ' + new Date().toISOString() + '\n';
    report += 'Total Tests: ' + results.total + '\n';
    report += 'Passed: ' + results.passed + '\n';
    report += 'Failed: ' + results.failed + '\n';
    report += 'Skipped: ' + results.skipped + '\n';

    var passRate = results.total > 0 ?
      ((results.passed / results.total) * 100).toFixed(1) : 0;
    report += 'Pass Rate: ' + passRate + '%\n';
    report += '========================================\n\n';

    if (results.failures.length > 0) {
      report += 'FAILURES:\n\n';
      for (var i = 0; i < results.failures.length; i++) {
        var failure = results.failures[i];
        report += (i + 1) + '. ' + failure.suite + ' > ' + failure.test + '\n';
        report += '   Error: ' + failure.error + '\n\n';
      }
    }

    report += '\n\nCONSOLE OUTPUT:\n\n';
    report += testConsoleOutput;

    return report;
  }

  /**
   * Show toast notification
   */
  function showToast(message, type) {
    if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
      UIComponents.showToast(message, type);
    } else if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  /**
   * Initialize test runner
   */
  function init() {
    console.log('[TEST-RUNNER] Initializing...');

    // Check if test page exists
    var testPage = document.getElementById('page-tests');
    if (testPage) {
      console.log('[TEST-RUNNER] Test page found');
    }

    // Wire up buttons if they exist
    var runAllBtn = document.getElementById('run-all-tests-btn');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', runAllTests);
    }

    var runSuiteBtn = document.getElementById('run-suite-btn');
    if (runSuiteBtn) {
      runSuiteBtn.addEventListener('click', function() {
        runTestSuite();
      });
    }

    var runUnitBtn = document.getElementById('run-unit-tests-btn');
    if (runUnitBtn) {
      runUnitBtn.addEventListener('click', runUnitTests);
    }

    var runIntegrationBtn = document.getElementById('run-integration-tests-btn');
    if (runIntegrationBtn) {
      runIntegrationBtn.addEventListener('click', runIntegrationTests);
    }

    var runPerformanceBtn = document.getElementById('run-performance-tests-btn');
    if (runPerformanceBtn) {
      runPerformanceBtn.addEventListener('click', runPerformanceTests);
    }

    var clearBtn = document.getElementById('clear-console-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearTestConsole);
    }

    var downloadBtn = document.getElementById('download-results-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadTestResults);
    }

    console.log('[TEST-RUNNER] Initialized');
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('testRunner', {
      runAllTests: runAllTests,
      runTestSuite: runTestSuite,
      runUnitTests: runUnitTests,
      runIntegrationTests: runIntegrationTests,
      runPerformanceTests: runPerformanceTests,
      clearTestConsole: clearTestConsole,
      downloadTestResults: downloadTestResults,
      init: init
    });
  }

  // Global API
  window.TestRunner = {
    runAllTests: runAllTests,
    runTestSuite: runTestSuite,
    runUnitTests: runUnitTests,
    runIntegrationTests: runIntegrationTests,
    runPerformanceTests: runPerformanceTests,
    clearTestConsole: clearTestConsole,
    downloadTestResults: downloadTestResults,
    init: init
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
