// Test Suite: Quote Calculation Accuracy
// Tests the core pricing engine for windows and pressure cleaning

const { test, expect } = require('./fixtures/fresh-context');
const { initializeApp } = require('./test-helpers');

test.describe('Quote Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await initializeApp(page);
  });

  test('should load with default configuration values', async ({ page }) => {
    await expect(page.locator('#baseFeeInput')).toHaveValue('120');
    await expect(page.locator('#hourlyRateInput')).toHaveValue('95');
    await expect(page.locator('#minimumJobInput')).toHaveValue('180');
    await expect(page.locator('#highReachModifierInput')).toHaveValue('60');
  });

  test('should calculate simple window quote correctly', async ({ page }) => {
    // Add a single window line using the APP API
    await page.evaluate(() => {
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 5,
        inside: true,
        outside: true,
        highReach: false
      });
      // Trigger recalculation
      window.APP.recalculate();
    });

    // Wait for calculations to complete
    await page.waitForTimeout(100);

    // Verify subtotal is displayed and greater than base fee
    const subtotal = await page.locator('#subtotalDisplay').textContent();
    expect(subtotal).toMatch(/\$\d+/);

    // Parse the subtotal value and check it's greater than base fee
    const subtotalValue = parseFloat(subtotal.replace(/[$,]/g, ''));
    expect(subtotalValue).toBeGreaterThan(120); // Base fee is $120
  });

  test('should enforce minimum job charge', async ({ page }) => {
    // Set minimum job to $200
    await page.fill('#minimumJobInput', '200');

    // Add a very small job (1 window, outside only) using APP API
    await page.evaluate(() => {
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 1,
        inside: false,
        outside: true,
        highReach: false
      });
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    // Final total should not be less than minimum
    const totalText = await page.locator('#totalIncGstDisplay').textContent();
    const total = parseFloat(totalText.replace(/[$,]/g, ''));
    expect(total).toBeGreaterThanOrEqual(200);
  });

  test('should calculate GST correctly at 10%', async ({ page }) => {
    // Add a window line using APP API
    await page.evaluate(() => {
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 10,
        inside: false,
        outside: true,
        highReach: false
      });
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    // Get subtotal and GST
    const subtotalText = await page.locator('#subtotalDisplay').textContent();
    const gstText = await page.locator('#gstDisplay').textContent();

    const subtotal = parseFloat(subtotalText.replace(/[$,]/g, ''));
    const gst = parseFloat(gstText.replace(/[$,]/g, ''));

    // GST should be 10% of subtotal
    // Formula matches Money.calculateGST() implementation
    const expectedGst = Math.round(subtotal * 0.1 * 100) / 100;
    expect(Math.abs(gst - expectedGst)).toBeLessThan(0.02); // Allow 1 cent rounding
  });

  test('should calculate high reach premium correctly', async ({ page }) => {
    // Add window with high reach using APP API
    await page.evaluate(() => {
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 5,
        inside: false,
        outside: true,
        highReach: true  // Enable high reach
      });
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    // High reach adjustment should be visible and > 0
    const highReachText = await page.locator('#highReachDisplay').textContent();
    const highReach = parseFloat(highReachText.replace(/[$,]/g, ''));
    expect(highReach).toBeGreaterThan(0);
  });

  test('should calculate pressure cleaning by area', async ({ page }) => {
    // Add pressure cleaning line using APP API
    await page.evaluate(() => {
      window.APP.addPressureLine({
        surfaceId: 'driveway',
        areaSqm: 50,
        soilLevel: 'medium',
        access: 'easy'
      });
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    // Should have a cost > 0
    const costText = await page.locator('#pressureCostDisplay').textContent();
    const cost = parseFloat(costText.replace(/[$,]/g, ''));
    expect(cost).toBeGreaterThan(0);
  });

  test('should update totals when configuration changes', async ({ page }) => {
    // Add a window line using APP API
    await page.evaluate(() => {
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 10,
        inside: false,
        outside: true,
        highReach: false
      });
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    const initialTotal = await page.locator('#totalIncGstDisplay').textContent();

    // Change hourly rate
    await page.fill('#hourlyRateInput', '150');

    // Trigger recalculation after config change
    await page.evaluate(() => {
      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    const newTotal = await page.locator('#totalIncGstDisplay').textContent();

    // Totals should be different
    expect(newTotal).not.toBe(initialTotal);
  });

  test('should handle multiple window lines correctly', async ({ page }) => {
    // Add multiple window types using APP API
    await page.evaluate(() => {
      // Add first window line
      window.APP.addWindowLine({
        windowTypeId: 'std1',
        panes: 5,
        inside: false,
        outside: true,
        highReach: false
      });

      // Add second window line
      window.APP.addWindowLine({
        windowTypeId: 'std3',
        panes: 3,
        inside: true,
        outside: true,
        highReach: false
      });

      window.APP.recalculate();
    });

    await page.waitForTimeout(100);

    // Should have combined cost
    const totalText = await page.locator('#totalIncGstDisplay').textContent();
    expect(totalText).toMatch(/\$\d+/);

    // Total should be greater than minimum (both lines combined)
    const total = parseFloat(totalText.replace(/[$,]/g, ''));
    expect(total).toBeGreaterThan(180); // More than minimum job charge
  });
});
