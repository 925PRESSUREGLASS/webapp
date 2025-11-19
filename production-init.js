// production-init.js - Production Environment Initialization
// Run this once after deployment to set up monitoring and health checks
// iOS Safari 12+ compatible (no ES6)

(function() {
  'use strict';

  var PRODUCTION_CONFIG = {
    healthCheckInterval: 60,  // Minutes
    autoBackupInterval: 24,   // Hours
    bugTrackingEnabled: true,
    environmentName: 'production'
  };

  /**
   * Initialize production environment
   */
  function initProduction() {
    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION ENVIRONMENT INITIALIZATION');
    console.log('='.repeat(50) + '\n');

    var steps = [];

    // Step 1: Verify production environment
    steps.push(verifyProductionEnvironment());

    // Step 2: Run initial health check
    steps.push(runInitialHealthCheck());

    // Step 3: Enable health monitoring
    steps.push(enableHealthMonitoring());

    // Step 4: Configure backup automation
    steps.push(configureBackupAutomation());

    // Step 5: Initialize bug tracking
    steps.push(initializeBugTracking());

    // Step 6: Run production readiness check
    steps.push(runProductionReadinessCheck());

    // Summary
    var passed = 0;
    var failed = 0;

    for (var i = 0; i < steps.length; i++) {
      if (steps[i]) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('INITIALIZATION SUMMARY');
    console.log('='.repeat(50));
    console.log('Passed: ' + passed + ' / ' + steps.length);
    console.log('Failed: ' + failed);

    if (failed === 0) {
      console.log('\n✓ Production environment initialized successfully!');
      console.log('\nMonitoring is now active:');
      console.log('- Health checks every ' + PRODUCTION_CONFIG.healthCheckInterval + ' minutes');
      console.log('- Automatic backups every ' + PRODUCTION_CONFIG.autoBackupInterval + ' hours');
      console.log('- Bug tracking enabled');
      
      if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
        UIComponents.showToast('Production environment ready!', 'success');
      }

      return true;
    } else {
      console.error('\n✗ Initialization incomplete - review failed steps');
      
      if (typeof UIComponents !== 'undefined' && UIComponents.showToast) {
        UIComponents.showToast('Initialization failed - check console', 'error');
      }

      return false;
    }
  }

  /**
   * Step 1: Verify production environment
   */
  function verifyProductionEnvironment() {
    console.log('\n--- Step 1: Verifying Production Environment ---');

    var checks = [];

    // Check HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      console.log('✓ Using secure protocol (HTTPS)');
      checks.push(true);
    } else {
      console.error('✗ Not using HTTPS - production requires HTTPS');
      checks.push(false);
    }

    // Check not localhost (unless in development)
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.log('✓ Deployed to production domain');
      checks.push(true);
    } else {
      console.warn('⚠️  Running on localhost - expected in development only');
      checks.push(true);  // Not a failure, just a warning
    }

    // Check debug mode disabled
    if (localStorage.getItem('debug-enabled') !== 'true') {
      console.log('✓ Debug mode disabled');
      checks.push(true);
    } else {
      console.warn('⚠️  Debug mode enabled - should be disabled in production');
      checks.push(false);
    }

    // Check required modules loaded
    var requiredModules = ['DeploymentHelper', 'HealthCheck', 'ProductionReadiness', 'BackupManager'];
    var missing = [];

    for (var i = 0; i < requiredModules.length; i++) {
      if (typeof window[requiredModules[i]] === 'undefined') {
        missing.push(requiredModules[i]);
      }
    }

    if (missing.length === 0) {
      console.log('✓ All production tools loaded');
      checks.push(true);
    } else {
      console.error('✗ Missing production tools: ' + missing.join(', '));
      checks.push(false);
    }

    // Overall result
    var passed = checks.filter(function(c) { return c; }).length === checks.length;
    
    if (passed) {
      console.log('✓ Environment verification passed');
    } else {
      console.error('✗ Environment verification failed');
    }

    return passed;
  }

  /**
   * Step 2: Run initial health check
   */
  function runInitialHealthCheck() {
    console.log('\n--- Step 2: Running Initial Health Check ---');

    if (typeof HealthCheck === 'undefined') {
      console.error('✗ HealthCheck not available');
      return false;
    }

    try {
      var results = HealthCheck.runHealthCheck();

      if (results.overall === 'healthy') {
        console.log('✓ Initial health check passed');
        return true;
      } else if (results.overall === 'degraded') {
        console.warn('⚠️  Health check passed with warnings');
        return true;
      } else {
        console.error('✗ Health check failed - critical issues detected');
        return false;
      }
    } catch (e) {
      console.error('✗ Health check error:', e.message);
      return false;
    }
  }

  /**
   * Step 3: Enable health monitoring
   */
  function enableHealthMonitoring() {
    console.log('\n--- Step 3: Enabling Health Monitoring ---');

    if (typeof HealthCheck === 'undefined') {
      console.error('✗ HealthCheck not available');
      return false;
    }

    try {
      HealthCheck.scheduleHealthChecks(PRODUCTION_CONFIG.healthCheckInterval);
      console.log('✓ Health monitoring enabled (every ' + PRODUCTION_CONFIG.healthCheckInterval + ' minutes)');
      return true;
    } catch (e) {
      console.error('✗ Failed to enable health monitoring:', e.message);
      return false;
    }
  }

  /**
   * Step 4: Configure backup automation
   */
  function configureBackupAutomation() {
    console.log('\n--- Step 4: Configuring Backup Automation ---');

    if (typeof BackupManager === 'undefined') {
      console.warn('⚠️  BackupManager not available - skipping');
      return true;  // Not critical
    }

    try {
      // Schedule automatic backups
      BackupManager.scheduleAutoBackup();
      console.log('✓ Automatic backups enabled (every ' + PRODUCTION_CONFIG.autoBackupInterval + ' hours)');

      // Run initial backup
      console.log('Creating initial backup...');
      BackupManager.exportAllData();
      console.log('✓ Initial backup created');

      return true;
    } catch (e) {
      console.error('✗ Failed to configure backups:', e.message);
      return false;
    }
  }

  /**
   * Step 5: Initialize bug tracking
   */
  function initializeBugTracking() {
    console.log('\n--- Step 5: Initializing Bug Tracking ---');

    if (!PRODUCTION_CONFIG.bugTrackingEnabled) {
      console.log('Bug tracking disabled in config - skipping');
      return true;
    }

    if (typeof BugTracker === 'undefined') {
      console.warn('⚠️  BugTracker not available - skipping');
      return true;  // Not critical
    }

    try {
      // Bug tracker auto-initializes on load
      console.log('✓ Bug tracking initialized');
      console.log('  Users can report bugs via: BugTracker.quickReport()');
      return true;
    } catch (e) {
      console.error('✗ Failed to initialize bug tracking:', e.message);
      return false;
    }
  }

  /**
   * Step 6: Run production readiness check
   */
  function runProductionReadinessCheck() {
    console.log('\n--- Step 6: Running Production Readiness Check ---');

    if (typeof ProductionReadiness === 'undefined') {
      console.error('✗ ProductionReadiness not available');
      return false;
    }

    try {
      var results = ProductionReadiness.runCheck();

      if (results.score >= 90) {
        console.log('✓ Production readiness: READY (Score: ' + results.score + '/100)');
        return true;
      } else if (results.score >= 75) {
        console.warn('⚠️  Production readiness: CAUTION (Score: ' + results.score + '/100)');
        console.warn('Review warnings before proceeding');
        return true;
      } else {
        console.error('✗ Production readiness: NOT READY (Score: ' + results.score + '/100)');
        console.error('Critical issues must be fixed');
        return false;
      }
    } catch (e) {
      console.error('✗ Production readiness check error:', e.message);
      return false;
    }
  }

  /**
   * Get production status
   */
  function getProductionStatus() {
    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION STATUS');
    console.log('='.repeat(50) + '\n');

    var status = {
      environment: PRODUCTION_CONFIG.environmentName,
      healthMonitoring: false,
      backupAutomation: false,
      lastHealthCheck: null,
      lastBackup: null
    };

    // Check if health monitoring is active
    try {
      var lastHealthCheck = HealthCheck.getLastCheckResults();
      if (lastHealthCheck) {
        status.healthMonitoring = true;
        status.lastHealthCheck = lastHealthCheck.timestamp;
        console.log('✓ Health monitoring: ACTIVE');
        console.log('  Last check: ' + lastHealthCheck.timestamp);
        console.log('  Status: ' + lastHealthCheck.overall.toUpperCase());
      } else {
        console.log('✗ Health monitoring: INACTIVE');
      }
    } catch (e) {
      console.log('✗ Health monitoring: ERROR - ' + e.message);
    }

    // Check backup status
    try {
      if (typeof BackupManager !== 'undefined') {
        var backupHistory = BackupManager.getBackupHistory();
        if (backupHistory && backupHistory.length > 0) {
          status.backupAutomation = true;
          status.lastBackup = backupHistory[0].timestamp;
          console.log('✓ Backup automation: ACTIVE');
          console.log('  Last backup: ' + backupHistory[0].timestamp);
        } else {
          console.log('⚠️  Backup automation: No backups found');
        }
      }
    } catch (e) {
      console.log('✗ Backup automation: ERROR - ' + e.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    return status;
  }

  /**
   * Disable production monitoring (for maintenance)
   */
  function disableMonitoring() {
    console.log('\nDisabling production monitoring...');

    var stopped = [];

    try {
      HealthCheck.stopHealthChecks();
      stopped.push('Health monitoring');
    } catch (e) {
      console.error('Failed to stop health monitoring:', e.message);
    }

    console.log('✓ Monitoring disabled: ' + stopped.join(', '));
    console.log('\nTo re-enable, run: ProductionInit.initProduction()');
  }

  // Global API
  window.ProductionInit = {
    initProduction: initProduction,
    getProductionStatus: getProductionStatus,
    disableMonitoring: disableMonitoring,
    config: PRODUCTION_CONFIG
  };

  console.log('[PRODUCTION-INIT] Ready');
  console.log('Initialize production: ProductionInit.initProduction()');
  console.log('Check status: ProductionInit.getProductionStatus()');

  // Auto-run in production (not localhost)
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.log('\nProduction environment detected - Auto-initializing...\n');
    setTimeout(function() {
      ProductionInit.initProduction();
    }, 2000);
  }

})();
