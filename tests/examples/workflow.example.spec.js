/**
 * Example: Workflow Tests using Fixtures
 *
 * This demonstrates end-to-end workflow tests with fixtures.
 */

const { test, expect } = require('../fixtures/test-base');
require('../fixtures/matchers');
const { createQuote, createWindowLine, createPayment } = require('../fixtures/factories');
const { STANDARD_4X2_HOUSE } = require('../fixtures/test-data');

test.describe('Quote Workflow', () => {
  test('saves quote to history', async ({ appReady, helpers }) => {
    const quote = STANDARD_4X2_HOUSE();

    // Load quote into app
    await helpers.loadQuote(quote);

    // Save to history
    const saved = await helpers.saveQuote('Test Quote');

    expect(saved).toBeTruthy();
    expect(saved.id).toBeTruthy();
    expect(saved.name).toBe('Test Quote');
  });

  test('retrieves quote from history', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [createWindowLine({ count: 5 })]
    });

    await helpers.loadQuote(quote);
    const saved = await helpers.saveQuote('Retrievable Quote');

    // Load from history
    const loaded = await helpers.loadQuoteFromHistory(saved.id);

    expect(loaded).toBeTruthy();
    expect(loaded.windowLines).toHaveLength(1);
    expect(loaded.windowLines[0].count).toBe(5);
  });

  test('lists quote history', async ({ appReady, helpers }) => {
    // Save multiple quotes
    await helpers.loadQuote(createQuote({ windows: [createWindowLine({ count: 5 })] }));
    await helpers.saveQuote('Quote 1');

    await helpers.loadQuote(createQuote({ windows: [createWindowLine({ count: 10 })] }));
    await helpers.saveQuote('Quote 2');

    // Get history
    const history = await helpers.getQuoteHistory();

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some(q => q.name === 'Quote 1')).toBeTruthy();
    expect(history.some(q => q.name === 'Quote 2')).toBeTruthy();
  });

  test('deletes quote from history', async ({ appReady, helpers }) => {
    const quote = createQuote({ windows: [createWindowLine()] });
    await helpers.loadQuote(quote);
    const saved = await helpers.saveQuote('To Delete');

    // Delete quote
    await helpers.deleteQuote(saved.id);

    // Verify deletion
    const history = await helpers.getQuoteHistory();
    expect(history.find(q => q.id === saved.id)).toBeFalsy();
  });
});

test.describe('End-to-End Quote to Invoice Workflow', () => {
  test('complete workflow: quote -> calculate -> save -> invoice -> payment', async ({ appReady, helpers }) => {
    // Step 1: Create and calculate quote
    const quote = createQuote({
      jobSettings: {
        clientName: 'E2E Client',
        clientEmail: 'e2e@test.com'
      },
      windows: [
        createWindowLine({ count: 8 })
      ]
    });

    const calculation = await helpers.calculateQuote(quote);
    expect(calculation).toHaveValidGST();
    expect(calculation.total).toBeGreaterThan(0);

    // Step 2: Save quote to history
    await helpers.loadQuote(quote);
    const savedQuote = await helpers.saveQuote('E2E Test Quote');
    expect(savedQuote.id).toBeTruthy();

    // Step 3: Create invoice from quote
    const invoice = await helpers.createInvoiceFromQuote(quote);
    expect(invoice).toBeValidInvoice();
    expect(invoice.clientName).toBe('E2E Client');

    // Step 4: Save invoice
    const invoiceId = await helpers.saveInvoice(invoice);
    expect(invoiceId).toBeTruthy();

    // Step 5: Add payment
    const payment = createPayment({
      amount: invoice.total,
      method: 'bank_transfer'
    });

    const paidInvoice = await helpers.addPayment(invoiceId, payment);

    // Step 6: Verify final state
    expect(paidInvoice).toHavePaymentApplied(invoice.total);
    expect(paidInvoice).toHaveStatus('paid');
    expect(paidInvoice.amountDue).toBeCloseTo(0, 2);
  });

  test('workflow with partial payment', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [createWindowLine({ count: 10 })]
    });

    // Calculate
    const calc = await helpers.calculateQuote(quote);

    // Create invoice
    const invoice = await helpers.createInvoiceFromQuote(quote);
    const invoiceId = await helpers.saveInvoice(invoice);

    // Partial payment (50%)
    const halfPayment = invoice.total / 2;
    await helpers.addPayment(invoiceId, createPayment({ amount: halfPayment }));

    const updated = await helpers.getInvoice(invoiceId);
    expect(updated).toHavePaymentApplied(halfPayment);
    expect(updated).toHaveStatus('partial');
    expect(updated.amountDue).toBeCloseTo(halfPayment, 2);
  });
});

test.describe('State Management', () => {
  test('loads and updates state', async ({ appReady, helpers }) => {
    const quote = createQuote({
      jobSettings: { clientName: 'State Test' },
      windows: [createWindowLine({ count: 5 })]
    });

    // Set state
    await helpers.setState(quote);

    // Get state
    const state = await helpers.getState();

    expect(state.jobSettings.clientName).toBe('State Test');
    expect(state.windowLines).toHaveLength(1);
    expect(state.windowLines[0].count).toBe(5);
  });

  test('autosave functionality', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [createWindowLine({ count: 7 })]
    });

    await helpers.loadQuote(quote);

    // Trigger autosave
    const saved = await helpers.triggerAutosave();
    expect(saved).toBeTruthy();

    // Verify state was saved to storage
    const savedState = await helpers.getStorage('app-state');
    expect(savedState).toBeTruthy();
    expect(savedState.windowLines[0].count).toBe(7);
  });
});

test.describe('Storage Operations', () => {
  test('reads and writes to storage', async ({ appReady, helpers }) => {
    const testData = { foo: 'bar', number: 42 };

    // Set storage
    await helpers.setStorage('test-key', testData);

    // Get storage
    const retrieved = await helpers.getStorage('test-key');

    expect(retrieved).toEqual(testData);
  });

  test('clears storage key', async ({ appReady, helpers }) => {
    await helpers.setStorage('to-clear', { data: 'test' });

    // Clear specific key
    await helpers.clearStorageKey('to-clear');

    const retrieved = await helpers.getStorage('to-clear');
    expect(retrieved).toBeFalsy();
  });

  test('clears all storage', async ({ appReady, helpers }) => {
    await helpers.setStorage('key1', 'value1');
    await helpers.setStorage('key2', 'value2');

    // Clear all
    await helpers.clearStorage();

    const val1 = await helpers.getStorage('key1');
    const val2 = await helpers.getStorage('key2');

    expect(val1).toBeFalsy();
    expect(val2).toBeFalsy();
  });
});

test.describe('APP Initialization', () => {
  test('verifies APP is ready', async ({ appReady, helpers }) => {
    const ready = await helpers.isAppReady();
    expect(ready).toBeTruthy();
  });

  test('verifies all modules loaded', async ({ appReady, helpers }) => {
    const modules = await helpers.getModulesStatus();

    expect(modules.storage).toBeTruthy();
    expect(modules.app).toBeTruthy();
    expect(modules.calc).toBeTruthy();
    expect(modules.ui).toBeTruthy();
    expect(modules.invoice).toBeTruthy();
  });
});
