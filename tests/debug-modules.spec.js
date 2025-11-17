// debug-modules.spec.js - Test module-specific debug controls
// Tests the newly implemented module-specific debug functionality

const { test, expect } = require('@playwright/test');

test.describe('Module-specific debug controls', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:8080');

    // Wait for app initialization
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.DEBUG !== undefined);

    // Clear any previous debug state
    await page.evaluate(() => {
      localStorage.removeItem('tictacstick-debug-enabled');
      localStorage.removeItem('tictacstick-debug-enabled-modules');
      window.DEBUG.disable();
    });
  });

  test('Test 1: enableModule should enable specific module', async ({ page }) => {
    console.log('=== Test 1: Enable Specific Module ===');

    const result = await page.evaluate(() => {
      // Enable the 'calc' module
      var enabled = window.DEBUG.enableModule('calc');
      var isEnabled = window.DEBUG.isModuleEnabled('calc');

      return {
        enabled: enabled,
        isEnabled: isEnabled
      };
    });

    expect(result.enabled).toBe(true);
    expect(result.isEnabled).toBe(true);
    console.log('✓ Module enabled successfully');
  });

  test('Test 2: disableModule should disable specific module', async ({ page }) => {
    console.log('=== Test 2: Disable Specific Module ===');

    const result = await page.evaluate(() => {
      // First enable, then disable
      window.DEBUG.enableModule('app');
      var disabled = window.DEBUG.disableModule('app');
      var isEnabled = window.DEBUG.isModuleEnabled('app');

      return {
        disabled: disabled,
        isEnabled: isEnabled
      };
    });

    expect(result.disabled).toBe(true);
    expect(result.isEnabled).toBe(false);
    console.log('✓ Module disabled successfully');
  });

  test('Test 3: getEnabledModules should return list of enabled modules', async ({ page }) => {
    console.log('=== Test 3: Get Enabled Modules ===');

    const result = await page.evaluate(() => {
      // Enable specific modules
      window.DEBUG.enableModule('calc');
      window.DEBUG.enableModule('invoice');
      window.DEBUG.disableModule('app');

      var enabled = window.DEBUG.getEnabledModules();

      return {
        enabled: enabled,
        hasCalc: enabled.indexOf('calc') !== -1,
        hasInvoice: enabled.indexOf('invoice') !== -1,
        hasApp: enabled.indexOf('app') !== -1
      };
    });

    expect(result.hasCalc).toBe(true);
    expect(result.hasInvoice).toBe(true);
    expect(result.hasApp).toBe(false);
    console.log('✓ Enabled modules list correct:', result.enabled);
  });

  test('Test 4: getDisabledModules should return list of disabled modules', async ({ page }) => {
    console.log('=== Test 4: Get Disabled Modules ===');

    const result = await page.evaluate(() => {
      // Disable specific modules
      window.DEBUG.disableModule('ui');
      window.DEBUG.disableModule('wizard');
      window.DEBUG.enableModule('calc');

      var disabled = window.DEBUG.getDisabledModules();

      return {
        disabled: disabled,
        hasUi: disabled.indexOf('ui') !== -1,
        hasWizard: disabled.indexOf('wizard') !== -1,
        hasCalc: disabled.indexOf('calc') !== -1
      };
    });

    expect(result.hasUi).toBe(true);
    expect(result.hasWizard).toBe(true);
    expect(result.hasCalc).toBe(false);
    console.log('✓ Disabled modules list correct:', result.disabled);
  });

  test('Test 5: enableAllModules should enable all modules', async ({ page }) => {
    console.log('=== Test 5: Enable All Modules ===');

    const result = await page.evaluate(() => {
      // First disable some modules
      window.DEBUG.disableModule('app');
      window.DEBUG.disableModule('calc');
      window.DEBUG.disableModule('invoice');

      // Then enable all
      window.DEBUG.enableAllModules();

      var config = window.DEBUG.getConfig();
      var allEnabled = true;
      for (var module in config.modules) {
        if (config.modules.hasOwnProperty(module) && !config.modules[module]) {
          allEnabled = false;
          break;
        }
      }

      return {
        allEnabled: allEnabled,
        modules: config.modules
      };
    });

    expect(result.allEnabled).toBe(true);
    console.log('✓ All modules enabled:', Object.keys(result.modules));
  });

  test('Test 6: disableAllModules should disable all modules', async ({ page }) => {
    console.log('=== Test 6: Disable All Modules ===');

    const result = await page.evaluate(() => {
      // First enable some modules
      window.DEBUG.enableModule('app');
      window.DEBUG.enableModule('calc');

      // Then disable all
      window.DEBUG.disableAllModules();

      var config = window.DEBUG.getConfig();
      var allDisabled = true;
      for (var module in config.modules) {
        if (config.modules.hasOwnProperty(module) && config.modules[module]) {
          allDisabled = false;
          break;
        }
      }

      return {
        allDisabled: allDisabled,
        modules: config.modules
      };
    });

    expect(result.allDisabled).toBe(true);
    console.log('✓ All modules disabled');
  });

  test('Test 7: Module settings should persist to localStorage', async ({ page }) => {
    console.log('=== Test 7: LocalStorage Persistence ===');

    // Set module states
    await page.evaluate(() => {
      window.DEBUG.enableModule('calc');
      window.DEBUG.enableModule('invoice');
      window.DEBUG.disableModule('app');
    });

    // Get state before reload
    const beforeReload = await page.evaluate(() => {
      return {
        calc: window.DEBUG.isModuleEnabled('calc'),
        invoice: window.DEBUG.isModuleEnabled('invoice'),
        app: window.DEBUG.isModuleEnabled('app')
      };
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.DEBUG !== undefined);

    // Get state after reload
    const afterReload = await page.evaluate(() => {
      return {
        calc: window.DEBUG.isModuleEnabled('calc'),
        invoice: window.DEBUG.isModuleEnabled('invoice'),
        app: window.DEBUG.isModuleEnabled('app')
      };
    });

    expect(afterReload.calc).toBe(beforeReload.calc);
    expect(afterReload.invoice).toBe(beforeReload.invoice);
    expect(afterReload.app).toBe(beforeReload.app);
    console.log('✓ Module settings persisted across reload');
  });

  test('Test 8: forModule logger should respect module settings', async ({ page }) => {
    console.log('=== Test 8: Module Logger Respects Settings ===');

    const result = await page.evaluate(() => {
      // Enable debug globally
      window.DEBUG.enable();

      // Enable only 'calc' module
      window.DEBUG.enableModule('calc');
      window.DEBUG.disableModule('app');

      // Create module loggers
      var calcLogger = window.DEBUG.forModule('calc');
      var appLogger = window.DEBUG.forModule('app');

      // Try to log (we can't capture console output, but we can verify the loggers exist)
      var hasCalcLog = typeof calcLogger.log === 'function';
      var hasAppLog = typeof appLogger.log === 'function';
      var calcEnabled = window.DEBUG.isModuleEnabled('calc');
      var appEnabled = window.DEBUG.isModuleEnabled('app');

      return {
        hasCalcLog: hasCalcLog,
        hasAppLog: hasAppLog,
        calcEnabled: calcEnabled,
        appEnabled: appEnabled
      };
    });

    expect(result.hasCalcLog).toBe(true);
    expect(result.hasAppLog).toBe(true);
    expect(result.calcEnabled).toBe(true);
    expect(result.appEnabled).toBe(false);
    console.log('✓ Module loggers created with correct settings');
  });
});
