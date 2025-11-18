// workflow-integration.js - Integrate messaging with quote workflow
// Dependencies: message-sequences.js, communication-manager.js, quote-workflow.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Hook into quote status changes
   * Wraps the setCurrentStatus function to trigger message sequences
   */
  function initializeWorkflowIntegration() {
    console.log('[WORKFLOW-INTEGRATION] Initializing...');

    // Wait for QuoteWorkflow to be available
    if (!window.QuoteWorkflow) {
      console.warn('[WORKFLOW-INTEGRATION] QuoteWorkflow not available yet, deferring...');
      setTimeout(initializeWorkflowIntegration, 1000);
      return;
    }

    // Wrap the status change function
    var originalSetStatus = window.QuoteWorkflow.setCurrentStatus;

    if (originalSetStatus) {
      window.QuoteWorkflow.setCurrentStatus = function(newStatus, oldStatus) {
        // Call original function
        var result = originalSetStatus.call(this, newStatus, oldStatus);

        // Trigger messaging sequences based on status change
        handleStatusChange(newStatus, oldStatus);

        return result;
      };

      console.log('[WORKFLOW-INTEGRATION] Successfully hooked into QuoteWorkflow');
    }

    console.log('[WORKFLOW-INTEGRATION] Initialized');
  }

  /**
   * Handle quote status change
   */
  function handleStatusChange(newStatus, oldStatus) {
    console.log('[WORKFLOW-INTEGRATION] Status change:', oldStatus, '->', newStatus);

    // Get current quote state
    var quote = getQuoteData();

    if (!quote) {
      console.warn('[WORKFLOW-INTEGRATION] No quote data available');
      return;
    }

    // Add status to quote
    quote.status = newStatus;
    quote.previousStatus = oldStatus;

    // Trigger message sequences based on status
    if (window.MessageSequences && window.MessageSequences.handleQuoteEvent) {
      switch (newStatus) {
        case 'sent':
          window.MessageSequences.handleQuoteEvent('quote-sent', quote);
          break;

        case 'accepted':
          window.MessageSequences.handleQuoteEvent('quote-accepted', quote);
          break;

        case 'declined':
          window.MessageSequences.handleQuoteEvent('quote-declined', quote);
          break;

        case 'completed':
          window.MessageSequences.handleQuoteEvent('job-completed', quote);
          break;

        case 'cancelled':
          window.MessageSequences.handleQuoteEvent('quote-cancelled', quote);
          break;
      }
    }
  }

  /**
   * Get current quote data
   */
  function getQuoteData() {
    // Try to get from APP state
    if (window.APP && window.APP.getState) {
      return window.APP.getState();
    }

    // Try to get from localStorage
    try {
      var saved = localStorage.getItem('tictacstick_autosave_state_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('[WORKFLOW-INTEGRATION] Failed to load quote data:', e);
    }

    return null;
  }

  /**
   * Send quote via SMS/Email
   * Can be called manually from UI
   */
  function sendQuoteViaMessage(method) {
    if (!window.CommunicationManager) {
      console.error('[WORKFLOW-INTEGRATION] CommunicationManager not available');
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Communication system not available', 'error');
      }
      return;
    }

    var quote = getQuoteData();

    if (!quote) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('No quote data available', 'error');
      }
      return;
    }

    if (!quote.client || !quote.client.ghlId) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Client must be linked to GoHighLevel first', 'warning');
      }
      return;
    }

    // Send based on method
    if (method === 'sms' || method === 'both') {
      window.CommunicationManager.sendFromTemplate(
        quote,
        'quoteSent',
        'sms',
        function(error) {
          if (error) {
            console.error('[WORKFLOW-INTEGRATION] Failed to send SMS:', error);
            if (window.UIComponents && window.UIComponents.showToast) {
              window.UIComponents.showToast('Failed to send SMS', 'error');
            }
          } else {
            if (window.UIComponents && window.UIComponents.showToast) {
              window.UIComponents.showToast('Quote sent via SMS', 'success');
            }
          }
        }
      );
    }

    if (method === 'email' || method === 'both') {
      window.CommunicationManager.sendFromTemplate(
        quote,
        'quoteSent',
        'email',
        function(error) {
          if (error) {
            console.error('[WORKFLOW-INTEGRATION] Failed to send email:', error);
            if (window.UIComponents && window.UIComponents.showToast) {
              window.UIComponents.showToast('Failed to send email', 'error');
            }
          } else {
            if (window.UIComponents && window.UIComponents.showToast) {
              window.UIComponents.showToast('Quote sent via email', 'success');
            }
          }
        }
      );
    }

    // Update quote status to 'sent'
    if (window.QuoteWorkflow && window.QuoteWorkflow.setCurrentStatus) {
      var oldStatus = window.QuoteWorkflow.getCurrentStatus();
      window.QuoteWorkflow.setCurrentStatus('sent', oldStatus);
    }

    // Save updated quote
    if (window.APP && window.APP.saveState) {
      quote.dateSent = new Date().toISOString();
      quote.status = 'sent';
      window.APP.saveState();
    }
  }

  /**
   * Show send quote modal
   */
  function showSendQuoteModal() {
    // Check if quote has client with GHL ID
    var quote = getQuoteData();

    if (!quote) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('No quote data available', 'error');
      }
      return;
    }

    if (!quote.client || !quote.client.ghlId) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Client must be linked to GoHighLevel first. Please add client to CRM.', 'warning');
      }
      return;
    }

    // Create modal
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    var modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';

    // Header
    var header = document.createElement('div');
    header.className = 'modal-header';

    var title = document.createElement('h3');
    title.textContent = 'Send Quote';
    header.appendChild(title);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
      document.body.removeChild(modal);
    };
    header.appendChild(closeBtn);

    modalContent.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'modal-body';

    var info = document.createElement('p');
    info.textContent = 'Send quote to: ' + (quote.client.name || 'Unknown Client');
    body.appendChild(info);

    var clientInfo = document.createElement('p');
    clientInfo.style.fontSize = '0.875rem';
    clientInfo.style.color = '#6b7280';
    clientInfo.innerHTML = 'Email: ' + (quote.client.email || 'Not set') + '<br>' +
                          'Phone: ' + (quote.client.phone || 'Not set');
    body.appendChild(clientInfo);

    // Method selector
    var methodLabel = document.createElement('label');
    methodLabel.textContent = 'Send via:';
    methodLabel.style.display = 'block';
    methodLabel.style.marginTop = '1rem';
    methodLabel.style.marginBottom = '0.5rem';
    methodLabel.style.fontWeight = '600';
    body.appendChild(methodLabel);

    var methodSelect = document.createElement('select');
    methodSelect.className = 'form-select';
    methodSelect.innerHTML = '<option value="both">SMS + Email (recommended)</option>' +
                            '<option value="email">Email Only</option>' +
                            '<option value="sms">SMS Only</option>';
    body.appendChild(methodSelect);

    modalContent.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'modal-footer';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function() {
      document.body.removeChild(modal);
    };
    footer.appendChild(cancelBtn);

    var sendBtn = document.createElement('button');
    sendBtn.className = 'btn btn-primary';
    sendBtn.textContent = 'Send Quote';
    sendBtn.onclick = function() {
      var method = methodSelect.value;
      sendQuoteViaMessage(method);
      document.body.removeChild(modal);
    };
    footer.appendChild(sendBtn);

    modalContent.appendChild(footer);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWorkflowIntegration);
  } else {
    initializeWorkflowIntegration();
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('workflowIntegration', {
      sendQuoteViaMessage: sendQuoteViaMessage,
      showSendQuoteModal: showSendQuoteModal,
      handleStatusChange: handleStatusChange
    });
  }

  // Global API
  window.WorkflowIntegration = {
    sendQuoteViaMessage: sendQuoteViaMessage,
    showSendQuoteModal: showSendQuoteModal,
    handleStatusChange: handleStatusChange
  };

  // Make functions globally available
  window.sendQuoteViaMessage = sendQuoteViaMessage;
  window.showSendQuoteModal = showSendQuoteModal;

  console.log('[WORKFLOW-INTEGRATION] Module loaded');
})();
