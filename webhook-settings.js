// webhook-settings.js - Webhook Settings UI Controller
// Dependencies: webhook-processor.js, ghl-webhook-setup.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var _syncStatusInterval = null;

  /**
   * Initialize settings page
   */
  function init() {
    loadSettings();
    updateSyncStatus();

    // Update sync status every 30 seconds
    _syncStatusInterval = setInterval(updateSyncStatus, 30000);

    console.log('[WEBHOOK-SETTINGS] Initialized');
  }

  /**
   * Cleanup on page unload
   */
  function cleanup() {
    if (_syncStatusInterval) {
      clearInterval(_syncStatusInterval);
      _syncStatusInterval = null;
    }
  }

  /**
   * Load settings from config
   */
  function loadSettings() {
    var config = window.WebhookProcessor.getConfig();

    // Load basic settings
    var urlInput = document.getElementById('webhook-url');
    var secretInput = document.getElementById('webhook-secret');
    var enabledCheckbox = document.getElementById('webhook-enabled');
    var bidirectionalCheckbox = document.getElementById('bidirectional-sync');
    var conflictSelect = document.getElementById('conflict-resolution');

    if (urlInput) urlInput.value = config.webhookUrl || '';
    if (secretInput) secretInput.value = config.webhookSecret || '';
    if (enabledCheckbox) enabledCheckbox.checked = config.features.enabled;
    if (bidirectionalCheckbox) bidirectionalCheckbox.checked = config.features.bidirectionalSync;
    if (conflictSelect) conflictSelect.value = config.features.conflictResolution;

    // Load event subscriptions
    var checkboxes = document.querySelectorAll('.event-subscriptions-grid input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
      var checkbox = checkboxes[i];
      var eventType = checkbox.value;
      var isSubscribed = config.subscribedEvents.indexOf(eventType) > -1;
      checkbox.checked = isSubscribed;
    }

    console.log('[WEBHOOK-SETTINGS] Settings loaded');
  }

  /**
   * Save settings
   */
  function saveSettings() {
    var urlInput = document.getElementById('webhook-url');
    var secretInput = document.getElementById('webhook-secret');
    var enabledCheckbox = document.getElementById('webhook-enabled');
    var bidirectionalCheckbox = document.getElementById('bidirectional-sync');
    var conflictSelect = document.getElementById('conflict-resolution');

    if (!urlInput || !secretInput || !enabledCheckbox || !bidirectionalCheckbox || !conflictSelect) {
      console.error('[WEBHOOK-SETTINGS] Required inputs not found');
      return;
    }

    var webhookUrl = urlInput.value.trim();
    var webhookSecret = secretInput.value.trim();
    var enabled = enabledCheckbox.checked;
    var bidirectionalSync = bidirectionalCheckbox.checked;
    var conflictResolution = conflictSelect.value;

    // Validate webhook URL
    if (enabled && !webhookUrl) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Webhook URL is required', 'error');
      }
      return;
    }

    // Validate URL format
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Invalid webhook URL format', 'error');
      }
      return;
    }

    // Collect subscribed events
    var subscribedEvents = [];
    var checkboxes = document.querySelectorAll('.event-subscriptions-grid input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        subscribedEvents.push(checkboxes[i].value);
      }
    }

    if (enabled && subscribedEvents.length === 0) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Please select at least one event type', 'error');
      }
      return;
    }

    // Update configuration
    var updates = {
      webhookUrl: webhookUrl,
      webhookSecret: webhookSecret,
      subscribedEvents: subscribedEvents,
      features: {
        enabled: enabled,
        bidirectionalSync: bidirectionalSync,
        conflictResolution: conflictResolution
      }
    };

    window.WebhookProcessor.updateConfig(updates);

    // Show success message
    if (window.UIComponents) {
      window.UIComponents.showToast('Webhook settings saved', 'success');
    }

    // Update sync status
    updateSyncStatus();

    console.log('[WEBHOOK-SETTINGS] Settings saved');
  }

  /**
   * Validate URL format
   */
  function isValidUrl(string) {
    try {
      // Basic URL validation
      if (!string.match(/^https?:\/\/.+/)) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Update sync status display
   */
  function updateSyncStatus() {
    var status = window.WebhookProcessor.getSyncStatus();

    // Update status indicator
    var statusEl = document.getElementById('sync-status');
    if (statusEl) {
      if (status.enabled && status.polling) {
        statusEl.innerHTML = '<span class="status-dot status-dot-success"></span> Active';
      } else if (status.enabled && !status.polling) {
        statusEl.innerHTML = '<span class="status-dot status-dot-warning"></span> Starting...';
      } else {
        statusEl.innerHTML = '<span class="status-dot status-dot-neutral"></span> Disabled';
      }
    }

    // Update pending events
    var pendingEl = document.getElementById('pending-events');
    if (pendingEl) {
      pendingEl.textContent = status.queueLength;
    }

    // Update last sync time
    var lastSyncEl = document.getElementById('last-sync-time');
    if (lastSyncEl && status.lastEventId) {
      lastSyncEl.textContent = 'Recently synced';
    } else if (lastSyncEl) {
      lastSyncEl.textContent = 'Never';
    }

    // Update processing indicator
    if (status.processing) {
      var processingEl = document.getElementById('sync-processing');
      if (processingEl) {
        processingEl.style.display = 'block';
      }
    } else {
      var processingEl2 = document.getElementById('sync-processing');
      if (processingEl2) {
        processingEl2.style.display = 'none';
      }
    }
  }

  /**
   * Trigger manual sync
   */
  function triggerManualSync() {
    if (!window.WebhookProcessor) {
      console.error('[WEBHOOK-SETTINGS] WebhookProcessor not available');
      return;
    }

    var config = window.WebhookProcessor.getConfig();

    if (!config.features.enabled) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Webhooks are disabled', 'warning');
      }
      return;
    }

    if (!config.webhookUrl) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Webhook URL not configured', 'error');
      }
      return;
    }

    if (window.UIComponents) {
      window.UIComponents.showLoading('Syncing...');
    }

    window.WebhookProcessor.syncNow();

    setTimeout(function() {
      if (window.UIComponents) {
        window.UIComponents.hideLoading();
      }
      updateSyncStatus();
      if (window.UIComponents) {
        window.UIComponents.showToast('Sync completed', 'success');
      }
    }, 2000);
  }

  /**
   * Test webhook endpoint
   */
  function testWebhookEndpoint() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-SETTINGS] GHLWebhookSetup not available');
      return;
    }

    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookUrl) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Webhook URL not configured', 'error');
      }
      return;
    }

    if (window.UIComponents) {
      window.UIComponents.showLoading('Testing webhook endpoint...');
    }

    window.GHLWebhookSetup.testWebhook(function(error, result) {
      if (window.UIComponents) {
        window.UIComponents.hideLoading();
      }

      if (error) {
        console.error('[WEBHOOK-SETTINGS] Test failed:', error);
        if (window.UIComponents) {
          window.UIComponents.showToast('Webhook test failed: ' + error.message, 'error');
        }
      } else {
        console.log('[WEBHOOK-SETTINGS] Test successful');
        if (window.UIComponents) {
          window.UIComponents.showToast('Webhook endpoint is working correctly', 'success');
        }
      }
    });
  }

  /**
   * Register webhook with GHL
   */
  function registerWebhookWithGHL() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-SETTINGS] GHLWebhookSetup not available');
      return;
    }

    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookUrl) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Please save webhook settings first', 'error');
      }
      return;
    }

    if (window.UIComponents) {
      window.UIComponents.showLoading('Registering webhook with GoHighLevel...');
    }

    window.GHLWebhookSetup.registerWebhook(function(error, webhook) {
      if (window.UIComponents) {
        window.UIComponents.hideLoading();
      }

      if (error) {
        console.error('[WEBHOOK-SETTINGS] Registration failed:', error);
        if (window.UIComponents) {
          window.UIComponents.showToast('Webhook registration failed: ' + error.message, 'error');
        }
      } else {
        console.log('[WEBHOOK-SETTINGS] Webhook registered:', webhook.id);
        if (window.UIComponents) {
          window.UIComponents.showToast('Webhook registered successfully!', 'success');
        }

        // Reload settings to show webhook ID
        loadSettings();
      }
    });
  }

  /**
   * Unregister webhook from GHL
   */
  function unregisterWebhookFromGHL() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-SETTINGS] GHLWebhookSetup not available');
      return;
    }

    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookId) {
      if (window.UIComponents) {
        window.UIComponents.showToast('No webhook registered', 'warning');
      }
      return;
    }

    // Confirm deletion
    if (window.UIComponents && window.UIComponents.showConfirm) {
      window.UIComponents.showConfirm({
        title: 'Unregister Webhook?',
        message: 'This will stop receiving real-time updates from GoHighLevel.',
        confirmText: 'Unregister',
        danger: true,
        onConfirm: function() {
          performUnregister();
        }
      });
    } else {
      if (confirm('Unregister webhook? This will stop receiving real-time updates.')) {
        performUnregister();
      }
    }

    function performUnregister() {
      if (window.UIComponents) {
        window.UIComponents.showLoading('Unregistering webhook...');
      }

      window.GHLWebhookSetup.deleteWebhook(function(error) {
        if (window.UIComponents) {
          window.UIComponents.hideLoading();
        }

        if (error) {
          console.error('[WEBHOOK-SETTINGS] Unregister failed:', error);
          if (window.UIComponents) {
            window.UIComponents.showToast('Webhook unregister failed: ' + error.message, 'error');
          }
        } else {
          console.log('[WEBHOOK-SETTINGS] Webhook unregistered');
          if (window.UIComponents) {
            window.UIComponents.showToast('Webhook unregistered', 'success');
          }

          // Reload settings
          loadSettings();
        }
      });
    }
  }

  /**
   * View webhook event queue
   */
  function viewEventQueue() {
    var status = window.WebhookProcessor.getSyncStatus();

    var message = 'Event Queue Status:\n\n';
    message += 'Pending Events: ' + status.queueLength + '\n';
    message += 'Processing: ' + (status.processing ? 'Yes' : 'No') + '\n';
    message += 'Last Event ID: ' + (status.lastEventId || 'None') + '\n';
    message += 'Polling: ' + (status.polling ? 'Active' : 'Inactive');

    if (window.UIComponents && window.UIComponents.showAlert) {
      window.UIComponents.showAlert({
        title: 'Event Queue',
        message: message,
        buttonText: 'OK'
      });
    } else {
      alert(message);
    }
  }

  /**
   * Clear event queue
   */
  function clearEventQueue() {
    if (window.UIComponents && window.UIComponents.showConfirm) {
      window.UIComponents.showConfirm({
        title: 'Clear Event Queue?',
        message: 'This will delete all pending webhook events. This action cannot be undone.',
        confirmText: 'Clear Queue',
        danger: true,
        onConfirm: function() {
          performClear();
        }
      });
    } else {
      if (confirm('Clear event queue? This will delete all pending events.')) {
        performClear();
      }
    }

    function performClear() {
      try {
        localStorage.removeItem('tts_webhook_queue');
        console.log('[WEBHOOK-SETTINGS] Event queue cleared');
        if (window.UIComponents) {
          window.UIComponents.showToast('Event queue cleared', 'success');
        }
        updateSyncStatus();
      } catch (e) {
        console.error('[WEBHOOK-SETTINGS] Failed to clear queue:', e);
        if (window.UIComponents) {
          window.UIComponents.showToast('Failed to clear queue', 'error');
        }
      }
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var WebhookSettings = {
    init: init,
    cleanup: cleanup,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    updateSyncStatus: updateSyncStatus,
    triggerManualSync: triggerManualSync,
    testWebhookEndpoint: testWebhookEndpoint,
    registerWebhookWithGHL: registerWebhookWithGHL,
    unregisterWebhookFromGHL: unregisterWebhookFromGHL,
    viewEventQueue: viewEventQueue,
    clearEventQueue: clearEventQueue
  };

  // Make globally available
  window.WebhookSettings = WebhookSettings;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('webhookSettings', WebhookSettings);
  }

  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-webhook-settings')) {
      WebhookSettings.init();
    }
  });

  console.log('[WEBHOOK-SETTINGS] Module loaded');
})();
