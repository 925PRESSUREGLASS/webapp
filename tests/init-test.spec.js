// Quick test to verify APP initialization

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Initialization Test', () => {
  test('should initialize APP correctly', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Check if APP object exists (created by bootstrap.js)
    const appExists = await page.evaluate(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    });
    console.log('APP object exists:', appExists);
    expect(appExists).toBe(true);

    // Check if APP has bootstrap methods
    const hasBootstrapMethods = await page.evaluate(() => {
      return window.APP &&
        typeof window.APP.registerModule === 'function' &&
        typeof window.APP.waitForInit === 'function' &&
        typeof window.APP.init === 'function';
    });
    console.log('APP has bootstrap methods:', hasBootstrapMethods);
    expect(hasBootstrapMethods).toBe(true);

    // Use APP.waitForInit() to wait for full initialization
    console.log('Waiting for APP.waitForInit()...');
    const initResult = await page.evaluate(async () => {
      try {
        await window.APP.waitForInit();
        return { success: true, initialized: window.APP.initialized };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    console.log('Init result:', initResult);
    expect(initResult.success).toBe(true);
    expect(initResult.initialized).toBe(true);

    // Check if APP has the expected application methods
    const hasMethods = await page.evaluate(() => {
      return window.APP &&
        typeof window.APP.addWindowLine === 'function' &&
        typeof window.APP.addPressureLine === 'function' &&
        typeof window.APP.recalculate === 'function';
    });
    console.log('APP has application methods:', hasMethods);
    expect(hasMethods).toBe(true);

    // Check that modules are registered
    const modulesRegistered = await page.evaluate(() => {
      return window.APP.modules &&
        typeof window.APP.modules.app === 'object';
    });
    console.log('Modules registered:', modulesRegistered);
    expect(modulesRegistered).toBe(true);

    // Check both initialization flags for backward compatibility
    const isInitialized = await page.evaluate(() => {
      return {
        initialized: window.APP.initialized,
        isInitialized: window.APP.isInitialized
      };
    });
    console.log('Initialization flags:', isInitialized);
    expect(isInitialized.initialized).toBe(true);
    expect(isInitialized.isInitialized).toBe(true);
  });
});