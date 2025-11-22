const base = require('@playwright/test');

// Provide a guaranteed fresh browser context and page for every test.
// This prevents storage, caches, and module state from leaking between tests.
const test = base.test.extend({
  context: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL: baseURL,
      storageState: { cookies: [], origins: [] },
      ignoreHTTPSErrors: true
    });

    // Proactively clear any lingering client-side storage as soon as a page starts.
    await context.addInitScript(function() {
      try {
        if (window && window.localStorage && window.sessionStorage) {
          window.localStorage.clear();
          window.sessionStorage.clear();
        }

        if (window && window.caches && window.caches.keys) {
          window.caches.keys().then(function(names) {
            names.forEach(function(name) {
              window.caches.delete(name);
            });
          });
        }

        if (window && window.navigator && window.navigator.serviceWorker && window.navigator.serviceWorker.getRegistrations) {
          window.navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(reg) {
              reg.unregister();
            });
          });
        }

        if (window && window.indexedDB && window.indexedDB.databases) {
          window.indexedDB.databases().then(function(dbs) {
            dbs.forEach(function(db) {
              if (db && db.name) {
                window.indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
      } catch (e) {
        console.warn('[TEST] init cleanup failed', e);
      }
    });

    try {
      await use(context);
    } finally {
      try {
        await context.clearCookies();
        await context.clearPermissions();
      } catch (err) {
        console.warn('[TEST] context cleanup failed', err);
      }
      await context.close();
    }
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await page.close();
    }
  }
});

module.exports = {
  test: test,
  expect: base.expect
};
