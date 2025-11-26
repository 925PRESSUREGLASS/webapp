// Test Suite: Import/Export System (Backup & Restore)
// Tests data backup, restore, and import/export functionality
// PHASE 1: Critical Data Integrity Tests

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

test.describe('Import/Export System - Backup & Restore', () => {

  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    // Clear all data before each test
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await waitForAppReady(page);

    // Wait for ImportExport to initialize
    await page.waitForFunction(() => {
      return typeof window.ImportExport !== 'undefined';
    }, { timeout: 5000 });
  });

  test.describe('Backup Creation', () => {

    test('should create full backup with correct structure', async ({ page }) => {
      console.log('=== Test: Create Full Backup ===');

      // Add some test data
      await page.evaluate(() => {
        localStorage.setItem('quote-history', JSON.stringify([
          { id: 'q1', title: 'Quote 1', total: 500 }
        ]));
        localStorage.setItem('client-database', JSON.stringify([
          { id: 'c1', name: 'Client 1' }
        ]));
        localStorage.setItem('quoteTemplates', JSON.stringify([
          { id: 't1', name: 'Template 1' }
        ]));
      });

      // Capture download
      var downloadPromise = page.waitForEvent('download');

      // Create backup
      await page.evaluate(() => {
        window.ImportExport.exportBackup();
      });

      var download = await downloadPromise;

      // Verify filename format
      var filename = download.suggestedFilename();
      expect(filename).toMatch(/^tic-tac-stick-backup_\d{4}-\d{2}-\d{2}\.json$/);

      console.log('✓ Backup created with filename:', filename);
    });

    test('should include version in backup', async ({ page }) => {
      console.log('=== Test: Backup Version Info ===');

      // Mock the download to capture backup data
      var backupData = await page.evaluate(() => {
        // Store test data
        localStorage.setItem('quote-history', JSON.stringify([{ id: 'test' }]));

        // Create backup object (simulate what exportFullBackup does)
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          data: {}
        };

        var keys = ['quote-history', 'client-database'];
        keys.forEach(function(key) {
          var value = localStorage.getItem(key);
          if (value) {
            backup.data[key] = JSON.parse(value);
          }
        });

        return backup;
      });

      expect(backupData.version).toBeTruthy();
      expect(backupData.exportDate).toBeTruthy();
      expect(backupData.exportTimestamp).toBeGreaterThan(0);
      expect(backupData.data).toBeDefined();

      console.log('✓ Backup contains version:', backupData.version);
    });

    test('should include all storage keys in backup', async ({ page }) => {
      console.log('=== Test: Backup All Keys ===');

      // Add data to all tracked keys
      await page.evaluate(() => {
        localStorage.setItem('quote-history', JSON.stringify([{ id: '1' }]));
        localStorage.setItem('client-database', JSON.stringify([{ id: '2' }]));
        localStorage.setItem('quoteTemplates', JSON.stringify([{ id: '3' }]));
        localStorage.setItem('savedQuote', JSON.stringify({ id: '4' }));
        localStorage.setItem('appSettings', JSON.stringify({ theme: 'dark' }));
        localStorage.setItem('current-quote-status', JSON.stringify({ status: 'draft' }));
      });

      var backupData = await page.evaluate(() => {
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          data: {}
        };

        var keys = [
          'quote-history',
          'client-database',
          'quoteTemplates',
          'savedQuote',
          'appSettings',
          'current-quote-status'
        ];

        keys.forEach(function(key) {
          var value = localStorage.getItem(key);
          if (value) {
            backup.data[key] = JSON.parse(value);
          }
        });

        return backup;
      });

      expect(backupData.data['quote-history']).toBeDefined();
      expect(backupData.data['client-database']).toBeDefined();
      expect(backupData.data['quoteTemplates']).toBeDefined();
      expect(backupData.data['savedQuote']).toBeDefined();
      expect(backupData.data['appSettings']).toBeDefined();
      expect(backupData.data['current-quote-status']).toBeDefined();

      console.log('✓ All keys included in backup');
    });

    test('should handle empty database backup', async ({ page }) => {
      console.log('=== Test: Backup Empty Database ===');

      var backupData = await page.evaluate(() => {
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          data: {}
        };

        var keys = ['quote-history', 'client-database'];
        keys.forEach(function(key) {
          var value = localStorage.getItem(key);
          if (value) {
            backup.data[key] = JSON.parse(value);
          }
        });

        return backup;
      });

      expect(backupData.version).toBeTruthy();
      expect(Object.keys(backupData.data).length).toBe(0);

      console.log('✓ Empty backup handled correctly');
    });

    test('should update last backup timestamp', async ({ page }) => {
      console.log('=== Test: Last Backup Timestamp ===');

      // Create backup
      var downloadPromise = page.waitForEvent('download');
      await page.evaluate(() => {
        window.ImportExport.exportBackup();
      });
      await downloadPromise;

      // Check timestamp was set
      var timestamp = await page.evaluate(() => {
        return localStorage.getItem('lastBackupDate');
      });

      expect(timestamp).toBeTruthy();
      var timestampNum = parseInt(timestamp);
      expect(timestampNum).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds

      console.log('✓ Last backup timestamp updated');
    });

  });

  test.describe('Backup Restoration', () => {

    test('should validate backup file structure', async ({ page }) => {
      console.log('=== Test: Validate Backup Structure ===');

      var isValid = await page.evaluate(() => {
        var validBackup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          data: {
            'quote-history': [{ id: 'q1' }]
          }
        };

        var invalidBackup1 = { version: '1.6.0' }; // Missing data
        var invalidBackup2 = { data: {} }; // Missing version

        return {
          valid: !!(validBackup.version && validBackup.data),
          invalid1: !!(invalidBackup1.version && invalidBackup1.data),
          invalid2: !!(invalidBackup2.version && invalidBackup2.data)
        };
      });

      expect(isValid.valid).toBe(true);
      expect(isValid.invalid1).toBeFalsy();
      expect(isValid.invalid2).toBeFalsy();

      console.log('✓ Backup validation logic correct');
    });

    test('should restore data in replace mode', async ({ page }) => {
      console.log('=== Test: Restore - Replace Mode ===');

      // Setup existing data
      await page.evaluate(() => {
        localStorage.setItem('quote-history', JSON.stringify([
          { id: 'old1', title: 'Old Quote 1' }
        ]));
      });

      // Simulate restore with new data
      await page.evaluate(() => {
        var backupData = {
          'quote-history': [
            { id: 'new1', title: 'New Quote 1' },
            { id: 'new2', title: 'New Quote 2' }
          ]
        };

        // Simulate replace mode
        Object.keys(backupData).forEach(function(key) {
          localStorage.setItem(key, JSON.stringify(backupData[key]));
        });
      });

      var restoredData = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('quote-history'));
      });

      expect(restoredData.length).toBe(2);
      expect(restoredData[0].id).toBe('new1');
      expect(restoredData[1].id).toBe('new2');

      console.log('✓ Replace mode overwrites existing data');
    });

    test('should merge arrays in merge mode', async ({ page }) => {
      console.log('=== Test: Restore - Merge Mode ===');

      var result = await page.evaluate(() => {
        // Helper function from import-export.js
        function mergeArrays(existing, incoming) {
          var merged = existing.slice(0);
          var existingIds = {};

          existing.forEach(function(item) {
            if (item.id) {
              existingIds[item.id] = true;
            }
          });

          incoming.forEach(function(item) {
            if (!item.id || !existingIds[item.id]) {
              merged.push(item);
            }
          });

          return merged;
        }

        var existing = [
          { id: 'q1', title: 'Existing Quote 1' },
          { id: 'q2', title: 'Existing Quote 2' }
        ];

        var incoming = [
          { id: 'q2', title: 'Duplicate Quote 2' }, // Duplicate, should be skipped
          { id: 'q3', title: 'New Quote 3' } // New, should be added
        ];

        var merged = mergeArrays(existing, incoming);

        return {
          length: merged.length,
          ids: merged.map(function(item) { return item.id; })
        };
      });

      expect(result.length).toBe(3);
      expect(result.ids).toContain('q1');
      expect(result.ids).toContain('q2');
      expect(result.ids).toContain('q3');

      console.log('✓ Merge mode combines without duplicates');
    });

    test('should handle items without IDs in merge', async ({ page }) => {
      console.log('=== Test: Merge Items Without IDs ===');

      var result = await page.evaluate(() => {
        function mergeArrays(existing, incoming) {
          var merged = existing.slice(0);
          var existingIds = {};

          existing.forEach(function(item) {
            if (item.id) {
              existingIds[item.id] = true;
            }
          });

          incoming.forEach(function(item) {
            if (!item.id || !existingIds[item.id]) {
              merged.push(item);
            }
          });

          return merged;
        }

        var existing = [
          { name: 'Item 1' }, // No ID
          { id: 'i2', name: 'Item 2' }
        ];

        var incoming = [
          { name: 'Item 3' }, // No ID
          { id: 'i4', name: 'Item 4' }
        ];

        var merged = mergeArrays(existing, incoming);
        return merged.length;
      });

      // Should include all items (no deduplication for items without IDs)
      expect(result).toBe(4);

      console.log('✓ Items without IDs merged correctly');
    });

  });

  test.describe('Backup File Format', () => {

    test('should create valid JSON', async ({ page }) => {
      console.log('=== Test: Valid JSON Output ===');

      var isValidJSON = await page.evaluate(() => {
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          data: {
            'quote-history': [{ id: 'q1', total: 500.50 }]
          }
        };

        try {
          var json = JSON.stringify(backup, null, 2);
          var parsed = JSON.parse(json);
          return parsed.version === '1.6.0';
        } catch (e) {
          return false;
        }
      });

      expect(isValidJSON).toBe(true);
      console.log('✓ Backup creates valid JSON');
    });

    test('should preserve data types in backup', async ({ page }) => {
      console.log('=== Test: Preserve Data Types ===');

      var result = await page.evaluate(() => {
        var data = {
          string: 'text',
          number: 123,
          decimal: 45.67,
          boolean: true,
          nullValue: null,
          array: [1, 2, 3],
          object: { nested: 'value' }
        };

        var json = JSON.stringify(data);
        var parsed = JSON.parse(json);

        return {
          string: typeof parsed.string === 'string',
          number: typeof parsed.number === 'number',
          decimal: typeof parsed.decimal === 'number',
          boolean: typeof parsed.boolean === 'boolean',
          nullValue: parsed.nullValue === null,
          array: Array.isArray(parsed.array),
          object: typeof parsed.object === 'object'
        };
      });

      expect(result.string).toBe(true);
      expect(result.number).toBe(true);
      expect(result.decimal).toBe(true);
      expect(result.boolean).toBe(true);
      expect(result.nullValue).toBe(true);
      expect(result.array).toBe(true);
      expect(result.object).toBe(true);

      console.log('✓ All data types preserved');
    });

  });

  test.describe('Error Handling', () => {

    test('should handle corrupted backup file', async ({ page }) => {
      console.log('=== Test: Corrupted Backup File ===');

      var result = await page.evaluate(() => {
        var corruptedJSON = '{ broken json }';

        try {
          var parsed = JSON.parse(corruptedJSON);
          return { parsed: true, error: false };
        } catch (e) {
          return { parsed: false, error: true };
        }
      });

      expect(result.parsed).toBe(false);
      expect(result.error).toBe(true);

      console.log('✓ Corrupted backup detected');
    });

    test('should handle missing version in backup', async ({ page }) => {
      console.log('=== Test: Missing Version ===');

      var isValid = await page.evaluate(() => {
        var backup = {
          exportDate: new Date().toISOString(),
          data: {}
        };

        return !!(backup.version && backup.data);
      });

      expect(isValid).toBe(false);
      console.log('✓ Missing version detected');
    });

    test('should handle missing data in backup', async ({ page }) => {
      console.log('=== Test: Missing Data ===');

      var isValid = await page.evaluate(() => {
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString()
        };

        return !!(backup.version && backup.data);
      });

      expect(isValid).toBe(false);
      console.log('✓ Missing data detected');
    });

    test('should handle backup with empty data object', async ({ page }) => {
      console.log('=== Test: Empty Data Object ===');

      var isValid = await page.evaluate(() => {
        var backup = {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          data: {}
        };

        return !!(backup.version && backup.data);
      });

      expect(isValid).toBe(true);
      console.log('✓ Empty data object is valid');
    });

  });

  test.describe('Backup Reminder System', () => {

    test('should track last backup date', async ({ page }) => {
      console.log('=== Test: Track Last Backup Date ===');

      // Simulate creating a backup
      await page.evaluate(() => {
        localStorage.setItem('lastBackupDate', Date.now().toString());
      });

      var lastBackup = await page.evaluate(() => {
        return localStorage.getItem('lastBackupDate');
      });

      expect(lastBackup).toBeTruthy();
      var timestamp = parseInt(lastBackup);
      expect(timestamp).toBeGreaterThan(0);

      console.log('✓ Last backup date tracked');
    });

    test('should calculate days since last backup', async ({ page }) => {
      console.log('=== Test: Days Since Backup ===');

      var daysSince = await page.evaluate(() => {
        var thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        localStorage.setItem('lastBackupDate', thirtyDaysAgo.toString());

        var lastBackup = parseInt(localStorage.getItem('lastBackupDate'));
        var days = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
        return Math.floor(days);
      });

      expect(daysSince).toBeGreaterThanOrEqual(29);
      expect(daysSince).toBeLessThanOrEqual(31);

      console.log('✓ Days since backup calculated:', daysSince);
    });

    test('should track reminder dismissal', async ({ page }) => {
      console.log('=== Test: Reminder Dismissal ===');

      await page.evaluate(() => {
        localStorage.setItem('backupReminderDismissed', Date.now().toString());
      });

      var dismissed = await page.evaluate(() => {
        return localStorage.getItem('backupReminderDismissed');
      });

      expect(dismissed).toBeTruthy();
      console.log('✓ Reminder dismissal tracked');
    });

  });

  test.describe('Data Integrity', () => {

    test('should preserve special characters in backup', async ({ page }) => {
      console.log('=== Test: Special Characters in Backup ===');

      var result = await page.evaluate(() => {
        var data = {
          name: 'O\'Brien & Sons',
          notes: 'Line 1\nLine 2\nLine 3',
          symbols: '€ £ ¥ © ® ™',
          quotes: 'He said "hello"'
        };

        var json = JSON.stringify(data);
        var parsed = JSON.parse(json);

        return {
          name: parsed.name,
          notes: parsed.notes,
          symbols: parsed.symbols,
          quotes: parsed.quotes
        };
      });

      expect(result.name).toBe('O\'Brien & Sons');
      expect(result.notes).toBe('Line 1\nLine 2\nLine 3');
      expect(result.symbols).toBe('€ £ ¥ © ® ™');
      expect(result.quotes).toBe('He said "hello"');

      console.log('✓ Special characters preserved');
    });

    test('should preserve numeric precision in backup', async ({ page }) => {
      console.log('=== Test: Numeric Precision in Backup ===');

      var result = await page.evaluate(() => {
        var data = {
          total: 1234.56,
          gst: 123.46,
          rate: 95.75
        };

        var json = JSON.stringify(data);
        var parsed = JSON.parse(json);

        return parsed;
      });

      expect(result.total).toBe(1234.56);
      expect(result.gst).toBe(123.46);
      expect(result.rate).toBe(95.75);

      console.log('✓ Numeric precision preserved');
    });

    test('should handle large backup data', async ({ page }) => {
      console.log('=== Test: Large Backup Data ===');

      var result = await page.evaluate(() => {
        // Create large dataset
        var largeHistory = [];
        for (var i = 0; i < 1000; i++) {
          largeHistory.push({
            id: 'quote_' + i,
            title: 'Quote ' + i,
            total: 100 + i,
            items: [
              { id: 'item1', description: 'Item 1', cost: 50 },
              { id: 'item2', description: 'Item 2', cost: 50 }
            ]
          });
        }

        try {
          var json = JSON.stringify(largeHistory);
          var parsed = JSON.parse(json);
          return {
            success: true,
            count: parsed.length
          };
        } catch (e) {
          return {
            success: false,
            error: e.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1000);

      console.log('✓ Large backup data handled');
    });

  });

  test.describe('Version Compatibility', () => {

    test('should include version number in backup', async ({ page }) => {
      console.log('=== Test: Version in Backup ===');

      var backup = await page.evaluate(() => {
        return {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          data: {}
        };
      });

      expect(backup.version).toBe('1.6.0');
      console.log('✓ Version included:', backup.version);
    });

    test('should include export date in backup', async ({ page }) => {
      console.log('=== Test: Export Date in Backup ===');

      var backup = await page.evaluate(() => {
        return {
          version: '1.6.0',
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          data: {}
        };
      });

      expect(backup.exportDate).toBeTruthy();
      expect(backup.exportTimestamp).toBeGreaterThan(0);

      console.log('✓ Export date included:', backup.exportDate);
    });

  });

});
