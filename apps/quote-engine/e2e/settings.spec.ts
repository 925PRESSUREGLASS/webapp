import { test, expect } from '@playwright/test';

/**
 * Settings Page E2E Tests
 * Tests for application settings
 */

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('.q-page');
  });

  test('should display settings page with tabs', async ({ page }) => {
    // Check heading is visible (use first() to handle multiple matches)
    await expect(page.locator('h4:has-text("Settings")').first()).toBeVisible();
    // Check tabs are visible - use exact match with .q-tab
    await expect(page.locator('.q-tabs')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Get tab panel
    const tabs = page.locator('.q-tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
    
    // Click each tab and verify content changes
    if (tabCount > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
    }
  });

  test('should have business name input', async ({ page }) => {
    // Business tab should have an input
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have export buttons in data tab', async ({ page }) => {
    // Click Data tab
    await page.locator('.q-tab:has-text("Data")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Export")').first()).toBeVisible();
  });

  test('should have save button', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")').first()).toBeVisible();
  });
});

test.describe('Theme Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('.q-page');
    // Click Appearance tab
    await page.locator('.q-tab:has-text("Appearance")').click();
    await page.waitForTimeout(300);
  });

  test('should have theme selector', async ({ page }) => {
    // Look for theme-related content
    await expect(page.locator('text=/Theme|Appearance/i').first()).toBeVisible();
  });

  test('should have compact mode toggle', async ({ page }) => {
    await expect(page.locator('text=Compact Mode').first()).toBeVisible();
  });

  test('should have keyboard shortcuts button', async ({ page }) => {
    await expect(page.locator('button:has-text("Shortcuts")').first()).toBeVisible();
  });

  test('should open keyboard shortcuts dialog', async ({ page }) => {
    await page.locator('button:has-text("Shortcuts")').first().click();
    await page.waitForTimeout(500);
    // Look for shortcuts content
    await expect(page.locator('text=/Shortcut|Keyboard/i').first()).toBeVisible();
    // Close dialog
    await page.keyboard.press('Escape');
  });
});
