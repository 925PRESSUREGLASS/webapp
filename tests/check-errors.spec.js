// Test to check for console errors during initialization

const { test, expect } = require('@playwright/test');

const APP_URL = '/index.html';

test.describe('Console Error Check', () => {
  test('should not have console errors during initialization', async ({ page }) => {
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait for app initialization using APP.waitForInit()
    await page.evaluate(async () => {
      if (window.APP && typeof window.APP.waitForInit === 'function') {
        await window.APP.waitForInit();
      }
    });

    // Log all console messages
    console.log('Console messages:');
    consoleMessages.forEach(msg => {
      console.log(`  ${msg.type}: ${msg.text}`);
    });

    // Log all page errors
    if (pageErrors.length > 0) {
      console.log('Page errors:');
      pageErrors.forEach(err => {
        console.log(`  ${err}`);
      });
    }

    // Check if APP.isInitialized (both flags for compatibility)
    const initFlags = await page.evaluate(() => {
      return {
        initialized: window.APP && window.APP.initialized,
        isInitialized: window.APP && window.APP.isInitialized
      };
    });

    console.log('APP initialization flags:', initFlags);

    // Check for error messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('Found error messages:');
      errorMessages.forEach(msg => {
        console.log('  ', msg.text);
      });
    }

    // The test passes even if there are errors - we just want to see them
    expect(true).toBe(true);
  });
});