// webhook-debug.js - Webhook Testing and Debug Utilities
// Dependencies: webhook-processor.js, ghl-webhook-setup.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[WEBHOOK-DEBUG] Skipped in test mode');
    return;
  }

  /**
   * Simulate webhook event
   */
  function simulateEvent(eventType, data) {
    console.log('[WEBHOOK-DEBUG] Simulating event:', eventType);

    var event = {
      id: 'sim_' + Date.now(),
      eventType: eventType,
      timestamp: new Date().toISOString()
    };

    // Add event-specific data
    switch (eventType) {
      case 'contact-updated':
        event.contact = data || {
          id: 'test_contact_' + Date.now(),
          name: 'Test Client',
          email: 'test@example.com',
          phone: '0400000000',
          address: {
            street: '123 Test St',
            city: 'Perth',
            state: 'WA',
            postcode: '6000'
          }
        };
        break;

      case 'opportunity-updated':
        event.opportunity = data || {
          id: 'test_opp_' + Date.now(),
          contactId: 'test_contact_123',
          name: 'Test Quote',
          value: 500,
          status: 'open'
        };
        break;

      case 'task-updated':
        event.task = data || {
          id: 'test_task_' + Date.now(),
          title: 'Test Task',
          description: 'Follow up on quote',
          completed: false,
          dueDate: new Date(Date.now() + 86400000).toISOString()
        };
        break;

      case 'note-created':
        event.note = data || {
          id: 'test_note_' + Date.now(),
          contactId: 'test_contact_123',
          body: 'This is a test note created for debugging',
          createdAt: new Date().toISOString()
        };
        break;

      case 'message-received':
        event.message = data || {
          id: 'test_msg_' + Date.now(),
          contactId: 'test_contact_123',
          type: 'sms',
          body: 'Test message from client',
          receivedAt: new Date().toISOString()
        };
        break;

      default:
        console.warn('[WEBHOOK-DEBUG] Unknown event type:', eventType);
        return;
    }

    // Queue event
    if (window.WebhookProcessor) {
      window.WebhookProcessor.queueEvent(event);
      window.WebhookProcessor.processEventQueue();
      console.log('[WEBHOOK-DEBUG] Event queued and processing started');
    } else {
      console.error('[WEBHOOK-DEBUG] WebhookProcessor not available');
    }
  }

  /**
   * View event queue
   */
  function viewQueue() {
    if (!window.WebhookProcessor) {
      console.error('[WEBHOOK-DEBUG] WebhookProcessor not available');
      return;
    }

    var status = window.WebhookProcessor.getSyncStatus();

    console.log('[WEBHOOK-DEBUG] Event Queue Status:');
    console.log('- Queue length:', status.queueLength);
    console.log('- Processing:', status.processing);
    console.log('- Last event ID:', status.lastEventId);
    console.log('- Polling active:', status.polling);
    console.log('- Webhooks enabled:', status.enabled);

    return status;
  }

  /**
   * Clear event queue
   */
  function clearQueue() {
    try {
      localStorage.removeItem('tts_webhook_queue');
      console.log('[WEBHOOK-DEBUG] Event queue cleared');
      return true;
    } catch (e) {
      console.error('[WEBHOOK-DEBUG] Failed to clear queue:', e);
      return false;
    }
  }

  /**
   * Test webhook endpoint
   */
  function testEndpoint() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-DEBUG] GHLWebhookSetup not available');
      return;
    }

    console.log('[WEBHOOK-DEBUG] Testing webhook endpoint...');

    window.GHLWebhookSetup.testWebhook(function(error, result) {
      if (error) {
        console.error('[WEBHOOK-DEBUG] Test failed:', error);
      } else {
        console.log('[WEBHOOK-DEBUG] Test successful:', result);
      }
    });
  }

  /**
   * View webhook configuration
   */
  function viewConfig() {
    if (!window.WebhookProcessor) {
      console.error('[WEBHOOK-DEBUG] WebhookProcessor not available');
      return;
    }

    var config = window.WebhookProcessor.getConfig();

    console.log('[WEBHOOK-DEBUG] Webhook Configuration:');
    console.log('- Webhook URL:', config.webhookUrl || '(not set)');
    console.log('- Webhook ID:', config.webhookId || '(not registered)');
    console.log('- Enabled:', config.features.enabled);
    console.log('- Auto sync:', config.features.autoSync);
    console.log('- Bidirectional:', config.features.bidirectionalSync);
    console.log('- Conflict resolution:', config.features.conflictResolution);
    console.log('- Deduplicate:', config.features.deduplicate);
    console.log('- Subscribed events:', config.subscribedEvents);
    console.log('- Batch size:', config.processing.batchSize);
    console.log('- Batch delay:', config.processing.batchDelay);
    console.log('- Retry attempts:', config.processing.retryAttempts);

    return config;
  }

  /**
   * Reset webhook configuration
   */
  function resetConfig() {
    try {
      localStorage.removeItem('tts_webhook_config');
      localStorage.removeItem('tts_webhook_last_event');
      console.log('[WEBHOOK-DEBUG] Configuration reset');
      return true;
    } catch (e) {
      console.error('[WEBHOOK-DEBUG] Failed to reset config:', e);
      return false;
    }
  }

  /**
   * List all webhooks registered with GHL
   */
  function listWebhooks() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-DEBUG] GHLWebhookSetup not available');
      return;
    }

    console.log('[WEBHOOK-DEBUG] Listing webhooks...');

    window.GHLWebhookSetup.listWebhooks(function(error, webhooks) {
      if (error) {
        console.error('[WEBHOOK-DEBUG] List failed:', error);
      } else {
        console.log('[WEBHOOK-DEBUG] Found ' + webhooks.length + ' webhooks:');
        for (var i = 0; i < webhooks.length; i++) {
          console.log('- ID:', webhooks[i].id);
          console.log('  URL:', webhooks[i].url);
          console.log('  Active:', webhooks[i].active);
          console.log('  Events:', webhooks[i].events.join(', '));
          console.log('');
        }
      }
    });
  }

  /**
   * Verify webhook configuration with GHL
   */
  function verifyWebhook() {
    if (!window.GHLWebhookSetup) {
      console.error('[WEBHOOK-DEBUG] GHLWebhookSetup not available');
      return;
    }

    console.log('[WEBHOOK-DEBUG] Verifying webhook...');

    window.GHLWebhookSetup.verifyWebhook(function(error, verification) {
      if (error) {
        console.error('[WEBHOOK-DEBUG] Verification failed:', error);
      } else {
        console.log('[WEBHOOK-DEBUG] Verification result:');
        console.log('- ID:', verification.id);
        console.log('- URL:', verification.url);
        console.log('- Active:', verification.active);
        console.log('- Valid:', verification.isValid);
        console.log('- Events:', verification.events.join(', '));
      }
    });
  }

  /**
   * Generate test data for simulation
   */
  function generateTestContact() {
    return {
      id: 'test_contact_' + Date.now(),
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '0412345678',
      address: {
        street: '456 Main Street',
        city: 'Perth',
        state: 'WA',
        postcode: '6000'
      }
    };
  }

  /**
   * Generate test opportunity
   */
  function generateTestOpportunity() {
    return {
      id: 'test_opp_' + Date.now(),
      contactId: 'test_contact_123',
      name: 'Window Cleaning Quote',
      value: 450,
      status: 'open',
      stage: 'quote_sent'
    };
  }

  /**
   * Generate test task
   */
  function generateTestTask() {
    return {
      id: 'test_task_' + Date.now(),
      title: 'Follow up on quote',
      description: 'Call client to discuss quote and answer questions',
      completed: false,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      contactId: 'test_contact_123'
    };
  }

  /**
   * Run full integration test
   */
  function runIntegrationTest() {
    console.log('[WEBHOOK-DEBUG] Running integration test...');

    // Test 1: Endpoint test
    console.log('[WEBHOOK-DEBUG] Test 1: Testing webhook endpoint...');
    testEndpoint();

    // Test 2: Simulate contact update
    setTimeout(function() {
      console.log('[WEBHOOK-DEBUG] Test 2: Simulating contact update...');
      simulateEvent('contact-updated', generateTestContact());
    }, 2000);

    // Test 3: Simulate opportunity update
    setTimeout(function() {
      console.log('[WEBHOOK-DEBUG] Test 3: Simulating opportunity update...');
      simulateEvent('opportunity-updated', generateTestOpportunity());
    }, 4000);

    // Test 4: Simulate task update
    setTimeout(function() {
      console.log('[WEBHOOK-DEBUG] Test 4: Simulating task update...');
      simulateEvent('task-updated', generateTestTask());
    }, 6000);

    // Test 5: View queue status
    setTimeout(function() {
      console.log('[WEBHOOK-DEBUG] Test 5: Viewing queue status...');
      viewQueue();
    }, 8000);

    console.log('[WEBHOOK-DEBUG] Integration test started. Check console for results.');
  }

  /**
   * Export webhook logs for debugging
   */
  function exportLogs() {
    var logs = {
      timestamp: new Date().toISOString(),
      config: viewConfig(),
      queueStatus: viewQueue(),
      eventQueue: []
    };

    // Get event queue from localStorage
    try {
      var queueData = localStorage.getItem('tts_webhook_queue');
      if (queueData) {
        logs.eventQueue = JSON.parse(queueData);
      }
    } catch (e) {
      console.error('[WEBHOOK-DEBUG] Failed to get event queue:', e);
    }

    // Convert to JSON
    var json = JSON.stringify(logs, null, 2);

    console.log('[WEBHOOK-DEBUG] Webhook logs:');
    console.log(json);

    // Download as file
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'webhook-debug-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);

    console.log('[WEBHOOK-DEBUG] Logs exported');
  }

  /**
   * Show help message
   */
  function help() {
    console.log('[WEBHOOK-DEBUG] Webhook Debug Utilities');
    console.log('');
    console.log('Available Commands:');
    console.log('');
    console.log('  WebhookDebug.simulateEvent(type, data)  - Simulate webhook event');
    console.log('    Types: contact-updated, opportunity-updated, task-updated, note-created, message-received');
    console.log('');
    console.log('  WebhookDebug.viewQueue()                - View event queue status');
    console.log('  WebhookDebug.clearQueue()               - Clear event queue');
    console.log('  WebhookDebug.testEndpoint()             - Test webhook endpoint');
    console.log('  WebhookDebug.viewConfig()               - View webhook configuration');
    console.log('  WebhookDebug.resetConfig()              - Reset webhook configuration');
    console.log('  WebhookDebug.listWebhooks()             - List GHL webhooks');
    console.log('  WebhookDebug.verifyWebhook()            - Verify webhook with GHL');
    console.log('  WebhookDebug.runIntegrationTest()       - Run full integration test');
    console.log('  WebhookDebug.exportLogs()               - Export debug logs');
    console.log('  WebhookDebug.help()                     - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  // Simulate contact update');
    console.log('  WebhookDebug.simulateEvent("contact-updated");');
    console.log('');
    console.log('  // Simulate opportunity won');
    console.log('  WebhookDebug.simulateEvent("opportunity-updated", {');
    console.log('    id: "opp_123",');
    console.log('    status: "won"');
    console.log('  });');
    console.log('');
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var WebhookDebug = {
    // Event simulation
    simulateEvent: simulateEvent,

    // Queue management
    viewQueue: viewQueue,
    clearQueue: clearQueue,

    // Configuration
    viewConfig: viewConfig,
    resetConfig: resetConfig,

    // Testing
    testEndpoint: testEndpoint,
    listWebhooks: listWebhooks,
    verifyWebhook: verifyWebhook,
    runIntegrationTest: runIntegrationTest,

    // Utilities
    exportLogs: exportLogs,
    help: help,

    // Test data generators
    generateTestContact: generateTestContact,
    generateTestOpportunity: generateTestOpportunity,
    generateTestTask: generateTestTask
  };

  // Make globally available
  window.WebhookDebug = WebhookDebug;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('webhookDebug', WebhookDebug);
  }

  console.log('[WEBHOOK-DEBUG] Module loaded');
  console.log('[WEBHOOK-DEBUG] Type WebhookDebug.help() for usage information');
})();
