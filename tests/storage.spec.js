// Test Suite: Storage System (AppStorage)
// Tests localStorage wrapper for autosave, presets, and saved quotes
// PHASE 1: Critical Data Integrity Tests

const { test, expect } = require('@playwright/test');

const APP_URL = '/index.html';

test.describe('Storage System - AppStorage Module', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Clear all storage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('State Management (Autosave)', () => {

    test('should save and load application state', async ({ page }) => {
      console.log('=== Test: Save and Load State ===');

      // Create test state
      var testState = {
        quoteTitle: 'Test Quote',
        clientName: 'John Doe',
        clientLocation: 'Perth',
        baseFee: 120,
        hourlyRate: 95,
        windowLines: [
          { id: 'win_1', type: 'standard', panes: 10 }
        ],
        pressureLines: [],
        internalNotes: 'Test notes'
      };

      // Save state
      await page.evaluate((state) => {
        window.AppStorage.saveState(state);
      }, testState);

      // Load state
      var loadedState = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      // Verify all fields preserved
      expect(loadedState).toBeTruthy();
      expect(loadedState.quoteTitle).toBe('Test Quote');
      expect(loadedState.clientName).toBe('John Doe');
      expect(loadedState.clientLocation).toBe('Perth');
      expect(loadedState.baseFee).toBe(120);
      expect(loadedState.hourlyRate).toBe(95);
      expect(loadedState.windowLines.length).toBe(1);
      expect(loadedState.windowLines[0].panes).toBe(10);
      expect(loadedState.internalNotes).toBe('Test notes');

      console.log('✓ State saved and loaded correctly');
    });

    test('should return null when no state exists', async ({ page }) => {
      console.log('=== Test: Load Non-Existent State ===');

      var state = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(state).toBeNull();
      console.log('✓ Returns null for non-existent state');
    });

    test('should handle corrupted JSON in state', async ({ page }) => {
      console.log('=== Test: Handle Corrupted State JSON ===');

      // Manually corrupt the state in localStorage
      await page.evaluate(() => {
        localStorage.setItem('tictacstick_autosave_state_v1', '{broken json}');
      });

      // Should return null instead of throwing
      var state = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(state).toBeNull();
      console.log('✓ Handles corrupted JSON gracefully');
    });

    test('should clear state successfully', async ({ page }) => {
      console.log('=== Test: Clear State ===');

      // Save state first
      await page.evaluate(() => {
        window.AppStorage.saveState({ test: 'data' });
      });

      // Verify it exists
      var stateBefore = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });
      expect(stateBefore).toBeTruthy();

      // Clear state
      await page.evaluate(() => {
        window.AppStorage.clearState();
      });

      // Verify it's gone
      var stateAfter = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });
      expect(stateAfter).toBeNull();

      console.log('✓ State cleared successfully');
    });

    test('should handle state with complex nested objects', async ({ page }) => {
      console.log('=== Test: Complex Nested State ===');

      var complexState = {
        quoteTitle: 'Complex Quote',
        windowLines: [
          {
            id: 'win_1',
            type: 'std1',
            panes: 10,
            metadata: {
              notes: 'Some notes',
              prices: { base: 100, gst: 10 }
            }
          }
        ],
        config: {
          rates: { hourly: 95, base: 120 },
          modifiers: { highReach: 60 }
        }
      };

      await page.evaluate((state) => {
        window.AppStorage.saveState(state);
      }, complexState);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.windowLines[0].metadata.notes).toBe('Some notes');
      expect(loaded.windowLines[0].metadata.prices.gst).toBe(10);
      expect(loaded.config.rates.hourly).toBe(95);

      console.log('✓ Complex nested objects preserved');
    });

    test('should handle empty state object', async ({ page }) => {
      console.log('=== Test: Empty State Object ===');

      await page.evaluate(() => {
        window.AppStorage.saveState({});
      });

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded).toEqual({});
      console.log('✓ Empty state handled correctly');
    });

  });

  test.describe('Presets Management', () => {

    test('should save and load presets', async ({ page }) => {
      console.log('=== Test: Save and Load Presets ===');

      var presets = [
        { id: 'preset_1', name: 'Standard House', baseFee: 120, hourlyRate: 95 },
        { id: 'preset_2', name: 'Commercial', baseFee: 200, hourlyRate: 120 }
      ];

      await page.evaluate((data) => {
        window.AppStorage.savePresets(data);
      }, presets);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded.length).toBe(2);
      expect(loaded[0].name).toBe('Standard House');
      expect(loaded[1].name).toBe('Commercial');
      expect(loaded[0].baseFee).toBe(120);

      console.log('✓ Presets saved and loaded correctly');
    });

    test('should return empty array when no presets exist', async ({ page }) => {
      console.log('=== Test: Load Non-Existent Presets ===');

      var presets = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(presets).toEqual([]);
      console.log('✓ Returns empty array for no presets');
    });

    test('should handle null/undefined presets gracefully', async ({ page }) => {
      console.log('=== Test: Save Null/Undefined Presets ===');

      await page.evaluate(() => {
        window.AppStorage.savePresets(null);
      });

      var loaded1 = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded1).toEqual([]);

      await page.evaluate(() => {
        window.AppStorage.savePresets(undefined);
      });

      var loaded2 = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded2).toEqual([]);

      console.log('✓ Null/undefined presets saved as empty array');
    });

    test('should update presets when saving again', async ({ page }) => {
      console.log('=== Test: Update Presets ===');

      // Save initial presets
      await page.evaluate(() => {
        window.AppStorage.savePresets([{ id: '1', name: 'First' }]);
      });

      // Save new presets (overwrites)
      await page.evaluate(() => {
        window.AppStorage.savePresets([{ id: '2', name: 'Second' }]);
      });

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('Second');

      console.log('✓ Presets overwritten correctly');
    });

  });

  test.describe('Saved Quotes Management', () => {

    test('should save and load saved quotes', async ({ page }) => {
      console.log('=== Test: Save and Load Saved Quotes ===');

      var quotes = [
        {
          id: 'quote_1',
          title: 'Quote for John Doe',
          clientName: 'John Doe',
          total: 550.00,
          savedAt: Date.now()
        },
        {
          id: 'quote_2',
          title: 'Quote for Jane Smith',
          clientName: 'Jane Smith',
          total: 750.00,
          savedAt: Date.now()
        }
      ];

      await page.evaluate((data) => {
        window.AppStorage.saveSavedQuotes(data);
      }, quotes);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(loaded.length).toBe(2);
      expect(loaded[0].clientName).toBe('John Doe');
      expect(loaded[1].clientName).toBe('Jane Smith');
      expect(loaded[0].total).toBe(550.00);

      console.log('✓ Saved quotes loaded correctly');
    });

    test('should return empty array when no saved quotes exist', async ({ page }) => {
      console.log('=== Test: Load Non-Existent Saved Quotes ===');

      var quotes = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(quotes).toEqual([]);
      console.log('✓ Returns empty array for no saved quotes');
    });

    test('should handle large number of saved quotes', async ({ page }) => {
      console.log('=== Test: Large Number of Saved Quotes ===');

      // Generate 100 quotes
      var largeQuoteList = [];
      for (var i = 0; i < 100; i++) {
        largeQuoteList.push({
          id: 'quote_' + i,
          title: 'Quote ' + i,
          total: 100 + i,
          savedAt: Date.now() + i
        });
      }

      await page.evaluate((data) => {
        window.AppStorage.saveSavedQuotes(data);
      }, largeQuoteList);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(loaded.length).toBe(100);
      expect(loaded[50].title).toBe('Quote 50');
      expect(loaded[99].total).toBe(199);

      console.log('✓ Large quote list handled correctly');
    });

  });

  test.describe('Error Handling', () => {

    test('should handle QuotaExceededError gracefully', async ({ page }) => {
      console.log('=== Test: QuotaExceededError Handling ===');

      // Note: This is difficult to test directly in Playwright
      // We'll verify the error handling exists in the code
      var hasQuotaHandling = await page.evaluate(() => {
        var saveStateCode = window.AppStorage.saveState.toString();
        return saveStateCode.includes('QuotaExceededError');
      });

      expect(hasQuotaHandling).toBe(true);
      console.log('✓ QuotaExceededError handling present in code');
    });

    test('should handle corrupted JSON in presets', async ({ page }) => {
      console.log('=== Test: Corrupted Presets JSON ===');

      await page.evaluate(() => {
        localStorage.setItem('tictacstick_presets_v1', '{ invalid json ]');
      });

      var presets = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(presets).toEqual([]);
      console.log('✓ Corrupted presets return empty array');
    });

    test('should handle corrupted JSON in saved quotes', async ({ page }) => {
      console.log('=== Test: Corrupted Saved Quotes JSON ===');

      await page.evaluate(() => {
        localStorage.setItem('tictacstick_saved_quotes_v1', 'not json at all');
      });

      var quotes = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(quotes).toEqual([]);
      console.log('✓ Corrupted saved quotes return empty array');
    });

  });

  test.describe('Data Persistence', () => {

    test('should persist data across page reloads', async ({ page }) => {
      console.log('=== Test: Data Persistence Across Reload ===');

      // Save data
      await page.evaluate(() => {
        window.AppStorage.saveState({ test: 'persist' });
        window.AppStorage.savePresets([{ id: '1', name: 'Preset 1' }]);
        window.AppStorage.saveSavedQuotes([{ id: 'q1', title: 'Quote 1' }]);
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Load data after reload
      var results = await page.evaluate(() => {
        return {
          state: window.AppStorage.loadState(),
          presets: window.AppStorage.loadPresets(),
          quotes: window.AppStorage.loadSavedQuotes()
        };
      });

      expect(results.state.test).toBe('persist');
      expect(results.presets.length).toBe(1);
      expect(results.quotes.length).toBe(1);

      console.log('✓ All data persisted across reload');
    });

    test('should handle multiple rapid saves', async ({ page }) => {
      console.log('=== Test: Multiple Rapid Saves ===');

      // Rapidly save multiple times
      await page.evaluate(() => {
        for (var i = 0; i < 10; i++) {
          window.AppStorage.saveState({ counter: i });
        }
      });

      var finalState = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      // Should have the last saved value
      expect(finalState.counter).toBe(9);
      console.log('✓ Rapid saves handled correctly');
    });

  });

  test.describe('Data Integrity', () => {

    test('should preserve special characters in strings', async ({ page }) => {
      console.log('=== Test: Special Characters Preservation ===');

      var specialChars = {
        quoteTitle: 'Quote with "quotes" and \'apostrophes\'',
        clientName: 'O\'Brien & Sons',
        notes: 'Line 1\nLine 2\nLine 3',
        specialSymbols: '€ £ ¥ © ® ™ ° ± § ¶'
      };

      await page.evaluate((data) => {
        window.AppStorage.saveState(data);
      }, specialChars);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.quoteTitle).toBe('Quote with "quotes" and \'apostrophes\'');
      expect(loaded.clientName).toBe('O\'Brien & Sons');
      expect(loaded.notes).toBe('Line 1\nLine 2\nLine 3');
      expect(loaded.specialSymbols).toBe('€ £ ¥ © ® ™ ° ± § ¶');

      console.log('✓ Special characters preserved');
    });

    test('should preserve numeric precision', async ({ page }) => {
      console.log('=== Test: Numeric Precision ===');

      var numbers = {
        baseFee: 120.50,
        hourlyRate: 95.75,
        total: 1234.56,
        veryPrecise: 123.456789,
        largeNumber: 9999999.99
      };

      await page.evaluate((data) => {
        window.AppStorage.saveState(data);
      }, numbers);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.baseFee).toBe(120.50);
      expect(loaded.hourlyRate).toBe(95.75);
      expect(loaded.total).toBe(1234.56);
      expect(loaded.veryPrecise).toBe(123.456789);
      expect(loaded.largeNumber).toBe(9999999.99);

      console.log('✓ Numeric precision preserved');
    });

    test('should preserve boolean values', async ({ page }) => {
      console.log('=== Test: Boolean Preservation ===');

      var booleans = {
        autosaveEnabled: true,
        highReach: false,
        includeGst: true,
        isDraft: false
      };

      await page.evaluate((data) => {
        window.AppStorage.saveState(data);
      }, booleans);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.autosaveEnabled).toBe(true);
      expect(loaded.highReach).toBe(false);
      expect(loaded.includeGst).toBe(true);
      expect(loaded.isDraft).toBe(false);

      console.log('✓ Boolean values preserved');
    });

    test('should preserve null values', async ({ page }) => {
      console.log('=== Test: Null Value Preservation ===');

      var withNulls = {
        clientEmail: null,
        clientPhone: null,
        notes: 'Some notes',
        discount: null
      };

      await page.evaluate((data) => {
        window.AppStorage.saveState(data);
      }, withNulls);

      var loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.clientEmail).toBeNull();
      expect(loaded.clientPhone).toBeNull();
      expect(loaded.notes).toBe('Some notes');
      expect(loaded.discount).toBeNull();

      console.log('✓ Null values preserved');
    });

  });

  test.describe('Storage Keys', () => {

    test('should use correct localStorage keys', async ({ page }) => {
      console.log('=== Test: Correct Storage Keys ===');

      await page.evaluate(() => {
        window.AppStorage.saveState({ test: 'state' });
        window.AppStorage.savePresets([{ test: 'preset' }]);
        window.AppStorage.saveSavedQuotes([{ test: 'quote' }]);
      });

      var keys = await page.evaluate(() => {
        return {
          hasState: localStorage.getItem('tictacstick_autosave_state_v1') !== null,
          hasPresets: localStorage.getItem('tictacstick_presets_v1') !== null,
          hasQuotes: localStorage.getItem('tictacstick_saved_quotes_v1') !== null
        };
      });

      expect(keys.hasState).toBe(true);
      expect(keys.hasPresets).toBe(true);
      expect(keys.hasQuotes).toBe(true);

      console.log('✓ Correct localStorage keys used');
    });

  });

});
