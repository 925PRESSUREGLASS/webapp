// contract-wizard.js - Contract Creation Wizard
// Dependencies: contract-manager.js, client-database.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[CONTRACT-WIZARD] Skipped in test mode');
    return;
  }

  // Wizard state
  var _currentStep = 1;
  var _editMode = false;
  var _editContractId = null;
  var _contractData = {};

  /**
   * Initialize wizard (for new contracts)
   */
  function init() {
    _currentStep = 1;
    _editMode = false;
    _editContractId = null;
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

    // Update modal title
    var titleEl = document.getElementById('contract-wizard-title');
    if (titleEl) {
      titleEl.textContent = 'New Contract';
    }

    showStep(1);
    populateClientDropdown();
    setupRealtimeValidation();

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
   * Validate step with comprehensive checks
   */
  function validateStep(step) {
    clearValidationErrors();

    if (step === 1) {
      // Step 1: Contract Type
      if (!_contractData.type) {
        showValidationError('Please select a contract type');
        return false;
      }
    } else if (step === 2) {
      // Step 2: Client Information
      var name = document.getElementById('contract-client-name').value.trim();
      var phone = document.getElementById('contract-client-phone').value.trim();
      var email = document.getElementById('contract-client-email').value.trim();
      var address = document.getElementById('contract-client-address').value.trim();

      // Name validation
      if (!name || name.length < 2) {
        showValidationError('Client name is required (minimum 2 characters)');
        highlightField('contract-client-name', true);
        return false;
      }

      // Phone validation (Australian format: 10 digits)
      var phoneClean = phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneClean || phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
        showValidationError('Phone number must be 10 digits (e.g., 0400 000 000)');
        highlightField('contract-client-phone', true);
        return false;
      }

      // Email validation (optional but must be valid if provided)
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showValidationError('Please enter a valid email address');
        highlightField('contract-client-email', true);
        return false;
      }

      // Address validation
      if (!address || address.length < 5) {
        showValidationError('Service address is required (minimum 5 characters)');
        highlightField('contract-client-address', true);
        return false;
      }

    } else if (step === 3) {
      // Step 3: Services & Frequency
      if (!_contractData.services || _contractData.services.length === 0) {
        showValidationError('Please add at least one service to the contract');
        return false;
      }

      var frequency = document.getElementById('contract-frequency').value;
      if (!frequency) {
        showValidationError('Please select a service frequency');
        highlightField('contract-frequency', true);
        return false;
      }

    } else if (step === 4) {
      // Step 4: Schedule & Preferences
      var startDate = document.getElementById('contract-start-date').value;
      if (!startDate) {
        showValidationError('Start date is required');
        highlightField('contract-start-date', true);
        return false;
      }

      // Check if start date is in the future
      var selectedDate = new Date(startDate);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        showValidationError('Start date must be today or in the future');
        highlightField('contract-start-date', true);
        return false;
      }

      // Duration validation (if provided)
      var duration = document.getElementById('contract-duration').value;
      if (duration && (isNaN(duration) || parseInt(duration) < 1 || parseInt(duration) > 60)) {
        showValidationError('Contract duration must be between 1 and 60 months');
        highlightField('contract-duration', true);
        return false;
      }
    }

    return true;
  }

  /**
   * Show validation error message
   */
  function showValidationError(message) {
    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Clear all validation errors
   */
  function clearValidationErrors() {
    var inputs = document.querySelectorAll('.contract-wizard-modal input, .contract-wizard-modal select, .contract-wizard-modal textarea');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.remove('form-input-error');
    }
  }

  /**
   * Highlight field with error
   */
  function highlightField(fieldId, hasError) {
    var field = document.getElementById(fieldId);
    if (!field) return;

    if (hasError) {
      field.classList.add('form-input-error');
    } else {
      field.classList.remove('form-input-error');
    }
  }

  /**
   * Real-time validation on field blur
   */
  function setupRealtimeValidation() {
    // Add blur event listeners to validate fields as user leaves them
    var nameField = document.getElementById('contract-client-name');
    var phoneField = document.getElementById('contract-client-phone');
    var emailField = document.getElementById('contract-client-email');
    var addressField = document.getElementById('contract-client-address');
    var startDateField = document.getElementById('contract-start-date');

    if (nameField) {
      nameField.addEventListener('blur', function() {
        var value = this.value.trim();
        if (value && value.length < 2) {
          highlightField('contract-client-name', true);
        } else {
          highlightField('contract-client-name', false);
        }
      });
    }

    if (phoneField) {
      phoneField.addEventListener('blur', function() {
        var value = this.value.trim().replace(/[\s\-\(\)]/g, '');
        if (value && (value.length !== 10 || !/^\d{10}$/.test(value))) {
          highlightField('contract-client-phone', true);
        } else {
          highlightField('contract-client-phone', false);
        }
      });
    }

    if (emailField) {
      emailField.addEventListener('blur', function() {
        var value = this.value.trim();
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          highlightField('contract-client-email', true);
        } else {
          highlightField('contract-client-email', false);
        }
      });
    }

    if (addressField) {
      addressField.addEventListener('blur', function() {
        var value = this.value.trim();
        if (value && value.length < 5) {
          highlightField('contract-client-address', true);
        } else {
          highlightField('contract-client-address', false);
        }
      });
    }

    if (startDateField) {
      startDateField.addEventListener('change', function() {
        var value = this.value;
        if (value) {
          var selectedDate = new Date(value);
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            highlightField('contract-start-date', true);
          } else {
            highlightField('contract-start-date', false);
          }
        }
      });
    }
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
      html += '<div class="service-item" data-service-index="' + i + '">';
      html += '<div class="service-description">' + window.Security.escapeHTML(service.description) + '</div>';
      html += '<div class="service-price">$' + service.unitPrice.toFixed(2) + '</div>';
      html += '<button type="button" class="btn btn-danger btn-sm service-remove-btn" aria-label="Remove service">Remove</button>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Event delegation: attach click handler for remove buttons
    attachServicesEventHandlers(container);
  }

  /**
   * Attach event handlers to services list using event delegation
   */
  function attachServicesEventHandlers(container) {
    // Remove old listener if it exists
    if (container._servicesClickHandler) {
      container.removeEventListener('click', container._servicesClickHandler);
    }

    // Create new click handler
    container._servicesClickHandler = function(event) {
      var target = event.target;

      // Handle remove button click
      if (target.classList.contains('service-remove-btn') || target.closest('.service-remove-btn')) {
        var removeBtn = target.classList.contains('service-remove-btn') ? target : target.closest('.service-remove-btn');
        var serviceItem = removeBtn.closest('.service-item');
        if (serviceItem) {
          var index = parseInt(serviceItem.getAttribute('data-service-index'), 10);
          if (!isNaN(index)) {
            removeContractService(index);
          }
        }
        event.preventDefault();
        return;
      }
    };

    // Attach the event listener
    container.addEventListener('click', container._servicesClickHandler);
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
    
    // In edit mode, update existing contract
    if (_editMode && _editContractId) {
      window.ContractManager.updateContract(_editContractId, _contractData);
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract updated as draft', 'success');
      }
    } else {
      window.ContractManager.createContract(_contractData);
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract saved as draft', 'success');
      }
    }

    // Close wizard and navigate to contracts page
    closeContractWizard();
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
    
    // In edit mode, update existing contract
    if (_editMode && _editContractId) {
      window.ContractManager.updateContract(_editContractId, _contractData);
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract updated successfully!', 'success');
      }
    } else {
      window.ContractManager.createContract(_contractData);
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract created successfully!', 'success');
      }
    }

    // Close wizard and navigate to contracts page
    closeContractWizard();
    if (window.navigateTo) {
      window.navigateTo('contracts');
    }
  }

  /**
   * Initialize wizard in edit mode with existing contract
   * @param {string} contractId - The ID of the contract to edit
   */
  function initEditMode(contractId) {
    if (!window.ContractManager) {
      console.error('[CONTRACT-WIZARD] ContractManager not available');
      return;
    }

    var contract = window.ContractManager.getContract(contractId);
    if (!contract) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Contract not found', 'error');
      }
      return;
    }

    // Set edit mode
    _editMode = true;
    _editContractId = contractId;
    _currentStep = 1;

    // Populate contract data from existing contract
    _contractData = {
      type: contract.type || null,
      client: {
        id: contract.clientId || null,
        name: contract.clientName || '',
        phone: contract.clientPhone || '',
        email: contract.clientEmail || '',
        address: contract.clientAddress || ''
      },
      services: contract.services || [],
      category: contract.category || 'windows',
      frequency: {
        id: contract.frequency || '',
        interval: contract.frequencyInterval || 1,
        unit: contract.frequencyUnit || 'month'
      },
      terms: {
        startDate: contract.startDate || '',
        endDate: contract.endDate || '',
        duration: contract.duration || 12,
        autoRenew: contract.autoRenew || false,
        noticePeriod: contract.noticePeriod || 30
      },
      schedule: {
        preferredDay: contract.preferredDay || null,
        preferredTime: contract.preferredTime || '',
        flexible: contract.flexible || false
      },
      payment: {
        method: contract.paymentMethod || 'invoice',
        terms: contract.paymentTerms || 'due-on-completion'
      },
      notes: contract.notes || ''
    };

    // Update modal title
    var titleEl = document.getElementById('contract-wizard-title');
    if (titleEl) {
      titleEl.textContent = 'Edit Contract';
    }

    // Pre-fill form fields
    prefillFormFields();

    // Show wizard
    showStep(1);
    populateClientDropdown();
    setupRealtimeValidation();

    console.log('[CONTRACT-WIZARD] Edit mode initialized for contract:', contractId);
  }

  /**
   * Pre-fill wizard form fields with existing contract data
   */
  function prefillFormFields() {
    // Step 1: Contract Type - highlight selected type card
    if (_contractData.type) {
      var cards = document.querySelectorAll('.contract-type-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('selected');
        var cardType = cards[i].getAttribute('data-type') || cards[i].getAttribute('onclick');
        if (cardType && cardType.indexOf(_contractData.type) !== -1) {
          cards[i].classList.add('selected');
        }
      }
      var nextBtn = document.getElementById('contract-step1-next');
      if (nextBtn) {
        nextBtn.disabled = false;
      }
    }

    // Step 2: Client Information
    var clientSelect = document.getElementById('contract-client-select');
    if (clientSelect && _contractData.client.id) {
      clientSelect.value = _contractData.client.id;
    }

    var nameField = document.getElementById('contract-client-name');
    var phoneField = document.getElementById('contract-client-phone');
    var emailField = document.getElementById('contract-client-email');
    var addressField = document.getElementById('contract-client-address');

    if (nameField) nameField.value = _contractData.client.name || '';
    if (phoneField) phoneField.value = _contractData.client.phone || '';
    if (emailField) emailField.value = _contractData.client.email || '';
    if (addressField) addressField.value = _contractData.client.address || '';

    // Step 3: Services and frequency will be populated when step is shown
    renderServicesList();

    // Step 4: Contract terms
    var startDateField = document.getElementById('contract-start-date');
    var durationField = document.getElementById('contract-duration');
    var autoRenewField = document.getElementById('contract-auto-renew');
    var noticePeriodField = document.getElementById('contract-notice-period');
    var paymentMethodField = document.getElementById('contract-payment-method');
    var paymentTermsField = document.getElementById('contract-payment-terms');

    if (startDateField && _contractData.terms.startDate) {
      startDateField.value = _contractData.terms.startDate;
    }
    if (durationField) durationField.value = _contractData.terms.duration || 12;
    if (autoRenewField) autoRenewField.checked = _contractData.terms.autoRenew || false;
    if (noticePeriodField) noticePeriodField.value = _contractData.terms.noticePeriod || 30;
    if (paymentMethodField) paymentMethodField.value = _contractData.payment.method || 'invoice';
    if (paymentTermsField) paymentTermsField.value = _contractData.payment.terms || 'due-on-completion';

    // Step 5: Schedule preferences
    var preferredDayField = document.getElementById('contract-preferred-day');
    var preferredTimeField = document.getElementById('contract-preferred-time');
    var flexibleField = document.getElementById('contract-flexible');
    var notesField = document.getElementById('contract-notes');

    if (preferredDayField && _contractData.schedule.preferredDay !== null) {
      preferredDayField.value = _contractData.schedule.preferredDay;
    }
    if (preferredTimeField) preferredTimeField.value = _contractData.schedule.preferredTime || '';
    if (flexibleField) flexibleField.checked = _contractData.schedule.flexible || false;
    if (notesField) notesField.value = _contractData.notes || '';
  }

  /**
   * Close contract wizard modal
   */
  function closeContractWizard() {
    var modal = document.getElementById('contract-wizard-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Reset edit mode
    _editMode = false;
    _editContractId = null;
  }

  // Public API
  var ContractWizard = {
    init: init,
    initEditMode: initEditMode,
    selectContractType: selectContractType,
    loadClientDetails: loadClientDetails,
    wizardNext: wizardNext,
    wizardBack: wizardBack,
    addService: addContractService,
    removeService: removeContractService,
    updatePricing: updateContractPricing,
    saveDraft: saveContractDraft,
    createFinal: createContractFinal,
    closeWizard: closeContractWizard
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

// Additional global UI functions
function openContractWizard() {
  var modal = document.getElementById('contract-wizard-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (window.ContractWizard) {
      window.ContractWizard.init();
    }
  }
}

/**
 * Open contract wizard in edit mode for an existing contract
 * @param {string} contractId - The ID of the contract to edit
 */
function openContractWizardForEdit(contractId) {
  var modal = document.getElementById('contract-wizard-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (window.ContractWizard) {
      window.ContractWizard.initEditMode(contractId);
    }
  }
}

function closeContractWizard() {
  if (window.ContractWizard) {
    window.ContractWizard.closeWizard();
  } else {
    var modal = document.getElementById('contract-wizard-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

function wizardNext(step) {
  if (window.ContractWizard) {
    window.ContractWizard.wizardNext(step);
  }
}

function wizardBack(step) {
  if (window.ContractWizard) {
    window.ContractWizard.wizardBack(step);
  }
}

function createContractFromWizard() {
  if (window.ContractWizard) {
    window.ContractWizard.createFinal();
  }
}

function toggleNewClientForm() {
  var select = document.getElementById('contract-client-select');
  var form = document.getElementById('contract-client-form');

  if (select && select.value) {
    // Client selected, disable form
    var inputs = form.querySelectorAll('input, textarea');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].disabled = true;
    }
  } else {
    // No client selected, enable form
    var inputs = form.querySelectorAll('input, textarea');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].disabled = false;
    }
  }
}

function selectServiceCategory(category) {
  // Update button states
  var windows = document.getElementById('contract-category-windows');
  var pressure = document.getElementById('contract-category-pressure');
  var both = document.getElementById('contract-category-both');

  if (windows) windows.className = 'btn btn-sm btn-tertiary';
  if (pressure) pressure.className = 'btn btn-sm btn-tertiary';
  if (both) both.className = 'btn btn-sm btn-tertiary';

  if (category === 'windows' && windows) {
    windows.className = 'btn btn-sm btn-primary';
  } else if (category === 'pressure' && pressure) {
    pressure.className = 'btn btn-sm btn-primary';
  } else if (category === 'both' && both) {
    both.className = 'btn btn-sm btn-primary';
  }

  // Store category in wizard data
  if (window.ContractWizard && window.ContractWizard._contractData) {
    window.ContractWizard._contractData.category = category;
  }
}
