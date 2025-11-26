// deployment-helper.js - Pre-Deployment Checks
// Run before deploying to production: DeploymentHelper.runPreDeploymentChecks()
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

// Skip heavy checks during automated Playwright runs
if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[DEPLOYMENT-HELPER] Skipped in test mode');
    return;
}

/**
 * Configuration (update these before deployment)
 */
var DEPLOYMENT_CONFIG = {
    version: '1.9.0', // Expected app version
    companyName: '925 Pressure Glass',
    requiredModules: [
        'app', 'calc', 'storage', 'invoice', 'analytics',
        'client-database', 'quote-pdf', 'ui-components'
    ],
    requiredPages: [
        'page-quotes', 'page-analytics', 'page-settings'
    ]
};

/**
 * Check app version
 */
function checkVersion() {
    console.log('\n--- Checking Version ---');

    if (typeof APP_CONFIG === 'undefined') {
        console.error('✗ APP_CONFIG not defined');
        return false;
    }

    var currentVersion = APP_CONFIG.version || 'unknown';
    console.log('Current version: ' + currentVersion);
    console.log('Expected version: ' + DEPLOYMENT_CONFIG.version);

    if (currentVersion === DEPLOYMENT_CONFIG.version) {
        console.log('✓ Version correct');
        return true;
    } else if (currentVersion === 'unknown' || currentVersion === '0.0.0') {
        console.error('✗ Version not set properly');
        return false;
    } else {
        console.warn('⚠️ Version mismatch (may be intentional)');
        return true;
    }
}

/**
 * Check company configuration
 */
function checkCompanyConfig() {
    console.log('\n--- Checking Company Configuration ---');
    var issues = [];

    if (typeof COMPANY_CONFIG === 'undefined') {
        console.error('✗ COMPANY_CONFIG not defined');
        return false;
    }

    // Check company name
    if (!COMPANY_CONFIG.name || COMPANY_CONFIG.name === 'Your Company Name') {
        issues.push('Company name not set');
    } else {
        console.log('✓ Company name: ' + COMPANY_CONFIG.name);
    }

    // Check ABN
    if (!COMPANY_CONFIG.abn || COMPANY_CONFIG.abn === '12 345 678 901') {
        issues.push('ABN not updated from default');
    } else {
        console.log('✓ ABN: ' + COMPANY_CONFIG.abn);
    }

    // Check email
    if (!COMPANY_CONFIG.email || COMPANY_CONFIG.email.indexOf('example') > -1) {
        issues.push('Email not updated from default');
    } else {
        console.log('✓ Email: ' + COMPANY_CONFIG.email);
    }

    // Check phone
    if (!COMPANY_CONFIG.phone || COMPANY_CONFIG.phone === '0400 000 000') {
        issues.push('Phone not updated from default');
    } else {
        console.log('✓ Phone: ' + COMPANY_CONFIG.phone);
    }

    // Check logo
    if (!COMPANY_CONFIG.logo || !COMPANY_CONFIG.logo.base64) {
        console.warn('⚠️ Warning: Logo not set (PDFs will have no logo)');
    } else {
        console.log('✓ Logo configured');
    }

    if (issues.length > 0) {
        console.error('✗ Company config issues:');
        for (var i = 0; i < issues.length; i++) {
            console.error('  - ' + issues[i]);
        }
        return false;
    }

    console.log('✓ Company configuration complete');
    return true;
}

/**
 * Check for debug code
 */
function checkDebugCode() {
    console.log('\n--- Checking for Debug Code ---');
    var warnings = [];

    // Check for console.log in page HTML
    var bodyHTML = document.body.innerHTML;

    if (bodyHTML.indexOf('console.log') > -1) {
        warnings.push('console.log found in HTML');
    }

    if (bodyHTML.indexOf('debugger') > -1) {
        warnings.push('debugger statement found in HTML');
    }

    // Check for debug mode enabled
    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.enabled) {
        warnings.push('DEBUG_CONFIG.enabled is true');
    }

    // Check localStorage for debug flags
    if (localStorage.getItem('debug-enabled') === 'true') {
        warnings.push('Debug mode enabled in localStorage');
    }

    if (warnings.length > 0) {
        console.warn('⚠️ Debug code warnings:');
        for (var i = 0; i < warnings.length; i++) {
            console.warn('  - ' + warnings[i]);
        }
        console.warn('Consider removing debug code for production');
        return false;
    }

    console.log('✓ No debug code found');
    return true;
}

/**
 * Check required modules loaded
 */
function checkRequiredModules() {
    console.log('\n--- Checking Required Modules ---');
    var missing = [];

    for (var i = 0; i < DEPLOYMENT_CONFIG.requiredModules.length; i++) {
        var moduleName = DEPLOYMENT_CONFIG.requiredModules[i];
        var moduleExists = false;

        // Check if module exists in window object
        var capitalizedName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        var camelCaseName = moduleName.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });

        if (window[moduleName] || window[capitalizedName] || window[camelCaseName]) {
            moduleExists = true;
        }

        // Also check APP modules
        if (typeof APP !== 'undefined' && APP.getModule && APP.getModule(moduleName)) {
            moduleExists = true;
        }

        if (moduleExists) {
            console.log('✓ ' + moduleName);
        } else {
            missing.push(moduleName);
        }
    }

    if (missing.length > 0) {
        console.error('✗ Missing modules:');
        for (var j = 0; j < missing.length; j++) {
            console.error('  - ' + missing[j]);
        }
        return false;
    }

    console.log('✓ All required modules loaded');
    return true;
}

/**
 * Check required pages exist
 */
function checkRequiredPages() {
    console.log('\n--- Checking Required Pages ---');
    var missing = [];

    for (var i = 0; i < DEPLOYMENT_CONFIG.requiredPages.length; i++) {
        var pageId = DEPLOYMENT_CONFIG.requiredPages[i];
        var element = document.getElementById(pageId);

        if (element) {
            console.log('✓ ' + pageId);
        } else {
            missing.push(pageId);
        }
    }

    if (missing.length > 0) {
        console.error('✗ Missing pages:');
        for (var j = 0; j < missing.length; j++) {
            console.error('  - ' + missing[j]);
        }
        return false;
    }

    console.log('✓ All required pages exist');
    return true;
}

/**
 * Check LocalStorage availability
 */
function checkLocalStorage() {
    console.log('\n--- Checking LocalStorage ---');

    try {
        var test = '__deployment_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        console.log('✓ LocalStorage available');
        return true;
    } catch (e) {
        console.error('✗ LocalStorage not available:', e.message);
        return false;
    }
}

/**
 * Check required libraries
 */
function checkRequiredLibraries() {
    console.log('\n--- Checking Required Libraries ---');
    var missing = [];

    // jsPDF
    if (typeof jsPDF === 'undefined') {
        missing.push('jsPDF (required for PDF generation)');
    } else {
        console.log('✓ jsPDF loaded');
    }

    // Chart.js
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js not loaded (analytics charts will not work)');
    } else {
        console.log('✓ Chart.js loaded');
    }

    if (missing.length > 0) {
        console.error('✗ Missing libraries:');
        for (var i = 0; i < missing.length; i++) {
            console.error('  - ' + missing[i]);
        }
        return false;
    }

    console.log('✓ All required libraries loaded');
    return true;
}

/**
 * Check Service Worker
 */
function checkServiceWorker() {
    console.log('\n--- Checking Service Worker ---');

    if ('serviceWorker' in navigator) {
        console.log('✓ Service Worker API available');

        // Check if SW is registered
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            if (registrations.length > 0) {
                console.log('✓ Service Worker registered (' + registrations.length + ' registration(s))');
            } else {
                console.warn('⚠️ Service Worker not registered yet (will register on page load)');
            }
        });

        return true;
    } else {
        console.warn('⚠️ Service Worker not available (PWA features limited)');
        return true; // Not critical
    }
}

/**
 * Check manifest.json
 */
function checkManifest() {
    console.log('\n--- Checking PWA Manifest ---');

    var manifestLink = document.querySelector('link[rel="manifest"]');

    if (!manifestLink) {
        console.warn('⚠️ Manifest link not found in HTML');
        return false;
    }

    console.log('✓ Manifest link present: ' + manifestLink.href);

    // Try to fetch manifest
    fetch(manifestLink.href)
        .then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Manifest not found');
            }
        })
        .then(function(manifest) {
            console.log('✓ Manifest loaded successfully');
            console.log('  Name: ' + manifest.name);
            console.log('  Short name: ' + manifest.short_name);
        })
        .catch(function(error) {
            console.error('✗ Manifest error:', error.message);
        });

    return true;
}

/**
 * Run all pre-deployment checks
 */
function runPreDeploymentChecks() {
    console.log('\n========================================');
    console.log('  PRE-DEPLOYMENT CHECKS');
    console.log('========================================');
    console.log('  Date: ' + new Date().toLocaleString());
    console.log('========================================');

    var checks = [];

    checks.push({ name: 'Version', passed: checkVersion() });
    checks.push({ name: 'Company Config', passed: checkCompanyConfig() });
    checks.push({ name: 'Debug Code', passed: checkDebugCode() });
    checks.push({ name: 'Required Modules', passed: checkRequiredModules() });
    checks.push({ name: 'Required Pages', passed: checkRequiredPages() });
    checks.push({ name: 'LocalStorage', passed: checkLocalStorage() });
    checks.push({ name: 'Required Libraries', passed: checkRequiredLibraries() });
    checks.push({ name: 'Service Worker', passed: checkServiceWorker() });
    checks.push({ name: 'PWA Manifest', passed: checkManifest() });

    // Summary
    var passed = 0;
    var failed = 0;

    for (var i = 0; i < checks.length; i++) {
        if (checks[i].passed) {
            passed++;
        } else {
            failed++;
        }
    }

    console.log('\n========================================');
    console.log('  DEPLOYMENT CHECK RESULTS');
    console.log('========================================');
    console.log('Passed: ' + passed + ' / ' + checks.length);
    console.log('Failed: ' + failed);

    if (failed === 0) {
        console.log('\n🎉 ALL CHECKS PASSED - READY TO DEPLOY! 🎉');
        console.log('\nNext steps:');
        console.log('1. Run final manual tests on target devices');
        console.log('2. Create git tag for this version');
        console.log('3. Deploy to production server');
        console.log('4. Run post-deployment health check');
        return true;
    } else {
        console.error('\n❌ DEPLOYMENT BLOCKED - FIX THESE ISSUES:');
        for (var j = 0; j < checks.length; j++) {
            if (!checks[j].passed) {
                console.error('  - ' + checks[j].name);
            }
        }
        console.error('\nResolve all issues before deploying!');
        return false;
    }
}

/**
 * Create deployment info package
 */
function createDeploymentInfo() {
    var info = {
        version: (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.version : 'unknown',
        buildDate: new Date().toISOString(),
        environment: 'production',
        userAgent: navigator.userAgent,
        features: {
            pwa: 'serviceWorker' in navigator,
            offline: true,
            analytics: typeof window.AnalyticsEngine !== 'undefined',
            pdfGeneration: typeof jsPDF !== 'undefined',
            charts: typeof Chart !== 'undefined',
            clientDatabase: typeof window.ClientDatabase !== 'undefined'
        },
        config: {}
    };

    if (typeof COMPANY_CONFIG !== 'undefined') {
        info.config = {
            companyName: COMPANY_CONFIG.name,
            hasLogo: !!(COMPANY_CONFIG.logo && COMPANY_CONFIG.logo.base64),
            abn: COMPANY_CONFIG.abn,
            email: COMPANY_CONFIG.email,
            phone: COMPANY_CONFIG.phone
        };
    }

    console.log('\n========================================');
    console.log('  DEPLOYMENT INFO');
    console.log('========================================\n');
    console.log(JSON.stringify(info, null, 2));

    return info;
}

/**
 * Export deployment checklist
 */
function exportDeploymentChecklist() {
    var checklist = [
        'Pre-Deployment Checklist',
        '',
        'Code Quality:',
        '[ ] All tests passing',
        '[ ] No console errors',
        '[ ] Version number updated',
        '[ ] Company config updated',
        '[ ] Logo uploaded',
        '',
        'Assets:',
        '[ ] Images optimized',
        '[ ] Service worker configured',
        '[ ] Manifest.json updated',
        '',
        'Testing:',
        '[ ] Tested on iPhone',
        '[ ] Tested on iPad',
        '[ ] Tested offline mode',
        '[ ] PDF generation works',
        '[ ] Analytics functional',
        '',
        'Documentation:',
        '[ ] CHANGELOG updated',
        '[ ] README updated',
        '[ ] User guide current',
        '',
        'Deployment:',
        '[ ] Backup created',
        '[ ] Git tag created',
        '[ ] Deployed to production',
        '[ ] Post-deployment check passed',
        '',
        'Deployment Date: ' + new Date().toLocaleDateString(),
        'Deployed By: _____________',
        'Version: ' + ((typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.version : 'unknown')
    ];

    var text = checklist.join('\n');

    // Download as text file
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'deployment-checklist-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Deployment checklist exported');
}

// Public API
window.DeploymentHelper = {
    runPreDeploymentChecks: runPreDeploymentChecks,
    createDeploymentInfo: createDeploymentInfo,
    exportDeploymentChecklist: exportDeploymentChecklist,
    checkVersion: checkVersion,
    checkCompanyConfig: checkCompanyConfig,
    checkDebugCode: checkDebugCode
};

console.log('[DEPLOYMENT-HELPER] Ready. Run: DeploymentHelper.runPreDeploymentChecks()');

// Auto-run if URL has deployment-check parameter
if (window.location.search.indexOf('deployment-check') > -1) {
    console.log('Auto-running deployment checks...');
    setTimeout(function() {
        DeploymentHelper.runPreDeploymentChecks();
        DeploymentHelper.createDeploymentInfo();
    }, 1000);
}

})();
