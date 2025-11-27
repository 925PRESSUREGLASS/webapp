/**
 * @tictacstick/calculation-engine - Quote Calculation Tests
 * 
 * Comprehensive tests for quote calculation with windows, pressure, and modifiers
 */

import { describe, it, expect } from 'vitest';
import {
  calculateQuote,
  calculateWindowCost,
  calculatePressureCost,
  WindowLine,
  PressureLine,
  QuoteState,
  WindowTypeConfig,
  PressureSurfaceConfig,
  roundMoney,
} from '../index';

// Test data
const testWindowTypes: Map<string, WindowTypeConfig> = new Map([
  ['std1', { id: 'std1', label: 'Standard 1x1', baseMinutesInside: 2.5, baseMinutesOutside: 2.5 }],
  ['std2', { id: 'std2', label: 'Standard 1x2', baseMinutesInside: 3.5, baseMinutesOutside: 3.5 }],
  ['door', { id: 'door', label: 'Glass Door', baseMinutesInside: 4.5, baseMinutesOutside: 4.5 }],
]);

const testPressureSurfaces: Map<string, PressureSurfaceConfig> = new Map([
  ['driveway', { id: 'driveway', label: 'Concrete Driveway', minutesPerSqm: 1.4 }],
  ['patio', { id: 'patio', label: 'Patio', minutesPerSqm: 1.5 }],
]);

// Modifier lookup functions
const conditionMultipliers: Record<string, number> = {
  clean: 0.9,
  moderate: 1.0,
  dirty: 1.3,
  heavy: 1.4,
};

const accessMultipliers: Record<string, number> = {
  ground: 1.0,
  ladder: 1.2,
  highReach: 1.4,
};

// These can be used for tests requiring custom multipliers
const _getConditionMultiplier = (id: string): number => conditionMultipliers[id] || 1.0;
const _getAccessMultiplier = (id: string): number => accessMultipliers[id] || 1.0;
void _getConditionMultiplier;
void _getAccessMultiplier;

describe('Window Cost Calculation', () => {
  const baseConfig = {
    baseFee: 0,
    hourlyRate: 80,
    minimumJob: 0,
    highReachModifierPercent: 40,
    insideMultiplier: 1.0,
    outsideMultiplier: 1.0,
    pressureHourlyRate: 90,
    setupBufferMinutes: 0,
  };

  it('should calculate cost for inside only window', () => {
    const line: WindowLine = {
      id: '1',
      windowTypeId: 'std1',
      panes: 4,
      inside: true,
      outside: false,
      highReach: false,
    };

    const cost = calculateWindowCost(line, baseConfig, testWindowTypes);
    // 4 panes × 2.5 min = 10 min = 0.167 hours × $80 = $13.33
    expect(cost).toBeCloseTo(13.33, 1);
  });

  it('should calculate cost for both inside and outside', () => {
    const line: WindowLine = {
      id: '1',
      windowTypeId: 'std1',
      panes: 4,
      inside: true,
      outside: true,
      highReach: false,
    };

    const cost = calculateWindowCost(line, baseConfig, testWindowTypes);
    // 4 panes × (2.5 + 2.5) min = 20 min = 0.333 hours × $80 = $26.67
    expect(cost).toBeCloseTo(26.67, 1);
  });

  it('should apply soil level multiplier', () => {
    const cleanLine: WindowLine = {
      id: '1',
      windowTypeId: 'std1',
      panes: 4,
      inside: true,
      outside: false,
      highReach: false,
      soilLevel: 'light',
    };

    const dirtyLine: WindowLine = {
      id: '2',
      windowTypeId: 'std1',
      panes: 4,
      inside: true,
      outside: false,
      highReach: false,
      soilLevel: 'heavy',
    };

    const cleanCost = calculateWindowCost(cleanLine, baseConfig, testWindowTypes);
    const dirtyCost = calculateWindowCost(dirtyLine, baseConfig, testWindowTypes);

    // Heavy should cost 1.4x more than clean
    expect(dirtyCost).toBeGreaterThan(cleanCost);
  });

  it('should apply high reach multiplier', () => {
    const groundLine: WindowLine = {
      id: '1',
      windowTypeId: 'std1',
      panes: 4,
      inside: false,
      outside: true,
      highReach: false,
    };

    const highReachLine: WindowLine = {
      id: '2',
      windowTypeId: 'std1',
      panes: 4,
      inside: false,
      outside: true,
      highReach: true,
    };

    const groundCost = calculateWindowCost(groundLine, baseConfig, testWindowTypes);
    const highReachCost = calculateWindowCost(highReachLine, baseConfig, testWindowTypes);

    // High reach should cost more
    expect(highReachCost).toBeGreaterThan(groundCost);
  });

  it('should return 0 for unknown window type', () => {
    const line: WindowLine = {
      id: '1',
      windowTypeId: 'unknown',
      panes: 4,
      inside: true,
      outside: false,
      highReach: false,
    };

    const cost = calculateWindowCost(line, baseConfig, testWindowTypes);
    expect(cost).toBe(0);
  });

  it('should return 0 for zero panes', () => {
    const line: WindowLine = {
      id: '1',
      windowTypeId: 'std1',
      panes: 0,
      inside: true,
      outside: true,
      highReach: false,
    };

    const cost = calculateWindowCost(line, baseConfig, testWindowTypes);
    expect(cost).toBe(0);
  });
});

describe('Pressure Cost Calculation', () => {
  const baseConfig = {
    baseFee: 0,
    hourlyRate: 80,
    minimumJob: 0,
    highReachModifierPercent: 40,
    insideMultiplier: 1.0,
    outsideMultiplier: 1.0,
    pressureHourlyRate: 90,
    setupBufferMinutes: 0,
  };

  it('should calculate cost for standard driveway', () => {
    const line: PressureLine = {
      id: '1',
      surfaceId: 'driveway',
      areaSqm: 50,
    };

    const cost = calculatePressureCost(line, baseConfig, testPressureSurfaces);
    // 50 sqm × 1.4 min = 70 min = 1.167 hours × $90 = $105
    expect(cost).toBeCloseTo(105, 0);
  });

  it('should apply soil level multiplier', () => {
    const lightLine: PressureLine = {
      id: '1',
      surfaceId: 'driveway',
      areaSqm: 50,
      soilLevel: 'light',
    };

    const heavyLine: PressureLine = {
      id: '2',
      surfaceId: 'driveway',
      areaSqm: 50,
      soilLevel: 'heavy',
    };

    const lightCost = calculatePressureCost(lightLine, baseConfig, testPressureSurfaces);
    const heavyCost = calculatePressureCost(heavyLine, baseConfig, testPressureSurfaces);

    // Heavy (1.5x) should cost more than light (1.0x)
    expect(heavyCost).toBeGreaterThan(lightCost);
    expect(heavyCost / lightCost).toBeCloseTo(1.5, 1);
  });

  it('should apply access multiplier', () => {
    const easyLine: PressureLine = {
      id: '1',
      surfaceId: 'driveway',
      areaSqm: 50,
      access: 'easy',
    };

    const highReachLine: PressureLine = {
      id: '2',
      surfaceId: 'driveway',
      areaSqm: 50,
      access: 'highReach',
    };

    const easyCost = calculatePressureCost(easyLine, baseConfig, testPressureSurfaces);
    const highReachCost = calculatePressureCost(highReachLine, baseConfig, testPressureSurfaces);

    expect(highReachCost).toBeGreaterThan(easyCost);
  });

  it('should return 0 for unknown surface', () => {
    const line: PressureLine = {
      id: '1',
      surfaceId: 'unknown',
      areaSqm: 50,
    };

    const cost = calculatePressureCost(line, baseConfig, testPressureSurfaces);
    expect(cost).toBe(0);
  });

  it('should return 0 for zero area', () => {
    const line: PressureLine = {
      id: '1',
      surfaceId: 'driveway',
      areaSqm: 0,
    };

    const cost = calculatePressureCost(line, baseConfig, testPressureSurfaces);
    expect(cost).toBe(0);
  });
});

describe('Full Quote Calculation', () => {
  const baseState: QuoteState = {
    baseFee: 25,
    hourlyRate: 80,
    minimumJob: 80,
    highReachModifierPercent: 40,
    insideMultiplier: 1.0,
    outsideMultiplier: 1.0,
    pressureHourlyRate: 90,
    setupBufferMinutes: 15,
    windowLines: [],
    pressureLines: [],
  };

  it('should calculate empty quote with base fee only', () => {
    const result = calculateQuote(
      baseState,
      testWindowTypes,
      testPressureSurfaces
    );

    // Base fee + setup buffer time
    expect(result.money.baseFee).toBe(25);
    expect(result.time.setupMinutes).toBe(15);
  });

  it('should apply minimum job', () => {
    const state: QuoteState = {
      ...baseState,
      minimumJob: 100,
      baseFee: 10,
      windowLines: [{
        id: '1',
        windowTypeId: 'std1',
        panes: 1,
        inside: true,
        outside: false,
        highReach: false,
      }],
    };

    const result = calculateQuote(
      state,
      testWindowTypes,
      testPressureSurfaces
    );

    // Total should be at least minimum job
    expect(result.money.total).toBeGreaterThanOrEqual(100);
  });

  it('should calculate mixed window and pressure quote', () => {
    const state: QuoteState = {
      ...baseState,
      windowLines: [{
        id: '1',
        windowTypeId: 'std1',
        panes: 10,
        inside: true,
        outside: true,
        highReach: false,
      }],
      pressureLines: [{
        id: '1',
        surfaceId: 'driveway',
        areaSqm: 50,
      }],
    };

    const result = calculateQuote(
      state,
      testWindowTypes,
      testPressureSurfaces
    );

    expect(result.money.windows).toBeGreaterThan(0);
    expect(result.money.pressure).toBeGreaterThan(0);
    expect(result.money.total).toBeGreaterThan(result.money.windows + result.money.pressure);
    expect(result.time.windowsMinutes).toBeGreaterThan(0);
    expect(result.time.pressureMinutes).toBeGreaterThan(0);
  });

  it('should calculate GST correctly', () => {
    const state: QuoteState = {
      ...baseState,
      minimumJob: 0,
      baseFee: 100,
      windowLines: [],
      pressureLines: [],
    };

    const result = calculateQuote(
      state,
      testWindowTypes,
      testPressureSurfaces
    );

    // GST should be 10% of subtotal
    const expectedGST = roundMoney(result.subtotal * 0.10);
    expect(result.gst).toBeCloseTo(expectedGST, 2);
    expect(result.total).toBeCloseTo(result.subtotal + result.gst, 2);
  });

  it('should track time breakdown correctly', () => {
    const state: QuoteState = {
      ...baseState,
      setupBufferMinutes: 20,
      travelMinutes: 30,
      windowLines: [{
        id: '1',
        windowTypeId: 'std2',
        panes: 6,
        inside: true,
        outside: true,
        highReach: false,
      }],
      pressureLines: [{
        id: '1',
        surfaceId: 'patio',
        areaSqm: 30,
      }],
    };

    const result = calculateQuote(
      state,
      testWindowTypes,
      testPressureSurfaces
    );

    expect(result.time.setupMinutes).toBe(20);
    expect(result.time.travelMinutes).toBe(30);
    expect(result.time.windowsMinutes).toBeGreaterThan(0);
    expect(result.time.pressureMinutes).toBeGreaterThan(0);
    expect(result.time.totalMinutes).toBe(
      result.time.windowsMinutes +
      result.time.pressureMinutes +
      result.time.highReachMinutes +
      result.time.setupMinutes
    );
  });

  it('should generate line item breakdown', () => {
    const state: QuoteState = {
      ...baseState,
      windowLines: [
        {
          id: 'w1',
          windowTypeId: 'std1',
          panes: 5,
          inside: true,
          outside: false,
          highReach: false,
        },
        {
          id: 'w2',
          windowTypeId: 'door',
          panes: 3,
          inside: true,
          outside: true,
          highReach: false,
        },
      ],
      pressureLines: [{
        id: 'p1',
        surfaceId: 'driveway',
        areaSqm: 40,
      }],
    };

    const result = calculateQuote(
      state,
      testWindowTypes,
      testPressureSurfaces
    );

    expect(result.lineItems).toBeDefined();
    expect(result.lineItems?.length).toBe(3); // 2 window + 1 pressure
    
    // Check line items have required properties
    result.lineItems?.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('minutes');
    });
  });

  it('should handle high reach windows correctly', () => {
    const groundState: QuoteState = {
      ...baseState,
      windowLines: [{
        id: '1',
        windowTypeId: 'std2',
        panes: 6,
        inside: false,
        outside: true,
        highReach: false,
      }],
    };

    const highReachState: QuoteState = {
      ...baseState,
      windowLines: [{
        id: '1',
        windowTypeId: 'std2',
        panes: 6,
        inside: false,
        outside: true,
        highReach: true,
      }],
    };

    const groundResult = calculateQuote(groundState, testWindowTypes, testPressureSurfaces);
    const highReachResult = calculateQuote(highReachState, testWindowTypes, testPressureSurfaces);

    expect(highReachResult.money.highReach).toBeGreaterThan(0);
    expect(highReachResult.time.highReachMinutes).toBeGreaterThan(0);
    expect(highReachResult.money.total).toBeGreaterThan(groundResult.money.total);
  });

  it('should handle travel costs', () => {
    const stateWithTravel: QuoteState = {
      ...baseState,
      travelMinutes: 30,
      travelRatePerHour: 60,
      travelKm: 20,
      travelRatePerKm: 0.85,
      windowLines: [{
        id: '1',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: false,
        highReach: false,
      }],
    };

    const result = calculateQuote(
      stateWithTravel,
      testWindowTypes,
      testPressureSurfaces
    );

    expect(result.money.travel).toBeGreaterThan(0);
    expect(result.time.travelMinutes).toBe(30);
  });
});

describe('Edge Cases', () => {
  const baseState: QuoteState = {
    baseFee: 0,
    hourlyRate: 80,
    minimumJob: 0,
    highReachModifierPercent: 40,
    insideMultiplier: 1.0,
    outsideMultiplier: 1.0,
    pressureHourlyRate: 90,
    setupBufferMinutes: 0,
    windowLines: [],
    pressureLines: [],
  };

  it('should handle very large quotes', () => {
    const state: QuoteState = {
      ...baseState,
      windowLines: Array.from({ length: 50 }, (_, i) => ({
        id: `w${i}`,
        windowTypeId: 'std2',
        panes: 10,
        inside: true,
        outside: true,
        highReach: i % 5 === 0,
      })),
      pressureLines: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        surfaceId: 'driveway',
        areaSqm: 100,
      })),
    };

    const result = calculateQuote(state, testWindowTypes, testPressureSurfaces);

    expect(result.money.total).toBeGreaterThan(0);
    expect(result.time.totalMinutes).toBeGreaterThan(0);
    expect(Number.isFinite(result.money.total)).toBe(true);
    expect(Number.isFinite(result.gst)).toBe(true);
  });

  it('should handle decimal precision correctly', () => {
    const state: QuoteState = {
      ...baseState,
      baseFee: 33.33,
      hourlyRate: 77.77,
      windowLines: [{
        id: '1',
        windowTypeId: 'std1',
        panes: 7,
        inside: true,
        outside: true,
        highReach: false,
      }],
    };

    const result = calculateQuote(state, testWindowTypes, testPressureSurfaces);

    // All money values should be rounded to 2 decimal places
    expect(Number(result.money.total.toFixed(2))).toBe(result.money.total);
    expect(Number(result.gst.toFixed(2))).toBe(result.gst);
  });

  it('should handle null/undefined lines gracefully', () => {
    const state: QuoteState = {
      ...baseState,
      windowLines: undefined as unknown as WindowLine[],
      pressureLines: null as unknown as PressureLine[],
    };

    // Should not throw
    expect(() => calculateQuote(state, testWindowTypes, testPressureSurfaces)).not.toThrow();
  });
});
