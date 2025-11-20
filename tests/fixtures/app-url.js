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

function gotoApp(page, options) {
  var opts = options || {};
  if (!opts.waitUntil) {
    opts.waitUntil = 'commit';
  }
  return page.goto(DEFAULT_APP_URL, opts);
}

module.exports = {
  APP_URL: DEFAULT_APP_URL,
  resolvePath: resolvePath,
  gotoApp: gotoApp,
  gotoPath: function(page, path, options) {
    if (!path) {
      return gotoApp(page, options);
    }
    var target = resolvePath(path);
    var opts = options || {};
    if (!opts.waitUntil) {
      opts.waitUntil = 'commit';
    }
    return page.goto(target, opts);
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
