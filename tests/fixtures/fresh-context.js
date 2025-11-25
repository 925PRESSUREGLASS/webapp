const base = require('@playwright/test');

// Fresh browser context and page per test to avoid cross-test contamination.
const test = base.test.extend({
  context: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL: baseURL,
      storageState: { cookies: [], origins: [] },
      ignoreHTTPSErrors: true
    });
    let contextClosed = false;
    context.on('close', () => {
      contextClosed = true;
    });

    // Clear storage/cache/service workers before pages run.
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
        if (!contextClosed) {
          await context.clearCookies();
          await context.clearPermissions();
        }
      } catch (err) {
        console.warn('[TEST] context cleanup failed', err);
      }
      try {
        if (!contextClosed) {
          await context.close();
        }
      } catch (err) {
        console.warn('[TEST] context close failed', err);
      }
    }
  },

  page: async ({ context }, use) => {
    // Small delay before creating page to let heavy bootstrap settle
    await new Promise(function(resolve) { setTimeout(resolve, 50); });
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      try {
        if (!page.isClosed()) {
          await page.close();
        }
      } catch (err) {
        console.warn('[TEST] page close failed', err);
      }
    }
  }
});

module.exports = {
  test: test,
  expect: base.expect
};
