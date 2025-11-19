// @ts-check
const { test, expect } = require('@playwright/test');
const { initializeApp } = require('./test-helpers');

const APP_URL = '/index.html';

/**
 * Invoice System Functional Tests
 * Tests critical P0 functionality for production readiness
 *
 * Based on: docs/INVOICE_TESTING_CHECKLIST.md
 */

test.describe('Invoice System - Critical Functional Tests (P0)', () => {

  test.beforeEach(async ({ page }) => {
    await initializeApp(page);

    // Clear LocalStorage for clean state
    await page.evaluate(() => {
      localStorage.removeItem('invoice-database');
      localStorage.removeItem('invoice-settings');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for APP to initialize again after reload
    await page.evaluate(async () => {
      if (window.APP && typeof window.APP.waitForInit === 'function') {
        await window.APP.waitForInit();
      }
    });

    // Wait for invoice system to initialize
    await page.waitForFunction(() => {
      return typeof window.InvoiceManager !== 'undefined' && typeof window.APP !== 'undefined';
    }, { timeout: 10000 });
  });

  /**
   * TEST 1: Create Invoice from Quote
   * Priority: P0
   * Description: Convert an existing quote to an invoice
   */
  test('Test 1: Create invoice from quote with correct data structure', async ({ page }) => {
    console.log('=== Test 1: Create Invoice from Quote ===');

    // Create a quote
    await page.fill('#clientNameInput', 'Test Customer');
    await page.fill('#clientLocationInput', 'Sydney CBD');

    // Add window cleaning item - panel is always visible
    const windowSection = page.locator('#windowsPanel');
    await expect(windowSection).toBeVisible();

    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.line-card');

    const firstLine = page.locator('.line-card').first();
    // Fill in actual fields: panes count and select window type
    await firstLine.locator('input[type="number"]').first().fill('8');
    await firstLine.locator('select').first().selectOption({ index: 2 }); // Select a window type

    // Wait for totals to update
    await page.waitForTimeout(500);

    // Verify quote totals before creating invoice
    const subtotalText = await page.locator('#subtotalDisplay').textContent();
    const gstText = await page.locator('#gstDisplay').textContent();
    const totalText = await page.locator('#totalIncGstDisplay').textContent();

    console.log('Quote totals:', { subtotalText, gstText, totalText });

    // Open invoice modal and create invoice
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(1000);

    // Verify invoice created - check LocalStorage
    const invoiceData = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoiceData.length).toBe(1);
    const invoice = invoiceData[0];

    // Test 1 Assertions
    console.log('Invoice created:', invoice.invoiceNumber);

    // ID format
    expect(invoice.id).toMatch(/^invoice_\d+_[a-z0-9]+$/);

    // Invoice number format (NOT INV-2025-XXXXXX, but INV-1001)
    expect(invoice.invoiceNumber).toBe('INV-1001');

    // Client info
    expect(invoice.clientName).toBe('Test Customer');
    expect(invoice.clientLocation).toBe('Sydney CBD');

    // Line items
    expect(invoice.windowLines).toBeDefined();
    expect(invoice.windowLines.length).toBeGreaterThan(0);

    // Financial fields
    expect(invoice.subtotal).toBeGreaterThan(0);
    expect(invoice.gst).toBeGreaterThan(0);
    expect(invoice.total).toBeGreaterThan(0);

    // Dates are timestamps
    expect(typeof invoice.invoiceDate).toBe('number');
    expect(typeof invoice.dueDate).toBe('number');
    expect(typeof invoice.createdDate).toBe('number');

    // Status and payment fields
    expect(invoice.status).toBe('draft');
    expect(invoice.amountPaid).toBe(0);
    expect(invoice.balance).toBe(invoice.total);

    // QuoteId field should be set for tracking
    expect(invoice.quoteId).toBeDefined();
    expect(typeof invoice.quoteId).toBe('string');
    expect(invoice.quoteId).toMatch(/^quote_\d+_[a-z0-9]+$/);

    // Status history
    expect(invoice.statusHistory).toBeDefined();
    expect(invoice.statusHistory.length).toBe(1);
    expect(invoice.statusHistory[0].status).toBe('draft');
    expect(invoice.statusHistory[0].note).toBe('Invoice created');

    console.log('✓ Test 1 PASSED: Invoice created with correct structure');
  });

  /**
   * TEST 3: Invoice Numbering Sequence
   * Priority: P0
   * Description: Verify sequential numbering
   */
  test('Test 3: Invoice numbering is sequential', async ({ page }) => {
    console.log('=== Test 3: Invoice Numbering Sequence ===');

    // Helper function to create invoice
    const createInvoice = async (clientName) => {
      await page.fill('#clientNameInput', clientName);
      await page.click('#addWindowLineBtn');

      const firstLine = page.locator('.line-card').first();
      await firstLine.locator('input[type="number"]').first().fill('1');
      await firstLine.locator('select').first().selectOption({ index: 2 });

      await page.waitForTimeout(300);

      await page.click('#manageInvoicesBtn');
      await page.waitForSelector('#invoiceListModal.active');
      await page.click('#createInvoiceBtn');
      await page.waitForTimeout(500);
      await page.click('.invoice-modal-close');
      await page.waitForTimeout(300);
    };

    // Create 3 invoices
    await createInvoice('Client 1');
    await createInvoice('Client 2');
    await createInvoice('Client 3');

    // Check invoice numbers
    const invoices = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoices.length).toBe(3);

    // Check sequential numbering (NOT year-based)
    expect(invoices[0].invoiceNumber).toBe('INV-1003'); // newest first
    expect(invoices[1].invoiceNumber).toBe('INV-1002');
    expect(invoices[2].invoiceNumber).toBe('INV-1001'); // oldest

    console.log('Invoice numbers:', invoices.map(i => i.invoiceNumber));

    // Verify settings counter
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-settings');
      return data ? JSON.parse(data) : {};
    });

    expect(settings.nextInvoiceNumber).toBe(1004);

    // Test persistence after refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.InvoiceManager !== 'undefined');

    await createInvoice('Client 4');

    const invoicesAfterReload = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoicesAfterReload.length).toBe(4);
    expect(invoicesAfterReload[0].invoiceNumber).toBe('INV-1004');

    console.log('✓ Test 3 PASSED: Sequential numbering works, persists after reload');
  });

  /**
   * TEST 4: GST Calculation Accuracy
   * Priority: P0
   * Description: Verify GST calculated at exactly 10%
   */
  test('Test 4: GST calculation accuracy for various amounts', async ({ page }) => {
    console.log('=== Test 4: GST Calculation Accuracy ===');

    const testScenarios = [
      { subtotal: 1000.00, expectedGST: 100.00, expectedTotal: 1100.00, description: 'Round numbers' },
      { subtotal: 685.50, expectedGST: 68.55, expectedTotal: 754.05, description: 'Decimal cents' },
      { subtotal: 333.33, expectedGST: 33.33, expectedTotal: 366.66, description: 'Rounding required' },
    ];

    for (const scenario of testScenarios) {
      console.log(`Testing: ${scenario.description} (subtotal: $${scenario.subtotal})`);

      // Clear and create new quote
      await page.evaluate(() => localStorage.removeItem('invoice-database'));
      await page.fill('#clientNameInput', `Test ${scenario.description}`);

      await page.click('#addWindowLineBtn');

      const line = page.locator('.line-card').first();
      await line.locator('input[type="number"]').first().fill('10');
      await line.locator('select').first().selectOption({ index: 2 });

      await page.waitForTimeout(500);

      // Create invoice
      await page.click('#manageInvoicesBtn');
      await page.waitForSelector('#invoiceListModal.active');
      await page.click('#createInvoiceBtn');
      await page.waitForTimeout(500);

      // Check invoice calculations
      const invoice = await page.evaluate(() => {
        const data = localStorage.getItem('invoice-database');
        return data ? JSON.parse(data)[0] : null;
      });

      expect(invoice).not.toBeNull();

      // GST calculation (allow small floating point tolerance)
      const gstDiff = Math.abs(invoice.gst - scenario.expectedGST);
      const totalDiff = Math.abs(invoice.total - scenario.expectedTotal);

      expect(gstDiff).toBeLessThan(0.01);
      expect(totalDiff).toBeLessThan(0.01);

      console.log(`  Subtotal: $${invoice.subtotal.toFixed(2)}`);
      console.log(`  GST: $${invoice.gst.toFixed(2)} (expected: $${scenario.expectedGST.toFixed(2)})`);
      console.log(`  Total: $${invoice.total.toFixed(2)} (expected: $${scenario.expectedTotal.toFixed(2)})`);
      console.log(`  ✓ ${scenario.description} - PASSED`);

      await page.click('.invoice-modal-close');
      await page.waitForTimeout(300);
    }

    console.log('✓ Test 4 PASSED: All GST calculations accurate');
  });

  /**
   * TEST 2: Record Full Payment
   * Priority: P0
   * Description: Record a payment that fully pays an invoice
   */
  test('Test 2: Record full payment and verify status change', async ({ page }) => {
    console.log('=== Test 2: Record Full Payment ===');

    // Create invoice first
    await page.fill('#clientNameInput', 'Payment Test Client');
    await page.click('#addWindowLineBtn');

    const line = page.locator('.line-card').first();
    await line.locator('input[type="number"]').first().fill('10');
    await line.locator('select').first().selectOption({ index: 2 });

    await page.waitForTimeout(500);

    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(1000);

    // Get invoice total
    const invoiceData = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    const invoiceTotal = invoiceData.total;
    console.log(`Invoice total: $${invoiceTotal.toFixed(2)}`);

    // Record payment
    const paymentBtn = page.locator('button:has-text("Record Payment")').first();
    await paymentBtn.click();
    await page.waitForSelector('#paymentModal.active');

    // Fill payment form
    await page.fill('#paymentAmount', invoiceTotal.toFixed(2));
    await page.selectOption('#paymentMethod', 'eft'); // Note: "eft" not "bank_transfer"
    await page.fill('#paymentReference', 'TEST001');
    await page.fill('#paymentNotes', 'Full payment received');

    // Submit payment
    await page.click('#paymentForm button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify payment recorded
    const updatedInvoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    console.log('Updated invoice status:', updatedInvoice.status);
    console.log('Amount paid:', updatedInvoice.amountPaid);
    console.log('Balance:', updatedInvoice.balance);

    // Assertions
    expect(updatedInvoice.payments).toBeDefined();
    expect(updatedInvoice.payments.length).toBe(1);

    const payment = updatedInvoice.payments[0];
    expect(payment.id).toMatch(/^payment_\d+$/);
    expect(payment.amount).toBe(invoiceTotal);
    expect(payment.method).toBe('eft'); // NOT "bank_transfer"
    expect(payment.reference).toBe('TEST001');
    expect(payment.notes).toBe('Full payment received');

    expect(updatedInvoice.amountPaid).toBe(invoiceTotal);
    expect(updatedInvoice.balance).toBeLessThan(0.01); // Essentially 0
    expect(updatedInvoice.status).toBe('paid');

    // Verify status history updated
    const paidStatusEntry = updatedInvoice.statusHistory.find(h => h.status === 'paid');
    expect(paidStatusEntry).toBeDefined();
    expect(paidStatusEntry.note).toBe('Fully paid');

    console.log('✓ Test 2 PASSED: Full payment recorded, status changed to paid');
  });

  /**
   * TEST 5: Partial Payments
   * Priority: P1
   * Description: Record multiple payments for one invoice
   */
  test('Test 5: Record partial payments and verify balance calculations', async ({ page }) => {
    console.log('=== Test 5: Partial Payments ===');

    // Create invoice
    await page.fill('#clientNameInput', 'Partial Payment Client');
    await page.click('#addWindowLineBtn');

    const line = page.locator('.line-card').first();
    await line.locator('input[type="number"]').first().fill('20');
    await line.locator('select').first().selectOption({ index: 2 });

    await page.waitForTimeout(500);

    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(1000);

    // Record first partial payment: $300
    let paymentBtn = page.locator('button:has-text("Record Payment")').first();
    await paymentBtn.click();
    await page.waitForSelector('#paymentModal.active');

    await page.fill('#paymentAmount', '300.00');
    await page.selectOption('#paymentMethod', 'cash');
    await page.fill('#paymentReference', 'CASH-001');
    await page.click('#paymentForm button[type="submit"]');
    await page.waitForTimeout(1000);

    // Check after first payment
    let invoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    console.log('After first payment:');
    console.log('  Amount paid: $' + invoice.amountPaid.toFixed(2));
    console.log('  Balance: $' + invoice.balance.toFixed(2));
    console.log('  Status:', invoice.status);

    expect(invoice.amountPaid).toBe(300.00);
    expect(invoice.balance).toBeCloseTo(invoice.total - 300.00, 2);
    expect(invoice.status).toBe('draft'); // Not paid yet
    expect(invoice.payments.length).toBe(1);

    // Record second payment to pay off balance
    paymentBtn = page.locator('button:has-text("Record Payment")').first();
    await paymentBtn.click();
    await page.waitForSelector('#paymentModal.active');

    const remainingBalance = invoice.balance.toFixed(2);
    await page.fill('#paymentAmount', remainingBalance);
    await page.selectOption('#paymentMethod', 'card');
    await page.fill('#paymentReference', 'CARD-002');
    await page.click('#paymentForm button[type="submit"]');
    await page.waitForTimeout(1000);

    // Check after second payment
    invoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    console.log('After second payment:');
    console.log('  Amount paid: $' + invoice.amountPaid.toFixed(2));
    console.log('  Balance: $' + invoice.balance.toFixed(2));
    console.log('  Status:', invoice.status);

    expect(invoice.amountPaid).toBeCloseTo(invoice.total, 2);
    expect(invoice.balance).toBeLessThan(0.01);
    expect(invoice.status).toBe('paid');
    expect(invoice.payments.length).toBe(2);

    console.log('✓ Test 5 PASSED: Partial payments work, balance calculated correctly');
  });

  /**
   * TEST 26: Settings Persistence
   * Priority: P0
   * Description: Verify invoice settings persist across reloads
   */
  test('Test 26: Invoice settings persist across page reload', async ({ page }) => {
    console.log('=== Test 26: Settings Persistence ===');

    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');

    await page.click('#invoiceSettingsBtn');
    await page.waitForSelector('#invoiceSettingsModal.active');

    // Change settings
    await page.fill('#invoicePrefix', 'QUOTE-');
    await page.fill('#nextInvoiceNumber', '5000');
    await page.fill('#paymentTermsDays', '14');
    await page.fill('#bankName', 'Commonwealth Bank');
    await page.fill('#accountName', '925 Pressure Glass');
    await page.fill('#bsb', '123-456');
    await page.fill('#accountNumber', '12345678');
    await page.fill('#abn', '12 345 678 901');

    // Save settings
    await page.click('#invoiceSettingsForm button[type="submit"]');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.InvoiceManager !== 'undefined');

    // Open settings again
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#invoiceSettingsBtn');
    await page.waitForSelector('#invoiceSettingsModal.active');

    // Verify all settings persisted
    expect(await page.inputValue('#invoicePrefix')).toBe('QUOTE-');
    expect(await page.inputValue('#nextInvoiceNumber')).toBe('5000');
    expect(await page.inputValue('#paymentTermsDays')).toBe('14');
    expect(await page.inputValue('#bankName')).toBe('Commonwealth Bank');
    expect(await page.inputValue('#accountName')).toBe('925 Pressure Glass');
    expect(await page.inputValue('#bsb')).toBe('123-456');
    expect(await page.inputValue('#accountNumber')).toBe('12345678');
    expect(await page.inputValue('#abn')).toBe('12 345 678 901');

    console.log('✓ Test 26 PASSED: All settings persisted across reload');

    // Close settings
    await page.click('.invoice-modal-close');
    await page.waitForTimeout(300);

    // Create invoice to verify new prefix and number
    await page.fill('#clientNameInput', 'Settings Test Client');
    await page.click('#addWindowLineBtn');

    const line = page.locator('.line-card').first();
    await line.locator('input[type="number"]').first().fill('5');
    await line.locator('select').first().selectOption({ index: 2 });

    await page.waitForTimeout(300);
    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(500);

    const invoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    expect(invoice.invoiceNumber).toBe('QUOTE-5000');

    // Check due date (should be 14 days from invoice date)
    const daysDiff = Math.round((invoice.dueDate - invoice.invoiceDate) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(14);

    console.log('✓ New invoice uses updated prefix and payment terms');
  });

  /**
   * TEST 24: LocalStorage Persistence
   * Priority: P0
   * Description: Verify invoices persist across sessions
   */
  test('Test 24: Invoices persist in LocalStorage across reload', async ({ page }) => {
    console.log('=== Test 24: LocalStorage Persistence ===');

    // Create multiple invoices
    const createInvoice = async (clientName, amount) => {
      await page.fill('#clientNameInput', clientName);

      // Clear previous lines if any
      const existingLines = await page.locator('.line-card').count();
      if (existingLines === 0) {
        await page.click('#addWindowLineBtn');
      }

      const line = page.locator('.line-card').first();
      await line.locator('input[type="number"]').first().fill('5');
      await line.locator('select').first().selectOption({ index: 2 });

      await page.waitForTimeout(300);

      await page.click('#manageInvoicesBtn');
      await page.waitForSelector('#invoiceListModal.active');
      await page.click('#createInvoiceBtn');
      await page.waitForTimeout(500);
      await page.click('.invoice-modal-close');
      await page.waitForTimeout(300);
    };

    await createInvoice('Client A', '100');
    await createInvoice('Client B', '200');
    await createInvoice('Client C', '300');

    // Get invoice data before reload
    const invoicesBefore = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoicesBefore.length).toBe(3);
    console.log('Created 3 invoices before reload');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.InvoiceManager !== 'undefined');

    // Get invoice data after reload
    const invoicesAfter = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoicesAfter.length).toBe(3);

    // Verify all data intact
    for (let i = 0; i < 3; i++) {
      expect(invoicesAfter[i].id).toBe(invoicesBefore[i].id);
      expect(invoicesAfter[i].invoiceNumber).toBe(invoicesBefore[i].invoiceNumber);
      expect(invoicesAfter[i].clientName).toBe(invoicesBefore[i].clientName);
      expect(invoicesAfter[i].total).toBe(invoicesBefore[i].total);
      expect(invoicesAfter[i].status).toBe(invoicesBefore[i].status);
    }

    console.log('✓ Test 24 PASSED: All invoices persisted correctly across reload');
  });

  /**
   * TEST 30: Require Line Items (Validation)
   * Priority: P0
   * Description: Cannot create invoice without line items
   */
  test('Test 30: Cannot create invoice without line items', async ({ page }) => {
    console.log('=== Test 30: Require Line Items ===');

    // Try to create invoice with only client name, no line items
    await page.fill('#clientNameInput', 'No Items Client');

    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(1000);

    // Check for error (should not create invoice)
    const invoices = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    expect(invoices.length).toBe(0);
    console.log('✓ Invoice not created (no line items) - CORRECT');

    // Check for error message in console or UI
    // Note: Current implementation shows error via ErrorHandler.showError()
    // We can't easily test toast messages in Playwright, but we verified no invoice created

    console.log('✓ Test 30 PASSED: Validation prevents empty invoices');
  });

});

/**
 * Known Issues Tests (Document Bugs)
 */
test.describe('Invoice System - Known Issues (Bug Documentation)', () => {

  test.beforeEach(async ({ page }) => {
    await initializeApp(page);

    await page.evaluate(() => {
      localStorage.removeItem('invoice-database');
      localStorage.removeItem('invoice-settings');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for APP to initialize again after reload
    await page.evaluate(async () => {
      if (window.APP && typeof window.APP.waitForInit === 'function') {
        await window.APP.waitForInit();
      }
    });

    await page.waitForFunction(() => {
      return typeof window.InvoiceManager !== 'undefined' && typeof window.APP !== 'undefined';
    }, { timeout: 10000 });
  });

  /**
   * BUG #1: Paid Invoices Can Be Edited
   * Severity: CRITICAL
   * This test DOCUMENTS the bug, does not fix it
   */
  test('BUG #1: Paid invoices can be edited (data integrity risk)', async ({ page }) => {
    console.log('=== BUG #1: Testing Paid Invoice Editing ===');

    // Create and pay invoice
    await page.fill('#clientNameInput', 'Paid Invoice Client');
    await page.click('#addWindowLineBtn');

    const line = page.locator('.line-card').first();
    await line.locator('input[type="number"]').first().fill('10');
    await line.locator('select').first().selectOption({ index: 2 });

    await page.waitForTimeout(500);

    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#createInvoiceBtn');
    await page.waitForTimeout(1000);

    // Record full payment
    const paymentBtn = page.locator('button:has-text("Record Payment")').first();
    await paymentBtn.click();
    await page.waitForSelector('#paymentModal.active');

    const invoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    await page.fill('#paymentAmount', invoice.total.toFixed(2));
    await page.selectOption('#paymentMethod', 'cash');
    await page.click('#paymentForm button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify invoice is paid
    let paidInvoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    expect(paidInvoice.status).toBe('paid');
    expect(paidInvoice.balance).toBeLessThan(0.01);
    const originalTotal = paidInvoice.total;
    const originalPaid = paidInvoice.amountPaid;

    console.log('Original invoice: total=$' + originalTotal + ', paid=$' + originalPaid + ', status=' + paidInvoice.status);

    // Now try to edit the paid invoice
    const editBtn = page.locator('button:has-text("Edit")').first();
    await editBtn.click();
    await page.waitForSelector('#editInvoiceModal.active');

    // Change the total (this SHOULD be prevented but isn't - BUG)
    await page.fill('#editSubtotal', '50.00'); // Change from $500 to $50
    await page.waitForTimeout(300); // Wait for GST auto-calc

    await page.click('#editInvoiceForm button[type="submit"]');
    await page.waitForTimeout(1000);

    // Check if edit was allowed (BUG)
    const editedInvoice = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data)[0] : null;
    });

    console.log('After edit: total=$' + editedInvoice.total + ', paid=$' + editedInvoice.amountPaid + ', balance=$' + editedInvoice.balance);

    // BUG CONFIRMED: Edit was allowed
    expect(editedInvoice.total).not.toBe(originalTotal);
    expect(editedInvoice.total).toBeCloseTo(55.00, 2); // $50 + $5 GST
    expect(editedInvoice.amountPaid).toBe(originalPaid); // Still shows full original payment
    expect(editedInvoice.balance).toBeLessThan(0); // Negative balance (overpaid)

    console.log('🐛 BUG CONFIRMED: Paid invoice was editable, created negative balance');
    console.log('   This is a CRITICAL data integrity issue');
  });

  /**
   * BUG #2: Duplicate Invoice Numbers via Settings
   * Severity: CRITICAL
   */
  test('BUG #2: Duplicate invoice numbers via settings manipulation', async ({ page }) => {
    console.log('=== BUG #2: Testing Invoice Number Duplication ===');

    // Create 3 invoices
    const createInvoice = async (clientName) => {
      await page.fill('#clientNameInput', clientName);
      const lineCount = await page.locator('.line-card').count();
      if (lineCount === 0) {
        await page.click('#addWindowLineBtn');
      }
      const line = page.locator('.line-card').first();
      await line.locator('input[type="number"]').first().fill('5');
      await line.locator('select').first().selectOption({ index: 2 });
      await page.waitForTimeout(300);
      await page.click('#manageInvoicesBtn');
      await page.waitForSelector('#invoiceListModal.active');
      await page.click('#createInvoiceBtn');
      await page.waitForTimeout(500);
      await page.click('.invoice-modal-close');
      await page.waitForTimeout(300);
    };

    await createInvoice('Invoice 1'); // INV-1001
    await createInvoice('Invoice 2'); // INV-1002
    await createInvoice('Invoice 3'); // INV-1003

    // Verify invoices created
    let invoices = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    console.log('Created invoices:', invoices.map(i => i.invoiceNumber).reverse());
    expect(invoices[0].invoiceNumber).toBe('INV-1003');
    expect(invoices[1].invoiceNumber).toBe('INV-1002');
    expect(invoices[2].invoiceNumber).toBe('INV-1001');

    // Now manipulate settings to decrease counter (BUG)
    await page.click('#manageInvoicesBtn');
    await page.waitForSelector('#invoiceListModal.active');
    await page.click('#invoiceSettingsBtn');
    await page.waitForSelector('#invoiceSettingsModal.active');

    // Change nextInvoiceNumber from 1004 back to 1002
    await page.fill('#nextInvoiceNumber', '1002');
    await page.click('#invoiceSettingsForm button[type="submit"]');
    await page.waitForTimeout(500);

    console.log('Changed nextInvoiceNumber from 1004 to 1002');

    // Create another invoice
    await createInvoice('Invoice 4'); // Will be INV-1002 (DUPLICATE!)

    // Check for duplicate
    invoices = await page.evaluate(() => {
      const data = localStorage.getItem('invoice-database');
      return data ? JSON.parse(data) : [];
    });

    const invoiceNumbers = invoices.map(i => i.invoiceNumber);
    console.log('All invoice numbers:', invoiceNumbers);

    // Count occurrences of INV-1002
    const duplicates = invoiceNumbers.filter(n => n === 'INV-1002');

    console.log('🐛 BUG CONFIRMED: Duplicate invoice number INV-1002 exists ' + duplicates.length + ' times');
    expect(duplicates.length).toBe(2); // BUG: Two invoices with same number

    console.log('   This is a CRITICAL accounting compliance issue');
  });

});
