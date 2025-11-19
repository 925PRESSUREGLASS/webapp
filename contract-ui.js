// contract-ui.js - Contract Detail Modal UI Functions
// Dependencies: contract-manager.js, ui-components.js, security.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var _currentContractId = null;

  /**
   * View contract details in modal
   */
  function viewContractDetail(contractId) {
    if (!window.ContractManager) {
      console.warn('[CONTRACT-UI] ContractManager not available');
      return;
    }

    try {
      var contract = window.ContractManager.getContract(contractId);
      if (!contract) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Contract not found', 'error');
        }
        return;
      }

      // Store for actions
      _currentContractId = contractId;

      // Populate header
      document.getElementById('detail-contract-number').textContent = contract.contractNumber || contract.id;
      document.getElementById('detail-contract-status').textContent = (contract.status || 'draft').toUpperCase();
      document.getElementById('detail-contract-type').textContent = contract.type || 'N/A';

      // Calculate annual value
      var annualValue = calculateAnnualValue(contract);
      document.getElementById('detail-annual-value').textContent = '$' + annualValue.toFixed(2);

      // Client information
      populateClientInfo(contract);

      // Schedule information
      populateScheduleInfo(contract);

      // Services list
      populateServicesList(contract);

      // Pricing details
      populatePricing(contract);

      // Contract terms
      populateTerms(contract);

      // Performance stats
      populatePerformanceStats(contract);

      // Action buttons
      updateActionButtons(contract);

      // Show modal
      document.getElementById('contract-detail-modal').style.display = 'flex';

      console.log('[CONTRACT-UI] Viewing contract:', contractId);

    } catch (e) {
      console.error('[CONTRACT-UI] Failed to view contract:', e);
      if (window.UIComponents) {
        window.UIComponents.showToast('Failed to load contract details', 'error');
      }
    }
  }

  /**
   * Calculate annual contract value
   */
  function calculateAnnualValue(contract) {
    if (!contract.pricing || !contract.pricing.finalPrice) {
      return 0;
    }

    var servicesPerYear = {
      'weekly': 52,
      'fortnightly': 26,
      'monthly': 12,
      'quarterly': 4,
      'biannual': 2,
      'annual': 1
    };

    var multiplier = servicesPerYear[contract.frequency] || 12;
    return contract.pricing.finalPrice * multiplier;
  }

  /**
   * Populate client information section
   */
  function populateClientInfo(contract) {
    document.getElementById('detail-client-name').textContent = contract.clientName || 'Unknown';
    document.getElementById('detail-client-phone').textContent = contract.clientPhone || 'N/A';
    document.getElementById('detail-client-email').textContent = contract.clientEmail || 'N/A';
    document.getElementById('detail-client-address').textContent = contract.clientAddress || 'N/A';
  }

  /**
   * Populate schedule information section
   */
  function populateScheduleInfo(contract) {
    document.getElementById('detail-frequency').textContent = contract.frequency || 'N/A';
    document.getElementById('detail-start-date').textContent = contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A';
    document.getElementById('detail-end-date').textContent = contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing';
    document.getElementById('detail-next-service').textContent = contract.nextServiceDate ? new Date(contract.nextServiceDate).toLocaleDateString() : 'Not scheduled';
    document.getElementById('detail-preferred-day').textContent = contract.preferredDay || 'None';
    document.getElementById('detail-preferred-time').textContent = contract.preferredTime || 'None';
  }

  /**
   * Populate services list section
   */
  function populateServicesList(contract) {
    var servicesList = document.getElementById('detail-services-list');

    if (contract.services && contract.services.length > 0) {
      var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      for (var i = 0; i < contract.services.length; i++) {
        var service = contract.services[i];
        html += '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--color-neutral-200);">';
        html += '<strong>' + window.Security.escapeHTML(service.name || 'Service ' + (i + 1)) + '</strong><br>';
        html += '<span style="font-size: 0.875rem; color: var(--color-neutral-600);">';
        html += window.Security.escapeHTML(service.description || 'No description');
        html += '</span>';
        html += '</li>';
      }
      html += '</ul>';
      servicesList.innerHTML = html;
    } else {
      servicesList.innerHTML = '<p style="color: var(--color-neutral-500);">No services configured</p>';
    }
  }

  /**
   * Populate pricing section
   */
  function populatePricing(contract) {
    var basePrice = contract.pricing && contract.pricing.basePrice ? contract.pricing.basePrice : 0;
    var discount = contract.pricing && contract.pricing.discount ? contract.pricing.discount : 0;
    var finalPrice = contract.pricing && contract.pricing.finalPrice ? contract.pricing.finalPrice : 0;

    document.getElementById('detail-base-price').textContent = '$' + basePrice.toFixed(2);
    document.getElementById('detail-discount').textContent = '-$' + discount.toFixed(2);
    document.getElementById('detail-service-price').textContent = '$' + finalPrice.toFixed(2);
  }

  /**
   * Populate contract terms section
   */
  function populateTerms(contract) {
    document.getElementById('detail-payment-terms').textContent = contract.paymentTerms || 'Due on completion';
    document.getElementById('detail-auto-invoice').textContent = contract.autoInvoice ? 'Yes' : 'No';
    document.getElementById('detail-auto-renew').textContent = contract.autoRenew ? 'Yes' : 'No';
    document.getElementById('detail-notice-period').textContent = contract.noticePeriod ? contract.noticePeriod + ' days' : '30 days';

    // Special terms
    if (contract.specialTerms) {
      document.getElementById('detail-special-terms').textContent = contract.specialTerms;
      document.getElementById('detail-special-terms-container').style.display = 'block';
    } else {
      document.getElementById('detail-special-terms-container').style.display = 'none';
    }
  }

  /**
   * Populate performance statistics section
   */
  function populatePerformanceStats(contract) {
    document.getElementById('detail-services-completed').textContent = contract.servicesCompleted || 0;
    document.getElementById('detail-total-revenue').textContent = '$' + (contract.totalRevenue || 0).toFixed(2);
    document.getElementById('detail-last-service').textContent = contract.lastServiceDate ? new Date(contract.lastServiceDate).toLocaleDateString() : 'Never';

    // Calculate contract age
    var age = 0;
    if (contract.startDate) {
      var startDate = new Date(contract.startDate);
      var today = new Date();
      age = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    }
    document.getElementById('detail-contract-age').textContent = age + ' days';
  }

  /**
   * Update action buttons based on contract status
   */
  function updateActionButtons(contract) {
    var pauseBtn = document.getElementById('detail-btn-pause');
    var resumeBtn = document.getElementById('detail-btn-resume');

    if (contract.status === 'active') {
      if (pauseBtn) pauseBtn.style.display = 'inline-block';
      if (resumeBtn) resumeBtn.style.display = 'none';
    } else if (contract.status === 'paused') {
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'inline-block';
    } else {
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
    }
  }

  /**
   * Close contract detail modal
   */
  function closeContractDetail() {
    document.getElementById('contract-detail-modal').style.display = 'none';
    _currentContractId = null;
  }

  /**
   * Edit contract (open wizard in edit mode)
   */
  function editContractFromDetail() {
    if (!_currentContractId) return;

    if (window.UIComponents) {
      window.UIComponents.showToast('Edit functionality coming soon!', 'info');
    }

    // TODO: Implement edit mode in wizard
    // closeContractDetail();
    // openContractWizard(_currentContractId);
  }

  /**
   * Pause contract
   */
  function pauseContractFromDetail() {
    if (!_currentContractId || !window.ContractManager) return;

    if (window.UIComponents) {
      window.UIComponents.showConfirm({
        title: 'Pause Contract',
        message: 'Are you sure you want to pause this contract? Services will not be scheduled until resumed.',
        confirmText: 'Pause',
        danger: false,
        onConfirm: function() {
          try {
            var contract = window.ContractManager.getContract(_currentContractId);
            if (contract) {
              contract.status = 'paused';
              window.ContractManager.updateContract(_currentContractId, contract);

              if (window.UIComponents) {
                window.UIComponents.showToast('Contract paused', 'success');
              }

              // Refresh detail view
              viewContractDetail(_currentContractId);

              // Refresh list if visible
              if (window.renderContractsList) {
                window.renderContractsList();
              }
            }
          } catch (e) {
            console.error('[CONTRACT-UI] Failed to pause contract:', e);
            if (window.UIComponents) {
              window.UIComponents.showToast('Failed to pause contract', 'error');
            }
          }
        }
      });
    }
  }

  /**
   * Resume contract
   */
  function resumeContractFromDetail() {
    if (!_currentContractId || !window.ContractManager) return;

    try {
      var contract = window.ContractManager.getContract(_currentContractId);
      if (contract) {
        contract.status = 'active';
        window.ContractManager.updateContract(_currentContractId, contract);

        if (window.UIComponents) {
          window.UIComponents.showToast('Contract resumed', 'success');
        }

        // Refresh detail view
        viewContractDetail(_currentContractId);

        // Refresh list if visible
        if (window.renderContractsList) {
          window.renderContractsList();
        }
      }
    } catch (e) {
      console.error('[CONTRACT-UI] Failed to resume contract:', e);
      if (window.UIComponents) {
        window.UIComponents.showToast('Failed to resume contract', 'error');
      }
    }
  }

  /**
   * Delete contract
   */
  function deleteContractFromDetail() {
    if (!_currentContractId || !window.ContractManager) return;

    if (window.UIComponents) {
      window.UIComponents.showConfirm({
        title: 'Delete Contract',
        message: 'Are you sure you want to delete this contract? This action cannot be undone.',
        confirmText: 'Delete',
        danger: true,
        onConfirm: function() {
          try {
            window.ContractManager.deleteContract(_currentContractId);

            if (window.UIComponents) {
              window.UIComponents.showToast('Contract deleted', 'success');
            }

            // Close modal
            closeContractDetail();

            // Refresh list
            if (window.renderContractsList) {
              window.renderContractsList();
            }
          } catch (e) {
            console.error('[CONTRACT-UI] Failed to delete contract:', e);
            if (window.UIComponents) {
              window.UIComponents.showToast('Failed to delete contract', 'error');
            }
          }
        }
      });
    }
  }

  /**
   * Generate quote from contract
   */
  function generateQuoteFromContract() {
    if (!_currentContractId || !window.ContractManager) return;

    try {
      var contract = window.ContractManager.getContract(_currentContractId);
      if (contract && window.ContractManager.generateQuoteFromContract) {
        var quote = window.ContractManager.generateQuoteFromContract(_currentContractId);

        if (window.UIComponents) {
          window.UIComponents.showToast('Quote generated from contract', 'success');
        }

        // Close modal and navigate to quotes
        closeContractDetail();
        if (window.navigateTo) {
          window.navigateTo('quotes');
        }
      } else {
        if (window.UIComponents) {
          window.UIComponents.showToast('Quote generation not available', 'info');
        }
      }
    } catch (e) {
      console.error('[CONTRACT-UI] Failed to generate quote:', e);
      if (window.UIComponents) {
        window.UIComponents.showToast('Failed to generate quote', 'error');
      }
    }
  }

  // Global API for onclick handlers
  window.viewContract = viewContractDetail;
  window.closeContractDetail = closeContractDetail;
  window.editContractFromDetail = editContractFromDetail;
  window.pauseContractFromDetail = pauseContractFromDetail;
  window.resumeContractFromDetail = resumeContractFromDetail;
  window.deleteContractFromDetail = deleteContractFromDetail;
  window.generateQuoteFromContract = generateQuoteFromContract;

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('contractUI', {
      viewContract: viewContractDetail,
      closeModal: closeContractDetail,
      editContract: editContractFromDetail,
      pauseContract: pauseContractFromDetail,
      resumeContract: resumeContractFromDetail,
      deleteContract: deleteContractFromDetail,
      generateQuote: generateQuoteFromContract
    });
  }

  console.log('[CONTRACT-UI] Module loaded');
})();
