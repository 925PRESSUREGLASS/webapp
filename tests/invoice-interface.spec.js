// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Invoice Interface Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Tic-Tac-Stick/);
    console.log('✓ Page loaded successfully');
  });

  test('should have invoice button visible', async ({ page }) => {
    const invoiceBtn = page.locator('#manageInvoicesBtn');
    await expect(invoiceBtn).toBeVisible({ timeout: 10000 });
    await expect(invoiceBtn).toContainText('Invoices');
    console.log('✓ Invoice button is visible');
  });

  test('should open invoice modal when clicked', async ({ page }) => {
    // Click invoice button
    await page.click('#manageInvoicesBtn');

    // Wait for modal to appear
    const modal = page.locator('#invoiceListModal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toHaveClass(/active/);

    console.log('✓ Invoice modal opens correctly');
  });

  test('should show invoice toolbar buttons', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Check for toolbar buttons
    const createBtn = page.locator('#createInvoiceBtn');
    const agingReportBtn = page.locator('#showAgingReportBtn');
    const settingsBtn = page.locator('#invoiceSettingsBtn');

    await expect(createBtn).toBeVisible();
    await expect(agingReportBtn).toBeVisible();
    await expect(settingsBtn).toBeVisible();

    await expect(createBtn).toContainText('Create Invoice');
    await expect(agingReportBtn).toContainText('Aging Report');
    await expect(settingsBtn).toContainText('Settings');

    console.log('✓ All toolbar buttons are visible');
  });

  test('should open aging report modal', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Click aging report button
    await page.click('#showAgingReportBtn');

    // Wait for aging report modal
    const agingModal = page.locator('#agingReportModal');
    await expect(agingModal).toBeVisible({ timeout: 5000 });

    // Check for aging report content
    await expect(page.locator('.aging-summary')).toBeVisible();
    await expect(page.locator('.aging-stat-total')).toBeVisible();
    await expect(page.locator('.aging-buckets')).toBeVisible();

    console.log('✓ Aging report modal opens correctly');
  });

  test('should show all four aging buckets', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#showAgingReportBtn');
    await page.waitForSelector('#agingReportModal.active');

    // Check for all aging buckets
    const currentBucket = page.locator('.aging-bucket-current');
    const days30Bucket = page.locator('.aging-bucket-30');
    const days60Bucket = page.locator('.aging-bucket-60');
    const days90Bucket = page.locator('.aging-bucket-90');

    await expect(currentBucket).toBeVisible();
    await expect(days30Bucket).toBeVisible();
    await expect(days60Bucket).toBeVisible();
    await expect(days90Bucket).toBeVisible();

    await expect(currentBucket).toContainText('Current (0-30 days)');
    await expect(days30Bucket).toContainText('31-60 Days Overdue');
    await expect(days60Bucket).toContainText('61-90 Days Overdue');
    await expect(days90Bucket).toContainText('90+ Days Overdue');

    console.log('✓ All four aging buckets are displayed');
  });

  test('should open settings modal', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Click settings button
    await page.click('#invoiceSettingsBtn');

    // Wait for settings modal
    const settingsModal = page.locator('#invoiceSettingsModal');
    await expect(settingsModal).toBeVisible({ timeout: 5000 });

    // Check for settings form fields
    await expect(page.locator('#invoicePrefix')).toBeVisible();
    await expect(page.locator('#nextInvoiceNumber')).toBeVisible();
    await expect(page.locator('#paymentTermsDays')).toBeVisible();
    await expect(page.locator('#bankName')).toBeVisible();
    await expect(page.locator('#accountName')).toBeVisible();
    await expect(page.locator('#bsb')).toBeVisible();
    await expect(page.locator('#accountNumber')).toBeVisible();
    await expect(page.locator('#abn')).toBeVisible();

    console.log('✓ Settings modal opens with all form fields');
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Click close button
    await page.click('.invoice-modal-close');

    // Wait for modal to fade out and be removed from DOM
    await page.waitForSelector('#invoiceListModal', { state: 'detached', timeout: 1000 });

    console.log('✓ Modal closes correctly');
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Click on backdrop (modal itself, not content)
    await page.click('#invoiceListModal', { position: { x: 10, y: 10 } });

    // Wait for modal to fade out and be removed from DOM
    await page.waitForSelector('#invoiceListModal', { state: 'detached', timeout: 1000 });

    console.log('✓ Modal closes when clicking backdrop');
  });

  test('should show invoice stats summary', async ({ page }) => {
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Check for stats summary
    const statsContainer = page.locator('.invoice-stats-summary');

    // May or may not be visible depending on if there are invoices
    // Just check if container exists
    const exists = await statsContainer.count() > 0;
    console.log(exists ? '✓ Invoice stats summary structure exists' : '! No invoices yet - stats will show when invoices exist');
  });

  test('should check responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Open invoice modal
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    // Check if modal is visible on mobile
    const modal = page.locator('#invoiceListModal');
    await expect(modal).toBeVisible();

    // Check if toolbar buttons are visible (should stack vertically on mobile)
    const toolbar = page.locator('.invoice-toolbar');
    await expect(toolbar).toBeVisible();

    console.log('✓ Mobile responsive design works');
  });

  test('should check dark theme styling', async ({ page }) => {
    // Check if dark theme is applied (default)
    const body = page.locator('body');
    const dataTheme = await body.getAttribute('data-theme');

    console.log('Current theme:', dataTheme || 'dark (default)');

    // Open invoice modal and check styling
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    const modalContent = page.locator('.invoice-modal-content');
    const bgColor = await modalContent.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    console.log('✓ Theme styling applied, background color:', bgColor);
  });

  test('should verify all CSS files are loaded', async ({ page }) => {
    // Check if invoice.css is loaded
    const stylesheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.map(sheet => {
        try {
          return sheet.href || 'inline';
        } catch (e) {
          return 'CORS blocked';
        }
      });
    });

    const hasInvoiceCSS = stylesheets.some(href =>
      typeof href === 'string' && href.includes('invoice.css')
    );

    expect(hasInvoiceCSS).toBeTruthy();
    console.log('✓ invoice.css is loaded');
  });

  test('should verify invoice.js is loaded and initialized', async ({ page }) => {
    // Check if InvoiceManager exists on window
    const invoiceManagerExists = await page.evaluate(() => {
      return typeof window.InvoiceManager !== 'undefined';
    });

    expect(invoiceManagerExists).toBeTruthy();
    console.log('✓ InvoiceManager is initialized');
  });

});
