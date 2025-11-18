// contract-wizard.js - Contract Creation Wizard
// Dependencies: contract-manager.js, client-database.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var _currentStep = 1;
  var _contractData = {};

  /**
   * Initialize wizard
   */
  function init() {
    _currentStep = 1;
    _contractData = {
      type: null,
      client: {},
      services: [],
      category: 'windows',
      frequency: {},
      terms: {},
      schedule: {},
      payment: {}
    };

    showStep(1);
    populateClientDropdown();

    console.log('[CONTRACT-WIZARD] Initialized');
  }

  /**
   * Select contract type
   */
  function selectContractType(type) {
    _contractData.type = type;

    // Highlight selected card
    var cards = document.querySelectorAll('.contract-type-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('selected');
    }

    if (event && event.currentTarget) {
      event.currentTarget.classList.add('selected');
    }

    // Enable next button
    var nextBtn = document.getElementById('contract-step1-next');
    if (nextBtn) {
      nextBtn.disabled = false;
    }

    console.log('[CONTRACT-WIZARD] Type selected:', type);
  }

  /**
   * Populate client dropdown
   */
  function populateClientDropdown() {
    var select = document.getElementById('contract-client-select');
    if (!select) return;

    var clients = window.ClientDatabase ? window.ClientDatabase.getAllClients() : [];

    select.innerHTML = '<option value="">-- Select Existing Client --</option>';

    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      var option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name + ' - ' + client.address;
      select.appendChild(option);
    }
  }

  /**
   * Load client details
   */
  function loadClientDetails(clientId) {
    if (!clientId) {
      clearClientForm();
      return;
    }

    if (!window.ClientDatabase) {
      console.warn('[CONTRACT-WIZARD] ClientDatabase not available');
      return;
    }

    var client = window.ClientDatabase.getClient(clientId);
    if (!client) return;

    document.getElementById('contract-client-name').value = client.name || '';
    document.getElementById('contract-client-phone').value = client.phone || '';
    document.getElementById('contract-client-email').value = client.email || '';
    document.getElementById('contract-client-address').value = client.address || '';

    // Disable form fields
    document.getElementById('contract-client-name').disabled = true;
    document.getElementById('contract-client-phone').disabled = true;
    document.getElementById('contract-client-email').disabled = true;
    document.getElementById('contract-client-address').disabled = true;
  }

  /**
   * Clear client form
   */
  function clearClientForm() {
    document.getElementById('contract-client-name').value = '';
    document.getElementById('contract-client-phone').value = '';
    document.getElementById('contract-client-email').value = '';
    document.getElementById('contract-client-address').value = '';

    document.getElementById('contract-client-name').disabled = false;
    document.getElementById('contract-client-phone').disabled = false;
    document.getElementById('contract-client-email').disabled = false;
    document.getElementById('contract-client-address').disabled = false;
  }

  /**
   * Wizard navigation - Next
   */
  function wizardNext(step) {
    // Validate current step
    if (!validateStep(step)) {
      return;
    }

    // Save step data
    saveStepData(step);

    // Move to next step
    _currentStep = step + 1;
    showStep(_currentStep);

    // Initialize next step
    initializeStep(_currentStep);
  }

  /**
   * Wizard navigation - Back
   */
  function wizardBack(step) {
    _currentStep = step - 1;
    showStep(_currentStep);
  }

  /**
   * Show specific step
   */
  function showStep(step) {
    // Hide all steps
    var steps = document.querySelectorAll('.wizard-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].style.display = 'none';
    }

    // Show current step
    var currentStepEl = document.getElementById('contract-step-' + step);
    if (currentStepEl) {
      currentStepEl.style.display = 'block';
    }

    // Update progress indicator
    updateProgressIndicator(step);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  /**
   * Update progress indicator
   */
  function updateProgressIndicator(step) {
    var steps = document.querySelectorAll('.wizard-progress-step');
    for (var i = 0; i < steps.length; i++) {
      var stepNum = i + 1;
      if (stepNum < step) {
        steps[i].classList.add('completed');
        steps[i].classList.remove('active');
      } else if (stepNum === step) {
        steps[i].classList.add('active');
        steps[i].classList.remove('completed');
      } else {
        steps[i].classList.remove('active', 'completed');
      }
    }
  }

  /**
   * Validate step
   */
  function validateStep(step) {
    if (step === 1) {
      if (!_contractData.type) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Please select a contract type', 'error');
        } else {
          alert('Please select a contract type');
        }
        return false;
      }
    } else if (step === 2) {
      var name = document.getElementById('contract-client-name').value.trim();
      var phone = document.getElementById('contract-client-phone').value.trim();
      var address = document.getElementById('contract-client-address').value.trim();

      if (!name || !phone || !address) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Please fill in all required client fields', 'error');
        } else {
          alert('Please fill in all required client fields');
        }
        return false;
      }
    } else if (step === 3) {
      if (_contractData.services.length === 0) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Please add at least one service', 'error');
        } else {
          alert('Please add at least one service');
        }
        return false;
      }
    } else if (step === 4) {
      var startDate = document.getElementById('contract-start-date').value;
      if (!startDate) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Please select a start date', 'error');
        } else {
          alert('Please select a start date');
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Save step data
   */
  function saveStepData(step) {
    if (step === 2) {
      // Save client data
      var clientId = document.getElementById('contract-client-select').value;

      if (clientId && window.ClientDatabase) {
        // Existing client
        _contractData.client = window.ClientDatabase.getClient(clientId);
      } else {
        // New client
        _contractData.client = {
          id: null,
          name: document.getElementById('contract-client-name').value.trim(),
          phone: document.getElementById('contract-client-phone').value.trim(),
          email: document.getElementById('contract-client-email').value.trim(),
          address: document.getElementById('contract-client-address').value.trim()
        };

        // Save new client if ClientDatabase available
        if (window.ClientDatabase) {
          var savedClient = window.ClientDatabase.saveClient(_contractData.client);
          _contractData.client.id = savedClient.id;
        }
      }
    } else if (step === 3) {
      // Save services and frequency
      _contractData.category = document.getElementById('contract-category').value;

      var freqSelect = document.getElementById('contract-frequency');
      if (freqSelect && freqSelect.selectedIndex >= 0) {
        var freqOption = freqSelect.options[freqSelect.selectedIndex];
        _contractData.frequency = {
          id: freqOption.value,
          interval: parseInt(freqOption.getAttribute('data-interval') || '1'),
          unit: freqOption.getAttribute('data-unit') || 'month'
        };
      }
    } else if (step === 4) {
      // Save terms
      var duration = parseInt(document.getElementById('contract-duration').value || '12');
      var startDate = document.getElementById('contract-start-date').value;

      _contractData.terms = {
        startDate: startDate,
        duration: duration,
        autoRenew: document.getElementById('contract-auto-renew').checked,
        noticePeriod: parseInt(document.getElementById('contract-notice-period').value || '30')
      };

      // Calculate end date if not ongoing
      if (duration > 0) {
        var endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        _contractData.terms.endDate = endDate.toISOString().split('T')[0];
      }

      _contractData.payment = {
        method: document.getElementById('contract-payment-method').value,
        terms: document.getElementById('contract-payment-terms').value
      };
    } else if (step === 5) {
      // Save schedule preferences
      var preferredDay = document.getElementById('contract-preferred-day').value;

      _contractData.schedule = {
        preferredDay: preferredDay ? parseInt(preferredDay) : null,
        preferredTime: document.getElementById('contract-preferred-time').value,
        flexible: document.getElementById('contract-flexible').checked
      };

      _contractData.notes = document.getElementById('contract-notes').value.trim();
    }
  }

  /**
   * Initialize step
   */
  function initializeStep(step) {
    if (step === 3) {
      // Populate frequency options based on contract type
      populateFrequencyOptions();
    } else if (step === 4) {
      // Set default start date to next week
      var nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      var startDateInput = document.getElementById('contract-start-date');
      if (startDateInput) {
        startDateInput.value = nextWeek.toISOString().split('T')[0];
      }
    } else if (step === 6) {
      // Generate review summary
      generateReviewSummary();
    }
  }

  /**
   * Populate frequency options
   */
  function populateFrequencyOptions() {
    var select = document.getElementById('contract-frequency');
    if (!select) return;

    select.innerHTML = '';

    if (!window.ContractManager) {
      console.warn('[CONTRACT-WIZARD] ContractManager not available');
      return;
    }

    var contractType = window.ContractManager.CONTRACT_TYPES[_contractData.type];
    if (!contractType) return;

    for (var i = 0; i < contractType.frequencies.length; i++) {
      var freq = contractType.frequencies[i];
      var option = document.createElement('option');
      option.value = freq.id;
      option.textContent = freq.name + ' (' + freq.discount + '% discount)';
      option.setAttribute('data-interval', freq.interval);
      option.setAttribute('data-unit', freq.unit);
      select.appendChild(option);
    }
  }

  /**
   * Add service to contract
   */
  function addContractService() {
    var description = prompt('Service Description:');
    if (!description) return;

    var priceStr = prompt('Price per service:');
    if (!priceStr) return;

    var price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      alert('Invalid price');
      return;
    }

    var service = {
      description: description,
      specifications: '',
      unitPrice: price,
      quantity: 1
    };

    _contractData.services.push(service);
    renderServicesList();
    updateContractPricing();
  }

  /**
   * Remove service from contract
   */
  function removeContractService(index) {
    _contractData.services.splice(index, 1);
    renderServicesList();
    updateContractPricing();
  }

  /**
   * Render services list
   */
  function renderServicesList() {
    var container = document.getElementById('contract-services-list');
    if (!container) return;

    if (_contractData.services.length === 0) {
      container.innerHTML = '<p class="text-muted">No services added yet</p>';
      return;
    }

    var html = '<div class="services-list">';

    for (var i = 0; i < _contractData.services.length; i++) {
      var service = _contractData.services[i];
      html += '<div class="service-item">';
      html += '<div class="service-description">' + window.Security.escapeHTML(service.description) + '</div>';
      html += '<div class="service-price">$' + service.unitPrice.toFixed(2) + '</div>';
      html += '<button class="btn btn-danger btn-sm" onclick="ContractWizard.removeService(' + i + ')">Remove</button>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Update contract pricing display
   */
  function updateContractPricing() {
    if (!window.ContractManager) return;

    // Create temporary contract for pricing calculation
    var tempContract = {
      type: _contractData.type,
      services: _contractData.services,
      frequency: _contractData.frequency,
      terms: _contractData.terms,
      payment: _contractData.payment
    };

    var pricing = window.ContractManager.calculateContractPricing(tempContract);

    // Update display
    var basePriceEl = document.getElementById('contract-base-price');
    var discountsEl = document.getElementById('contract-discounts');
    var subtotalEl = document.getElementById('contract-subtotal');
    var gstEl = document.getElementById('contract-gst');
    var totalEl = document.getElementById('contract-total');

    if (basePriceEl) basePriceEl.textContent = '$' + pricing.basePrice.toFixed(2);
    if (discountsEl) discountsEl.textContent = '-$' + pricing.discountAmount.toFixed(2);
    if (subtotalEl) subtotalEl.textContent = '$' + pricing.subtotal.toFixed(2);
    if (gstEl) gstEl.textContent = '$' + pricing.gst.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + pricing.total.toFixed(2);

    // Calculate annual value
    var annualValue = window.ContractManager.calculateContractValue(tempContract, 'annual');
    var annualValueEl = document.getElementById('contract-annual-value');
    if (annualValueEl) annualValueEl.textContent = '$' + annualValue.toFixed(2);
  }

  /**
   * Generate review summary
   */
  function generateReviewSummary() {
    var container = document.getElementById('contract-review-summary');
    if (!container) return;

    if (!window.ContractManager) return;

    // Create temporary contract for final pricing
    var tempContract = {
      type: _contractData.type,
      services: _contractData.services,
      frequency: _contractData.frequency,
      terms: _contractData.terms,
      payment: _contractData.payment
    };

    var pricing = window.ContractManager.calculateContractPricing(tempContract);
    var annualValue = window.ContractManager.calculateContractValue(tempContract, 'annual');

    var html = '<div class="contract-review">';

    // Client info
    html += '<section class="review-section">';
    html += '<h4>Client Information</h4>';
    html += '<p><strong>Name:</strong> ' + window.Security.escapeHTML(_contractData.client.name) + '</p>';
    html += '<p><strong>Phone:</strong> ' + window.Security.escapeHTML(_contractData.client.phone) + '</p>';
    html += '<p><strong>Email:</strong> ' + window.Security.escapeHTML(_contractData.client.email || 'N/A') + '</p>';
    html += '<p><strong>Address:</strong> ' + window.Security.escapeHTML(_contractData.client.address) + '</p>';
    html += '</section>';

    // Contract details
    html += '<section class="review-section">';
    html += '<h4>Contract Details</h4>';
    html += '<p><strong>Type:</strong> ' + _contractData.type + '</p>';
    html += '<p><strong>Category:</strong> ' + _contractData.category + '</p>';
    html += '<p><strong>Frequency:</strong> ' + _contractData.frequency.id + '</p>';
    html += '</section>';

    // Services
    html += '<section class="review-section">';
    html += '<h4>Services</h4>';
    html += '<ul>';
    for (var i = 0; i < _contractData.services.length; i++) {
      var service = _contractData.services[i];
      html += '<li>' + window.Security.escapeHTML(service.description) + ' - $' + service.unitPrice.toFixed(2) + '</li>';
    }
    html += '</ul>';
    html += '</section>';

    // Pricing
    html += '<section class="review-section">';
    html += '<h4>Pricing</h4>';
    html += '<table class="pricing-table">';
    html += '<tr><td>Base Price:</td><td>$' + pricing.basePrice.toFixed(2) + '</td></tr>';
    html += '<tr><td>Discounts:</td><td>-$' + pricing.discountAmount.toFixed(2) + '</td></tr>';
    html += '<tr><td>Subtotal:</td><td>$' + pricing.subtotal.toFixed(2) + '</td></tr>';
    html += '<tr><td>GST:</td><td>$' + pricing.gst.toFixed(2) + '</td></tr>';
    html += '<tr class="total-row"><td><strong>Total per Service:</strong></td><td><strong>$' + pricing.total.toFixed(2) + '</strong></td></tr>';
    html += '<tr class="highlight-row"><td><strong>Annual Value:</strong></td><td><strong>$' + annualValue.toFixed(2) + '</strong></td></tr>';
    html += '</table>';
    html += '</section>';

    // Terms
    html += '<section class="review-section">';
    html += '<h4>Contract Terms</h4>';
    html += '<p><strong>Start Date:</strong> ' + new Date(_contractData.terms.startDate).toLocaleDateString() + '</p>';
    html += '<p><strong>Duration:</strong> ' + (_contractData.terms.duration > 0 ? _contractData.terms.duration + ' months' : 'Ongoing') + '</p>';
    html += '<p><strong>Auto-Renew:</strong> ' + (_contractData.terms.autoRenew ? 'Yes' : 'No') + '</p>';
    html += '<p><strong>Payment Method:</strong> ' + _contractData.payment.method + '</p>';
    html += '<p><strong>Payment Terms:</strong> ' + _contractData.payment.terms + '</p>';
    html += '</section>';

    html += '</div>';

    container.innerHTML = html;
  }

  /**
   * Save contract as draft
   */
  function saveContractDraft() {
    if (!window.ContractManager) {
      console.error('[CONTRACT-WIZARD] ContractManager not available');
      return;
    }

    _contractData.status = 'draft';
    var contract = window.ContractManager.createContract(_contractData);

    if (window.UIComponents) {
      window.UIComponents.showToast('Contract saved as draft', 'success');
    }

    // Navigate to contracts page
    if (window.navigateTo) {
      window.navigateTo('contracts');
    }
  }

  /**
   * Create final contract
   */
  function createContractFinal() {
    if (!window.ContractManager) {
      console.error('[CONTRACT-WIZARD] ContractManager not available');
      return;
    }

    _contractData.status = 'pending';
    var contract = window.ContractManager.createContract(_contractData);

    if (window.UIComponents) {
      window.UIComponents.showToast('Contract created successfully!', 'success');
    }

    // Navigate to contracts page
    if (window.navigateTo) {
      window.navigateTo('contracts');
    }
  }

  // Public API
  var ContractWizard = {
    init: init,
    selectContractType: selectContractType,
    loadClientDetails: loadClientDetails,
    wizardNext: wizardNext,
    wizardBack: wizardBack,
    addService: addContractService,
    removeService: removeContractService,
    updatePricing: updateContractPricing,
    saveDraft: saveContractDraft,
    createFinal: createContractFinal
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractWizard', ContractWizard);
  }

  // Make globally available
  window.ContractWizard = ContractWizard;

  console.log('[CONTRACT-WIZARD] Module loaded');
})();

// Global functions for UI compatibility
function selectContractType(type) {
  if (window.ContractWizard) {
    window.ContractWizard.selectContractType(type);
  }
}

function loadClientDetails(clientId) {
  if (window.ContractWizard) {
    window.ContractWizard.loadClientDetails(clientId);
  }
}

function contractWizardNext(step) {
  if (window.ContractWizard) {
    window.ContractWizard.wizardNext(step);
  }
}

function contractWizardBack(step) {
  if (window.ContractWizard) {
    window.ContractWizard.wizardBack(step);
  }
}

function addContractService() {
  if (window.ContractWizard) {
    window.ContractWizard.addService();
  }
}

function updateContractPricing() {
  if (window.ContractWizard) {
    window.ContractWizard.updatePricing();
  }
}

function saveContractDraft() {
  if (window.ContractWizard) {
    window.ContractWizard.saveDraft();
  }
}

function createContractFinal() {
  if (window.ContractWizard) {
    window.ContractWizard.createFinal();
  }
}
