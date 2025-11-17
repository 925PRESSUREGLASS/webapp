/**
 * Example: Invoice Tests using Fixtures
 *
 * This demonstrates invoice management tests with fixtures.
 */

const { test, expect } = require('../fixtures/test-base');
require('../fixtures/matchers');
const { createInvoice, createPayment, createLineItem, createQuote, createWindowLine } = require('../fixtures/factories');
const { STANDARD_4X2_HOUSE } = require('../fixtures/test-data');

test.describe('Invoice System', () => {
  test('creates valid invoice with factory', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      lineItems: [
        createLineItem({ description: 'Window Cleaning', quantity: 8, unitPrice: 25.00 }),
        createLineItem({ description: 'Pressure Cleaning', quantity: 1, unitPrice: 150.00 })
      ]
    });

    // Validate invoice structure
    expect(invoice).toBeValidInvoice();
    expect(invoice.lineItems).toHaveLength(2);
    expect(invoice.status).toBe('draft');
  });

  test('creates invoice from quote', async ({ appReady, helpers }) => {
    const quote = STANDARD_4X2_HOUSE();
    const invoice = await helpers.createInvoiceFromQuote(quote);

    expect(invoice).toBeValidInvoice();
    expect(invoice.clientName).toBe(quote.jobSettings.clientName);
    expect(invoice.total).toBeGreaterThan(0);
  });

  test('saves and retrieves invoice', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      lineItems: [
        createLineItem({ description: 'Test Service', unitPrice: 100 })
      ]
    });

    // Save invoice
    const invoiceId = await helpers.saveInvoice(invoice);
    expect(invoiceId).toBeTruthy();

    // Retrieve invoice
    const retrieved = await helpers.getInvoice(invoiceId);
    expect(retrieved).toBeTruthy();
    expect(retrieved.invoiceId).toBe(invoiceId);
    expect(retrieved).toBeValidInvoice();
  });

  test('adds payment to invoice', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      total: 550.00,
      lineItems: [
        createLineItem({ description: 'Service', quantity: 5, unitPrice: 100 })
      ]
    });

    const invoiceId = await helpers.saveInvoice(invoice);

    // Add payment
    const payment = createPayment({ amount: 250.00, method: 'cash' });
    const updated = await helpers.addPayment(invoiceId, payment);

    // Verify payment was applied
    expect(updated).toHavePaymentApplied(250.00);
    expect(updated.amountDue).toBeCloseTo(300.00, 2);
  });

  test('marks invoice as paid when full payment received', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      total: 550.00,
      lineItems: [
        createLineItem({ description: 'Service', quantity: 5, unitPrice: 100 })
      ]
    });

    const invoiceId = await helpers.saveInvoice(invoice);

    // Add full payment
    const payment = createPayment({ amount: 550.00 });
    const updated = await helpers.addPayment(invoiceId, payment);

    expect(updated).toHavePaymentApplied(550.00);
    expect(updated.amountDue).toBeCloseTo(0, 2);
    expect(updated).toHaveStatus('paid');
  });

  test('handles partial payments', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      total: 1000.00,
      lineItems: [
        createLineItem({ description: 'Service', quantity: 10, unitPrice: 90.91 })
      ]
    });

    const invoiceId = await helpers.saveInvoice(invoice);

    // First partial payment
    await helpers.addPayment(invoiceId, createPayment({ amount: 300.00 }));
    let updated = await helpers.getInvoice(invoiceId);
    expect(updated).toHavePaymentApplied(300.00);
    expect(updated.amountDue).toBeCloseTo(700.00, 2);

    // Second partial payment
    await helpers.addPayment(invoiceId, createPayment({ amount: 400.00 }));
    updated = await helpers.getInvoice(invoiceId);
    expect(updated).toHavePaymentApplied(700.00);
    expect(updated.amountDue).toBeCloseTo(300.00, 2);

    // Final payment
    await helpers.addPayment(invoiceId, createPayment({ amount: 300.00 }));
    updated = await helpers.getInvoice(invoiceId);
    expect(updated).toHavePaymentApplied(1000.00);
    expect(updated.amountDue).toBeCloseTo(0, 2);
    expect(updated).toHaveStatus('paid');
  });

  test('handles multiple payment methods', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      total: 500.00,
      lineItems: [createLineItem({ unitPrice: 454.55 })]
    });

    const invoiceId = await helpers.saveInvoice(invoice);

    // Cash payment
    await helpers.addPayment(invoiceId, createPayment({
      amount: 200.00,
      method: 'cash'
    }));

    // Bank transfer
    await helpers.addPayment(invoiceId, createPayment({
      amount: 300.00,
      method: 'bank_transfer',
      reference: 'TRX123456'
    }));

    const updated = await helpers.getInvoice(invoiceId);
    expect(updated.payments).toHaveLength(2);
    expect(updated).toHavePaymentApplied(500.00);
  });

  test('retrieves all invoices', async ({ appReady, helpers }) => {
    // Create multiple invoices
    const inv1 = createInvoice({ lineItems: [createLineItem()] });
    const inv2 = createInvoice({ lineItems: [createLineItem()] });

    await helpers.saveInvoice(inv1);
    await helpers.saveInvoice(inv2);

    // Get all invoices
    const allInvoices = await helpers.getAllInvoices();

    expect(Object.keys(allInvoices).length).toBeGreaterThanOrEqual(2);
    expect(allInvoices[inv1.invoiceId]).toBeTruthy();
    expect(allInvoices[inv2.invoiceId]).toBeTruthy();
  });

  test('invoice GST calculation is accurate', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      lineItems: [
        createLineItem({ quantity: 5, unitPrice: 100.00 }) // 500.00 subtotal
      ]
    });

    expect(invoice.subtotal).toBe(500.00);
    expect(invoice.gst).toBe(50.00);
    expect(invoice.total).toBe(550.00);
    expect(invoice).toHaveValidGST();
  });

  test('creates invoice with custom terms', async ({ appReady, helpers }) => {
    const invoice = createInvoice({
      terms: 'Payment due within 14 days',
      lineItems: [createLineItem()]
    });

    expect(invoice.terms).toBe('Payment due within 14 days');
    expect(invoice).toBeValidInvoice();
  });
});
