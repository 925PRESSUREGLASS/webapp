// fixtures/isolated-page.js
// Custom Playwright fixture that provides a fresh browser context for each test
// This ensures complete test isolation by preventing state leakage between tests

const { test: base } = require('@playwright/test');

/**
 * Custom fixture that creates a fresh browser context for each test.
 * This solves the test isolation problem where browser state persists between tests.
 * 
 * Usage in tests:
 * const { test } = require('./fixtures/isolated-page');
 * const { expect } = require('@playwright/test');
 * 
 * test('my test', async ({ page }) => {
 *   // page is now from a fresh context with no state from previous tests
 * });
 */
const test = base.extend({
  // Override the context fixture to create a fresh one for each test
  context: async ({ browser }, use) => {
    // Create a fresh browser context for this test
    const context = await browser.newContext();
    
    // Use the context in the test (page will be created from this context)
    await use(context);
    
    // Clean up: close the context after the test
    await context.close();
  }
});

module.exports = { test };


