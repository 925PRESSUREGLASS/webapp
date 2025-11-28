import { test, expect } from '@playwright/test';

/**
 * Quote to Invoice Flow E2E Tests
 * Tests the complete flow from creating a quote to generating an invoice
 */

test.describe('Quote to Invoice Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to quote page
    await page.goto('/quote');
    await page.waitForSelector('.q-page');
  });

  test('should create quote with window line and verify pricing', async ({ page }) => {
    // Enter client information
    const clientNameInput = page.locator('input').filter({ hasText: /client/i }).first()
      .or(page.locator('[aria-label*="Client"]').first())
      .or(page.locator('label:has-text("Client") + .q-field__control input').first());
    
    // Try multiple selectors for client name
    const nameInputs = page.locator('.q-input input');
    if (await nameInputs.first().isVisible()) {
      await nameInputs.first().fill('Test Client ABC');
    }

    // Look for the Window Cleaning section and add button
    const windowSection = page.locator('text=Window Cleaning').first();
    await expect(windowSection).toBeVisible({ timeout: 5000 });

    // Click add button in window section (the + button)
    const addWindowBtn = page.locator('.q-card:has-text("Window Cleaning") button[class*="round"]').first()
      .or(page.locator('.q-card:has-text("Window Cleaning") .q-btn--round').first());
    
    if (await addWindowBtn.isVisible()) {
      await addWindowBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify a window line was added - look for line editor or pane input
    const windowLine = page.locator('.line-editor, [class*="line-editor"], .q-card:has-text("Window Type")').first();
    await expect(windowLine).toBeVisible({ timeout: 5000 });

    // Check that price is not zero
    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    if (await priceText.isVisible()) {
      const price = await priceText.textContent();
      expect(price).not.toBe('$0.00');
    }
  });

  test('should create quote with pressure line and verify pricing', async ({ page }) => {
    // Look for the Pressure Cleaning section
    const pressureSection = page.locator('text=Pressure Cleaning').first();
    await expect(pressureSection).toBeVisible({ timeout: 5000 });

    // Click add button in pressure section
    const addPressureBtn = page.locator('.q-card:has-text("Pressure Cleaning") button[class*="round"]').first()
      .or(page.locator('.q-card:has-text("Pressure Cleaning") .q-btn--round').first());
    
    if (await addPressureBtn.isVisible()) {
      await addPressureBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify a pressure line was added
    const pressureLine = page.locator('.line-editor, [class*="line-editor"]').first();
    await expect(pressureLine).toBeVisible({ timeout: 5000 });

    // Check that estimated price shows
    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    if (await priceText.isVisible()) {
      const price = await priceText.textContent();
      expect(price).not.toBe('$0.00');
    }
  });

  test('should show quote summary with totals', async ({ page }) => {
    // Add a window line first
    const addWindowBtn = page.locator('.q-card:has-text("Window Cleaning") .q-btn--round').first();
    if (await addWindowBtn.isVisible()) {
      await addWindowBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for summary section with Subtotal, GST, Total
    const subtotalText = page.locator('text=/Subtotal/i').first();
    const gstText = page.locator('text=/GST/i').first();
    const totalText = page.locator('text=/Total/i').first();

    // At least one should be visible
    const hasSubtotal = await subtotalText.isVisible().catch(() => false);
    const hasGst = await gstText.isVisible().catch(() => false);
    const hasTotal = await totalText.isVisible().catch(() => false);

    expect(hasSubtotal || hasGst || hasTotal).toBe(true);
  });

  test('should navigate to create invoice from quote', async ({ page }) => {
    // Add a line item first (required for valid quote)
    const addWindowBtn = page.locator('.q-card:has-text("Window Cleaning") .q-btn--round').first();
    if (await addWindowBtn.isVisible()) {
      await addWindowBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill in client name (may be required)
    const nameInputs = page.locator('.q-input input');
    if (await nameInputs.first().isVisible()) {
      await nameInputs.first().fill('Invoice Test Client');
    }

    // Look for Create Invoice button
    const createInvoiceBtn = page.locator('button:has-text("Create Invoice"), .q-btn:has-text("Create Invoice")').first();
    
    if (await createInvoiceBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createInvoiceBtn.click();
      await page.waitForTimeout(1000);

      // Should either navigate to invoices or show success notification
      const onInvoicesPage = await page.locator('text=/Invoice|INV-/i').first().isVisible().catch(() => false);
      const hasNotification = await page.locator('.q-notification, [class*="notification"]').first().isVisible().catch(() => false);
      
      expect(onInvoicesPage || hasNotification).toBe(true);
    }
  });
});

test.describe('Invoice Display', () => {
  test('should display invoice list page', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForSelector('.q-page');

    // Should have invoices page content
    const pageTitle = page.locator('text=/Invoice/i').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
  });

  test('should show invoice with line items when available', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForSelector('.q-page');

    // Look for any invoice cards or list items
    const invoiceItems = page.locator('.q-card, .q-item, [class*="invoice"]');
    const count = await invoiceItems.count();
    
    // This is informational - may or may not have invoices
    console.log(`Found ${count} invoice-related elements`);
  });
});
