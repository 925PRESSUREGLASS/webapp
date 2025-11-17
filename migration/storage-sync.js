// storage-sync.js - Storage abstraction layer with offline-first cloud sync
// iOS Safari compatible - ES5 JavaScript only
// Purpose: Dual-write to LocalStorage (primary) and Cloud (secondary) with queue and retry

(function() {
  'use strict';

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  var CONFIG = {
    // Supabase/Cloud API endpoint (configure this)
    apiEndpoint: '/api/sync', // Will be set from environment/config
    apiKey: null,             // Will be set from environment/config

    // Sync behavior
    syncEnabled: true,        // Master kill switch
    syncOnWrite: true,        // Sync immediately after write
    syncInterval: 30000,      // Background sync every 30 seconds
    maxRetries: 10,           // Max retry attempts before giving up
    retryBaseDelay: 1000,     // Initial retry delay (1 second)
    retryMaxDelay: 60000,     // Max retry delay (60 seconds)
    batchSize: 10,            // Max items to sync in one request

    // Queue management
    maxQueueSize: 1000,       // Max items in sync queue before alerting
    queueKey: 'tictacstick_sync_queue',
    failedQueueKey: 'tictacstick_sync_failed',
    lastSyncKey: 'tictacstick_last_sync'
  };

  // =============================================================================
  // STATE
  // =============================================================================

  var state = {
    isSyncing: false,
    isOnline: navigator.onLine,
    syncIntervalId: null,
    lastSyncTime: null,
    stats: {
      totalSyncAttempts: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflicts: 0,
      queueLength: 0
    }
  };

  // =============================================================================
  // SYNC QUEUE MANAGEMENT
  // =============================================================================

  /**
   * Get sync queue from localStorage
   * @returns {Array} Array of pending sync items
   */
  function getSyncQueue() {
    try {
      var raw = localStorage.getItem(CONFIG.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      DEBUG.error('[SYNC] Failed to load sync queue', e);
      return [];
    }
  }

  /**
   * Save sync queue to localStorage
   * @param {Array} queue - Sync queue to save
   */
  function saveSyncQueue(queue) {
    try {
      localStorage.setItem(CONFIG.queueKey, JSON.stringify(queue));
      state.stats.queueLength = queue.length;
    } catch (e) {
      DEBUG.error('[SYNC] Failed to save sync queue', e);
    }
  }

  /**
   * Add item to sync queue
   * @param {string} entity - Entity type (quote, invoice, client)
   * @param {string} operation - Operation (create, update, delete)
   * @param {Object} data - Data to sync
   */
  function queueForSync(entity, operation, data) {
    var queue = getSyncQueue();

    // Check for duplicates (same entity and UUID)
    var uuid = data._metadata ? data._metadata.uuid : null;
    if (uuid) {
      // Remove existing entry for this UUID (will be replaced with newer version)
      queue = queue.filter(function(item) {
        return !(item.entity === entity && item.data._metadata && item.data._metadata.uuid === uuid);
      });
    }

    // Add to queue
    queue.push({
      entity: entity,
      operation: operation,
      data: data,
      queuedAt: Date.now(),
      attempts: 0,
      lastAttempt: null,
      error: null
    });

    // Check queue size limit
    if (queue.length > CONFIG.maxQueueSize) {
      DEBUG.warn('[SYNC] Queue size exceeded limit: ' + queue.length);
      if (window.MigrationMonitoring) {
        window.MigrationMonitoring.recordAlert('Queue size exceeded: ' + queue.length, 'warning');
      }
    }

    saveSyncQueue(queue);
    DEBUG.log('[SYNC] Queued ' + entity + ' for ' + operation + ' (queue size: ' + queue.length + ')');

    // Trigger background sync if online
    if (state.isOnline && CONFIG.syncOnWrite) {
      setTimeout(function() {
        processQueue();
      }, 100);
    }
  }

  /**
   * Get failed sync queue
   * @returns {Array} Array of failed sync items
   */
  function getFailedQueue() {
    try {
      var raw = localStorage.getItem(CONFIG.failedQueueKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      DEBUG.error('[SYNC] Failed to load failed queue', e);
      return [];
    }
  }

  /**
   * Save failed sync queue
   * @param {Array} queue - Failed sync queue
   */
  function saveFailedQueue(queue) {
    try {
      localStorage.setItem(CONFIG.failedQueueKey, JSON.stringify(queue));
    } catch (e) {
      DEBUG.error('[SYNC] Failed to save failed queue', e);
    }
  }

  /**
   * Move item to failed queue
   * @param {Object} item - Sync queue item
   */
  function moveToFailedQueue(item) {
    var failed = getFailedQueue();
    failed.push({
      item: item,
      failedAt: Date.now(),
      reason: item.error || 'Max retries exceeded'
    });
    saveFailedQueue(failed);

    DEBUG.error('[SYNC] Moved to failed queue: ' + item.entity, item.error);

    // Notify user
    if (window.ErrorHandler) {
      window.ErrorHandler.showError('Some changes failed to sync. Check sync status.');
    }

    // Alert monitoring
    if (window.MigrationMonitoring) {
      window.MigrationMonitoring.recordSyncFailure(item);
    }
  }

  // =============================================================================
  // SYNC OPERATIONS
  // =============================================================================

  /**
   * Calculate exponential backoff delay
   * @param {number} attempts - Number of attempts made
   * @returns {number} Delay in milliseconds
   */
  function getRetryDelay(attempts) {
    var delay = CONFIG.retryBaseDelay * Math.pow(2, attempts);
    return Math.min(delay, CONFIG.retryMaxDelay);
  }

  /**
   * Sync a single item to cloud
   * @param {Object} item - Sync queue item
   * @param {Function} callback - Callback(result)
   */
  function syncToCloud(item, callback) {
    if (!CONFIG.syncEnabled) {
      callback({ success: false, error: 'Sync disabled' });
      return;
    }

    if (!CONFIG.apiEndpoint) {
      callback({ success: false, error: 'API endpoint not configured' });
      return;
    }

    state.stats.totalSyncAttempts++;

    // Build API request
    var url = CONFIG.apiEndpoint + '/push';
    var payload = {
      entity: item.entity,
      operation: item.operation,
      data: item.data,
      deviceId: window.MigrationUUID ? window.MigrationUUID.getDeviceId() : 'unknown',
      timestamp: new Date().toISOString()
    };

    // Make API request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (CONFIG.apiKey) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + CONFIG.apiKey);
    }

    xhr.timeout = 10000; // 10 second timeout

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = JSON.parse(xhr.responseText);
          state.stats.successfulSyncs++;

          // Update metadata
          if (item.data._metadata) {
            item.data._metadata.syncStatus = 'synced';
            item.data._metadata.lastSyncedAt = new Date().toISOString();
          }

          // Check for conflicts
          if (response.conflict) {
            state.stats.conflicts++;
            if (window.MigrationConflictResolution) {
              window.MigrationConflictResolution.handleConflict(
                item.entity,
                item.data,
                response.serverData
              );
            }
          }

          callback({ success: true, response: response });
        } catch (e) {
          callback({ success: false, error: 'Invalid response: ' + e.message });
        }
      } else {
        state.stats.failedSyncs++;
        callback({ success: false, error: 'HTTP ' + xhr.status + ': ' + xhr.statusText });
      }
    };

    xhr.onerror = function() {
      state.stats.failedSyncs++;
      callback({ success: false, error: 'Network error' });
    };

    xhr.ontimeout = function() {
      state.stats.failedSyncs++;
      callback({ success: false, error: 'Request timeout' });
    };

    xhr.send(JSON.stringify(payload));
  }

  /**
   * Process sync queue
   * Attempt to sync pending items to cloud
   * @param {Function} callback - Optional callback(result)
   */
  function processQueue(callback) {
    if (!state.isOnline) {
      DEBUG.log('[SYNC] Offline, skipping sync');
      if (callback) callback({ success: false, error: 'Offline' });
      return;
    }

    if (state.isSyncing) {
      DEBUG.log('[SYNC] Already syncing, skipping');
      if (callback) callback({ success: false, error: 'Already syncing' });
      return;
    }

    state.isSyncing = true;
    var queue = getSyncQueue();

    if (queue.length === 0) {
      state.isSyncing = false;
      if (callback) callback({ success: true, processed: 0 });
      return;
    }

    DEBUG.log('[SYNC] Processing queue (' + queue.length + ' items)...');

    // Process items one at a time (could be batched for performance)
    processNextQueueItem(queue, 0, function(result) {
      state.isSyncing = false;
      state.lastSyncTime = Date.now();
      localStorage.setItem(CONFIG.lastSyncKey, state.lastSyncTime.toString());

      DEBUG.log('[SYNC] Queue processing complete', result);
      if (callback) callback(result);
    });
  }

  /**
   * Process next item in queue (recursive)
   * @param {Array} queue - Sync queue
   * @param {number} index - Current index
   * @param {Function} callback - Callback when done
   */
  function processNextQueueItem(queue, index, callback) {
    if (index >= queue.length) {
      callback({ success: true, processed: index });
      return;
    }

    var item = queue[index];

    // Check if should retry yet
    if (item.lastAttempt) {
      var delay = getRetryDelay(item.attempts);
      var timeSinceAttempt = Date.now() - item.lastAttempt;
      if (timeSinceAttempt < delay) {
        // Skip this item for now
        processNextQueueItem(queue, index + 1, callback);
        return;
      }
    }

    // Check max retries
    if (item.attempts >= CONFIG.maxRetries) {
      // Move to failed queue
      moveToFailedQueue(item);
      queue.splice(index, 1);
      saveSyncQueue(queue);
      processNextQueueItem(queue, index, callback);
      return;
    }

    // Attempt sync
    item.attempts++;
    item.lastAttempt = Date.now();

    syncToCloud(item, function(result) {
      if (result.success) {
        // Success - remove from queue
        queue.splice(index, 1);
        saveSyncQueue(queue);
        processNextQueueItem(queue, index, callback);
      } else {
        // Failed - save error and continue
        item.error = result.error;
        saveSyncQueue(queue);
        processNextQueueItem(queue, index + 1, callback);
      }
    });
  }

  /**
   * Pull changes from cloud
   * Get updates from other devices
   * @param {Function} callback - Callback(result)
   */
  function pullFromCloud(callback) {
    if (!CONFIG.syncEnabled || !state.isOnline) {
      if (callback) callback({ success: false, error: 'Sync disabled or offline' });
      return;
    }

    var lastSync = localStorage.getItem(CONFIG.lastSyncKey);
    var url = CONFIG.apiEndpoint + '/pull' + (lastSync ? '?since=' + lastSync : '');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    if (CONFIG.apiKey) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + CONFIG.apiKey);
    }

    xhr.timeout = 10000;

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = JSON.parse(xhr.responseText);
          applyCloudChanges(response.changes);
          if (callback) callback({ success: true, changes: response.changes });
        } catch (e) {
          if (callback) callback({ success: false, error: 'Invalid response' });
        }
      } else {
        if (callback) callback({ success: false, error: 'HTTP ' + xhr.status });
      }
    };

    xhr.onerror = function() {
      if (callback) callback({ success: false, error: 'Network error' });
    };

    xhr.send();
  }

  /**
   * Apply changes pulled from cloud to localStorage
   * @param {Array} changes - Array of changes from server
   */
  function applyCloudChanges(changes) {
    if (!changes || changes.length === 0) {
      return;
    }

    DEBUG.log('[SYNC] Applying ' + changes.length + ' changes from cloud');

    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];

      try {
        // Load existing data
        var existing = localStorage.getItem(change.key);
        var data = existing ? JSON.parse(existing) : [];
        var isArray = Array.isArray(data);
        var records = isArray ? data : [data];

        // Find and update/insert record
        var found = false;
        for (var j = 0; j < records.length; j++) {
          if (records[j]._metadata && records[j]._metadata.uuid === change.uuid) {
            // Check version for conflict
            if (records[j]._metadata.version >= change.version) {
              DEBUG.warn('[SYNC] Skipping older version from cloud', change);
              found = true;
              break;
            }

            // Update existing
            records[j] = change.data;
            found = true;
            break;
          }
        }

        if (!found && change.operation !== 'delete') {
          // Insert new
          records.push(change.data);
        }

        // Remove deleted
        if (change.operation === 'delete') {
          records = records.filter(function(r) {
            return !(r._metadata && r._metadata.uuid === change.uuid);
          });
        }

        // Save back
        var updated = isArray ? records : records[0];
        localStorage.setItem(change.key, JSON.stringify(updated));
      } catch (e) {
        DEBUG.error('[SYNC] Failed to apply change', e, change);
      }
    }
  }

  // =============================================================================
  // PUBLIC API - STORAGE OPERATIONS
  // =============================================================================

  /**
   * Set (write) data to storage
   * Writes to LocalStorage first (fast, reliable)
   * Queues for cloud sync (async, eventual)
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {Function} callback - Optional callback(result)
   */
  function set(key, value, callback) {
    try {
      // Add metadata if not present
      if (window.MigrationUUID && typeof value === 'object' && value !== null) {
        value = window.MigrationUUID.addMetadataToRecord(value);
      }

      // 1. Write to LocalStorage first (primary, fast)
      localStorage.setItem(key, JSON.stringify(value));

      // 2. Queue for cloud sync (secondary, async)
      if (CONFIG.syncEnabled) {
        queueForSync(key, 'update', value);
      }

      // 3. Return success immediately
      if (callback) {
        callback({ success: true, synced: false });
      }

      return { success: true };
    } catch (e) {
      DEBUG.error('[SYNC] Failed to set ' + key, e);
      if (callback) {
        callback({ success: false, error: e.message });
      }
      return { success: false, error: e.message };
    }
  }

  /**
   * Get (read) data from storage
   * Always reads from LocalStorage (offline-first)
   * Triggers background sync to get updates
   * @param {string} key - Storage key
   * @param {Function} callback - Optional callback(result)
   * @returns {*} Value from storage
   */
  function get(key, callback) {
    try {
      var raw = localStorage.getItem(key);
      var value = raw ? JSON.parse(raw) : null;

      // Trigger background pull to get updates
      if (state.isOnline && CONFIG.syncEnabled) {
        setTimeout(function() {
          pullFromCloud();
        }, 100);
      }

      if (callback) {
        callback({ success: true, data: value });
      }

      return value;
    } catch (e) {
      DEBUG.error('[SYNC] Failed to get ' + key, e);
      if (callback) {
        callback({ success: false, error: e.message });
      }
      return null;
    }
  }

  /**
   * Remove (delete) data from storage
   * Soft delete - marks as deleted in metadata
   * @param {string} key - Storage key
   * @param {Function} callback - Optional callback(result)
   */
  function remove(key, callback) {
    try {
      var value = get(key);

      if (value && window.MigrationUUID) {
        // Soft delete
        value = window.MigrationUUID.markAsDeleted(value);
        localStorage.setItem(key, JSON.stringify(value));

        // Queue for sync
        if (CONFIG.syncEnabled) {
          queueForSync(key, 'delete', value);
        }
      } else {
        // Hard delete (fallback)
        localStorage.removeItem(key);
      }

      if (callback) {
        callback({ success: true });
      }

      return { success: true };
    } catch (e) {
      DEBUG.error('[SYNC] Failed to remove ' + key, e);
      if (callback) {
        callback({ success: false, error: e.message });
      }
      return { success: false, error: e.message };
    }
  }

  // =============================================================================
  // NETWORK STATUS MANAGEMENT
  // =============================================================================

  /**
   * Handle online event
   */
  function handleOnline() {
    DEBUG.log('[SYNC] Back online');
    state.isOnline = true;

    // Start sync
    setTimeout(function() {
      processQueue();
      pullFromCloud();
    }, 1000);
  }

  /**
   * Handle offline event
   */
  function handleOffline() {
    DEBUG.log('[SYNC] Gone offline');
    state.isOnline = false;
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize storage sync module
   */
  function init() {
    DEBUG.log('[SYNC] Initializing storage sync...');

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start background sync interval
    if (CONFIG.syncEnabled) {
      state.syncIntervalId = setInterval(function() {
        if (state.isOnline && !state.isSyncing) {
          processQueue();
          pullFromCloud();
        }
      }, CONFIG.syncInterval);
    }

    // Initial sync if online
    if (state.isOnline) {
      setTimeout(function() {
        processQueue();
        pullFromCloud();
      }, 2000);
    }

    DEBUG.log('[SYNC] Storage sync initialized (queue: ' + getSyncQueue().length + ' items)');
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  window.StorageSync = {
    // Storage operations
    set: set,
    get: get,
    remove: remove,

    // Sync control
    processQueue: processQueue,
    pullFromCloud: pullFromCloud,
    enableSync: function() { CONFIG.syncEnabled = true; },
    disableSync: function() { CONFIG.syncEnabled = false; },

    // Queue management
    getSyncQueue: getSyncQueue,
    getFailedQueue: getFailedQueue,
    clearQueue: function() { saveSyncQueue([]); },
    retryFailed: function() {
      var failed = getFailedQueue();
      var queue = getSyncQueue();
      failed.forEach(function(f) {
        f.item.attempts = 0;
        queue.push(f.item);
      });
      saveSyncQueue(queue);
      saveFailedQueue([]);
      processQueue();
    },

    // Configuration
    configure: function(config) {
      Object.keys(config).forEach(function(key) {
        if (CONFIG.hasOwnProperty(key)) {
          CONFIG[key] = config[key];
        }
      });
    },

    // Stats
    getStats: function() { return state.stats; },
    isOnline: function() { return state.isOnline; },
    isSyncing: function() { return state.isSyncing; }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  DEBUG.log('[SYNC] Module loaded');

})();
