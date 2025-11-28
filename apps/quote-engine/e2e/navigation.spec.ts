import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Tests for sidebar navigation and routing
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('.q-layout');
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/TicTacStick/);
    // Check main content is visible
    await expect(page.locator('.q-page')).toBeVisible();
  });

  test('should navigate to New Quote page', async ({ page }) => {
    // First navigate away from home, then click New Quote to go back
    await page.click('text=Saved Quotes');
    await expect(page).toHaveURL(/\/quotes/);
    // Click new quote in sidebar to return home
    await page.click('text=New Quote');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Saved Quotes page', async ({ page }) => {
    await page.click('text=Saved Quotes');
    await expect(page).toHaveURL(/\/quotes/);
  });

  test('should navigate to Clients page', async ({ page }) => {
    await page.click('text=Clients');
    await expect(page).toHaveURL(/\/clients/);
  });

  test('should navigate to Invoices page', async ({ page }) => {
    await page.click('text=Invoices');
    await expect(page).toHaveURL(/\/invoices/);
  });

  test('should navigate to Analytics page', async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings'); // Start from settings to test navigation
    await page.waitForSelector('.q-layout');
  });

  // Note: Ctrl+N/Cmd+N is problematic in browser testing as it opens new window
  // Skip this test - the shortcut works in the actual app
  test.skip('should open new quote with Ctrl/Meta+N', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+n' : 'Control+n');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL('/');
  });

  test('should open saved quotes with Ctrl+Q', async ({ page }) => {
    await page.keyboard.press('Control+q');
    await expect(page).toHaveURL(/\/quotes/);
  });

  test('should open invoices with Ctrl+I', async ({ page }) => {
    await page.keyboard.press('Control+i');
    await expect(page).toHaveURL(/\/invoices/);
  });

  test('should open settings with Ctrl+,', async ({ page }) => {
    // Navigate away first
    await page.goto('/');
    await page.waitForSelector('.q-layout');
    await page.keyboard.press('Control+,');
    await expect(page).toHaveURL(/\/settings/);
  });
});
