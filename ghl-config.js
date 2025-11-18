// ghl-config.js - GoHighLevel API Configuration
// Dependencies: None (must load early)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * GoHighLevel API Configuration
   * Central configuration for GHL integration
   */
  var GHL_CONFIG = {
    // API Configuration
    apiBaseUrl: 'https://rest.gohighlevel.com/v1',
    apiVersion: '2021-07-28',

    // OAuth 2.0 Credentials (from GHL app settings)
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/ghl-oauth-callback.html',

    // Location/Agency
    locationId: '',
    agencyId: '',
    userId: '',

    // Access Token (stored after OAuth)
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,

    // API Rate Limiting
    rateLimit: {
      maxRequests: 120,
      perMinutes: 1,
      currentCount: 0,
      resetTime: null
    },

    // Feature Flags
    features: {
      contactSync: true,
      opportunitySync: true,
      taskSync: true,
      noteSync: true,
      smsSync: false, // Premium feature
      emailSync: false, // Premium feature
      calendarSync: false, // Premium feature
      paymentSync: false // Premium feature
    },

    // Sync Settings
    syncSettings: {
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      offlineQueue: true,
      conflictResolution: 'ghl-wins', // 'ghl-wins', 'local-wins', 'manual'
      syncOnQuoteCreate: true,
      syncOnQuoteUpdate: true,
      syncOnClientUpdate: true
    },

    // Field Mappings (TicTacStick → GHL)
    fieldMappings: {
      contact: {
        name: 'name',
        email: 'email',
        phone: 'phone',
        address: 'address1',
        city: 'city',
        state: 'state',
        postalCode: 'postalCode',
        country: 'country'
      },
      opportunity: {
        name: 'name',
        value: 'monetaryValue',
        status: 'status',
        pipeline: 'pipelineId',
        stage: 'pipelineStageId'
      }
    },

    // Pipeline Configuration
    pipeline: {
      id: '',
      name: 'TicTacStick Sales',
      stages: {
        quote: '',
        followUp: '',
        won: '',
        lost: ''
      }
    },

    // Custom Fields
    customFields: {
      quoteNumber: 'quote_number',
      serviceTypes: 'service_types',
      primaryService: 'primary_service',
      quoteDate: 'quote_date',
      quoteTotal: 'quote_total',
      clientType: 'client_type',
      clientSource: 'client_source',
      lastJobDate: 'last_job_date',
      totalRevenue: 'total_revenue'
    },

    // Tags
    tags: {
      quoteGenerated: 'tictacstick-quote',
      quoteAccepted: 'quote-accepted',
      quoteDeclined: 'quote-declined',
      windowCleaning: 'window-cleaning',
      pressureWashing: 'pressure-washing',
      residential: 'residential',
      commercial: 'commercial'
    },

    // Webhook Configuration
    webhooks: {
      enabled: false,
      url: window.location.origin + '/ghl-webhook',
      secret: '',
      events: [
        'contact.create',
        'contact.update',
        'contact.delete',
        'opportunity.create',
        'opportunity.update',
        'opportunity.delete',
        'opportunity.status.update'
      ]
    },

    // Last Sync Timestamps
    lastSync: {
      contacts: null,
      opportunities: null,
      tasks: null
    }
  };

  /**
   * Save GHL config to localStorage
   */
  function saveGHLConfig() {
    try {
      var configToSave = {
        clientId: GHL_CONFIG.clientId,
        clientSecret: GHL_CONFIG.clientSecret,
        locationId: GHL_CONFIG.locationId,
        agencyId: GHL_CONFIG.agencyId,
        userId: GHL_CONFIG.userId,
        accessToken: GHL_CONFIG.accessToken,
        refreshToken: GHL_CONFIG.refreshToken,
        tokenExpiry: GHL_CONFIG.tokenExpiry,
        features: GHL_CONFIG.features,
        syncSettings: GHL_CONFIG.syncSettings,
        pipeline: GHL_CONFIG.pipeline,
        customFields: GHL_CONFIG.customFields,
        webhooks: GHL_CONFIG.webhooks,
        lastSync: GHL_CONFIG.lastSync
      };

      localStorage.setItem('tts_ghl_config', JSON.stringify(configToSave));
      console.log('[GHL-CONFIG] Configuration saved');
      return true;
    } catch (e) {
      console.error('[GHL-CONFIG] Failed to save config:', e);
      return false;
    }
  }

  /**
   * Load GHL config from localStorage
   */
  function loadGHLConfig() {
    try {
      var saved = localStorage.getItem('tts_ghl_config');
      if (saved) {
        var config = JSON.parse(saved);

        // Merge saved config with defaults
        if (config.clientId) GHL_CONFIG.clientId = config.clientId;
        if (config.clientSecret) GHL_CONFIG.clientSecret = config.clientSecret;
        if (config.locationId) GHL_CONFIG.locationId = config.locationId;
        if (config.agencyId) GHL_CONFIG.agencyId = config.agencyId;
        if (config.userId) GHL_CONFIG.userId = config.userId;
        if (config.accessToken) GHL_CONFIG.accessToken = config.accessToken;
        if (config.refreshToken) GHL_CONFIG.refreshToken = config.refreshToken;
        if (config.tokenExpiry) GHL_CONFIG.tokenExpiry = config.tokenExpiry;

        // Merge objects
        if (config.features) {
          Object.keys(config.features).forEach(function(key) {
            GHL_CONFIG.features[key] = config.features[key];
          });
        }

        if (config.syncSettings) {
          Object.keys(config.syncSettings).forEach(function(key) {
            GHL_CONFIG.syncSettings[key] = config.syncSettings[key];
          });
        }

        if (config.pipeline) {
          Object.keys(config.pipeline).forEach(function(key) {
            GHL_CONFIG.pipeline[key] = config.pipeline[key];
          });
        }

        if (config.customFields) {
          Object.keys(config.customFields).forEach(function(key) {
            GHL_CONFIG.customFields[key] = config.customFields[key];
          });
        }

        if (config.webhooks) {
          Object.keys(config.webhooks).forEach(function(key) {
            GHL_CONFIG.webhooks[key] = config.webhooks[key];
          });
        }

        if (config.lastSync) {
          GHL_CONFIG.lastSync = config.lastSync;
        }

        console.log('[GHL-CONFIG] Configuration loaded');
        return true;
      }
      return false;
    } catch (e) {
      console.error('[GHL-CONFIG] Failed to load config:', e);
      return false;
    }
  }

  /**
   * Clear GHL config
   */
  function clearGHLConfig() {
    try {
      localStorage.removeItem('tts_ghl_config');

      // Reset to defaults
      GHL_CONFIG.clientId = '';
      GHL_CONFIG.clientSecret = '';
      GHL_CONFIG.locationId = '';
      GHL_CONFIG.agencyId = '';
      GHL_CONFIG.userId = '';
      GHL_CONFIG.accessToken = null;
      GHL_CONFIG.refreshToken = null;
      GHL_CONFIG.tokenExpiry = null;

      console.log('[GHL-CONFIG] Configuration cleared');
      return true;
    } catch (e) {
      console.error('[GHL-CONFIG] Failed to clear config:', e);
      return false;
    }
  }

  /**
   * Check if GHL is configured
   */
  function isConfigured() {
    return !!(
      GHL_CONFIG.clientId &&
      GHL_CONFIG.clientSecret &&
      GHL_CONFIG.locationId
    );
  }

  /**
   * Check if GHL is authenticated
   */
  function isAuthenticated() {
    return !!(GHL_CONFIG.accessToken);
  }

  /**
   * Get config value
   */
  function getConfig(key) {
    if (!key) return GHL_CONFIG;

    var keys = key.split('.');
    var value = GHL_CONFIG;

    for (var i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set config value
   */
  function setConfig(key, value) {
    if (!key) return false;

    var keys = key.split('.');
    var obj = GHL_CONFIG;

    for (var i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    return saveGHLConfig();
  }

  /**
   * Update last sync timestamp
   */
  function updateLastSync(type) {
    if (!type) return false;

    GHL_CONFIG.lastSync[type] = new Date().toISOString();
    return saveGHLConfig();
  }

  // Load config on startup
  loadGHLConfig();

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlConfig', {
      save: saveGHLConfig,
      load: loadGHLConfig,
      clear: clearGHLConfig,
      isConfigured: isConfigured,
      isAuthenticated: isAuthenticated,
      getConfig: getConfig,
      setConfig: setConfig,
      updateLastSync: updateLastSync
    });
  }

  // Make globally available
  window.GHL_CONFIG = GHL_CONFIG;
  window.GHLConfig = {
    save: saveGHLConfig,
    load: loadGHLConfig,
    clear: clearGHLConfig,
    isConfigured: isConfigured,
    isAuthenticated: isAuthenticated,
    getConfig: getConfig,
    setConfig: setConfig,
    updateLastSync: updateLastSync
  };

  console.log('[GHL-CONFIG] Initialized');
})();
