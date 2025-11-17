// Test Suite: Wizard Functionality
// Tests the quick-entry wizard dialogs for windows and pressure cleaning

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Window Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open window wizard
    await page.click('#openWindowWizardBtn');
    await page.waitForSelector('#wizardOverlay:visible');
  });

  test('should open window wizard with form fields', async ({ page }) => {
    // Wizard should be visible
    await expect(page.locator('#wizardOverlay')).toBeVisible();
    await expect(page.locator('#wizardTitle')).toContainText('Window');
  });

  test('should close wizard without adding data', async ({ page }) => {
    // Close wizard
    await page.click('#wizardCloseBtn');
    await expect(page.locator('#wizardOverlay')).toBeHidden();

    // No lines should be added
    const lineCount = await page.locator('.line-card').count();
    expect(lineCount).toBe(0);
  });

  test('should close wizard when clicking overlay', async ({ page }) => {
    // Click on overlay (outside dialog)
    await page.click('#wizardOverlay', { position: { x: 10, y: 10 } });

    // Wizard should close
    await expect(page.locator('#wizardOverlay')).toBeHidden();
  });
});

test.describe('Pressure Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open pressure wizard
    await page.click('#openPressureWizardBtn');
    await page.waitForSelector('#wizardOverlay:visible');
  });

  test('should open pressure wizard with form fields', async ({ page }) => {
    // Wizard should be visible
    await expect(page.locator('#wizardOverlay')).toBeVisible();
    await expect(page.locator('#wizardTitle')).toContainText('Pressure');
  });

  test('should close wizard without adding data', async ({ page }) => {
    // Close wizard
    await page.click('#wizardCloseBtn');
    await expect(page.locator('#wizardOverlay')).toBeHidden();

    // No lines should be added
    const pressureLineCount = await page.locator('#pressureLinesContainer .line-card').count();
    expect(pressureLineCount).toBe(0);
  });
});

test.describe('Data Validation', () => {
  test('should validate numeric inputs', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Try to enter invalid data
    await page.fill('#baseFeeInput', '-100');

    // Trigger blur event to activate validation
    await page.locator('#baseFeeInput').blur();
    await page.waitForTimeout(100);

    // Might be prevented or clamped to 0
    const value = await page.locator('#baseFeeInput').inputValue();
    const numValue = parseFloat(value);

    // Should either be 0 or positive
    expect(numValue).toBeGreaterThanOrEqual(0);
  });

  test('should handle decimal precision in currency', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Add window line using wizard
    await page.click('#openWindowWizardBtn');
    await page.selectOption('#wizWinType', 'std1');
    await page.fill('#wizWinPanes', '1');
    await page.uncheck('#wizWinInside');  // Only outside
    await page.click('#wizWinApply');

    await page.waitForTimeout(100);

    // All currency displays should have proper formatting
    const total = await page.locator('#totalIncGstDisplay').textContent();
    expect(total).toMatch(/\$\d+(\.\d{2})?/);
  });
});
