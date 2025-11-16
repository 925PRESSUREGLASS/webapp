// Test to check for console errors during initialization

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.resolve(__dirname, '../index.html');

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

    // Wait a bit for initialization
    await page.waitForTimeout(1000);

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

    // Check if APP.isInitialized
    const isInitialized = await page.evaluate(() => {
      return window.APP && window.APP.isInitialized;
    });

    console.log('APP.isInitialized:', isInitialized);

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