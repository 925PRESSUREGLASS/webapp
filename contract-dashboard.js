// contract-dashboard.js - Contract dashboard and list view
// Dependencies: contract-manager.js, contract-types.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var currentFilter = 'all';
  var currentSort = 'nextService';

  /**
   * Initialize contract dashboard
   */
  function init() {
    console.log('[CONTRACT-DASHBOARD] Initializing...');
    renderDashboard();
    console.log('[CONTRACT-DASHBOARD] Initialized');
  }

  /**
   * Render contract dashboard
   */
  function renderDashboard() {
    renderStats();
    renderContractList();
    renderUpcomingServices();
  }

  /**
   * Render dashboard stats
   */
  function renderStats() {
    var statsContainer = document.getElementById('contract-stats');
    if (!statsContainer) return;

    var stats = window.ContractManager.getContractStats();

    var html = '<div class="stats-grid">';

    // Total Contracts
    html += '<div class="stat-card">';
    html += '<div class="stat-value">' + stats.total + '</div>';
    html += '<div class="stat-label">Total Contracts</div>';
    html += '</div>';

    // Active Contracts
    html += '<div class="stat-card stat-card-success">';
    html += '<div class="stat-value">' + stats.active + '</div>';
    html += '<div class="stat-label">Active Contracts</div>';
    html += '</div>';

    // Monthly Revenue
    html += '<div class="stat-card stat-card-primary">';
    html += '<div class="stat-value">$' + stats.totalMonthlyRevenue.toFixed(0) + '</div>';
    html += '<div class="stat-label">Monthly Recurring</div>';
    html += '</div>';

    // Annual Revenue
    html += '<div class="stat-card stat-card-info">';
    html += '<div class="stat-value">$' + stats.totalAnnualRevenue.toFixed(0) + '</div>';
    html += '<div class="stat-label">Annual Recurring</div>';
    html += '</div>';

    html += '</div>';

    statsContainer.innerHTML = html;
  }

  /**
   * Render contract list
   */
  function renderContractList() {
    var listContainer = document.getElementById('contract-list');
    if (!listContainer) return;

    var contracts = window.ContractManager.getAllContracts();

    // Apply filter
    if (currentFilter !== 'all') {
      contracts = contracts.filter(function(c) {
        return c.status === currentFilter;
      });
    }

    // Apply sort
    contracts = sortContracts(contracts, currentSort);

    if (contracts.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">' +
        '<p>No contracts found.</p>' +
        '<button class="btn-primary" onclick="navigateTo(\'new-contract\')">Create Your First Contract</button>' +
        '</div>';
      return;
    }

    var html = '<div class="contract-table-wrapper">';
    html += '<table class="contract-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th onclick="sortContracts(\'contractNumber\')">Contract #</th>';
    html += '<th onclick="sortContracts(\'clientName\')">Client</th>';
    html += '<th onclick="sortContracts(\'type\')">Type</th>';
    html += '<th onclick="sortContracts(\'frequency\')">Frequency</th>';
    html += '<th onclick="sortContracts(\'value\')">Value/Year</th>';
    html += '<th onclick="sortContracts(\'nextService\')">Next Service</th>';
    html += '<th onclick="sortContracts(\'status\')">Status</th>';
    html += '<th>Actions</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    for (var i = 0; i < contracts.length; i++) {
      var contract = contracts[i];
      html += renderContractRow(contract);
    }

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    listContainer.innerHTML = html;
  }

  /**
   * Render contract row
   */
  function renderContractRow(contract) {
    var html = '<tr class="contract-row" data-contract-id="' + contract.id + '">';

    // Contract Number
    html += '<td><a href="#" onclick="viewContractDetails(\'' + contract.id + '\'); return false;">' +
      contract.contractNumber + '</a></td>';

    // Client
    html += '<td>' + window.Security.escapeHTML(contract.client.name) + '</td>';

    // Type
    var contractType = window.ContractTypes.getContractType(contract.type);
    html += '<td>' + (contractType ? contractType.name : contract.type) + '</td>';

    // Frequency
    var freq = window.ContractTypes.getFrequency(contract.type, contract.frequency.id);
    html += '<td>' + (freq ? freq.name : contract.frequency.id) + '</td>';

    // Annual Value
    var annualValue = window.ContractManager.calculateContractValue(contract, 'annual');
    html += '<td>$' + annualValue.toFixed(2) + '</td>';

    // Next Service
    if (contract.nextService && contract.nextService.scheduledDate) {
      var serviceDate = new Date(contract.nextService.scheduledDate);
      var today = new Date();
      var daysUntil = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));

      var dateStr = serviceDate.toLocaleDateString();
      var daysClass = daysUntil <= 3 ? 'text-danger' : (daysUntil <= 7 ? 'text-warning' : '');

      html += '<td class="' + daysClass + '">' + dateStr;
      if (daysUntil >= 0) {
        html += ' (' + daysUntil + 'd)';
      }
      html += '</td>';
    } else {
      html += '<td>-</td>';
    }

    // Status
    html += '<td>' + renderStatusBadge(contract.status) + '</td>';

    // Actions
    html += '<td>';
    html += '<button class="btn-sm btn-secondary" onclick="viewContractDetails(\'' + contract.id + '\')">View</button> ';

    if (contract.status === 'draft' || contract.status === 'pending') {
      html += '<button class="btn-sm btn-success" onclick="activateContract(\'' + contract.id + '\')">Activate</button> ';
    }

    if (contract.status === 'active') {
      html += '<button class="btn-sm btn-primary" onclick="generateServiceQuote(\'' + contract.id + '\')">Quote</button> ';
    }

    html += '</td>';

    html += '</tr>';
    return html;
  }

  /**
   * Render status badge
   */
  function renderStatusBadge(status) {
    var badges = {
      'draft': '<span class="badge badge-secondary">Draft</span>',
      'pending': '<span class="badge badge-warning">Pending</span>',
      'active': '<span class="badge badge-success">Active</span>',
      'suspended': '<span class="badge badge-warning">Suspended</span>',
      'cancelled': '<span class="badge badge-danger">Cancelled</span>',
      'completed': '<span class="badge badge-info">Completed</span>'
    };

    return badges[status] || '<span class="badge badge-secondary">' + status + '</span>';
  }

  /**
   * Sort contracts
   */
  function sortContracts(contracts, sortBy) {
    var sorted = contracts.slice();

    sorted.sort(function(a, b) {
      if (sortBy === 'contractNumber') {
        return a.contractNumber.localeCompare(b.contractNumber);
      } else if (sortBy === 'clientName') {
        return a.client.name.localeCompare(b.client.name);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      } else if (sortBy === 'frequency') {
        return a.frequency.id.localeCompare(b.frequency.id);
      } else if (sortBy === 'value') {
        var valueA = window.ContractManager.calculateContractValue(a, 'annual');
        var valueB = window.ContractManager.calculateContractValue(b, 'annual');
        return valueB - valueA;
      } else if (sortBy === 'nextService') {
        if (!a.nextService || !a.nextService.scheduledDate) return 1;
        if (!b.nextService || !b.nextService.scheduledDate) return -1;
        return new Date(a.nextService.scheduledDate) - new Date(b.nextService.scheduledDate);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return sorted;
  }

  /**
   * Render upcoming services
   */
  function renderUpcomingServices() {
    var upcomingContainer = document.getElementById('upcoming-services');
    if (!upcomingContainer) return;

    var upcoming = window.ContractManager.getUpcomingServices(14); // Next 14 days

    if (upcoming.length === 0) {
      upcomingContainer.innerHTML = '<div class="empty-state">' +
        '<p>No upcoming services in the next 14 days.</p>' +
        '</div>';
      return;
    }

    var html = '<div class="upcoming-services-list">';

    for (var i = 0; i < upcoming.length; i++) {
      var item = upcoming[i];
      var contract = item.contract;

      html += '<div class="upcoming-service-card">';

      // Date
      html += '<div class="service-date">';
      html += '<div class="date-day">' + item.serviceDate.getDate() + '</div>';
      html += '<div class="date-month">' + getMonthShort(item.serviceDate.getMonth()) + '</div>';
      html += '</div>';

      // Details
      html += '<div class="service-details">';
      html += '<h4>' + window.Security.escapeHTML(contract.client.name) + '</h4>';
      html += '<p>' + contract.category + ' - ' + contract.contractNumber + '</p>';
      html += '<p class="text-muted">' + window.Security.escapeHTML(contract.client.address) + '</p>';
      html += '</div>';

      // Actions
      html += '<div class="service-actions">';

      if (!item.quoteGenerated) {
        html += '<button class="btn-sm btn-primary" onclick="generateServiceQuote(\'' + contract.id + '\')">Generate Quote</button>';
      } else {
        html += '<button class="btn-sm btn-secondary" onclick="viewQuote(\'' + contract.nextService.quoteId + '\')">View Quote</button>';
      }

      if (!item.confirmed) {
        html += '<button class="btn-sm btn-success" onclick="confirmService(\'' + contract.id + '\')">Confirm</button>';
      } else {
        html += '<span class="badge badge-success">Confirmed</span>';
      }

      html += '</div>';

      html += '</div>';
    }

    html += '</div>';

    upcomingContainer.innerHTML = html;
  }

  /**
   * Get month abbreviation
   */
  function getMonthShort(month) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  }

  /**
   * Filter contracts
   */
  function filterContracts(status) {
    currentFilter = status;
    renderContractList();

    // Update filter buttons
    var filterButtons = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < filterButtons.length; i++) {
      filterButtons[i].classList.remove('active');
    }

    var activeButton = document.querySelector('.filter-btn[data-filter="' + status + '"]');
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  /**
   * Sort contract list
   */
  function setSortOrder(sortBy) {
    currentSort = sortBy;
    renderContractList();
  }

  /**
   * View contract details
   */
  function viewContractDetails(contractId) {
    // Navigate to contract details page
    if (typeof navigateTo === 'function') {
      navigateTo('contract-details', { contractId: contractId });
    }
  }

  /**
   * Activate contract
   */
  function activateContract(contractId) {
    var confirmed = confirm('Activate this contract?');
    if (!confirmed) return;

    var success = window.ContractManager.updateContractStatus(contractId, 'active');

    if (success) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract activated', 'success');
      } else {
        alert('Contract activated');
      }
      renderDashboard();
    }
  }

  /**
   * Generate service quote
   */
  function generateServiceQuote(contractId) {
    var contract = window.ContractManager.getContract(contractId);
    if (!contract) return;

    // Create quote from contract
    if (window.APP && window.APP.setState) {
      // Create quote state from contract
      var quoteState = {
        quoteTitle: 'Service Quote - ' + contract.contractNumber,
        clientName: contract.client.name,
        clientLocation: contract.client.address,
        clientEmail: contract.client.email,
        clientPhone: contract.client.phone,
        baseFee: 0,
        hourlyRate: 95,
        minimumJob: 0,
        windowLines: [],
        pressureLines: [],
        internalNotes: 'Contract: ' + contract.contractNumber,
        clientNotes: '',
        contractId: contract.id,
        isRecurring: true
      };

      // Add services as line items
      for (var i = 0; i < contract.services.length; i++) {
        var service = contract.services[i];

        if (contract.category === 'windows') {
          quoteState.windowLines.push({
            id: 'win_' + Date.now() + '_' + i,
            type: 'standard',
            quantity: service.quantity,
            insidePanes: service.quantity,
            outsidePanes: service.quantity,
            highReach: false,
            notes: service.description
          });
        } else if (contract.category === 'pressure-washing') {
          quoteState.pressureLines.push({
            id: 'press_' + Date.now() + '_' + i,
            surface: 'concrete',
            area: service.quantity,
            unit: 'sqm',
            notes: service.description
          });
        }
      }

      // Set state and navigate
      window.APP.setState(quoteState);
      window.APP.recalculate();

      if (window.UIComponents) {
        window.UIComponents.showToast('Quote generated from contract', 'success');
      }

      // Navigate to quote page
      if (typeof navigateTo === 'function') {
        navigateTo('quote');
      }
    }
  }

  /**
   * Confirm service
   */
  function confirmService(contractId) {
    var contract = window.ContractManager.getContract(contractId);
    if (!contract) return;

    contract.nextService.confirmed = true;
    window.ContractManager.saveContract(contract);

    if (window.UIComponents) {
      window.UIComponents.showToast('Service confirmed', 'success');
    } else {
      alert('Service confirmed');
    }

    renderUpcomingServices();
  }

  /**
   * View quote
   */
  function viewQuote(quoteId) {
    // Navigate to quote
    if (typeof navigateTo === 'function') {
      navigateTo('quote', { quoteId: quoteId });
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractDashboard', {
      renderDashboard: renderDashboard,
      filterContracts: filterContracts,
      setSortOrder: setSortOrder
    });
  }

  // Make functions globally available
  window.renderContractDashboard = renderDashboard;
  window.filterContracts = filterContracts;
  window.sortContractsBy = setSortOrder;
  window.viewContractDetails = viewContractDetails;
  window.activateContract = activateContract;
  window.generateServiceQuote = generateServiceQuote;
  window.confirmService = confirmService;
  window.viewQuote = viewQuote;

  console.log('[CONTRACT-DASHBOARD] Module loaded');
})();
