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
