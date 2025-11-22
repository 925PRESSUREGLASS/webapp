// test-helpers.js
// Reusable test utilities for Playwright tests
// Ensures consistent APP initialization across all test files

/**
 * Initialize the app and wait for it to be ready
 * Call this in beforeEach hooks
 * @param {Page} page - Playwright page object
 * @param {Object} options - Options for initialization
 * @param {boolean} options.skipReload - Skip the page reload step (default: false)
 */
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

async function initializeApp(page, options) {
  options = options || {};

  await gotoApp(page);
  await waitForAppReady(page);

  // Perform an aggressive cleanup before reloading to avoid state leakage between tests
  await aggressiveCleanup(page);
  
  if (!options.skipReload) {
    // Clear localStorage for clean test state
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('[TEST] localStorage.clear() failed:', e);
      }
    });
    
    await page.reload({ waitUntil: 'domcontentloaded' });

    // After reload, wait for APP object to be recreated
    await page.waitForFunction(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    }, { timeout: 10000 });

    await waitForAppReady(page);
  }
  
  // Wait for APP to be fully initialized
  await page.evaluate(async () => {
    if (window.APP && typeof window.APP.waitForInit === 'function') {
      await window.APP.waitForInit();
    } else {
      throw new Error('APP.waitForInit is not available');
    }
  });
  
  // Small delay to ensure all async operations complete
  await page.waitForTimeout(100);
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

/**
 * Perform aggressive cleanup between tests
 * Clears all possible browser state
 * @param {Page} page - Playwright page object
 */
async function aggressiveCleanup(page) {
  await page.evaluate(async function() {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Remove IndexedDB databases
      if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
        var dbs = await window.indexedDB.databases();
        for (var i = 0; i < dbs.length; i++) {
          if (dbs[i] && dbs[i].name) {
            window.indexedDB.deleteDatabase(dbs[i].name);
          }
        }
      }

      // Unregister any service workers
      if (window.navigator && window.navigator.serviceWorker && typeof window.navigator.serviceWorker.getRegistrations === 'function') {
        var registrations = await window.navigator.serviceWorker.getRegistrations();
        for (var r = 0; r < registrations.length; r++) {
          registrations[r].unregister();
        }
      }

      // Clear any cached data
      if (window.caches && typeof window.caches.keys === 'function') {
        var names = await window.caches.keys();
        for (var n = 0; n < names.length; n++) {
          await window.caches.delete(names[n]);
        }
      }
    } catch (e) {
      console.warn('[TEST] Cleanup failed:', e);
    }
  });
}

module.exports = {
  initializeApp,
  waitForAppInit,
  isAppInitialized,
  aggressiveCleanup
};
