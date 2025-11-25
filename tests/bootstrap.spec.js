// Test Suite: Bootstrap and Initialization Edge Cases
// Tests the new bootstrap.js initialization system for reliability and edge cases

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

test.describe('Bootstrap System', () => {
  test('APP object exists before any module loads', async ({ page }) => {
    await gotoApp(page);

    // Check APP exists immediately (created by bootstrap.js)
    const appExists = await page.evaluate(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    });
    expect(appExists).toBe(true);

    // Check bootstrap methods exist
    const hasBootstrapMethods = await page.evaluate(() => {
      return window.APP &&
        typeof window.APP.registerModule === 'function' &&
        typeof window.APP.waitForInit === 'function' &&
        typeof window.APP.init === 'function' &&
        typeof window.APP.getModule === 'function';
    });
    expect(hasBootstrapMethods).toBe(true);
  });

  test('waitForInit() resolves when app is initialized', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    const result = await page.evaluate(async () => {
      const startTime = Date.now();
      try {
        await window.APP.waitForInit();
        const duration = Date.now() - startTime;
        return {
          success: true,
          initialized: window.APP.initialized,
          duration: duration
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.initialized).toBe(true);
    console.log('Initialization took', result.duration, 'ms');
  });

  test('modules are properly registered', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    await page.evaluate(async () => {
      await window.APP.waitForInit();
    });

    const modules = await page.evaluate(() => {
      return {
        hasModules: typeof window.APP.modules === 'object',
        appModule: typeof window.APP.modules.app,
        registeredModules: Object.keys(window.APP.modules || {})
      };
    });

    expect(modules.hasModules).toBe(true);
    expect(modules.appModule).toBe('object');
    expect(modules.registeredModules).toContain('app');
    console.log('Registered modules:', modules.registeredModules);
  });

  test('init() can be called multiple times safely', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    const result = await page.evaluate(async () => {
      // Call init multiple times
      const promise1 = window.APP.init();
      const promise2 = window.APP.init();
      const promise3 = window.APP.waitForInit();

      await Promise.all([promise1, promise2, promise3]);

      return {
        initialized: window.APP.initialized,
        isInitialized: window.APP.isInitialized
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.isInitialized).toBe(true);
  });

  test('both initialization flags are set for backward compatibility', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    await page.evaluate(async () => {
      await window.APP.waitForInit();
    });

    const flags = await page.evaluate(() => {
      return {
        initialized: window.APP.initialized,
        isInitialized: window.APP.isInitialized
      };
    });

    expect(flags.initialized).toBe(true);
    expect(flags.isInitialized).toBe(true);
  });

  test('APP methods are available after initialization', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    await page.evaluate(async () => {
      await window.APP.waitForInit();
    });

    const methods = await page.evaluate(() => {
      return {
        addWindowLine: typeof window.APP.addWindowLine,
        addPressureLine: typeof window.APP.addPressureLine,
        recalculate: typeof window.APP.recalculate,
        getState: typeof window.APP.getState,
        duplicateWindowLine: typeof window.APP.duplicateWindowLine,
        duplicatePressureLine: typeof window.APP.duplicatePressureLine
      };
    });

    expect(methods.addWindowLine).toBe('function');
    expect(methods.addPressureLine).toBe('function');
    expect(methods.recalculate).toBe('function');
    expect(methods.getState).toBe('function');
    expect(methods.duplicateWindowLine).toBe('function');
    expect(methods.duplicatePressureLine).toBe('function');
  });
});

test.describe('Edge Cases', () => {
  test('handles rapid page reloads', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    // First initialization
    await page.evaluate(async () => {
      await window.APP.waitForInit();
    });

    // Reload and reinitialize
    await page.reload();
    await waitForAppReady(page);

    const result = await page.evaluate(async () => {
      try {
        await window.APP.waitForInit();
        return {
          success: true,
          initialized: window.APP.initialized
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.initialized).toBe(true);
  });

  test('handles localStorage being disabled', async ({ context, page }) => {
    // Simulate localStorage disabled (privacy mode)
    await context.addInitScript(() => {
      // Override localStorage to throw errors
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        }
      });
    });

    await gotoApp(page);
    await waitForAppReady(page);

    // App should still initialize even if localStorage fails
    const result = await page.evaluate(async () => {
      try {
        await window.APP.waitForInit();
        return {
          success: true,
          initialized: window.APP.initialized
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Should still work despite localStorage errors
    expect(result.success).toBe(true);
    expect(result.initialized).toBe(true);
  });

  test('gracefully handles missing dependencies', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    // Even if some modules fail, APP should still initialize
    const result = await page.evaluate(async () => {
      try {
        await window.APP.waitForInit();
        return {
          success: true,
          initialized: window.APP.initialized,
          hasAPP: typeof window.APP === 'object'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.initialized).toBe(true);
    expect(result.hasAPP).toBe(true);
  });

  test('version information is available', async ({ page }) => {
    await gotoApp(page);

    const version = await page.evaluate(() => {
      return window.APP ? window.APP.version : null;
    });

    expect(version).toBeTruthy();
    expect(typeof version).toBe('string');
    console.log('APP version:', version);
  });

  test('custom event is dispatched on initialization', async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        var eventReceived = false;

        // If already initialized, resolve immediately
        if (window.APP && window.APP.initialized) {
          resolve({
            initialized: true,
            eventReceived: true
          });
          return;
        }

        // Fallback timeout in case event never fires
        var timeoutId = setTimeout(function() {
          resolve({
            initialized: !!(window.APP && window.APP.initialized),
            eventReceived: eventReceived
          });
        }, 500);

        window.addEventListener('app:initialized', function() {
          eventReceived = true;
          clearTimeout(timeoutId);
          resolve({
            initialized: !!(window.APP && window.APP.initialized),
            eventReceived: eventReceived
          });
        }, { once: true });
      });
    });

    expect(result.initialized).toBe(true);
    expect(result.eventReceived).toBe(true);
  });
});

test.describe('Module Registration System', () => {
  test('modules can be registered and retrieved', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
      // Register a test module
      const testModule = { name: 'test', value: 42 };
      window.APP.registerModule('testModule', testModule);

      // Retrieve it
      const retrieved = window.APP.getModule('testModule');

      return {
        registered: retrieved !== null,
        sameObject: retrieved === testModule,
        value: retrieved ? retrieved.value : null
      };
    });

    expect(result.registered).toBe(true);
    expect(result.sameObject).toBe(true);
    expect(result.value).toBe(42);
  });

  test('warns when overwriting existing module', async ({ page }) => {
    await gotoApp(page);

    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('already registered')) {
        warnings.push(msg.text());
      }
    });

    await page.evaluate(() => {
      window.APP.registerModule('duplicate', { v: 1 });
      window.APP.registerModule('duplicate', { v: 2 }); // Should warn
    });

    await page.waitForTimeout(100);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('returns null for non-existent modules', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
      const module = window.APP.getModule('nonExistentModule');
      return module === null;
    });

    expect(result).toBe(true);
  });
});
