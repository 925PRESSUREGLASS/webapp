// contract-types.js - Contract type definitions and pricing configurations
// Dependencies: None
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Contract Type Definitions
   * Define available contract types and their parameters
   */
  var CONTRACT_TYPES = {
    residential: {
      id: 'residential',
      name: 'Residential Maintenance',
      description: 'Regular home maintenance services',
      categories: ['windows', 'pressure-washing', 'gutters'],

      frequencies: [
        { id: 'monthly', name: 'Monthly', interval: 1, unit: 'month', discount: 15 },
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 10 },
        { id: 'biannual', name: 'Bi-Annual', interval: 6, unit: 'month', discount: 5 },
        { id: 'annual', name: 'Annual', interval: 12, unit: 'month', discount: 0 }
      ],

      terms: {
        minimumDuration: 6, // months
        noticePeriod: 30, // days
        autoRenew: true,
        priceIncreaseNotice: 60 // days
      },

      benefits: [
        'Priority scheduling',
        'Guaranteed pricing',
        'No call-out fees',
        'Flexible rescheduling',
        'Satisfaction guarantee'
      ]
    },

    commercial: {
      id: 'commercial',
      name: 'Commercial Contract',
      description: 'Business and commercial property maintenance',
      categories: ['windows', 'pressure-washing', 'facade-cleaning'],

      frequencies: [
        { id: 'weekly', name: 'Weekly', interval: 1, unit: 'week', discount: 25 },
        { id: 'fortnightly', name: 'Fortnightly', interval: 2, unit: 'week', discount: 20 },
        { id: 'monthly', name: 'Monthly', interval: 1, unit: 'month', discount: 15 },
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 10 }
      ],

      terms: {
        minimumDuration: 12, // months
        noticePeriod: 60, // days
        autoRenew: true,
        priceIncreaseNotice: 90 // days
      },

      benefits: [
        'Dedicated service manager',
        'After-hours service available',
        'Emergency response',
        'Detailed reporting',
        'SLA guarantees',
        'Volume discounts'
      ]
    },

    strata: {
      id: 'strata',
      name: 'Strata/Body Corporate',
      description: 'Multi-unit residential and commercial buildings',
      categories: ['windows', 'pressure-washing', 'common-areas'],

      frequencies: [
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 15 },
        { id: 'biannual', name: 'Bi-Annual', interval: 6, unit: 'month', discount: 10 },
        { id: 'annual', name: 'Annual', interval: 12, unit: 'month', discount: 5 }
      ],

      terms: {
        minimumDuration: 12, // months
        noticePeriod: 90, // days
        autoRenew: true,
        priceIncreaseNotice: 120, // days
        requiresAGMApproval: true
      },

      benefits: [
        'Bulk building discount',
        'Scheduled around residents',
        'Detailed documentation',
        'AGM presentation',
        'Multi-year discounts',
        'Committee liaison'
      ]
    }
  };

  /**
   * Pricing adjustments for contracts
   */
  var CONTRACT_PRICING = {
    // Volume discounts
    volumeDiscounts: [
      { threshold: 5, discount: 5, label: '5+ services' },
      { threshold: 10, discount: 10, label: '10+ services' },
      { threshold: 20, discount: 15, label: '20+ services' }
    ],

    // Duration discounts
    durationDiscounts: [
      { months: 12, discount: 5, label: '12-month commitment' },
      { months: 24, discount: 10, label: '24-month commitment' },
      { months: 36, discount: 15, label: '36-month commitment' }
    ],

    // Payment method discounts
    paymentDiscounts: {
      annual: 10, // Pay full year upfront
      directDebit: 5, // Automatic payments
      prepay: 7 // Prepay X services
    },

    // Multi-service bundle discount
    bundleDiscount: 10, // 10% off when combining services

    // Referral incentives for contract holders
    referralBonus: {
      type: 'credit', // or 'discount'
      amount: 50, // $50 credit per referral
      minimum: 3 // Must complete 3 services first
    }
  };

  /**
   * Save contract configuration
   */
  function saveContractConfig() {
    try {
      localStorage.setItem('tts_contract_types', JSON.stringify(CONTRACT_TYPES));
      localStorage.setItem('tts_contract_pricing', JSON.stringify(CONTRACT_PRICING));
      console.log('[CONTRACT-TYPES] Configuration saved');
    } catch (e) {
      console.error('[CONTRACT-TYPES] Failed to save config:', e);
    }
  }

  /**
   * Load contract configuration
   */
  function loadContractConfig() {
    try {
      var types = localStorage.getItem('tts_contract_types');
      if (types) {
        CONTRACT_TYPES = JSON.parse(types);
      }

      var pricing = localStorage.getItem('tts_contract_pricing');
      if (pricing) {
        CONTRACT_PRICING = JSON.parse(pricing);
      }

      console.log('[CONTRACT-TYPES] Configuration loaded');
    } catch (e) {
      console.error('[CONTRACT-TYPES] Failed to load config:', e);
    }
  }

  /**
   * Get contract type by ID
   */
  function getContractType(typeId) {
    return CONTRACT_TYPES[typeId] || null;
  }

  /**
   * Get all contract types
   */
  function getAllContractTypes() {
    return CONTRACT_TYPES;
  }

  /**
   * Get frequencies for contract type
   */
  function getFrequenciesForType(typeId) {
    var type = getContractType(typeId);
    return type ? type.frequencies : [];
  }

  /**
   * Get frequency by ID
   */
  function getFrequency(typeId, frequencyId) {
    var frequencies = getFrequenciesForType(typeId);
    for (var i = 0; i < frequencies.length; i++) {
      if (frequencies[i].id === frequencyId) {
        return frequencies[i];
      }
    }
    return null;
  }

  /**
   * Calculate frequency discount
   */
  function calculateFrequencyDiscount(typeId, frequencyId, basePrice) {
    var frequency = getFrequency(typeId, frequencyId);
    if (!frequency) return 0;

    return basePrice * (frequency.discount / 100);
  }

  /**
   * Calculate duration discount
   */
  function calculateDurationDiscount(durationMonths, basePrice) {
    var applicableDiscount = 0;

    for (var i = 0; i < CONTRACT_PRICING.durationDiscounts.length; i++) {
      var tier = CONTRACT_PRICING.durationDiscounts[i];
      if (durationMonths >= tier.months && tier.discount > applicableDiscount) {
        applicableDiscount = tier.discount;
      }
    }

    return basePrice * (applicableDiscount / 100);
  }

  /**
   * Calculate payment method discount
   */
  function calculatePaymentDiscount(paymentMethod, basePrice) {
    var discountPct = 0;

    if (paymentMethod === 'annual' && CONTRACT_PRICING.paymentDiscounts.annual) {
      discountPct = CONTRACT_PRICING.paymentDiscounts.annual;
    } else if (paymentMethod === 'direct-debit' && CONTRACT_PRICING.paymentDiscounts.directDebit) {
      discountPct = CONTRACT_PRICING.paymentDiscounts.directDebit;
    } else if (paymentMethod === 'prepay' && CONTRACT_PRICING.paymentDiscounts.prepay) {
      discountPct = CONTRACT_PRICING.paymentDiscounts.prepay;
    }

    return basePrice * (discountPct / 100);
  }

  /**
   * Get pricing configuration
   */
  function getPricingConfig() {
    return CONTRACT_PRICING;
  }

  // Load configuration on startup
  loadContractConfig();

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractTypes', {
      getContractType: getContractType,
      getAllContractTypes: getAllContractTypes,
      getFrequenciesForType: getFrequenciesForType,
      getFrequency: getFrequency,
      getPricingConfig: getPricingConfig,
      saveConfig: saveContractConfig,
      loadConfig: loadContractConfig
    });
  }

  // Global API
  window.ContractTypes = {
    getContractType: getContractType,
    getAllContractTypes: getAllContractTypes,
    getFrequenciesForType: getFrequenciesForType,
    getFrequency: getFrequency,
    calculateFrequencyDiscount: calculateFrequencyDiscount,
    calculateDurationDiscount: calculateDurationDiscount,
    calculatePaymentDiscount: calculatePaymentDiscount,
    getPricingConfig: getPricingConfig,
    saveConfig: saveContractConfig,
    loadConfig: loadContractConfig,
    CONTRACT_TYPES: CONTRACT_TYPES,
    CONTRACT_PRICING: CONTRACT_PRICING
  };

  console.log('[CONTRACT-TYPES] Initialized');
})();
