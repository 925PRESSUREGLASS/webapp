// pricing-logic.spec.js
// Comprehensive tests for enhanced pricing logic modules
// Tests window-types-extended.js, conditions-modifiers.js, pressure-surfaces-extended.js

const { test, expect } = require('@playwright/test');

test.describe('Window Types Extended', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should load all window types (25+)', async ({ page }) => {
    const count = await page.evaluate(() => {
      return window.WINDOW_TYPES_ARRAY ? window.WINDOW_TYPES_ARRAY.length : 0;
    });

    expect(count).toBeGreaterThanOrEqual(25);
    console.log('Window types loaded:', count);
  });

  test('should expose WindowTypesExtended API', async ({ page }) => {
    const apiExists = await page.evaluate(() => {
      return typeof window.WindowTypesExtended === 'object' &&
             typeof window.WindowTypesExtended.getType === 'function' &&
             typeof window.WindowTypesExtended.calculateTime === 'function' &&
             typeof window.WindowTypesExtended.calculateBasePrice === 'function';
    });

    expect(apiExists).toBe(true);
  });

  test('should get window type by ID', async ({ page }) => {
    const type = await page.evaluate(() => {
      return window.WindowTypesExtended.getType('sliding_1200');
    });

    expect(type).not.toBeNull();
    expect(type.id).toBe('sliding_1200');
    expect(type.name).toContain('1200');
  });

  test('should calculate time correctly for sliding 1200mm', async ({ page }) => {
    const time = await page.evaluate(() => {
      return window.WindowTypesExtended.calculateTime('sliding_1200', 10, true, true);
    });

    // 10 windows × (5 min in + 5 min out) = 100 minutes
    expect(time).toBe(100);
  });

  test('should calculate base price for windows', async ({ page }) => {
    const price = await page.evaluate(() => {
      return window.WindowTypesExtended.calculateBasePrice('sliding_1200', 10);
    });

    // 10 windows × $25 = $250
    expect(price).toBe(250);
  });

  test('should search window types', async ({ page }) => {
    const results = await page.evaluate(() => {
      return window.WindowTypesExtended.searchTypes('louvre');
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe('louvre');
  });

  test('should get window types by category', async ({ page }) => {
    const slidingTypes = await page.evaluate(() => {
      return window.WindowTypesExtended.getTypesByCategory('sliding');
    });

    expect(slidingTypes.length).toBeGreaterThanOrEqual(5);
  });

  test('should calculate difficulty level', async ({ page }) => {
    const difficulty = await page.evaluate(() => {
      var louvre = window.WindowTypesExtended.getDifficulty('louvre_600');
      var sliding = window.WindowTypesExtended.getDifficulty('sliding_600');
      return { louvre: louvre, sliding: sliding };
    });

    expect(difficulty.louvre).toBe('hard');
    expect(difficulty.sliding).toBe('easy');
  });

  test('should get all categories', async ({ page }) => {
    const categories = await page.evaluate(() => {
      return window.WindowTypesExtended.getCategories();
    });

    expect(categories).toContain('sliding');
    expect(categories).toContain('awning');
    expect(categories).toContain('fixed');
    expect(categories).toContain('louvre');
  });
});

test.describe('Conditions Modifiers', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should load all condition modifiers (50+)', async ({ page }) => {
    const counts = await page.evaluate(() => {
      var windowCond = window.WINDOW_CONDITIONS_ARRAY ? window.WINDOW_CONDITIONS_ARRAY.length : 0;
      var accessMod = window.ACCESS_MODIFIERS_ARRAY ? window.ACCESS_MODIFIERS_ARRAY.length : 0;
      var pressureCond = window.PRESSURE_CONDITIONS_ARRAY ? window.PRESSURE_CONDITIONS_ARRAY.length : 0;
      var techniqueMod = window.TECHNIQUE_MODIFIERS_ARRAY ? window.TECHNIQUE_MODIFIERS_ARRAY.length : 0;

      return {
        window: windowCond,
        access: accessMod,
        pressure: pressureCond,
        technique: techniqueMod,
        total: windowCond + accessMod + pressureCond + techniqueMod
      };
    });

    console.log('Modifiers loaded:', counts);
    expect(counts.total).toBeGreaterThanOrEqual(40); // At least 40 modifiers
  });

  test('should expose ConditionsModifiers API', async ({ page }) => {
    const apiExists = await page.evaluate(() => {
      return typeof window.ConditionsModifiers === 'object' &&
             typeof window.ConditionsModifiers.getModifier === 'function' &&
             typeof window.ConditionsModifiers.applyModifier === 'function' &&
             typeof window.ConditionsModifiers.getCombinedMultiplier === 'function';
    });

    expect(apiExists).toBe(true);
  });

  test('should get modifier by ID', async ({ page }) => {
    const modifier = await page.evaluate(() => {
      return window.ConditionsModifiers.getModifier('paint_overspray');
    });

    expect(modifier).not.toBeNull();
    expect(modifier.multiplier).toBe(2.5);
  });

  test('should apply single modifier correctly', async ({ page }) => {
    const adjusted = await page.evaluate(() => {
      return window.ConditionsModifiers.applyModifier(100, 'paint_overspray');
    });

    // 100 × 2.5 = 250
    expect(adjusted).toBe(250);
  });

  test('should apply multiple modifiers correctly', async ({ page }) => {
    const adjusted = await page.evaluate(() => {
      return window.ConditionsModifiers.applyMultipleModifiers(100, [
        'heavy_dirt',   // 1.5x
        'two_story'     // 1.5x
      ]);
    });

    // 100 × 1.5 × 1.5 = 225
    expect(adjusted).toBe(225);
  });

  test('should calculate combined multiplier', async ({ page }) => {
    const multiplier = await page.evaluate(() => {
      return window.ConditionsModifiers.getCombinedMultiplier([
        'normal_dirt',   // 1.2x
        'single_story'   // 1.2x
      ]);
    });

    // 1.2 × 1.2 = 1.44
    expect(multiplier).toBeCloseTo(1.44, 2);
  });

  test('should get pressure-specific modifiers', async ({ page }) => {
    const pressureMods = await page.evaluate(() => {
      if (!window.PRESSURE_CONDITIONS_ARRAY) return [];
      return window.PRESSURE_CONDITIONS_ARRAY.map(function(m) {
        return m.id;
      });
    });

    expect(pressureMods).toContain('oil_stains');
    expect(pressureMods).toContain('algae_green');
    expect(pressureMods).toContain('lichen');
  });

  test('should get applicable modifiers for job type', async ({ page }) => {
    const windowMods = await page.evaluate(() => {
      return window.ConditionsModifiers.getApplicableModifiers('window');
    });

    const pressureMods = await page.evaluate(() => {
      return window.ConditionsModifiers.getApplicableModifiers('pressure');
    });

    expect(windowMods.length).toBeGreaterThan(0);
    expect(pressureMods.length).toBeGreaterThan(0);
  });

  test('should have correct multipliers for specialist conditions', async ({ page }) => {
    const multipliers = await page.evaluate(() => {
      return {
        oil: window.ConditionsModifiers.getModifier('oil_stains').multiplier,
        graffiti: window.ConditionsModifiers.getModifier('graffiti').multiplier,
        chewing_gum: window.ConditionsModifiers.getModifier('chewing_gum').multiplier
      };
    });

    expect(multipliers.oil).toBe(2.0);
    expect(multipliers.graffiti).toBe(2.5);
    expect(multipliers.chewing_gum).toBe(3.0); // Highest multiplier
  });
});

test.describe('Pressure Surfaces Extended', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should load all pressure surface types (30+)', async ({ page }) => {
    const count = await page.evaluate(() => {
      return window.PRESSURE_SURFACES_ARRAY_EXT ? window.PRESSURE_SURFACES_ARRAY_EXT.length : 0;
    });

    expect(count).toBeGreaterThanOrEqual(30);
    console.log('Pressure surfaces loaded:', count);
  });

  test('should expose PressureSurfacesExtended API', async ({ page }) => {
    const apiExists = await page.evaluate(() => {
      return typeof window.PressureSurfacesExtended === 'object' &&
             typeof window.PressureSurfacesExtended.getSurface === 'function' &&
             typeof window.PressureSurfacesExtended.calculateTime === 'function' &&
             typeof window.PressureSurfacesExtended.calculateBasePrice === 'function';
    });

    expect(apiExists).toBe(true);
  });

  test('should get surface by ID', async ({ page }) => {
    const surface = await page.evaluate(() => {
      return window.PressureSurfacesExtended.getSurface('driveway_concrete');
    });

    expect(surface).not.toBeNull();
    expect(surface.id).toBe('driveway_concrete');
    expect(surface.baseRate).toBe(8.00);
  });

  test('should calculate time for concrete driveway', async ({ page }) => {
    const time = await page.evaluate(() => {
      return window.PressureSurfacesExtended.calculateTime('driveway_concrete', 50);
    });

    // 50m² × 1.4 min/m² = 70 minutes
    expect(time).toBe(70);
  });

  test('should calculate base price for surface', async ({ page }) => {
    const price = await page.evaluate(() => {
      return window.PressureSurfacesExtended.calculateBasePrice('driveway_concrete', 50);
    });

    // 50m² × $8/m² = $400
    expect(price).toBe(400);
  });

  test('should differentiate pricing for delicate surfaces', async ({ page }) => {
    const prices = await page.evaluate(() => {
      return {
        concrete: window.PressureSurfacesExtended.calculateBasePrice('patio_concrete', 20),
        limestone: window.PressureSurfacesExtended.calculateBasePrice('patio_limestone', 20)
      };
    });

    // Limestone should be more expensive (delicate surface)
    expect(prices.limestone).toBeGreaterThan(prices.concrete);
  });

  test('should search surfaces by name', async ({ page }) => {
    const results = await page.evaluate(() => {
      return window.PressureSurfacesExtended.searchSurfaces('limestone');
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Limestone');
  });

  test('should get surfaces by category', async ({ page }) => {
    const driveways = await page.evaluate(() => {
      return window.PressureSurfacesExtended.getSurfacesByCategory('driveway');
    });

    expect(driveways.length).toBeGreaterThanOrEqual(4);
  });

  test('should get all categories', async ({ page }) => {
    const categories = await page.evaluate(() => {
      return window.PressureSurfacesExtended.getCategories();
    });

    expect(categories).toContain('driveway');
    expect(categories).toContain('patio');
    expect(categories).toContain('decking');
    expect(categories).toContain('walls');
  });

  test('should have correct difficulty levels', async ({ page }) => {
    const difficulties = await page.evaluate(() => {
      return {
        concrete: window.PressureSurfacesExtended.getDifficulty('driveway_concrete'),
        limestone: window.PressureSurfacesExtended.getDifficulty('patio_limestone'),
        roof: window.PressureSurfacesExtended.getDifficulty('roof_tile'),
        asbestos: window.PressureSurfacesExtended.getDifficulty('roof_asbestos')
      };
    });

    // Concrete should be easy (baseRate < 12, no special notes)
    expect(difficulties.concrete).toBe('easy');
    // Limestone has SOFT in notes, should be hard
    expect(difficulties.limestone).toBe('hard');
    // All roofing is hard
    expect(difficulties.roof).toBe('hard');
    // Asbestos roof has explicit 'roof_asbestos' check for extreme
    expect(difficulties.asbestos).toBe('extreme');
  });
});

test.describe('Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should calculate complete window job with modifiers', async ({ page }) => {
    const result = await page.evaluate(() => {
      // 10 sliding 1200mm windows
      var baseTime = window.WindowTypesExtended.calculateTime('sliding_1200', 10, true, true);
      var basePrice = window.WindowTypesExtended.calculateBasePrice('sliding_1200', 10);

      // Apply heavy dirt + two story modifiers
      var adjustedTime = window.ConditionsModifiers.applyMultipleModifiers(baseTime, ['heavy_dirt', 'two_story']);
      var adjustedPrice = window.ConditionsModifiers.applyMultipleModifiers(basePrice, ['heavy_dirt', 'two_story']);

      return {
        baseTime: baseTime,
        basePrice: basePrice,
        adjustedTime: adjustedTime,
        adjustedPrice: adjustedPrice
      };
    });

    expect(result.baseTime).toBe(100); // 10 × 10 min
    expect(result.basePrice).toBe(250); // 10 × $25
    expect(result.adjustedTime).toBe(225); // 100 × 1.5 × 1.5
    expect(result.adjustedPrice).toBe(562.5); // 250 × 1.5 × 1.5
  });

  test('should calculate complete pressure job with modifiers', async ({ page }) => {
    const result = await page.evaluate(() => {
      // 50m² concrete driveway
      var baseTime = window.PressureSurfacesExtended.calculateTime('driveway_concrete', 50);
      var basePrice = window.PressureSurfacesExtended.calculateBasePrice('driveway_concrete', 50);

      // Apply oil stains modifier
      var adjustedTime = window.ConditionsModifiers.applyModifier(baseTime, 'oil_stains');
      var adjustedPrice = window.ConditionsModifiers.applyModifier(basePrice, 'oil_stains');

      return {
        baseTime: baseTime,
        basePrice: basePrice,
        adjustedTime: adjustedTime,
        adjustedPrice: adjustedPrice
      };
    });

    expect(result.baseTime).toBe(70); // 50 × 1.4 min
    expect(result.basePrice).toBe(400); // 50 × $8
    expect(result.adjustedTime).toBe(140); // 70 × 2.0
    expect(result.adjustedPrice).toBe(800); // 400 × 2.0
  });

  test('should handle mixed job with windows and pressure cleaning', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Windows: 5 × sliding 900mm
      var windowTime = window.WindowTypesExtended.calculateTime('sliding_900', 5, true, true);
      var windowPrice = window.WindowTypesExtended.calculateBasePrice('sliding_900', 5);

      // Pressure: 30m² patio
      var pressureTime = window.PressureSurfacesExtended.calculateTime('patio_concrete', 30);
      var pressurePrice = window.PressureSurfacesExtended.calculateBasePrice('patio_concrete', 30);

      return {
        windowTime: windowTime,
        windowPrice: windowPrice,
        pressureTime: pressureTime,
        pressurePrice: pressurePrice,
        totalTime: windowTime + pressureTime,
        totalPrice: windowPrice + pressurePrice
      };
    });

    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalPrice).toBeGreaterThan(0);
    expect(result.windowTime).toBe(40); // 5 × 8 min
    expect(result.pressureTime).toBe(48); // 30 × 1.6 min
  });

  test('should validate all modules are registered with APP', async ({ page }) => {
    const registered = await page.evaluate(() => {
      return {
        windowTypes: !!window.APP.getModule('windowTypesExtended'),
        conditions: !!window.APP.getModule('conditionsModifiers'),
        pressureSurfaces: !!window.APP.getModule('pressureSurfacesExtended')
      };
    });

    expect(registered.windowTypes).toBe(true);
    expect(registered.conditions).toBe(true);
    expect(registered.pressureSurfaces).toBe(true);
  });
});
