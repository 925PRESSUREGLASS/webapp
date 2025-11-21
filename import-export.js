// import-export.js - Data backup, restore, and import/export functionality
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Export all application data as JSON
  function exportFullBackup() {
    try {
      if (window.LoadingState) {
        window.LoadingState.show('Creating backup...');
      }

      var backup = {
        version: '1.6.0',
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        data: {}
      };

      // Collect all localStorage data
      var keys = [
        'quote-history',
        'client-database',
        'quoteTemplates',
        'savedQuote',
        'appSettings',
        'current-quote-status'
      ];

      keys.forEach(function(key) {
        try {
          var value = localStorage.getItem(key);
          if (value) {
            backup.data[key] = window.Security.safeJSONParse(value, null, null);
          }
        } catch (e) {
          console.warn('Failed to export:', key, e);
        }
      });

      // Create filename
      var dateStr = new Date().toISOString().split('T')[0];
      var filename = 'tic-tac-stick-backup_' + dateStr + '.json';

      // Download
      downloadJSON(backup, filename);

      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Backup created successfully');
      }

      // Update last backup timestamp
      localStorage.setItem('lastBackupDate', Date.now().toString());

      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to create backup');
      }
      return false;
    }
  }

  // Import/restore from backup file
  function importBackup(file, mode) {
    if (!file) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('No file selected');
      }
      return;
    }

    if (window.LoadingState) {
      window.LoadingState.show('Restoring backup...');
    }

    var reader = new FileReader();

    reader.onload = function(e) {
      try {
        var backup = window.Security.safeJSONParse(
          e.target.result,
          null,
          null
        );

        if (!backup || !backup.version || !backup.data) {
          throw new Error('Invalid backup file format');
        }

        // Confirmation
        var message = 'Restore backup from ' + new Date(backup.exportDate).toLocaleDateString() + '?\n\n';
        message += 'Mode: ' + (mode === 'replace' ? 'REPLACE all data' : 'MERGE with existing data');

        if (!confirm(message)) {
          if (window.LoadingState) {
            window.LoadingState.hide();
          }
          return;
        }

        // Restore data
        Object.keys(backup.data).forEach(function(key) {
          try {
            if (mode === 'replace') {
              // Replace mode: overwrite existing data
              localStorage.setItem(key, JSON.stringify(backup.data[key]));
            } else {
              // Merge mode: combine with existing data
              var existing = localStorage.getItem(key);
              if (existing) {
                var existingData = window.Security.safeJSONParse(existing, null, null);
                var backupData = backup.data[key];

                // Merge arrays (for history, clients, templates)
                if (Array.isArray(existingData) && Array.isArray(backupData)) {
                  var merged = mergeArrays(existingData, backupData);
                  localStorage.setItem(key, JSON.stringify(merged));
                } else {
                  // For non-arrays, use backup data
                  localStorage.setItem(key, JSON.stringify(backupData));
                }
              } else {
                localStorage.setItem(key, JSON.stringify(backup.data[key]));
              }
            }
          } catch (err) {
            console.warn('Failed to restore:', key, err);
          }
        });

        if (window.LoadingState) {
          window.LoadingState.hide();
        }

        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess('Backup restored! Reloading...');
        }

        // Reload page to apply changes
        setTimeout(function() {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error('Import failed:', error);
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Failed to restore backup: ' + error.message);
        }
      }
    };

    reader.onerror = function() {
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to read backup file');
      }
    };

    reader.readAsText(file);
  }

  // Merge arrays removing duplicates by ID
  function mergeArrays(existing, incoming) {
    var merged = existing.slice(0);
    var existingIds = {};

    // Build index of existing IDs
    existing.forEach(function(item) {
      if (item.id) {
        existingIds[item.id] = true;
      }
    });

    // Add non-duplicate items from incoming
    incoming.forEach(function(item) {
      if (!item.id || !existingIds[item.id]) {
        merged.push(item);
      }
    });

    return merged;
  }

  // Download JSON file
  function downloadJSON(data, filename) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var link = document.createElement('a');

    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(function() {
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  }

  // Show backup/restore modal
  function showBackupModal() {
    var modal = createBackupModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create backup modal UI
  function createBackupModal() {
    var existing = document.getElementById('backupModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'backupModal';
    modal.className = 'backup-modal';

    var lastBackup = localStorage.getItem('lastBackupDate');
    var lastBackupText = lastBackup ?
      'Last backup: ' + new Date(parseInt(lastBackup)).toLocaleDateString() :
      'No backup created yet';

    modal.innerHTML =
      '<div class="backup-modal-content">' +
        '<div class="backup-modal-header">' +
          '<h2>Data Backup & Restore</h2>' +
          '<button type="button" class="backup-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="backup-modal-body">' +
          '<div class="backup-section">' +
            '<h3>💾 Create Backup</h3>' +
            '<p>Export all your data including quotes, clients, templates, and settings.</p>' +
            '<p class="last-backup-info">' + lastBackupText + '</p>' +
            '<button type="button" class="btn btn-primary" id="createBackupBtn">Create Full Backup</button>' +
          '</div>' +
          '<div class="backup-section">' +
            '<h3>📥 Restore Backup</h3>' +
            '<p>Import data from a previous backup file.</p>' +
            '<div class="restore-options">' +
              '<label class="radio-label">' +
                '<input type="radio" name="restoreMode" value="merge" checked /> ' +
                '<span>Merge with existing data</span>' +
              '</label>' +
              '<label class="radio-label">' +
                '<input type="radio" name="restoreMode" value="replace" /> ' +
                '<span>Replace all data</span>' +
              '</label>' +
            '</div>' +
            '<input type="file" id="backupFileInput" accept=".json" style="display: none;" />' +
            '<button type="button" class="btn btn-secondary" id="selectBackupBtn">Select Backup File</button>' +
          '</div>' +
          '<div class="backup-section">' +
            '<h3>📊 Import from CSV</h3>' +
            '<p>Import quotes from a CSV or Excel file with column mapping.</p>' +
            '<button type="button" class="btn btn-accent" id="csvImportBtn">Import CSV</button>' +
          '</div>' +
          '<div class="backup-section backup-warning">' +
            '<strong>⚠️ Important:</strong> Always create a backup before restoring! ' +
            'Restore operations cannot be undone.' +
          '</div>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.backup-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    modal.querySelector('#createBackupBtn').onclick = function() {
      exportFullBackup();
    };

    var fileInput = modal.querySelector('#backupFileInput');
    modal.querySelector('#selectBackupBtn').onclick = function() {
      fileInput.click();
    };

    fileInput.onchange = function(e) {
      var file = e.target.files[0];
      if (file) {
        var modeInputs = modal.querySelectorAll('input[name="restoreMode"]');
        var mode = 'merge';
        for (var i = 0; i < modeInputs.length; i++) {
          if (modeInputs[i].checked) {
            mode = modeInputs[i].value;
            break;
          }
        }
        importBackup(file, mode);
      }
    };

    // CSV Import button
    var csvImportBtn = modal.querySelector('#csvImportBtn');
    if (csvImportBtn) {
      csvImportBtn.onclick = function() {
        // Close this modal
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
        
        // Open CSV import modal if available
        if (window.CSVImport && window.CSVImport.showImportModal) {
          setTimeout(function() {
            window.CSVImport.showImportModal();
          }, 400);
        } else {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('CSV import module not loaded');
          }
        }
      };
    }

    return modal;
  }

  // Check if backup reminder is needed
  function checkBackupReminder() {
    var lastBackup = localStorage.getItem('lastBackupDate');
    var reminderDismissed = localStorage.getItem('backupReminderDismissed');

    if (reminderDismissed) {
      var dismissedDate = parseInt(reminderDismissed);
      var daysSinceDismissal = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return; // Don't show reminder if dismissed within last 7 days
      }
    }

    if (!lastBackup) {
      // No backup ever created
      var quoteHistory = localStorage.getItem('quote-history');
      if (quoteHistory) {
        var history = window.Security.safeJSONParse(quoteHistory, null, []);
        if (history.length >= 5) {
          showBackupReminder('You have ' + history.length + ' quotes. Create a backup to protect your data!');
        }
      }
    } else {
      // Check if last backup was over 30 days ago
      var lastBackupDate = parseInt(lastBackup);
      var daysSinceBackup = (Date.now() - lastBackupDate) / (1000 * 60 * 60 * 24);
      if (daysSinceBackup >= 30) {
        showBackupReminder('Last backup was ' + Math.floor(daysSinceBackup) + ' days ago. Time to create a new one!');
      }
    }
  }

  // Show backup reminder notification
  function showBackupReminder(message) {
    if (!window.ErrorHandler) return;

    window.ErrorHandler.showWarning(message);

    // Create action button in toast
    setTimeout(function() {
      var toast = document.querySelector('.toast');
      if (toast) {
        var button = document.createElement('button');
        button.textContent = 'Create Backup';
        button.className = 'toast-action-btn';
        button.onclick = function() {
          showBackupModal();
        };
        toast.appendChild(button);
      }
    }, 100);

    localStorage.setItem('backupReminderDismissed', Date.now().toString());
  }

  // Add "Backup" button to UI
  function addBackupButton() {
    var notesFooter = document.querySelector('.notes-footer');
    if (!notesFooter) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'backupDataBtn';
    button.className = 'btn btn-secondary';
    button.textContent = '💾 Backup & Restore';
    button.onclick = showBackupModal;

    notesFooter.appendChild(button);
  }

  // Initialize
  function init() {
    addBackupButton();

    // Check for backup reminder after 3 seconds
    setTimeout(function() {
      checkBackupReminder();
    }, 3000);

    DEBUG.log('[IMPORT/EXPORT] Import/Export initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on window load
  window.addEventListener('load', function() {
    setTimeout(function() {
      addBackupButton();
    }, 500);
  });

  // Export public API
  window.ImportExport = {
    exportBackup: exportFullBackup,
    importBackup: importBackup,
    showBackupModal: showBackupModal
  };

})();
