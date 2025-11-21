/**
 * Shared application URL helper for Playwright tests.
 *
 * Defaults to `/index.html` so tests respect the baseURL configured in
 * playwright.config.js. Can be overridden by setting APP_URL env.
 */

var DEFAULT_APP_URL = process.env.APP_URL || '/index.html?testMode=1';

function resolvePath(path) {
  if (!path) {
    return DEFAULT_APP_URL;
  }
  if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) {
    return path;
  }
  return path.charAt(0) === '/' ? path : '/' + path;
}

async function gotoApp(page, options) {
  var opts = options || {};
  if (!opts.waitUntil) {
    opts.waitUntil = 'domcontentloaded';
  }
  await page.goto(DEFAULT_APP_URL, opts);
  
  // Wait for APP object to be created by bootstrap.js
  await page.waitForFunction(() => {
    return typeof window.APP === 'object' && window.APP !== null;
  }, { timeout: 10000 });
}

module.exports = {
  APP_URL: DEFAULT_APP_URL,
  resolvePath: resolvePath,
  gotoApp: gotoApp,
  gotoPath: async function(page, path, options) {
    if (!path) {
      return gotoApp(page, options);
    }
    var target = resolvePath(path);
    var opts = options || {};
    if (!opts.waitUntil) {
      opts.waitUntil = 'domcontentloaded';
    }
    await page.goto(target, opts);
    
    // Wait for APP object to be created
    await page.waitForFunction(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    }, { timeout: 10000 });
  },
  waitForAppReady: async function(page) {
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (err) {
      try {
        await page.waitForLoadState('load', { timeout: 5000 });
      } catch (err2) {
        // ignore; fallback to selector wait
      }
    }
    await page.waitForSelector('.app', { timeout: 10000 });
    
    // Also wait for APP object to exist
    await page.waitForFunction(() => {
      return typeof window.APP === 'object' && window.APP !== null;
    }, { timeout: 10000 });
  },
  waitForAppInit: async function(page) {
    async function attempt() {
      await page.waitForFunction(() => {
        return window.APP && typeof window.APP.waitForInit === 'function';
      }, { timeout: 45000 });
      await page.evaluate(() => {
        return window.APP.waitForInit();
      });
    }
    try {
      await attempt();
    } catch (error) {
      await page.reload();
      await attempt();
    }
  }
};
