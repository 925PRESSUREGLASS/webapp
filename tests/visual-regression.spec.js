// tests/visual-regression.spec.js
// Visual regression tests using Playwright screenshot comparison

const { test, expect } = require('@playwright/test');
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

test.describe('Visual Regression Tests', function() {

  test.beforeEach(async function({ page }) {
    await gotoApp(page);
    await waitForAppReady(page);
    
    // Clear any existing data for consistent screenshots
    await page.evaluate(function() {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore errors
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await waitForAppReady(page);
  });

  test.describe('Main Layout', function() {
    
    test('should match homepage screenshot', async function({ page }) {
      // Wait for all fonts and images to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('homepage.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });

    test('should match header screenshot', async function({ page }) {
      var header = page.locator('header, .header, #header, [role="banner"]').first();
      
      if (await header.count() > 0) {
        await expect(header).toHaveScreenshot('header.png', {
          maxDiffPixelRatio: 0.05
        });
      }
    });

    test('should match footer screenshot', async function({ page }) {
      var footer = page.locator('footer, .footer, #footer, [role="contentinfo"]').first();
      
      if (await footer.count() > 0) {
        await expect(footer).toHaveScreenshot('footer.png', {
          maxDiffPixelRatio: 0.05
        });
      }
    });
  });

  test.describe('Calculator Section', function() {
    
    test('should match window calculator screenshot', async function({ page }) {
      var calculator = page.locator('#window-section, .window-calculator, [data-section="windows"]').first();
      
      if (await calculator.count() > 0) {
        await expect(calculator).toHaveScreenshot('window-calculator.png', {
          maxDiffPixelRatio: 0.05
        });
      }
    });

    test('should match pressure calculator screenshot', async function({ page }) {
      var calculator = page.locator('#pressure-section, .pressure-calculator, [data-section="pressure"]').first();
      
      if (await calculator.count() > 0) {
        await expect(calculator).toHaveScreenshot('pressure-calculator.png', {
          maxDiffPixelRatio: 0.05
        });
      }
    });
  });

  test.describe('Summary Section', function() {
    
    test('should match empty summary screenshot', async function({ page }) {
      var summary = page.locator('#summary, .summary-section, [data-section="summary"]').first();
      
      if (await summary.count() > 0) {
        await expect(summary).toHaveScreenshot('summary-empty.png', {
          maxDiffPixelRatio: 0.05
        });
      }
    });
  });

  test.describe('Theme Variants', function() {
    
    test('should match light theme screenshot', async function({ page }) {
      await page.evaluate(function() {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
      });
      
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('theme-light.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });

    test('should match dark theme screenshot', async function({ page }) {
      await page.evaluate(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
      });
      
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('theme-dark.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });
  });

  test.describe('Responsive Layouts', function() {
    
    test('should match mobile viewport screenshot', async function({ page }) {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('mobile-375.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });

    test('should match tablet viewport screenshot', async function({ page }) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('tablet-768.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });

    test('should match desktop viewport screenshot', async function({ page }) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('desktop-1280.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05
      });
    });
  });

  test.describe('Interactive States', function() {
    
    test('should match button hover states', async function({ page }) {
      var button = page.locator('button.btn-primary, .primary-button, [data-action]').first();
      
      if (await button.count() > 0) {
        await button.hover();
        await page.waitForTimeout(200);
        
        await expect(button).toHaveScreenshot('button-hover.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });

    test('should match input focus states', async function({ page }) {
      var input = page.locator('input[type="text"], input[type="number"]').first();
      
      if (await input.count() > 0) {
        await input.focus();
        await page.waitForTimeout(200);
        
        await expect(input).toHaveScreenshot('input-focus.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    });
  });

});
