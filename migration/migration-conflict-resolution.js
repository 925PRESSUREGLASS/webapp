// migration-conflict-resolution.js - Conflict detection and resolution strategies
// iOS Safari compatible - ES5 JavaScript only
// Purpose: Handle sync conflicts between local and cloud data

(function() {
  'use strict';

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  var CONFIG = {
    defaultStrategy: 'last-write-wins', // last-write-wins, version-based, manual
    showConflictUI: true,                // Show UI for manual resolution
    autoResolve: true,                   // Auto-resolve when possible
    conflictStorageKey: 'tictacstick_conflicts'
  };

  // =============================================================================
  // CONFLICT DETECTION
  // =============================================================================

  /**
   * Detect if there's a conflict between local and cloud versions
   * @param {Object} localData - Local version of record
   * @param {Object} cloudData - Cloud version of record
   * @returns {Object} { hasConflict: boolean, reason: string }
   */
  function detectConflict(localData, cloudData) {
    if (!localData || !cloudData) {
      return { hasConflict: false, reason: 'Missing data' };
    }

    var localMeta = localData._metadata;
    var cloudMeta = cloudData._metadata;

    if (!localMeta || !cloudMeta) {
      return { hasConflict: false, reason: 'Missing metadata' };
    }

    // Check UUID match
    if (localMeta.uuid !== cloudMeta.uuid) {
      return { hasConflict: false, reason: 'Different records' };
    }

    // Check if versions match
    if (localMeta.version === cloudMeta.version) {
      return { hasConflict: false, reason: 'Same version' };
    }

    // Check timestamps
    var localTime = new Date(localMeta.updatedAt).getTime();
    var cloudTime = new Date(cloudMeta.updatedAt).getTime();

    // If local is older than cloud, no conflict (just update local)
    if (localTime < cloudTime && localMeta.version < cloudMeta.version) {
      return { hasConflict: false, reason: 'Cloud is newer' };
    }

    // If cloud is older than local, no conflict (just push local)
    if (cloudTime < localTime && cloudMeta.version < localMeta.version) {
      return { hasConflict: false, reason: 'Local is newer' };
    }

    // Both modified at similar time with different versions = CONFLICT
    var timeDiff = Math.abs(localTime - cloudTime);
    if (timeDiff < 60000) { // Within 1 minute = likely concurrent edit
      return { hasConflict: true, reason: 'Concurrent modification' };
    }

    // Version mismatch but significant time difference
    return { hasConflict: true, reason: 'Version mismatch' };
  }

  // =============================================================================
  // RESOLUTION STRATEGIES
  // =============================================================================

  /**
   * Strategy 1: Last-Write-Wins (LWW)
   * Simple automatic resolution based on timestamp
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   * @returns {Object} { winner: 'local'|'cloud', data: Object }
   */
  function resolveLastWriteWins(localData, cloudData) {
    var localTime = new Date(localData._metadata.updatedAt).getTime();
    var cloudTime = new Date(cloudData._metadata.updatedAt).getTime();

    if (localTime > cloudTime) {
      return { winner: 'local', data: localData };
    } else if (cloudTime > localTime) {
      return { winner: 'cloud', data: cloudData };
    } else {
      // Same timestamp (rare) - use version number
      if (localData._metadata.version > cloudData._metadata.version) {
        return { winner: 'local', data: localData };
      } else {
        return { winner: 'cloud', data: cloudData };
      }
    }
  }

  /**
   * Strategy 2: Version-Based (Optimistic Locking)
   * Uses version numbers to detect conflicts
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   * @returns {Object} { winner: 'local'|'cloud'|'manual', data: Object }
   */
  function resolveVersionBased(localData, cloudData) {
    var localVer = localData._metadata.version || 0;
    var cloudVer = cloudData._metadata.version || 0;

    if (localVer > cloudVer) {
      return { winner: 'local', data: localData };
    } else if (cloudVer > localVer) {
      return { winner: 'cloud', data: cloudData };
    } else {
      // Same version but different data = need manual resolution
      return { winner: 'manual', data: null };
    }
  }

  /**
   * Strategy 3: Field-Level Merge
   * Merge non-conflicting fields, flag conflicting fields
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   * @returns {Object} { merged: Object, conflicts: Array }
   */
  function resolveFieldLevelMerge(localData, cloudData) {
    var merged = {};
    var conflicts = [];

    // Get all unique keys
    var allKeys = {};
    Object.keys(localData).forEach(function(key) { allKeys[key] = true; });
    Object.keys(cloudData).forEach(function(key) { allKeys[key] = true; });

    Object.keys(allKeys).forEach(function(key) {
      if (key === '_metadata') {
        // Merge metadata separately
        merged._metadata = mergeMetadata(localData._metadata, cloudData._metadata);
        return;
      }

      var localVal = localData[key];
      var cloudVal = cloudData[key];

      // If values are identical, no conflict
      if (JSON.stringify(localVal) === JSON.stringify(cloudVal)) {
        merged[key] = localVal;
        return;
      }

      // If only one has the field, use that
      if (localVal === undefined) {
        merged[key] = cloudVal;
        return;
      }
      if (cloudVal === undefined) {
        merged[key] = localVal;
        return;
      }

      // Both have different values = conflict
      // Use most recent based on timestamp
      var localTime = new Date(localData._metadata.updatedAt).getTime();
      var cloudTime = new Date(cloudData._metadata.updatedAt).getTime();

      if (localTime > cloudTime) {
        merged[key] = localVal;
        conflicts.push({
          field: key,
          chosen: 'local',
          localValue: localVal,
          cloudValue: cloudVal
        });
      } else {
        merged[key] = cloudVal;
        conflicts.push({
          field: key,
          chosen: 'cloud',
          localValue: localVal,
          cloudValue: cloudVal
        });
      }
    });

    return { merged: merged, conflicts: conflicts };
  }

  /**
   * Merge metadata from two versions
   * @param {Object} localMeta - Local metadata
   * @param {Object} cloudMeta - Cloud metadata
   * @returns {Object} Merged metadata
   */
  function mergeMetadata(localMeta, cloudMeta) {
    return {
      uuid: localMeta.uuid, // Should be same
      createdAt: localMeta.createdAt < cloudMeta.createdAt ? localMeta.createdAt : cloudMeta.createdAt,
      updatedAt: localMeta.updatedAt > cloudMeta.updatedAt ? localMeta.updatedAt : cloudMeta.updatedAt,
      version: Math.max(localMeta.version, cloudMeta.version) + 1, // Increment for merge
      deviceId: localMeta.deviceId, // Keep local device ID
      syncStatus: 'conflict', // Mark as conflicted
      deletedAt: localMeta.deletedAt || cloudMeta.deletedAt, // If either deleted, mark deleted
      lastSyncedAt: new Date().toISOString()
    };
  }

  // =============================================================================
  // CONFLICT RESOLUTION ORCHESTRATOR
  // =============================================================================

  /**
   * Resolve conflict using configured strategy
   * @param {string} entity - Entity type (quote, invoice, client)
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   * @returns {Object} Resolution result
   */
  function resolveConflict(entity, localData, cloudData) {
    // Detect if there's actually a conflict
    var detection = detectConflict(localData, cloudData);

    if (!detection.hasConflict) {
      DEBUG.log('[CONFLICT] No conflict detected for ' + entity + ': ' + detection.reason);

      // Return newer version
      var localTime = localData._metadata ? new Date(localData._metadata.updatedAt).getTime() : 0;
      var cloudTime = cloudData._metadata ? new Date(cloudData._metadata.updatedAt).getTime() : 0;

      return {
        hasConflict: false,
        resolution: localTime > cloudTime ? 'local' : 'cloud',
        data: localTime > cloudTime ? localData : cloudData
      };
    }

    DEBUG.warn('[CONFLICT] Conflict detected for ' + entity + ': ' + detection.reason);

    // Apply resolution strategy
    var result;
    switch (CONFIG.defaultStrategy) {
      case 'last-write-wins':
        result = resolveLastWriteWins(localData, cloudData);
        break;

      case 'version-based':
        result = resolveVersionBased(localData, cloudData);
        break;

      case 'field-merge':
        var mergeResult = resolveFieldLevelMerge(localData, cloudData);
        result = {
          winner: mergeResult.conflicts.length > 0 ? 'merged' : 'cloud',
          data: mergeResult.merged,
          conflicts: mergeResult.conflicts
        };
        break;

      default:
        result = resolveLastWriteWins(localData, cloudData);
    }

    // If manual resolution needed, save conflict for user review
    if (result.winner === 'manual') {
      saveConflictForManualResolution(entity, localData, cloudData);
      return {
        hasConflict: true,
        resolution: 'manual',
        data: null,
        localData: localData,
        cloudData: cloudData
      };
    }

    // Record conflict resolution in monitoring
    if (window.MigrationMonitoring) {
      window.MigrationMonitoring.recordConflict(entity, CONFIG.defaultStrategy, result.winner);
    }

    return {
      hasConflict: true,
      resolution: result.winner,
      data: result.data,
      conflicts: result.conflicts
    };
  }

  // =============================================================================
  // MANUAL CONFLICT RESOLUTION
  // =============================================================================

  /**
   * Save conflict for manual resolution
   * @param {string} entity - Entity type
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   */
  function saveConflictForManualResolution(entity, localData, cloudData) {
    try {
      var conflicts = getStoredConflicts();
      conflicts.push({
        id: 'conflict_' + Date.now(),
        entity: entity,
        localData: localData,
        cloudData: cloudData,
        createdAt: new Date().toISOString(),
        resolved: false
      });
      localStorage.setItem(CONFIG.conflictStorageKey, JSON.stringify(conflicts));

      // Notify user
      if (window.ErrorHandler) {
        window.ErrorHandler.showWarning('Sync conflict detected. Please review.');
      }
    } catch (e) {
      DEBUG.error('[CONFLICT] Failed to save conflict', e);
    }
  }

  /**
   * Get stored conflicts awaiting manual resolution
   * @returns {Array} Array of conflicts
   */
  function getStoredConflicts() {
    try {
      var raw = localStorage.getItem(CONFIG.conflictStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Show conflict resolution UI
   * @param {string} conflictId - Conflict ID to show
   */
  function showConflictResolutionUI(conflictId) {
    var conflicts = getStoredConflicts();
    var conflict = null;

    for (var i = 0; i < conflicts.length; i++) {
      if (conflicts[i].id === conflictId) {
        conflict = conflicts[i];
        break;
      }
    }

    if (!conflict) {
      DEBUG.error('[CONFLICT] Conflict not found: ' + conflictId);
      return;
    }

    // Create modal
    var modal = createConflictModal(conflict);
    document.body.appendChild(modal);
    setTimeout(function() {
      modal.classList.add('active');
    }, 10);
  }

  /**
   * Create conflict resolution modal
   * @param {Object} conflict - Conflict object
   * @returns {HTMLElement} Modal element
   */
  function createConflictModal(conflict) {
    var modal = document.createElement('div');
    modal.className = 'conflict-modal';
    modal.innerHTML =
      '<div class="conflict-modal-content">' +
        '<div class="conflict-modal-header">' +
          '<h2>Sync Conflict Detected</h2>' +
          '<p>The same ' + conflict.entity + ' was modified on multiple devices. Choose which version to keep:</p>' +
        '</div>' +
        '<div class="conflict-modal-body">' +
          '<div class="conflict-comparison">' +
            '<div class="conflict-version">' +
              '<h3>Your Local Version</h3>' +
              '<pre>' + JSON.stringify(conflict.localData, null, 2) + '</pre>' +
              '<button type="button" class="btn btn-primary" onclick="window.MigrationConflictResolution.resolveManual(\'' + conflict.id + '\', \'local\')">Use This Version</button>' +
            '</div>' +
            '<div class="conflict-version">' +
              '<h3>Cloud Version</h3>' +
              '<pre>' + JSON.stringify(conflict.cloudData, null, 2) + '</pre>' +
              '<button type="button" class="btn btn-primary" onclick="window.MigrationConflictResolution.resolveManual(\'' + conflict.id + '\', \'cloud\')">Use This Version</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="conflict-modal-footer">' +
          '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.conflict-modal\').remove()">Cancel</button>' +
        '</div>' +
      '</div>';

    return modal;
  }

  /**
   * Manually resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} choice - 'local' or 'cloud'
   */
  function resolveManual(conflictId, choice) {
    var conflicts = getStoredConflicts();
    var conflict = null;
    var index = -1;

    for (var i = 0; i < conflicts.length; i++) {
      if (conflicts[i].id === conflictId) {
        conflict = conflicts[i];
        index = i;
        break;
      }
    }

    if (!conflict) {
      DEBUG.error('[CONFLICT] Conflict not found: ' + conflictId);
      return;
    }

    // Get chosen data
    var chosenData = choice === 'local' ? conflict.localData : conflict.cloudData;

    // Update metadata
    if (window.MigrationUUID) {
      chosenData = window.MigrationUUID.addMetadataToRecord(chosenData);
      chosenData._metadata.syncStatus = 'pending'; // Re-sync with resolution
    }

    // Save to localStorage
    try {
      // Determine storage key based on entity
      var key = getStorageKeyForEntity(conflict.entity);
      if (key) {
        var existing = localStorage.getItem(key);
        var data = existing ? JSON.parse(existing) : [];

        // Update or insert
        var found = false;
        for (var j = 0; j < data.length; j++) {
          if (data[j]._metadata && data[j]._metadata.uuid === chosenData._metadata.uuid) {
            data[j] = chosenData;
            found = true;
            break;
          }
        }

        if (!found) {
          data.push(chosenData);
        }

        localStorage.setItem(key, JSON.stringify(data));

        // Queue for sync
        if (window.StorageSync) {
          window.StorageSync.set(key, chosenData);
        }
      }

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolution = choice;
      conflicts[index] = conflict;
      localStorage.setItem(CONFIG.conflictStorageKey, JSON.stringify(conflicts));

      // Close modal
      var modals = document.querySelectorAll('.conflict-modal');
      for (var m = 0; m < modals.length; m++) {
        modals[m].remove();
      }

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Conflict resolved using ' + choice + ' version');
      }

      DEBUG.log('[CONFLICT] Manually resolved conflict ' + conflictId + ' with ' + choice);
    } catch (e) {
      DEBUG.error('[CONFLICT] Failed to resolve conflict', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to resolve conflict');
      }
    }
  }

  /**
   * Get storage key for entity type
   * @param {string} entity - Entity type
   * @returns {string} Storage key
   */
  function getStorageKeyForEntity(entity) {
    var mapping = {
      'quote': 'quote-history',
      'invoice': 'invoice-database',
      'client': 'client-database',
      'preset': 'tictacstick_presets_v1',
      'template': 'quote-templates'
    };
    return mapping[entity] || entity;
  }

  /**
   * Handle conflict from sync module
   * Called by StorageSync when cloud returns conflict
   * @param {string} entity - Entity type
   * @param {Object} localData - Local version
   * @param {Object} cloudData - Cloud version
   */
  function handleConflict(entity, localData, cloudData) {
    DEBUG.warn('[CONFLICT] Handling conflict for ' + entity);

    var resolution = resolveConflict(entity, localData, cloudData);

    if (resolution.resolution === 'manual') {
      // Show UI if enabled
      if (CONFIG.showConflictUI) {
        // Get conflict ID from stored conflicts
        var conflicts = getStoredConflicts();
        var conflictId = conflicts[conflicts.length - 1].id;
        showConflictResolutionUI(conflictId);
      }
    } else if (resolution.data) {
      // Auto-resolved, save to localStorage
      var key = getStorageKeyForEntity(entity);
      if (key) {
        try {
          var existing = localStorage.getItem(key);
          var data = existing ? JSON.parse(existing) : [];

          // Update record
          var found = false;
          for (var i = 0; i < data.length; i++) {
            if (data[i]._metadata && data[i]._metadata.uuid === resolution.data._metadata.uuid) {
              data[i] = resolution.data;
              found = true;
              break;
            }
          }

          if (!found) {
            data.push(resolution.data);
          }

          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          DEBUG.error('[CONFLICT] Failed to save resolution', e);
        }
      }
    }

    return resolution;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  window.MigrationConflictResolution = {
    // Detection
    detectConflict: detectConflict,

    // Resolution
    resolveConflict: resolveConflict,
    resolveLastWriteWins: resolveLastWriteWins,
    resolveVersionBased: resolveVersionBased,
    resolveFieldLevelMerge: resolveFieldLevelMerge,

    // Manual resolution
    handleConflict: handleConflict,
    showConflictResolutionUI: showConflictResolutionUI,
    resolveManual: resolveManual,
    getStoredConflicts: getStoredConflicts,

    // Configuration
    configure: function(config) {
      Object.keys(config).forEach(function(key) {
        if (CONFIG.hasOwnProperty(key)) {
          CONFIG[key] = config[key];
        }
      });
    }
  };

  DEBUG.log('[CONFLICT] Module loaded');

})();
