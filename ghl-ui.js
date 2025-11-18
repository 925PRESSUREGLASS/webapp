// ghl-ui.js - GoHighLevel UI Module
// Dependencies: ghl-config.js, ghl-client.js, ghl-contact-sync.js, ghl-opportunity-sync.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var _settingsModal = null;
  var _syncStatusInterval = null;

  /**
   * Initialize GHL UI
   */
  function init() {
    console.log('[GHL-UI] Initializing...');

    // Add settings button to main UI
    addSettingsButton();

    // Create settings modal (hidden by default)
    createSettingsModal();

    // Setup event listeners
    setupEventListeners();

    // Update sync status periodically
    startSyncStatusUpdates();

    console.log('[GHL-UI] Initialized');
  }

  /**
   * Add GHL settings button to main UI
   */
  function addSettingsButton() {
    // Find settings area or toolbar
    var settingsArea = document.querySelector('.settings-panel') ||
                       document.querySelector('.toolbar') ||
                       document.querySelector('header');

    if (!settingsArea) {
      console.warn('[GHL-UI] No settings area found');
      return;
    }

    // Create button
    var btn = document.createElement('button');
    btn.id = 'ghlSettingsBtn';
    btn.className = 'btn btn-secondary';
    btn.innerHTML = '<svg width="16" height="16" fill="currentColor" class="mr-1"><use xlink:href="#icon-cloud"/></svg> GoHighLevel';
    btn.setAttribute('aria-label', 'GoHighLevel Settings');

    btn.addEventListener('click', function() {
      openSettings();
    });

    settingsArea.appendChild(btn);
  }

  /**
   * Create settings modal
   */
  function createSettingsModal() {
    var modal = document.createElement('div');
    modal.id = 'ghlSettingsModal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ghlSettingsTitle');

    modal.innerHTML = [
      '<div class="modal-overlay"></div>',
      '<div class="modal-container modal-lg">',
      '  <div class="modal-header">',
      '    <h3 id="ghlSettingsTitle" class="modal-title">GoHighLevel Integration</h3>',
      '    <button class="modal-close" aria-label="Close">&times;</button>',
      '  </div>',
      '  <div class="modal-body">',
      '    <!-- Tabs -->',
      '    <div class="tabs">',
      '      <button class="tab-btn active" data-tab="connection">Connection</button>',
      '      <button class="tab-btn" data-tab="sync">Sync</button>',
      '      <button class="tab-btn" data-tab="settings">Settings</button>',
      '      <button class="tab-btn" data-tab="status">Status</button>',
      '    </div>',
      '',
      '    <!-- Connection Tab -->',
      '    <div class="tab-content active" data-tab="connection">',
      '      <div class="form-group">',
      '        <label class="form-label">Connection Status</label>',
      '        <div id="ghlConnectionStatus" class="connection-status"></div>',
      '      </div>',
      '',
      '      <div class="form-group">',
      '        <label class="form-label form-label-required" for="ghlClientId">Client ID</label>',
      '        <input type="text" id="ghlClientId" class="form-input" placeholder="Your GHL App Client ID" aria-required="true">',
      '        <span class="form-hint">From your GoHighLevel App settings</span>',
      '      </div>',
      '',
      '      <div class="form-group">',
      '        <label class="form-label form-label-required" for="ghlClientSecret">Client Secret</label>',
      '        <input type="password" id="ghlClientSecret" class="form-input" placeholder="Your GHL App Client Secret" aria-required="true">',
      '      </div>',
      '',
      '      <div class="form-group">',
      '        <label class="form-label form-label-required" for="ghlLocationId">Location ID</label>',
      '        <input type="text" id="ghlLocationId" class="form-input" placeholder="Your GHL Location ID" aria-required="true">',
      '      </div>',
      '',
      '      <div class="form-group">',
      '        <label class="form-label" for="ghlPipelineId">Pipeline ID</label>',
      '        <input type="text" id="ghlPipelineId" class="form-input" placeholder="Your Sales Pipeline ID">',
      '      </div>',
      '',
      '      <div class="btn-group">',
      '        <button id="ghlSaveConfigBtn" class="btn btn-primary">Save Configuration</button>',
      '        <button id="ghlAuthenticateBtn" class="btn btn-secondary" disabled>Authenticate with GHL</button>',
      '        <button id="ghlTestConnectionBtn" class="btn btn-tertiary" disabled>Test Connection</button>',
      '      </div>',
      '    </div>',
      '',
      '    <!-- Sync Tab -->',
      '    <div class="tab-content" data-tab="sync">',
      '      <h4>Manual Sync</h4>',
      '      <p>Manually sync your data with GoHighLevel CRM.</p>',
      '',
      '      <div class="sync-actions">',
      '        <div class="sync-card">',
      '          <h5>Sync Clients</h5>',
      '          <p>Sync all TicTacStick clients to GoHighLevel contacts</p>',
      '          <button id="ghlSyncClientsBtn" class="btn btn-primary btn-block">Sync Clients</button>',
      '          <div id="ghlClientSyncStatus" class="sync-status"></div>',
      '        </div>',
      '',
      '        <div class="sync-card">',
      '          <h5>Sync Quotes</h5>',
      '          <p>Sync all saved quotes to GoHighLevel opportunities</p>',
      '          <button id="ghlSyncQuotesBtn" class="btn btn-primary btn-block">Sync Quotes</button>',
      '          <div id="ghlQuoteSyncStatus" class="sync-status"></div>',
      '        </div>',
      '',
      '        <div class="sync-card">',
      '          <h5>Process Queue</h5>',
      '          <p id="ghlQueueCount">0 requests pending</p>',
      '          <button id="ghlProcessQueueBtn" class="btn btn-secondary btn-block">Process Queue</button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '',
      '    <!-- Settings Tab -->',
      '    <div class="tab-content" data-tab="settings">',
      '      <h4>Sync Settings</h4>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlAutoSync" class="form-checkbox">',
      '        <label for="ghlAutoSync">Enable automatic sync</label>',
      '      </div>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlSyncOnQuoteCreate" class="form-checkbox">',
      '        <label for="ghlSyncOnQuoteCreate">Sync when quote is created</label>',
      '      </div>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlSyncOnQuoteUpdate" class="form-checkbox">',
      '        <label for="ghlSyncOnQuoteUpdate">Sync when quote is updated</label>',
      '      </div>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlOfflineQueue" class="form-checkbox">',
      '        <label for="ghlOfflineQueue">Queue requests when offline</label>',
      '      </div>',
      '',
      '      <div class="form-group">',
      '        <label class="form-label" for="ghlSyncInterval">Sync Interval (minutes)</label>',
      '        <input type="number" id="ghlSyncInterval" class="form-input" min="1" max="60" value="5">',
      '      </div>',
      '',
      '      <h4>Feature Flags</h4>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlContactSync" class="form-checkbox">',
      '        <label for="ghlContactSync">Contact Sync</label>',
      '      </div>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlOpportunitySync" class="form-checkbox">',
      '        <label for="ghlOpportunitySync">Opportunity Sync</label>',
      '      </div>',
      '',
      '      <div class="form-checkbox-wrapper">',
      '        <input type="checkbox" id="ghlTaskSync" class="form-checkbox">',
      '        <label for="ghlTaskSync">Task Sync</label>',
      '      </div>',
      '',
      '      <button id="ghlSaveSettingsBtn" class="btn btn-primary">Save Settings</button>',
      '    </div>',
      '',
      '    <!-- Status Tab -->',
      '    <div class="tab-content" data-tab="status">',
      '      <h4>Integration Status</h4>',
      '      <div id="ghlStatusInfo" class="status-info"></div>',
      '',
      '      <h4>Recent Activity</h4>',
      '      <div id="ghlActivityLog" class="activity-log"></div>',
      '',
      '      <h4>Danger Zone</h4>',
      '      <button id="ghlClearQueueBtn" class="btn btn-danger">Clear Sync Queue</button>',
      '      <button id="ghlDisconnectBtn" class="btn btn-danger">Disconnect GHL</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(modal);
    _settingsModal = modal;

    // Setup tab switching
    setupTabs();
  }

  /**
   * Setup tab switching
   */
  function setupTabs() {
    var tabBtns = _settingsModal.querySelectorAll('.tab-btn');
    var tabContents = _settingsModal.querySelectorAll('.tab-content');

    tabBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tabName = btn.getAttribute('data-tab');

        // Remove active class from all
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        tabContents.forEach(function(c) { c.classList.remove('active'); });

        // Add active to selected
        btn.classList.add('active');
        var content = _settingsModal.querySelector('.tab-content[data-tab="' + tabName + '"]');
        if (content) content.classList.add('active');
      });
    });
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Close modal
    var closeBtn = _settingsModal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSettings);
    }

    var overlay = _settingsModal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeSettings);
    }

    // Save configuration
    var saveConfigBtn = document.getElementById('ghlSaveConfigBtn');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', saveConfiguration);
    }

    // Authenticate
    var authBtn = document.getElementById('ghlAuthenticateBtn');
    if (authBtn) {
      authBtn.addEventListener('click', startAuthentication);
    }

    // Test connection
    var testBtn = document.getElementById('ghlTestConnectionBtn');
    if (testBtn) {
      testBtn.addEventListener('click', testConnection);
    }

    // Sync buttons
    var syncClientsBtn = document.getElementById('ghlSyncClientsBtn');
    if (syncClientsBtn) {
      syncClientsBtn.addEventListener('click', syncClients);
    }

    var syncQuotesBtn = document.getElementById('ghlSyncQuotesBtn');
    if (syncQuotesBtn) {
      syncQuotesBtn.addEventListener('click', syncQuotes);
    }

    var processQueueBtn = document.getElementById('ghlProcessQueueBtn');
    if (processQueueBtn) {
      processQueueBtn.addEventListener('click', processQueue);
    }

    // Save settings
    var saveSettingsBtn = document.getElementById('ghlSaveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Danger zone
    var clearQueueBtn = document.getElementById('ghlClearQueueBtn');
    if (clearQueueBtn) {
      clearQueueBtn.addEventListener('click', clearQueue);
    }

    var disconnectBtn = document.getElementById('ghlDisconnectBtn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', disconnect);
    }
  }

  /**
   * Open settings modal
   */
  function openSettings() {
    if (!_settingsModal) return;

    // Load current configuration
    loadConfiguration();

    // Show modal
    _settingsModal.classList.add('active');
    document.body.classList.add('modal-open');

    // Update status
    updateConnectionStatus();
    updateQueueCount();
    updateStatusInfo();
  }

  /**
   * Close settings modal
   */
  function closeSettings() {
    if (!_settingsModal) return;

    _settingsModal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  /**
   * Load configuration into form
   */
  function loadConfiguration() {
    document.getElementById('ghlClientId').value = GHL_CONFIG.clientId || '';
    document.getElementById('ghlClientSecret').value = GHL_CONFIG.clientSecret || '';
    document.getElementById('ghlLocationId').value = GHL_CONFIG.locationId || '';
    document.getElementById('ghlPipelineId').value = GHL_CONFIG.pipeline.id || '';

    // Sync settings
    document.getElementById('ghlAutoSync').checked = GHL_CONFIG.syncSettings.autoSync;
    document.getElementById('ghlSyncOnQuoteCreate').checked = GHL_CONFIG.syncSettings.syncOnQuoteCreate;
    document.getElementById('ghlSyncOnQuoteUpdate').checked = GHL_CONFIG.syncSettings.syncOnQuoteUpdate;
    document.getElementById('ghlOfflineQueue').checked = GHL_CONFIG.syncSettings.offlineQueue;
    document.getElementById('ghlSyncInterval').value = GHL_CONFIG.syncSettings.syncInterval / 60000;

    // Feature flags
    document.getElementById('ghlContactSync').checked = GHL_CONFIG.features.contactSync;
    document.getElementById('ghlOpportunitySync').checked = GHL_CONFIG.features.opportunitySync;
    document.getElementById('ghlTaskSync').checked = GHL_CONFIG.features.taskSync;

    // Enable auth button if configured
    var authBtn = document.getElementById('ghlAuthenticateBtn');
    var testBtn = document.getElementById('ghlTestConnectionBtn');

    if (window.GHLConfig.isConfigured()) {
      authBtn.disabled = false;
      testBtn.disabled = false;
    }
  }

  /**
   * Save configuration
   */
  function saveConfiguration() {
    GHL_CONFIG.clientId = document.getElementById('ghlClientId').value.trim();
    GHL_CONFIG.clientSecret = document.getElementById('ghlClientSecret').value.trim();
    GHL_CONFIG.locationId = document.getElementById('ghlLocationId').value.trim();
    GHL_CONFIG.pipeline.id = document.getElementById('ghlPipelineId').value.trim();

    if (window.GHLConfig.save()) {
      showToast('Configuration saved!', 'success');

      // Enable auth button
      document.getElementById('ghlAuthenticateBtn').disabled = false;
      document.getElementById('ghlTestConnectionBtn').disabled = false;

      updateConnectionStatus();
    } else {
      showToast('Failed to save configuration', 'error');
    }
  }

  /**
   * Start OAuth authentication
   */
  function startAuthentication() {
    if (!window.GHLConfig.isConfigured()) {
      showToast('Please configure Client ID and Location ID first', 'error');
      return;
    }

    // Build OAuth URL
    var authUrl = window.GHLClient.endpoints.oauth.authorize +
      '?client_id=' + encodeURIComponent(GHL_CONFIG.clientId) +
      '&redirect_uri=' + encodeURIComponent(GHL_CONFIG.redirectUri) +
      '&response_type=code';

    // Open OAuth window
    window.open(authUrl, 'GHL OAuth', 'width=600,height=800');

    showToast('Complete authentication in the popup window', 'info');
  }

  /**
   * Test connection
   */
  function testConnection() {
    if (!window.GHLClient.isConfigured()) {
      showToast('Not configured or authenticated', 'error');
      return;
    }

    showToast('Testing connection...', 'info');

    // Try to fetch pipelines
    window.GHLClient.makeRequest('GET', '/pipelines/', null, function(error, response) {
      if (error) {
        showToast('Connection failed: ' + error.message, 'error');
        updateConnectionStatus();
      } else {
        showToast('Connection successful!', 'success');
        updateConnectionStatus();

        // Show available pipelines
        if (response.pipelines && response.pipelines.length > 0) {
          console.log('Available pipelines:', response.pipelines);
        }
      }
    });
  }

  /**
   * Sync clients
   */
  function syncClients() {
    var btn = document.getElementById('ghlSyncClientsBtn');
    var status = document.getElementById('ghlClientSyncStatus');

    btn.disabled = true;
    btn.textContent = 'Syncing...';
    status.textContent = 'Starting sync...';

    window.GHLContactSync.syncAllClients(function(error, result) {
      btn.disabled = false;
      btn.textContent = 'Sync Clients';

      if (error) {
        status.textContent = 'Sync failed: ' + error.message;
        status.className = 'sync-status error';
        showToast('Client sync failed', 'error');
      } else {
        var msg = 'Synced ' + result.synced + ' of ' + result.total + ' clients';
        if (result.failed > 0) msg += ' (' + result.failed + ' failed)';

        status.textContent = msg;
        status.className = 'sync-status success';
        showToast('Client sync complete!', 'success');

        updateStatusInfo();
      }
    });
  }

  /**
   * Sync quotes
   */
  function syncQuotes() {
    var btn = document.getElementById('ghlSyncQuotesBtn');
    var status = document.getElementById('ghlQuoteSyncStatus');

    btn.disabled = true;
    btn.textContent = 'Syncing...';
    status.textContent = 'Starting sync...';

    window.GHLOpportunitySync.syncAllQuotes(function(error, result) {
      btn.disabled = false;
      btn.textContent = 'Sync Quotes';

      if (error) {
        status.textContent = 'Sync failed: ' + error.message;
        status.className = 'sync-status error';
        showToast('Quote sync failed', 'error');
      } else {
        var msg = 'Synced ' + result.synced + ' of ' + result.total + ' quotes';
        if (result.failed > 0) msg += ' (' + result.failed + ' failed)';

        status.textContent = msg;
        status.className = 'sync-status success';
        showToast('Quote sync complete!', 'success');

        updateStatusInfo();
      }
    });
  }

  /**
   * Process sync queue
   */
  function processQueue() {
    var btn = document.getElementById('ghlProcessQueueBtn');

    btn.disabled = true;
    btn.textContent = 'Processing...';

    window.GHLClient.processQueue(function(error, result) {
      btn.disabled = false;
      btn.textContent = 'Process Queue';

      if (error) {
        showToast('Failed to process queue', 'error');
      } else {
        var msg = 'Processed ' + result.processed + ' requests';
        if (result.failed > 0) msg += ' (' + result.failed + ' failed)';
        showToast(msg, 'success');

        updateQueueCount();
      }
    });
  }

  /**
   * Save settings
   */
  function saveSettings() {
    GHL_CONFIG.syncSettings.autoSync = document.getElementById('ghlAutoSync').checked;
    GHL_CONFIG.syncSettings.syncOnQuoteCreate = document.getElementById('ghlSyncOnQuoteCreate').checked;
    GHL_CONFIG.syncSettings.syncOnQuoteUpdate = document.getElementById('ghlSyncOnQuoteUpdate').checked;
    GHL_CONFIG.syncSettings.offlineQueue = document.getElementById('ghlOfflineQueue').checked;
    GHL_CONFIG.syncSettings.syncInterval = parseInt(document.getElementById('ghlSyncInterval').value) * 60000;

    GHL_CONFIG.features.contactSync = document.getElementById('ghlContactSync').checked;
    GHL_CONFIG.features.opportunitySync = document.getElementById('ghlOpportunitySync').checked;
    GHL_CONFIG.features.taskSync = document.getElementById('ghlTaskSync').checked;

    if (window.GHLConfig.save()) {
      showToast('Settings saved!', 'success');
    } else {
      showToast('Failed to save settings', 'error');
    }
  }

  /**
   * Clear sync queue
   */
  function clearQueue() {
    if (!confirm('Clear all queued sync requests? This cannot be undone.')) {
      return;
    }

    window.GHLClient.clearQueue();
    showToast('Queue cleared', 'success');
    updateQueueCount();
  }

  /**
   * Disconnect from GHL
   */
  function disconnect() {
    if (!confirm('Disconnect from GoHighLevel? You will need to re-authenticate.')) {
      return;
    }

    window.GHLConfig.clear();
    showToast('Disconnected from GoHighLevel', 'success');

    updateConnectionStatus();
    closeSettings();
  }

  /**
   * Update connection status display
   */
  function updateConnectionStatus() {
    var statusEl = document.getElementById('ghlConnectionStatus');
    if (!statusEl) return;

    var isConfigured = window.GHLConfig.isConfigured();
    var isAuthenticated = window.GHLConfig.isAuthenticated();
    var isTokenValid = window.GHLClient.isTokenValid();

    var status = '';
    var className = '';

    if (isAuthenticated && isTokenValid) {
      status = '✓ Connected and authenticated';
      className = 'status-success';
    } else if (isConfigured) {
      status = '⚠ Configured but not authenticated';
      className = 'status-warning';
    } else {
      status = '✗ Not configured';
      className = 'status-error';
    }

    statusEl.textContent = status;
    statusEl.className = 'connection-status ' + className;
  }

  /**
   * Update queue count
   */
  function updateQueueCount() {
    var countEl = document.getElementById('ghlQueueCount');
    if (!countEl) return;

    var count = window.GHLClient.getQueueLength();
    countEl.textContent = count + ' request' + (count === 1 ? '' : 's') + ' pending';
  }

  /**
   * Update status info
   */
  function updateStatusInfo() {
    var statusEl = document.getElementById('ghlStatusInfo');
    if (!statusEl) return;

    var html = '<table class="status-table">';

    html += '<tr><th>Configured:</th><td>' + (window.GHLConfig.isConfigured() ? 'Yes' : 'No') + '</td></tr>';
    html += '<tr><th>Authenticated:</th><td>' + (window.GHLConfig.isAuthenticated() ? 'Yes' : 'No') + '</td></tr>';
    html += '<tr><th>Token Valid:</th><td>' + (window.GHLClient.isTokenValid() ? 'Yes' : 'No') + '</td></tr>';
    html += '<tr><th>Queue Length:</th><td>' + window.GHLClient.getQueueLength() + '</td></tr>';

    if (GHL_CONFIG.lastSync.contacts) {
      html += '<tr><th>Last Contact Sync:</th><td>' + new Date(GHL_CONFIG.lastSync.contacts).toLocaleString() + '</td></tr>';
    }

    if (GHL_CONFIG.lastSync.opportunities) {
      html += '<tr><th>Last Quote Sync:</th><td>' + new Date(GHL_CONFIG.lastSync.opportunities).toLocaleString() + '</td></tr>';
    }

    html += '</table>';

    statusEl.innerHTML = html;
  }

  /**
   * Start periodic status updates
   */
  function startSyncStatusUpdates() {
    _syncStatusInterval = setInterval(function() {
      if (_settingsModal && _settingsModal.classList.contains('active')) {
        updateQueueCount();
        updateStatusInfo();
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Show toast notification
   */
  function showToast(message, type) {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlUI', {
      openSettings: openSettings,
      closeSettings: closeSettings
    });
  }

  // Make globally available
  window.GHLUI = {
    openSettings: openSettings,
    closeSettings: closeSettings
  };

  console.log('[GHL-UI] Module loaded');
})();
