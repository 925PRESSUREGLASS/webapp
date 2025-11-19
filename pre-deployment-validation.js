// pre-deployment-validation.js - Comprehensive Pre-Deployment Validation
// Run this in browser console BEFORE deploying to production
// Copy entire file, paste into console, then run: PreDeploymentValidation.runAll()
// iOS Safari 12+ compatible (no ES6)

(function() {
  'use strict';

  var EXPECTED_VERSION = '1.13.0';
  var MIN_READINESS_SCORE = 90;
  var MAX_ACCEPTABLE_WARNINGS = 5;

  /**
   * Run all pre-deployment validations
   */
  function runAll() {
    console.log('\n' + '='.repeat(60));
    console.log('PRE-DEPLOYMENT VALIDATION FOR v' + EXPECTED_VERSION);
    console.log('='.repeat(60));
    console.log('Started: ' + new Date().toLocaleString());
    console.log('='.repeat(60) + '\n');

    var results = {
      timestamp: new Date().toISOString(),
      version: EXPECTED_VERSION,
      passed: [],
      warnings: [],
      failed: [],
      blockers: []
    };

    // Phase 1: Critical Pre-Checks
    console.log('PHASE 1: CRITICAL PRE-CHECKS');
    console.log('-'.repeat(60));
    
    validateVersion(results);
    validateProductionTools(results);
    validateDebugMode(results);
    
    // Phase 2: Deployment Helper Checks
    console.log('\nPHASE 2: DEPLOYMENT HELPER CHECKS');
    console.log('-'.repeat(60));
    
    runDeploymentHelper(results);
    
    // Phase 3: Production Readiness
    console.log('\nPHASE 3: PRODUCTION READINESS');
    console.log('-'.repeat(60));
    
    runProductionReadinessCheck(results);
    
    // Phase 4: Health Check
    console.log('\nPHASE 4: HEALTH CHECK');
    console.log('-'.repeat(60));
    
    runHealthCheck(results);
    
    // Phase 5: Security Validation
    console.log('\nPHASE 5: SECURITY VALIDATION');
    console.log('-'.repeat(60));
    
    validateSecurity(results);
    
    // Phase 6: Data Integrity
    console.log('\nPHASE 6: DATA INTEGRITY');
    console.log('-'.repeat(60));
    
    validateDataIntegrity(results);
    
    // Phase 7: Performance Validation
    console.log('\nPHASE 7: PERFORMANCE VALIDATION');
    console.log('-'.repeat(60));
    
    validatePerformance(results);

    // Generate summary
    printSummary(results);

    return results;
  }

  /**
   * Validate version
   */
  function validateVersion(results) {
    console.log('\n[1/7] Checking version...');

    if (typeof APP_CONFIG === 'undefined') {
      results.failed.push('APP_CONFIG not defined');
      results.blockers.push('APP_CONFIG missing - cannot verify version');
      console.error('✗ APP_CONFIG not defined');
      return;
    }

    var currentVersion = APP_CONFIG.version || 'unknown';

    if (currentVersion === EXPECTED_VERSION) {
      results.passed.push('Version correct: ' + EXPECTED_VERSION);
      console.log('✓ Version: ' + currentVersion);
    } else {
      results.warnings.push('Version mismatch: ' + currentVersion + ' (expected ' + EXPECTED_VERSION + ')');
      console.warn('⚠️  Version: ' + currentVersion + ' (expected ' + EXPECTED_VERSION + ')');
    }
  }

  /**
   * Validate production tools loaded
   */
  function validateProductionTools(results) {
    console.log('\n[2/7] Checking production tools...');

    var requiredTools = [
      'DeploymentHelper',
      'HealthCheck',
      'ProductionReadiness',
      'BugTracker',
      'BackupManager'
    ];

    var missing = [];
    var loaded = [];

    for (var i = 0; i < requiredTools.length; i++) {
      var tool = requiredTools[i];
      if (typeof window[tool] === 'undefined') {
        missing.push(tool);
      } else {
        loaded.push(tool);
      }
    }

    if (missing.length === 0) {
      results.passed.push('All production tools loaded (' + loaded.length + ')');
      console.log('✓ All production tools loaded');
      for (var j = 0; j < loaded.length; j++) {
        console.log('  ✓ ' + loaded[j]);
      }
    } else {
      results.failed.push('Missing production tools: ' + missing.join(', '));
      results.blockers.push('Production tools missing - deployment blocked');
      console.error('✗ Missing production tools:');
      for (var k = 0; k < missing.length; k++) {
        console.error('  ✗ ' + missing[k]);
      }
    }
  }

  /**
   * Validate debug mode disabled
   */
  function validateDebugMode(results) {
    console.log('\n[3/7] Checking debug mode...');

    var debugEnabled = localStorage.getItem('debug-enabled') === 'true';

    if (!debugEnabled) {
      results.passed.push('Debug mode disabled');
      console.log('✓ Debug mode disabled');
    } else {
      results.warnings.push('Debug mode enabled - should be disabled for production');
      console.warn('⚠️  Debug mode enabled');
      console.warn('   Run: localStorage.removeItem("debug-enabled")');
    }
  }

  /**
   * Run DeploymentHelper checks
   */
  function runDeploymentHelper(results) {
    console.log('\n[4/7] Running DeploymentHelper checks...');

    if (typeof DeploymentHelper === 'undefined') {
      results.failed.push('DeploymentHelper not available');
      console.error('✗ DeploymentHelper not available');
      return;
    }

    try {
      var passed = DeploymentHelper.runPreDeploymentChecks();

      if (passed) {
        results.passed.push('DeploymentHelper: All checks passed');
        console.log('✓ DeploymentHelper checks passed');
      } else {
        results.failed.push('DeploymentHelper: Some checks failed');
        results.blockers.push('DeploymentHelper checks failed - review output above');
        console.error('✗ DeploymentHelper checks failed');
      }
    } catch (e) {
      results.failed.push('DeploymentHelper error: ' + e.message);
      console.error('✗ DeploymentHelper error:', e.message);
    }
  }

  /**
   * Run ProductionReadiness check
   */
  function runProductionReadinessCheck(results) {
    console.log('\n[5/7] Running ProductionReadiness check...');

    if (typeof ProductionReadiness === 'undefined') {
      results.failed.push('ProductionReadiness not available');
      console.error('✗ ProductionReadiness not available');
      return;
    }

    try {
      var readinessResults = ProductionReadiness.runCheck();
      var score = readinessResults.score || 0;

      if (score >= MIN_READINESS_SCORE) {
        results.passed.push('Production readiness: READY (Score: ' + score + '/100)');
        console.log('✓ Production readiness score: ' + score + '/100');
      } else if (score >= 75) {
        results.warnings.push('Production readiness: CAUTION (Score: ' + score + '/100)');
        console.warn('⚠️  Production readiness score: ' + score + '/100 (target: ' + MIN_READINESS_SCORE + '+)');
      } else {
        results.failed.push('Production readiness: NOT READY (Score: ' + score + '/100)');
        results.blockers.push('Readiness score too low - fix critical issues');
        console.error('✗ Production readiness score: ' + score + '/100 (minimum: 75)');
      }
    } catch (e) {
      results.failed.push('ProductionReadiness error: ' + e.message);
      console.error('✗ ProductionReadiness error:', e.message);
    }
  }

  /**
   * Run HealthCheck
   */
  function runHealthCheck(results) {
    console.log('\n[6/7] Running HealthCheck...');

    if (typeof HealthCheck === 'undefined') {
      results.failed.push('HealthCheck not available');
      console.error('✗ HealthCheck not available');
      return;
    }

    try {
      var healthResults = HealthCheck.runHealthCheck();
      var status = healthResults.overall;

      if (status === 'healthy') {
        results.passed.push('Health check: HEALTHY');
        console.log('✓ Health status: HEALTHY');
      } else if (status === 'degraded') {
        results.warnings.push('Health check: DEGRADED (review warnings)');
        console.warn('⚠️  Health status: DEGRADED');
      } else {
        results.failed.push('Health check: UNHEALTHY');
        results.blockers.push('Health check failed - fix critical issues');
        console.error('✗ Health status: UNHEALTHY');
      }
    } catch (e) {
      results.failed.push('HealthCheck error: ' + e.message);
      console.error('✗ HealthCheck error:', e.message);
    }
  }

  /**
   * Validate security
   */
  function validateSecurity(results) {
    console.log('\n[7/7] Validating security...');

    var securityChecks = [];

    // Check HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      securityChecks.push({ name: 'HTTPS', passed: true });
      console.log('✓ Using HTTPS');
    } else {
      securityChecks.push({ name: 'HTTPS', passed: false });
      results.failed.push('Not using HTTPS');
      results.blockers.push('HTTPS required for production');
      console.error('✗ Not using HTTPS');
    }

    // Check Security module
    if (typeof Security !== 'undefined' && Security.escapeHTML) {
      securityChecks.push({ name: 'XSS Prevention', passed: true });
      console.log('✓ XSS prevention available');
    } else {
      securityChecks.push({ name: 'XSS Prevention', passed: false });
      results.warnings.push('Security module not loaded');
      console.warn('⚠️  Security module not loaded');
    }

    // Check validation
    if (typeof InvoiceValidation !== 'undefined') {
      securityChecks.push({ name: 'Input Validation', passed: true });
      console.log('✓ Input validation available');
    } else {
      securityChecks.push({ name: 'Input Validation', passed: false });
      results.warnings.push('Validation module not loaded');
      console.warn('⚠️  Validation module not loaded');
    }

    var passedSecurity = securityChecks.filter(function(c) { return c.passed; }).length;
    var totalSecurity = securityChecks.length;

    if (passedSecurity === totalSecurity) {
      results.passed.push('All security checks passed (' + passedSecurity + '/' + totalSecurity + ')');
    } else {
      results.warnings.push('Some security checks failed (' + passedSecurity + '/' + totalSecurity + ')');
    }
  }

  /**
   * Validate data integrity
   */
  function validateDataIntegrity(results) {
    console.log('\nValidating data integrity...');

    try {
      // Check LocalStorage accessible
      localStorage.setItem('_test', 'test');
      localStorage.removeItem('_test');

      results.passed.push('LocalStorage accessible');
      console.log('✓ LocalStorage accessible');

      // Check for data corruption
      var corruptionFound = false;

      try {
        var quotes = localStorage.getItem('tictacstick_saved_quotes_v1');
        if (quotes) {
          JSON.parse(quotes);
        }
      } catch (e) {
        corruptionFound = true;
        results.failed.push('Quote data corrupted');
        results.blockers.push('Data corruption detected - backup and restore required');
        console.error('✗ Quote data corrupted');
      }

      try {
        var clients = localStorage.getItem('client-database');
        if (clients) {
          JSON.parse(clients);
        }
      } catch (e) {
        corruptionFound = true;
        results.failed.push('Client data corrupted');
        results.blockers.push('Data corruption detected - backup and restore required');
        console.error('✗ Client data corrupted');
      }

      if (!corruptionFound) {
        results.passed.push('No data corruption detected');
        console.log('✓ No data corruption detected');
      }

    } catch (e) {
      results.failed.push('LocalStorage not accessible: ' + e.message);
      results.blockers.push('LocalStorage critical failure');
      console.error('✗ LocalStorage error:', e.message);
    }
  }

  /**
   * Validate performance
   */
  function validatePerformance(results) {
    console.log('\nValidating performance...');

    // Test calculation speed
    var start = performance.now();
    
    for (var i = 0; i < 1000; i++) {
      if (typeof Money !== 'undefined') {
        var cents = Money.toCents(123.45);
        Money.fromCents(cents);
      }
    }

    var end = performance.now();
    var avgTime = (end - start) / 1000;

    if (avgTime < 1.0) {
      results.passed.push('Calculation performance good (' + avgTime.toFixed(3) + 'ms avg)');
      console.log('✓ Calculation speed: ' + avgTime.toFixed(3) + 'ms avg');
    } else {
      results.warnings.push('Calculation performance slow (' + avgTime.toFixed(3) + 'ms avg)');
      console.warn('⚠️  Calculation speed: ' + avgTime.toFixed(3) + 'ms avg');
    }

    // Check memory usage (Chrome only)
    if (performance.memory) {
      var memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);

      if (performance.memory.usedJSHeapSize < 100 * 1024 * 1024) {
        results.passed.push('Memory usage healthy (' + memoryMB + ' MB)');
        console.log('✓ Memory usage: ' + memoryMB + ' MB');
      } else {
        results.warnings.push('Memory usage high (' + memoryMB + ' MB)');
        console.warn('⚠️  Memory usage: ' + memoryMB + ' MB');
      }
    }
  }

  /**
   * Print summary
   */
  function printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('PRE-DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✓ Passed:   ' + results.passed.length);
    console.log('⚠️  Warnings: ' + results.warnings.length);
    console.log('✗ Failed:   ' + results.failed.length);
    console.log('🚫 Blockers: ' + results.blockers.length);

    // Determine overall status
    var canDeploy = results.blockers.length === 0 && 
                    results.failed.length === 0 &&
                    results.warnings.length <= MAX_ACCEPTABLE_WARNINGS;

    console.log('\n' + '='.repeat(60));

    if (canDeploy) {
      console.log('%c✓ DEPLOYMENT APPROVED', 'color: green; font-weight: bold; font-size: 16px;');
      console.log('%cYou may proceed with deployment to production.', 'color: green;');
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️  Note: ' + results.warnings.length + ' warning(s) detected (acceptable)');
        console.log('Review warnings below:');
        for (var i = 0; i < results.warnings.length; i++) {
          console.log('  ' + (i + 1) + '. ' + results.warnings[i]);
        }
      }

      console.log('\nNext steps:');
      console.log('1. Create backup: BackupManager.exportAllData()');
      console.log('2. Create git tag: git tag -a v' + EXPECTED_VERSION + ' -m "Production release"');
      console.log('3. Deploy to production');
      console.log('4. Run post-deployment verification');

    } else {
      console.log('%c✗ DEPLOYMENT BLOCKED', 'color: red; font-weight: bold; font-size: 16px;');
      console.log('%cDo NOT deploy until these issues are resolved.', 'color: red;');

      if (results.blockers.length > 0) {
        console.log('\n🚫 BLOCKERS (must fix):');
        for (var j = 0; j < results.blockers.length; j++) {
          console.log('  ' + (j + 1) + '. ' + results.blockers[j]);
        }
      }

      if (results.failed.length > 0) {
        console.log('\n✗ FAILURES (must fix):');
        for (var k = 0; k < results.failed.length; k++) {
          console.log('  ' + (k + 1) + '. ' + results.failed[k]);
        }
      }

      if (results.warnings.length > MAX_ACCEPTABLE_WARNINGS) {
        console.log('\n⚠️  TOO MANY WARNINGS (' + results.warnings.length + ' > ' + MAX_ACCEPTABLE_WARNINGS + ' max):');
        for (var m = 0; m < results.warnings.length; m++) {
          console.log('  ' + (m + 1) + '. ' + results.warnings[m]);
        }
      }
    }

    console.log('\n' + '='.repeat(60));

    return canDeploy;
  }

  /**
   * Export validation report
   */
  function exportReport(results) {
    if (!results) {
      console.error('No results available. Run PreDeploymentValidation.runAll() first.');
      return;
    }

    var report = '';

    report += '========================================\n';
    report += 'PRE-DEPLOYMENT VALIDATION REPORT\n';
    report += '========================================\n';
    report += 'Date: ' + results.timestamp + '\n';
    report += 'Version: ' + results.version + '\n';
    report += '========================================\n\n';

    report += 'SUMMARY:\n';
    report += 'Passed: ' + results.passed.length + '\n';
    report += 'Warnings: ' + results.warnings.length + '\n';
    report += 'Failed: ' + results.failed.length + '\n';
    report += 'Blockers: ' + results.blockers.length + '\n\n';

    report += 'PASSED (' + results.passed.length + '):\n';
    for (var i = 0; i < results.passed.length; i++) {
      report += '  ✓ ' + results.passed[i] + '\n';
    }

    report += '\nWARNINGS (' + results.warnings.length + '):\n';
    for (var j = 0; j < results.warnings.length; j++) {
      report += '  ⚠️  ' + results.warnings[j] + '\n';
    }

    report += '\nFAILED (' + results.failed.length + '):\n';
    for (var k = 0; k < results.failed.length; k++) {
      report += '  ✗ ' + results.failed[k] + '\n';
    }

    report += '\nBLOCKERS (' + results.blockers.length + '):\n';
    for (var m = 0; m < results.blockers.length; m++) {
      report += '  🚫 ' + results.blockers[m] + '\n';
    }

    report += '\n========================================\n';

    // Download report
    var blob = new Blob([report], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pre-deployment-validation-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Validation report exported');
  }

  // Global API
  window.PreDeploymentValidation = {
    runAll: runAll,
    exportReport: exportReport,
    config: {
      expectedVersion: EXPECTED_VERSION,
      minReadinessScore: MIN_READINESS_SCORE,
      maxAcceptableWarnings: MAX_ACCEPTABLE_WARNINGS
    }
  };

  console.log('[PRE-DEPLOYMENT-VALIDATION] Ready');
  console.log('Run validation: PreDeploymentValidation.runAll()');
  console.log('Expected version: ' + EXPECTED_VERSION);

})();
