// Quick test to verify APP initialization

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Initialization Test', () => {
  test('should initialize APP correctly', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Check if APP object exists
    const appExists = await page.evaluate(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    });
    console.log('APP object exists:', appExists);
    expect(appExists).toBe(true);

    // Check if APP has the expected methods
    const hasMethods = await page.evaluate(() => {
      return window.APP &&
        typeof window.APP.addWindowLine === 'function' &&
        typeof window.APP.addPressureLine === 'function' &&
        typeof window.APP.recalculate === 'function';
    });
    console.log('APP has expected methods:', hasMethods);
    expect(hasMethods).toBe(true);

    // Check initialization flag
    const isInitialized = await page.evaluate(() => {
      return window.APP && window.APP.isInitialized;
    });
    console.log('APP.isInitialized:', isInitialized);

    // If not initialized, wait for it
    if (!isInitialized) {
      console.log('Waiting for APP.isInitialized to become true...');
      try {
        await page.waitForFunction(() => {
          return window.APP && window.APP.isInitialized === true;
        }, { timeout: 5000 });
        console.log('APP is now initialized');
      } catch (e) {
        console.log('Timeout waiting for initialization');
        // Log the current state
        const debugInfo = await page.evaluate(() => {
          return {
            APP: typeof window.APP,
            isInitialized: window.APP ? window.APP.isInitialized : 'APP not found',
            hasAddWindowLine: window.APP ? typeof window.APP.addWindowLine : 'APP not found'
          };
        });
        console.log('Debug info:', debugInfo);
      }
    }

    expect(isInitialized).toBe(true);
  });
});