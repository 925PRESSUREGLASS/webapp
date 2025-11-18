// quote-invoice-workflow.spec.js - Complete workflow testing
// Tests the entire quote → job → invoice workflow

const { test, expect } = require('@playwright/test');

test.describe('Quote to Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app to be ready
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);

    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      if (window.APP && window.APP.resetState) {
        window.APP.resetState();
      }
    });

    // Reload to get fresh state
    await page.reload();
    await page.waitForSelector('.app');
  });

  test('should create a complete quote with window and pressure lines', async ({ page }) => {
    // Fill in quote details
    await page.fill('#quoteTitleInput', 'Test Quote #1');
    await page.fill('#clientNameInput', 'John Doe');
    await page.fill('#clientLocationInput', '123 Main St, Perth WA');
    await page.selectOption('#jobTypeSelect', 'residential');

    // Add hourly rate
    await page.fill('#hourlyRateInput', '95');

    // Add a window line
    await page.click('#addWindowLineBtn');

    // Wait for window line to appear
    await page.waitForSelector('.window-line');

    // Fill in window line details
    await page.selectOption('.window-type-select', 'standard');
    await page.fill('.window-quantity-input', '10');
    await page.check('.window-inside-checkbox');
    await page.check('.window-outside-checkbox');

    // Add a pressure line
    await page.click('#addPressureLineBtn');

    // Wait for pressure line to appear
    await page.waitForSelector('.pressure-line');

    // Fill in pressure line details
    await page.selectOption('.pressure-surface-select', 'concrete');
    await page.fill('.pressure-area-input', '50');

    // Check that totals are calculated
    const totalText = await page.textContent('#totalIncGstDisplay');
    expect(totalText).toContain('$');

    // Verify quote is autosaved
    const savedState = await page.evaluate(() => {
      return window.APP.getState();
    });

    expect(savedState.quoteTitle).toBe('Test Quote #1');
    expect(savedState.clientName).toBe('John Doe');
    expect(savedState.windowLines.length).toBe(1);
    expect(savedState.pressureLines.length).toBe(1);
  });

  test('should update quote status from draft to sent', async ({ page }) => {
    // Create a basic quote first
    await page.fill('#quoteTitleInput', 'Status Test Quote');
    await page.fill('#clientNameInput', 'Jane Smith');
    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.window-line');
    await page.selectOption('.window-type-select', 'standard');
    await page.fill('.window-quantity-input', '5');

    // Wait for autosave
    await page.waitForTimeout(1000);

    // Click on status badge
    const statusBadge = await page.$('#quoteStatusBadge');
    if (statusBadge) {
      await statusBadge.click();

      // Wait for status modal
      await page.waitForSelector('.status-modal');

      // Click on "Sent" status
      await page.click('[data-status="sent"]');

      // Wait for modal to close
      await page.waitForTimeout(500);

      // Verify status changed
      const currentStatus = await page.evaluate(() => {
        return window.QuoteWorkflow ? window.QuoteWorkflow.getCurrentStatus() : null;
      });

      expect(currentStatus).toBe('sent');
    }
  });

  test('should convert quote to invoice successfully', async ({ page }) => {
    // Create a complete quote
    await page.fill('#quoteTitleInput', 'Invoice Conversion Test');
    await page.fill('#clientNameInput', 'Bob Johnson');
    await page.fill('#clientLocationInput', '456 Oak Ave, Perth WA');
    await page.fill('#hourlyRateInput', '100');

    // Add window line
    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.window-line');
    await page.selectOption('.window-type-select', 'sliding');
    await page.fill('.window-quantity-input', '8');
    await page.check('.window-inside-checkbox');
    await page.check('.window-outside-checkbox');

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Get total before conversion
    const totalBefore = await page.textContent('#totalIncGstDisplay');
    const totalValue = parseFloat(totalBefore.replace(/[$,]/g, ''));

    expect(totalValue).toBeGreaterThan(0);

    // Open invoice modal
    const invoiceBtn = await page.$('#invoiceBtn, button:has-text("Invoice")');
    if (invoiceBtn) {
      await invoiceBtn.click();

      // Wait for invoice modal
      await page.waitForSelector('#invoiceListModal, .modal');

      // Click create invoice button
      await page.click('#createInvoiceBtn, button:has-text("Create Invoice")');

      // Wait for success message
      await page.waitForTimeout(1000);

      // Verify invoice was created
      const invoiceCreated = await page.evaluate(() => {
        if (window.InvoiceSystem && window.InvoiceSystem.getAll) {
          const invoices = window.InvoiceSystem.getAll();
          return invoices.length > 0;
        }
        return false;
      });

      expect(invoiceCreated).toBe(true);

      // Verify invoice details
      const invoice = await page.evaluate(() => {
        const invoices = window.InvoiceSystem.getAll();
        return invoices[0];
      });

      expect(invoice.clientName).toBe('Bob Johnson');
      expect(invoice.quoteTitle).toBe('Invoice Conversion Test');
      expect(invoice.windowLines.length).toBe(1);
      expect(invoice.status).toBe('draft');
      expect(invoice.total).toBeCloseTo(totalValue, 2);
    }
  });

  test('should track invoice status changes', async ({ page }) => {
    // Create invoice first
    await page.fill('#quoteTitleInput', 'Status Tracking Test');
    await page.fill('#clientNameInput', 'Alice Williams');
    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.window-line');
    await page.selectOption('.window-type-select', 'standard');
    await page.fill('.window-quantity-input', '3');

    await page.waitForTimeout(1000);

    // Create invoice
    const invoiceBtn = await page.$('#invoiceBtn, button:has-text("Invoice")');
    if (invoiceBtn) {
      await invoiceBtn.click();
      await page.waitForSelector('.modal');
      await page.click('#createInvoiceBtn, button:has-text("Create Invoice")');
      await page.waitForTimeout(1000);

      // Get invoice ID
      const invoiceId = await page.evaluate(() => {
        const invoices = window.InvoiceSystem.getAll();
        return invoices[0] ? invoices[0].id : null;
      });

      if (invoiceId) {
        // Change status to sent
        await page.evaluate((id) => {
          window.InvoiceSystem.updateStatus(id, 'sent');
        }, invoiceId);

        // Verify status changed
        const invoice1 = await page.evaluate((id) => {
          return window.InvoiceSystem.get(id);
        }, invoiceId);

        expect(invoice1.status).toBe('sent');
        expect(invoice1.statusHistory.length).toBeGreaterThan(1);

        // Change to paid
        await page.evaluate((id) => {
          window.InvoiceSystem.updateStatus(id, 'paid');
        }, invoiceId);

        const invoice2 = await page.evaluate((id) => {
          return window.InvoiceSystem.get(id);
        }, invoiceId);

        expect(invoice2.status).toBe('paid');
      }
    }
  });

  test('should record payment on invoice', async ({ page }) => {
    // Create invoice
    await page.fill('#quoteTitleInput', 'Payment Test');
    await page.fill('#clientNameInput', 'Charlie Brown');
    await page.fill('#hourlyRateInput', '95');
    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.window-line');
    await page.selectOption('.window-type-select', 'standard');
    await page.fill('.window-quantity-input', '5');

    await page.waitForTimeout(1000);

    // Create invoice
    const invoiceBtn = await page.$('#invoiceBtn, button:has-text("Invoice")');
    if (invoiceBtn) {
      await invoiceBtn.click();
      await page.waitForSelector('.modal');
      await page.click('#createInvoiceBtn, button:has-text("Create Invoice")');
      await page.waitForTimeout(1000);

      // Get invoice
      const invoiceData = await page.evaluate(() => {
        const invoices = window.InvoiceSystem.getAll();
        return invoices[0];
      });

      if (invoiceData) {
        const paymentAmount = invoiceData.total / 2; // Pay half

        // Record payment
        const paymentRecorded = await page.evaluate((data) => {
          return window.InvoiceSystem.recordPayment(data.id, {
            amount: data.amount,
            method: 'bank-transfer',
            date: Date.now(),
            reference: 'TEST-PAYMENT-001'
          });
        }, { id: invoiceData.id, amount: paymentAmount });

        expect(paymentRecorded).toBe(true);

        // Verify payment
        const updatedInvoice = await page.evaluate((id) => {
          return window.InvoiceSystem.get(id);
        }, invoiceData.id);

        expect(updatedInvoice.payments.length).toBe(1);
        expect(updatedInvoice.amountPaid).toBeCloseTo(paymentAmount, 2);
        expect(updatedInvoice.balance).toBeCloseTo(invoiceData.total - paymentAmount, 2);

        // Record second payment (full payment)
        await page.evaluate((data) => {
          window.InvoiceSystem.recordPayment(data.id, {
            amount: data.balance,
            method: 'cash',
            date: Date.now(),
            reference: 'TEST-PAYMENT-002'
          });
        }, { id: invoiceData.id, balance: updatedInvoice.balance });

        // Verify fully paid
        const paidInvoice = await page.evaluate((id) => {
          return window.InvoiceSystem.get(id);
        }, invoiceData.id);

        expect(paidInvoice.payments.length).toBe(2);
        expect(paidInvoice.balance).toBeCloseTo(0, 2);
        expect(paidInvoice.status).toBe('paid');
      }
    }
  });

  test('should handle quote with default values when converting to invoice', async ({ page }) => {
    // Leave some fields blank to test defaults
    // Don't fill clientName - should get default
    // Don't fill quoteTitle - should get default

    await page.fill('#hourlyRateInput', '95');
    await page.click('#addWindowLineBtn');
    await page.waitForSelector('.window-line');
    await page.selectOption('.window-type-select', 'standard');
    await page.fill('.window-quantity-input', '2');

    await page.waitForTimeout(1000);

    // Create invoice
    const invoiceBtn = await page.$('#invoiceBtn, button:has-text("Invoice")');
    if (invoiceBtn) {
      await invoiceBtn.click();
      await page.waitForSelector('.modal');
      await page.click('#createInvoiceBtn, button:has-text("Create Invoice")');
      await page.waitForTimeout(1000);

      // Verify invoice has default values
      const invoice = await page.evaluate(() => {
        const invoices = window.InvoiceSystem.getAll();
        return invoices[0];
      });

      // Should have generated default customer name and quote title
      expect(invoice.clientName).toMatch(/customer_\d+/);
      expect(invoice.quoteTitle).toMatch(/Quote_\d+/);
      expect(invoice.windowLines.length).toBe(1);
    }
  });

  test('should prevent creating invoice without line items', async ({ page }) => {
    // Try to create invoice with no line items
    await page.fill('#quoteTitleInput', 'Empty Quote');
    await page.fill('#clientNameInput', 'Test User');

    // No window or pressure lines added

    const invoiceBtn = await page.$('#invoiceBtn, button:has-text("Invoice")');
    if (invoiceBtn) {
      await invoiceBtn.click();
      await page.waitForSelector('.modal');

      // Try to create invoice
      await page.click('#createInvoiceBtn, button:has-text("Create Invoice")');

      // Should show error
      await page.waitForTimeout(500);

      // Verify no invoice was created
      const invoiceCount = await page.evaluate(() => {
        if (window.InvoiceSystem && window.InvoiceSystem.getAll) {
          return window.InvoiceSystem.getAll().length;
        }
        return 0;
      });

      expect(invoiceCount).toBe(0);
    }
  });
});
