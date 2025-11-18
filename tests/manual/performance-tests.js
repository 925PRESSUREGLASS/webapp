// performance-tests.js - Manual Performance Testing Suite
// Run in browser console: PerformanceTests.runAll()
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

var _performanceResults = [];

/**
 * Benchmark function execution time
 */
function benchmark(name, fn, iterations) {
    iterations = iterations || 100;

    console.log('\n--- Benchmarking: ' + name + ' ---');
    console.log('Iterations: ' + iterations);

    var times = [];
    var errors = 0;

    for (var i = 0; i < iterations; i++) {
        try {
            var start = performance.now();
            fn();
            var end = performance.now();
            times.push(end - start);
        } catch (e) {
            errors++;
            console.error('Error in iteration ' + i + ':', e.message);
        }
    }

    if (times.length === 0) {
        console.error('✗ All iterations failed');
        return null;
    }

    // Calculate statistics
    var total = 0;
    for (var j = 0; j < times.length; j++) {
        total += times[j];
    }
    var avg = total / times.length;
    var min = Math.min.apply(null, times);
    var max = Math.max.apply(null, times);

    // Sort for median
    times.sort(function(a, b) { return a - b; });
    var median = times[Math.floor(times.length / 2)];

    // Calculate standard deviation
    var squareDiffs = [];
    for (var k = 0; k < times.length; k++) {
        var diff = times[k] - avg;
        squareDiffs.push(diff * diff);
    }
    var avgSquareDiff = squareDiffs.reduce(function(a, b) { return a + b; }, 0) / squareDiffs.length;
    var stdDev = Math.sqrt(avgSquareDiff);

    console.log('Average: ' + avg.toFixed(2) + 'ms');
    console.log('Median: ' + median.toFixed(2) + 'ms');
    console.log('Min: ' + min.toFixed(2) + 'ms');
    console.log('Max: ' + max.toFixed(2) + 'ms');
    console.log('Std Dev: ' + stdDev.toFixed(2) + 'ms');
    if (errors > 0) {
        console.warn('Errors: ' + errors + ' / ' + iterations);
    }

    // Pass/Fail criteria (100ms threshold for most operations)
    var threshold = 100;
    var passed = avg < threshold;

    if (passed) {
        console.log('✓ PASS: Performance acceptable (avg < ' + threshold + 'ms)');
    } else {
        console.warn('⚠️ WARNING: Performance above threshold (' + avg.toFixed(2) + 'ms > ' + threshold + 'ms)');
    }

    var result = {
        name: name,
        iterations: iterations,
        avg: avg,
        median: median,
        min: min,
        max: max,
        stdDev: stdDev,
        errors: errors,
        passed: passed
    };

    _performanceResults.push(result);
    return result;
}

/**
 * Test 1: Money calculation performance
 */
function testMoneyCalculations() {
    return benchmark('Money Calculations', function() {
        var cents1 = Money.toCents(123.45);
        var cents2 = Money.toCents(67.89);
        var sum = Money.sumCents(cents1, cents2);
        var dollars = Money.fromCents(sum);
        var multiplied = Money.multiplyDollars(dollars, 1.5);
    }, 1000);
}

/**
 * Test 2: Time calculation performance
 */
function testTimeCalculations() {
    return benchmark('Time Calculations', function() {
        var minutes = Time.hoursToMinutes(2.5);
        var hours = Time.minutesToHours(minutes);
        var sum = Time.sum(minutes, 30, 45);
    }, 1000);
}

/**
 * Test 3: LocalStorage read performance
 */
function testStorageRead() {
    // Setup: create test data
    var testKey = 'perf_test_read';
    var testData = {
        id: 'test-123',
        client: 'Performance Test',
        items: [
            { type: 'window', count: 10, total: 450 },
            { type: 'pressure', area: 50, total: 250 }
        ],
        total: 700
    };
    localStorage.setItem(testKey, JSON.stringify(testData));

    var result = benchmark('LocalStorage Read', function() {
        var data = localStorage.getItem(testKey);
        JSON.parse(data);
    }, 1000);

    // Cleanup
    localStorage.removeItem(testKey);

    return result;
}

/**
 * Test 4: LocalStorage write performance
 */
function testStorageWrite() {
    var counter = 0;

    var result = benchmark('LocalStorage Write', function() {
        var data = {
            id: 'perf-test-' + (counter++),
            client: 'Test',
            items: [{ total: 100 }],
            total: 100
        };
        localStorage.setItem('perf_test_write_' + counter, JSON.stringify(data));
    }, 100);

    // Cleanup
    for (var i = 1; i <= counter; i++) {
        localStorage.removeItem('perf_test_write_' + i);
    }

    return result;
}

/**
 * Test 5: DOM manipulation performance
 */
function testDOMManipulation() {
    return benchmark('DOM Manipulation', function() {
        var div = document.createElement('div');
        div.className = 'test-element';
        div.innerHTML = '<span>Test</span>';
        document.body.appendChild(div);
        document.body.removeChild(div);
    }, 100);
}

/**
 * Test 6: Array operations performance
 */
function testArrayOperations() {
    var arr = [];
    for (var i = 0; i < 100; i++) {
        arr.push({ id: i, value: Math.random() * 1000 });
    }

    return benchmark('Array Operations (filter/map)', function() {
        var filtered = [];
        for (var j = 0; j < arr.length; j++) {
            if (arr[j].value > 500) {
                filtered.push(arr[j]);
            }
        }

        var mapped = [];
        for (var k = 0; k < filtered.length; k++) {
            mapped.push(filtered[k].value * 2);
        }
    }, 100);
}

/**
 * Test 7: JSON stringify/parse performance
 */
function testJSONOperations() {
    var data = {
        quotes: []
    };

    for (var i = 0; i < 50; i++) {
        data.quotes.push({
            id: 'quote-' + i,
            client: 'Client ' + i,
            items: [
                { type: 'window', count: 10, total: 450 },
                { type: 'pressure', area: 50, total: 250 }
            ],
            total: 700
        });
    }

    return benchmark('JSON Stringify/Parse', function() {
        var json = JSON.stringify(data);
        JSON.parse(json);
    }, 100);
}

/**
 * Test 8: String operations performance
 */
function testStringOperations() {
    return benchmark('String Operations', function() {
        var str = 'Test string with some content';
        var upper = str.toUpperCase();
        var lower = str.toLowerCase();
        var split = str.split(' ');
        var joined = split.join('-');
        var replaced = str.replace('Test', 'Sample');
    }, 1000);
}

/**
 * Measure app memory usage
 */
function measureMemoryUsage() {
    console.log('\n--- Memory Usage ---');

    if (performance.memory) {
        var used = performance.memory.usedJSHeapSize;
        var total = performance.memory.totalJSHeapSize;
        var limit = performance.memory.jsHeapSizeLimit;

        var usedMB = (used / 1048576).toFixed(2);
        var totalMB = (total / 1048576).toFixed(2);
        var limitMB = (limit / 1048576).toFixed(2);
        var percentage = ((used / limit) * 100).toFixed(1);

        console.log('Used: ' + usedMB + ' MB');
        console.log('Total: ' + totalMB + ' MB');
        console.log('Limit: ' + limitMB + ' MB');
        console.log('Usage: ' + percentage + '%');

        if ((used / limit) > 0.9) {
            console.error('❌ CRITICAL: Memory usage very high (' + percentage + '%)');
        } else if ((used / limit) > 0.7) {
            console.warn('⚠️ WARNING: Memory usage high (' + percentage + '%)');
        } else {
            console.log('✓ Memory usage acceptable');
        }

        return {
            usedMB: usedMB,
            totalMB: totalMB,
            limitMB: limitMB,
            percentage: percentage
        };
    } else {
        console.log('⚠️ Memory API not available (Chrome/Edge only)');
        return null;
    }
}

/**
 * Test paint performance
 */
function testPaintPerformance() {
    console.log('\n--- Testing Paint Performance ---');

    if (!performance.getEntriesByType) {
        console.log('⚠️ Paint timing API not available');
        return null;
    }

    var paintEntries = performance.getEntriesByType('paint');

    if (paintEntries.length === 0) {
        console.log('No paint entries available');
        return null;
    }

    for (var i = 0; i < paintEntries.length; i++) {
        var entry = paintEntries[i];
        console.log(entry.name + ': ' + entry.startTime.toFixed(2) + 'ms');
    }

    return paintEntries;
}

/**
 * Run all performance tests
 */
function runAll() {
    console.log('\n========================================');
    console.log('  PERFORMANCE TEST SUITE');
    console.log('========================================');
    console.log('  Run Date: ' + new Date().toLocaleString());
    console.log('  User Agent: ' + navigator.userAgent);
    console.log('========================================');

    _performanceResults = [];

    // Run benchmarks
    testMoneyCalculations();
    testTimeCalculations();
    testStorageRead();
    testStorageWrite();
    testDOMManipulation();
    testArrayOperations();
    testJSONOperations();
    testStringOperations();

    // Memory and paint tests
    var memoryResult = measureMemoryUsage();
    var paintResult = testPaintPerformance();

    // Summary
    var passed = _performanceResults.filter(function(r) { return r.passed; }).length;
    var total = _performanceResults.length;
    var successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log('\n========================================');
    console.log('  PERFORMANCE RESULTS');
    console.log('========================================');
    console.log('Passed: ' + passed + ' / ' + total);
    console.log('Failed: ' + (total - passed));
    console.log('Success Rate: ' + successRate + '%');

    // Find slowest operation
    if (_performanceResults.length > 0) {
        var slowest = _performanceResults[0];
        for (var i = 1; i < _performanceResults.length; i++) {
            if (_performanceResults[i].avg > slowest.avg) {
                slowest = _performanceResults[i];
            }
        }
        console.log('\nSlowest operation: ' + slowest.name + ' (' + slowest.avg.toFixed(2) + 'ms)');
    }

    if (passed === total) {
        console.log('\n🎉 ALL PERFORMANCE TESTS PASSED! 🎉');
        console.log('App performance is excellent.');
    } else {
        console.log('\n⚠️ SOME PERFORMANCE TESTS NEED OPTIMIZATION');
        console.log('Review failed tests and optimize code.');
    }

    return {
        benchmarks: _performanceResults,
        memory: memoryResult,
        paint: paintResult
    };
}

/**
 * Export results as CSV
 */
function exportResults() {
    if (_performanceResults.length === 0) {
        console.warn('No results to export. Run tests first.');
        return;
    }

    var csv = 'Test Name,Iterations,Avg (ms),Median (ms),Min (ms),Max (ms),Std Dev (ms),Errors,Status\n';

    for (var i = 0; i < _performanceResults.length; i++) {
        var r = _performanceResults[i];
        csv += '"' + r.name + '",' + r.iterations + ',' +
               r.avg.toFixed(2) + ',' + r.median.toFixed(2) + ',' +
               r.min.toFixed(2) + ',' + r.max.toFixed(2) + ',' +
               r.stdDev.toFixed(2) + ',' + r.errors + ',' +
               (r.passed ? 'PASS' : 'FAIL') + '\n';
    }

    // Download CSV
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'performance-test-results-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Performance results exported to CSV');
}

// Public API
window.PerformanceTests = {
    runAll: runAll,
    benchmark: benchmark,
    measureMemoryUsage: measureMemoryUsage,
    exportResults: exportResults
};

console.log('[PERFORMANCE-TESTS] Manual test suite loaded. Run: PerformanceTests.runAll()');

})();
