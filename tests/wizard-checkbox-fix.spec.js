// wizard-checkbox-fix.spec.js - Test that wizard checkboxes are visible and functional
// Tests the fix for checkboxes not ticking in wizards

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

test.describe('Wizard Checkbox Fix', function() {
  test.beforeEach(async function({ page }) {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
    await page.waitForFunction(function() {
      return window.APP && window.APP.initialized;
    });
  });

  test('Window wizard checkboxes should be visible and clickable', async function({ page }) {
    // Open window wizard
    await page.evaluate(function() {
      if (window.Wizard && window.Wizard.openWindowWizard) {
        window.Wizard.openWindowWizard();
      }
    });

    // Wait for wizard to open
    await page.waitForSelector('#wizardOverlay.wizard-open', { timeout: 5000 });

    // Check that checkboxes exist and are visible
    var insideCheckbox = page.locator('#wizWinInside');
    var outsideCheckbox = page.locator('#wizWinOutside');
    var highReachCheckbox = page.locator('#wizWinHigh');

    // Verify checkboxes are visible
    await expect(insideCheckbox).toBeVisible();
    await expect(outsideCheckbox).toBeVisible();
    await expect(highReachCheckbox).toBeVisible();

    // Verify checkboxes have the form-checkbox class
    var insideClass = await insideCheckbox.getAttribute('class');
    var outsideClass = await outsideCheckbox.getAttribute('class');
    var highReachClass = await highReachCheckbox.getAttribute('class');

    expect(insideClass).toContain('form-checkbox');
    expect(outsideClass).toContain('form-checkbox');
    expect(highReachClass).toContain('form-checkbox');

    // Verify default states
    await expect(insideCheckbox).toBeChecked();
    await expect(outsideCheckbox).toBeChecked();
    await expect(highReachCheckbox).not.toBeChecked();

    // Test clicking checkboxes
    await insideCheckbox.click();
    await expect(insideCheckbox).not.toBeChecked();

    await insideCheckbox.click();
    await expect(insideCheckbox).toBeChecked();

    await highReachCheckbox.click();
    await expect(highReachCheckbox).toBeChecked();

    await highReachCheckbox.click();
    await expect(highReachCheckbox).not.toBeChecked();
  });

  test('Checkbox states should be preserved when creating window line', async function({ page }) {
    // Open window wizard
    await page.evaluate(function() {
      if (window.Wizard && window.Wizard.openWindowWizard) {
        window.Wizard.openWindowWizard();
      }
    });

    // Wait for wizard to open
    await page.waitForSelector('#wizardOverlay.wizard-open', { timeout: 5000 });

    // Uncheck inside, keep outside checked
    await page.click('#wizWinInside');
    await page.click('#wizWinHigh');

    // Fill in basic details
    await page.fill('#wizWinTitle', 'Test Windows');
    await page.fill('#wizWinPanes', '5');

    // Click apply
    await page.click('#wizWinApply');

    // Wait for wizard to close (wait for the wizard-open class to be removed)
    await page.waitForFunction(function() {
      var overlay = document.getElementById('wizardOverlay');
      return overlay && !overlay.classList.contains('wizard-open');
    }, { timeout: 5000 });

    // Verify the window line was created with correct checkbox states
    var state = await page.evaluate(function() {
      return window.APP.getState();
    });

    expect(state.windowLines).toBeDefined();
    expect(state.windowLines.length).toBeGreaterThan(0);

    var lastLine = state.windowLines[state.windowLines.length - 1];
    expect(lastLine.inside).toBe(false);  // Unchecked
    expect(lastLine.outside).toBe(true);   // Checked
    expect(lastLine.highReach).toBe(true); // Checked
  });
});
