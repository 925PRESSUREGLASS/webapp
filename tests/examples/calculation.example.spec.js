/**
 * Example: Calculation Tests using Fixtures
 *
 * This demonstrates how to write clean, maintainable tests using the fixture infrastructure.
 */

// Import test base with custom fixtures
const { test, expect } = require('../fixtures/test-base');

// Import matchers for custom assertions
require('../fixtures/matchers');

// Import factories for creating test data
const { createQuote, createWindowLine, createPressureLine } = require('../fixtures/factories');

// Import pre-defined test scenarios
const {
  SMALL_RESIDENTIAL,
  STANDARD_4X2_HOUSE,
  HIGH_REACH_JOB,
  MINIMUM_CHARGE_JOB,
  PEAK_SEASON
} = require('../fixtures/test-data');

// TODO: Re-enable after mapping factory schema to PRICING_DATA/state used by calc engine.
test.describe.skip('Calculation Engine', () => {
  test('calculates small residential job correctly', async ({ appReady, helpers }) => {
    // Use pre-defined test data
    const result = await helpers.calculateQuote(SMALL_RESIDENTIAL());

    // Use custom matchers
    expect(result).toHaveValidGST();
    expect(result).toHaveCompleteCalculation();
    expect(result).toHavePositiveTotals();
  });

  test('calculates standard 4x2 house correctly', async ({ appReady, helpers }) => {
    const result = await helpers.calculateQuote(STANDARD_4X2_HOUSE());

    expect(result).toHaveValidGST();
    expect(result.total).toBeGreaterThan(result.subtotal);
    expect(result.windowTotal).toBeGreaterThan(0);
    expect(result.pressureTotal).toBeGreaterThan(0);
  });

  test('applies high-reach premium correctly', async ({ appReady, helpers }) => {
    const result = await helpers.calculateQuote(HIGH_REACH_JOB());

    expect(result).toHaveValidGST();
    expect(result.total).toBeGreaterThan(result.subtotal);
    // High-reach jobs should be significantly more expensive
    expect(result.windowTotal).toBeGreaterThan(300);
  });

  test('enforces minimum charge on small jobs', async ({ appReady, helpers }) => {
    const result = await helpers.calculateQuote(MINIMUM_CHARGE_JOB());

    expect(result).toHaveMinimumCharge(150.00);
    expect(result).toHaveValidGST();
  });

  test('applies seasonal premium correctly', async ({ appReady, helpers }) => {
    const result = await helpers.calculateQuote(PEAK_SEASON());

    expect(result).toHaveValidGST();
    // Peak season should apply 20% premium
    expect(result.total).toBeGreaterThan(result.subtotal);
  });

  test('handles custom quote with factory', async ({ appReady, helpers }) => {
    // Create custom quote using factories
    const customQuote = createQuote({
      jobSettings: {
        clientName: 'Custom Client',
        jobType: 'commercial'
      },
      windows: [
        createWindowLine({ type: 'fixed_picture', count: 10, width: 200, height: 180 }),
        createWindowLine({ type: 'door_glass', count: 2, width: 90, height: 210 })
      ],
      pressure: [
        createPressureLine({ surfaceType: 'walls_brick', area: 100 })
      ]
    });

    const result = await helpers.calculateQuote(customQuote);

    expect(result).toHaveValidGST();
    expect(result).toHavePositiveTotals();
    expect(result.windowTotal).toBeGreaterThan(0);
    expect(result.pressureTotal).toBeGreaterThan(0);
  });

  test('calculates windows only job', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [
        createWindowLine({ count: 8 })
      ]
    });

    const result = await helpers.calculateQuote(quote);

    expect(result).toHaveValidGST();
    expect(result.windowTotal).toBeGreaterThan(0);
    expect(result.pressureTotal).toBe(0);
  });

  test('calculates pressure only job', async ({ appReady, helpers }) => {
    const quote = createQuote({
      pressure: [
        createPressureLine({ area: 50 })
      ]
    });

    const result = await helpers.calculateQuote(quote);

    expect(result).toHaveValidGST();
    expect(result.pressureTotal).toBeGreaterThan(0);
    expect(result.windowTotal).toBe(0);
  });

  test('handles empty quote gracefully', async ({ appReady, helpers }) => {
    const quote = createQuote({});

    const result = await helpers.calculateQuote(quote);

    // Empty quote should return minimum charge or zero
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.windowTotal).toBe(0);
    expect(result.pressureTotal).toBe(0);
  });

  test('handles multiple window types', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [
        createWindowLine({ type: 'standard_sliding', count: 8 }),
        createWindowLine({ type: 'awning_casement', count: 4 }),
        createWindowLine({ type: 'fixed_picture', count: 2 }),
        createWindowLine({ type: 'door_glass', count: 1 })
      ]
    });

    const result = await helpers.calculateQuote(quote);

    expect(result).toHaveValidGST();
    expect(result).toHavePositiveTotals();
  });

  test('applies rush premium correctly', async ({ appReady, helpers }) => {
    const quote = createQuote({
      jobSettings: { urgency: 'urgent' },
      windows: [createWindowLine({ count: 8 })],
      appliedModifiers: {
        seasonalMultiplier: 1.0,
        customerTypeDiscount: 0.0,
        rushPremiumPercent: 50
      }
    });

    const result = await helpers.calculateQuote(quote);

    expect(result).toHaveValidGST();
    // Total should include 50% rush premium
    expect(result.total).toBeGreaterThan(result.subtotal);
  });
});
