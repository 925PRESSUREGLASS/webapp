// Debug test to understand APP object loading

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Debug APP Loading', () => {
  test('check what happens on page load', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await gotoApp(page);
    
    // Wait a moment for scripts to load
    await page.waitForTimeout(2000);
    
    // Check what's on window
    const windowKeys = await page.evaluate(() => {
      return Object.keys(window).filter(k => 
        k.includes('APP') || k.includes('app') || k.includes('config') || k.includes('CONFIG')
      );
    });
    console.log('Window keys with APP/config:', windowKeys);
    
    // Check if APP exists
    const appType = await page.evaluate(() => {
      return typeof window.APP;
    });
    console.log('typeof window.APP:', appType);
    
    // Check if config loaded
    const configType = await page.evaluate(() => {
      return typeof window.CONFIG;
    });
    console.log('typeof window.CONFIG:', configType);
    
    // Check what scripts are loaded
    const scripts = await page.evaluate(() => {
      var scriptTags = document.querySelectorAll('script[src]');
      return Array.from(scriptTags).map(function(s) { return s.src; });
    });
    console.log('Loaded scripts:', scripts.length, 'scripts');
    scripts.forEach(s => console.log('  -', s));
    
    // Check for any errors in console
    const consoleErrors = await page.evaluate(() => {
      if (window.console && window.console.errors) {
        return window.console.errors;
      }
      return [];
    });
    console.log('Console errors:', consoleErrors);
  });
});
