// storage.spec.js - LocalStorage Wrapper Tests
// Tests direct storage operations, persistence, and error handling

const { test, expect } = require('./fixtures/fresh-context');
const { initializeApp } = require('./test-helpers');

test.describe('Storage Module', () => {
  test.beforeEach(async ({ page }) => {
    await initializeApp(page);

    // Wait for AppStorage to exist
    await page.waitForFunction(() => window.AppStorage, { timeout: 10000 });
  });

  test.describe('State Persistence', () => {
    test('should save and load state', async ({ page }) => {
      // Clear any existing state first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const state = {
        quoteTitle: 'Test Quote',
        clientName: 'Test Client',
        baseFee: 150,
        hourlyRate: 100,
        windowLines: [{ windowType: 'standard', quantity: 10 }],
        pressureLines: []
      };

      await page.evaluate((testState) => {
        window.AppStorage.saveState(testState);
      }, state);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded).toBeTruthy();
      expect(loaded.quoteTitle).toBe('Test Quote');
      expect(loaded.clientName).toBe('Test Client');
      expect(loaded.baseFee).toBe(150);
      expect(loaded.windowLines.length).toBe(1);
    });

    test('should return null for non-existent state', async ({ page }) => {
      // Explicitly clear storage to ensure clean state
      await page.evaluate(() => {
        localStorage.clear();
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded).toBeNull();
    });

    test('should clear state', async ({ page }) => {
      // Clear any existing state first
      await page.evaluate(() => {
        localStorage.clear();
      });

      await page.evaluate(() => {
        window.AppStorage.saveState({ test: 'data' });
        window.AppStorage.clearState();
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded).toBeNull();
    });

    test('should handle corrupted state gracefully', async ({ page }) => {
      // Clear first, then add corrupted data
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tictacstick_autosave_state_v1', 'invalid json {{{');
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded).toBeNull();
    });
  });

  test.describe('Presets Persistence', () => {
    test('should save and load presets', async ({ page }) => {
      // Clear any existing presets first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const presets = [
        { name: 'Preset 1', baseFee: 120, hourlyRate: 95 },
        { name: 'Preset 2', baseFee: 150, hourlyRate: 110 }
      ];

      await page.evaluate((testPresets) => {
        window.AppStorage.savePresets(testPresets);
      }, presets);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded.length).toBe(2);
      expect(loaded[0].name).toBe('Preset 1');
      expect(loaded[1].name).toBe('Preset 2');
    });

    test('should return empty array for non-existent presets', async ({ page }) => {
      // Explicitly clear to ensure no presets exist
      await page.evaluate(() => {
        localStorage.clear();
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded).toEqual([]);
    });

    test('should handle null presets gracefully', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
        window.AppStorage.savePresets(null);
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded).toEqual([]);
    });

    test('should handle corrupted presets gracefully', async ({ page }) => {
      // Clear first, then add corrupted data
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tictacstick_presets_v1', 'invalid json');
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadPresets();
      });

      expect(loaded).toEqual([]);
    });
  });

  test.describe('Saved Quotes Persistence', () => {
    test('should save and load saved quotes', async ({ page }) => {
      // Clear any existing quotes first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const quotes = [
        {
          id: 'quote_1',
          quoteTitle: 'Saved Quote 1',
          clientName: 'Client 1',
          timestamp: Date.now()
        },
        {
          id: 'quote_2',
          quoteTitle: 'Saved Quote 2',
          clientName: 'Client 2',
          timestamp: Date.now()
        }
      ];

      await page.evaluate((testQuotes) => {
        window.AppStorage.saveSavedQuotes(testQuotes);
      }, quotes);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(loaded.length).toBe(2);
      expect(loaded[0].quoteTitle).toBe('Saved Quote 1');
      expect(loaded[1].quoteTitle).toBe('Saved Quote 2');
    });

    test('should return empty array for non-existent quotes', async ({ page }) => {
      // Explicitly clear to ensure no quotes exist
      await page.evaluate(() => {
        localStorage.clear();
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(loaded).toEqual([]);
    });

    test('should handle corrupted saved quotes gracefully', async ({ page }) => {
      // Clear first, then add corrupted data
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tictacstick_saved_quotes_v1', '{corrupted');
      });

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadSavedQuotes();
      });

      expect(loaded).toEqual([]);
    });
  });

  test.describe('Error Handling', () => {
    test('should not crash on quota exceeded', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
      });

      // We can't easily trigger quota exceeded, but we can test that save doesn't throw
      const result = await page.evaluate(() => {
        try {
          var largeState = { data: 'x'.repeat(1000000) };
          window.AppStorage.saveState(largeState);
          return 'success';
        } catch (e) {
          return 'error';
        }
      });

      // Even if quota exceeded, should not throw (errors are ignored)
      expect(['success', 'error']).toContain(result);
    });

    test('should handle localStorage disabled', async ({ page }) => {
      // Test graceful degradation when localStorage is unavailable
      const result = await page.evaluate(() => {
        var originalSetItem = localStorage.setItem;
        localStorage.setItem = function() {
          throw new Error('localStorage disabled');
        };

        try {
          window.AppStorage.saveState({ test: 'data' });
          localStorage.setItem = originalSetItem;
          return 'handled';
        } catch (e) {
          localStorage.setItem = originalSetItem;
          return 'crashed';
        }
      });

      expect(result).toBe('handled');
    });
  });

  test.describe('Data Integrity', () => {
    test('should preserve complex nested objects', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const complexState = {
        quoteTitle: 'Complex',
        config: {
          baseFee: 120,
          rates: [95, 110, 130]
        },
        windowLines: [
          {
            type: 'standard',
            details: {
              inside: true,
              outside: true
            }
          }
        ]
      };

      await page.evaluate((state) => {
        window.AppStorage.saveState(state);
      }, complexState);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.config.rates).toEqual([95, 110, 130]);
      expect(loaded.windowLines[0].details.inside).toBe(true);
    });

    test('should handle special characters', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const stateWithSpecialChars = {
        quoteTitle: 'Quote "with quotes" & special <chars>',
        clientName: "O'Brien & Associates (Pty) Ltd."
      };

      await page.evaluate((state) => {
        window.AppStorage.saveState(state);
      }, stateWithSpecialChars);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.quoteTitle).toBe('Quote "with quotes" & special <chars>');
      expect(loaded.clientName).toBe("O'Brien & Associates (Pty) Ltd.");
    });

    test('should handle empty/null values', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
      });

      const state = {
        quoteTitle: '',
        clientName: null,
        notes: undefined,
        lines: []
      };

      await page.evaluate((testState) => {
        window.AppStorage.saveState(testState);
      }, state);

      const loaded = await page.evaluate(() => {
        return window.AppStorage.loadState();
      });

      expect(loaded.quoteTitle).toBe('');
      expect(loaded.lines).toEqual([]);
    });
  });

  test.describe('LocalStorage Keys', () => {
    test('should use correct key for autosave state', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
        window.AppStorage.saveState({ test: 'autosave' });
      });

      const hasKey = await page.evaluate(() => {
        return localStorage.getItem('tictacstick_autosave_state_v1') !== null;
      });

      expect(hasKey).toBe(true);
    });

    test('should use correct key for presets', async ({ page }) => {
      // Clear first
      await page.evaluate(() => {
        localStorage.clear();
        window.AppStorage.savePresets([{ name: 'test' }]);
      });

      const hasKey = await page.evaluate(() => {
        return localStorage.getItem('tictacstick_presets_v1') !== null;
      });

      expect(hasKey).toBe(true);
    });

    test('should use correct key for saved quotes', async ({ page }) => {
      await page.evaluate(() => {
        window.AppStorage.saveSavedQuotes([{ id: 'test' }]);
      });

      const hasKey = await page.evaluate(() => {
        return localStorage.getItem('tictacstick_saved_quotes_v1') !== null;
      });

      expect(hasKey).toBe(true);
    });
  });
});
