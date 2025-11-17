/**
 * Custom Playwright Matchers
 *
 * Domain-specific assertions for TicTacStick testing.
 * These extend Playwright's expect() with custom matchers.
 *
 * Usage:
 *   require('./fixtures/matchers'); // Load matchers
 *   const { expect } = require('@playwright/test');
 *
 *   expect(result).toHaveValidGST();
 *   expect(invoice).toBeValidInvoice();
 */

const { expect } = require('@playwright/test');

/**
 * Verify GST is exactly 10% of subtotal
 *
 * @example
 *   expect(result).toHaveValidGST();
 */
expect.extend({
  toHaveValidGST(result, options = {}) {
    const tolerance = options.tolerance || 0.01;
    const expectedGST = Math.round(result.subtotal * 0.10 * 100) / 100;
    const actualGST = result.gst || 0;
    const difference = Math.abs(actualGST - expectedGST);
    const pass = difference < tolerance;

    return {
      pass,
      message: () => pass
        ? `Expected GST not to be valid (subtotal: ${result.subtotal}, GST: ${actualGST})`
        : `Expected GST to be ${expectedGST.toFixed(2)} (10% of ${result.subtotal.toFixed(2)}), but got ${actualGST.toFixed(2)} (difference: ${difference.toFixed(2)})`
    };
  },

  /**
   * Verify minimum charge was enforced
   *
   * @example
   *   expect(result).toHaveMinimumCharge();
   *   expect(result).toHaveMinimumCharge(200.00);
   */
  toHaveMinimumCharge(result, minimumCharge = 150.00) {
    const total = result.total || 0;
    const pass = total >= minimumCharge;

    return {
      pass,
      message: () => pass
        ? `Expected total (${total.toFixed(2)}) not to meet minimum charge (${minimumCharge.toFixed(2)})`
        : `Expected total (${total.toFixed(2)}) to be >= minimum charge (${minimumCharge.toFixed(2)}), shortfall: ${(minimumCharge - total).toFixed(2)}`
    };
  },

  /**
   * Verify high-reach premium was applied correctly
   *
   * @example
   *   expect(result).toHaveHighReachPremium();
   *   expect(result).toHaveHighReachPremium(60);
   */
  toHaveHighReachPremium(result, expectedPercentage = 60) {
    const basePrice = result.baseWindowPrice || 0;
    const totalPrice = result.totalWindowPrice || 0;

    if (basePrice === 0) {
      return {
        pass: false,
        message: () => 'Result does not contain baseWindowPrice for premium calculation'
      };
    }

    const expectedPremium = basePrice * (expectedPercentage / 100);
    const actualPremium = totalPrice - basePrice;
    const difference = Math.abs(actualPremium - expectedPremium);
    const pass = difference < 0.01;

    return {
      pass,
      message: () => pass
        ? `Expected high-reach premium not to be ${expectedPercentage}%`
        : `Expected ${expectedPercentage}% premium (${expectedPremium.toFixed(2)}) on base price ${basePrice.toFixed(2)}, but got premium of ${actualPremium.toFixed(2)}`
    };
  },

  /**
   * Verify rush premium was applied correctly
   *
   * @example
   *   expect(result).toHaveRushPremium(50);
   */
  toHaveRushPremium(result, expectedPercentage) {
    const subtotal = result.subtotal || 0;
    const total = result.total || 0;
    const gst = result.gst || 0;
    const subtotalBeforeGST = total - gst;

    const expectedPremium = subtotal * (expectedPercentage / 100);
    const expectedTotal = subtotal + expectedPremium;
    const difference = Math.abs(subtotalBeforeGST - expectedTotal);
    const pass = difference < 0.01;

    return {
      pass,
      message: () => pass
        ? `Expected rush premium not to be ${expectedPercentage}%`
        : `Expected ${expectedPercentage}% rush premium (${expectedPremium.toFixed(2)}) to be added to subtotal ${subtotal.toFixed(2)}, expected ${expectedTotal.toFixed(2)} but got ${subtotalBeforeGST.toFixed(2)}`
    };
  },

  /**
   * Verify invoice structure is valid
   *
   * @example
   *   expect(invoice).toBeValidInvoice();
   */
  toBeValidInvoice(invoice) {
    const errors = [];

    // Check required fields
    const requiredFields = [
      'invoiceId',
      'clientName',
      'status',
      'subtotal',
      'gst',
      'total',
      'lineItems'
    ];

    requiredFields.forEach(field => {
      if (invoice[field] === undefined || invoice[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check line items is array
    if (!Array.isArray(invoice.lineItems)) {
      errors.push('lineItems must be an array');
    } else if (invoice.lineItems.length === 0) {
      errors.push('lineItems cannot be empty');
    }

    // Check totals match
    const subtotal = invoice.subtotal || 0;
    const gst = invoice.gst || 0;
    const total = invoice.total || 0;
    const expectedTotal = subtotal + gst;

    if (Math.abs(total - expectedTotal) > 0.01) {
      errors.push(`Total (${total.toFixed(2)}) does not match subtotal + GST (${expectedTotal.toFixed(2)})`);
    }

    // Check GST is 10% of subtotal
    const expectedGST = Math.round(subtotal * 0.10 * 100) / 100;
    if (Math.abs(gst - expectedGST) > 0.01) {
      errors.push(`GST (${gst.toFixed(2)}) is not 10% of subtotal (${subtotal.toFixed(2)})`);
    }

    // Check amountDue calculation if payments exist
    if (invoice.payments && invoice.payments.length > 0) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const expectedDue = total - totalPaid;

      if (Math.abs(invoice.amountDue - expectedDue) > 0.01) {
        errors.push(`amountDue (${invoice.amountDue}) does not match total - payments (${expectedDue.toFixed(2)})`);
      }
    }

    const pass = errors.length === 0;

    return {
      pass,
      message: () => pass
        ? 'Expected invoice not to be valid'
        : `Invoice validation failed:\n  - ${errors.join('\n  - ')}`
    };
  },

  /**
   * Verify payment was applied correctly to invoice
   *
   * @example
   *   expect(invoice).toHavePaymentApplied(250.00);
   */
  toHavePaymentApplied(invoice, expectedAmount) {
    const errors = [];

    // Check payments array exists
    if (!Array.isArray(invoice.payments)) {
      errors.push('payments is not an array');
    } else {
      // Calculate total paid from payments array
      const totalPaid = invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      if (Math.abs(totalPaid - expectedAmount) > 0.01) {
        errors.push(`Total in payments array (${totalPaid.toFixed(2)}) does not match expected (${expectedAmount.toFixed(2)})`);
      }

      // Check amountPaid field matches
      if (invoice.amountPaid !== undefined && Math.abs(invoice.amountPaid - expectedAmount) > 0.01) {
        errors.push(`amountPaid field (${invoice.amountPaid.toFixed(2)}) does not match expected (${expectedAmount.toFixed(2)})`);
      }

      // Check amountDue calculation
      const expectedDue = invoice.total - expectedAmount;
      if (invoice.amountDue !== undefined && Math.abs(invoice.amountDue - expectedDue) > 0.01) {
        errors.push(`amountDue (${invoice.amountDue.toFixed(2)}) does not match expected (${expectedDue.toFixed(2)})`);
      }
    }

    const pass = errors.length === 0;

    return {
      pass,
      message: () => pass
        ? `Expected payment of ${expectedAmount.toFixed(2)} not to be correctly applied`
        : `Payment application failed:\n  - ${errors.join('\n  - ')}`
    };
  },

  /**
   * Verify invoice status matches expected
   *
   * @example
   *   expect(invoice).toHaveStatus('paid');
   */
  toHaveStatus(invoice, expectedStatus) {
    const pass = invoice.status === expectedStatus;

    return {
      pass,
      message: () => pass
        ? `Expected invoice status not to be '${expectedStatus}'`
        : `Expected invoice status to be '${expectedStatus}', but got '${invoice.status}'`
    };
  },

  /**
   * Verify calculation result has all required fields
   *
   * @example
   *   expect(result).toHaveCompleteCalculation();
   */
  toHaveCompleteCalculation(result) {
    const requiredFields = [
      'subtotal',
      'gst',
      'total',
      'windowTotal',
      'pressureTotal'
    ];

    const missingFields = requiredFields.filter(field =>
      result[field] === undefined || result[field] === null
    );

    const pass = missingFields.length === 0;

    return {
      pass,
      message: () => pass
        ? 'Expected calculation not to be complete'
        : `Calculation is missing required fields: ${missingFields.join(', ')}`
    };
  },

  /**
   * Verify totals are greater than zero
   *
   * @example
   *   expect(result).toHavePositiveTotals();
   */
  toHavePositiveTotals(result) {
    const total = result.total || 0;
    const subtotal = result.subtotal || 0;
    const pass = total > 0 && subtotal > 0;

    return {
      pass,
      message: () => pass
        ? 'Expected totals not to be positive'
        : `Expected positive totals, but got total: ${total.toFixed(2)}, subtotal: ${subtotal.toFixed(2)}`
    };
  },

  /**
   * Verify seasonal multiplier was applied
   *
   * @example
   *   expect(result).toHaveSeasonalMultiplier(1.2);
   */
  toHaveSeasonalMultiplier(result, expectedMultiplier) {
    // This would need to check if multiplier was applied to base price
    // For now, simplified version
    const pass = result.seasonalMultiplier === expectedMultiplier;

    return {
      pass,
      message: () => pass
        ? `Expected seasonal multiplier not to be ${expectedMultiplier}`
        : `Expected seasonal multiplier ${expectedMultiplier}, but got ${result.seasonalMultiplier || 'undefined'}`
    };
  }
});

module.exports = { expect };
