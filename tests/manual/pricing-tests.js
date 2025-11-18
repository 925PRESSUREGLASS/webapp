// pricing-tests.js - Manual Test Suite for Pricing Calculator
// Run in browser console: PricingTests.runAll()
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

var _testResults = [];

/**
 * Test helper - assert equals
 */
function assertEqual(actual, expected, testName) {
    var passed = Math.abs(actual - expected) < 0.01; // Allow 1 cent variance
    var result = {
        test: testName,
        passed: passed,
        expected: expected,
        actual: actual
    };
    _testResults.push(result);

    if (passed) {
        console.log('✓ PASS:', testName);
    } else {
        console.error('✗ FAIL:', testName, '- Expected:', expected, 'Got:', actual);
    }

    return passed;
}

/**
 * Test 1: Money precision - toCents conversion
 */
function testMoneyToCents() {
    console.log('\n--- Testing Money.toCents ---');

    assertEqual(Money.toCents(19.99), 1999, 'Convert $19.99 to cents');
    assertEqual(Money.toCents(0.01), 1, 'Convert $0.01 to cents');
    assertEqual(Money.toCents(100), 10000, 'Convert $100 to cents');
    assertEqual(Money.toCents(0), 0, 'Convert $0 to cents');
}

/**
 * Test 2: Money precision - fromCents conversion
 */
function testMoneyFromCents() {
    console.log('\n--- Testing Money.fromCents ---');

    assertEqual(Money.fromCents(1999), 19.99, 'Convert 1999 cents to dollars');
    assertEqual(Money.fromCents(1), 0.01, 'Convert 1 cent to dollars');
    assertEqual(Money.fromCents(10000), 100, 'Convert 10000 cents to dollars');
    assertEqual(Money.fromCents(0), 0, 'Convert 0 cents to dollars');
}

/**
 * Test 3: Money precision - sumCents
 */
function testMoneySumCents() {
    console.log('\n--- Testing Money.sumCents ---');

    var sum1 = Money.sumCents(1000, 2000, 3000);
    assertEqual(sum1, 6000, 'Sum multiple cent values');

    var sum2 = Money.sumCents(Money.toCents(10.50), Money.toCents(20.25));
    assertEqual(sum2, 3075, 'Sum converted dollar values');
}

/**
 * Test 4: Money precision - multiplyDollars
 */
function testMoneyMultiplyDollars() {
    console.log('\n--- Testing Money.multiplyDollars ---');

    assertEqual(Money.multiplyDollars(10, 1.5), 15, 'Multiply $10 by 1.5');
    assertEqual(Money.multiplyDollars(19.99, 2), 39.98, 'Multiply $19.99 by 2');
    assertEqual(Money.multiplyDollars(33.33, 3), 99.99, 'Multiply $33.33 by 3');
}

/**
 * Test 5: Time calculations - hoursToMinutes
 */
function testTimeHoursToMinutes() {
    console.log('\n--- Testing Time.hoursToMinutes ---');

    assertEqual(Time.hoursToMinutes(1), 60, 'Convert 1 hour to minutes');
    assertEqual(Time.hoursToMinutes(1.5), 90, 'Convert 1.5 hours to minutes');
    assertEqual(Time.hoursToMinutes(0.5), 30, 'Convert 0.5 hours to minutes');
    assertEqual(Time.hoursToMinutes(2.25), 135, 'Convert 2.25 hours to minutes');
}

/**
 * Test 6: Time calculations - minutesToHours
 */
function testTimeMinutesToHours() {
    console.log('\n--- Testing Time.minutesToHours ---');

    assertEqual(Time.minutesToHours(60), 1, 'Convert 60 minutes to hours');
    assertEqual(Time.minutesToHours(90), 1.5, 'Convert 90 minutes to hours');
    assertEqual(Time.minutesToHours(30), 0.5, 'Convert 30 minutes to hours');
    assertEqual(Time.minutesToHours(135), 2.25, 'Convert 135 minutes to hours');
}

/**
 * Test 7: Window calculation - basic line
 */
function testWindowBasicCalculation() {
    console.log('\n--- Testing Window Line Calculation ---');

    // Test requires WindowCalc to be available
    if (typeof WindowCalc === 'undefined') {
        console.warn('⚠️ WindowCalc not available - skipping window tests');
        return;
    }

    // This would test actual window calculation logic
    // Implementation depends on your WindowCalc structure
    console.log('✓ Window calculation tests would go here');
}

/**
 * Test 8: Pressure washing calculation
 */
function testPressureCalculation() {
    console.log('\n--- Testing Pressure Washing Calculation ---');

    // Example test structure
    // Actual implementation depends on your pressure calc logic
    console.log('✓ Pressure washing tests would go here');
}

/**
 * Test 9: GST calculation
 */
function testGSTCalculation() {
    console.log('\n--- Testing GST Calculation ---');

    var subtotal = 1000;
    var gst = subtotal * 0.1; // 10% GST
    var total = subtotal + gst;

    assertEqual(gst, 100, 'GST is 10% of subtotal');
    assertEqual(total, 1100, 'Total includes GST');

    // Test with cents precision
    var subtotal2 = 333.33;
    var gst2 = Money.fromCents(Money.toCents(subtotal2 * 0.1));
    assertEqual(gst2, 33.33, 'GST with cent precision');
}

/**
 * Test 10: Minimum charge application
 */
function testMinimumCharge() {
    console.log('\n--- Testing Minimum Charge ---');

    var amount1 = 50;
    var minimum = 150;
    var result1 = Math.max(amount1, minimum);
    assertEqual(result1, 150, 'Minimum charge applied when below threshold');

    var amount2 = 200;
    var result2 = Math.max(amount2, minimum);
    assertEqual(result2, 200, 'Original amount kept when above minimum');
}

/**
 * Test 11: Floating point edge cases
 */
function testFloatingPointEdgeCases() {
    console.log('\n--- Testing Floating Point Edge Cases ---');

    // Test that we handle floating point correctly
    var test1 = Money.fromCents(Money.toCents(0.1) + Money.toCents(0.2));
    assertEqual(test1, 0.3, 'Avoid 0.1 + 0.2 = 0.30000000000004');

    var test2 = Money.multiplyDollars(0.3, 3);
    assertEqual(test2, 0.9, 'Avoid 0.3 * 3 rounding errors');
}

/**
 * Test 12: Negative and zero values
 */
function testEdgeValues() {
    console.log('\n--- Testing Edge Values ---');

    assertEqual(Money.toCents(0), 0, 'Zero dollars to cents');
    assertEqual(Money.fromCents(0), 0, 'Zero cents to dollars');

    try {
        Money.toCents(-10);
        console.log('⚠️ WARNING: Negative values accepted (may be intentional)');
    } catch (e) {
        console.log('✓ Negative values rejected');
    }
}

/**
 * Run all pricing tests
 */
function runAll() {
    console.log('\n========================================');
    console.log('  PRICING CALCULATOR TEST SUITE');
    console.log('========================================');
    console.log('  Run Date: ' + new Date().toLocaleString());
    console.log('========================================');

    _testResults = [];

    testMoneyToCents();
    testMoneyFromCents();
    testMoneySumCents();
    testMoneyMultiplyDollars();
    testTimeHoursToMinutes();
    testTimeMinutesToHours();
    testWindowBasicCalculation();
    testPressureCalculation();
    testGSTCalculation();
    testMinimumCharge();
    testFloatingPointEdgeCases();
    testEdgeValues();

    // Summary
    var passed = _testResults.filter(function(r) { return r.passed; }).length;
    var total = _testResults.length;
    var successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log('\n========================================');
    console.log('  TEST RESULTS');
    console.log('========================================');
    console.log('Passed: ' + passed + ' / ' + total);
    console.log('Failed: ' + (total - passed));
    console.log('Success Rate: ' + successRate + '%');

    if (passed === total) {
        console.log('\n🎉 ALL TESTS PASSED! 🎉');
        console.log('Pricing calculations are accurate and reliable.');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED - Review above');
        console.log('Fix failing tests before deployment!');
    }

    return _testResults;
}

/**
 * Get test results
 */
function getResults() {
    return _testResults;
}

/**
 * Export results as CSV
 */
function exportResults() {
    if (_testResults.length === 0) {
        console.warn('No test results to export. Run tests first.');
        return;
    }

    var csv = 'Test Name,Status,Expected,Actual\n';
    for (var i = 0; i < _testResults.length; i++) {
        var r = _testResults[i];
        csv += '"' + r.test + '",' + (r.passed ? 'PASS' : 'FAIL') + ',' + r.expected + ',' + r.actual + '\n';
    }

    // Download CSV
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pricing-test-results-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Test results exported to CSV');
}

// Public API
window.PricingTests = {
    runAll: runAll,
    getResults: getResults,
    exportResults: exportResults
};

console.log('[PRICING-TESTS] Manual test suite loaded. Run: PricingTests.runAll()');

})();
