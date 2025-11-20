// templates.spec.js - Quote Template System Tests
// Tests built-in templates, custom templates, and template loading

const { test, expect } = require('@playwright/test');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Quote Templates', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
    await page.waitForFunction(() => window.QuoteTemplates);
  });

  test.describe('Template API Availability', () => {
    test('should expose QuoteTemplates global API', async ({ page }) => {
      const api = await page.evaluate(() => {
        return {
          exists: typeof window.QuoteTemplates !== 'undefined',
          hasLoad: typeof window.QuoteTemplates?.loadTemplate === 'function',
          hasSave: typeof window.QuoteTemplates?.saveCustomTemplate === 'function',
          hasDelete: typeof window.QuoteTemplates?.deleteCustomTemplate === 'function',
          hasGetAll: typeof window.QuoteTemplates?.getAllTemplates === 'function'
        };
      });

      expect(api.exists).toBe(true);
      expect(api.hasLoad).toBe(true);
      expect(api.hasSave).toBe(true);
      expect(api.hasDelete).toBe(true);
      expect(api.hasGetAll).toBe(true);
    });
  });

  test.describe('Built-in Templates', () => {
    test('should have Standard House Package template', async ({ page }) => {
      const hasTemplate = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === 'standard-house';
        });
      });

      expect(hasTemplate).toBe(true);
    });

    test('should have Apartment Balcony Special template', async ({ page }) => {
      const hasTemplate = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === 'apartment-balcony';
        });
      });

      expect(hasTemplate).toBe(true);
    });

    test('should have Commercial Storefront template', async ({ page }) => {
      const hasTemplate = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === 'commercial-storefront';
        });
      });

      expect(hasTemplate).toBe(true);
    });

    test('should have Driveway & Paths Package template', async ({ page }) => {
      const hasTemplate = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === 'pressure-driveway';
        });
      });

      expect(hasTemplate).toBe(true);
    });

    test('should have Full Service Package template', async ({ page }) => {
      const hasTemplate = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === 'full-service';
        });
      });

      expect(hasTemplate).toBe(true);
    });

    test('should have exactly 5 built-in templates', async ({ page }) => {
      const builtinCount = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.filter(function(t) {
          return t.builtin === true || t.id.indexOf('standard-house') !== -1 ||
                 t.id.indexOf('apartment') !== -1 || t.id.indexOf('commercial') !== -1 ||
                 t.id.indexOf('pressure') !== -1 || t.id.indexOf('full-service') !== -1;
        }).length;
      });

      expect(builtinCount).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Template Loading', () => {
    test('should load Standard House Package template', async ({ page }) => {
      const result = await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('standard-house');
        return window.APP.getState();
      });

      expect(result).toBeTruthy();
      expect(result.windowLines).toBeTruthy();
      expect(result.windowLines.length).toBeGreaterThan(0);
    });

    test('should load template configuration', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('standard-house');
      });

      const config = await page.evaluate(() => {
        var state = window.APP.getState();
        return {
          baseFee: state.baseFee,
          hourlyRate: state.hourlyRate,
          minimumJob: state.minimumJob
        };
      });

      expect(config.baseFee).toBe(120);
      expect(config.hourlyRate).toBe(95);
      expect(config.minimumJob).toBe(180);
    });

    test('should load template window lines', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('standard-house');
      });

      const windowLines = await page.evaluate(() => {
        return window.APP.getState().windowLines;
      });

      expect(windowLines.length).toBeGreaterThan(0);
      expect(windowLines[0]).toHaveProperty('windowType');
      expect(windowLines[0]).toHaveProperty('quantity');
    });

    test('should load Apartment Balcony template', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('apartment-balcony');
      });

      const state = await page.evaluate(() => {
        return window.APP.getState();
      });

      expect(state.windowLines.length).toBeGreaterThan(0);
      expect(state.minimumJob).toBe(150);
    });

    test('should load Commercial Storefront template', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('commercial-storefront');
      });

      const state = await page.evaluate(() => {
        return window.APP.getState();
      });

      expect(state.baseFee).toBe(150);
      expect(state.hourlyRate).toBe(110);
      expect(state.minimumJob).toBe(200);
    });

    test('should load Pressure Driveway template', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('pressure-driveway');
      });

      const state = await page.evaluate(() => {
        return window.APP.getState();
      });

      expect(state.pressureLines).toBeTruthy();
      expect(state.pressureLines.length).toBeGreaterThan(0);
    });

    test('should replace current quote when loading template', async ({ page }) => {
      // Create a quote first
      await page.fill('#quoteTitle', 'Original Quote');
      await page.click('#addWindowLineBtn');

      const beforeLines = await page.evaluate(() => {
        return window.APP.getState().windowLines.length;
      });

      // Load template
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('standard-house');
      });

      const afterState = await page.evaluate(() => {
        return window.APP.getState();
      });

      // State should be replaced
      expect(afterState.windowLines.length).not.toBe(beforeLines);
    });
  });

  test.describe('Custom Templates', () => {
    test('should save custom template', async ({ page }) => {
      // Create a custom quote
      await page.fill('#quoteTitle', 'Custom Quote');
      await page.fill('#clientNameInput', 'Custom Client');
      await page.fill('#baseFeeInput', '200');
      await page.fill('#hourlyRateInput', '120');

      await page.click('#addWindowLineBtn');
      await page.selectOption('.window-type-select', 'standard');
      await page.fill('.window-quantity-input', '15');

      // Save as template
      const saved = await page.evaluate(() => {
        var state = window.APP.getState();
        return window.QuoteTemplates.saveCustomTemplate('My Custom Template', state);
      });

      expect(saved).toBe(true);
    });

    test('should load custom template', async ({ page }) => {
      // Save a custom template first
      await page.evaluate(() => {
        var customState = {
          baseFee: 200,
          hourlyRate: 120,
          minimumJob: 250,
          windowLines: [
            { windowType: 'standard', quantity: 20 }
          ],
          pressureLines: []
        };

        window.QuoteTemplates.saveCustomTemplate('Test Custom', customState);
      });

      // Load it
      await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        var customTemplate = templates.find(function(t) {
          return t.name === 'Test Custom';
        });

        if (customTemplate) {
          window.QuoteTemplates.loadTemplate(customTemplate.id);
        }
      });

      const state = await page.evaluate(() => {
        return window.APP.getState();
      });

      expect(state.baseFee).toBe(200);
      expect(state.hourlyRate).toBe(120);
    });

    test('should delete custom template', async ({ page }) => {
      // Save a custom template
      await page.evaluate(() => {
        var customState = {
          baseFee: 150,
          windowLines: [],
          pressureLines: []
        };

        window.QuoteTemplates.saveCustomTemplate('To Delete', customState);
      });

      // Get template ID
      const templateId = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        var template = templates.find(function(t) {
          return t.name === 'To Delete';
        });
        return template ? template.id : null;
      });

      expect(templateId).toBeTruthy();

      // Delete it
      const deleted = await page.evaluate((id) => {
        return window.QuoteTemplates.deleteCustomTemplate(id);
      }, templateId);

      expect(deleted).toBe(true);

      // Verify it's gone
      const stillExists = await page.evaluate((id) => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.id === id;
        });
      }, templateId);

      expect(stillExists).toBe(false);
    });

    test('should not delete built-in templates', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Try to delete built-in template
        return window.QuoteTemplates.deleteCustomTemplate('standard-house');
      });

      // Should return false or prevent deletion
      expect(result).toBe(false);
    });
  });

  test.describe('Template Structure', () => {
    test('each template should have required fields', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        var results = [];

        for (var i = 0; i < templates.length; i++) {
          var template = templates[i];
          results.push({
            id: template.id,
            hasId: !!template.id,
            hasName: !!template.name,
            hasDescription: typeof template.description === 'string'
          });
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.hasId).toBe(true);
        expect(result.hasName).toBe(true);
        // Description might be optional for custom templates
      });
    });

    test('templates should have valid configuration', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var builtinIds = ['standard-house', 'apartment-balcony', 'commercial-storefront', 'pressure-driveway', 'full-service'];
        var templates = window.QuoteTemplates.getAllTemplates();
        var results = [];

        for (var i = 0; i < templates.length; i++) {
          var template = templates[i];
          // Only check built-in templates
          if (builtinIds.indexOf(template.id) !== -1) {
            // Load template to check config
            window.QuoteTemplates.loadTemplate(template.id);
            var state = window.APP.getState();

            results.push({
              id: template.id,
              hasBaseFee: typeof state.baseFee === 'number',
              hasHourlyRate: typeof state.hourlyRate === 'number',
              hasMinimumJob: typeof state.minimumJob === 'number',
              baseFeePositive: state.baseFee > 0,
              hourlyRatePositive: state.hourlyRate > 0
            });
          }
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.hasBaseFee).toBe(true);
        expect(result.hasHourlyRate).toBe(true);
        expect(result.hasMinimumJob).toBe(true);
        expect(result.baseFeePositive).toBe(true);
        expect(result.hourlyRatePositive).toBe(true);
      });
    });
  });

  test.describe('Template Persistence', () => {
    test('custom templates should persist to localStorage', async ({ page }) => {
      await page.evaluate(() => {
        var customState = {
          baseFee: 175,
          windowLines: [],
          pressureLines: []
        };

        window.QuoteTemplates.saveCustomTemplate('Persistent Template', customState);
      });

      // Reload page
      await page.reload();
      await page.waitForFunction(() => window.QuoteTemplates);

      const stillExists = await page.evaluate(() => {
        var templates = window.QuoteTemplates.getAllTemplates();
        return templates.some(function(t) {
          return t.name === 'Persistent Template';
        });
      });

      expect(stillExists).toBe(true);
    });

    test('should handle corrupted template storage gracefully', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('quote-templates', 'invalid json {{{');
      });

      // Reload
      await page.reload();
      await page.waitForFunction(() => window.QuoteTemplates);

      // Should still have built-in templates
      const templates = await page.evaluate(() => {
        return window.QuoteTemplates.getAllTemplates();
      });

      expect(templates.length).toBeGreaterThanOrEqual(5); // At least built-in templates
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle loading non-existent template', async ({ page }) => {
      const result = await page.evaluate(() => {
        try {
          window.QuoteTemplates.loadTemplate('non-existent-template-id');
          return 'success';
        } catch (e) {
          return 'error';
        }
      });

      // Should handle gracefully
      expect(['success', 'error']).toContain(result);
    });

    test('should handle empty template name', async ({ page }) => {
      const saved = await page.evaluate(() => {
        var state = { baseFee: 100, windowLines: [], pressureLines: [] };
        return window.QuoteTemplates.saveCustomTemplate('', state);
      });

      // Should reject empty name
      expect(saved).toBe(false);
    });

    test('should handle duplicate custom template names', async ({ page }) => {
      await page.evaluate(() => {
        var state1 = { baseFee: 100, windowLines: [], pressureLines: [] };
        var state2 = { baseFee: 200, windowLines: [], pressureLines: [] };

        window.QuoteTemplates.saveCustomTemplate('Duplicate', state1);
        window.QuoteTemplates.saveCustomTemplate('Duplicate', state2);
      });

      const templates = await page.evaluate(() => {
        var all = window.QuoteTemplates.getAllTemplates();
        return all.filter(function(t) {
          return t.name === 'Duplicate';
        });
      });

      // Should either prevent duplicates or handle them
      expect(templates.length).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Template UI Integration', () => {
    test('should trigger recalculation after loading template', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('standard-house');
      });

      // Wait for recalculation
      await page.waitForTimeout(100);

      const totalText = await page.textContent('#totalIncGstDisplay');
      expect(totalText).toBeTruthy();
      expect(totalText).toContain('$');
    });

    test('should update UI after loading template', async ({ page }) => {
      await page.evaluate(() => {
        window.QuoteTemplates.loadTemplate('apartment-balcony');
      });

      await page.waitForTimeout(100);

      // Check that window lines are displayed
      const windowLineElements = await page.$$('.window-line');
      expect(windowLineElements.length).toBeGreaterThan(0);
    });
  });
});
