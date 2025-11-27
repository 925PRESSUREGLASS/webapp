// test-framework.js - Lightweight ES5 Testing Framework
// Simple test framework for in-browser testing
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[TEST-FRAMEWORK] Skipped in test mode');
    return;
  }

  var _tests = [];
  var _results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    failures: []
  };

  /**
   * Define a test suite
   */
  function describe(suiteName, suiteFunc) {
    console.log('\n=== Test Suite: ' + suiteName + ' ===');

    var suite = {
      name: suiteName,
      tests: [],
      beforeEach: null,
      afterEach: null,
      beforeAll: null,
      afterAll: null
    };

    // Provide test context
    var context = {
      beforeEach: function(func) {
        suite.beforeEach = func;
      },
      afterEach: function(func) {
        suite.afterEach = func;
      },
      beforeAll: function(func) {
        suite.beforeAll = func;
      },
      afterAll: function(func) {
        suite.afterAll = func;
      },
      it: function(testName, testFunc) {
        suite.tests.push({
          name: testName,
          func: testFunc,
          skip: false
        });
      },
      xit: function(testName, testFunc) {
        suite.tests.push({
          name: testName,
          func: testFunc,
          skip: true
        });
      }
    };

    // Run suite definition
    suiteFunc.call(context, context);

    _tests.push(suite);
  }

  /**
   * Run all tests
   */
  function runTests(suiteFilter) {
    console.log('\n🧪 Running Tests...\n');

    _results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: []
    };

    for (var i = 0; i < _tests.length; i++) {
      var suite = _tests[i];

      // Filter by suite name if provided
      if (suiteFilter && suite.name.indexOf(suiteFilter) === -1) {
        continue;
      }

      console.log('\n--- ' + suite.name + ' ---');

      // Run beforeAll
      try {
        if (suite.beforeAll) {
          suite.beforeAll();
        }
      } catch (error) {
        console.error('  ✗ beforeAll failed: ' + error.message);
        continue;
      }

      for (var j = 0; j < suite.tests.length; j++) {
        var test = suite.tests[j];

        if (test.skip) {
          _results.skipped++;
          _results.total++;
          console.log('  ⊘ ' + test.name + ' (skipped)');
          continue;
        }

        _results.total++;

        try {
          // Run beforeEach
          if (suite.beforeEach) {
            suite.beforeEach();
          }

          // Run test
          test.func();

          // Run afterEach
          if (suite.afterEach) {
            suite.afterEach();
          }

          _results.passed++;
          console.log('  ✓ ' + test.name);

        } catch (error) {
          _results.failed++;
          console.error('  ✗ ' + test.name);
          console.error('    Error: ' + error.message);

          _results.failures.push({
            suite: suite.name,
            test: test.name,
            error: error.message,
            stack: error.stack
          });
        }
      }

      // Run afterAll
      try {
        if (suite.afterAll) {
          suite.afterAll();
        }
      } catch (error) {
        console.error('  ✗ afterAll failed: ' + error.message);
      }
    }

    // Print summary
    printSummary();

    return _results;
  }

  /**
   * Print test summary
   */
  function printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('Test Results Summary');
    console.log('='.repeat(50));
    console.log('Total:   ' + _results.total);
    console.log('Passed:  ' + _results.passed + ' ✓');
    console.log('Failed:  ' + _results.failed + ' ✗');
    console.log('Skipped: ' + _results.skipped + ' ⊘');

    var passRate = _results.total > 0 ?
      ((_results.passed / _results.total) * 100).toFixed(1) : 0;
    console.log('Pass Rate: ' + passRate + '%');

    if (_results.failures.length > 0) {
      console.log('\nFailures:');
      for (var i = 0; i < _results.failures.length; i++) {
        var failure = _results.failures[i];
        console.log('\n' + (i + 1) + '. ' + failure.suite + ' > ' + failure.test);
        console.log('   ' + failure.error);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  /**
   * Clear all registered tests
   */
  function clearTests() {
    _tests = [];
    _results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: []
    };
  }

  /**
   * Assertion helpers
   */
  var assert = {
    equal: function(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(
          (message || 'Assertion failed') +
          '\n  Expected: ' + JSON.stringify(expected) +
          '\n  Actual: ' + JSON.stringify(actual)
        );
      }
    },

    notEqual: function(actual, expected, message) {
      if (actual === expected) {
        throw new Error(
          (message || 'Assertion failed') +
          '\n  Expected not equal: ' + JSON.stringify(expected)
        );
      }
    },

    strictEqual: function(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(
          (message || 'Strict equality failed') +
          '\n  Expected: ' + JSON.stringify(expected) + ' (' + typeof expected + ')' +
          '\n  Actual: ' + JSON.stringify(actual) + ' (' + typeof actual + ')'
        );
      }
    },

    deepEqual: function(actual, expected, message) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          (message || 'Deep equality failed') +
          '\n  Expected: ' + JSON.stringify(expected) +
          '\n  Actual: ' + JSON.stringify(actual)
        );
      }
    },

    ok: function(value, message) {
      if (!value) {
        throw new Error(message || 'Expected truthy value');
      }
    },

    notOk: function(value, message) {
      if (value) {
        throw new Error(message || 'Expected falsy value');
      }
    },

    throws: function(func, message) {
      var threw = false;
      try {
        func();
      } catch (e) {
        threw = true;
      }

      if (!threw) {
        throw new Error(message || 'Expected function to throw');
      }
    },

    doesNotThrow: function(func, message) {
      try {
        func();
      } catch (e) {
        throw new Error(
          (message || 'Expected function not to throw') +
          '\n  Error: ' + e.message
        );
      }
    },

    isNull: function(value, message) {
      if (value !== null) {
        throw new Error(
          (message || 'Expected null') +
          '\n  Actual: ' + JSON.stringify(value)
        );
      }
    },

    isNotNull: function(value, message) {
      if (value === null) {
        throw new Error(message || 'Expected not null');
      }
    },

    isUndefined: function(value, message) {
      if (value !== undefined) {
        throw new Error(
          (message || 'Expected undefined') +
          '\n  Actual: ' + JSON.stringify(value)
        );
      }
    },

    isDefined: function(value, message) {
      if (value === undefined) {
        throw new Error(message || 'Expected defined value');
      }
    },

    isArray: function(value, message) {
      if (!Array.isArray(value)) {
        throw new Error(
          (message || 'Expected array') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    isObject: function(value, message) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(
          (message || 'Expected object') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    isString: function(value, message) {
      if (typeof value !== 'string') {
        throw new Error(
          (message || 'Expected string') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    isNumber: function(value, message) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(
          (message || 'Expected number') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    isBoolean: function(value, message) {
      if (typeof value !== 'boolean') {
        throw new Error(
          (message || 'Expected boolean') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    isFunction: function(value, message) {
      if (typeof value !== 'function') {
        throw new Error(
          (message || 'Expected function') +
          '\n  Actual: ' + typeof value
        );
      }
    },

    contains: function(haystack, needle, message) {
      var found = false;

      if (typeof haystack === 'string') {
        found = haystack.indexOf(needle) > -1;
      } else if (Array.isArray(haystack)) {
        found = haystack.indexOf(needle) > -1;
      } else if (typeof haystack === 'object') {
        found = haystack.hasOwnProperty(needle);
      }

      if (!found) {
        throw new Error(
          (message || 'Expected to contain') +
          '\n  Haystack: ' + JSON.stringify(haystack) +
          '\n  Needle: ' + JSON.stringify(needle)
        );
      }
    },

    lengthOf: function(value, length, message) {
      var actualLength = value ? value.length : 0;
      if (actualLength !== length) {
        throw new Error(
          (message || 'Expected length ' + length) +
          '\n  Actual length: ' + actualLength
        );
      }
    },

    greaterThan: function(actual, expected, message) {
      if (!(actual > expected)) {
        throw new Error(
          (message || 'Expected greater than') +
          '\n  Expected > ' + expected +
          '\n  Actual: ' + actual
        );
      }
    },

    lessThan: function(actual, expected, message) {
      if (!(actual < expected)) {
        throw new Error(
          (message || 'Expected less than') +
          '\n  Expected < ' + expected +
          '\n  Actual: ' + actual
        );
      }
    },

    closeTo: function(actual, expected, delta, message) {
      var diff = Math.abs(actual - expected);
      if (diff > delta) {
        throw new Error(
          (message || 'Expected close to') +
          '\n  Expected: ' + expected + ' ± ' + delta +
          '\n  Actual: ' + actual +
          '\n  Difference: ' + diff
        );
      }
    }
  };

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('testFramework', {
      describe: describe,
      runTests: runTests,
      clearTests: clearTests,
      assert: assert,
      getResults: function() { return _results; }
    });
  }

  // Make globally available
  window.TestFramework = {
    describe: describe,
    runTests: runTests,
    clearTests: clearTests,
    assert: assert,
    getResults: function() { return _results; }
  };
  window.describe = describe;
  window.assert = assert;

  console.log('[TEST-FRAMEWORK] Initialized');
})();
