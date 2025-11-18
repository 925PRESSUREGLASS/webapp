// contract-manager.js - Contract management system
// Dependencies: contract-types.js, storage.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var STORAGE_KEY = 'tts_contracts';
  var SCHEDULE_KEY = 'tts_contract_schedule';

  /**
   * Contract data structure
   */
  function createContractStructure() {
    return {
      id: generateId('contract'),
      contractNumber: generateContractNumber(),

      // Client information
      client: {
        id: null,
        name: '',
        email: '',
        phone: '',
        address: '',
        ghlId: null
      },

      // Contract details
      type: 'residential', // residential, commercial, strata
      category: 'windows', // windows, pressure-washing, etc.

      // Frequency and scheduling
      frequency: {
        interval: 1,
        unit: 'month', // week, month
        id: 'monthly'
      },

      // Services included
      services: [],

      // Pricing
      pricing: {
        basePrice: 0,
        discounts: [],
        totalDiscount: 0,
        subtotal: 0,
        gst: 0,
        total: 0,
        paymentFrequency: 'per-service' // per-service, monthly, quarterly, annual
      },

      // Contract terms
      terms: {
        startDate: null,
        endDate: null, // null for ongoing
        duration: 12, // months
        minimumDuration: 6, // months
        noticePeriod: 30, // days
        autoRenew: true,
        cancellationFee: 0,
        priceIncreaseNotice: 60 // days
      },

      // Scheduling preferences
      schedule: {
        preferredDay: null, // 0-6 (Sun-Sat)
        preferredTime: null, // 'morning', 'afternoon', 'anytime'
        windowStart: null, // e.g., '09:00'
        windowEnd: null, // e.g., '17:00'
        excludeDates: [], // Holiday exclusions
        flexible: true
      },

      // Payment details
      payment: {
        method: 'invoice', // invoice, direct-debit, credit-card
        terms: 'net-7', // net-7, net-14, net-30, upfront
        directDebit: {
          enabled: false,
          bankName: '',
          accountHolder: '',
          bsb: '',
          accountNumber: ''
        }
      },

      // Status and tracking
      status: 'draft', // draft, pending, active, suspended, cancelled, completed

      // History
      signedDate: null,
      activationDate: null,
      suspensionDate: null,
      cancellationDate: null,
      cancellationReason: '',

      // Service history
      serviceHistory: [],

      // Next service
      nextService: {
        scheduledDate: null,
        confirmed: false,
        reminderSent: false,
        quoteGenerated: false,
        quoteId: null
      },

      // Metadata
      notes: '',
      tags: [],
      attachments: [], // Contract PDFs, signed agreements

      // Audit trail
      createdBy: 'system',
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      modifiedBy: 'system'
    };
  }

  /**
   * Generate contract number
   */
  function generateContractNumber() {
    var contracts = getAllContracts();
    var lastNumber = 0;

    for (var i = 0; i < contracts.length; i++) {
      var num = parseInt(contracts[i].contractNumber.replace('CON-', ''));
      if (!isNaN(num) && num > lastNumber) {
        lastNumber = num;
      }
    }

    var nextNumber = lastNumber + 1;
    return 'CON-' + String(nextNumber).padStart(4, '0');
  }

  /**
   * Generate unique ID
   */
  function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Create new contract
   */
  function createContract(data) {
    var contract = createContractStructure();

    // Merge provided data
    if (data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          if (typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
            contract[key] = mergeObjects(contract[key], data[key]);
          } else {
            contract[key] = data[key];
          }
        }
      }
    }

    // Calculate pricing
    calculateContractPricing(contract);

    // Calculate next service date if active
    if (contract.status === 'active') {
      calculateNextServiceDate(contract);
    }

    // Save contract
    saveContract(contract);

    console.log('[CONTRACT-MANAGER] Contract created:', contract.contractNumber);
    return contract;
  }

  /**
   * Merge objects helper
   */
  function mergeObjects(target, source) {
    var result = {};
    for (var key in target) {
      if (target.hasOwnProperty(key)) {
        result[key] = target[key];
      }
    }
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Calculate contract pricing
   */
  function calculateContractPricing(contract) {
    // Calculate base price from services
    var basePrice = 0;
    for (var i = 0; i < contract.services.length; i++) {
      var service = contract.services[i];
      basePrice += (service.unitPrice * service.quantity);
    }

    contract.pricing.basePrice = basePrice;

    // Apply discounts
    contract.pricing.discounts = [];
    var totalDiscount = 0;

    // Frequency discount
    if (window.ContractTypes) {
      var contractType = window.ContractTypes.getContractType(contract.type);
      if (contractType && contractType.frequencies) {
        for (var i = 0; i < contractType.frequencies.length; i++) {
          var freq = contractType.frequencies[i];
          if (freq.id === contract.frequency.id) {
            var discountAmount = basePrice * (freq.discount / 100);
            contract.pricing.discounts.push({
              type: 'frequency',
              label: freq.name + ' Discount',
              percentage: freq.discount,
              amount: discountAmount
            });
            totalDiscount += discountAmount;
            break;
          }
        }
      }

      // Duration discount
      var pricingConfig = window.ContractTypes.getPricingConfig();
      if (contract.terms.duration && pricingConfig.durationDiscounts) {
        for (var i = 0; i < pricingConfig.durationDiscounts.length; i++) {
          var dur = pricingConfig.durationDiscounts[i];
          if (contract.terms.duration >= dur.months) {
            var discountAmount = basePrice * (dur.discount / 100);
            contract.pricing.discounts.push({
              type: 'duration',
              label: dur.label,
              percentage: dur.discount,
              amount: discountAmount
            });
            totalDiscount += discountAmount;
            break;
          }
        }
      }

      // Payment method discount
      if (contract.payment.method === 'direct-debit' && pricingConfig.paymentDiscounts.directDebit) {
        var discountPct = pricingConfig.paymentDiscounts.directDebit;
        var discountAmount = basePrice * (discountPct / 100);
        contract.pricing.discounts.push({
          type: 'payment',
          label: 'Direct Debit Discount',
          percentage: discountPct,
          amount: discountAmount
        });
        totalDiscount += discountAmount;
      }

      // Multi-service bundle discount
      if (contract.services.length > 1 && pricingConfig.bundleDiscount) {
        var discountAmount = basePrice * (pricingConfig.bundleDiscount / 100);
        contract.pricing.discounts.push({
          type: 'bundle',
          label: 'Multi-Service Bundle',
          percentage: pricingConfig.bundleDiscount,
          amount: discountAmount
        });
        totalDiscount += discountAmount;
      }
    }

    // Calculate totals
    contract.pricing.totalDiscount = totalDiscount;
    contract.pricing.subtotal = basePrice - totalDiscount;
    contract.pricing.gst = contract.pricing.subtotal * 0.1;
    contract.pricing.total = contract.pricing.subtotal + contract.pricing.gst;

    return contract.pricing;
  }

  /**
   * Calculate next service date
   */
  function calculateNextServiceDate(contract) {
    var lastServiceDate;

    // Get last service date from history
    if (contract.serviceHistory && contract.serviceHistory.length > 0) {
      var completed = [];
      for (var i = 0; i < contract.serviceHistory.length; i++) {
        if (contract.serviceHistory[i].status === 'completed') {
          completed.push(contract.serviceHistory[i]);
        }
      }

      if (completed.length > 0) {
        completed.sort(function(a, b) {
          return new Date(b.date) - new Date(a.date);
        });
        lastServiceDate = new Date(completed[0].date);
      }
    }

    // If no service history, use contract start date
    if (!lastServiceDate && contract.terms.startDate) {
      lastServiceDate = new Date(contract.terms.startDate);
    }

    // If still no date, use activation date or today
    if (!lastServiceDate) {
      lastServiceDate = contract.activationDate ?
        new Date(contract.activationDate) : new Date();
    }

    // Calculate next date based on frequency
    var nextDate = new Date(lastServiceDate);

    if (contract.frequency.unit === 'week') {
      nextDate.setDate(nextDate.getDate() + (contract.frequency.interval * 7));
    } else if (contract.frequency.unit === 'month') {
      nextDate.setMonth(nextDate.getMonth() + contract.frequency.interval);
    }

    // Adjust for preferred day if set
    if (contract.schedule.preferredDay !== null) {
      var currentDay = nextDate.getDay();
      var targetDay = contract.schedule.preferredDay;
      var daysToAdd = (targetDay - currentDay + 7) % 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }

    // Check for excluded dates
    while (isDateExcluded(nextDate, contract.schedule.excludeDates)) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    contract.nextService.scheduledDate = nextDate.toISOString();
    contract.nextService.confirmed = false;
    contract.nextService.reminderSent = false;

    return nextDate;
  }

  /**
   * Check if date is excluded
   */
  function isDateExcluded(date, excludeDates) {
    if (!excludeDates || excludeDates.length === 0) return false;

    var dateStr = date.toISOString().split('T')[0];
    return excludeDates.indexOf(dateStr) > -1;
  }

  /**
   * Save contract
   */
  function saveContract(contract) {
    try {
      contract.modifiedDate = new Date().toISOString();

      var contracts = getAllContracts();
      var index = -1;
      for (var i = 0; i < contracts.length; i++) {
        if (contracts[i].id === contract.id) {
          index = i;
          break;
        }
      }

      if (index > -1) {
        contracts[index] = contract;
      } else {
        contracts.push(contract);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));

      // Update schedule
      if (contract.status === 'active') {
        updateSchedule(contract);
      }

      return true;
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to save contract:', e);
      return false;
    }
  }

  /**
   * Get contract by ID
   */
  function getContract(contractId) {
    var contracts = getAllContracts();
    for (var i = 0; i < contracts.length; i++) {
      if (contracts[i].id === contractId) {
        return contracts[i];
      }
    }
    return null;
  }

  /**
   * Get all contracts
   */
  function getAllContracts() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to load contracts:', e);
      return [];
    }
  }

  /**
   * Get contracts by status
   */
  function getContractsByStatus(status) {
    var contracts = getAllContracts();
    var filtered = [];
    for (var i = 0; i < contracts.length; i++) {
      if (contracts[i].status === status) {
        filtered.push(contracts[i]);
      }
    }
    return filtered;
  }

  /**
   * Get contracts for client
   */
  function getContractsForClient(clientId) {
    var contracts = getAllContracts();
    var filtered = [];
    for (var i = 0; i < contracts.length; i++) {
      if (contracts[i].client.id === clientId) {
        filtered.push(contracts[i]);
      }
    }
    return filtered;
  }

  /**
   * Update contract status
   */
  function updateContractStatus(contractId, newStatus, reason) {
    var contract = getContract(contractId);
    if (!contract) return false;

    var oldStatus = contract.status;
    contract.status = newStatus;

    // Update status-specific fields
    if (newStatus === 'active' && oldStatus !== 'active') {
      contract.activationDate = new Date().toISOString();
      calculateNextServiceDate(contract);
    }

    if (newStatus === 'suspended') {
      contract.suspensionDate = new Date().toISOString();
    }

    if (newStatus === 'cancelled') {
      contract.cancellationDate = new Date().toISOString();
      contract.cancellationReason = reason || '';
    }

    saveContract(contract);

    console.log('[CONTRACT-MANAGER] Contract ' + contract.contractNumber + ' status: ' + oldStatus + ' → ' + newStatus);
    return true;
  }

  /**
   * Record service completion
   */
  function recordServiceCompletion(contractId, serviceData) {
    var contract = getContract(contractId);
    if (!contract) return false;

    var serviceRecord = {
      date: serviceData.date || new Date().toISOString(),
      status: 'completed',
      invoiceId: serviceData.invoiceId || null,
      notes: serviceData.notes || '',
      rating: serviceData.rating || null,
      technician: serviceData.technician || null,
      duration: serviceData.duration || null,
      photos: serviceData.photos || []
    };

    contract.serviceHistory.push(serviceRecord);

    // Calculate next service date
    calculateNextServiceDate(contract);

    saveContract(contract);

    console.log('[CONTRACT-MANAGER] Service recorded for contract:', contract.contractNumber);
    return serviceRecord;
  }

  /**
   * Get upcoming services
   */
  function getUpcomingServices(daysAhead) {
    daysAhead = daysAhead || 30;

    var contracts = getContractsByStatus('active');
    var upcoming = [];

    var now = new Date();
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (contract.nextService && contract.nextService.scheduledDate) {
        var serviceDate = new Date(contract.nextService.scheduledDate);

        if (serviceDate >= now && serviceDate <= futureDate) {
          upcoming.push({
            contract: contract,
            serviceDate: serviceDate,
            daysUntil: Math.ceil((serviceDate - now) / (1000 * 60 * 60 * 24)),
            confirmed: contract.nextService.confirmed,
            quoteGenerated: contract.nextService.quoteGenerated
          });
        }
      }
    }

    // Sort by date
    upcoming.sort(function(a, b) {
      return a.serviceDate - b.serviceDate;
    });

    return upcoming;
  }

  /**
   * Delete contract
   */
  function deleteContract(contractId) {
    try {
      var contracts = getAllContracts();
      var filtered = [];
      for (var i = 0; i < contracts.length; i++) {
        if (contracts[i].id !== contractId) {
          filtered.push(contracts[i]);
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      console.log('[CONTRACT-MANAGER] Contract deleted:', contractId);
      return true;
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to delete contract:', e);
      return false;
    }
  }

  /**
   * Calculate contract value
   */
  function calculateContractValue(contract, period) {
    period = period || 'annual'; // annual, total, lifetime

    var perServiceValue = contract.pricing.total;
    var servicesPerYear = 0;

    // Calculate services per year
    if (contract.frequency.unit === 'week') {
      servicesPerYear = 52 / contract.frequency.interval;
    } else if (contract.frequency.unit === 'month') {
      servicesPerYear = 12 / contract.frequency.interval;
    }

    if (period === 'annual') {
      return perServiceValue * servicesPerYear;
    } else if (period === 'total' && contract.terms.duration) {
      var years = contract.terms.duration / 12;
      return perServiceValue * servicesPerYear * years;
    } else if (period === 'lifetime') {
      // Estimate 3 year average customer lifetime
      return perServiceValue * servicesPerYear * 3;
    }

    return perServiceValue * servicesPerYear;
  }

  /**
   * Update schedule
   */
  function updateSchedule(contract) {
    try {
      var schedule = getSchedule();

      // Remove old entry
      var filtered = [];
      for (var i = 0; i < schedule.length; i++) {
        if (schedule[i].contractId !== contract.id) {
          filtered.push(schedule[i]);
        }
      }
      schedule = filtered;

      // Add new entry if active
      if (contract.status === 'active' && contract.nextService.scheduledDate) {
        schedule.push({
          contractId: contract.id,
          clientName: contract.client.name,
          serviceDate: contract.nextService.scheduledDate,
          category: contract.category,
          address: contract.client.address
        });
      }

      // Sort by date
      schedule.sort(function(a, b) {
        return new Date(a.serviceDate) - new Date(b.serviceDate);
      });

      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to update schedule:', e);
    }
  }

  /**
   * Get schedule
   */
  function getSchedule() {
    try {
      var data = localStorage.getItem(SCHEDULE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to load schedule:', e);
      return [];
    }
  }

  /**
   * Get contract statistics
   */
  function getContractStats() {
    var contracts = getAllContracts();
    var stats = {
      total: contracts.length,
      active: 0,
      pending: 0,
      draft: 0,
      cancelled: 0,
      totalMonthlyRevenue: 0,
      totalAnnualRevenue: 0,
      averageContractValue: 0
    };

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      // Count by status
      if (contract.status === 'active') stats.active++;
      else if (contract.status === 'pending') stats.pending++;
      else if (contract.status === 'draft') stats.draft++;
      else if (contract.status === 'cancelled') stats.cancelled++;

      // Calculate revenue (only active contracts)
      if (contract.status === 'active') {
        var annualValue = calculateContractValue(contract, 'annual');
        stats.totalAnnualRevenue += annualValue;
        stats.totalMonthlyRevenue += annualValue / 12;
      }
    }

    if (stats.active > 0) {
      stats.averageContractValue = stats.totalAnnualRevenue / stats.active;
    }

    return stats;
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractManager', {
      createContract: createContract,
      getContract: getContract,
      getAllContracts: getAllContracts,
      saveContract: saveContract,
      deleteContract: deleteContract,
      getContractStats: getContractStats
    });
  }

  // Global API
  window.ContractManager = {
    createContract: createContract,
    getContract: getContract,
    getAllContracts: getAllContracts,
    getContractsByStatus: getContractsByStatus,
    getContractsForClient: getContractsForClient,
    saveContract: saveContract,
    deleteContract: deleteContract,
    updateContractStatus: updateContractStatus,
    calculateContractPricing: calculateContractPricing,
    calculateNextServiceDate: calculateNextServiceDate,
    recordServiceCompletion: recordServiceCompletion,
    getUpcomingServices: getUpcomingServices,
    getSchedule: getSchedule,
    calculateContractValue: calculateContractValue,
    getContractStats: getContractStats
  };

  console.log('[CONTRACT-MANAGER] Initialized');
})();
