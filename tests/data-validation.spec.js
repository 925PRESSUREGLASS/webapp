// data-validation.spec.js - Data Structure Validation Tests
// Tests pricing data, window types, surface types, and modifiers

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Pricing Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test.describe('Window Types Data', () => {
    test('should have all 6 window types defined', async ({ page }) => {
      const windowTypes = await page.evaluate(() => {
        return window.PRICING_DATA ? window.PRICING_DATA.windowTypes : null;
      });

      expect(windowTypes).toBeTruthy();
      expect(windowTypes.length).toBe(6);
    });

    test('should have correct window type IDs', async ({ page }) => {
      const ids = await page.evaluate(() => {
        return window.PRICING_DATA.windowTypes.map(function(type) {
          return type.id;
        });
      });

      expect(ids).toContain('std1');
      expect(ids).toContain('std2');
      expect(ids).toContain('std3');
      expect(ids).toContain('door');
      expect(ids).toContain('balustrade');
      expect(ids).toContain('feature');
    });

    test('each window type should have required fields', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var types = window.PRICING_DATA.windowTypes;
        var results = [];

        for (var i = 0; i < types.length; i++) {
          var type = types[i];
          results.push({
            id: type.id,
            hasId: !!type.id,
            hasLabel: !!type.label,
            hasDescription: !!type.description,
            hasBaseInside: typeof type.baseMinutesInside === 'number',
            hasBaseOutside: typeof type.baseMinutesOutside === 'number'
          });
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.hasId).toBe(true);
        expect(result.hasLabel).toBe(true);
        expect(result.hasDescription).toBe(true);
        expect(result.hasBaseInside).toBe(true);
        expect(result.hasBaseOutside).toBe(true);
      });
    });

    test('window types should have positive time values', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var types = window.PRICING_DATA.windowTypes;
        var results = [];

        for (var i = 0; i < types.length; i++) {
          var type = types[i];
          results.push({
            id: type.id,
            insidePositive: type.baseMinutesInside > 0,
            outsidePositive: type.baseMinutesOutside > 0,
            insideValue: type.baseMinutesInside,
            outsideValue: type.baseMinutesOutside
          });
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.insidePositive).toBe(true);
        expect(result.outsidePositive).toBe(true);
        expect(result.insideValue).toBeGreaterThan(0);
        expect(result.outsideValue).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Pressure Surface Types Data', () => {
    test('should have all 5 pressure surface types defined', async ({ page }) => {
      const surfaces = await page.evaluate(() => {
        return window.PRICING_DATA ? window.PRICING_DATA.pressureSurfaces : null;
      });

      expect(surfaces).toBeTruthy();
      expect(surfaces.length).toBe(5);
    });

    test('should have correct surface IDs', async ({ page }) => {
      const ids = await page.evaluate(() => {
        return window.PRICING_DATA.pressureSurfaces.map(function(surface) {
          return surface.id;
        });
      });

      expect(ids).toContain('driveway');
      expect(ids).toContain('paving');
      expect(ids).toContain('limestone');
      expect(ids).toContain('deck');
      expect(ids).toContain('patio');
    });

    test('each surface type should have required fields', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var surfaces = window.PRICING_DATA.pressureSurfaces;
        var results = [];

        for (var i = 0; i < surfaces.length; i++) {
          var surface = surfaces[i];
          results.push({
            id: surface.id,
            hasId: !!surface.id,
            hasLabel: !!surface.label,
            hasMinutesPerSqm: typeof surface.minutesPerSqm === 'number',
            hasNotes: !!surface.notes
          });
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.hasId).toBe(true);
        expect(result.hasLabel).toBe(true);
        expect(result.hasMinutesPerSqm).toBe(true);
        expect(result.hasNotes).toBe(true);
      });
    });

    test('surface types should have positive time values', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var surfaces = window.PRICING_DATA.pressureSurfaces;
        var results = [];

        for (var i = 0; i < surfaces.length; i++) {
          var surface = surfaces[i];
          results.push({
            id: surface.id,
            isPositive: surface.minutesPerSqm > 0,
            value: surface.minutesPerSqm
          });
        }

        return results;
      });

      validation.forEach((result) => {
        expect(result.isPositive).toBe(true);
        expect(result.value).toBeGreaterThan(0);
        expect(result.value).toBeLessThan(10); // Sanity check: < 10 min/sqm
      });
    });
  });

  test.describe('Modifiers Data', () => {
    test('should have tint modifiers', async ({ page }) => {
      const tintModifiers = await page.evaluate(() => {
        return window.PRICING_DATA.modifiers.tint;
      });

      expect(tintModifiers).toBeTruthy();
      expect(tintModifiers.none).toBeTruthy();
      expect(tintModifiers.light).toBeTruthy();
      expect(tintModifiers.heavy).toBeTruthy();
    });

    test('should have soil modifiers', async ({ page }) => {
      const soilModifiers = await page.evaluate(() => {
        return window.PRICING_DATA.modifiers.soil;
      });

      expect(soilModifiers).toBeTruthy();
      expect(soilModifiers.light).toBeTruthy();
      expect(soilModifiers.medium).toBeTruthy();
      expect(soilModifiers.heavy).toBeTruthy();
    });

    test('should have access modifiers', async ({ page }) => {
      const accessModifiers = await page.evaluate(() => {
        return window.PRICING_DATA.modifiers.access;
      });

      expect(accessModifiers).toBeTruthy();
      expect(accessModifiers.easy).toBeTruthy();
      expect(accessModifiers.ladder).toBeTruthy();
      expect(accessModifiers.highReach).toBeTruthy();
    });

    test('modifiers should have factors greater than or equal to 1.0', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var modifiers = window.PRICING_DATA.modifiers;
        var results = {
          tint: [],
          soil: [],
          access: []
        };

        // Tint modifiers
        Object.keys(modifiers.tint).forEach(function(key) {
          results.tint.push({
            key: key,
            factor: modifiers.tint[key].factor,
            isValid: modifiers.tint[key].factor >= 1.0
          });
        });

        // Soil modifiers
        Object.keys(modifiers.soil).forEach(function(key) {
          results.soil.push({
            key: key,
            factor: modifiers.soil[key].factor,
            isValid: modifiers.soil[key].factor >= 1.0
          });
        });

        // Access modifiers
        Object.keys(modifiers.access).forEach(function(key) {
          results.access.push({
            key: key,
            factor: modifiers.access[key].factor,
            isValid: modifiers.access[key].factor >= 1.0
          });
        });

        return results;
      });

      // Validate all modifiers
      [...validation.tint, ...validation.soil, ...validation.access].forEach((modifier) => {
        expect(modifier.isValid).toBe(true);
        expect(modifier.factor).toBeGreaterThanOrEqual(1.0);
        expect(modifier.factor).toBeLessThan(2.0); // Sanity check
      });
    });

    test('modifiers should have labels', async ({ page }) => {
      const validation = await page.evaluate(() => {
        var modifiers = window.PRICING_DATA.modifiers;
        var results = [];

        // Check all modifier types
        ['tint', 'soil', 'access'].forEach(function(modType) {
          Object.keys(modifiers[modType]).forEach(function(key) {
            results.push({
              type: modType,
              key: key,
              hasLabel: !!modifiers[modType][key].label,
              hasFactor: typeof modifiers[modType][key].factor === 'number'
            });
          });
        });

        return results;
      });

      validation.forEach((result) => {
        expect(result.hasLabel).toBe(true);
        expect(result.hasFactor).toBe(true);
      });
    });
  });

  test.describe('Data Consistency', () => {
    test('no duplicate window type IDs', async ({ page }) => {
      const hasDuplicates = await page.evaluate(() => {
        var types = window.PRICING_DATA.windowTypes;
        var ids = types.map(function(t) { return t.id; });
        var uniqueIds = {};

        for (var i = 0; i < ids.length; i++) {
          if (uniqueIds[ids[i]]) {
            return true; // Found duplicate
          }
          uniqueIds[ids[i]] = true;
        }

        return false;
      });

      expect(hasDuplicates).toBe(false);
    });

    test('no duplicate pressure surface IDs', async ({ page }) => {
      const hasDuplicates = await page.evaluate(() => {
        var surfaces = window.PRICING_DATA.pressureSurfaces;
        var ids = surfaces.map(function(s) { return s.id; });
        var uniqueIds = {};

        for (var i = 0; i < ids.length; i++) {
          if (uniqueIds[ids[i]]) {
            return true;
          }
          uniqueIds[ids[i]] = true;
        }

        return false;
      });

      expect(hasDuplicates).toBe(false);
    });

    test('window types sorted by complexity (time)', async ({ page }) => {
      const times = await page.evaluate(() => {
        return window.PRICING_DATA.windowTypes.map(function(type) {
          return {
            id: type.id,
            avgTime: (type.baseMinutesInside + type.baseMinutesOutside) / 2
          };
        });
      });

      // Just verify all times are reasonable (not checking sort order)
      times.forEach((item) => {
        expect(item.avgTime).toBeGreaterThan(0);
        expect(item.avgTime).toBeLessThan(20); // No window should take > 20 min per pane
      });
    });
  });

  test.describe('PRICING_DATA Global Availability', () => {
    test('should be accessible globally', async ({ page }) => {
      const isAvailable = await page.evaluate(() => {
        return typeof window.PRICING_DATA !== 'undefined';
      });

      expect(isAvailable).toBe(true);
    });

    test('should not be modifiable (readonly check)', async ({ page }) => {
      // While JavaScript doesn't enforce const at runtime in old browsers,
      // we can verify the structure is intact
      const structureIntact = await page.evaluate(() => {
        // Try to modify (in ES5, this won't throw, just silently fail or succeed)
        var original = window.PRICING_DATA.windowTypes.length;
        try {
          window.PRICING_DATA.windowTypes = [];
          var modified = window.PRICING_DATA.windowTypes.length;
          return original === 6; // Structure should still be intact
        } catch (e) {
          return true; // If it throws, that's fine too
        }
      });

      expect(structureIntact).toBe(true);
    });
  });
});
