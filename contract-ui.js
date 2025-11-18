// contract-ui.js - Contract creation wizard and UI logic
// Dependencies: contract-manager.js, contract-types.js, client-database.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var currentStep = 1;
  var contractData = {};

  /**
   * Initialize contract UI
   */
  function init() {
    console.log('[CONTRACT-UI] Initializing...');

    // Set up event listeners
    setupEventListeners();

    // Set default start date to today
    var today = new Date().toISOString().split('T')[0];
    var startDateInput = document.getElementById('contract-start-date');
    if (startDateInput) {
      startDateInput.value = today;
    }

    console.log('[CONTRACT-UI] Initialized');
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Payment method change
    var paymentMethodSelect = document.getElementById('contract-payment-method');
    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener('change', function() {
        updateContractPricing();
      });
    }

    // Duration change
    var durationSelect = document.getElementById('contract-duration');
    if (durationSelect) {
      durationSelect.addEventListener('change', function() {
        updateContractPricing();
      });
    }
  }

  /**
   * Select contract type
   */
  function selectContractType(typeId) {
    contractData.type = typeId;

    // Update frequency options
    populateFrequencies(typeId);

    // Show next step
    contractWizardNext(1);
  }

  /**
   * Populate frequency options
   */
  function populateFrequencies(typeId) {
    var frequencySelect = document.getElementById('contract-frequency');
    if (!frequencySelect) return;

    frequencySelect.innerHTML = '';

    var frequencies = window.ContractTypes.getFrequenciesForType(typeId);
    for (var i = 0; i < frequencies.length; i++) {
      var freq = frequencies[i];
      var option = document.createElement('option');
      option.value = freq.id;
      option.textContent = freq.name + ' (' + freq.discount + '% discount)';
      frequencySelect.appendChild(option);
    }
  }

  /**
   * Populate client dropdown
   */
  function populateClientDropdown() {
    var clientSelect = document.getElementById('contract-client-select');
    if (!clientSelect) return;

    clientSelect.innerHTML = '<option value="">-- Select Client --</option>';

    if (window.ClientDatabase) {
      var clients = window.ClientDatabase.getAllClients();
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        var option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name + ' - ' + client.address;
        clientSelect.appendChild(option);
      }
    }
  }

  /**
   * Load client details
   */
  function loadClientDetails(clientId) {
    if (!clientId) {
      // Clear form
      document.getElementById('contract-client-name').value = '';
      document.getElementById('contract-client-phone').value = '';
      document.getElementById('contract-client-email').value = '';
      document.getElementById('contract-client-address').value = '';
      return;
    }

    if (window.ClientDatabase) {
      var client = window.ClientDatabase.getClient(clientId);
      if (client) {
        document.getElementById('contract-client-name').value = client.name || '';
        document.getElementById('contract-client-phone').value = client.phone || '';
        document.getElementById('contract-client-email').value = client.email || '';
        document.getElementById('contract-client-address').value = client.address || '';

        contractData.client = {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address
        };
      }
    }
  }

  /**
   * Wizard navigation - Next
   */
  function contractWizardNext(step) {
    // Validate current step
    if (!validateStep(step)) {
      return;
    }

    // Collect data from current step
    collectStepData(step);

    // Hide current step
    var currentStepEl = document.getElementById('contract-step-' + step);
    if (currentStepEl) {
      currentStepEl.style.display = 'none';
    }

    // Show next step
    var nextStep = step + 1;
    var nextStepEl = document.getElementById('contract-step-' + nextStep);
    if (nextStepEl) {
      nextStepEl.style.display = 'block';
      currentStep = nextStep;

      // Populate step-specific data
      if (nextStep === 2) {
        populateClientDropdown();
      } else if (nextStep === 6) {
        renderContractReview();
      }

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }

  /**
   * Wizard navigation - Back
   */
  function contractWizardBack(step) {
    // Hide current step
    var currentStepEl = document.getElementById('contract-step-' + step);
    if (currentStepEl) {
      currentStepEl.style.display = 'none';
    }

    // Show previous step
    var prevStep = step - 1;
    var prevStepEl = document.getElementById('contract-step-' + prevStep);
    if (prevStepEl) {
      prevStepEl.style.display = 'block';
      currentStep = prevStep;

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }

  /**
   * Validate step
   */
  function validateStep(step) {
    if (step === 1) {
      if (!contractData.type) {
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
      if (!contractData.services || contractData.services.length === 0) {
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
   * Collect step data
   */
  function collectStepData(step) {
    if (step === 2) {
      // Client data
      var clientId = document.getElementById('contract-client-select').value;
      contractData.client = {
        id: clientId || null,
        name: document.getElementById('contract-client-name').value.trim(),
        email: document.getElementById('contract-client-email').value.trim(),
        phone: document.getElementById('contract-client-phone').value.trim(),
        address: document.getElementById('contract-client-address').value.trim()
      };
    } else if (step === 3) {
      // Service and pricing data
      contractData.category = document.getElementById('contract-category').value;
      contractData.frequency = {
        id: document.getElementById('contract-frequency').value
      };

      // Get frequency details
      var freq = window.ContractTypes.getFrequency(contractData.type, contractData.frequency.id);
      if (freq) {
        contractData.frequency.interval = freq.interval;
        contractData.frequency.unit = freq.unit;
      }
    } else if (step === 4) {
      // Contract terms
      contractData.terms = {
        startDate: document.getElementById('contract-start-date').value,
        duration: parseInt(document.getElementById('contract-duration').value),
        autoRenew: document.getElementById('contract-auto-renew').checked
      };

      contractData.payment = {
        method: document.getElementById('contract-payment-method').value,
        terms: document.getElementById('contract-payment-terms').value
      };

      var noticePeriod = document.getElementById('contract-notice-period').value;
      contractData.terms.noticePeriod = parseInt(noticePeriod);
    } else if (step === 5) {
      // Schedule preferences
      var preferredDay = document.getElementById('contract-preferred-day').value;
      contractData.schedule = {
        preferredDay: preferredDay ? parseInt(preferredDay) : null,
        preferredTime: document.getElementById('contract-preferred-time').value,
        flexible: document.getElementById('contract-flexible').checked
      };

      contractData.notes = document.getElementById('contract-notes').value.trim();
    }
  }

  /**
   * Add contract service
   */
  function addContractService() {
    var servicesList = document.getElementById('contract-services-list');
    if (!servicesList) return;

    var serviceId = 'service-' + Date.now();
    var serviceHtml = '<div class="contract-service-item" id="' + serviceId + '">' +
      '<div class="form-row">' +
        '<div class="form-group" style="flex: 2;">' +
          '<label>Description</label>' +
          '<input type="text" class="form-control service-description" placeholder="e.g., Window cleaning - full property">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Quantity</label>' +
          '<input type="number" class="form-control service-quantity" value="1" min="1">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Unit Price</label>' +
          '<input type="number" class="form-control service-price" value="0" min="0" step="0.01">' +
        '</div>' +
        '<div class="form-group" style="flex: 0;">' +
          '<label>&nbsp;</label>' +
          '<button type="button" class="btn-danger" onclick="removeContractService(\'' + serviceId + '\')">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Specifications (optional)</label>' +
        '<textarea class="form-control service-specifications" rows="2" placeholder="Details about this service..."></textarea>' +
      '</div>' +
    '</div>';

    servicesList.insertAdjacentHTML('beforeend', serviceHtml);

    // Add change listeners
    var serviceItem = document.getElementById(serviceId);
    var inputs = serviceItem.querySelectorAll('.service-quantity, .service-price');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('change', updateContractPricing);
    }
  }

  /**
   * Remove contract service
   */
  function removeContractService(serviceId) {
    var serviceItem = document.getElementById(serviceId);
    if (serviceItem) {
      serviceItem.remove();
      updateContractPricing();
    }
  }

  /**
   * Update contract pricing
   */
  function updateContractPricing() {
    // Collect all services
    var services = [];
    var serviceItems = document.querySelectorAll('.contract-service-item');

    for (var i = 0; i < serviceItems.length; i++) {
      var item = serviceItems[i];
      var description = item.querySelector('.service-description').value;
      var quantity = parseFloat(item.querySelector('.service-quantity').value) || 0;
      var unitPrice = parseFloat(item.querySelector('.service-price').value) || 0;
      var specifications = item.querySelector('.service-specifications').value;

      services.push({
        description: description,
        specifications: specifications,
        quantity: quantity,
        unitPrice: unitPrice
      });
    }

    contractData.services = services;

    // Create temporary contract for pricing calculation
    var tempContract = {
      type: contractData.type,
      services: services,
      frequency: contractData.frequency,
      terms: contractData.terms || { duration: 12 },
      payment: contractData.payment || { method: 'invoice' }
    };

    // Calculate pricing
    var pricing = window.ContractManager.calculateContractPricing(tempContract);

    // Update display
    document.getElementById('contract-base-price').textContent = '$' + pricing.basePrice.toFixed(2);
    document.getElementById('contract-discounts').textContent = '-$' + pricing.totalDiscount.toFixed(2);
    document.getElementById('contract-subtotal').textContent = '$' + pricing.subtotal.toFixed(2);
    document.getElementById('contract-gst').textContent = '$' + pricing.gst.toFixed(2);
    document.getElementById('contract-total').textContent = '$' + pricing.total.toFixed(2);

    // Calculate annual value
    var annualValue = window.ContractManager.calculateContractValue(tempContract, 'annual');
    document.getElementById('contract-annual-value').textContent = '$' + annualValue.toFixed(2);
  }

  /**
   * Render contract review
   */
  function renderContractReview() {
    var reviewEl = document.getElementById('contract-review-summary');
    if (!reviewEl) return;

    var html = '';

    // Client Information
    html += '<div class="review-section">';
    html += '<h4>Client Information</h4>';
    html += '<p><strong>Name:</strong> ' + (contractData.client.name || '') + '</p>';
    html += '<p><strong>Phone:</strong> ' + (contractData.client.phone || '') + '</p>';
    html += '<p><strong>Email:</strong> ' + (contractData.client.email || '') + '</p>';
    html += '<p><strong>Address:</strong> ' + (contractData.client.address || '') + '</p>';
    html += '</div>';

    // Contract Details
    html += '<div class="review-section">';
    html += '<h4>Contract Details</h4>';
    var contractType = window.ContractTypes.getContractType(contractData.type);
    html += '<p><strong>Type:</strong> ' + (contractType ? contractType.name : '') + '</p>';
    html += '<p><strong>Category:</strong> ' + (contractData.category || '') + '</p>';

    var freq = window.ContractTypes.getFrequency(contractData.type, contractData.frequency.id);
    html += '<p><strong>Frequency:</strong> ' + (freq ? freq.name : '') + '</p>';
    html += '</div>';

    // Services
    html += '<div class="review-section">';
    html += '<h4>Services Included</h4>';
    html += '<table class="table">';
    html += '<thead><tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>';
    html += '<tbody>';
    for (var i = 0; i < contractData.services.length; i++) {
      var service = contractData.services[i];
      var total = service.quantity * service.unitPrice;
      html += '<tr>';
      html += '<td>' + service.description + '</td>';
      html += '<td>' + service.quantity + '</td>';
      html += '<td>$' + service.unitPrice.toFixed(2) + '</td>';
      html += '<td>$' + total.toFixed(2) + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '</div>';

    // Terms
    html += '<div class="review-section">';
    html += '<h4>Contract Terms</h4>';
    html += '<p><strong>Start Date:</strong> ' + (contractData.terms.startDate || '') + '</p>';
    html += '<p><strong>Duration:</strong> ' + (contractData.terms.duration || 0) + ' months</p>';
    html += '<p><strong>Auto-Renew:</strong> ' + (contractData.terms.autoRenew ? 'Yes' : 'No') + '</p>';
    html += '<p><strong>Payment Method:</strong> ' + (contractData.payment.method || '') + '</p>';
    html += '<p><strong>Payment Terms:</strong> ' + (contractData.payment.terms || '') + '</p>';
    html += '<p><strong>Notice Period:</strong> ' + (contractData.terms.noticePeriod || 0) + ' days</p>';
    html += '</div>';

    reviewEl.innerHTML = html;
  }

  /**
   * Save contract as draft
   */
  function saveContractDraft() {
    collectStepData(currentStep);

    contractData.status = 'draft';

    var contract = window.ContractManager.createContract(contractData);

    if (window.UIComponents) {
      window.UIComponents.showToast('Contract saved as draft', 'success');
    } else {
      alert('Contract saved as draft');
    }

    // Navigate to contracts list
    setTimeout(function() {
      navigateTo('contracts');
    }, 1000);
  }

  /**
   * Create contract final
   */
  function createContractFinal() {
    collectStepData(currentStep);

    contractData.status = 'pending'; // Pending client signature

    var contract = window.ContractManager.createContract(contractData);

    if (window.UIComponents) {
      window.UIComponents.showToast('Contract created successfully!', 'success');
    } else {
      alert('Contract created successfully!');
    }

    // Reset wizard
    resetWizard();

    // Navigate to contract details
    setTimeout(function() {
      viewContract(contract.id);
    }, 1000);
  }

  /**
   * Reset wizard
   */
  function resetWizard() {
    currentStep = 1;
    contractData = {};

    // Hide all steps
    for (var i = 1; i <= 6; i++) {
      var stepEl = document.getElementById('contract-step-' + i);
      if (stepEl) {
        stepEl.style.display = i === 1 ? 'block' : 'none';
      }
    }

    // Clear forms
    var forms = document.querySelectorAll('#page-new-contract input, #page-new-contract select, #page-new-contract textarea');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].type === 'checkbox') {
        forms[i].checked = false;
      } else {
        forms[i].value = '';
      }
    }

    // Clear services list
    var servicesList = document.getElementById('contract-services-list');
    if (servicesList) {
      servicesList.innerHTML = '';
    }
  }

  /**
   * View contract details
   */
  function viewContract(contractId) {
    // Navigate to contract details page
    if (typeof navigateTo === 'function') {
      navigateTo('contract-details', { contractId: contractId });
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Make functions globally available
  window.selectContractType = selectContractType;
  window.loadClientDetails = loadClientDetails;
  window.contractWizardNext = contractWizardNext;
  window.contractWizardBack = contractWizardBack;
  window.addContractService = addContractService;
  window.removeContractService = removeContractService;
  window.updateContractPricing = updateContractPricing;
  window.saveContractDraft = saveContractDraft;
  window.createContractFinal = createContractFinal;
  window.viewContract = viewContract;

  console.log('[CONTRACT-UI] Module loaded');
})();
