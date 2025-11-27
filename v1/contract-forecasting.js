// contract-forecasting.js - Revenue Forecasting & Analytics
// Dependencies: contract-manager.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[CONTRACT-FORECASTING] Skipped in test mode');
    return;
  }

  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  function calculateMRR() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return 0;
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var mrr = 0;

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];
      var perServiceValue = contract.pricing.total;

      // Convert to monthly equivalent
      if (contract.frequency.unit === 'week') {
        // Weekly = 4.33 times per month
        mrr += perServiceValue * (4.33 / contract.frequency.interval);
      } else if (contract.frequency.unit === 'month') {
        // Monthly
        mrr += perServiceValue / contract.frequency.interval;
      }
    }

    return parseFloat(mrr.toFixed(2));
  }

  /**
   * Calculate Annual Recurring Revenue (ARR)
   */
  function calculateARR() {
    return parseFloat((calculateMRR() * 12).toFixed(2));
  }

  /**
   * Calculate Annual Contract Value (ACV)
   */
  function calculateACV() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return 0;
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var totalACV = 0;

    for (var i = 0; i < contracts.length; i++) {
      var acv = window.ContractManager.calculateContractValue(contracts[i], 'annual');
      totalACV += acv;
    }

    return parseFloat(totalACV.toFixed(2));
  }

  /**
   * Forecast revenue for next N months
   */
  function forecastRevenue(months) {
    months = months || 12;

    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return [];
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var forecast = [];

    // Initialize forecast array
    for (var i = 0; i < months; i++) {
      var date = new Date();
      date.setMonth(date.getMonth() + i);

      forecast.push({
        month: date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
        monthName: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
        revenue: 0,
        services: 0,
        contracts: []
      });
    }

    // Calculate revenue for each contract
    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];

      // Project services for this contract
      var services = projectContractServices(contract, months);

      // Add to forecast
      for (var j = 0; j < services.length; j++) {
        var service = services[j];
        var monthIndex = getMonthIndex(service.date);

        if (monthIndex >= 0 && monthIndex < months) {
          forecast[monthIndex].revenue += contract.pricing.total;
          forecast[monthIndex].services++;
          forecast[monthIndex].contracts.push({
            contractId: contract.id,
            clientName: contract.client.name,
            value: contract.pricing.total
          });
        }
      }
    }

    // Round revenue values
    for (var i = 0; i < forecast.length; i++) {
      forecast[i].revenue = parseFloat(forecast[i].revenue.toFixed(2));
    }

    return forecast;
  }

  /**
   * Project services for a contract
   */
  function projectContractServices(contract, months) {
    var services = [];
    var endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Start from next service date or today
    var serviceDate = contract.nextService && contract.nextService.scheduledDate ?
        new Date(contract.nextService.scheduledDate) : new Date();

    // Generate services until end date
    while (serviceDate <= endDate) {
      // Check if contract is still active at this date
      if (contract.terms.endDate) {
        var contractEnd = new Date(contract.terms.endDate);
        if (serviceDate > contractEnd) break;
      }

      services.push({
        date: new Date(serviceDate)
      });

      // Calculate next service date
      if (contract.frequency.unit === 'week') {
        serviceDate.setDate(serviceDate.getDate() + (contract.frequency.interval * 7));
      } else if (contract.frequency.unit === 'month') {
        serviceDate.setMonth(serviceDate.getMonth() + contract.frequency.interval);
      }
    }

    return services;
  }

  /**
   * Get month index from date
   */
  function getMonthIndex(date) {
    var now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);

    var targetDate = new Date(date);
    targetDate.setDate(1);
    targetDate.setHours(0, 0, 0, 0);

    var monthsDiff = (targetDate.getFullYear() - now.getFullYear()) * 12 +
                     (targetDate.getMonth() - now.getMonth());

    return monthsDiff;
  }

  /**
   * Calculate churn rate
   */
  function calculateChurnRate(period) {
    period = period || 90; // days

    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return {
        activeAtStart: 0,
        churned: 0,
        churnRate: 0,
        period: period
      };
    }

    var startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    var allContracts = window.ContractManager.getAllContracts();

    var activeAtStart = 0;
    var churned = 0;

    for (var i = 0; i < allContracts.length; i++) {
      var contract = allContracts[i];
      var activationDate = contract.activationDate ? new Date(contract.activationDate) : null;
      var cancellationDate = contract.cancellationDate ? new Date(contract.cancellationDate) : null;

      // Was active at start of period?
      if (activationDate && activationDate < startDate) {
        activeAtStart++;

        // Did it churn during period?
        if (cancellationDate && cancellationDate >= startDate) {
          churned++;
        }
      }
    }

    var churnRate = activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;

    return {
      activeAtStart: activeAtStart,
      churned: churned,
      churnRate: parseFloat(churnRate.toFixed(2)),
      period: period
    };
  }

  /**
   * Calculate Customer Lifetime Value (CLV)
   */
  function calculateCLV() {
    var mrr = calculateMRR();
    var churnData = calculateChurnRate(90); // 90-day churn
    var monthlyChurnRate = churnData.churnRate / 3; // Convert to monthly

    // Average customer lifetime in months
    var avgLifetime = monthlyChurnRate > 0 ? (1 / (monthlyChurnRate / 100)) : 36; // Default 36 months

    // CLV = MRR * Average Lifetime
    var clv = mrr * avgLifetime;

    return {
      clv: parseFloat(clv.toFixed(2)),
      avgLifetimeMonths: parseFloat(avgLifetime.toFixed(1)),
      monthlyChurnRate: parseFloat(monthlyChurnRate.toFixed(2))
    };
  }

  /**
   * Get top contracts by value
   */
  function getTopContracts(limit) {
    limit = limit || 10;

    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return [];
    }

    var contracts = window.ContractManager.getContractsByStatus('active');

    // Calculate annual value for each contract
    var contractsWithValue = [];
    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];
      var annualValue = window.ContractManager.calculateContractValue(contract, 'annual');

      contractsWithValue.push({
        contract: contract,
        annualValue: annualValue
      });
    }

    // Sort by annual value descending
    contractsWithValue.sort(function(a, b) {
      return b.annualValue - a.annualValue;
    });

    // Return top N
    return contractsWithValue.slice(0, limit);
  }

  /**
   * Get revenue breakdown by type
   */
  function getRevenueByType() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return {};
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var breakdown = {
      residential: 0,
      commercial: 0,
      strata: 0
    };

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];
      var monthlyValue = window.ContractManager.calculateContractValue(contract, 'monthly');

      if (breakdown.hasOwnProperty(contract.type)) {
        breakdown[contract.type] += monthlyValue;
      }
    }

    // Round values
    for (var key in breakdown) {
      if (breakdown.hasOwnProperty(key)) {
        breakdown[key] = parseFloat(breakdown[key].toFixed(2));
      }
    }

    return breakdown;
  }

  /**
   * Get revenue breakdown by frequency
   */
  function getRevenueByFrequency() {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-FORECASTING] ContractManager not available');
      return {};
    }

    var contracts = window.ContractManager.getContractsByStatus('active');
    var breakdown = {};

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];
      var freqId = contract.frequency.id || 'unknown';
      var monthlyValue = window.ContractManager.calculateContractValue(contract, 'monthly');

      if (!breakdown[freqId]) {
        breakdown[freqId] = 0;
      }

      breakdown[freqId] += monthlyValue;
    }

    // Round values
    for (var key in breakdown) {
      if (breakdown.hasOwnProperty(key)) {
        breakdown[key] = parseFloat(breakdown[key].toFixed(2));
      }
    }

    return breakdown;
  }

  /**
   * Generate comprehensive revenue report
   */
  function generateReport() {
    var mrr = calculateMRR();
    var arr = calculateARR();
    var acv = calculateACV();
    var forecast = forecastRevenue(12);
    var churn = calculateChurnRate(90);
    var clv = calculateCLV();
    var topContracts = getTopContracts(10);
    var revenueByType = getRevenueByType();
    var revenueByFrequency = getRevenueByFrequency();

    var activeContracts = 0;
    if (window.ContractManager) {
      activeContracts = window.ContractManager.getContractsByStatus('active').length;
    }

    return {
      metrics: {
        mrr: mrr,
        arr: arr,
        acv: acv,
        activeContracts: activeContracts,
        churnRate: churn.churnRate,
        clv: clv.clv
      },
      forecast: forecast,
      churn: churn,
      clvAnalysis: clv,
      topContracts: topContracts,
      revenueByType: revenueByType,
      revenueByFrequency: revenueByFrequency,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate growth rate
   */
  function calculateGrowthRate(months) {
    months = months || 3;

    var forecast = forecastRevenue(months + 1);

    if (forecast.length < 2) {
      return 0;
    }

    var currentRevenue = forecast[0].revenue;
    var futureRevenue = forecast[months].revenue;

    if (currentRevenue === 0) return 0;

    var growthRate = ((futureRevenue - currentRevenue) / currentRevenue) * 100;
    return parseFloat(growthRate.toFixed(2));
  }

  // Initialize
  function init() {
    console.log('[CONTRACT-FORECASTING] Initialized');
  }

  // Public API
  var ContractForecasting = {
    calculateMRR: calculateMRR,
    calculateARR: calculateARR,
    calculateACV: calculateACV,
    forecastRevenue: forecastRevenue,
    calculateChurnRate: calculateChurnRate,
    calculateCLV: calculateCLV,
    getTopContracts: getTopContracts,
    getRevenueByType: getRevenueByType,
    getRevenueByFrequency: getRevenueByFrequency,
    generateReport: generateReport,
    calculateGrowthRate: calculateGrowthRate,
    init: init
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractForecasting', ContractForecasting);
  }

  // Make globally available
  window.ContractForecasting = ContractForecasting;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[CONTRACT-FORECASTING] Module loaded');
})();
