// backup-manager.js - Backup and restore system for TicTacStick
// Exports/imports all data including quotes, clients, invoices, tasks, analytics
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  var CONFIG = {
    version: '1.8.0',
    backupFilePrefix: 'tictacstick-backup-',
    autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    lastBackupKey: 'tts_last_backup_timestamp'
  };

  // All LocalStorage keys to backup
  var STORAGE_KEYS = [
    'tictacstick_autosave_state_v1',
    'tictacstick_presets_v1',
    'tictacstick_saved_quotes_v1',
    'client-database',
    'invoice-database',
    'invoice-settings',
    'quote-history',
    'tts_tasks',
    'debug-enabled',
    'theme-preference',
    'custom-theme',
    'company-logo',
    'analytics-config',
    'ghl-config',
    'webhook-config',
    'webhook-events-cache'
  ];

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  /**
   * Export all data as JSON backup
   * @returns {string} JSON string of all data
   */
  function exportAllData() {
    console.log('[BACKUP] Exporting all data...');

    var backup = {
      version: CONFIG.version,
      timestamp: new Date().toISOString(),
      exportDate: new Date().toLocaleString(),
      data: {},
      metadata: {
        browser: navigator.userAgent,
        platform: navigator.platform,
        storageUsed: getStorageUsage()
      }
    };

    // Export all storage keys
    for (var i = 0; i < STORAGE_KEYS.length; i++) {
      var key = STORAGE_KEYS[i];
      try {
        var value = localStorage.getItem(key);
        if (value !== null) {
          backup.data[key] = JSON.parse(value);
        }
      } catch (e) {
        console.warn('[BACKUP] Failed to export key:', key, e);
        // Store raw value if JSON parse fails
        backup.data[key] = value;
      }
    }

    console.log('[BACKUP] Export complete:', Object.keys(backup.data).length, 'keys');

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage usage info
   */
  function getStorageUsage() {
    var totalSize = 0;
    var keyCount = 0;

    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        keyCount++;
        var value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length + key.length;
        }
      }
    }

    // Convert to KB
    var sizeKB = Math.round(totalSize / 1024);

    return {
      keys: keyCount,
      sizeKB: sizeKB,
      sizeMB: (sizeKB / 1024).toFixed(2),
      maxSize: '5-10 MB (browser dependent)'
    };
  }

  /**
   * Download backup file
   */
  function downloadBackup() {
    try {
      console.log('[BACKUP] Generating backup file...');

      var data = exportAllData();
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var filename = CONFIG.backupFilePrefix +
                    new Date().toISOString().split('T')[0] + '.json';

      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update last backup timestamp
      localStorage.setItem(CONFIG.lastBackupKey, Date.now().toString());

      console.log('[BACKUP] Backup downloaded:', filename);

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Backup downloaded: ' + filename, 'success');
      }

      return true;
    } catch (e) {
      console.error('[BACKUP] Download failed:', e);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Backup download failed: ' + e.message, 'error');
      }
      return false;
    }
  }

  // ============================================
  // IMPORT FUNCTIONS
  // ============================================

  /**
   * Import backup data
   * @param {string} jsonData - JSON backup data
   * @returns {boolean} Success
   */
  function importBackup(jsonData) {
    try {
      console.log('[BACKUP] Importing backup...');

      var backup = JSON.parse(jsonData);

      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      var message = 'Restore data from backup dated ' +
                   (backup.exportDate || new Date(backup.timestamp).toLocaleString()) +
                   '?\n\nThis will replace all current data.\n\nContinue?';

      if (!confirm(message)) {
        console.log('[BACKUP] Import cancelled by user');
        return false;
      }

      // Create a backup of current data first
      console.log('[BACKUP] Creating safety backup of current data...');
      var safetyBackup = exportAllData();
      try {
        sessionStorage.setItem('tts_pre_restore_backup', safetyBackup);
        console.log('[BACKUP] Safety backup stored in sessionStorage');
      } catch (e) {
        console.warn('[BACKUP] Could not store safety backup:', e);
      }

      // Import data
      var imported = 0;
      var failed = 0;

      for (var key in backup.data) {
        if (backup.data.hasOwnProperty(key)) {
          try {
            var value = backup.data[key];
            // Convert objects back to JSON strings for storage
            if (typeof value === 'object') {
              localStorage.setItem(key, JSON.stringify(value));
            } else {
              localStorage.setItem(key, value);
            }
            imported++;
          } catch (e) {
            console.error('[BACKUP] Failed to import key:', key, e);
            failed++;
          }
        }
      }

      console.log('[BACKUP] Import complete:', imported, 'keys imported,', failed, 'failed');

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast(
          'Backup restored! Imported ' + imported + ' keys. Reloading...',
          'success',
          3000
        );
      } else {
        alert('Backup restored successfully! Reloading application...');
      }

      // Reload page after brief delay
      setTimeout(function() {
        window.location.reload();
      }, 2000);

      return true;

    } catch (e) {
      console.error('[BACKUP] Import failed:', e);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Backup restore failed: ' + e.message, 'error');
      } else {
        alert('Failed to restore backup: ' + e.message);
      }
      return false;
    }
  }

  /**
   * Handle file input for restore
   * @param {File} file - Backup file
   */
  function restoreFromFile(file) {
    if (!file) {
      console.error('[BACKUP] No file provided');
      return;
    }

    console.log('[BACKUP] Reading backup file:', file.name);

    var reader = new FileReader();

    reader.onload = function(e) {
      var jsonData = e.target.result;
      importBackup(jsonData);
    };

    reader.onerror = function(e) {
      console.error('[BACKUP] File read error:', e);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Failed to read backup file', 'error');
      } else {
        alert('Failed to read backup file');
      }
    };

    reader.readAsText(file);
  }

  // ============================================
  // AUTO-BACKUP FUNCTIONS
  // ============================================

  /**
   * Check if auto-backup is due
   * @returns {boolean} True if backup needed
   */
  function isBackupDue() {
    try {
      var lastBackup = localStorage.getItem(CONFIG.lastBackupKey);
      if (!lastBackup) {
        return true; // Never backed up
      }

      var lastBackupTime = parseInt(lastBackup, 10);
      var now = Date.now();
      var elapsed = now - lastBackupTime;

      return elapsed > CONFIG.autoBackupInterval;
    } catch (e) {
      console.error('[BACKUP] Error checking backup status:', e);
      return false;
    }
  }

  /**
   * Get last backup info
   * @returns {Object} Last backup information
   */
  function getLastBackupInfo() {
    try {
      var lastBackup = localStorage.getItem(CONFIG.lastBackupKey);
      if (!lastBackup) {
        return {
          timestamp: null,
          date: 'Never',
          daysAgo: null
        };
      }

      var timestamp = parseInt(lastBackup, 10);
      var date = new Date(timestamp);
      var now = Date.now();
      var daysAgo = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));

      return {
        timestamp: timestamp,
        date: date.toLocaleString(),
        daysAgo: daysAgo
      };
    } catch (e) {
      console.error('[BACKUP] Error getting last backup info:', e);
      return {
        timestamp: null,
        date: 'Unknown',
        daysAgo: null
      };
    }
  }

  /**
   * Prompt user to download backup if due
   */
  function promptAutoBackup() {
    if (isBackupDue()) {
      console.log('[BACKUP] Auto-backup due, prompting user...');

      var lastInfo = getLastBackupInfo();
      var message = 'It has been ';

      if (lastInfo.daysAgo === null) {
        message += 'a while since your last backup';
      } else {
        message += lastInfo.daysAgo + ' days since your last backup';
      }

      message += '.\n\nWould you like to download a backup now?';

      if (confirm(message)) {
        downloadBackup();
      } else {
        // Remind again tomorrow
        var tomorrow = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(CONFIG.lastBackupKey, tomorrow.toString());
      }
    }
  }

  /**
   * Schedule auto-backup check
   */
  function scheduleAutoBackup() {
    // Check on page load
    setTimeout(function() {
      promptAutoBackup();
    }, 5000); // Wait 5 seconds after page load

    // Check periodically (every hour)
    setInterval(function() {
      promptAutoBackup();
    }, 60 * 60 * 1000);

    console.log('[BACKUP] Auto-backup scheduler started');
  }

  // ============================================
  // EMAIL BACKUP (Optional - requires backend)
  // ============================================

  /**
   * Email backup to user
   * @param {string} email - Email address
   */
  function emailBackup(email) {
    console.log('[BACKUP] Email backup not yet implemented');

    // TODO: Integrate with email service or backend (Phase 3+)
    // This would require:
    // 1. Backend endpoint (e.g., /api/send-backup-email)
    // 2. Email service (SendGrid, AWS SES, Mailgun, etc.)
    // 3. Secure email validation on server side
    // 4. Attachment size limits (typical: 10-25 MB)
    // 5. Optional: Cloud storage integration (S3, GCS) with download link
    // Example implementation:
    //   var backupData = generateBackup();
    //   var blob = new Blob([backupData], { type: 'application/json' });
    //   var formData = new FormData();
    //   formData.append('backup', blob, 'tictacstick-backup.json');
    //   formData.append('email', email);
    //   fetch('/api/send-backup-email', { method: 'POST', body: formData })
    //     .then(function(response) { return response.json(); })
    //     .then(function(data) {
    //       UIComponents.showToast('Backup emailed to ' + email, 'success');
    //     })
    //     .catch(function(error) {
    //       console.error('[BACKUP] Email failed:', error);
    //       UIComponents.showToast('Failed to email backup', 'error');
    //     });

    // For now, just download the backup
    downloadBackup();

    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast(
        'Email backup not yet available. Backup downloaded instead.',
        'info'
      );
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Clear all data (factory reset)
   */
  function clearAllData() {
    var message = 'WARNING: This will delete ALL data including:\n\n' +
                 '- All quotes\n' +
                 '- All clients\n' +
                 '- All invoices\n' +
                 '- All tasks\n' +
                 '- All settings\n\n' +
                 'This cannot be undone!\n\n' +
                 'Are you sure you want to continue?';

    if (!confirm(message)) {
      return false;
    }

    // Double confirmation
    if (!confirm('Are you ABSOLUTELY SURE? This cannot be undone!')) {
      return false;
    }

    try {
      console.log('[BACKUP] Clearing all data...');

      // Clear all tracked keys
      for (var i = 0; i < STORAGE_KEYS.length; i++) {
        localStorage.removeItem(STORAGE_KEYS[i]);
      }

      console.log('[BACKUP] All data cleared');

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('All data cleared. Reloading...', 'success');
      } else {
        alert('All data cleared. Reloading application...');
      }

      // Reload page
      setTimeout(function() {
        window.location.reload();
      }, 1500);

      return true;
    } catch (e) {
      console.error('[BACKUP] Clear all failed:', e);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Failed to clear data: ' + e.message, 'error');
      } else {
        alert('Failed to clear data: ' + e.message);
      }
      return false;
    }
  }

  /**
   * Recover from safety backup (in sessionStorage)
   */
  function recoverFromSafetyBackup() {
    try {
      var safetyBackup = sessionStorage.getItem('tts_pre_restore_backup');
      if (!safetyBackup) {
        throw new Error('No safety backup found');
      }

      if (confirm('Restore from safety backup? This will undo the last restore.')) {
        importBackup(safetyBackup);
        return true;
      }

      return false;
    } catch (e) {
      console.error('[BACKUP] Safety backup recovery failed:', e);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Safety backup recovery failed: ' + e.message, 'error');
      } else {
        alert('Safety backup recovery failed: ' + e.message);
      }
      return false;
    }
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('backupManager', {
      exportAllData: exportAllData,
      downloadBackup: downloadBackup,
      importBackup: importBackup,
      restoreFromFile: restoreFromFile,
      getStorageUsage: getStorageUsage,
      getLastBackupInfo: getLastBackupInfo,
      isBackupDue: isBackupDue,
      clearAllData: clearAllData,
      recoverFromSafetyBackup: recoverFromSafetyBackup
    });
  }

  // Global API
  window.BackupManager = {
    exportAllData: exportAllData,
    downloadBackup: downloadBackup,
    importBackup: importBackup,
    restoreFromFile: restoreFromFile,
    getStorageUsage: getStorageUsage,
    getLastBackupInfo: getLastBackupInfo,
    isBackupDue: isBackupDue,
    clearAllData: clearAllData,
    recoverFromSafetyBackup: recoverFromSafetyBackup,
    emailBackup: emailBackup
  };

  // Start auto-backup scheduler on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleAutoBackup);
  } else {
    scheduleAutoBackup();
  }

  console.log('[BACKUP-MANAGER] Initialized');
})();
