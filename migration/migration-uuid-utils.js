// migration-uuid-utils.js - UUID generation and data migration utilities
// iOS Safari compatible - ES5 JavaScript only
// Purpose: Add globally unique UUIDs, timestamps, and versioning to all LocalStorage records

(function() {
  'use strict';

  // =============================================================================
  // UUID GENERATION
  // =============================================================================

  /**
   * Generate a UUID v4 (random)
   * Uses crypto.randomUUID() if available (modern browsers)
   * Falls back to custom implementation for older browsers (iOS Safari 12+)
   * @returns {string} UUID in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   */
  function generateUUID() {
    // Try native crypto.randomUUID() first (most secure, collision-resistant)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback: Use crypto.getRandomValues() if available
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      // Generate 16 random bytes
      var buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);

      // Set version (4) and variant bits according to RFC 4122
      buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
      buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 10

      // Convert to hex string with dashes
      var hex = [];
      for (var i = 0; i < 16; i++) {
        var byte = buffer[i].toString(16);
        hex.push(byte.length === 1 ? '0' + byte : byte);
      }

      return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join('')
      ].join('-');
    }

    // Last resort fallback: Math.random() based (less secure but works everywhere)
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get or generate device ID (unique to this browser/device)
   * Stored in localStorage for persistence
   * @returns {string} Device UUID
   */
  function getDeviceId() {
    var DEVICE_ID_KEY = 'tictacstick_device_id';
    try {
      var deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch (e) {
      // Fallback if localStorage fails
      return 'device-unknown';
    }
  }

  // =============================================================================
  // METADATA MANAGEMENT
  // =============================================================================

  /**
   * Add metadata to a record (UUID, timestamps, version, sync status)
   * Idempotent - safe to call multiple times on same record
   * @param {Object} record - The record to enhance with metadata
   * @returns {Object} Record with _metadata field added
   */
  function addMetadataToRecord(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    var now = new Date().toISOString();
    var deviceId = getDeviceId();

    // Initialize metadata if doesn't exist
    if (!record._metadata) {
      record._metadata = {};
    }

    var meta = record._metadata;

    // Add UUID if missing (globally unique identifier)
    if (!meta.uuid) {
      meta.uuid = generateUUID();
    }

    // Add createdAt if missing (preserve existing)
    if (!meta.createdAt) {
      // Try to use existing createdAt field if present
      meta.createdAt = record.createdAt
        ? (typeof record.createdAt === 'number'
            ? new Date(record.createdAt).toISOString()
            : record.createdAt)
        : now;
    }

    // Always update updatedAt
    meta.updatedAt = now;

    // Increment version
    meta.version = (meta.version || 0) + 1;

    // Set device ID
    meta.deviceId = deviceId;

    // Initialize sync status if missing
    if (!meta.syncStatus) {
      meta.syncStatus = 'local'; // local, pending, synced, conflict
    }

    // Ensure deletedAt exists (null if not deleted)
    if (!meta.hasOwnProperty('deletedAt')) {
      meta.deletedAt = null;
    }

    // Initialize lastSyncedAt if missing
    if (!meta.lastSyncedAt) {
      meta.lastSyncedAt = null;
    }

    return record;
  }

  /**
   * Mark a record as deleted (soft delete)
   * @param {Object} record - The record to mark as deleted
   * @returns {Object} Record with deletedAt timestamp
   */
  function markAsDeleted(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    record = addMetadataToRecord(record);
    record._metadata.deletedAt = new Date().toISOString();
    record._metadata.syncStatus = 'pending'; // Needs to sync delete
    return record;
  }

  /**
   * Check if a record is deleted
   * @param {Object} record - The record to check
   * @returns {boolean} True if deleted
   */
  function isDeleted(record) {
    return record &&
           record._metadata &&
           record._metadata.deletedAt !== null;
  }

  // =============================================================================
  // DATA VALIDATION & REPAIR
  // =============================================================================

  /**
   * Validate and repair a quote record
   * @param {Object} quote - Quote object to validate
   * @param {number} index - Index in array (for error reporting)
   * @returns {Object} { valid: boolean, issues: string[], repaired: boolean }
   */
  function validateAndRepairQuote(quote, index) {
    var issues = [];
    var repaired = false;

    // Check required fields
    if (!quote.clientName || quote.clientName.trim() === '') {
      issues.push('Quote ' + index + ': Missing clientName');
      quote.clientName = 'Unknown Client';
      repaired = true;
    }

    // Check numeric fields
    var numericFields = ['subtotal', 'gst', 'total'];
    for (var i = 0; i < numericFields.length; i++) {
      var field = numericFields[i];
      var value = parseFloat(quote[field]);
      if (isNaN(value) || !isFinite(value)) {
        issues.push('Quote ' + index + ': Invalid ' + field);
        quote[field] = 0;
        repaired = true;
      } else {
        quote[field] = value;
      }
    }

    // Validate GST calculation (should be subtotal * 0.1)
    var expectedGST = Math.round(quote.subtotal * 0.1 * 100) / 100;
    if (Math.abs(quote.gst - expectedGST) > 0.01) {
      issues.push('Quote ' + index + ': GST mismatch (expected ' + expectedGST + ', got ' + quote.gst + ')');
      quote.gst = expectedGST;
      repaired = true;
    }

    // Validate total calculation
    var expectedTotal = Math.round((quote.subtotal + quote.gst) * 100) / 100;
    if (Math.abs(quote.total - expectedTotal) > 0.01) {
      issues.push('Quote ' + index + ': Total mismatch (expected ' + expectedTotal + ', got ' + quote.total + ')');
      quote.total = expectedTotal;
      repaired = true;
    }

    // Check line items arrays
    if (!Array.isArray(quote.windowLines)) {
      issues.push('Quote ' + index + ': Invalid windowLines');
      quote.windowLines = [];
      repaired = true;
    }
    if (!Array.isArray(quote.pressureLines)) {
      issues.push('Quote ' + index + ': Invalid pressureLines');
      quote.pressureLines = [];
      repaired = true;
    }

    // Check dates
    if (quote.createdAt && typeof quote.createdAt === 'string') {
      var timestamp = Date.parse(quote.createdAt);
      if (isNaN(timestamp)) {
        issues.push('Quote ' + index + ': Invalid createdAt date');
        delete quote.createdAt;
        repaired = true;
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      repaired: repaired
    };
  }

  /**
   * Validate and repair an invoice record
   * @param {Object} invoice - Invoice object to validate
   * @param {number} index - Index in array (for error reporting)
   * @returns {Object} { valid: boolean, issues: string[], repaired: boolean }
   */
  function validateAndRepairInvoice(invoice, index) {
    var issues = [];
    var repaired = false;

    // Check required fields
    if (!invoice.invoiceNumber) {
      issues.push('Invoice ' + index + ': Missing invoiceNumber');
      invoice.invoiceNumber = 'INV-UNKNOWN-' + Date.now();
      repaired = true;
    }

    // Check numeric fields
    var numericFields = ['subtotal', 'gst', 'total', 'amountPaid', 'balance'];
    for (var i = 0; i < numericFields.length; i++) {
      var field = numericFields[i];
      if (invoice.hasOwnProperty(field)) {
        var value = parseFloat(invoice[field]);
        if (isNaN(value) || !isFinite(value) || value < 0) {
          issues.push('Invoice ' + index + ': Invalid ' + field);
          invoice[field] = 0;
          repaired = true;
        } else {
          invoice[field] = value;
        }
      }
    }

    // Validate balance calculation
    var expectedBalance = invoice.total - invoice.amountPaid;
    if (Math.abs(invoice.balance - expectedBalance) > 0.01) {
      issues.push('Invoice ' + index + ': Balance mismatch');
      invoice.balance = Math.max(0, expectedBalance);
      repaired = true;
    }

    // Validate status
    var validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (validStatuses.indexOf(invoice.status) === -1) {
      issues.push('Invoice ' + index + ': Invalid status');
      invoice.status = 'draft';
      repaired = true;
    }

    // Check payments array
    if (!Array.isArray(invoice.payments)) {
      issues.push('Invoice ' + index + ': Invalid payments array');
      invoice.payments = [];
      repaired = true;
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      repaired: repaired
    };
  }

  /**
   * Validate and repair a client record
   * @param {Object} client - Client object to validate
   * @param {number} index - Index in array (for error reporting)
   * @returns {Object} { valid: boolean, issues: string[], repaired: boolean }
   */
  function validateAndRepairClient(client, index) {
    var issues = [];
    var repaired = false;

    // Check required fields
    if (!client.name || client.name.trim() === '') {
      issues.push('Client ' + index + ': Missing name');
      client.name = 'Unknown Client ' + index;
      repaired = true;
    }

    // Trim strings
    var stringFields = ['name', 'email', 'phone', 'address', 'location', 'notes'];
    for (var i = 0; i < stringFields.length; i++) {
      var field = stringFields[i];
      if (typeof client[field] === 'string') {
        var trimmed = client[field].trim();
        if (trimmed !== client[field]) {
          client[field] = trimmed;
          repaired = true;
        }
      }
    }

    // Validate email format (basic check)
    if (client.email && client.email.indexOf('@') === -1) {
      issues.push('Client ' + index + ': Invalid email format');
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      repaired: repaired
    };
  }

  // =============================================================================
  // MIGRATION FUNCTIONS
  // =============================================================================

  /**
   * Migrate a single LocalStorage key
   * Adds UUIDs and metadata to all records in the array
   * @param {string} key - LocalStorage key
   * @param {Function} validator - Optional validator function
   * @returns {Object} Migration result
   */
  function migrateStorageKey(key, validator) {
    var result = {
      key: key,
      success: false,
      recordCount: 0,
      migratedCount: 0,
      issues: [],
      error: null
    };

    try {
      // Read from localStorage
      var raw = localStorage.getItem(key);
      if (!raw) {
        result.success = true;
        return result; // No data, nothing to migrate
      }

      var data = JSON.parse(raw);

      // Handle single object vs array
      var isArray = Array.isArray(data);
      var records = isArray ? data : [data];
      result.recordCount = records.length;

      // Process each record
      for (var i = 0; i < records.length; i++) {
        var record = records[i];

        // Validate and repair if validator provided
        if (validator) {
          var validation = validator(record, i);
          if (validation.issues.length > 0) {
            result.issues = result.issues.concat(validation.issues);
          }
        }

        // Add metadata
        records[i] = addMetadataToRecord(record);
        result.migratedCount++;
      }

      // Write back to localStorage
      var migrated = isArray ? records : records[0];
      localStorage.setItem(key, JSON.stringify(migrated));

      result.success = true;
    } catch (e) {
      result.success = false;
      result.error = e.message || String(e);
    }

    return result;
  }

  /**
   * Run complete migration on all LocalStorage keys
   * This is the main entry point for the migration
   * @returns {Object} Complete migration result
   */
  function runMigration() {
    var startTime = Date.now();
    var results = {
      success: true,
      totalRecords: 0,
      totalMigrated: 0,
      totalIssues: 0,
      keys: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    // Check if migration already run
    var MIGRATION_FLAG = 'tictacstick_migration_v1_complete';
    try {
      var alreadyRun = localStorage.getItem(MIGRATION_FLAG);
      if (alreadyRun === 'true') {
        DEBUG.log('[MIGRATION] Already completed, skipping');
        results.skipped = true;
        return results;
      }
    } catch (e) {
      // Continue with migration
    }

    DEBUG.log('[MIGRATION] Starting UUID and metadata migration...');

    // Migrate each key with appropriate validator
    var migrations = [
      { key: 'tictacstick_autosave_state_v1', validator: null },
      { key: 'tictacstick_saved_quotes_v1', validator: validateAndRepairQuote },
      { key: 'tictacstick_presets_v1', validator: null },
      { key: 'quote-history', validator: validateAndRepairQuote },
      { key: 'client-database', validator: validateAndRepairClient },
      { key: 'invoice-database', validator: validateAndRepairInvoice },
      { key: 'invoice-settings', validator: null },
      { key: 'quote-templates', validator: null }
    ];

    for (var i = 0; i < migrations.length; i++) {
      var config = migrations[i];
      var result = migrateStorageKey(config.key, config.validator);

      results.keys.push(result);
      results.totalRecords += result.recordCount;
      results.totalMigrated += result.migratedCount;
      results.totalIssues += result.issues.length;

      if (!result.success) {
        results.success = false;
        DEBUG.error('[MIGRATION] Failed for key: ' + config.key, result.error);
      }

      if (result.issues.length > 0) {
        DEBUG.warn('[MIGRATION] Issues found in ' + config.key + ':', result.issues);
      }
    }

    results.duration = Date.now() - startTime;

    // Mark migration as complete
    if (results.success) {
      try {
        localStorage.setItem(MIGRATION_FLAG, 'true');
        localStorage.setItem('tictacstick_migration_v1_results', JSON.stringify(results));
        DEBUG.log('[MIGRATION] Complete! Migrated ' + results.totalMigrated + ' records in ' + results.duration + 'ms');
      } catch (e) {
        DEBUG.error('[MIGRATION] Failed to save migration flag', e);
      }
    } else {
      DEBUG.error('[MIGRATION] Failed!', results);
    }

    return results;
  }

  /**
   * Verify migration integrity
   * Check that all records have proper UUIDs and metadata
   * @returns {Object} Verification result
   */
  function verifyMigration() {
    var results = {
      success: true,
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      issues: []
    };

    var keys = [
      'tictacstick_autosave_state_v1',
      'tictacstick_saved_quotes_v1',
      'tictacstick_presets_v1',
      'quote-history',
      'client-database',
      'invoice-database',
      'invoice-settings',
      'quote-templates'
    ];

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      try {
        var raw = localStorage.getItem(key);
        if (!raw) continue;

        var data = JSON.parse(raw);
        var records = Array.isArray(data) ? data : [data];

        for (var j = 0; j < records.length; j++) {
          var record = records[j];
          results.totalRecords++;

          // Check for UUID
          if (!record._metadata || !record._metadata.uuid) {
            results.issues.push(key + '[' + j + ']: Missing UUID');
            results.invalidRecords++;
            results.success = false;
          } else {
            results.validRecords++;
          }
        }
      } catch (e) {
        results.issues.push(key + ': Failed to verify - ' + e.message);
        results.success = false;
      }
    }

    return results;
  }

  /**
   * Export all localStorage data (for backup)
   * @returns {Object} All localStorage data
   */
  function exportAllLocalData() {
    var exported = {
      timestamp: new Date().toISOString(),
      deviceId: getDeviceId(),
      data: {}
    };

    var keys = [
      'tictacstick_autosave_state_v1',
      'tictacstick_saved_quotes_v1',
      'tictacstick_presets_v1',
      'quote-history',
      'client-database',
      'invoice-database',
      'invoice-settings',
      'quote-templates'
    ];

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      try {
        var raw = localStorage.getItem(key);
        if (raw) {
          exported.data[key] = JSON.parse(raw);
        }
      } catch (e) {
        DEBUG.error('[EXPORT] Failed to export key: ' + key, e);
      }
    }

    return exported;
  }

  /**
   * Calculate checksum for data integrity verification
   * Simple hash function for ES5 compatibility
   * @param {*} data - Data to checksum
   * @returns {string} Hex checksum
   */
  function calculateChecksum(data) {
    // Convert to stable JSON string (sorted keys)
    var str = JSON.stringify(data, Object.keys(data).sort());

    // Simple hash function (djb2)
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; // hash * 33 + char
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  // =============================================================================
  // AUTO-INITIALIZATION
  // =============================================================================

  /**
   * Initialize migration on page load
   * Run automatically if not already completed
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runMigration, 100);
      });
    } else {
      setTimeout(runMigration, 100);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  // Export to global scope
  window.MigrationUUID = {
    // UUID generation
    generateUUID: generateUUID,
    getDeviceId: getDeviceId,

    // Metadata management
    addMetadataToRecord: addMetadataToRecord,
    markAsDeleted: markAsDeleted,
    isDeleted: isDeleted,

    // Validation
    validateAndRepairQuote: validateAndRepairQuote,
    validateAndRepairInvoice: validateAndRepairInvoice,
    validateAndRepairClient: validateAndRepairClient,

    // Migration
    runMigration: runMigration,
    verifyMigration: verifyMigration,
    migrateStorageKey: migrateStorageKey,

    // Utilities
    exportAllLocalData: exportAllLocalData,
    calculateChecksum: calculateChecksum
  };

  // Auto-initialize (can be disabled by setting window.DISABLE_AUTO_MIGRATION = true)
  if (!window.DISABLE_AUTO_MIGRATION) {
    init();
  }

  DEBUG.log('[MIGRATION-UUID] Module loaded');

})();
