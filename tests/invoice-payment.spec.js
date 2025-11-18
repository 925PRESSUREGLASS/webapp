// tests/invoice-payment.spec.js - Tests for Invoice and Payment System
const { test, expect } = require('@playwright/test');

test.describe('Invoice and Payment System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app to initialize
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);

    // Clear any existing invoices
    await page.evaluate(() => {
      localStorage.removeItem('tts_invoices');
      localStorage.removeItem('tts_receipts');
    });
  });

  test.describe('Payment Configuration', () => {
    test('should load payment configuration', async ({ page }) => {
      const config = await page.evaluate(() => {
        return window.PaymentConfig.getConfig();
      });

      expect(config).toBeDefined();
      expect(config.defaultGateway).toBeDefined();
      expect(config.invoice).toBeDefined();
      expect(config.options).toBeDefined();
    });

    test('should calculate deposit amount correctly', async ({ page }) => {
      const depositAmount = await page.evaluate(() => {
        return window.PaymentConfig.calculateDepositAmount(1000);
      });

      // Default is 20% of $1000 = $200
      expect(depositAmount).toBe(200);
    });

    test('should generate sequential invoice numbers', async ({ page }) => {
      const numbers = await page.evaluate(() => {
        return [
          window.PaymentConfig.getNextInvoiceNumber(),
          window.PaymentConfig.getNextInvoiceNumber(),
          window.PaymentConfig.getNextInvoiceNumber()
        ];
      });

      expect(numbers[0]).toMatch(/^INV-\d{4}$/);
      expect(numbers[1]).toMatch(/^INV-\d{4}$/);
      expect(numbers[2]).toMatch(/^INV-\d{4}$/);

      // Should be sequential
      const num1 = parseInt(numbers[0].split('-')[1]);
      const num2 = parseInt(numbers[1].split('-')[1]);
      const num3 = parseInt(numbers[2].split('-')[1]);

      expect(num2).toBe(num1 + 1);
      expect(num3).toBe(num2 + 1);
    });
  });

  test.describe('Invoice Management', () => {
    test('should create invoice from quote data', async ({ page }) => {
      const invoice = await page.evaluate(() => {
        var quote = {
          id: 'quote_123',
          total: 550,
          subtotal: 500,
          gst: 50,
          items: [
            { description: 'Window Cleaning', quantity: 10, unitPrice: 50, total: 500 }
          ],
          client: {
            name: 'John Smith',
            email: 'john@example.com',
            phone: '0400000000',
            address: '123 Test St, Perth WA'
          }
        };

        return window.InvoiceManager.createFromQuote(quote, 'full');
      });

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(invoice.total).toBe(550);
      expect(invoice.subtotal).toBe(500);
      expect(invoice.gst).toBe(50);
      expect(invoice.client.name).toBe('John Smith');
      expect(invoice.status).toBe('draft');
      expect(invoice.amountDue).toBe(550);
      expect(invoice.amountPaid).toBe(0);
    });

    test('should create deposit invoice with correct amount', async ({ page }) => {
      const invoice = await page.evaluate(() => {
        var quote = {
          id: 'quote_123',
          total: 1000,
          client: {
            name: 'John Smith',
            email: 'john@example.com'
          }
        };

        return window.InvoiceManager.createFromQuote(quote, 'deposit');
      });

      // 20% of $1000 = $200
      expect(invoice.total).toBe(200);
      expect(invoice.type).toBe('deposit');
    });

    test('should save and retrieve invoice', async ({ page }) => {
      const saved = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          subtotal: 454.55,
          gst: 45.45,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        var retrieved = window.InvoiceManager.getInvoice(invoice.id);
        return {
          original: invoice.invoiceNumber,
          retrieved: retrieved.invoiceNumber,
          match: invoice.id === retrieved.id
        };
      });

      expect(saved.match).toBe(true);
      expect(saved.original).toBe(saved.retrieved);
    });

    test('should get all invoices', async ({ page }) => {
      const invoices = await page.evaluate(() => {
        // Create 3 test invoices
        for (var i = 0; i < 3; i++) {
          var invoice = window.InvoiceManager.createInvoice({
            total: 100 * (i + 1),
            client: { name: 'Client ' + (i + 1) }
          });
          window.InvoiceManager.saveInvoice(invoice);
        }

        return window.InvoiceManager.getAllInvoices();
      });

      expect(invoices).toHaveLength(3);
    });

    test('should update invoice status', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        window.InvoiceManager.updateStatus(invoice.id, 'sent');

        var updated = window.InvoiceManager.getInvoice(invoice.id);
        return updated.status;
      });

      expect(result).toBe('sent');
    });

    test('should set dateIssued when status changed to sent', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        window.InvoiceManager.updateStatus(invoice.id, 'sent');

        var updated = window.InvoiceManager.getInvoice(invoice.id);
        return {
          status: updated.status,
          hasDateIssued: !!updated.dateIssued
        };
      });

      expect(result.status).toBe('sent');
      expect(result.hasDateIssued).toBe(true);
    });
  });

  test.describe('Payment Recording', () => {
    test('should record full payment', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          subtotal: 454.55,
          gst: 45.45,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        window.InvoiceManager.recordPayment(invoice.id, {
          amount: 500,
          method: 'card',
          reference: 'TEST123'
        });

        var updated = window.InvoiceManager.getInvoice(invoice.id);
        return {
          amountPaid: updated.amountPaid,
          amountDue: updated.amountDue,
          status: updated.status,
          paymentCount: updated.payments.length
        };
      });

      expect(result.amountPaid).toBe(500);
      expect(result.amountDue).toBe(0);
      expect(result.status).toBe('paid');
      expect(result.paymentCount).toBe(1);
    });

    test('should record partial payment', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 1000,
          subtotal: 909.09,
          gst: 90.91,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        window.InvoiceManager.recordPayment(invoice.id, {
          amount: 500,
          method: 'card'
        });

        var updated = window.InvoiceManager.getInvoice(invoice.id);
        return {
          amountPaid: updated.amountPaid,
          amountDue: updated.amountDue,
          status: updated.status
        };
      });

      expect(result.amountPaid).toBe(500);
      expect(result.amountDue).toBe(500);
      expect(result.status).toBe('partially-paid');
    });

    test('should record multiple payments', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 1000,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        // Record 3 payments
        window.InvoiceManager.recordPayment(invoice.id, { amount: 300, method: 'card' });
        window.InvoiceManager.recordPayment(invoice.id, { amount: 300, method: 'bank' });
        window.InvoiceManager.recordPayment(invoice.id, { amount: 400, method: 'cash' });

        var updated = window.InvoiceManager.getInvoice(invoice.id);
        return {
          amountPaid: updated.amountPaid,
          amountDue: updated.amountDue,
          status: updated.status,
          paymentCount: updated.payments.length
        };
      });

      expect(result.amountPaid).toBe(1000);
      expect(result.amountDue).toBe(0);
      expect(result.status).toBe('paid');
      expect(result.paymentCount).toBe(3);
    });

    test('should generate receipt when payment recorded', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        window.InvoiceManager.recordPayment(invoice.id, {
          amount: 500,
          method: 'card'
        });

        var receipts = window.InvoiceManager.getReceipts();
        return {
          count: receipts.length,
          hasReceiptNumber: receipts.length > 0 && !!receipts[0].receiptNumber
        };
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.hasReceiptNumber).toBe(true);
    });
  });

  test.describe('Payment Summary', () => {
    test('should calculate payment summary correctly', async ({ page }) => {
      const summary = await page.evaluate(() => {
        // Create invoices with various statuses
        var inv1 = window.InvoiceManager.createInvoice({
          total: 1000,
          client: { name: 'Client 1' }
        });
        window.InvoiceManager.saveInvoice(inv1);
        window.InvoiceManager.updateStatus(inv1.id, 'sent');

        var inv2 = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Client 2' }
        });
        window.InvoiceManager.saveInvoice(inv2);
        window.InvoiceManager.recordPayment(inv2.id, { amount: 500, method: 'card' });

        var inv3 = window.InvoiceManager.createInvoice({
          total: 800,
          client: { name: 'Client 3' }
        });
        window.InvoiceManager.saveInvoice(inv3);
        window.InvoiceManager.recordPayment(inv3.id, { amount: 400, method: 'card' });

        return window.InvoiceManager.getPaymentSummary();
      });

      expect(summary.totalInvoiced).toBe(2300); // 1000 + 500 + 800
      expect(summary.totalPaid).toBe(900); // 500 + 400
      expect(summary.totalOutstanding).toBe(1400); // 1000 + 400
      expect(summary.paidCount).toBe(1); // Only inv2 is fully paid
    });
  });

  test.describe('Invoice Filtering and Search', () => {
    test('should filter invoices by status', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Create invoices with different statuses
        var inv1 = window.InvoiceManager.createInvoice({ total: 500, client: { name: 'C1' } });
        window.InvoiceManager.saveInvoice(inv1);

        var inv2 = window.InvoiceManager.createInvoice({ total: 500, client: { name: 'C2' } });
        window.InvoiceManager.saveInvoice(inv2);
        window.InvoiceManager.updateStatus(inv2.id, 'sent');

        var inv3 = window.InvoiceManager.createInvoice({ total: 500, client: { name: 'C3' } });
        window.InvoiceManager.saveInvoice(inv3);
        window.InvoiceManager.recordPayment(inv3.id, { amount: 500, method: 'card' });

        var draftInvoices = window.InvoiceManager.filterByStatus('draft');
        var sentInvoices = window.InvoiceManager.filterByStatus('sent');
        var paidInvoices = window.InvoiceManager.filterByStatus('paid');

        return {
          draft: draftInvoices.length,
          sent: sentInvoices.length,
          paid: paidInvoices.length
        };
      });

      expect(result.draft).toBe(1);
      expect(result.sent).toBe(1);
      expect(result.paid).toBe(1);
    });

    test('should search invoices by client name', async ({ page }) => {
      const result = await page.evaluate(() => {
        var inv1 = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'John Smith' }
        });
        window.InvoiceManager.saveInvoice(inv1);

        var inv2 = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Jane Doe' }
        });
        window.InvoiceManager.saveInvoice(inv2);

        var results = window.InvoiceManager.searchInvoices('john');
        return results.length;
      });

      expect(result).toBe(1);
    });
  });

  test.describe('PDF Generation', () => {
    test('should have PDF generator available', async ({ page }) => {
      const available = await page.evaluate(() => {
        return typeof window.InvoicePDFGenerator !== 'undefined';
      });

      expect(available).toBe(true);
    });

    test('should generate invoice PDF if jsPDF available', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Check if jsPDF is loaded
        if (typeof jsPDF === 'undefined') {
          return { skipped: true };
        }

        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          subtotal: 454.55,
          gst: 45.45,
          items: [
            { description: 'Window Cleaning', quantity: 10, unitPrice: 50, total: 500 }
          ],
          client: {
            name: 'John Smith',
            email: 'john@example.com',
            address: '123 Test St, Perth WA'
          }
        });

        var pdf = window.InvoicePDFGenerator.generateInvoicePDF(invoice);

        return {
          skipped: false,
          generated: !!pdf
        };
      });

      if (!result.skipped) {
        expect(result.generated).toBe(true);
      }
    });
  });

  test.describe('Payment Gateway', () => {
    test('should process manual payment', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        var payment = window.PaymentGateway.processManualPayment(invoice.id, {
          amount: 500,
          method: 'cash',
          reference: 'CASH-001'
        });

        var updated = window.InvoiceManager.getInvoice(invoice.id);

        return {
          paymentRecorded: !!payment,
          status: updated.status,
          amountPaid: updated.amountPaid
        };
      });

      expect(result.paymentRecorded).toBe(true);
      expect(result.status).toBe('paid');
      expect(result.amountPaid).toBe(500);
    });

    test('should validate payment amount', async ({ page }) => {
      const result = await page.evaluate(() => {
        var invoice = window.InvoiceManager.createInvoice({
          total: 500,
          client: { name: 'Test Client' }
        });

        window.InvoiceManager.saveInvoice(invoice);

        var error = null;
        try {
          window.PaymentGateway.processManualPayment(invoice.id, {
            amount: 0,
            method: 'cash'
          }, function(err) {
            error = err;
          });
        } catch (e) {
          error = e;
        }

        return { hasError: !!error };
      });

      expect(result.hasError).toBe(true);
    });
  });
});
