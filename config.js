// config.js - Application and Company Configuration
// iOS Safari 12+ compatible (ES5 only)
// Load this before bootstrap.js to ensure globals are available

(function() {
  'use strict';

  /**
   * Application Configuration
   * Used by deployment-helper.js and other system modules
   */
  window.APP_CONFIG = {
    version: '1.13.0',
    environment: 'production',  // 'development' or 'production'
    appName: 'TicTacStick Quote Engine',
    buildDate: '2025-11-19',

    // Feature flags
    features: {
      contracts: true,
      analytics: true,
      ghlIntegration: true,
      pdfGeneration: true,
      offlineMode: true,
      healthMonitoring: true,
      bugTracking: true
    },

    // Performance settings
    performance: {
      autosaveInterval: 30000,  // 30 seconds
      healthCheckInterval: 3600000,  // 60 minutes
      maxPhotos: 50,
      maxHistoryItems: 100
    },

    // Debug settings
    debug: {
      enabled: false,  // Set to true for verbose logging
      logLevel: 'error'  // 'error', 'warn', 'info', 'debug'
    }
  };

  /**
   * Company Configuration
   * Business information for quotes, invoices, and branding
   */
  window.COMPANY_CONFIG = {
    // Business details
    name: '925 Pressure Glass',
    businessName: '925 Pressure Glass',
    tagline: 'Window & Pressure Cleaning Specialists',

    // Contact information (user should update these)
    abn: 'TBD',  // TODO: Update with real ABN
    email: 'info@925pressureglass.com.au',
    phone: '0400 000 000',  // TODO: Update with real phone
    website: 'www.925pressureglass.com.au',

    // Address
    address: {
      street: '',  // TODO: Add street address
      city: 'Perth',
      state: 'WA',
      postcode: '',  // TODO: Add postcode
      country: 'Australia'
    },

    // Branding
    logo: {
      base64: null,  // Logo will be loaded from theme customizer
      width: 200,
      height: 60
    },

    // Default values for quotes
    defaults: {
      baseFee: 120,
      hourlyRate: 95,
      minimumJob: 180,
      highReachModifier: 60,
      gstRate: 0.10  // 10% GST
    },

    // Invoice settings
    invoice: {
      prefix: 'INV-',
      startNumber: 1000,
      paymentTerms: 'Payment due within 7 days',
      bankDetails: {
        accountName: '925 Pressure Glass',  // TODO: Update with real account name
        bsb: '',  // TODO: Update with real BSB
        accountNumber: ''  // TODO: Update with real account number
      }
    }
  };

  console.log('[CONFIG] Application config loaded - v' + window.APP_CONFIG.version);
  console.log('[CONFIG] Company: ' + window.COMPANY_CONFIG.name);

})();
