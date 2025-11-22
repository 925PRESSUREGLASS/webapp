// test-helpers.js
// Reusable test utilities for Playwright tests
// Ensures consistent APP initialization across all test files

/**
 * Initialize the app and wait for it to be ready
 * Call this in beforeEach hooks
 * @param {Page} page - Playwright page object
 */
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

async function initializeApp(page) {
  await gotoApp(page);
  await waitForAppReady(page);
  
  // Clear localStorage for clean test state
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  
  // After reload, wait for APP object to be recreated
  await page.waitForFunction(() => {
    return typeof window.APP === 'object' && window.APP !== null;
  }, { timeout: 10000 });
  
  await waitForAppReady(page);
  
  // Wait for APP to be fully initialized
  await page.evaluate(async () => {
    if (window.APP && typeof window.APP.waitForInit === 'function') {
      await window.APP.waitForInit();
    } else {
      throw new Error('APP.waitForInit is not available');
    }
  });
}

/**
 * Wait for APP initialization without page navigation
 * Use this if you've already navigated and just need to wait
 * @param {Page} page - Playwright page object
 */
async function waitForAppInit(page) {
  await page.evaluate(async () => {
    if (window.APP && typeof window.APP.waitForInit === 'function') {
      await window.APP.waitForInit();
    }
  });
}

/**
 * Check if APP is initialized
 * @param {Page} page - Playwright page object
 * @returns {boolean}
 */
async function isAppInitialized(page) {
  return await page.evaluate(() => {
    return window.APP && (window.APP.initialized === true || window.APP.isInitialized === true);
  });
}

module.exports = {
  initializeApp,
  waitForAppInit,
  isAppInitialized
};
