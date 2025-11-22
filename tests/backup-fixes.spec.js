// tests/backup-fixes.spec.js - Verification test for backup system bug fixes
// Tests Bug #1 (double stringification) and Bug #2 (return value handling)

const { test, expect } = require('./fixtures/fresh-context');
const { resolvePath } = require('./fixtures/app-url');

const VERIFY_URL = resolvePath('tests/verify-backup-fixes.html');

test.describe('Backup System Bug Fixes Verification', () => {

  test('should verify Bug #1 fix - no double JSON stringification', async ({ page }) => {
    // Navigate to verification page
    await page.goto(VERIFY_URL);

    // Wait for auto-run tests to complete
    await page.waitForTimeout(3000);

    // Check export test results
    const exportResults = await page.locator('#export-results .test-result').allTextContents();

    // Should have passing tests
    expect(exportResults.some(text => text.includes('✓ Export returns a string'))).toBe(true);
    expect(exportResults.some(text => text.includes('✓ Export is valid JSON (not double-stringified)'))).toBe(true);
    expect(exportResults.some(text => text.includes('✓ Nested data is correct (not stringified twice)'))).toBe(true);
    expect(exportResults.some(text => text.includes('✅ EXPORT TEST PASSED - Bug #1 is fixed!'))).toBe(true);
  });

  test('should verify Bug #2 fix - correct return value handling', async ({ page }) => {
    await page.goto(VERIFY_URL);
    await page.waitForTimeout(3000);

    // Check import test results
    const importResults = await page.locator('#import-results .test-result').allTextContents();

    // Should have passing tests
    expect(importResults.some(text => text.includes('✓ Import returns boolean (not object)'))).toBe(true);
    expect(importResults.some(text => text.includes('✓ Import returns true on success'))).toBe(true);
    expect(importResults.some(text => text.includes('✓ Data was imported to localStorage'))).toBe(true);
    expect(importResults.some(text => text.includes('✅ IMPORT TEST PASSED - Bug #2 is fixed!'))).toBe(true);
  });

  test('should verify round-trip data integrity', async ({ page }) => {
    await page.goto(VERIFY_URL);
    await page.waitForTimeout(3000);

    // Check round-trip test results
    const roundtripResults = await page.locator('#roundtrip-results .test-result').allTextContents();

    // Should have passing tests
    expect(roundtripResults.some(text => text.includes('✓ Quotes data integrity verified'))).toBe(true);
    expect(roundtripResults.some(text => text.includes('✓ Clients data integrity verified'))).toBe(true);
    expect(roundtripResults.some(text => text.includes('✓ Invoices data integrity verified'))).toBe(true);
    expect(roundtripResults.some(text => text.includes('✅ ROUND-TRIP TEST PASSED'))).toBe(true);
  });

  test('should show all tests passed in summary', async ({ page }) => {
    await page.goto(VERIFY_URL);
    await page.waitForTimeout(3000);

    // Check summary
    const summary = await page.locator('#summary').textContent();

    expect(summary).toContain('✅ ALL TESTS PASSED!');
    expect(summary).toContain('3 / 3 tests passed');
    expect(summary).toContain('Bug #1 (Double JSON stringification) is FIXED ✓');
    expect(summary).toContain('Bug #2 (Return value handling) is FIXED ✓');
    expect(summary).toContain('Backup System is 100% functional ✓');
  });
});
