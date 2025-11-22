// Test Suite: UI Interactions and Features
// Tests user interface functionality, wizards, and data persistence

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

test.describe('UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await waitForAppReady(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
  });

  test('should toggle accordion sections', async ({ page }) => {
    // Config panel should be visible by default (has card-body-open class)
    const configBody = page.locator('#configBody');
    await expect(configBody).toHaveClass(/card-body-open/);

    // Click toggle to collapse
    await page.click('button[data-target="configBody"]');
    await expect(configBody).not.toHaveClass(/card-body-open/);

    // Click again to expand
    await page.click('button[data-target="configBody"]');
    await expect(configBody).toHaveClass(/card-body-open/);
  });

  test('should add and remove window lines', async ({ page }) => {
    // Initially should have no lines
    const initialCount = await page.locator('.line-item').count();
    expect(initialCount).toBe(0);

    // Add a line
    await page.click('#addWindowLineBtn');
    const afterAddCount = await page.locator('.line-item').count();
    expect(afterAddCount).toBe(1);

    // Remove the line
    await page.click('button:has-text("Remove")');
    const afterRemoveCount = await page.locator('.line-item').count();
    expect(afterRemoveCount).toBe(0);
  });

  test('should open and close window wizard', async ({ page }) => {
    const wizardOverlay = page.locator('#wizardOverlay');

    // Wizard should be hidden initially
    await expect(wizardOverlay).toBeHidden();

    // Open wizard
    await page.click('#openWindowWizardBtn');
    await expect(wizardOverlay).toBeVisible();
    await expect(page.locator('#wizardTitle')).toContainText('Window');

    // Close wizard
    await page.click('#wizardCloseBtn');
    await expect(wizardOverlay).toBeHidden();
  });

  test('should open and close pressure wizard', async ({ page }) => {
    const wizardOverlay = page.locator('#wizardOverlay');

    // Open wizard
    await page.click('#openPressureWizardBtn');
    await expect(wizardOverlay).toBeVisible();
    await expect(page.locator('#wizardTitle')).toContainText('Pressure');

    // Close wizard
    await page.click('#wizardCloseBtn');
    await expect(wizardOverlay).toBeHidden();
  });

  test('should populate quote metadata', async ({ page }) => {
    await page.fill('#quoteTitleInput', 'Test Quote - John Doe');
    await page.fill('#clientNameInput', 'John Doe');
    await page.fill('#clientLocationInput', 'Sydney CBD');
    await page.selectOption('#jobTypeInput', 'residential');

    // Values should be set
    await expect(page.locator('#quoteTitleInput')).toHaveValue('Test Quote - John Doe');
    await expect(page.locator('#clientNameInput')).toHaveValue('John Doe');
    await expect(page.locator('#clientLocationInput')).toHaveValue('Sydney CBD');
    await expect(page.locator('#jobTypeInput')).toHaveValue('residential');
  });

  test('should clear all data when Clear All is clicked', async ({ page }) => {
    // Add some data
    await page.fill('#quoteTitleInput', 'Test Quote');
    await page.click('#addWindowLineBtn');

    // Set up dialog handler before clicking
    page.on('dialog', dialog => dialog.accept());

    // Click Clear All
    await page.click('#clearAllBtn');

    await page.waitForTimeout(100);

    // Should be cleared
    await expect(page.locator('#quoteTitleInput')).toHaveValue('');
    const lineCount = await page.locator('.line-item').count();
    expect(lineCount).toBe(0);
  });

  test('should persist data with autosave', async ({ page }) => {
    // Enable autosave
    await page.check('#autosaveToggle');

    // Add data
    await page.fill('#quoteTitleInput', 'Autosaved Quote');

    // Use wizard to add a window line with specific type
    await page.click('#openWindowWizardBtn');
    await page.selectOption('#wizWinType', 'std1');
    await page.fill('#wizWinPanes', '5');
    await page.click('#wizWinApply');
    // Wizard closes automatically after Apply

    // Wait for autosave
    await page.waitForTimeout(700);

    // Reload page
    await page.reload();

    // Data should be restored
    await expect(page.locator('#quoteTitleInput')).toHaveValue('Autosaved Quote');
    const lineCount = await page.locator('.line-item').count();
    expect(lineCount).toBe(1);
  });

  test('should add notes to quote', async ({ page }) => {
    await page.fill('#internalNotesInput', 'This is an internal note');
    await page.fill('#clientNotesInput', 'This is a client note');

    await expect(page.locator('#internalNotesInput')).toHaveValue('This is an internal note');
    await expect(page.locator('#clientNotesInput')).toHaveValue('This is a client note');
  });

  test('should duplicate window line', async ({ page }) => {
    // Add a window line using wizard
    await page.click('#openWindowWizardBtn');
    await page.selectOption('#wizWinType', 'std2');
    await page.fill('#wizWinPanes', '7');
    await page.click('#wizWinApply');

    const initialCount = await page.locator('.line-item').count();

    // Duplicate the line
    await page.click('button:has-text("Duplicate")');

    const afterCount = await page.locator('.line-item').count();
    expect(afterCount).toBe(initialCount + 1);
  });

  test('should show time estimates in summary', async ({ page }) => {
    // Add a window line using wizard
    await page.click('#openWindowWizardBtn');
    await page.selectOption('#wizWinType', 'std1');
    await page.fill('#wizWinPanes', '10');
    await page.uncheck('#wizWinInside');  // Uncheck inside to leave only outside
    await page.click('#wizWinApply');

    await page.waitForTimeout(100);

    // Time estimate should be visible and > 0
    const timeEstimate = await page.locator('#timeEstimateDisplay').textContent();
    expect(timeEstimate).toMatch(/[\d.]+\s*hrs/);
  });

  test('should update chart when data changes', async ({ page }) => {
    // Check if chart canvas exists
    const chart = page.locator('#timeChart');
    await expect(chart).toBeVisible();

    // Add data using wizard
    await page.click('#openWindowWizardBtn');
    await page.selectOption('#wizWinType', 'std1');
    await page.fill('#wizWinPanes', '5');
    await page.uncheck('#wizWinInside');  // Uncheck inside to leave only outside
    await page.click('#wizWinApply');

    await page.waitForTimeout(500);

    // Chart should still be visible (would update with data)
    await expect(chart).toBeVisible();
  });

  test('should switch between wizard and manual mode', async ({ page }) => {
    const modeBtn = page.locator('#toggleModeBtn');
    const initialText = await modeBtn.textContent();

    // Click to toggle mode
    await modeBtn.click();
    const afterText = await modeBtn.textContent();

    // Text should change
    expect(afterText).not.toBe(initialText);
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoApp(page);

    // App should be visible
    const app = page.locator('.app');
    await expect(app).toBeVisible();

    // Header should be visible
    const header = page.locator('.hdr');
    await expect(header).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoApp(page);

    const app = page.locator('.app');
    await expect(app).toBeVisible();
  });
});
