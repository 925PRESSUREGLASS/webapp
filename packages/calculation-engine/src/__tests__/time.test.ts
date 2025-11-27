/**
 * @tictacstick/calculation-engine - Time Calculation Tests
 * 
 * Tests for time conversion and formatting functions
 */

import { describe, it, expect } from 'vitest';
import {
  hoursToMinutes,
  minutesToHours,
  formatHours,
  sumTime,
} from '../index';

describe('Time: hoursToMinutes', () => {
  it('should convert whole hours to minutes', () => {
    expect(hoursToMinutes(1)).toBe(60);
    expect(hoursToMinutes(2)).toBe(120);
    expect(hoursToMinutes(8)).toBe(480);
    expect(hoursToMinutes(0)).toBe(0);
  });

  it('should convert fractional hours to minutes', () => {
    expect(hoursToMinutes(0.5)).toBe(30);
    expect(hoursToMinutes(1.5)).toBe(90);
    expect(hoursToMinutes(0.25)).toBe(15);
  });

  it('should round to nearest minute', () => {
    expect(hoursToMinutes(0.333)).toBe(20); // 19.98 rounds to 20
    expect(hoursToMinutes(0.166)).toBe(10); // 9.96 rounds to 10
  });

  it('should handle negative values (refunds, corrections)', () => {
    expect(hoursToMinutes(-1)).toBe(-60);
  });

  it('should throw on invalid input', () => {
    expect(() => hoursToMinutes(NaN)).toThrow();
    expect(() => hoursToMinutes(Infinity)).toThrow();
    expect(() => hoursToMinutes('2' as unknown as number)).toThrow();
  });
});

describe('Time: minutesToHours', () => {
  it('should convert minutes to hours', () => {
    expect(minutesToHours(60)).toBe(1);
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(30)).toBe(0.5);
    expect(minutesToHours(0)).toBe(0);
  });

  it('should handle fractional results', () => {
    expect(minutesToHours(45)).toBe(0.75);
    expect(minutesToHours(15)).toBe(0.25);
    expect(minutesToHours(20)).toBeCloseTo(0.333, 2);
  });

  it('should handle large values', () => {
    expect(minutesToHours(480)).toBe(8);
    expect(minutesToHours(600)).toBe(10);
  });

  it('should throw on invalid input', () => {
    expect(() => minutesToHours(NaN)).toThrow();
    expect(() => minutesToHours(Infinity)).toThrow();
  });
});

describe('Time: formatHours', () => {
  it('should format to 2 decimal places', () => {
    expect(formatHours(60)).toBe('1.00');
    expect(formatHours(90)).toBe('1.50');
    expect(formatHours(45)).toBe('0.75');
  });

  it('should handle edge cases', () => {
    expect(formatHours(0)).toBe('0.00');
    expect(formatHours(1)).toBe('0.02'); // 1 minute = 0.0167 hours
  });

  it('should handle long durations', () => {
    expect(formatHours(480)).toBe('8.00');
    expect(formatHours(525)).toBe('8.75');
  });
});

describe('Time: sumTime', () => {
  it('should sum multiple time values', () => {
    expect(sumTime(30, 30)).toBe(60);
    expect(sumTime(15, 30, 15)).toBe(60);
    expect(sumTime(10, 20, 30, 40)).toBe(100);
  });

  it('should handle single value', () => {
    expect(sumTime(45)).toBe(45);
  });

  it('should handle empty call', () => {
    expect(sumTime()).toBe(0);
  });

  it('should handle zero values', () => {
    expect(sumTime(0, 0, 0)).toBe(0);
    expect(sumTime(30, 0, 30)).toBe(60);
  });

  it('should throw on invalid input', () => {
    expect(() => sumTime(30, NaN)).toThrow();
    expect(() => sumTime(30, Infinity)).toThrow();
  });
});

describe('Time: Integration', () => {
  it('should handle full workflow: estimate job time', () => {
    // 3 windows at 5 min each = 15 min
    // 2 doors at 8 min each = 16 min
    // Setup 10 min
    // Travel 15 min
    const windowTime = 3 * 5;
    const doorTime = 2 * 8;
    const setupTime = 10;
    const travelTime = 15;
    
    const totalMinutes = sumTime(windowTime, doorTime, setupTime, travelTime);
    const totalHours = minutesToHours(totalMinutes);
    
    expect(totalMinutes).toBe(56);
    expect(totalHours).toBeCloseTo(0.93, 2);
    expect(formatHours(totalMinutes)).toBe('0.93');
  });

  it('should round-trip hours to minutes and back', () => {
    const originalHours = 2.5;
    const minutes = hoursToMinutes(originalHours);
    const backToHours = minutesToHours(minutes);
    
    expect(backToHours).toBe(originalHours);
  });
});
