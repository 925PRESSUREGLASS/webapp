// contract-manager.js - Contract Management System
// Dependencies: storage.js, calc.js, client-database.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Contract Types Configuration
  var CONTRACT_TYPES = {
    residential: {
      name: 'Residential',
      description: 'Single-family homes, townhouses, apartments',
      frequencies: [
        { id: 'weekly', name: 'Weekly', interval: 1, unit: 'week', discount: 15 },
        { id: 'fortnightly', name: 'Fortnightly', interval: 2, unit: 'week', discount: 12 },
        { id: 'monthly', name: 'Monthly', interval: 1, unit: 'month', discount: 10 },
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 5 },
        { id: 'semi-annual', name: 'Semi-Annual', interval: 6, unit: 'month', discount: 3 },
        { id: 'annual', name: 'Annual', interval: 12, unit: 'month', discount: 0 }
      ]
    },
    commercial: {
      name: 'Commercial',
      description: 'Offices, retail stores, restaurants',
      frequencies: [
        { id: 'weekly', name: 'Weekly', interval: 1, unit: 'week', discount: 20 },
        { id: 'fortnightly', name: 'Fortnightly', interval: 2, unit: 'week', discount: 15 },
        { id: 'monthly', name: 'Monthly', interval: 1, unit: 'month', discount: 12 },
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 8 }
      ]
    },
    strata: {
      name: 'Strata/Body Corporate',
      description: 'Multi-unit buildings, apartment complexes',
      frequencies: [
        { id: 'fortnightly', name: 'Fortnightly', interval: 2, unit: 'week', discount: 18 },
        { id: 'monthly', name: 'Monthly', interval: 1, unit: 'month', discount: 15 },
        { id: 'quarterly', name: 'Quarterly', interval: 3, unit: 'month', discount: 10 }
      ]
    }
  };

  // Storage keys
  var STORAGE_KEY = 'tts_contracts';
  var COUNTER_KEY = 'tts_contract_counter';

  /**
   * Get all contracts from storage
   */
  function getAllContracts() {
    try {
      var json = localStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      return JSON.parse(json);
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to load contracts:', e);
      return [];
    }
  }

  /**
   * Save contracts to storage
   */
  function saveContracts(contracts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
      return true;
    } catch (e) {
      console.error('[CONTRACT-MANAGER] Failed to save contracts:', e);
      if (window.UIComponents) {
        window.UIComponents.showToast('Failed to save contracts', 'error');
      }
      return false;
    }
  }

  /**
   * Generate unique contract number
   */
  function generateContractNumber() {
    var counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0');
    counter++;
    localStorage.setItem(COUNTER_KEY, counter.toString());

    var year = new Date().getFullYear();
    var padded = ('0000' + counter).slice(-4);
    return 'CTR-' + year + '-' + padded;
  }

  /**
   * Create new contract
   */
  function createContract(data) {
    var contract = {
      id: 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      contractNumber: generateContractNumber(),
      type: data.type || 'residential',
      category: data.category || 'windows',
      status: data.status || 'draft',

      // Client information
      client: {
        id: data.client.id || null,
        name: data.client.name || '',
        phone: data.client.phone || '',
        email: data.client.email || '',
        address: data.client.address || ''
      },

      // Services
      services: data.services || [],

      // Frequency
      frequency: data.frequency || { id: 'monthly', interval: 1, unit: 'month' },

      // Contract terms
      terms: {
        startDate: data.terms ? data.terms.startDate : null,
        endDate: data.terms ? data.terms.endDate : null,
        duration: data.terms ? data.terms.duration : 12,
        autoRenew: data.terms ? data.terms.autoRenew : false,
        noticePeriod: data.terms ? data.terms.noticePeriod : 30
      },

      // Payment
      payment: {
        method: data.payment ? data.payment.method : 'invoice',
        terms: data.payment ? data.payment.terms : 'net-7'
      },

      // Pricing (calculated)
      pricing: {},

      // Schedule
      schedule: {
        preferredDay: data.schedule ? data.schedule.preferredDay : null,
        preferredTime: data.schedule ? data.schedule.preferredTime : 'morning',
        flexible: data.schedule ? data.schedule.flexible : true
      },

      // Next service
      nextService: {
        scheduledDate: null,
        quoteId: null,
        reminderSent: false,
        confirmed: false
      },

      // Service history
      serviceHistory: [],

      // Notes
      notes: data.notes || '',

      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      activationDate: null,
      cancellationDate: null,
      cancellationReason: null
    };

    // Calculate pricing
    contract.pricing = calculateContractPricing(contract);

    // Calculate next service date if contract is active
    if (contract.status === 'active' && contract.terms.startDate) {
      contract.nextService.scheduledDate = calculateNextServiceDate(contract);
    }

    // Save contract
    var contracts = getAllContracts();
    contracts.push(contract);
    saveContracts(contracts);

    console.log('[CONTRACT-MANAGER] Contract created:', contract.contractNumber);

    return contract;
  }

  /**
   * Calculate contract pricing
   */
  function calculateContractPricing(contract) {
    var basePrice = 0;

    // Sum all services
    for (var i = 0; i < contract.services.length; i++) {
      var service = contract.services[i];
      basePrice += (service.unitPrice || 0) * (service.quantity || 1);
    }

    // Get frequency discount
    var discount = 0;
    var contractType = CONTRACT_TYPES[contract.type];
    if (contractType && contract.frequency) {
      for (var i = 0; i < contractType.frequencies.length; i++) {
        var freq = contractType.frequencies[i];
        if (freq.id === contract.frequency.id) {
          discount = freq.discount || 0;
          break;
        }
      }
    }

    // Calculate discounted price
    var discountAmount = basePrice * (discount / 100);
    var subtotal = basePrice - discountAmount;

    // Calculate GST (10%)
    var gst = subtotal * 0.1;
    var total = subtotal + gst;

    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Calculate next service date
   */
  function calculateNextServiceDate(contract, fromDate) {
    var baseDate = fromDate ? new Date(fromDate) : new Date();

    // If contract has a scheduled next service, use that
    if (!fromDate && contract.nextService && contract.nextService.scheduledDate) {
      return contract.nextService.scheduledDate;
    }

    // Calculate based on frequency
    var nextDate = new Date(baseDate);

    if (contract.frequency.unit === 'week') {
      nextDate.setDate(nextDate.getDate() + (contract.frequency.interval * 7));
    } else if (contract.frequency.unit === 'month') {
      nextDate.setMonth(nextDate.getMonth() + contract.frequency.interval);
    }

    // Adjust to preferred day of week if specified
    if (contract.schedule.preferredDay !== null && !isNaN(contract.schedule.preferredDay)) {
      var currentDay = nextDate.getDay();
      var targetDay = parseInt(contract.schedule.preferredDay);
      var daysToAdd = (targetDay - currentDay + 7) % 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Calculate contract value for a period
   */
  function calculateContractValue(contract, period) {
    period = period || 'annual';

    var perServiceValue = contract.pricing.total;
    var servicesPerYear = 0;

    // Calculate services per year based on frequency
    if (contract.frequency.unit === 'week') {
      servicesPerYear = 52 / contract.frequency.interval;
    } else if (contract.frequency.unit === 'month') {
      servicesPerYear = 12 / contract.frequency.interval;
    }

    var annualValue = perServiceValue * servicesPerYear;

    if (period === 'annual') {
      return parseFloat(annualValue.toFixed(2));
    } else if (period === 'monthly') {
      return parseFloat((annualValue / 12).toFixed(2));
    }

    return 0;
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
   * Update contract
   */
  function updateContract(contractId, updates) {
    var contracts = getAllContracts();
    var found = false;

    for (var i = 0; i < contracts.length; i++) {
      if (contracts[i].id === contractId) {
        // Merge updates
        for (var key in updates) {
          if (updates.hasOwnProperty(key)) {
            contracts[i][key] = updates[key];
          }
        }

        contracts[i].updatedAt = new Date().toISOString();

        // Recalculate pricing if services or frequency changed
        if (updates.services || updates.frequency) {
          contracts[i].pricing = calculateContractPricing(contracts[i]);
        }

        found = true;
        break;
      }
    }

    if (found) {
      saveContracts(contracts);
      return true;
    }

    return false;
  }

  /**
   * Delete contract
   */
  function deleteContract(contractId) {
    var contracts = getAllContracts();
    var newContracts = [];

    for (var i = 0; i < contracts.length; i++) {
      if (contracts[i].id !== contractId) {
        newContracts.push(contracts[i]);
      }
    }

    saveContracts(newContracts);
    console.log('[CONTRACT-MANAGER] Contract deleted:', contractId);
    return true;
  }

  /**
   * Update contract status
   */
  function updateContractStatus(contractId, newStatus, reason) {
    var contract = getContract(contractId);
    if (!contract) return false;

    var oldStatus = contract.status;
    contract.status = newStatus;
    contract.updatedAt = new Date().toISOString();

    // Handle status-specific logic
    if (newStatus === 'active' && oldStatus !== 'active') {
      contract.activationDate = new Date().toISOString();

      // Calculate first service date
      if (!contract.nextService.scheduledDate) {
        contract.nextService.scheduledDate = calculateNextServiceDate(contract);
      }
    } else if (newStatus === 'cancelled') {
      contract.cancellationDate = new Date().toISOString();
      contract.cancellationReason = reason || '';
    }

    updateContract(contractId, contract);

    console.log('[CONTRACT-MANAGER] Contract status updated:', contractId, oldStatus, '->', newStatus);
    return true;
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
   * Get upcoming services
   */
  function getUpcomingServices(daysAhead) {
    daysAhead = daysAhead || 30;

    var contracts = getContractsByStatus('active');
    var upcoming = [];

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      if (contract.nextService && contract.nextService.scheduledDate) {
        var serviceDate = new Date(contract.nextService.scheduledDate);
        serviceDate.setHours(0, 0, 0, 0);

        if (serviceDate >= today && serviceDate <= futureDate) {
          var daysUntil = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));

          upcoming.push({
            contract: contract,
            serviceDate: contract.nextService.scheduledDate,
            daysUntil: daysUntil
          });
        }
      }
    }

    // Sort by date
    upcoming.sort(function(a, b) {
      return new Date(a.serviceDate) - new Date(b.serviceDate);
    });

    return upcoming;
  }

  /**
   * Record service completion
   */
  function recordServiceCompletion(contractId, completionData) {
    var contract = getContract(contractId);
    if (!contract) return false;

    // Add to service history
    var serviceRecord = {
      id: 'service_' + Date.now(),
      scheduledDate: contract.nextService.scheduledDate,
      completedDate: completionData.completedDate || new Date().toISOString(),
      quoteId: contract.nextService.quoteId || null,
      invoiceId: completionData.invoiceId || null,
      status: 'completed',
      notes: completionData.notes || '',
      photos: completionData.photos || []
    };

    contract.serviceHistory.push(serviceRecord);

    // Calculate next service date
    var nextDate = calculateNextServiceDate(contract, new Date(serviceRecord.completedDate));

    // Reset next service
    contract.nextService = {
      scheduledDate: nextDate,
      quoteId: null,
      reminderSent: false,
      confirmed: false
    };

    updateContract(contractId, contract);

    console.log('[CONTRACT-MANAGER] Service completed:', contractId);
    return serviceRecord;
  }

  /**
   * Generate quote for next service
   */
  function generateServiceQuote(contractId) {
    var contract = getContract(contractId);
    if (!contract) return null;

    // Create quote data from contract
    var quoteData = {
      quoteTitle: 'Service for ' + contract.client.name + ' - ' + contract.contractNumber,
      clientName: contract.client.name,
      clientPhone: contract.client.phone,
      clientEmail: contract.client.email || '',
      clientLocation: contract.client.address,
      jobType: contract.category,
      contractId: contractId,

      // Copy services from contract
      windowLines: [],
      pressureLines: [],

      // Use contract pricing
      baseFee: 0,
      hourlyRate: 0,

      clientNotes: 'Scheduled service for contract ' + contract.contractNumber,
      internalNotes: 'Auto-generated from contract. Service date: ' + contract.nextService.scheduledDate
    };

    // Convert contract services to quote line items
    for (var i = 0; i < contract.services.length; i++) {
      var service = contract.services[i];

      if (contract.category === 'windows') {
        quoteData.windowLines.push({
          id: 'window_' + Date.now() + '_' + i,
          type: service.type || 'standard',
          quantity: service.quantity || 1,
          insidePanes: service.quantity || 1,
          outsidePanes: service.quantity || 1,
          highReach: false
        });
      } else if (contract.category === 'pressure-washing') {
        quoteData.pressureLines.push({
          id: 'pressure_' + Date.now() + '_' + i,
          surface: service.surface || 'concrete',
          area: service.area || 50,
          unit: 'sqm'
        });
      }
    }

    // Save quote if APP is available
    if (window.APP && window.APP.setState) {
      window.APP.setState(quoteData);
      window.APP.saveState();

      // Update contract with quote ID
      contract.nextService.quoteId = 'quote_' + Date.now();
      contract.nextService.quoteGenerated = true;
      updateContract(contractId, contract);

      console.log('[CONTRACT-MANAGER] Quote generated for contract:', contractId);
      return quoteData;
    }

    return quoteData;
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
      suspended: 0,
      cancelled: 0,
      completed: 0,

      byType: {
        residential: 0,
        commercial: 0,
        strata: 0
      },

      byFrequency: {},

      totalMonthlyRevenue: 0,
      totalAnnualRevenue: 0
    };

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      // Count by status
      if (contract.status === 'active') stats.active++;
      else if (contract.status === 'pending') stats.pending++;
      else if (contract.status === 'suspended') stats.suspended++;
      else if (contract.status === 'cancelled') stats.cancelled++;
      else if (contract.status === 'completed') stats.completed++;

      // Count by type
      if (stats.byType.hasOwnProperty(contract.type)) {
        stats.byType[contract.type]++;
      }

      // Count by frequency
      var freqId = contract.frequency.id || 'unknown';
      if (!stats.byFrequency[freqId]) {
        stats.byFrequency[freqId] = 0;
      }
      stats.byFrequency[freqId]++;

      // Sum revenue for active contracts
      if (contract.status === 'active') {
        var monthlyValue = calculateContractValue(contract, 'monthly');
        var annualValue = calculateContractValue(contract, 'annual');

        stats.totalMonthlyRevenue += monthlyValue;
        stats.totalAnnualRevenue += annualValue;
      }
    }

    return stats;
  }

  // Initialize module
  function init() {
    console.log('[CONTRACT-MANAGER] Initialized');
  }

  // Public API
  var ContractManager = {
    // Configuration
    CONTRACT_TYPES: CONTRACT_TYPES,

    // CRUD operations
    createContract: createContract,
    getContract: getContract,
    getAllContracts: getAllContracts,
    updateContract: updateContract,
    deleteContract: deleteContract,

    // Status management
    updateContractStatus: updateContractStatus,
    getContractsByStatus: getContractsByStatus,

    // Pricing & calculations
    calculateContractPricing: calculateContractPricing,
    calculateContractValue: calculateContractValue,
    calculateNextServiceDate: calculateNextServiceDate,

    // Service management
    getUpcomingServices: getUpcomingServices,
    recordServiceCompletion: recordServiceCompletion,
    generateServiceQuote: generateServiceQuote,

    // Analytics
    getContractStats: getContractStats,

    // Initialization
    init: init
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractManager', ContractManager);
  }

  // Make globally available
  window.ContractManager = ContractManager;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[CONTRACT-MANAGER] Module loaded');
})();
