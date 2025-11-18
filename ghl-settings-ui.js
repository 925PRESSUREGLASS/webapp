// ghl-settings-ui.js - GoHighLevel Settings and Sync UI
// Dependencies: ghl-client.js, ghl-opportunity-sync.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Open GHL settings modal
   */
  function openSettings() {
    var config = window.GHLClient ? window.GHLClient.getConfig() : {};
    var pipelineConfig = window.GHLOpportunitySync ? window.GHLOpportunitySync.getPipelineConfig() : {};

    var modalHTML = '<div class="modal-overlay" id="ghl-settings-overlay">' +
      '<div class="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="ghl-settings-title">' +
      '  <div class="modal-header">' +
      '    <h3 class="modal-title" id="ghl-settings-title">GoHighLevel Integration Settings</h3>' +
      '    <button type="button" class="btn-close" id="close-ghl-settings" aria-label="Close settings">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <div class="ghl-settings-tabs">' +
      '      <button type="button" class="ghl-tab-btn active" data-tab="api">API Configuration</button>' +
      '      <button type="button" class="ghl-tab-btn" data-tab="pipelines">Pipelines</button>' +
      '      <button type="button" class="ghl-tab-btn" data-tab="features">Features</button>' +
      '      <button type="button" class="ghl-tab-btn" data-tab="test">Test Connection</button>' +
      '    </div>' +
      '    <div class="ghl-settings-content">' +
      // API Configuration Tab
      '      <div class="ghl-tab-content active" data-tab="api">' +
      '        <h4 style="margin: 0 0 16px 0;">API Credentials</h4>' +
      '        <div class="form-group">' +
      '          <label class="form-label form-label-required" for="ghl-api-key">API Key</label>' +
      '          <input type="password" id="ghl-api-key" class="form-input" value="' + (config.apiKey || '') + '" placeholder="Enter your GHL API key">' +
      '          <span class="form-hint">Get this from Settings → API Keys in your GHL dashboard</span>' +
      '        </div>' +
      '        <div class="form-group">' +
      '          <label class="form-label form-label-required" for="ghl-location-id">Location ID</label>' +
      '          <input type="text" id="ghl-location-id" class="form-input" value="' + (config.locationId || '') + '" placeholder="Enter your GHL location ID">' +
      '          <span class="form-hint">Found in your GHL URL: app.gohighlevel.com/location/<strong>LOCATION_ID</strong></span>' +
      '        </div>' +
      '        <div class="form-group">' +
      '          <label class="form-label" for="ghl-base-url">Base URL</label>' +
      '          <input type="text" id="ghl-base-url" class="form-input" value="' + (config.baseUrl || 'https://rest.gohighlevel.com/v1') + '" placeholder="https://rest.gohighlevel.com/v1">' +
      '          <span class="form-hint">Default is fine for most users</span>' +
      '        </div>' +
      '      </div>' +
      // Pipelines Tab
      '      <div class="ghl-tab-content" data-tab="pipelines">' +
      '        <h4 style="margin: 0 0 16px 0;">Quote Pipeline</h4>' +
      '        <div class="form-group">' +
      '          <label class="form-label" for="quote-pipeline-id">Quote Pipeline ID</label>' +
      '          <input type="text" id="quote-pipeline-id" class="form-input" value="' + (pipelineConfig.quotePipelineId || '') + '" placeholder="Enter pipeline ID for quotes">' +
      '          <button type="button" class="btn btn-sm btn-secondary" id="load-pipelines-btn" style="margin-top: 8px;">Load Pipelines</button>' +
      '        </div>' +
      '        <div class="ghl-pipeline-stages" style="margin-top: 16px;">' +
      '          <h5 style="margin: 0 0 12px 0; font-size: 14px;">Quote Stages</h5>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="quote-stage-draft">Draft Stage ID</label>' +
      '            <input type="text" id="quote-stage-draft" class="form-input" value="' + (pipelineConfig.quotePipelineStages ? pipelineConfig.quotePipelineStages.draft || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="quote-stage-sent">Sent Stage ID</label>' +
      '            <input type="text" id="quote-stage-sent" class="form-input" value="' + (pipelineConfig.quotePipelineStages ? pipelineConfig.quotePipelineStages.sent || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="quote-stage-accepted">Accepted Stage ID</label>' +
      '            <input type="text" id="quote-stage-accepted" class="form-input" value="' + (pipelineConfig.quotePipelineStages ? pipelineConfig.quotePipelineStages.accepted || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="quote-stage-declined">Declined Stage ID</label>' +
      '            <input type="text" id="quote-stage-declined" class="form-input" value="' + (pipelineConfig.quotePipelineStages ? pipelineConfig.quotePipelineStages.declined || '' : '') + '">' +
      '          </div>' +
      '        </div>' +
      '        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">' +
      '        <h4 style="margin: 0 0 16px 0;">Invoice Pipeline</h4>' +
      '        <div class="form-group">' +
      '          <label class="form-label" for="invoice-pipeline-id">Invoice Pipeline ID</label>' +
      '          <input type="text" id="invoice-pipeline-id" class="form-input" value="' + (pipelineConfig.invoicePipelineId || '') + '" placeholder="Enter pipeline ID for invoices">' +
      '        </div>' +
      '        <div class="ghl-pipeline-stages" style="margin-top: 16px;">' +
      '          <h5 style="margin: 0 0 12px 0; font-size: 14px;">Invoice Stages</h5>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="invoice-stage-draft">Draft Stage ID</label>' +
      '            <input type="text" id="invoice-stage-draft" class="form-input" value="' + (pipelineConfig.invoicePipelineStages ? pipelineConfig.invoicePipelineStages.draft || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="invoice-stage-sent">Sent Stage ID</label>' +
      '            <input type="text" id="invoice-stage-sent" class="form-input" value="' + (pipelineConfig.invoicePipelineStages ? pipelineConfig.invoicePipelineStages.sent || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="invoice-stage-paid">Paid Stage ID</label>' +
      '            <input type="text" id="invoice-stage-paid" class="form-input" value="' + (pipelineConfig.invoicePipelineStages ? pipelineConfig.invoicePipelineStages.paid || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="invoice-stage-overdue">Overdue Stage ID</label>' +
      '            <input type="text" id="invoice-stage-overdue" class="form-input" value="' + (pipelineConfig.invoicePipelineStages ? pipelineConfig.invoicePipelineStages.overdue || '' : '') + '">' +
      '          </div>' +
      '          <div class="form-group">' +
      '            <label class="form-label" for="invoice-stage-cancelled">Cancelled Stage ID</label>' +
      '            <input type="text" id="invoice-stage-cancelled" class="form-input" value="' + (pipelineConfig.invoicePipelineStages ? pipelineConfig.invoicePipelineStages.cancelled || '' : '') + '">' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      // Features Tab
      '      <div class="ghl-tab-content" data-tab="features">' +
      '        <h4 style="margin: 0 0 16px 0;">Integration Features</h4>' +
      '        <div class="form-checkbox-wrapper">' +
      '          <input type="checkbox" id="feature-opportunity-sync" class="form-checkbox" ' + (config.features && config.features.opportunitySync ? 'checked' : '') + '>' +
      '          <label for="feature-opportunity-sync">' +
      '            <strong>Enable Opportunity Sync</strong><br>' +
      '            <span style="font-size: 14px; color: #6b7280;">Sync quotes and invoices to GHL as opportunities</span>' +
      '          </label>' +
      '        </div>' +
      '        <div class="form-checkbox-wrapper">' +
      '          <input type="checkbox" id="feature-contact-sync" class="form-checkbox" ' + (config.features && config.features.contactSync ? 'checked' : '') + '>' +
      '          <label for="feature-contact-sync">' +
      '            <strong>Enable Contact Sync</strong><br>' +
      '            <span style="font-size: 14px; color: #6b7280;">Automatically create/update contacts in GHL</span>' +
      '          </label>' +
      '        </div>' +
      '        <div class="form-checkbox-wrapper">' +
      '          <input type="checkbox" id="feature-task-sync" class="form-checkbox" ' + (config.features && config.features.taskSync ? 'checked' : '') + '>' +
      '          <label for="feature-task-sync">' +
      '            <strong>Enable Task Sync</strong><br>' +
      '            <span style="font-size: 14px; color: #6b7280;">Sync follow-up tasks to GHL</span>' +
      '          </label>' +
      '        </div>' +
      '      </div>' +
      // Test Connection Tab
      '      <div class="ghl-tab-content" data-tab="test">' +
      '        <h4 style="margin: 0 0 16px 0;">Test API Connection</h4>' +
      '        <p style="margin-bottom: 16px;">Test your GHL API credentials to ensure everything is configured correctly.</p>' +
      '        <button type="button" class="btn btn-primary" id="test-connection-btn">Test Connection</button>' +
      '        <div id="test-results" style="margin-top: 16px; display: none;"></div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="modal-footer">' +
      '    <button type="button" class="btn btn-secondary" id="cancel-ghl-settings">Cancel</button>' +
      '    <button type="button" class="btn btn-primary" id="save-ghl-settings">Save Settings</button>' +
      '  </div>' +
      '</div>' +
      '</div>';

    // Add modal to body
    var modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);

    // Prevent background scroll
    document.body.classList.add('modal-open');

    // Set up tab switching
    var tabButtons = document.querySelectorAll('.ghl-tab-btn');
    for (var i = 0; i < tabButtons.length; i++) {
      tabButtons[i].addEventListener('click', function() {
        var targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);
      });
    }

    // Set up event listeners
    document.getElementById('close-ghl-settings').addEventListener('click', closeSettings);
    document.getElementById('cancel-ghl-settings').addEventListener('click', closeSettings);
    document.getElementById('save-ghl-settings').addEventListener('click', saveSettings);
    document.getElementById('test-connection-btn').addEventListener('click', testConnection);
    document.getElementById('load-pipelines-btn').addEventListener('click', loadPipelines);
  }

  /**
   * Switch between tabs
   */
  function switchTab(tabName) {
    // Update buttons
    var tabButtons = document.querySelectorAll('.ghl-tab-btn');
    for (var i = 0; i < tabButtons.length; i++) {
      if (tabButtons[i].getAttribute('data-tab') === tabName) {
        tabButtons[i].classList.add('active');
      } else {
        tabButtons[i].classList.remove('active');
      }
    }

    // Update content
    var tabContents = document.querySelectorAll('.ghl-tab-content');
    for (var j = 0; j < tabContents.length; j++) {
      if (tabContents[j].getAttribute('data-tab') === tabName) {
        tabContents[j].classList.add('active');
      } else {
        tabContents[j].classList.remove('active');
      }
    }
  }

  /**
   * Close settings modal
   */
  function closeSettings() {
    var overlay = document.getElementById('ghl-settings-overlay');
    if (overlay) {
      overlay.remove();
    }
    document.body.classList.remove('modal-open');
  }

  /**
   * Save settings
   */
  function saveSettings() {
    // Collect API settings
    var apiKey = document.getElementById('ghl-api-key').value.trim();
    var locationId = document.getElementById('ghl-location-id').value.trim();
    var baseUrl = document.getElementById('ghl-base-url').value.trim();

    // Validate required fields
    if (!apiKey || !locationId) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Please enter both API key and location ID', 'error');
      } else {
        alert('Please enter both API key and location ID');
      }
      return;
    }

    // Update GHL Client config
    if (window.GHLClient) {
      window.GHLClient.updateConfig({
        apiKey: apiKey,
        locationId: locationId,
        baseUrl: baseUrl || 'https://rest.gohighlevel.com/v1',
        features: {
          opportunitySync: document.getElementById('feature-opportunity-sync').checked,
          contactSync: document.getElementById('feature-contact-sync').checked,
          taskSync: document.getElementById('feature-task-sync').checked
        }
      });
    }

    // Update pipeline config
    if (window.GHLOpportunitySync) {
      window.GHLOpportunitySync.updatePipelineConfig({
        quotePipelineId: document.getElementById('quote-pipeline-id').value.trim(),
        quotePipelineStages: {
          draft: document.getElementById('quote-stage-draft').value.trim(),
          sent: document.getElementById('quote-stage-sent').value.trim(),
          accepted: document.getElementById('quote-stage-accepted').value.trim(),
          declined: document.getElementById('quote-stage-declined').value.trim()
        },
        invoicePipelineId: document.getElementById('invoice-pipeline-id').value.trim(),
        invoicePipelineStages: {
          draft: document.getElementById('invoice-stage-draft').value.trim(),
          sent: document.getElementById('invoice-stage-sent').value.trim(),
          paid: document.getElementById('invoice-stage-paid').value.trim(),
          overdue: document.getElementById('invoice-stage-overdue').value.trim(),
          cancelled: document.getElementById('invoice-stage-cancelled').value.trim()
        }
      });
    }

    // Show success message
    if (window.UIComponents) {
      window.UIComponents.showToast('GHL settings saved successfully', 'success');
    }

    closeSettings();
  }

  /**
   * Test API connection
   */
  function testConnection() {
    var resultsDiv = document.getElementById('test-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading-spinner"></div> Testing connection...';

    if (!window.GHLClient) {
      resultsDiv.innerHTML = '<div class="alert alert-error">GHL Client not available</div>';
      return;
    }

    window.GHLClient.testConnection(function(error, result) {
      if (error) {
        resultsDiv.innerHTML = '<div class="alert alert-error"><strong>Connection failed:</strong><br>' + error.message + '</div>';
      } else {
        var locationName = result.location && result.location.name ? result.location.name : 'Unknown';
        resultsDiv.innerHTML = '<div class="alert alert-success"><strong>Connection successful!</strong><br>Location: ' + locationName + '</div>';
      }
    });
  }

  /**
   * Load pipelines from GHL
   */
  function loadPipelines() {
    var btn = document.getElementById('load-pipelines-btn');
    btn.disabled = true;
    btn.textContent = 'Loading...';

    if (!window.GHLClient) {
      alert('GHL Client not available');
      btn.disabled = false;
      btn.textContent = 'Load Pipelines';
      return;
    }

    window.GHLClient.getPipelines(function(error, response) {
      btn.disabled = false;
      btn.textContent = 'Load Pipelines';

      if (error) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Failed to load pipelines: ' + error.message, 'error');
        } else {
          alert('Failed to load pipelines: ' + error.message);
        }
        return;
      }

      if (!response.pipelines || response.pipelines.length === 0) {
        if (window.UIComponents) {
          window.UIComponents.showToast('No pipelines found', 'warning');
        }
        return;
      }

      // Show pipeline selector modal
      showPipelineSelector(response.pipelines);
    });
  }

  /**
   * Show pipeline selector modal
   */
  function showPipelineSelector(pipelines) {
    var selectorHTML = '<div class="modal-overlay" id="pipeline-selector-overlay">' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '  <div class="modal-header">' +
      '    <h3 class="modal-title">Select Pipelines</h3>' +
      '    <button type="button" class="btn-close" onclick="closePipelineSelector()">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <p>Select which pipelines to use for quotes and invoices:</p>' +
      '    <div class="form-group">' +
      '      <label class="form-label">Quote Pipeline</label>' +
      '      <select id="select-quote-pipeline" class="form-select">' +
      '        <option value="">Select...</option>';

    for (var i = 0; i < pipelines.length; i++) {
      selectorHTML += '<option value="' + pipelines[i].id + '">' + pipelines[i].name + '</option>';
    }

    selectorHTML += '</select>' +
      '    </div>' +
      '    <div class="form-group">' +
      '      <label class="form-label">Invoice Pipeline</label>' +
      '      <select id="select-invoice-pipeline" class="form-select">' +
      '        <option value="">Select...</option>';

    for (var j = 0; j < pipelines.length; j++) {
      selectorHTML += '<option value="' + pipelines[j].id + '">' + pipelines[j].name + '</option>';
    }

    selectorHTML += '</select>' +
      '    </div>' +
      '  </div>' +
      '  <div class="modal-footer">' +
      '    <button type="button" class="btn btn-secondary" onclick="closePipelineSelector()">Cancel</button>' +
      '    <button type="button" class="btn btn-primary" onclick="applyPipelineSelection()">Apply</button>' +
      '  </div>' +
      '</div>' +
      '</div>';

    var container = document.createElement('div');
    container.innerHTML = selectorHTML;
    document.body.appendChild(container.firstChild);
  }

  /**
   * Close pipeline selector
   */
  function closePipelineSelector() {
    var overlay = document.getElementById('pipeline-selector-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Apply pipeline selection
   */
  function applyPipelineSelection() {
    var quotePipelineId = document.getElementById('select-quote-pipeline').value;
    var invoicePipelineId = document.getElementById('select-invoice-pipeline').value;

    if (quotePipelineId) {
      document.getElementById('quote-pipeline-id').value = quotePipelineId;
    }

    if (invoicePipelineId) {
      document.getElementById('invoice-pipeline-id').value = invoicePipelineId;
    }

    closePipelineSelector();

    if (window.UIComponents) {
      window.UIComponents.showToast('Pipeline IDs updated', 'success');
    }
  }

  /**
   * Sync current quote to GHL
   */
  function syncCurrentQuote() {
    if (!window.GHLOpportunitySync) {
      if (window.UIComponents) {
        window.UIComponents.showToast('GHL Opportunity Sync not available', 'error');
      }
      return;
    }

    if (!window.GHLOpportunitySync.isOpportunitySyncEnabled()) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Please enable Opportunity Sync in GHL settings', 'warning');
      } else {
        alert('Please enable Opportunity Sync in GHL settings');
      }
      return;
    }

    // Show loading
    if (window.UIComponents) {
      window.UIComponents.showLoading('Syncing to GoHighLevel...');
    }

    window.GHLOpportunitySync.syncCurrentQuote(function(error, response) {
      if (window.UIComponents) {
        window.UIComponents.hideLoading();
      }

      if (error) {
        if (window.UIComponents) {
          window.UIComponents.showToast('Sync failed: ' + error.message, 'error');
        } else {
          alert('Sync failed: ' + error.message);
        }
        return;
      }

      if (window.UIComponents) {
        window.UIComponents.showToast('Quote synced to GoHighLevel successfully!', 'success');
      } else {
        alert('Quote synced to GoHighLevel successfully!');
      }
    });
  }

  /**
   * Add sync button to quote summary
   */
  function addSyncButton() {
    // Find the summary section
    var summarySection = document.querySelector('#summaryPanel .sec-b');
    if (!summarySection) return;

    // Check if button already exists
    if (document.getElementById('sync-quote-ghl-btn')) return;

    // Create sync button
    var syncBtn = document.createElement('button');
    syncBtn.id = 'sync-quote-ghl-btn';
    syncBtn.type = 'button';
    syncBtn.className = 'btn btn-secondary';
    syncBtn.style.marginTop = '12px';
    syncBtn.style.width = '100%';
    syncBtn.textContent = '🔄 Sync to GoHighLevel';
    syncBtn.setAttribute('title', 'Sync this quote to GoHighLevel as an opportunity');
    syncBtn.addEventListener('click', syncCurrentQuote);

    // Add to summary section
    summarySection.appendChild(syncBtn);
  }

  /**
   * Initialize UI
   */
  function init() {
    // Add sync button when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addSyncButton);
    } else {
      addSyncButton();
    }

    console.log('[GHL-SETTINGS-UI] Initialized');
  }

  // Make functions globally available for onclick handlers
  window.openGHLSettings = openSettings;
  window.closePipelineSelector = closePipelineSelector;
  window.applyPipelineSelection = applyPipelineSelection;
  window.syncQuoteToGHL = syncCurrentQuote;

  // Public API
  var GHLSettingsUI = {
    openSettings: openSettings,
    closeSettings: closeSettings,
    syncCurrentQuote: syncCurrentQuote
  };

  window.GHLSettingsUI = GHLSettingsUI;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlSettingsUI', GHLSettingsUI);
  }

  // Auto-init
  init();

  console.log('[GHL-SETTINGS-UI] Module loaded');
})();
