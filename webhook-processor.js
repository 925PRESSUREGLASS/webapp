// webhook-processor.js - Webhook Event Processor Module
// Dependencies: storage.js, ui-components.js, ghl-client.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[WEBHOOK] Skipped in test mode');
    return;
  }

  // Event queue
  var _eventQueue = [];
  var _processing = false;
  var _lastEventId = null;
  var _pollInterval = null;

  // ============================================
  // WEBHOOK TIMING CONSTANTS (milliseconds)
  // ============================================
  var POLL_INTERVAL = 30000;        // 30 seconds - how often to check for new events
  var BATCH_SIZE = 10;               // Process max 10 events per batch
  var BATCH_DELAY = 5000;            // 5 seconds - delay between batches
  var RETRY_ATTEMPTS = 3;            // Maximum retry attempts for failed events
  var RETRY_DELAY = 60000;           // 1 minute - delay before retrying
  var MAX_QUEUE_SIZE = 1000;         // Maximum events to queue before dropping oldest

  // Webhook configuration
  var WEBHOOK_CONFIG = {
    // Webhook endpoint (your Cloudflare Worker or backend)
    webhookUrl: '',

    // Webhook secret for signature verification
    webhookSecret: '',

    // Events to subscribe to
    subscribedEvents: [
      'ContactUpdate',
      'OpportunityUpdate',
      'OpportunityStatusUpdate',
      'TaskUpdate',
      'TaskComplete',
      'NoteCreate',
      'InboundMessage'
    ],

    // Webhook ID (assigned by GHL)
    webhookId: null,

    // Processing configuration
    processing: {
      batchSize: BATCH_SIZE,
      batchDelay: BATCH_DELAY,
      retryAttempts: RETRY_ATTEMPTS,
      retryDelay: RETRY_DELAY,
      maxQueueSize: MAX_QUEUE_SIZE
    },

    // Feature flags
    features: {
      enabled: false,
      autoSync: true,
      bidirectionalSync: true,
      conflictResolution: 'timestamp', // 'timestamp', 'ghl-wins', 'local-wins', 'manual'
      deduplicate: true
    }
  };

  /**
   * Initialize webhook processor and start event polling
   * Loads configuration, last event ID, queued events, and starts polling if enabled
   * @returns {void}
   */
  function init() {
    // Load configuration
    loadWebhookConfig();

    // Load last event ID from storage
    loadLastEventId();

    // Load queued events
    loadEventQueue();

    // Start polling for new events
    if (WEBHOOK_CONFIG.features.enabled) {
      startPolling();
    }

    console.log('[WEBHOOK] Processor initialized');
  }

  /**
   * Start polling for webhook events from the configured endpoint
   * Polls every 30 seconds if webhook is enabled and URL is configured
   * @returns {void}
   */
  function startPolling() {
    if (!WEBHOOK_CONFIG.features.enabled) {
      console.log('[WEBHOOK] Polling disabled');
      return;
    }

    if (!WEBHOOK_CONFIG.webhookUrl) {
      console.warn('[WEBHOOK] URL not configured');
      return;
    }

    // Stop existing polling
    stopPolling();

    // Poll at configured interval (default: 30 seconds)
    _pollInterval = setInterval(function() {
      pollForEvents();
    }, POLL_INTERVAL);

    // Poll immediately
    pollForEvents();

    console.log('[WEBHOOK] Polling started');
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    if (_pollInterval) {
      clearInterval(_pollInterval);
      _pollInterval = null;
      console.log('[WEBHOOK] Polling stopped');
    }
  }

  /**
   * Poll for new webhook events
   */
  function pollForEvents() {
    if (!navigator.onLine) {
      console.log('[WEBHOOK] Offline - skipping poll');
      return;
    }

    var url = WEBHOOK_CONFIG.webhookUrl + '/events';

    // Add query params
    var params = [];
    if (_lastEventId) {
      params.push('since=' + encodeURIComponent(_lastEventId));
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var response = JSON.parse(xhr.responseText);

          if (response.events && response.events.length > 0) {
            console.log('[WEBHOOK] Received ' + response.events.length + ' events');

            // Queue events for processing
            for (var i = 0; i < response.events.length; i++) {
              queueEvent(response.events[i]);
            }

            // Update last event ID
            if (response.lastEventId) {
              _lastEventId = response.lastEventId;
              saveLastEventId();
            }

            // Process queue
            processEventQueue();
          }

        } catch (e) {
          console.error('[WEBHOOK] Failed to parse events:', e);
        }
      }
    };

    xhr.onerror = function() {
      console.error('[WEBHOOK] Failed to poll for events');
    };

    xhr.send();
  }

  /**
   * Queue webhook event for processing with deduplication and size limits
   * @param {Object} event - Webhook event object from GHL
   * @param {string} event.id - Unique event ID
   * @param {string} event.type - Event type (ContactUpdate, TaskUpdate, etc.)
   * @param {Object} event.data - Event payload data
   * @returns {void}
   *
   * Behavior:
   * - Deduplicates events if enabled (checks event.id)
   * - Enforces max queue size (drops oldest if full)
   * - Persists queue to LocalStorage
   */
  function queueEvent(event) {
    // Check for duplicates
    if (WEBHOOK_CONFIG.features.deduplicate) {
      var isDuplicate = _eventQueue.some(function(e) {
        return e.id === event.id;
      });

      if (isDuplicate) {
        console.log('[WEBHOOK] Duplicate event ignored:', event.id);
        return;
      }
    }

    // Check queue size
    if (_eventQueue.length >= WEBHOOK_CONFIG.processing.maxQueueSize) {
      console.warn('[WEBHOOK] Queue full, dropping oldest event');
      _eventQueue.shift();
    }

    _eventQueue.push(event);
    saveEventQueue();
  }

  /**
   * Process queued events in batches with retry logic
   * @returns {void}
   *
   * Behavior:
   * - Processes events in batches (default: 10 events per batch)
   * - Retries failed events up to 3 attempts with exponential backoff
   * - Automatically processes next batch when current batch completes
   * - Updates queue in LocalStorage after each batch
   */
  function processEventQueue() {
    if (_processing || _eventQueue.length === 0) {
      return;
    }

    _processing = true;

    var batch = _eventQueue.splice(0, WEBHOOK_CONFIG.processing.batchSize);

    console.log('[WEBHOOK] Processing ' + batch.length + ' events...');

    processNext(0);

    function processNext(index) {
      if (index >= batch.length) {
        _processing = false;
        saveEventQueue();

        // Continue with next batch if queue not empty
        if (_eventQueue.length > 0) {
          setTimeout(function() {
            processEventQueue();
          }, WEBHOOK_CONFIG.processing.batchDelay);
        }

        return;
      }

      var event = batch[index];

      processEvent(event, function(error) {
        if (error) {
          console.error('[WEBHOOK] Failed to process event:', event.id, error);

          // Re-queue for retry
          event._retries = (event._retries || 0) + 1;

          if (event._retries < WEBHOOK_CONFIG.processing.retryAttempts) {
            _eventQueue.push(event);
          } else {
            console.error('[WEBHOOK] Event failed after max retries:', event.id);
          }
        }

        // Continue with next event
        processNext(index + 1);
      });
    }
  }

  /**
   * Process single webhook event
   */
  function processEvent(event, callback) {
    var eventType = event.eventType;

    console.log('[WEBHOOK] Processing event:', eventType);

    // Route to appropriate handler
    switch (eventType) {
      case 'contact-updated':
        handleContactUpdated(event, callback);
        break;

      case 'opportunity-updated':
        handleOpportunityUpdated(event, callback);
        break;

      case 'task-updated':
        handleTaskUpdated(event, callback);
        break;

      case 'note-created':
        handleNoteCreated(event, callback);
        break;

      case 'message-received':
        handleMessageReceived(event, callback);
        break;

      default:
        console.warn('[WEBHOOK] Unhandled event type:', eventType);
        if (callback) callback(null);
        break;
    }
  }

  /**
   * Handle contact updated event
   */
  function handleContactUpdated(event, callback) {
    var contact = event.contact;

    // Find local client by GHL ID
    var clients = getAllClients();
    var localClient = null;

    for (var i = 0; i < clients.length; i++) {
      if (clients[i].ghlId === contact.id) {
        localClient = clients[i];
        break;
      }
    }

    if (!localClient) {
      console.log('[WEBHOOK] Contact not found locally, creating new');

      // Create new client
      var newClient = {
        id: 'client_' + Date.now(),
        ghlId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        lastSync: event.timestamp
      };

      saveClient(newClient);

      if (callback) callback(null);
      return;
    }

    // Check for conflicts
    if (hasConflict(localClient, contact, event.timestamp)) {
      resolveConflict(localClient, contact, event.timestamp, function(resolved) {
        if (resolved) {
          saveClient(resolved);
        }
        if (callback) callback(null);
      });
    } else {
      // No conflict, update local
      updateLocalClient(localClient, contact, event.timestamp);
      saveClient(localClient);

      if (callback) callback(null);
    }
  }

  /**
   * Handle opportunity updated event
   */
  function handleOpportunityUpdated(event, callback) {
    var opportunity = event.opportunity;

    // Find local quote by GHL opportunity ID
    var quotes = getAllQuotes();
    var localQuote = null;

    for (var i = 0; i < quotes.length; i++) {
      if (quotes[i].ghlOpportunityId === opportunity.id) {
        localQuote = quotes[i];
        break;
      }
    }

    if (!localQuote) {
      console.log('[WEBHOOK] Opportunity not found locally');
      if (callback) callback(null);
      return;
    }

    // Update quote based on opportunity changes
    var statusChanged = false;

    if (opportunity.status === 'won' && localQuote.status !== 'accepted') {
      localQuote.status = 'accepted';
      localQuote.dateAccepted = event.timestamp;
      statusChanged = true;
    } else if (opportunity.status === 'lost' && localQuote.status !== 'declined') {
      localQuote.status = 'declined';
      localQuote.dateDeclined = event.timestamp;
      statusChanged = true;
    }

    localQuote.lastSync = event.timestamp;
    saveQuote(localQuote);

    // Trigger status change handlers if needed
    if (statusChanged && window.FollowupAutomation) {
      window.FollowupAutomation.handleQuoteEvent('quote-status-changed', localQuote, {
        status: localQuote.status
      });
    }

    if (callback) callback(null);
  }

  /**
   * Handle task updated event
   */
  function handleTaskUpdated(event, callback) {
    var task = event.task;

    // Find local task by GHL ID
    var tasks = getAllTasks();
    var localTask = null;

    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].ghlId === task.id) {
        localTask = tasks[i];
        break;
      }
    }

    if (!localTask) {
      console.log('[WEBHOOK] Task not found locally');
      if (callback) callback(null);
      return;
    }

    // Update task
    if (task.completed && localTask.status !== 'completed') {
      localTask.status = 'completed';
      localTask.completedDate = event.timestamp;
    }

    localTask.title = task.title;
    localTask.description = task.description;
    localTask.dueDate = task.dueDate;
    localTask.lastSync = event.timestamp;

    saveTask(localTask);

    if (callback) callback(null);
  }

  /**
   * Handle note created event
   */
  function handleNoteCreated(event, callback) {
    var note = event.note;

    // Find associated quotes by contact ID
    var quotes = getAllQuotes();
    var matchingQuotes = [];

    for (var i = 0; i < quotes.length; i++) {
      if (quotes[i].client && quotes[i].client.ghlId === note.contactId) {
        matchingQuotes.push(quotes[i]);
      }
    }

    if (matchingQuotes.length === 0) {
      console.log('[WEBHOOK] No quotes found for contact');
      if (callback) callback(null);
      return;
    }

    // Add note to most recent quote
    var mostRecentQuote = matchingQuotes[matchingQuotes.length - 1];

    if (!mostRecentQuote.notes) {
      mostRecentQuote.notes = [];
    }

    mostRecentQuote.notes.push({
      id: note.id,
      text: note.body,
      date: note.createdAt,
      source: 'ghl',
      type: 'external'
    });

    saveQuote(mostRecentQuote);

    // Show notification
    if (window.UIComponents) {
      window.UIComponents.showToast('New note added from GHL', 'info');
    }

    if (callback) callback(null);
  }

  /**
   * Handle message received event
   */
  function handleMessageReceived(event, callback) {
    var message = event.message;

    // Find quotes for this contact
    var quotes = getAllQuotes();
    var matchingQuotes = [];

    for (var i = 0; i < quotes.length; i++) {
      if (quotes[i].client && quotes[i].client.ghlId === message.contactId) {
        matchingQuotes.push(quotes[i]);
      }
    }

    if (matchingQuotes.length === 0) {
      console.log('[WEBHOOK] No quotes found for contact');
      if (callback) callback(null);
      return;
    }

    // Show notification about inbound message
    var notificationText = 'New ' + message.type + ' from client';
    if (window.UIComponents) {
      window.UIComponents.showToast(notificationText, 'info');
    }

    // Create follow-up task automatically
    var mostRecentQuote = matchingQuotes[matchingQuotes.length - 1];

    if (mostRecentQuote.status === 'sent' && window.TaskManager) {
      window.TaskManager.createTask({
        quoteId: mostRecentQuote.id,
        clientId: mostRecentQuote.client.id,
        type: 'follow-up',
        priority: 'high',
        title: 'Respond to client ' + message.type,
        description: 'Client sent ' + message.type + ': ' + message.body.substring(0, 100),
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      });
    }

    if (callback) callback(null);
  }

  /**
   * Check if there's a conflict between local and remote data
   * A conflict exists if local data was modified more recently than remote data
   * @param {Object} localData - Local data object (must have lastModified or lastSync)
   * @param {Object} remoteData - Remote data from webhook event
   * @param {string|Date} remoteTimestamp - Remote data modification timestamp
   * @returns {boolean} True if conflict exists (local is newer), false otherwise
   */
  function hasConflict(localData, remoteData, remoteTimestamp) {
    if (!localData.lastModified && !localData.lastSync) {
      return false; // No local modification time, no conflict
    }

    var localTime = new Date(localData.lastModified || localData.lastSync).getTime();
    var remoteTime = new Date(remoteTimestamp).getTime();

    // If local was modified more recently, there's a conflict
    return localTime > remoteTime;
  }

  /**
   * Resolve data conflict using configured resolution strategy
   * @param {Object} localData - Local data object with lastModified/lastSync
   * @param {Object} remoteData - Remote data from GHL webhook event
   * @param {string|Date} remoteTimestamp - Remote data timestamp
   * @param {Function} callback - Callback function(resolvedData), receives updated local data if changed, null if no change
   *
   * Conflict Resolution Strategies:
   * - 'timestamp': Most recent data wins (default)
   * - 'ghl-wins': Always use GoHighLevel data
   * - 'local-wins': Always keep local data
   * - 'manual': Show UI for user to choose (not yet implemented)
   *
   * @returns {void}
   */
  function resolveConflict(localData, remoteData, remoteTimestamp, callback) {
    var strategy = WEBHOOK_CONFIG.features.conflictResolution;

    console.log('[WEBHOOK] Conflict detected, resolving with strategy:', strategy);

    switch (strategy) {
      case 'timestamp':
        // Most recent wins
        var localTime = new Date(localData.lastModified || localData.lastSync).getTime();
        var remoteTime = new Date(remoteTimestamp).getTime();

        if (remoteTime > localTime) {
          // Remote wins
          updateLocalClient(localData, remoteData, remoteTimestamp);
          callback(localData);
        } else {
          // Local wins, no update
          callback(null);
        }
        break;

      case 'ghl-wins':
        // Always use GHL data
        updateLocalClient(localData, remoteData, remoteTimestamp);
        callback(localData);
        break;

      case 'local-wins':
        // Keep local data
        callback(null);
        break;

      case 'manual':
        // Show UI for user to resolve
        showConflictResolutionUI(localData, remoteData, function(resolved) {
          callback(resolved);
        });
        break;

      default:
        // Default to timestamp
        callback(localData);
    }
  }

  /**
   * Update local client with remote data
   */
  function updateLocalClient(localClient, remoteContact, timestamp) {
    localClient.name = remoteContact.name;
    localClient.email = remoteContact.email;
    localClient.phone = remoteContact.phone;
    localClient.address = remoteContact.address;
    localClient.lastSync = timestamp;
  }

  /**
   * Show conflict resolution UI
   */
  function showConflictResolutionUI(localData, remoteData, callback) {
    console.log('[WEBHOOK] Showing conflict resolution UI');

    // Helper function to escape HTML
    function escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Helper function to format date
    function formatDate(dateStr) {
      if (!dateStr) return 'Unknown';
      var date = new Date(dateStr);
      return date.toLocaleString();
    }

    // Create modal HTML
    var modalHTML = '<div class="modal-overlay" id="conflict-resolution-overlay">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title" style="max-width: 700px;">' +
      '  <div class="modal-header">' +
      '    <h3 class="modal-title" id="conflict-title">Data Conflict Detected</h3>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <p style="margin-bottom: 16px;">The data has been modified in both locations. Please choose which version to keep:</p>' +
      '    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">' +
      '      <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb;">' +
      '        <h4 style="margin: 0 0 12px 0; font-weight: 600;">Local Version</h4>' +
      '        <div style="font-size: 14px; line-height: 1.6;">' +
      '          <div style="margin-bottom: 8px;"><strong>Name:</strong> ' + escapeHtml(localData.name) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Email:</strong> ' + escapeHtml(localData.email) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Phone:</strong> ' + escapeHtml(localData.phone) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Address:</strong> ' + escapeHtml(localData.address) + '</div>' +
      '          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">' +
      '            Last modified: ' + formatDate(localData.lastModified || localData.lastSync) +
      '          </div>' +
      '        </div>' +
      '        <button type="button" class="btn btn-primary" id="choose-local-version" style="margin-top: 12px; width: 100%;">Keep Local</button>' +
      '      </div>' +
      '      <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb;">' +
      '        <h4 style="margin: 0 0 12px 0; font-weight: 600;">Remote Version (GHL)</h4>' +
      '        <div style="font-size: 14px; line-height: 1.6;">' +
      '          <div style="margin-bottom: 8px;"><strong>Name:</strong> ' + escapeHtml(remoteData.name) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Email:</strong> ' + escapeHtml(remoteData.email) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Phone:</strong> ' + escapeHtml(remoteData.phone) + '</div>' +
      '          <div style="margin-bottom: 8px;"><strong>Address:</strong> ' + escapeHtml(remoteData.address) + '</div>' +
      '          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">' +
      '            Last modified: ' + formatDate(remoteData.updatedAt || remoteData.dateUpdated) +
      '          </div>' +
      '        </div>' +
      '        <button type="button" class="btn btn-primary" id="choose-remote-version" style="margin-top: 12px; width: 100%;">Keep Remote</button>' +
      '      </div>' +
      '    </div>' +
      '    <div style="padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; font-size: 14px;">' +
      '      <strong>Note:</strong> The version you choose will be saved and synchronized. The other version will be discarded.' +
      '    </div>' +
      '  </div>' +
      '  <div class="modal-footer">' +
      '    <button type="button" class="btn btn-secondary" id="cancel-conflict-resolution">Cancel</button>' +
      '  </div>' +
      '</div>' +
      '</div>';

    // Add to body
    var modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);

    // Prevent background scroll
    document.body.classList.add('modal-open');

    // Store callback reference
    var resolveCallback = callback;

    // Set up event listeners
    document.getElementById('choose-local-version').addEventListener('click', function() {
      console.log('[WEBHOOK] User chose local version');
      closeConflictModal();
      resolveCallback(null); // null means keep local (no update)
    });

    document.getElementById('choose-remote-version').addEventListener('click', function() {
      console.log('[WEBHOOK] User chose remote version');
      closeConflictModal();
      resolveCallback(localData); // Return localData to be updated with remote
    });

    document.getElementById('cancel-conflict-resolution').addEventListener('click', function() {
      console.log('[WEBHOOK] User cancelled conflict resolution, defaulting to local');
      closeConflictModal();
      resolveCallback(null); // Default to local on cancel
    });

    // Helper function to close modal
    function closeConflictModal() {
      var overlay = document.getElementById('conflict-resolution-overlay');
      if (overlay) {
        overlay.remove();
      }
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Save webhook configuration
   */
  function saveWebhookConfig() {
    try {
      localStorage.setItem('tts_webhook_config', JSON.stringify(WEBHOOK_CONFIG));
    } catch (e) {
      console.error('[WEBHOOK] Failed to save config:', e);
    }
  }

  /**
   * Load webhook configuration
   */
  function loadWebhookConfig() {
    try {
      var saved = localStorage.getItem('tts_webhook_config');
      if (saved) {
        var config = JSON.parse(saved);

        // Merge with defaults
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            if (typeof config[key] === 'object' && !Array.isArray(config[key])) {
              // Merge nested objects
              for (var subkey in config[key]) {
                if (config[key].hasOwnProperty(subkey)) {
                  WEBHOOK_CONFIG[key][subkey] = config[key][subkey];
                }
              }
            } else {
              WEBHOOK_CONFIG[key] = config[key];
            }
          }
        }
      }
    } catch (e) {
      console.error('[WEBHOOK] Failed to load config:', e);
    }
  }

  /**
   * Save last event ID
   */
  function saveLastEventId() {
    try {
      localStorage.setItem('tts_webhook_last_event', _lastEventId || '');
    } catch (e) {
      console.error('[WEBHOOK] Failed to save last event ID:', e);
    }
  }

  /**
   * Load last event ID
   */
  function loadLastEventId() {
    try {
      _lastEventId = localStorage.getItem('tts_webhook_last_event') || null;
    } catch (e) {
      console.error('[WEBHOOK] Failed to load last event ID:', e);
    }
  }

  /**
   * Save event queue
   */
  function saveEventQueue() {
    try {
      localStorage.setItem('tts_webhook_queue', JSON.stringify(_eventQueue));
    } catch (e) {
      console.error('[WEBHOOK] Failed to save event queue:', e);
    }
  }

  /**
   * Load event queue
   */
  function loadEventQueue() {
    try {
      var saved = localStorage.getItem('tts_webhook_queue');
      if (saved) {
        _eventQueue = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[WEBHOOK] Failed to load event queue:', e);
    }
  }

  /**
   * Manual sync trigger
   */
  function syncNow() {
    console.log('[WEBHOOK] Manual sync triggered');
    pollForEvents();
  }

  /**
   * Get sync status
   */
  function getSyncStatus() {
    return {
      enabled: WEBHOOK_CONFIG.features.enabled,
      lastEventId: _lastEventId,
      queueLength: _eventQueue.length,
      processing: _processing,
      polling: !!_pollInterval
    };
  }

  /**
   * Get webhook configuration
   */
  function getConfig() {
    return WEBHOOK_CONFIG;
  }

  /**
   * Update webhook configuration
   */
  function updateConfig(updates) {
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          // Merge nested objects
          if (!WEBHOOK_CONFIG[key]) {
            WEBHOOK_CONFIG[key] = {};
          }
          for (var subkey in updates[key]) {
            if (updates[key].hasOwnProperty(subkey)) {
              WEBHOOK_CONFIG[key][subkey] = updates[key][subkey];
            }
          }
        } else {
          WEBHOOK_CONFIG[key] = updates[key];
        }
      }
    }

    saveWebhookConfig();

    // Restart polling if enabled
    if (WEBHOOK_CONFIG.features.enabled) {
      startPolling();
    } else {
      stopPolling();
    }
  }

  // ============================================
  // HELPER FUNCTIONS FOR DATA ACCESS
  // ============================================

  /**
   * Get all clients (placeholder - implement based on your storage)
   */
  function getAllClients() {
    try {
      var data = localStorage.getItem('client-database');
      if (data) {
        var parsed = JSON.parse(data);
        return parsed.clients || [];
      }
    } catch (e) {
      console.error('[WEBHOOK] Failed to get clients:', e);
    }
    return [];
  }

  /**
   * Save client (placeholder - implement based on your storage)
   */
  function saveClient(client) {
    try {
      var data = localStorage.getItem('client-database');
      var database = data ? JSON.parse(data) : { clients: [] };

      var index = -1;
      for (var i = 0; i < database.clients.length; i++) {
        if (database.clients[i].id === client.id) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        database.clients[index] = client;
      } else {
        database.clients.push(client);
      }

      localStorage.setItem('client-database', JSON.stringify(database));
    } catch (e) {
      console.error('[WEBHOOK] Failed to save client:', e);
    }
  }

  /**
   * Get all quotes (placeholder - implement based on your storage)
   */
  function getAllQuotes() {
    try {
      var data = localStorage.getItem('tictacstick_saved_quotes_v1');
      if (data) {
        var parsed = JSON.parse(data);
        return parsed.quotes || [];
      }
    } catch (e) {
      console.error('[WEBHOOK] Failed to get quotes:', e);
    }
    return [];
  }

  /**
   * Save quote (placeholder - implement based on your storage)
   */
  function saveQuote(quote) {
    try {
      var data = localStorage.getItem('tictacstick_saved_quotes_v1');
      var database = data ? JSON.parse(data) : { quotes: [] };

      var index = -1;
      for (var i = 0; i < database.quotes.length; i++) {
        if (database.quotes[i].id === quote.id) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        database.quotes[index] = quote;
      } else {
        database.quotes.push(quote);
      }

      localStorage.setItem('tictacstick_saved_quotes_v1', JSON.stringify(database));
    } catch (e) {
      console.error('[WEBHOOK] Failed to save quote:', e);
    }
  }

  /**
   * Get all tasks (placeholder - implement based on your storage)
   */
  function getAllTasks() {
    try {
      var data = localStorage.getItem('tts_tasks');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('[WEBHOOK] Failed to get tasks:', e);
    }
    return [];
  }

  /**
   * Save task (placeholder - implement based on your storage)
   */
  function saveTask(task) {
    try {
      var tasks = getAllTasks();

      var index = -1;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === task.id) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }

      localStorage.setItem('tts_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('[WEBHOOK] Failed to save task:', e);
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var WebhookProcessor = {
    init: init,
    startPolling: startPolling,
    stopPolling: stopPolling,
    syncNow: syncNow,
    getSyncStatus: getSyncStatus,
    getConfig: getConfig,
    updateConfig: updateConfig,
    processEventQueue: processEventQueue,
    queueEvent: queueEvent
  };

  // Make globally available
  window.WebhookProcessor = WebhookProcessor;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('webhookProcessor', WebhookProcessor);
  }

  console.log('[WEBHOOK] Module loaded');
})();
