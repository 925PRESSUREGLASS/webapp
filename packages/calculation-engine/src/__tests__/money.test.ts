/**
 * @tictacstick/calculation-engine - Money Calculation Tests
 * 
 * Tests for precision money calculations using integer arithmetic
 */

import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  roundMoney,
  sumCents,
  multiplyDollars,
  applyMinimum,
  applyMinimumDollars,
  calculateGST,
  addGST,
  extractGST,
  extractSubtotal,
} from '../index';

describe('Money: toCents', () => {
  it('should convert whole dollars to cents', () => {
    expect(toCents(1)).toBe(100);
    expect(toCents(10)).toBe(1000);
    expect(toCents(100)).toBe(10000);
    expect(toCents(0)).toBe(0);
  });

  it('should convert fractional dollars to cents', () => {
    expect(toCents(1.50)).toBe(150);
    expect(toCents(0.99)).toBe(99);
    expect(toCents(10.05)).toBe(1005);
    expect(toCents(0.01)).toBe(1);
  });

  it('should round to nearest cent', () => {
    expect(toCents(1.234)).toBe(123);
    expect(toCents(1.235)).toBe(124); // rounds up
    expect(toCents(1.999)).toBe(200);
  });

  it('should handle negative amounts', () => {
    expect(toCents(-5.50)).toBe(-550);
  });

  it('should throw on invalid input', () => {
    expect(() => toCents(NaN)).toThrow();
    expect(() => toCents(Infinity)).toThrow();
    expect(() => toCents('10' as unknown as number)).toThrow();
  });
});

describe('Money: fromCents', () => {
  it('should convert cents to dollars', () => {
    expect(fromCents(100)).toBe(1);
    expect(fromCents(150)).toBe(1.5);
    expect(fromCents(99)).toBe(0.99);
    expect(fromCents(1005)).toBe(10.05);
    expect(fromCents(0)).toBe(0);
  });

  it('should handle negative amounts', () => {
    expect(fromCents(-550)).toBe(-5.5);
  });

  it('should throw on invalid input', () => {
    expect(() => fromCents(NaN)).toThrow();
    expect(() => fromCents(Infinity)).toThrow();
  });
});

describe('Money: roundMoney', () => {
  it('should round to 2 decimal places', () => {
    expect(roundMoney(1.234)).toBe(1.23);
    expect(roundMoney(1.235)).toBe(1.24);
    expect(roundMoney(1.999)).toBe(2);
    expect(roundMoney(10.001)).toBe(10);
  });

  it('should handle floating-point precision issues', () => {
    // Classic floating-point problem: 0.1 + 0.2 = 0.30000000000000004
    const sum = 0.1 + 0.2;
    expect(roundMoney(sum)).toBe(0.3);
  });

  it('should preserve exact values', () => {
    expect(roundMoney(1.50)).toBe(1.5);
    expect(roundMoney(99.99)).toBe(99.99);
  });
});

describe('Money: sumCents', () => {
  it('should sum multiple cent values', () => {
    expect(sumCents(100, 200, 300)).toBe(600);
    expect(sumCents(99, 1)).toBe(100);
    expect(sumCents(0, 0, 0)).toBe(0);
  });

  it('should handle single value', () => {
    expect(sumCents(500)).toBe(500);
  });

  it('should handle empty call', () => {
    expect(sumCents()).toBe(0);
  });

  it('should handle negative values', () => {
    expect(sumCents(100, -50)).toBe(50);
  });

  it('should throw on invalid input', () => {
    expect(() => sumCents(100, NaN)).toThrow();
  });
});

describe('Money: multiplyDollars', () => {
  it('should multiply dollars by factor', () => {
    expect(multiplyDollars(10, 2)).toBe(20);
    expect(multiplyDollars(5.50, 2)).toBe(11);
    expect(multiplyDollars(100, 0.5)).toBe(50);
  });

  it('should round result to cents', () => {
    expect(multiplyDollars(10, 0.333)).toBe(3.33);
    expect(multiplyDollars(10, 0.3333)).toBe(3.33);
  });

  it('should handle zero', () => {
    expect(multiplyDollars(100, 0)).toBe(0);
    expect(multiplyDollars(0, 100)).toBe(0);
  });
});

describe('Money: applyMinimum', () => {
  it('should return amount if greater than minimum', () => {
    expect(applyMinimum(500, 100)).toBe(500);
  });

  it('should return minimum if amount is less', () => {
    expect(applyMinimum(50, 100)).toBe(100);
  });

  it('should return minimum if equal', () => {
    expect(applyMinimum(100, 100)).toBe(100);
  });
});

describe('Money: applyMinimumDollars', () => {
  it('should apply minimum in dollar amounts', () => {
    expect(applyMinimumDollars(50, 100)).toBe(100);
    expect(applyMinimumDollars(150, 100)).toBe(150);
    expect(applyMinimumDollars(100, 100)).toBe(100);
  });

  it('should handle decimal amounts', () => {
    expect(applyMinimumDollars(49.99, 50)).toBe(50);
    expect(applyMinimumDollars(50.01, 50)).toBe(50.01);
  });
});

describe('GST: calculateGST', () => {
  it('should calculate 10% GST', () => {
    const result = calculateGST(100);
    expect(result.gst).toBe(10);
    expect(result.total).toBe(110);
  });

  it('should handle decimal amounts', () => {
    const result = calculateGST(99.99);
    expect(result.gst).toBe(10);  // 9.999 rounds to 10
    expect(result.total).toBe(109.99);
  });

  it('should use integer arithmetic for precision', () => {
    // $33.33 * 0.1 = $3.333 -> rounds to $3.33
    const result = calculateGST(33.33);
    expect(result.gst).toBe(3.33);
    expect(result.total).toBe(36.66);
  });

  it('should handle zero', () => {
    const result = calculateGST(0);
    expect(result.gst).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should handle negative gracefully', () => {
    const result = calculateGST(-100);
    expect(result.gst).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should accept custom rate', () => {
    const result = calculateGST(100, 0.15);
    expect(result.gst).toBe(15);
    expect(result.total).toBe(115);
  });
});

describe('GST: addGST', () => {
  it('should add 10% GST to subtotal', () => {
    expect(addGST(100)).toBe(110);
    expect(addGST(50)).toBe(55);
    expect(addGST(0)).toBe(0);
  });
});

describe('GST: extractGST', () => {
  it('should extract GST from inclusive amount', () => {
    // $110 inclusive = $100 + $10 GST
    expect(extractGST(110)).toBe(10);
  });

  it('should use Total / 11 formula', () => {
    // $55 / 11 = $5 GST
    expect(extractGST(55)).toBe(5);
    
    // $220 / 11 = $20 GST
    expect(extractGST(220)).toBe(20);
  });

  it('should handle rounding correctly', () => {
    // $100 / 11 = $9.0909... -> rounds to $9.09
    expect(extractGST(100)).toBe(9.09);
  });

  it('should handle zero and negative', () => {
    expect(extractGST(0)).toBe(0);
    expect(extractGST(-100)).toBe(0);
  });
});

describe('GST: extractSubtotal', () => {
  it('should extract subtotal from inclusive amount', () => {
    // $110 inclusive = $100 subtotal
    expect(extractSubtotal(110)).toBe(100);
  });

  it('should be inverse of addGST', () => {
    const subtotal = 150;
    const total = addGST(subtotal);
    const extracted = extractSubtotal(total);
    expect(extracted).toBe(subtotal);
  });

  it('should handle rounding edge cases', () => {
    // $100 total: subtotal = $100 - ($100/11) = $100 - $9.09 = $90.91
    expect(extractSubtotal(100)).toBe(90.91);
  });
});
