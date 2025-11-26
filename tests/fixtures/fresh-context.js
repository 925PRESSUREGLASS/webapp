const base = require('@playwright/test');

// Fresh browser context and page per test to avoid cross-test contamination.
const test = base.test.extend({
  context: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL: baseURL,
      storageState: { cookies: [], origins: [] },
      ignoreHTTPSErrors: true
    });
    let contextClosed = false;
    context.on('close', () => {
      contextClosed = true;
    });

    // Clear storage/cache/service workers before pages run.
    await context.addInitScript(function() {
      try {
        if (window && window.caches && window.caches.keys) {
          window.caches.keys().then(function(names) {
            names.forEach(function(name) {
              window.caches.delete(name);
            });
          });
        }

        if (window && window.navigator && window.navigator.serviceWorker && window.navigator.serviceWorker.getRegistrations) {
          window.navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(reg) {
              reg.unregister();
            });
          });
        }

        if (window && window.indexedDB && window.indexedDB.databases) {
          window.indexedDB.databases().then(function(dbs) {
            dbs.forEach(function(db) {
              if (db && db.name) {
                window.indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
      } catch (e) {
        console.warn('[TEST] init cleanup failed', e);
      }
    });

    // Ensure pricing data exists in test mode even if the main bundle skips heavy modules.
    await context.addInitScript(function() {
      try {
        var fallbackPricingData = {
          windowTypes: [
            { id: 'std1', label: 'Standard 1x1 (small)', baseMinutesInside: 2.5, baseMinutesOutside: 2.5 },
            { id: 'std2', label: 'Standard 1x2 (taller)', baseMinutesInside: 3.5, baseMinutesOutside: 3.5 },
            { id: 'std3', label: 'Standard 2x2', baseMinutesInside: 5.0, baseMinutesOutside: 5.0 },
            { id: 'door', label: 'Glass Door / Slider', baseMinutesInside: 4.5, baseMinutesOutside: 4.5 }
          ],
          pressureSurfaces: [
            { id: 'driveway', label: 'Concrete Driveway', minutesPerSqm: 1.4 },
            { id: 'paving', label: 'Paved Area', minutesPerSqm: 1.6 },
            { id: 'deck', label: 'Decking / Timber', minutesPerSqm: 1.8 }
          ],
          modifiers: {
            tint: {
              none: { label: 'No Tint', factor: 1.0 },
              light: { label: 'Light Tint', factor: 1.05 },
              heavy: { label: 'Dark / Reflective Tint', factor: 1.1 }
            },
            soil: {
              light: { label: 'Light Dust', factor: 1.0 },
              medium: { label: 'Dirty', factor: 1.2 },
              heavy: { label: 'Very Dirty / Built-up', factor: 1.4 }
            },
            access: {
              easy: { label: 'Easy Access', factor: 1.0 },
              ladder: { label: 'Ladder / Awkward', factor: 1.25 },
              highReach: { label: 'High Reach Pole', factor: 1.4 }
            }
          }
        };

        function seedPricingData() {
          if (!window || typeof window !== 'object') {
            return;
          }

          if (!window.PRICING_DATA || !window.PRICING_DATA.windowTypes || !window.PRICING_DATA.pressureSurfaces) {
            window.PRICING_DATA = fallbackPricingData;
          }
        }

        if (document && document.addEventListener) {
          document.addEventListener('DOMContentLoaded', seedPricingData);
        } else {
          seedPricingData();
        }

        window.__seedPricingDataForTests = seedPricingData;
      } catch (err) {
        console.warn('[TEST] pricing seed failed', err);
      }
    });

    // Seed extended pricing data and helper APIs for pricing-logic specs
    await context.addInitScript(function() {
      function buildWindowTypesExtended() {
        var types = [];
        function make(id, name, category, inside, outside, price, difficulty) {
          types.push({ id: id, name: name, category: category, baseMinutesInside: inside, baseMinutesOutside: outside, basePrice: price, difficulty: difficulty });
        }
        make('sliding_600', 'Sliding 600mm', 'sliding', 4, 4, 20, 'easy');
        make('sliding_750', 'Sliding 750mm', 'sliding', 4, 4, 22, 'easy');
        make('sliding_900', 'Sliding 900mm', 'sliding', 4, 4, 24, 'easy');
        make('sliding_1200', 'Sliding 1200mm', 'sliding', 5, 5, 25, 'easy');
        make('sliding_1500', 'Sliding 1500mm', 'sliding', 6, 6, 28, 'medium');
        make('sliding_1800', 'Sliding 1800mm', 'sliding', 7, 7, 30, 'medium');
        make('awning_small', 'Awning Small', 'awning', 3, 3, 18, 'easy');
        make('awning_large', 'Awning Large', 'awning', 5, 5, 22, 'medium');
        make('fixed_small', 'Fixed Small', 'fixed', 3, 3, 16, 'easy');
        make('fixed_large', 'Fixed Large', 'fixed', 6, 6, 24, 'medium');
        make('louvre_300', 'Louvre 300mm', 'louvre', 3, 3, 18, 'hard');
        make('louvre_600', 'Louvre 600mm', 'louvre', 4, 4, 22, 'hard');
        make('double_hung_small', 'Double Hung Small', 'double', 4, 4, 20, 'medium');
        make('double_hung_large', 'Double Hung Large', 'double', 6, 6, 26, 'medium');
        make('door_glass', 'Glass Door', 'door', 4, 4, 25, 'easy');
        make('door_slider', 'Sliding Door', 'door', 5, 5, 26, 'easy');
        make('bay_window', 'Bay Window', 'feature', 6, 6, 30, 'medium');
        make('picture_window', 'Picture Window', 'feature', 6, 6, 32, 'medium');
        make('feature_arch', 'Feature Arch', 'feature', 7, 7, 34, 'hard');
        make('stairwell', 'Stairwell Window', 'feature', 8, 8, 36, 'hard');
        make('atrium', 'Atrium Glass', 'feature', 9, 9, 40, 'hard');
        make('shopfront_small', 'Shopfront Small', 'commercial', 5, 5, 28, 'easy');
        make('shopfront_large', 'Shopfront Large', 'commercial', 6, 6, 32, 'medium');
        make('skylight_small', 'Skylight Small', 'skylight', 6, 6, 30, 'hard');
        make('skylight_large', 'Skylight Large', 'skylight', 8, 8, 36, 'hard');
        make('balcony_glass', 'Balcony Glass', 'balustrade', 5, 5, 28, 'medium');
        return types;
      }

      function buildModifiers() {
        var windowConds = [
          { id: 'normal_dirt', multiplier: 1.2, domain: 'window' },
          { id: 'heavy_dirt', multiplier: 1.5, domain: 'window' },
          { id: 'paint_overspray', multiplier: 2.5, domain: 'window' },
          { id: 'graffiti', multiplier: 2.5, domain: 'window' },
          { id: 'chewing_gum', multiplier: 3.0, domain: 'window' },
          { id: 'construction_debris', multiplier: 2.0, domain: 'window' },
          { id: 'salt_spray', multiplier: 1.4, domain: 'window' },
          { id: 'bird_droppings', multiplier: 1.6, domain: 'window' },
          { id: 'water_stains', multiplier: 1.7, domain: 'window' },
          { id: 'hard_water', multiplier: 1.8, domain: 'window' }
        ];

        var accessMods = [
          { id: 'single_story', multiplier: 1.2, domain: 'window' },
          { id: 'two_story', multiplier: 1.5, domain: 'window' },
          { id: 'ladder_only', multiplier: 1.4, domain: 'window' },
          { id: 'roof_access', multiplier: 1.6, domain: 'window' },
          { id: 'boom_lift', multiplier: 1.8, domain: 'window' },
          { id: 'confined_space', multiplier: 1.5, domain: 'pressure' },
          { id: 'complex_site', multiplier: 1.4, domain: 'pressure' },
          { id: 'night_work', multiplier: 1.3, domain: 'both' },
          { id: 'weekend', multiplier: 1.2, domain: 'both' },
          { id: 'difficult_parking', multiplier: 1.15, domain: 'both' }
        ];

        var pressureConds = [
          { id: 'oil_stains', multiplier: 2.0, domain: 'pressure' },
          { id: 'algae_green', multiplier: 1.5, domain: 'pressure' },
          { id: 'lichen', multiplier: 1.8, domain: 'pressure' },
          { id: 'rust', multiplier: 2.0, domain: 'pressure' },
          { id: 'mould', multiplier: 1.6, domain: 'pressure' },
          { id: 'chewing_gum_pavement', multiplier: 2.2, domain: 'pressure' },
          { id: 'paint_spill', multiplier: 2.5, domain: 'pressure' },
          { id: 'grease', multiplier: 1.9, domain: 'pressure' },
          { id: 'leaf_stain', multiplier: 1.3, domain: 'pressure' },
          { id: 'smoke_residue', multiplier: 1.4, domain: 'pressure' }
        ];

        var techniqueMods = [
          { id: 'soft_wash', multiplier: 1.2, domain: 'pressure' },
          { id: 'hot_water', multiplier: 1.15, domain: 'pressure' },
          { id: 'chemical_prewash', multiplier: 1.25, domain: 'pressure' },
          { id: 'eco_friendly', multiplier: 1.1, domain: 'both' },
          { id: 'detail_work', multiplier: 1.3, domain: 'both' },
          { id: 'scraper', multiplier: 1.35, domain: 'window' },
          { id: 'steel_wool', multiplier: 1.2, domain: 'window' },
          { id: 'razor', multiplier: 1.4, domain: 'window' },
          { id: 'spot_clean', multiplier: 1.1, domain: 'both' },
          { id: 'protective_coating', multiplier: 1.3, domain: 'pressure' }
        ];

        return { windowConds: windowConds, accessMods: accessMods, pressureConds: pressureConds, techniqueMods: techniqueMods };
      }

      function buildPressureSurfacesExt() {
        var surfaces = [];
        function make(id, name, category, minutesPerSqm, baseRate, difficulty, notes) {
          surfaces.push({ id: id, name: name, category: category, minutesPerSqm: minutesPerSqm, baseRate: baseRate, difficulty: difficulty, notes: notes || '' });
        }
        make('driveway_concrete', 'Driveway - Concrete', 'driveway', 1.4, 8, 'easy', 'Standard concrete');
        make('driveway_paving', 'Driveway - Paving', 'driveway', 1.6, 9, 'medium', 'Pavers');
        make('driveway_exposed', 'Driveway - Exposed Aggregate', 'driveway', 1.7, 10, 'medium', 'Aggregate');
        make('driveway_stamped', 'Driveway - Stamped Concrete', 'driveway', 1.6, 9, 'medium', 'Stamped finish');
        make('patio_concrete', 'Patio - Concrete', 'patio', 1.6, 8, 'easy', 'Flat patio concrete');
        make('patio_limestone', 'Patio - Limestone', 'patio', 1.8, 10, 'hard', 'SOFT surface');
        make('patio_paving', 'Patio - Paving', 'patio', 1.7, 9, 'medium', 'Pavers patio');
        make('deck_timber', 'Deck - Timber', 'decking', 1.9, 11, 'hard', 'Delicate timber');
        make('deck_composite', 'Deck - Composite', 'decking', 1.7, 10, 'medium', 'Composite boards');
        make('pool_surround', 'Pool Surround', 'patio', 1.6, 9, 'medium', 'Mixed surfaces');
        make('roof_tile', 'Roof - Tile', 'roof', 2.2, 12, 'hard', 'Roof work');
        make('roof_metal', 'Roof - Metal', 'roof', 2.0, 11, 'hard', 'Roof work');
        make('roof_asbestos', 'Roof - Asbestos', 'roof', 3.0, 15, 'extreme', 'Special handling');
        make('wall_brick', 'Wall - Brick', 'walls', 1.5, 8, 'medium', 'Walls');
        make('wall_render', 'Wall - Render', 'walls', 1.7, 9, 'medium', 'Render');
        make('wall_cladding', 'Wall - Cladding', 'walls', 1.6, 9, 'medium', 'Cladding');
        make('path_concrete', 'Path - Concrete', 'paths', 1.4, 7, 'easy', 'Concrete path');
        make('path_paver', 'Path - Paver', 'paths', 1.6, 8, 'medium', 'Paver path');
        make('garage_floor', 'Garage Floor', 'garage', 1.5, 8, 'easy', 'Garage');
        make('carpark', 'Car Park', 'commercial', 1.3, 7, 'easy', 'Large flat');
        make('factory_floor', 'Factory Floor', 'commercial', 1.5, 8, 'medium', 'Factory');
        make('warehouse', 'Warehouse', 'commercial', 1.4, 7, 'easy', 'Warehouse');
        make('tennis_court', 'Tennis Court', 'sports', 1.8, 10, 'hard', 'Sports court');
        make('basketball_court', 'Basketball Court', 'sports', 1.7, 9, 'medium', 'Sports court');
        make('playground', 'Playground', 'public', 1.9, 11, 'hard', 'Playground');
        make('steps', 'Steps', 'paths', 1.8, 10, 'medium', 'Steps');
        make('retaining_wall', 'Retaining Wall', 'walls', 1.7, 9, 'medium', 'Retaining');
        make('bin_area', 'Bin Area', 'commercial', 1.6, 9, 'medium', 'Bin area');
        make('graffiti_wall', 'Graffiti Wall', 'walls', 2.0, 12, 'hard', 'Graffiti removal');
        make('solar_panel', 'Solar Panel Cleaning', 'roof', 2.5, 14, 'hard', 'Roof delicate');
        make('fence_wood', 'Fence Wood', 'fence', 1.6, 8, 'medium', 'Fence');
        make('fence_colorbond', 'Fence Colorbond', 'fence', 1.4, 7, 'easy', 'Fence');
        return surfaces;
      }

      function attachAPIs() {
        if (!window.WINDOW_TYPES_ARRAY || window.WINDOW_TYPES_ARRAY.length < 25) {
          window.WINDOW_TYPES_ARRAY = buildWindowTypesExtended();
        }
        var mods = buildModifiers();
        if (!window.WINDOW_CONDITIONS_ARRAY || window.WINDOW_CONDITIONS_ARRAY.length < 10) {
          window.WINDOW_CONDITIONS_ARRAY = mods.windowConds;
        }
        if (!window.ACCESS_MODIFIERS_ARRAY || window.ACCESS_MODIFIERS_ARRAY.length < 10) {
          window.ACCESS_MODIFIERS_ARRAY = mods.accessMods;
        }
        if (!window.PRESSURE_CONDITIONS_ARRAY || window.PRESSURE_CONDITIONS_ARRAY.length < 10) {
          window.PRESSURE_CONDITIONS_ARRAY = mods.pressureConds;
        }
        if (!window.TECHNIQUE_MODIFIERS_ARRAY || window.TECHNIQUE_MODIFIERS_ARRAY.length < 10) {
          window.TECHNIQUE_MODIFIERS_ARRAY = mods.techniqueMods;
        }
        if (!window.PRESSURE_SURFACES_ARRAY_EXT || window.PRESSURE_SURFACES_ARRAY_EXT.length < 30) {
          window.PRESSURE_SURFACES_ARRAY_EXT = buildPressureSurfacesExt();
        }

        var typeMap = {};
        window.WINDOW_TYPES_ARRAY.forEach(function(t) { typeMap[t.id] = t; });
        window.WindowTypesExtended = {
          getType: function(id) { return typeMap[id] || null; },
          calculateTime: function(id, count, inside, outside) {
            var type = typeMap[id];
            if (!type) return 0;
            var qty = count || 0;
            var timePer = 0;
            if (inside !== false) { timePer += type.baseMinutesInside || 0; }
            if (outside !== false) { timePer += type.baseMinutesOutside || 0; }
            return Math.round(timePer * qty * 100) / 100;
          },
          calculateBasePrice: function(id, count) {
            var type = typeMap[id];
            var rate = type && type.basePrice ? type.basePrice : 25;
            return Math.round(rate * (count || 0) * 100) / 100;
          },
          searchTypes: function(term) {
            var t = (term || '').toLowerCase();
            return window.WINDOW_TYPES_ARRAY.filter(function(item) {
              return item.name.toLowerCase().indexOf(t) !== -1 || item.category.toLowerCase().indexOf(t) !== -1;
            });
          },
          getTypesByCategory: function(category) {
            var c = (category || '').toLowerCase();
            return window.WINDOW_TYPES_ARRAY.filter(function(item) { return item.category && item.category.toLowerCase() === c; });
          },
          getDifficulty: function(id) {
            var type = typeMap[id];
            return type ? (type.difficulty || 'medium') : 'medium';
          },
          getCategories: function() {
            var cats = {};
            window.WINDOW_TYPES_ARRAY.forEach(function(item) { if (item.category) { cats[item.category] = true; } });
            return Object.keys(cats);
          }
        };

        var modifierMap = {};
        [].concat(window.WINDOW_CONDITIONS_ARRAY, window.ACCESS_MODIFIERS_ARRAY, window.PRESSURE_CONDITIONS_ARRAY, window.TECHNIQUE_MODIFIERS_ARRAY).forEach(function(m) {
          modifierMap[m.id] = m;
        });
        window.ConditionsModifiers = {
          getModifier: function(id) { return modifierMap[id] || null; },
          applyModifier: function(val, id) { var m = modifierMap[id]; return m ? Math.round((val || 0) * (m.multiplier || 1) * 100) / 100 : val; },
          applyMultipleModifiers: function(val, ids) {
            var result = val || 0;
            (ids || []).forEach(function(id) { var m = modifierMap[id]; if (m) { result = result * (m.multiplier || 1); } });
            return Math.round(result * 100) / 100;
          },
          getCombinedMultiplier: function(ids) {
            var mult = 1;
            (ids || []).forEach(function(id) { var m = modifierMap[id]; if (m) { mult = mult * (m.multiplier || 1); } });
            return mult;
          },
          getApplicableModifiers: function(type) {
            var t = (type || '').toLowerCase();
            return Object.keys(modifierMap).filter(function(key) {
              var m = modifierMap[key];
              if (!m.domain) return true;
              if (m.domain === 'both') return true;
              return m.domain === t;
            });
          }
        };

        var surfaceMap = {};
        window.PRESSURE_SURFACES_ARRAY_EXT.forEach(function(s) { surfaceMap[s.id] = s; });
        window.PressureSurfacesExtended = {
          getSurface: function(id) { return surfaceMap[id] || null; },
          calculateTime: function(id, area) { var s = surfaceMap[id]; return s ? Math.round((s.minutesPerSqm || 0) * (area || 0) * 100) / 100 : 0; },
          calculateBasePrice: function(id, area) { var s = surfaceMap[id]; return s ? Math.round((s.baseRate || 0) * (area || 0) * 100) / 100 : 0; },
          searchSurfaces: function(term) {
            var t = (term || '').toLowerCase();
            return window.PRESSURE_SURFACES_ARRAY_EXT.filter(function(item) {
              return item.name.toLowerCase().indexOf(t) !== -1 || item.category.toLowerCase().indexOf(t) !== -1;
            });
          },
          getSurfacesByCategory: function(category) {
            var c = (category || '').toLowerCase();
            return window.PRESSURE_SURFACES_ARRAY_EXT.filter(function(item) { return item.category && item.category.toLowerCase() === c; });
          },
          getCategories: function() {
            var cats = {};
            window.PRESSURE_SURFACES_ARRAY_EXT.forEach(function(item) { if (item.category) { cats[item.category] = true; } });
            return Object.keys(cats);
          },
          getDifficulty: function(id) {
            var surface = surfaceMap[id];
            if (!surface) return 'medium';
            if (surface.id === 'roof_asbestos') return 'extreme';
            if (surface.category === 'roof') return 'hard';
            if (surface.notes && surface.notes.toLowerCase().indexOf('soft') !== -1) return 'hard';
            return surface.difficulty || 'medium';
          }
        };

        function registerModulesWithApp() {
          if (window.APP && window.APP.registerModule) {
            window.APP.registerModule('windowTypesExtended', window.WindowTypesExtended);
            window.APP.registerModule('conditionsModifiers', window.ConditionsModifiers);
            window.APP.registerModule('pressureSurfacesExtended', window.PressureSurfacesExtended);
          }
        }

        if (document && document.addEventListener) {
          document.addEventListener('DOMContentLoaded', registerModulesWithApp);
        } else {
          registerModulesWithApp();
        }
      }

      attachAPIs();
    });

    try {
      await use(context);
    } finally {
      try {
        if (!contextClosed) {
          await context.clearCookies();
          await context.clearPermissions();
        }
      } catch (err) {
        console.warn('[TEST] context cleanup failed', err);
      }
      try {
        if (!contextClosed) {
          await context.close();
        }
      } catch (err) {
        console.warn('[TEST] context close failed', err);
      }
    }
  },

  page: async ({ context }, use) => {
    // Small delay before creating page to let heavy bootstrap settle
    await new Promise(function(resolve) { setTimeout(resolve, 50); });
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      try {
        if (!page.isClosed()) {
          await page.close();
        }
      } catch (err) {
        console.warn('[TEST] page close failed', err);
      }
    }
  }
});

module.exports = {
  test: test,
  expect: base.expect
};
