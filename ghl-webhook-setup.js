// ghl-webhook-setup.js - GoHighLevel Webhook Registration
// Dependencies: ghl-client.js, webhook-processor.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * GHL Webhook Event Types
   */
  var GHL_WEBHOOK_EVENTS = {
    // Contact events
    CONTACT_CREATE: 'ContactCreate',
    CONTACT_UPDATE: 'ContactUpdate',
    CONTACT_DELETE: 'ContactDelete',

    // Opportunity events
    OPPORTUNITY_CREATE: 'OpportunityCreate',
    OPPORTUNITY_UPDATE: 'OpportunityUpdate',
    OPPORTUNITY_DELETE: 'OpportunityDelete',
    OPPORTUNITY_STATUS_UPDATE: 'OpportunityStatusUpdate',
    OPPORTUNITY_STAGE_UPDATE: 'OpportunityStageUpdate',

    // Task events
    TASK_CREATE: 'TaskCreate',
    TASK_UPDATE: 'TaskUpdate',
    TASK_DELETE: 'TaskDelete',
    TASK_COMPLETE: 'TaskComplete',

    // Note events
    NOTE_CREATE: 'NoteCreate',
    NOTE_UPDATE: 'NoteUpdate',
    NOTE_DELETE: 'NoteDelete',

    // Appointment events
    APPOINTMENT_CREATE: 'AppointmentCreate',
    APPOINTMENT_UPDATE: 'AppointmentUpdate',
    APPOINTMENT_DELETE: 'AppointmentDelete',

    // Message events (SMS/Email)
    INBOUND_MESSAGE: 'InboundMessage',
    OUTBOUND_MESSAGE: 'OutboundMessage',

    // Workflow events
    WORKFLOW_START: 'WorkflowStart',
    WORKFLOW_COMPLETE: 'WorkflowComplete'
  };

  /**
   * Register webhook with GHL
   */
  function registerWebhook(callback) {
    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookUrl) {
      var error = new Error('Webhook URL not configured');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    if (!window.GHLClient) {
      var error2 = new Error('GHL Client not available');
      console.error('[GHL-WEBHOOK]', error2.message);
      if (callback) callback(error2);
      return;
    }

    var ghlConfig = window.GHLClient.getConfig();

    var webhookData = {
      url: config.webhookUrl,
      events: config.subscribedEvents,
      locationId: ghlConfig.locationId
    };

    console.log('[GHL-WEBHOOK] Registering webhook...');

    window.GHLClient.makeRequest('POST', '/webhooks/', webhookData, function(error, response) {
      if (error) {
        console.error('[GHL-WEBHOOK] Registration failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-WEBHOOK] Webhook registered:', response.webhook.id);

      // Save webhook ID
      config.webhookId = response.webhook.id;
      window.WebhookProcessor.updateConfig(config);

      if (callback) callback(null, response.webhook);
    });
  }

  /**
   * Update webhook subscription
   */
  function updateWebhook(callback) {
    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookId) {
      // Register new webhook
      console.log('[GHL-WEBHOOK] No webhook ID, registering new webhook');
      registerWebhook(callback);
      return;
    }

    if (!window.GHLClient) {
      var error = new Error('GHL Client not available');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    var webhookData = {
      url: config.webhookUrl,
      events: config.subscribedEvents
    };

    var endpoint = '/webhooks/' + config.webhookId;

    console.log('[GHL-WEBHOOK] Updating webhook...');

    window.GHLClient.makeRequest('PUT', endpoint, webhookData, function(error, response) {
      if (error) {
        console.error('[GHL-WEBHOOK] Update failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-WEBHOOK] Webhook updated');

      if (callback) callback(null, response.webhook);
    });
  }

  /**
   * Delete webhook
   */
  function deleteWebhook(callback) {
    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookId) {
      var error = new Error('No webhook registered');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    if (!window.GHLClient) {
      var error2 = new Error('GHL Client not available');
      console.error('[GHL-WEBHOOK]', error2.message);
      if (callback) callback(error2);
      return;
    }

    var endpoint = '/webhooks/' + config.webhookId;

    console.log('[GHL-WEBHOOK] Deleting webhook...');

    window.GHLClient.makeRequest('DELETE', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-WEBHOOK] Delete failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-WEBHOOK] Webhook deleted');

      // Clear webhook ID
      config.webhookId = null;
      window.WebhookProcessor.updateConfig(config);

      if (callback) callback(null);
    });
  }

  /**
   * Test webhook endpoint
   */
  function testWebhook(callback) {
    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookUrl) {
      var error = new Error('Webhook URL not configured');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    console.log('[GHL-WEBHOOK] Testing webhook endpoint...');

    // Send test event to webhook
    var testEvent = {
      type: 'test',
      id: 'test_' + Date.now(),
      timestamp: new Date().toISOString(),
      data: {
        message: 'Test event from TicTacStick'
      }
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', config.webhookUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        console.log('[GHL-WEBHOOK] Test successful');
        if (callback) callback(null, { success: true });
      } else {
        console.error('[GHL-WEBHOOK] Test failed:', xhr.status);
        if (callback) callback(new Error('Test failed with status: ' + xhr.status));
      }
    };

    xhr.onerror = function() {
      console.error('[GHL-WEBHOOK] Test error');
      if (callback) callback(new Error('Network error'));
    };

    xhr.send(JSON.stringify(testEvent));
  }

  /**
   * List all webhooks
   */
  function listWebhooks(callback) {
    if (!window.GHLClient) {
      var error = new Error('GHL Client not available');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    console.log('[GHL-WEBHOOK] Listing webhooks...');

    window.GHLClient.makeRequest('GET', '/webhooks/', null, function(error, response) {
      if (error) {
        console.error('[GHL-WEBHOOK] List failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-WEBHOOK] Found ' + response.webhooks.length + ' webhooks');

      if (callback) callback(null, response.webhooks);
    });
  }

  /**
   * Get webhook details
   */
  function getWebhook(webhookId, callback) {
    if (!window.GHLClient) {
      var error = new Error('GHL Client not available');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    var endpoint = '/webhooks/' + webhookId;

    console.log('[GHL-WEBHOOK] Getting webhook details...');

    window.GHLClient.makeRequest('GET', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-WEBHOOK] Get failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-WEBHOOK] Webhook retrieved');

      if (callback) callback(null, response.webhook);
    });
  }

  /**
   * Verify webhook is configured correctly
   */
  function verifyWebhook(callback) {
    var config = window.WebhookProcessor.getConfig();

    if (!config.webhookId) {
      var error = new Error('No webhook registered');
      console.error('[GHL-WEBHOOK]', error.message);
      if (callback) callback(error);
      return;
    }

    getWebhook(config.webhookId, function(error, webhook) {
      if (error) {
        if (callback) callback(error);
        return;
      }

      // Verify webhook is active and configured correctly
      var verification = {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        isValid: webhook.url === config.webhookUrl
      };

      console.log('[GHL-WEBHOOK] Verification result:', verification);

      if (callback) callback(null, verification);
    });
  }

  /**
   * Get available event types
   */
  function getEventTypes() {
    var eventTypes = [];
    for (var key in GHL_WEBHOOK_EVENTS) {
      if (GHL_WEBHOOK_EVENTS.hasOwnProperty(key)) {
        eventTypes.push({
          key: key,
          value: GHL_WEBHOOK_EVENTS[key],
          name: formatEventName(key)
        });
      }
    }
    return eventTypes;
  }

  /**
   * Format event name for display
   */
  function formatEventName(key) {
    return key
      .split('_')
      .map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var GHLWebhookSetup = {
    // Event types
    EVENTS: GHL_WEBHOOK_EVENTS,

    // Core operations
    registerWebhook: registerWebhook,
    updateWebhook: updateWebhook,
    deleteWebhook: deleteWebhook,
    testWebhook: testWebhook,

    // Information
    listWebhooks: listWebhooks,
    getWebhook: getWebhook,
    verifyWebhook: verifyWebhook,
    getEventTypes: getEventTypes
  };

  // Make globally available
  window.GHLWebhookSetup = GHLWebhookSetup;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlWebhookSetup', GHLWebhookSetup);
  }

  console.log('[GHL-WEBHOOK] Module loaded');
})();
