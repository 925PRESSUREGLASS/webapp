// config-production.js - Production environment configuration
// This file contains production-specific settings
// Load this AFTER main config files to override development settings
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // ============================================
  // ENVIRONMENT DETECTION
  // ============================================

  var ENVIRONMENT = {
    isDevelopment: window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname.includes('pages.dev') ||
                  window.location.hostname.includes('tictacstick.com') ||
                  window.location.hostname.includes('.au'),
    hostname: window.location.hostname,
    protocol: window.location.protocol
  };

  // ============================================
  // PRODUCTION CONFIGURATION
  // ============================================

  if (ENVIRONMENT.isProduction) {
    console.log('[CONFIG] Loading production configuration...');

    // ========================================
    // API Endpoints
    // ========================================

    // Webhook endpoint (Cloudflare Worker)
    if (typeof WEBHOOK_CONFIG !== 'undefined') {
      WEBHOOK_CONFIG.webhookUrl = 'https://webhooks.tictacstick.com.au/webhook';
      WEBHOOK_CONFIG.eventsUrl = 'https://webhooks.tictacstick.com.au/events';
      WEBHOOK_CONFIG.healthUrl = 'https://webhooks.tictacstick.com.au/health';

      // Production polling interval (less frequent)
      WEBHOOK_CONFIG.pollInterval = 60000; // 60 seconds

      console.log('[CONFIG] Webhook endpoints configured for production');
    }

    // ========================================
    // GoHighLevel Configuration
    // ========================================

    // NOTE: These values should be set by user via Settings UI
    // DO NOT hardcode production API keys in this file
    // They will be stored in LocalStorage after user enters them

    if (typeof GHL_CONFIG !== 'undefined') {
      // Production GHL endpoints
      GHL_CONFIG.apiBaseUrl = 'https://rest.gohighlevel.com/v1';
      GHL_CONFIG.oauthUrl = 'https://marketplace.gohighlevel.com/oauth/chooselocation';

      // Enable production features
      GHL_CONFIG.enableSync = true;
      GHL_CONFIG.enableWebhooks = true;

      console.log('[CONFIG] GoHighLevel configured for production');
    }

    // ========================================
    // Analytics Configuration
    // ========================================

    if (typeof ANALYTICS_CONFIG !== 'undefined') {
      // Enable analytics in production
      ANALYTICS_CONFIG.trackingEnabled = true;
      ANALYTICS_CONFIG.reportingEnabled = true;

      // Production retention
      ANALYTICS_CONFIG.dataRetentionDays = 365; // 1 year
      ANALYTICS_CONFIG.maxHistoryRecords = 1000;

      console.log('[CONFIG] Analytics enabled for production');
    }

    // ========================================
    // Performance Configuration
    // ========================================

    if (typeof PERFORMANCE_CONFIG !== 'undefined') {
      // Production performance settings
      PERFORMANCE_CONFIG.enableMonitoring = true;
      PERFORMANCE_CONFIG.sampleRate = 0.1; // 10% of requests

      // Thresholds
      PERFORMANCE_CONFIG.slowThreshold = 1000; // 1 second
      PERFORMANCE_CONFIG.errorThreshold = 5; // 5 errors before alert

      console.log('[CONFIG] Performance monitoring enabled');
    }

    // ========================================
    // Debug Configuration
    // ========================================

    if (typeof DEBUG_CONFIG !== 'undefined') {
      // Disable verbose logging in production
      DEBUG_CONFIG.enabled = false;
      DEBUG_CONFIG.verboseLogging = false;

      // Keep error logging enabled
      DEBUG_CONFIG.logErrors = true;

      console.log('[CONFIG] Debug mode disabled for production');
    }

    // ========================================
    // Security Configuration
    // ========================================

    if (typeof SECURITY_CONFIG !== 'undefined') {
      // Strict security in production
      SECURITY_CONFIG.strictMode = true;
      SECURITY_CONFIG.validateAllInputs = true;
      SECURITY_CONFIG.sanitizeAll = true;

      console.log('[CONFIG] Security hardening enabled');
    }

    // ========================================
    // Backup Configuration
    // ========================================

    if (typeof BACKUP_CONFIG !== 'undefined') {
      // Enable auto-backup in production
      BACKUP_CONFIG.autoBackupEnabled = true;
      BACKUP_CONFIG.backupInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
      BACKUP_CONFIG.reminderEnabled = true;

      console.log('[CONFIG] Auto-backup enabled');
    }

    // ========================================
    // Feature Flags
    // ========================================

    if (typeof FEATURE_FLAGS !== 'undefined') {
      // Enable all production features
      FEATURE_FLAGS.pdfGeneration = true;
      FEATURE_FLAGS.photoUpload = true;
      FEATURE_FLAGS.analytics = true;
      FEATURE_FLAGS.ghlIntegration = true;
      FEATURE_FLAGS.taskManagement = true;
      FEATURE_FLAGS.emailSending = true;
      FEATURE_FLAGS.smsSending = true;

      console.log('[CONFIG] Production features enabled');
    }

    // ========================================
    // Cache Configuration
    // ========================================

    if (typeof CACHE_CONFIG !== 'undefined') {
      // Aggressive caching in production
      CACHE_CONFIG.enabled = true;
      CACHE_CONFIG.ttl = 3600000; // 1 hour
      CACHE_CONFIG.maxSize = 50; // 50 items

      console.log('[CONFIG] Caching enabled');
    }

    // ========================================
    // Rate Limiting
    // ========================================

    if (typeof RATE_LIMIT_CONFIG !== 'undefined') {
      // Protect production API endpoints
      RATE_LIMIT_CONFIG.enabled = true;
      RATE_LIMIT_CONFIG.requestsPerMinute = 60;
      RATE_LIMIT_CONFIG.burstSize = 10;

      console.log('[CONFIG] Rate limiting enabled');
    }

    console.log('[CONFIG] ✓ Production configuration loaded successfully');
  }

  // ============================================
  // DEVELOPMENT CONFIGURATION
  // ============================================

  else if (ENVIRONMENT.isDevelopment) {
    console.log('[CONFIG] Loading development configuration...');

    // Development endpoints (localhost)
    if (typeof WEBHOOK_CONFIG !== 'undefined') {
      WEBHOOK_CONFIG.webhookUrl = 'http://localhost:8787/webhook';
      WEBHOOK_CONFIG.eventsUrl = 'http://localhost:8787/events';
      WEBHOOK_CONFIG.healthUrl = 'http://localhost:8787/health';

      // More frequent polling in dev
      WEBHOOK_CONFIG.pollInterval = 10000; // 10 seconds

      console.log('[CONFIG] Webhook endpoints configured for development');
    }

    // Enable debug mode
    if (typeof DEBUG_CONFIG !== 'undefined') {
      DEBUG_CONFIG.enabled = true;
      DEBUG_CONFIG.verboseLogging = true;

      console.log('[CONFIG] Debug mode enabled for development');
    }

    // Relaxed rate limits
    if (typeof RATE_LIMIT_CONFIG !== 'undefined') {
      RATE_LIMIT_CONFIG.enabled = false;

      console.log('[CONFIG] Rate limiting disabled for development');
    }

    console.log('[CONFIG] ✓ Development configuration loaded successfully');
  }

  // ============================================
  // GLOBAL ENVIRONMENT ACCESS
  // ============================================

  window.ENVIRONMENT = ENVIRONMENT;

  // Log environment info
  console.log('[ENVIRONMENT]', ENVIRONMENT.isDevelopment ? 'Development' : 'Production');
  console.log('[HOSTNAME]', ENVIRONMENT.hostname);
  console.log('[PROTOCOL]', ENVIRONMENT.protocol);

  // ============================================
  // PRODUCTION SECURITY WARNINGS
  // ============================================

  if (ENVIRONMENT.isProduction && ENVIRONMENT.protocol !== 'https:') {
    console.warn('[SECURITY WARNING] Production site not using HTTPS!');
    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast(
        'Security Warning: Site not using HTTPS',
        'warning'
      );
    }
  }

  // Warn if API keys not configured
  if (ENVIRONMENT.isProduction) {
    setTimeout(function() {
      var ghlConfigured = localStorage.getItem('ghl-config');
      var webhookConfigured = localStorage.getItem('webhook-config');

      if (!ghlConfigured && typeof GHL_CONFIG !== 'undefined') {
        console.warn('[CONFIG] GoHighLevel API keys not configured');
        console.log('[CONFIG] Go to Settings to configure GoHighLevel integration');
      }

      if (!webhookConfigured && typeof WEBHOOK_CONFIG !== 'undefined') {
        console.warn('[CONFIG] Webhook settings not configured');
      }
    }, 2000);
  }

  // ============================================
  // CONFIGURATION HELPER FUNCTIONS
  // ============================================

  /**
   * Get current environment
   * @returns {string} 'development' or 'production'
   */
  function getCurrentEnvironment() {
    return ENVIRONMENT.isDevelopment ? 'development' : 'production';
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  function isFeatureEnabled(feature) {
    if (typeof FEATURE_FLAGS === 'undefined') {
      return true; // Default to enabled if not configured
    }
    return FEATURE_FLAGS[feature] !== false;
  }

  /**
   * Get configuration value with fallback
   * @param {Object} config - Configuration object
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if not set
   * @returns {*}
   */
  function getConfig(config, key, defaultValue) {
    if (typeof config === 'undefined') {
      return defaultValue;
    }
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  // Export helper functions
  window.ConfigHelpers = {
    getCurrentEnvironment: getCurrentEnvironment,
    isFeatureEnabled: isFeatureEnabled,
    getConfig: getConfig,
    isProduction: function() { return ENVIRONMENT.isProduction; },
    isDevelopment: function() { return ENVIRONMENT.isDevelopment; }
  };

  console.log('[CONFIG-PRODUCTION] Module loaded');
})();
