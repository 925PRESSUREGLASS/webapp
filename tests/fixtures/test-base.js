/**
 * Base Test Fixture for Playwright
 *
 * Extends Playwright's base test with custom fixtures for TicTacStick app testing.
 * Provides automatic APP initialization, helper functions, and clean state management.
 *
 * Usage:
 *   const { test, expect } = require('./fixtures/test-base');
 *
 *   test('my test', async ({ appReady, helpers }) => {
 *     const result = await helpers.calculateQuote(quoteData);
 *     expect(result).toHaveValidGST();
 *   });
 */

const { test: base, expect } = require('@playwright/test');
const { createHelpers } = require('./helpers');

/**
 * Extended test with custom fixtures
 */
const test = base.extend({
  /**
   * appReady fixture
   *
   * Ensures APP is fully initialized before test runs.
   * Automatically navigates to the app and waits for all modules to load.
   *
   * @param {Page} page - Playwright page object
   * @param {Function} use - Fixture use function
   */
  appReady: async ({ page }, use) => {
    // Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for APP object to exist
    await page.waitForFunction(() => window.APP !== undefined, {
      timeout: 5000
    });

    // Wait for APP initialization to complete
    await page.waitForFunction(() => window.APP.initialized === true, {
      timeout: 5000
    });

    // Ensure all required modules are loaded
    await page.waitForFunction(() => {
      const required = ['storage', 'app', 'calc', 'ui', 'invoice'];
      return required.every(mod =>
        window.APP.modules[mod] !== undefined &&
        window.APP.modules[mod] !== null
      );
    }, { timeout: 5000 });

    // Give the page object to the test
    await use(page);
  },

  /**
   * helpers fixture
   *
   * Provides common test helper functions for interacting with the app.
   *
   * @param {Page} appReady - The appReady page (depends on appReady fixture)
   * @param {Function} use - Fixture use function
   */
  helpers: async ({ appReady }, use) => {
    const helpers = createHelpers(appReady);
    await use(helpers);
  },

  /**
   * cleanState fixture
   *
   * Clears LocalStorage before each test to ensure clean state.
   * Runs automatically for every test.
   *
   * @param {Page} page - Playwright page object
   * @param {Function} use - Fixture use function
   */
  cleanState: [async ({ page }, use) => {
    // Clear LocalStorage before test
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());

    // Run the test
    await use();

    // Optional: cleanup after test
    // (uncomment if you need post-test cleanup)
    // await page.evaluate(() => localStorage.clear());
  }, { auto: true }], // auto: true makes this run for every test

  /**
   * testData fixture
   *
   * Provides access to pre-defined test data scenarios.
   *
   * @param {Object} context - Playwright context
   * @param {Function} use - Fixture use function
   */
  testData: async ({}, use) => {
    const data = require('./test-data');
    await use(data);
  }
});

// Re-export expect so it can be imported from one place
module.exports = { test, expect };
