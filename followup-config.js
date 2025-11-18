// followup-config.js - Follow-up Configuration and Sequences
// Dependencies: None (pure configuration)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Follow-up Configuration
   * Defines when and how to follow up on quotes
   */
  var FOLLOWUP_CONFIG = {
    // Follow-up sequences by quote status
    sequences: {
      // Quote sent but not responded to
      sent: [
        {
          delay: 24, // hours after sending
          type: 'sms',
          priority: 'normal',
          message: 'Hi {clientName}, just checking if you received our quote for {serviceType}. Any questions?'
        },
        {
          delay: 72, // 3 days
          type: 'phone-call',
          priority: 'normal',
          message: 'Call to discuss quote and answer questions'
        },
        {
          delay: 168, // 1 week
          type: 'email',
          priority: 'normal',
          message: 'Follow up on quote - last chance before it expires'
        }
      ],

      // Quote opened but no response
      viewed: [
        {
          delay: 12, // hours
          type: 'sms',
          priority: 'high',
          message: 'Thanks for viewing our quote! Questions? Call/text anytime.'
        },
        {
          delay: 48, // 2 days
          type: 'phone-call',
          priority: 'high',
          message: 'Call to discuss - they showed interest by opening'
        }
      ],

      // Quote verbally accepted
      'verbal-yes': [
        {
          delay: 2, // hours
          type: 'email',
          priority: 'urgent',
          message: 'Send contract and booking link immediately'
        },
        {
          delay: 24,
          type: 'sms',
          priority: 'urgent',
          message: 'Following up on booking - secure the date'
        }
      ],

      // Quote declined
      declined: [
        {
          delay: 168, // 1 week
          type: 'email',
          priority: 'low',
          message: 'Thanks for considering us. Here\'s a discount for future'
        },
        {
          delay: 2160, // 90 days
          type: 'sms',
          priority: 'low',
          message: 'Seasonal reminder - special offer available'
        }
      ]
    },

    // High-value quote rules
    highValue: {
      threshold: 2000, // $2000+
      sequence: [
        {
          delay: 6, // 6 hours
          type: 'phone-call',
          priority: 'urgent',
          message: 'Personal call for high-value quote'
        },
        {
          delay: 24,
          type: 'email',
          priority: 'urgent',
          message: 'Detailed follow-up with additional information'
        },
        {
          delay: 48,
          type: 'phone-call',
          priority: 'urgent',
          message: 'Second attempt call'
        }
      ]
    },

    // Repeat client rules
    repeatClient: {
      sequence: [
        {
          delay: 12,
          type: 'sms',
          priority: 'high',
          message: 'Personal message thanking for repeat business'
        },
        {
          delay: 36,
          type: 'phone-call',
          priority: 'high',
          message: 'Priority call for loyal customer'
        }
      ]
    },

    // Referral source rules
    referral: {
      sequence: [
        {
          delay: 6,
          type: 'phone-call',
          priority: 'urgent',
          message: 'Thank referral source and follow up quickly'
        },
        {
          delay: 24,
          type: 'sms',
          priority: 'high',
          message: 'Keep referral source updated'
        }
      ]
    },

    // Task escalation
    escalation: {
      enabled: true,
      rules: [
        {
          condition: 'overdue-by-24h',
          action: 'increase-priority',
          notify: true
        },
        {
          condition: 'overdue-by-48h',
          action: 'escalate-to-manager',
          notify: true
        },
        {
          condition: 'high-value-overdue',
          action: 'urgent-notification',
          notify: true
        }
      ]
    },

    // Best times to contact
    contactTimes: {
      weekday: {
        morning: { start: 9, end: 12 }, // 9am-12pm
        afternoon: { start: 14, end: 17 }, // 2pm-5pm
        evening: { start: 18, end: 19 } // 6pm-7pm
      },
      weekend: {
        morning: { start: 10, end: 12 },
        afternoon: { start: 14, end: 16 }
      }
    },

    // Do not disturb times
    dndTimes: {
      daily: { start: 20, end: 8 }, // 8pm-8am
      sunday: true // No contact on Sundays
    }
  };

  /**
   * Save follow-up config to LocalStorage
   */
  function saveFollowupConfig() {
    try {
      localStorage.setItem('tts_followup_config', JSON.stringify(FOLLOWUP_CONFIG));
      console.log('[FOLLOWUP-CONFIG] Configuration saved');
      return true;
    } catch (e) {
      console.error('[FOLLOWUP-CONFIG] Failed to save config:', e);
      return false;
    }
  }

  /**
   * Load follow-up config from LocalStorage
   */
  function loadFollowupConfig() {
    try {
      var saved = localStorage.getItem('tts_followup_config');
      if (saved) {
        var config = JSON.parse(saved);
        // Merge saved config with defaults
        Object.keys(config).forEach(function(key) {
          FOLLOWUP_CONFIG[key] = config[key];
        });
        console.log('[FOLLOWUP-CONFIG] Configuration loaded');
      }
    } catch (e) {
      console.error('[FOLLOWUP-CONFIG] Failed to load config:', e);
    }
  }

  /**
   * Get follow-up config
   */
  function getConfig() {
    return FOLLOWUP_CONFIG;
  }

  /**
   * Update follow-up config
   */
  function updateConfig(updates) {
    Object.keys(updates).forEach(function(key) {
      FOLLOWUP_CONFIG[key] = updates[key];
    });
    return saveFollowupConfig();
  }

  /**
   * Reset to default config
   */
  function resetConfig() {
    localStorage.removeItem('tts_followup_config');
    console.log('[FOLLOWUP-CONFIG] Configuration reset to defaults');
    return true;
  }

  // Load config on startup
  loadFollowupConfig();

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('followupConfig', {
      getConfig: getConfig,
      updateConfig: updateConfig,
      saveConfig: saveFollowupConfig,
      resetConfig: resetConfig
    });
  }

  // Global API
  window.FollowupConfig = {
    get: getConfig,
    update: updateConfig,
    save: saveFollowupConfig,
    reset: resetConfig
  };

  console.log('[FOLLOWUP-CONFIG] Initialized');
})();
