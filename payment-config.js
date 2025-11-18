// payment-config.js - Payment Configuration and Settings
// Dependencies: storage.js
// iOS Safari 12+ compatible (ES5 syntax only)

(function() {
  'use strict';

  // Default payment configuration
  var PAYMENT_CONFIG = {
    // Default gateway: 'stripe', 'square', 'ghl', 'manual'
    defaultGateway: 'manual',

    // Gateway credentials (sensitive data should not be stored in localStorage)
    gateways: {
      stripe: {
        enabled: false,
        publicKey: '',
        currency: 'AUD',
        country: 'AU',
        statementDescriptor: '925 Pressure Glass'
      },

      square: {
        enabled: false,
        applicationId: '',
        locationId: '',
        currency: 'AUD',
        country: 'AU'
      },

      ghl: {
        enabled: false,
        apiKey: '',
        locationId: '',
        currency: 'AUD'
      }
    },

    // Payment features
    features: {
      onlinePayments: false,
      deposits: true,
      paymentPlans: true,
      recurringPayments: false,
      refunds: true,
      partialPayments: true,
      tipSupport: false
    },

    // Payment options
    options: {
      // Accepted payment methods
      acceptedMethods: ['card', 'bank', 'cash', 'cheque'],

      // Deposit settings
      depositPercentage: 20, // 20% deposit
      depositMinimum: 50, // Minimum $50 deposit
      requireDepositOver: 500, // Require deposit for jobs over $500

      // Payment terms
      paymentTerms: 'Due upon completion',
      dueDays: 0, // Due immediately

      // Late fees
      lateFees: {
        enabled: false,
        percentage: 5, // 5% late fee
        gracePeriod: 7 // 7 days grace period
      },

      // Discounts
      earlyPaymentDiscount: {
        enabled: false,
        percentage: 2, // 2% discount
        days: 7 // If paid within 7 days
      }
    },

    // Invoice settings
    invoice: {
      prefix: 'INV-',
      numberFormat: 'sequential', // 'sequential', 'date-based', 'random'
      startNumber: 1000,
      nextNumber: null, // Auto-incremented

      // Invoice fields
      showABN: true,
      showGST: true,
      showPaymentTerms: true,
      showBankDetails: true,

      // Bank details for manual transfers
      bankDetails: {
        accountName: '925 Pressure Glass',
        bsb: '',
        accountNumber: '',
        reference: 'Invoice #{invoiceNumber}'
      }
    },

    // Receipt settings
    receipt: {
      prefix: 'RCT-',
      numberFormat: 'sequential',
      startNumber: 1000,
      nextNumber: null,
      emailReceipts: true,
      smsReceipts: false
    },

    // Payment reminders
    reminders: {
      enabled: true,
      schedule: [
        { days: 7, method: 'email', message: 'Payment reminder - 7 days overdue' },
        { days: 14, method: 'sms', message: 'Payment reminder - 14 days overdue' },
        { days: 30, method: 'email', message: 'Final payment notice - 30 days overdue' }
      ]
    }
  };

  /**
   * Get payment configuration
   */
  function getConfig() {
    return PAYMENT_CONFIG;
  }

  /**
   * Update payment configuration
   */
  function updateConfig(updates) {
    try {
      // Deep merge updates
      Object.keys(updates).forEach(function(key) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
          PAYMENT_CONFIG[key] = Object.assign({}, PAYMENT_CONFIG[key], updates[key]);
        } else {
          PAYMENT_CONFIG[key] = updates[key];
        }
      });

      saveConfig();
      return true;
    } catch (e) {
      console.error('[PAYMENT-CONFIG] Failed to update config:', e);
      return false;
    }
  }

  /**
   * Save payment config to localStorage
   */
  function saveConfig() {
    try {
      // Create a copy without sensitive data
      var configToSave = JSON.parse(JSON.stringify(PAYMENT_CONFIG));

      // Remove sensitive keys (these should be configured server-side)
      if (configToSave.gateways.stripe) {
        delete configToSave.gateways.stripe.secretKey;
        delete configToSave.gateways.stripe.webhookSecret;
      }

      localStorage.setItem('tts_payment_config', JSON.stringify(configToSave));
      console.log('[PAYMENT-CONFIG] Configuration saved');
      return true;
    } catch (e) {
      console.error('[PAYMENT-CONFIG] Failed to save config:', e);
      return false;
    }
  }

  /**
   * Load payment config from localStorage
   */
  function loadConfig() {
    try {
      var saved = localStorage.getItem('tts_payment_config');
      if (saved) {
        var config = JSON.parse(saved);

        // Merge with defaults (preserves any runtime settings)
        Object.keys(config).forEach(function(key) {
          if (typeof config[key] === 'object' && !Array.isArray(config[key]) && config[key] !== null) {
            PAYMENT_CONFIG[key] = Object.assign({}, PAYMENT_CONFIG[key], config[key]);
          } else {
            PAYMENT_CONFIG[key] = config[key];
          }
        });

        console.log('[PAYMENT-CONFIG] Configuration loaded');
      }
    } catch (e) {
      console.error('[PAYMENT-CONFIG] Failed to load config:', e);
    }
  }

  /**
   * Reset to default configuration
   */
  function resetConfig() {
    try {
      localStorage.removeItem('tts_payment_config');
      console.log('[PAYMENT-CONFIG] Configuration reset to defaults');
      return true;
    } catch (e) {
      console.error('[PAYMENT-CONFIG] Failed to reset config:', e);
      return false;
    }
  }

  /**
   * Get next invoice number
   */
  function getNextInvoiceNumber() {
    var config = PAYMENT_CONFIG.invoice;
    var nextNumber = config.nextNumber || config.startNumber;

    var invoiceNumber = config.prefix + String(nextNumber).padStart(4, '0');

    // Increment for next time
    config.nextNumber = nextNumber + 1;
    saveConfig();

    return invoiceNumber;
  }

  /**
   * Get next receipt number
   */
  function getNextReceiptNumber() {
    var config = PAYMENT_CONFIG.receipt;
    var nextNumber = config.nextNumber || config.startNumber;

    var receiptNumber = config.prefix + String(nextNumber).padStart(4, '0');

    // Increment for next time
    config.nextNumber = nextNumber + 1;
    saveConfig();

    return receiptNumber;
  }

  /**
   * Calculate deposit amount
   */
  function calculateDepositAmount(total) {
    var percentage = PAYMENT_CONFIG.options.depositPercentage / 100;
    var deposit = total * percentage;

    // Apply minimum
    if (deposit < PAYMENT_CONFIG.options.depositMinimum) {
      deposit = PAYMENT_CONFIG.options.depositMinimum;
    }

    // Round to 2 decimals
    return Math.round(deposit * 100) / 100;
  }

  /**
   * Check if deposit is required
   */
  function isDepositRequired(total) {
    return PAYMENT_CONFIG.features.deposits &&
           total >= PAYMENT_CONFIG.options.requireDepositOver;
  }

  /**
   * Calculate due date
   */
  function calculateDueDate(fromDate) {
    var date = fromDate ? new Date(fromDate) : new Date();
    date.setDate(date.getDate() + PAYMENT_CONFIG.options.dueDays);
    return date.toISOString();
  }

  /**
   * Format bank details reference
   */
  function formatBankReference(invoiceNumber) {
    var template = PAYMENT_CONFIG.invoice.bankDetails.reference;
    return template.replace('{invoiceNumber}', invoiceNumber);
  }

  // Initialize - load config on startup
  function init() {
    loadConfig();
    console.log('[PAYMENT-CONFIG] Initialized');
  }

  // Public API
  var PaymentConfig = {
    getConfig: getConfig,
    updateConfig: updateConfig,
    saveConfig: saveConfig,
    loadConfig: loadConfig,
    resetConfig: resetConfig,
    getNextInvoiceNumber: getNextInvoiceNumber,
    getNextReceiptNumber: getNextReceiptNumber,
    calculateDepositAmount: calculateDepositAmount,
    isDepositRequired: isDepositRequired,
    calculateDueDate: calculateDueDate,
    formatBankReference: formatBankReference,
    init: init
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('paymentConfig', PaymentConfig);
  }

  // Make globally available
  window.PaymentConfig = PaymentConfig;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[PAYMENT-CONFIG] Module loaded');
})();
