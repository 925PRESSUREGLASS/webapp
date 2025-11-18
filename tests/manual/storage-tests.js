// storage-tests.js - Manual Test Suite for LocalStorage Operations
// Run in browser console: StorageTests.runAll()
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

var _testResults = [];

/**
 * Test helper - log result
 */
function logResult(testName, passed, message) {
    _testResults.push({
        test: testName,
        passed: passed,
        message: message
    });

    if (passed) {
        console.log('✓ PASS:', testName, '-', message);
    } else {
        console.error('✗ FAIL:', testName, '-', message);
    }
}

/**
 * Test 1: LocalStorage availability
 */
function testLocalStorageAvailable() {
    console.log('\n--- Testing LocalStorage Availability ---');

    try {
        var test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        logResult('LocalStorage Available', true, 'Can read and write');
        return true;
    } catch (e) {
        logResult('LocalStorage Available', false, 'Error: ' + e.message);
        return false;
    }
}

/**
 * Test 2: Save and retrieve data
 */
function testSaveAndRetrieve() {
    console.log('\n--- Testing Save/Retrieve ---');

    var testKey = 'tts_test_data_' + Date.now();
    var testData = {
        id: 123,
        name: 'Test Quote',
        total: 450.50,
        items: [
            { type: 'window', count: 10 },
            { type: 'pressure', area: 50 }
        ]
    };

    try {
        // Save
        localStorage.setItem(testKey, JSON.stringify(testData));
        logResult('Save Data', true, 'Data saved to localStorage');

        // Retrieve
        var retrieved = localStorage.getItem(testKey);
        if (!retrieved) {
            logResult('Retrieve Data', false, 'No data retrieved');
            return false;
        }

        var parsed = JSON.parse(retrieved);
        if (parsed.id === testData.id && parsed.name === testData.name) {
            logResult('Retrieve Data', true, 'Data retrieved correctly');
        } else {
            logResult('Retrieve Data', false, 'Data mismatch');
            return false;
        }

        // Cleanup
        localStorage.removeItem(testKey);
        logResult('Cleanup', true, 'Test data removed');

        return true;

    } catch (e) {
        logResult('Save/Retrieve', false, 'Error: ' + e.message);
        localStorage.removeItem(testKey); // Cleanup attempt
        return false;
    }
}

/**
 * Test 3: Storage quota usage
 */
function testStorageQuota() {
    console.log('\n--- Testing Storage Quota ---');

    try {
        // Calculate used space
        var totalSize = 0;
        for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }

        var sizeKB = (totalSize / 1024).toFixed(2);
        var sizeMB = (totalSize / 1048576).toFixed(2);

        console.log('Storage used: ' + sizeKB + ' KB (' + sizeMB + ' MB)');

        // Typical localStorage limit is 5-10MB
        var limitMB = 5; // Conservative estimate
        var percentage = (sizeMB / limitMB * 100).toFixed(1);

        console.log('Estimated usage: ' + percentage + '% of ' + limitMB + ' MB');

        if (percentage > 90) {
            logResult('Storage Quota', false, 'Critical: ' + percentage + '% used');
            console.warn('⚠️ Storage almost full! Consider cleanup.');
        } else if (percentage > 75) {
            logResult('Storage Quota', true, 'Warning: ' + percentage + '% used (high)');
            console.warn('⚠️ Storage usage high. Monitor closely.');
        } else {
            logResult('Storage Quota', true, 'Healthy: ' + percentage + '% used');
        }

        return true;

    } catch (e) {
        logResult('Storage Quota', false, 'Error: ' + e.message);
        return false;
    }
}

/**
 * Test 4: Data corruption handling
 */
function testCorruptDataHandling() {
    console.log('\n--- Testing Corrupt Data Handling ---');

    var corruptKey = 'tts_test_corrupt_' + Date.now();

    try {
        // Create corrupted JSON
        localStorage.setItem(corruptKey, '{invalid json here}');

        // Try to parse
        try {
            var data = localStorage.getItem(corruptKey);
            JSON.parse(data); // This should throw
            logResult('Corrupt Data', false, 'Corrupt data not detected');
            localStorage.removeItem(corruptKey);
            return false;
        } catch (parseError) {
            logResult('Corrupt Data', true, 'Corrupt data detected correctly');
            localStorage.removeItem(corruptKey);
            return true;
        }

    } catch (e) {
        logResult('Corrupt Data', false, 'Unexpected error: ' + e.message);
        localStorage.removeItem(corruptKey);
        return false;
    }
}

/**
 * Test 5: Large data handling
 */
function testLargeDataHandling() {
    console.log('\n--- Testing Large Data Handling ---');

    var largeKey = 'tts_test_large_' + Date.now();

    try {
        // Create large data (100 quotes with 20 line items each)
        var largeData = [];
        for (var i = 0; i < 100; i++) {
            var quote = {
                id: 'quote-' + i,
                client: 'Test Client ' + i,
                items: []
            };
            for (var j = 0; j < 20; j++) {
                quote.items.push({
                    type: 'window',
                    count: j,
                    total: j * 45.50
                });
            }
            largeData.push(quote);
        }

        var jsonString = JSON.stringify(largeData);
        var sizeKB = (jsonString.length / 1024).toFixed(2);

        console.log('Test data size: ' + sizeKB + ' KB');

        // Try to save
        localStorage.setItem(largeKey, jsonString);
        logResult('Large Data Save', true, 'Saved ' + sizeKB + ' KB successfully');

        // Try to retrieve
        var retrieved = localStorage.getItem(largeKey);
        var parsed = JSON.parse(retrieved);

        if (parsed.length === 100) {
            logResult('Large Data Retrieve', true, 'Retrieved 100 quotes successfully');
        } else {
            logResult('Large Data Retrieve', false, 'Data mismatch');
        }

        // Cleanup
        localStorage.removeItem(largeKey);

        return true;

    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            logResult('Large Data', false, 'Quota exceeded: ' + e.message);
            console.error('⚠️ Storage quota exceeded! Clear old data.');
        } else {
            logResult('Large Data', false, 'Error: ' + e.message);
        }
        localStorage.removeItem(largeKey);
        return false;
    }
}

/**
 * Test 6: Concurrent access (multiple tabs)
 */
function testConcurrentAccess() {
    console.log('\n--- Testing Concurrent Access ---');

    // This is a basic test - full concurrent testing requires multiple tabs
    var key = 'tts_test_concurrent_' + Date.now();

    try {
        // Simulate rapid writes
        for (var i = 0; i < 10; i++) {
            localStorage.setItem(key, JSON.stringify({ value: i }));
        }

        var final = JSON.parse(localStorage.getItem(key));
        if (final.value === 9) {
            logResult('Concurrent Access', true, 'Sequential writes handled correctly');
        } else {
            logResult('Concurrent Access', false, 'Write order issue');
        }

        localStorage.removeItem(key);
        return true;

    } catch (e) {
        logResult('Concurrent Access', false, 'Error: ' + e.message);
        localStorage.removeItem(key);
        return false;
    }
}

/**
 * Test 7: Key naming conventions
 */
function testKeyNamingConventions() {
    console.log('\n--- Testing Key Naming Conventions ---');

    var appKeys = [];
    for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            if (key.indexOf('tts_') === 0 || key.indexOf('tictacstick_') === 0) {
                appKeys.push(key);
            }
        }
    }

    console.log('App keys found: ' + appKeys.length);
    for (var i = 0; i < appKeys.length; i++) {
        console.log('  - ' + appKeys[i]);
    }

    logResult('Key Naming', true, 'Found ' + appKeys.length + ' app keys');
    return true;
}

/**
 * Test 8: List all app data
 */
function listAllAppData() {
    console.log('\n--- Listing All App Data ---');

    var appData = {};
    var totalSize = 0;

    for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            if (key.indexOf('tts_') === 0 || key.indexOf('tictacstick_') === 0) {
                var value = localStorage.getItem(key);
                var size = value.length;
                totalSize += size;

                appData[key] = {
                    sizeBytes: size,
                    sizeKB: (size / 1024).toFixed(2),
                    preview: value.substring(0, 50) + (value.length > 50 ? '...' : '')
                };
            }
        }
    }

    console.log('Total app data: ' + (totalSize / 1024).toFixed(2) + ' KB');
    console.log('\nData by key:');
    for (var k in appData) {
        console.log('  ' + k + ': ' + appData[k].sizeKB + ' KB');
    }

    return appData;
}

/**
 * Run all storage tests
 */
function runAll() {
    console.log('\n========================================');
    console.log('  STORAGE TEST SUITE');
    console.log('========================================');
    console.log('  Run Date: ' + new Date().toLocaleString());
    console.log('========================================');

    _testResults = [];

    var available = testLocalStorageAvailable();
    if (!available) {
        console.error('⚠️ LocalStorage not available - cannot continue tests');
        return _testResults;
    }

    testSaveAndRetrieve();
    testStorageQuota();
    testCorruptDataHandling();
    testLargeDataHandling();
    testConcurrentAccess();
    testKeyNamingConventions();

    // Summary
    var passed = _testResults.filter(function(r) { return r.passed; }).length;
    var total = _testResults.length;
    var successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log('\n========================================');
    console.log('  STORAGE TEST RESULTS');
    console.log('========================================');
    console.log('Passed: ' + passed + ' / ' + total);
    console.log('Failed: ' + (total - passed));
    console.log('Success Rate: ' + successRate + '%');

    if (passed === total) {
        console.log('\n🎉 ALL STORAGE TESTS PASSED! 🎉');
        console.log('LocalStorage is working correctly.');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED - Review above');
    }

    return _testResults;
}

/**
 * Clear all app data (use with caution!)
 */
function clearAllAppData() {
    var confirmed = confirm('⚠️ WARNING: This will delete ALL TicTacStick data!\n\nAre you sure?');
    if (!confirmed) {
        console.log('Clear cancelled');
        return;
    }

    var keysToRemove = [];
    for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            if (key.indexOf('tts_') === 0 || key.indexOf('tictacstick_') === 0) {
                keysToRemove.push(key);
            }
        }
    }

    for (var i = 0; i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
    }

    console.log('✓ Removed ' + keysToRemove.length + ' app data keys');
}

// Public API
window.StorageTests = {
    runAll: runAll,
    listAllAppData: listAllAppData,
    clearAllAppData: clearAllAppData,
    testStorageQuota: testStorageQuota
};

console.log('[STORAGE-TESTS] Manual test suite loaded. Run: StorageTests.runAll()');

})();
