// quote-migration.js
// Migration utilities for upgrading quotes to enhanced Australian window types
// Ensures backward compatibility with existing saved quotes
// ES5 compatible

(function() {
  'use strict';

  // Migration utilities
  var QuoteMigration = {

    // Check if a quote needs migration
    needsMigration: function(quote) {
      if (!quote || !quote.windowLines) return false;

      // Check if any window line has old format without conditionId/accessId
      for (var i = 0; i < quote.windowLines.length; i++) {
        var line = quote.windowLines[i];
        // If has soilLevel but no conditionId, needs migration
        if (line.soilLevel && !line.conditionId) {
          return true;
        }
      }

      return false;
    },

    // Migrate a quote to new format (non-destructive - adds new fields, keeps old ones)
    migrateQuote: function(quote) {
      if (!quote) return quote;

      var migrated = JSON.parse(JSON.stringify(quote)); // Deep clone

      // Migrate window lines
      if (migrated.windowLines && migrated.windowLines.length > 0) {
        for (var i = 0; i < migrated.windowLines.length; i++) {
          migrated.windowLines[i] = this.migrateWindowLine(migrated.windowLines[i]);
        }
      }

      // Add migration metadata
      migrated._migrated = true;
      migrated._migrationDate = new Date().toISOString();
      migrated._migrationVersion = '1.0.0';

      return migrated;
    },

    // Migrate a single window line
    migrateWindowLine: function(line) {
      if (!line) return line;

      var migrated = JSON.parse(JSON.stringify(line)); // Clone

      // Map legacy soilLevel to new conditionId
      if (line.soilLevel && !line.conditionId) {
        migrated.conditionId = this.mapSoilLevelToConditionId(line.soilLevel);
      }

      // Map legacy highReach to accessId
      if (!line.accessId) {
        if (line.highReach) {
          migrated.accessId = 'single_story'; // Assume single story ladder work
        } else {
          migrated.accessId = 'ground_level';
        }
      }

      // Keep legacy fields for backward compatibility
      // Don't remove soilLevel, highReach, etc.

      return migrated;
    },

    // Map old soil level to new condition ID
    mapSoilLevelToConditionId: function(soilLevel) {
      var mapping = {
        'light': 'light_dust',
        'medium': 'normal_dirt',
        'heavy': 'heavy_dirt'
      };

      return mapping[soilLevel] || 'normal_dirt';
    },

    // Map old access level to new access ID
    mapAccessLevelToAccessId: function(accessLevel, highReach) {
      if (highReach) {
        return 'single_story'; // High reach usually means ladder work
      }

      var mapping = {
        'easy': 'ground_level',
        'ladder': 'single_story',
        'highReach': 'two_story'
      };

      return mapping[accessLevel] || 'ground_level';
    },

    // Batch migrate all saved quotes in localStorage
    migrateAllSavedQuotes: function() {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage not available, cannot migrate quotes');
        return { success: false, error: 'localStorage not available' };
      }

      var results = {
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: [],
        success: true
      };

      try {
        // Find all saved quotes
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf('quote_') === 0) {
            keys.push(key);
          }
        }

        results.total = keys.length;

        // Migrate each quote
        for (var j = 0; j < keys.length; j++) {
          var quoteKey = keys[j];
          try {
            var quoteJson = localStorage.getItem(quoteKey);
            var quote = JSON.parse(quoteJson);

            if (this.needsMigration(quote)) {
              var migratedQuote = this.migrateQuote(quote);
              localStorage.setItem(quoteKey, JSON.stringify(migratedQuote));
              results.migrated++;
            } else {
              results.skipped++;
            }
          } catch (err) {
            results.errors.push({
              key: quoteKey,
              error: err.message
            });
          }
        }

        if (results.errors.length > 0) {
          results.success = false;
        }

      } catch (err) {
        results.success = false;
        results.error = err.message;
      }

      return results;
    },

    // Test migration with sample data
    test: function() {
      console.log('Testing QuoteMigration...');

      // Sample old-format quote
      var oldQuote = {
        windowLines: [
          {
            windowTypeId: 'std2',
            panes: 10,
            soilLevel: 'medium',
            highReach: true,
            inside: true,
            outside: true
          },
          {
            windowTypeId: 'door',
            panes: 2,
            soilLevel: 'heavy',
            highReach: false,
            inside: true,
            outside: true
          }
        ]
      };

      console.log('Old quote:', oldQuote);

      var needsMigration = this.needsMigration(oldQuote);
      console.log('Needs migration?', needsMigration);

      if (needsMigration) {
        var migratedQuote = this.migrateQuote(oldQuote);
        console.log('Migrated quote:', migratedQuote);

        // Verify migration
        console.log('First line conditionId:', migratedQuote.windowLines[0].conditionId);
        console.log('First line accessId:', migratedQuote.windowLines[0].accessId);
        console.log('First line still has soilLevel:', migratedQuote.windowLines[0].soilLevel);
        console.log('First line still has highReach:', migratedQuote.windowLines[0].highReach);
      }

      console.log('Test complete!');
    },

    // Get migration status report
    getMigrationStatus: function() {
      if (typeof localStorage === 'undefined') {
        return { available: false };
      }

      var status = {
        available: true,
        totalQuotes: 0,
        oldFormat: 0,
        newFormat: 0,
        migrated: 0
      };

      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf('quote_') === 0) {
            status.totalQuotes++;

            var quoteJson = localStorage.getItem(key);
            var quote = JSON.parse(quoteJson);

            if (quote._migrated) {
              status.migrated++;
            } else if (this.needsMigration(quote)) {
              status.oldFormat++;
            } else {
              status.newFormat++;
            }
          }
        }
      } catch (err) {
        status.error = err.message;
      }

      return status;
    }
  };

  // Export globally
  window.QuoteMigration = QuoteMigration;

  // Auto-check on load (non-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        var status = QuoteMigration.getMigrationStatus();
        if (status.oldFormat > 0) {
          console.log('QuoteMigration: Found ' + status.oldFormat + ' quotes in old format');
          console.log('Run QuoteMigration.migrateAllSavedQuotes() to upgrade them');
        }
      }, 1000);
    });
  } else {
    setTimeout(function() {
      var status = QuoteMigration.getMigrationStatus();
      if (status.oldFormat > 0) {
        console.log('QuoteMigration: Found ' + status.oldFormat + ' quotes in old format');
        console.log('Run QuoteMigration.migrateAllSavedQuotes() to upgrade them');
      }
    }, 1000);
  }

})();
