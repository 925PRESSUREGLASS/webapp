// health-check.js - Post-Deployment Health Monitoring
// Run periodically to ensure app is functioning: HealthCheck.runHealthCheck()
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[HEALTH-CHECK] Skipped in test mode');
    return;
}

var _lastCheckResults = null;
var _checkInterval = null;

/**
 * Check LocalStorage availability and health
 */
function checkLocalStorage() {
    try {
        var test = '__health_check_' + Date.now();
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);

        return {
            name: 'LocalStorage',
            status: 'ok',
            message: 'Available and writable'
        };
    } catch (e) {
        return {
            name: 'LocalStorage',
            status: 'error',
            message: 'Not available: ' + e.message
        };
    }
}

/**
 * Check data integrity
 */
function checkDataIntegrity() {
    try {
        var quotes = [];
        var corrupted = 0;

        // Try to load quotes from storage
        var quotesData = localStorage.getItem('tts_quotes') || localStorage.getItem('tictacstick_saved_quotes_v1');

        if (quotesData) {
            try {
                quotes = JSON.parse(quotesData);
                if (!Array.isArray(quotes)) {
                    quotes = [];
                }
            } catch (e) {
                return {
                    name: 'Data Integrity',
                    status: 'error',
                    message: 'Quotes data corrupted: ' + e.message
                };
            }
        }

        // Check each quote for corruption
        for (var i = 0; i < quotes.length; i++) {
            var quote = quotes[i];
            if (!quote.id || typeof quote.total === 'undefined') {
                corrupted++;
            }
        }

        if (corrupted > 0) {
            return {
                name: 'Data Integrity',
                status: 'warning',
                message: corrupted + ' corrupted quote(s) found out of ' + quotes.length
            };
        }

        return {
            name: 'Data Integrity',
            status: 'ok',
            message: 'All data valid (' + quotes.length + ' quotes checked)'
        };

    } catch (e) {
        return {
            name: 'Data Integrity',
            status: 'error',
            message: 'Check failed: ' + e.message
        };
    }
}

/**
 * Check storage capacity
 */
function checkStorageCapacity() {
    try {
        var totalSize = 0;
        var appSize = 0;

        // Calculate total localStorage usage
        for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                var value = localStorage.getItem(key);
                var itemSize = key.length + value.length;
                totalSize += itemSize;

                // Count app-specific keys
                if (key.indexOf('tts_') === 0 || key.indexOf('tictacstick_') === 0) {
                    appSize += itemSize;
                }
            }
        }

        var totalMB = (totalSize / 1048576).toFixed(2);
        var appMB = (appSize / 1048576).toFixed(2);

        // Estimate usage percentage (5MB conservative limit)
        var limitMB = 5;
        var percentage = ((totalMB / limitMB) * 100).toFixed(1);

        if (percentage > 90) {
            return {
                name: 'Storage Capacity',
                status: 'error',
                message: 'Critical: ' + percentage + '% used (' + totalMB + ' MB / ' + limitMB + ' MB)'
            };
        } else if (percentage > 75) {
            return {
                name: 'Storage Capacity',
                status: 'warning',
                message: 'High: ' + percentage + '% used (' + totalMB + ' MB / ' + limitMB + ' MB)'
            };
        }

        return {
            name: 'Storage Capacity',
            status: 'ok',
            message: percentage + '% used (' + totalMB + ' MB total, ' + appMB + ' MB app data)'
        };

    } catch (e) {
        return {
            name: 'Storage Capacity',
            status: 'error',
            message: 'Check failed: ' + e.message
        };
    }
}

/**
 * Check calculation performance
 */
function checkPerformance() {
    try {
        // Test basic calculation speed
        var start = performance.now();

        // Perform typical calculations
        for (var i = 0; i < 100; i++) {
            var cents1 = Money.toCents(123.45);
            var cents2 = Money.toCents(67.89);
            Money.sumCents(cents1, cents2);
        }

        var end = performance.now();
        var time = end - start;
        var avgTime = time / 100;

        if (avgTime > 1.0) {
            return {
                name: 'Performance',
                status: 'warning',
                message: 'Slow calculations: ' + avgTime.toFixed(2) + 'ms avg'
            };
        }

        return {
            name: 'Performance',
            status: 'ok',
            message: 'Calculations fast (' + avgTime.toFixed(2) + 'ms avg)'
        };

    } catch (e) {
        return {
            name: 'Performance',
            status: 'error',
            message: 'Performance test failed: ' + e.message
        };
    }
}

/**
 * Check for JavaScript errors
 */
function checkErrorRate() {
    // This would integrate with error tracking if implemented
    // For now, just check if error handler exists

    if (typeof window.onerror !== 'undefined') {
        return {
            name: 'Error Handling',
            status: 'ok',
            message: 'Error handler active'
        };
    }

    return {
        name: 'Error Handling',
        status: 'warning',
        message: 'No global error handler detected'
    };
}

/**
 * Check memory usage (Chrome/Edge only)
 */
function checkMemoryUsage() {
    if (!performance.memory) {
        return {
            name: 'Memory Usage',
            status: 'ok',
            message: 'Memory API not available (Safari/Firefox)'
        };
    }

    try {
        var used = performance.memory.usedJSHeapSize;
        var limit = performance.memory.jsHeapSizeLimit;
        var percentage = ((used / limit) * 100).toFixed(1);
        var usedMB = (used / 1048576).toFixed(2);

        if (percentage > 90) {
            return {
                name: 'Memory Usage',
                status: 'error',
                message: 'Critical: ' + percentage + '% (' + usedMB + ' MB)'
            };
        } else if (percentage > 70) {
            return {
                name: 'Memory Usage',
                status: 'warning',
                message: 'High: ' + percentage + '% (' + usedMB + ' MB)'
            };
        }

        return {
            name: 'Memory Usage',
            status: 'ok',
            message: percentage + '% used (' + usedMB + ' MB)'
        };

    } catch (e) {
        return {
            name: 'Memory Usage',
            status: 'error',
            message: 'Check failed: ' + e.message
        };
    }
}

/**
 * Check required modules are loaded
 */
function checkModulesLoaded() {
    var requiredModules = [
        'Money', 'Time', 'APP', 'UIComponents'
    ];

    var missing = [];

    for (var i = 0; i < requiredModules.length; i++) {
        var moduleName = requiredModules[i];
        if (typeof window[moduleName] === 'undefined') {
            missing.push(moduleName);
        }
    }

    if (missing.length > 0) {
        return {
            name: 'Modules Loaded',
            status: 'error',
            message: 'Missing: ' + missing.join(', ')
        };
    }

    return {
        name: 'Modules Loaded',
        status: 'ok',
        message: 'All required modules loaded'
    };
}

/**
 * Check Service Worker status
 */
function checkServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return {
            name: 'Service Worker',
            status: 'warning',
            message: 'Service Worker API not available'
        };
    }

    // This is async, so just check if API is available
    return {
        name: 'Service Worker',
        status: 'ok',
        message: 'Service Worker API available'
    };
}

/**
 * Run complete health check
 */
function runHealthCheck() {
    console.log('\n========================================');
    console.log('  APP HEALTH CHECK');
    console.log('========================================');
    console.log('  ' + new Date().toLocaleString());
    console.log('========================================');

    var results = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        checks: []
    };

    // Run all checks
    results.checks.push(checkLocalStorage());
    results.checks.push(checkDataIntegrity());
    results.checks.push(checkStorageCapacity());
    results.checks.push(checkPerformance());
    results.checks.push(checkErrorRate());
    results.checks.push(checkMemoryUsage());
    results.checks.push(checkModulesLoaded());
    results.checks.push(checkServiceWorker());

    // Print results
    console.log('\nCheck Results:');
    for (var i = 0; i < results.checks.length; i++) {
        var check = results.checks[i];
        var icon = check.status === 'ok' ? '✓' :
                   check.status === 'warning' ? '⚠️' : '✗';
        var color = check.status === 'ok' ? '' :
                    check.status === 'warning' ? 'color: orange' : 'color: red';

        if (color) {
            console.log('%c' + icon + ' ' + check.name + ': ' + check.message, color);
        } else {
            console.log(icon + ' ' + check.name + ': ' + check.message);
        }
    }

    // Determine overall health
    var errorChecks = results.checks.filter(function(c) {
        return c.status === 'error';
    });

    var warningChecks = results.checks.filter(function(c) {
        return c.status === 'warning';
    });

    if (errorChecks.length > 0) {
        results.overall = 'unhealthy';
    } else if (warningChecks.length > 0) {
        results.overall = 'degraded';
    }

    // Summary
    console.log('\n========================================');
    console.log('  HEALTH SUMMARY');
    console.log('========================================');
    console.log('Overall Status: ' + results.overall.toUpperCase());
    console.log('Passed: ' + results.checks.filter(function(c) { return c.status === 'ok'; }).length);
    console.log('Warnings: ' + warningChecks.length);
    console.log('Errors: ' + errorChecks.length);

    if (results.overall === 'unhealthy') {
        console.error('\n❌ ACTION REQUIRED - Critical issues detected!');
        console.error('Review errors above and take corrective action.');
    } else if (results.overall === 'degraded') {
        console.warn('\n⚠️ DEGRADED - Review warnings');
        console.warn('Monitor closely and address warnings when possible.');
    } else {
        console.log('\n✓ All systems operational');
    }

    _lastCheckResults = results;
    return results;
}

/**
 * Schedule periodic health checks
 */
function scheduleHealthChecks(intervalMinutes) {
    intervalMinutes = intervalMinutes || 60; // Default 1 hour

    // Clear existing interval
    if (_checkInterval) {
        clearInterval(_checkInterval);
    }

    console.log('Scheduling health checks every ' + intervalMinutes + ' minutes');

    // Set new interval
    _checkInterval = setInterval(function() {
        console.log('\n[Auto Health Check]');
        runHealthCheck();
    }, intervalMinutes * 60 * 1000);

    // Run immediately
    runHealthCheck();
}

/**
 * Stop scheduled health checks
 */
function stopHealthChecks() {
    if (_checkInterval) {
        clearInterval(_checkInterval);
        _checkInterval = null;
        console.log('Health check scheduling stopped');
    }
}

/**
 * Get last check results
 */
function getLastCheckResults() {
    return _lastCheckResults;
}

/**
 * Export health check results
 */
function exportHealthCheckResults() {
    if (!_lastCheckResults) {
        console.warn('No health check results available. Run health check first.');
        return;
    }

    var report = [
        'TicTacStick Health Check Report',
        '================================',
        '',
        'Timestamp: ' + _lastCheckResults.timestamp,
        'Overall Status: ' + _lastCheckResults.overall.toUpperCase(),
        '',
        'Check Results:',
        '-------------'
    ];

    for (var i = 0; i < _lastCheckResults.checks.length; i++) {
        var check = _lastCheckResults.checks[i];
        report.push(check.name + ': ' + check.status.toUpperCase());
        report.push('  ' + check.message);
    }

    var text = report.join('\n');

    // Download as text file
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'health-check-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Health check results exported');
}

// Public API
window.HealthCheck = {
    runHealthCheck: runHealthCheck,
    scheduleHealthChecks: scheduleHealthChecks,
    stopHealthChecks: stopHealthChecks,
    getLastCheckResults: getLastCheckResults,
    exportHealthCheckResults: exportHealthCheckResults
};

console.log('[HEALTH-CHECK] Ready. Run: HealthCheck.runHealthCheck()');

// Auto-run health check in production mode
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log('Production mode detected - Scheduling health checks...');
    setTimeout(function() {
        // Run health check after app loads
        scheduleHealthChecks(60); // Every hour
    }, 5000);
}

})();
