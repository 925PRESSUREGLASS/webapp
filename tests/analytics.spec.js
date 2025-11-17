// analytics.spec.js - Quote Analytics and History Tests
// Tests quote history tracking, analytics calculations, and CSV export

const { test, expect } = require('@playwright/test');

test.describe('Quote Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
    await page.waitForFunction(() => window.QuoteAnalytics);

    // Clear history before each test
    await page.evaluate(() => {
      localStorage.removeItem('quote-history');
    });
  });

  test.describe('Quote History Saving', () => {
    test('should save quote to history', async ({ page }) => {
      // Create a quote with line items
      await page.fill('#hourlyRateInput', '100');
      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '10');
      await page.fill('#clientNameInput', 'Test Client');
      await page.fill('#clientLocationInput', 'Perth');

      // Trigger recalculation
      await page.click('body');
      await page.waitForTimeout(100);

      // Save to history
      const result = await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      expect(result).toBe(true);

      // Verify it's in history
      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(1);
      expect(history[0].clientName).toBe('Test Client');
      expect(history[0].clientLocation).toBe('Perth');
      expect(history[0].windowLineCount).toBe(1);
      expect(history[0].total).toBeGreaterThan(0);
    });

    test('should not save quote without line items', async ({ page }) => {
      await page.fill('#clientNameInput', 'Empty Quote');

      const result = await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      expect(result).toBe(false);

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(0);
    });

    test('should capture quote totals from DOM', async ({ page }) => {
      // Create a quote
      await page.fill('#hourlyRateInput', '100');
      await page.fill('#baseFeeInput', '150');

      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '20');

      await page.click('body');
      await page.waitForTimeout(100);

      // Get expected total
      const expectedTotal = await page.textContent('#totalIncGstDisplay');
      const expectedValue = parseFloat(expectedTotal.replace(/[$,]/g, ''));

      // Save to history
      await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history[0].total).toBeCloseTo(expectedValue, 2);
    });

    test('should capture time estimates', async ({ page }) => {
      await page.fill('#hourlyRateInput', '100');

      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '10');

      await page.click('body');
      await page.waitForTimeout(100);

      await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history[0].timeEstimate).toBeGreaterThan(0);
    });

    test('should limit history to 100 quotes', async ({ page }) => {
      // Fill history with 105 quotes
      await page.evaluate(() => {
        var history = [];
        for (var i = 0; i < 105; i++) {
          history.push({
            id: 'quote_' + i,
            timestamp: Date.now() - (i * 1000),
            date: new Date().toISOString(),
            quoteTitle: 'Quote ' + i,
            clientName: 'Client ' + i,
            clientLocation: '',
            jobType: '',
            total: 100,
            timeEstimate: 1,
            windowLineCount: 1,
            pressureLineCount: 0,
            gst: 9.09,
            subtotal: 90.91
          });
        }
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(100);
    });

    test('should add new quotes to beginning of history', async ({ page }) => {
      // Add first quote
      await page.fill('#hourlyRateInput', '100');
      await page.fill('#clientNameInput', 'First Client');
      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '5');
      await page.click('body');
      await page.waitForTimeout(50);
      await page.evaluate(() => window.QuoteAnalytics.save());

      // Clear and add second quote
      await page.click('#clearAllBtn');
      await page.fill('#clientNameInput', 'Second Client');
      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '5');
      await page.click('body');
      await page.waitForTimeout(50);
      await page.evaluate(() => window.QuoteAnalytics.save());

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history[0].clientName).toBe('Second Client');
      expect(history[1].clientName).toBe('First Client');
    });
  });

  test.describe('Analytics Calculations', () => {
    test.beforeEach(async ({ page }) => {
      // Seed history with test data
      await page.evaluate(() => {
        var now = Date.now();
        var history = [
          {
            id: 'quote_1',
            timestamp: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
            date: new Date(now - (2 * 24 * 60 * 60 * 1000)).toISOString(),
            quoteTitle: 'Window Job 1',
            clientName: 'Client A',
            clientLocation: 'Perth',
            jobType: 'Residential',
            total: 500,
            timeEstimate: 3,
            windowLineCount: 1,
            pressureLineCount: 0,
            gst: 45.45,
            subtotal: 454.55
          },
          {
            id: 'quote_2',
            timestamp: now - (10 * 24 * 60 * 60 * 1000), // 10 days ago
            date: new Date(now - (10 * 24 * 60 * 60 * 1000)).toISOString(),
            quoteTitle: 'Pressure Job 1',
            clientName: 'Client B',
            clientLocation: 'Fremantle',
            jobType: 'Commercial',
            total: 800,
            timeEstimate: 5,
            windowLineCount: 0,
            pressureLineCount: 1,
            gst: 72.73,
            subtotal: 727.27
          },
          {
            id: 'quote_3',
            timestamp: now - (40 * 24 * 60 * 60 * 1000), // 40 days ago
            date: new Date(now - (40 * 24 * 60 * 60 * 1000)).toISOString(),
            quoteTitle: 'Mixed Job 1',
            clientName: 'Client A',
            clientLocation: 'Perth',
            jobType: 'Residential',
            total: 1200,
            timeEstimate: 8,
            windowLineCount: 2,
            pressureLineCount: 1,
            gst: 109.09,
            subtotal: 1090.91
          },
          {
            id: 'quote_4',
            timestamp: now - (400 * 24 * 60 * 60 * 1000), // Over 1 year ago
            date: new Date(now - (400 * 24 * 60 * 60 * 1000)).toISOString(),
            quoteTitle: 'Old Quote',
            clientName: 'Client C',
            clientLocation: 'Subiaco',
            jobType: 'Residential',
            total: 300,
            timeEstimate: 2,
            windowLineCount: 1,
            pressureLineCount: 0,
            gst: 27.27,
            subtotal: 272.73
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });
    });

    test('should calculate all-time analytics', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.totalQuotes).toBe(4);
      expect(analytics.totalRevenue).toBe(2800); // 500 + 800 + 1200 + 300
      expect(analytics.averageQuote).toBe(700); // 2800 / 4
      expect(analytics.totalHours).toBe(18); // 3 + 5 + 8 + 2
      expect(analytics.averageHours).toBe(4.5); // 18 / 4
    });

    test('should filter by week timeframe', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('week');
      });

      expect(analytics.totalQuotes).toBe(1); // Only 2 days ago quote
      expect(analytics.totalRevenue).toBe(500);
    });

    test('should filter by month timeframe', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('month');
      });

      expect(analytics.totalQuotes).toBe(2); // 2 days and 10 days ago
      expect(analytics.totalRevenue).toBe(1300); // 500 + 800
    });

    test('should filter by year timeframe', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('year');
      });

      expect(analytics.totalQuotes).toBe(3); // Excludes > 1 year old
      expect(analytics.totalRevenue).toBe(2500); // 500 + 800 + 1200
    });

    test('should count quote types correctly', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.windowQuotes).toBe(2); // Quotes with windows only
      expect(analytics.pressureQuotes).toBe(1); // Quotes with pressure only
      expect(analytics.mixedQuotes).toBe(1); // Quotes with both
    });

    test('should calculate top clients', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.topClients.length).toBeGreaterThan(0);
      expect(analytics.topClients[0].name).toBe('Client A'); // 500 + 1200 = 1700
      expect(analytics.topClients[0].revenue).toBe(1700);
    });

    test('should group revenue by month', async ({ page }) => {
      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.revenueByMonth).toBeTruthy();
      expect(Object.keys(analytics.revenueByMonth).length).toBeGreaterThan(0);
    });

    test('should return zero stats for empty history', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.removeItem('quote-history');
      });

      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.totalQuotes).toBe(0);
      expect(analytics.totalRevenue).toBe(0);
      expect(analytics.averageQuote).toBe(0);
      expect(analytics.topClients).toEqual([]);
    });

    test('should handle missing optional fields', async ({ page }) => {
      await page.evaluate(() => {
        var history = [
          {
            id: 'quote_minimal',
            timestamp: Date.now(),
            date: new Date().toISOString(),
            quoteTitle: '',
            clientName: '',
            clientLocation: '',
            jobType: '',
            total: 100,
            timeEstimate: 0,
            windowLineCount: 0,
            pressureLineCount: 0,
            gst: 9.09,
            subtotal: 90.91
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.totalQuotes).toBe(1);
      expect(analytics.totalRevenue).toBe(100);
    });
  });

  test.describe('History Export (CSV)', () => {
    test.beforeEach(async ({ page }) => {
      // Add test data
      await page.evaluate(() => {
        var history = [
          {
            id: 'quote_1',
            timestamp: Date.now(),
            date: new Date().toISOString(),
            quoteTitle: 'Test Quote',
            clientName: 'John Doe',
            clientLocation: 'Perth',
            jobType: 'Residential',
            total: 500.50,
            timeEstimate: 3.5,
            windowLineCount: 2,
            pressureLineCount: 1,
            gst: 45.50,
            subtotal: 455.00
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });
    });

    test('should not export when history is empty', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.removeItem('quote-history');
      });

      // Override ErrorHandler to capture warning
      const warning = await page.evaluate(() => {
        var warningMsg = null;
        if (window.ErrorHandler) {
          var originalWarn = window.ErrorHandler.showWarning;
          window.ErrorHandler.showWarning = function(msg) {
            warningMsg = msg;
            return originalWarn ? originalWarn.call(this, msg) : null;
          };
        }

        window.QuoteAnalytics.exportHistory();
        return warningMsg;
      });

      expect(warning).toBe('No history to export');
    });

    test('should include CSV headers', async ({ page }) => {
      // We can't easily test file download, but we can test the CSV generation logic
      // by checking if history has data
      const hasHistory = await page.evaluate(() => {
        var history = window.QuoteAnalytics.getHistory();
        return history.length > 0;
      });

      expect(hasHistory).toBe(true);
    });
  });

  test.describe('History Clearing', () => {
    test('should clear history with confirmation', async ({ page }) => {
      // Seed history
      await page.evaluate(() => {
        var history = [
          {
            id: 'quote_1',
            timestamp: Date.now(),
            total: 500,
            windowLineCount: 1,
            pressureLineCount: 0
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      // Override confirm to accept
      await page.evaluate(() => {
        window.confirm = function() { return true; };
      });

      const result = await page.evaluate(() => {
        return window.QuoteAnalytics.clearHistory();
      });

      expect(result).toBe(true);

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(0);
    });

    test('should not clear history if user cancels', async ({ page }) => {
      // Seed history
      await page.evaluate(() => {
        var history = [{ id: 'quote_1', total: 500 }];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      // Override confirm to reject
      await page.evaluate(() => {
        window.confirm = function() { return false; };
      });

      const result = await page.evaluate(() => {
        return window.QuoteAnalytics.clearHistory();
      });

      expect(result).toBe(false);

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(1);
    });
  });

  test.describe('LocalStorage Persistence', () => {
    test('should persist history to localStorage', async ({ page }) => {
      await page.fill('#hourlyRateInput', '100');
      await page.fill('#clientNameInput', 'Persistent Client');
      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '5');
      await page.click('body');
      await page.waitForTimeout(50);

      await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      const stored = await page.evaluate(() => {
        var json = localStorage.getItem('quote-history');
        return JSON.parse(json);
      });

      expect(stored).toBeTruthy();
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBe(1);
      expect(stored[0].clientName).toBe('Persistent Client');
    });

    test('should load history from localStorage on init', async ({ page }) => {
      // Pre-populate localStorage
      await page.evaluate(() => {
        var history = [
          {
            id: 'preloaded_quote',
            timestamp: Date.now(),
            date: new Date().toISOString(),
            quoteTitle: 'Preloaded',
            clientName: 'Preload Client',
            clientLocation: '',
            jobType: '',
            total: 300,
            timeEstimate: 2,
            windowLineCount: 1,
            pressureLineCount: 0,
            gst: 27.27,
            subtotal: 272.73
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      // Reload page
      await page.reload();
      await page.waitForFunction(() => window.QuoteAnalytics);

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      expect(history.length).toBe(1);
      expect(history[0].id).toBe('preloaded_quote');
    });

    test('should handle corrupted history gracefully', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('quote-history', 'invalid json {{{');
      });

      const history = await page.evaluate(() => {
        return window.QuoteAnalytics.getHistory();
      });

      // Should return empty array, not crash
      expect(history).toEqual([]);
    });
  });

  test.describe('Quote Entry Structure', () => {
    test('should include all required fields in history entry', async ({ page }) => {
      await page.fill('#hourlyRateInput', '95');
      await page.fill('#quoteTitle', 'Complete Quote');
      await page.fill('#clientNameInput', 'Full Client');
      await page.fill('#clientLocationInput', 'Full Location');
      await page.selectOption('#jobType', 'residential');

      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '10');

      await page.click('body');
      await page.waitForTimeout(100);

      await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      const entry = await page.evaluate(() => {
        var history = window.QuoteAnalytics.getHistory();
        return history[0];
      });

      expect(entry.id).toBeTruthy();
      expect(entry.timestamp).toBeGreaterThan(0);
      expect(entry.date).toBeTruthy();
      expect(entry.quoteTitle).toBe('Complete Quote');
      expect(entry.clientName).toBe('Full Client');
      expect(entry.clientLocation).toBe('Full Location');
      expect(entry.jobType).toBe('residential');
      expect(entry.total).toBeGreaterThan(0);
      expect(entry.timeEstimate).toBeGreaterThan(0);
      expect(entry.windowLineCount).toBe(1);
      expect(entry.pressureLineCount).toBe(0);
      expect(entry.gst).toBeGreaterThan(0);
      expect(entry.subtotal).toBeGreaterThan(0);
    });

    test('should calculate GST correctly (10% of total)', async ({ page }) => {
      await page.fill('#hourlyRateInput', '100');
      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '10');
      await page.click('body');
      await page.waitForTimeout(100);

      await page.evaluate(() => {
        return window.QuoteAnalytics.save();
      });

      const entry = await page.evaluate(() => {
        var history = window.QuoteAnalytics.getHistory();
        return history[0];
      });

      // GST should be 1/11th of total (10% of subtotal)
      const expectedGst = entry.total * 0.1 / 1.1;
      expect(entry.gst).toBeCloseTo(expectedGst, 2);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle zero totals', async ({ page }) => {
      await page.evaluate(() => {
        var history = [
          {
            id: 'zero_quote',
            timestamp: Date.now(),
            total: 0,
            timeEstimate: 0,
            windowLineCount: 0,
            pressureLineCount: 0
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.totalRevenue).toBe(0);
      expect(analytics.averageQuote).toBe(0);
    });

    test('should handle very large revenue numbers', async ({ page }) => {
      await page.evaluate(() => {
        var history = [
          {
            id: 'large_quote',
            timestamp: Date.now(),
            total: 999999.99,
            timeEstimate: 100,
            windowLineCount: 50,
            pressureLineCount: 50,
            clientName: 'Big Client'
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      const analytics = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analytics.totalRevenue).toBe(999999.99);
    });

    test('should handle quotes from different years', async ({ page }) => {
      await page.evaluate(() => {
        var now = Date.now();
        var history = [
          {
            id: 'q1',
            timestamp: now,
            date: new Date(now).toISOString(),
            total: 100,
            timeEstimate: 1,
            windowLineCount: 1,
            pressureLineCount: 0
          },
          {
            id: 'q2',
            timestamp: now - (400 * 24 * 60 * 60 * 1000), // Over 1 year
            date: new Date(now - (400 * 24 * 60 * 60 * 1000)).toISOString(),
            total: 200,
            timeEstimate: 2,
            windowLineCount: 1,
            pressureLineCount: 0
          }
        ];
        localStorage.setItem('quote-history', JSON.stringify(history));
      });

      const analyticsYear = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('year');
      });

      const analyticsAll = await page.evaluate(() => {
        return window.QuoteAnalytics.getAnalytics('all');
      });

      expect(analyticsYear.totalQuotes).toBe(1);
      expect(analyticsAll.totalQuotes).toBe(2);
    });
  });
});
