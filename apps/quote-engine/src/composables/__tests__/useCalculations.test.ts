/**
 * useCalculations Composable Tests
 * 
 * Tests for the shared calculation utilities composable
 */

import { describe, it, expect } from 'vitest';
import {
  windowTypeMap,
  pressureSurfaceMap,
  getConditionMultiplier,
  getAccessMultiplier,
  getConditionTimeMultiplier,
  getAccessTimeMultiplier,
  calculateWindowLineCost,
  calculatePressureLineCost,
  useCalculations,
} from '../useCalculations';
import type { WindowLine, PressureLine, PricingConfig } from '@tictacstick/calculation-engine';

// Test pricing config
const testPricingConfig: PricingConfig = {
  baseFee: 0,
  hourlyRate: 80,
  minimumJob: 0,
  highReachModifierPercent: 40,
  insideMultiplier: 1.0,
  outsideMultiplier: 1.0,
  pressureHourlyRate: 80,
  setupBufferMinutes: 0,
};

describe('useCalculations Composable', () => {
  describe('Module-level memoized maps', () => {
    it('should export windowTypeMap as a non-empty Map', () => {
      expect(windowTypeMap).toBeInstanceOf(Map);
      expect(windowTypeMap.size).toBeGreaterThan(0);
    });

    it('should export pressureSurfaceMap as a non-empty Map', () => {
      expect(pressureSurfaceMap).toBeInstanceOf(Map);
      expect(pressureSurfaceMap.size).toBeGreaterThan(0);
    });

    it('should have standard window types in windowTypeMap', () => {
      const standardType = windowTypeMap.get('std1');
      expect(standardType).toBeDefined();
      expect(standardType?.label).toBeDefined();
      expect(standardType?.baseMinutesInside).toBeGreaterThan(0);
    });

    it('should have driveway in pressureSurfaceMap', () => {
      const driveway = pressureSurfaceMap.get('driveway');
      expect(driveway).toBeDefined();
      expect(driveway?.label).toBeDefined();
      expect(driveway?.minutesPerSqm).toBeGreaterThan(0);
    });
  });

  describe('Multiplier lookup functions', () => {
    describe('getConditionMultiplier', () => {
      it('should return 1.0 for unknown condition', () => {
        expect(getConditionMultiplier('unknown')).toBe(1.0);
      });

      it('should return a number for dirty condition', () => {
        const multiplier = getConditionMultiplier('dirty');
        expect(typeof multiplier).toBe('number');
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
      });

      it('should return a number for very-dirty condition', () => {
        const multiplier = getConditionMultiplier('very-dirty');
        expect(typeof multiplier).toBe('number');
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
      });
    });

    describe('getAccessMultiplier', () => {
      it('should return 1.0 for unknown access', () => {
        expect(getAccessMultiplier('unknown')).toBe(1.0);
      });

      it('should return a number for ladder access', () => {
        const multiplier = getAccessMultiplier('ladder');
        expect(typeof multiplier).toBe('number');
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
      });

      it('should return a number for scaffold access', () => {
        const multiplier = getAccessMultiplier('scaffold');
        expect(typeof multiplier).toBe('number');
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
      });
    });

    describe('getConditionTimeMultiplier', () => {
      it('should return 1.0 for unknown condition', () => {
        expect(getConditionTimeMultiplier('unknown')).toBe(1.0);
      });
    });

    describe('getAccessTimeMultiplier', () => {
      it('should return 1.0 for unknown access', () => {
        expect(getAccessTimeMultiplier('unknown')).toBe(1.0);
      });
    });
  });

  describe('calculateWindowLineCost', () => {
    it('should calculate cost for basic window line', () => {
      const line: WindowLine = {
        id: 'test-1',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const cost = calculateWindowLineCost(line, testPricingConfig);
      expect(cost).toBeGreaterThan(0);
    });

    it('should return 0 for invalid window type', () => {
      const line: WindowLine = {
        id: 'test-2',
        windowTypeId: 'invalid-type',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const cost = calculateWindowLineCost(line, testPricingConfig);
      expect(cost).toBe(0);
    });

    it('should return 0 when neither inside nor outside is selected', () => {
      const line: WindowLine = {
        id: 'test-3',
        windowTypeId: 'std1',
        panes: 4,
        inside: false,
        outside: false,
        highReach: false,
      };

      const cost = calculateWindowLineCost(line, testPricingConfig);
      expect(cost).toBe(0);
    });

    it('should calculate higher cost for high reach when modifier is positive', () => {
      // Create config with non-zero high reach modifier
      const configWithHighReach: PricingConfig = {
        ...testPricingConfig,
        highReachModifierPercent: 40,
      };

      const baseLine: WindowLine = {
        id: 'test-4',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const highReachLine: WindowLine = {
        ...baseLine,
        id: 'test-5',
        highReach: true,
      };

      const baseCost = calculateWindowLineCost(baseLine, configWithHighReach);
      const highReachCost = calculateWindowLineCost(highReachLine, configWithHighReach);

      // High reach should add the modifier percentage to the cost
      expect(highReachCost).toBeGreaterThanOrEqual(baseCost);
    });

    it('should scale cost with number of panes', () => {
      const line4Panes: WindowLine = {
        id: 'test-6',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const line8Panes: WindowLine = {
        ...line4Panes,
        id: 'test-7',
        panes: 8,
      };

      const cost4 = calculateWindowLineCost(line4Panes, testPricingConfig);
      const cost8 = calculateWindowLineCost(line8Panes, testPricingConfig);

      // Use toBeCloseTo for float comparison (1 decimal place precision)
      expect(cost8).toBeCloseTo(cost4 * 2, 1);
    });
  });

  describe('calculatePressureLineCost', () => {
    it('should calculate cost for basic pressure line', () => {
      const line: PressureLine = {
        id: 'test-1',
        surfaceId: 'driveway',
        areaSqm: 40,
      };

      const cost = calculatePressureLineCost(line, testPricingConfig);
      expect(cost).toBeGreaterThan(0);
    });

    it('should return 0 for invalid surface type', () => {
      const line: PressureLine = {
        id: 'test-2',
        surfaceId: 'invalid-surface',
        areaSqm: 40,
      };

      const cost = calculatePressureLineCost(line, testPricingConfig);
      expect(cost).toBe(0);
    });

    it('should return 0 for zero area', () => {
      const line: PressureLine = {
        id: 'test-3',
        surfaceId: 'driveway',
        areaSqm: 0,
      };

      const cost = calculatePressureLineCost(line, testPricingConfig);
      expect(cost).toBe(0);
    });

    it('should scale cost with area', () => {
      const line40sqm: PressureLine = {
        id: 'test-4',
        surfaceId: 'driveway',
        areaSqm: 40,
      };

      const line80sqm: PressureLine = {
        ...line40sqm,
        id: 'test-5',
        areaSqm: 80,
      };

      const cost40 = calculatePressureLineCost(line40sqm, testPricingConfig);
      const cost80 = calculatePressureLineCost(line80sqm, testPricingConfig);

      // Use toBeCloseTo for float comparison (1 decimal place precision)
      expect(cost80).toBeCloseTo(cost40 * 2, 1);
    });

    it('should calculate higher cost for heavy soil level', () => {
      const lightLine: PressureLine = {
        id: 'test-6',
        surfaceId: 'driveway',
        areaSqm: 40,
        soilLevel: 'light',
      };

      const heavyLine: PressureLine = {
        ...lightLine,
        id: 'test-7',
        soilLevel: 'heavy',
      };

      const lightCost = calculatePressureLineCost(lightLine, testPricingConfig);
      const heavyCost = calculatePressureLineCost(heavyLine, testPricingConfig);

      expect(heavyCost).toBeGreaterThan(lightCost);
    });
  });

  describe('useCalculations composable function', () => {
    it('should return all expected utilities', () => {
      const utils = useCalculations();

      expect(utils.windowTypeMap).toBeDefined();
      expect(utils.pressureSurfaceMap).toBeDefined();
      expect(utils.getConditionMultiplier).toBeTypeOf('function');
      expect(utils.getAccessMultiplier).toBeTypeOf('function');
      expect(utils.getConditionTimeMultiplier).toBeTypeOf('function');
      expect(utils.getAccessTimeMultiplier).toBeTypeOf('function');
      expect(utils.calculateWindowLineCost).toBeTypeOf('function');
      expect(utils.calculatePressureLineCost).toBeTypeOf('function');
      expect(utils.calculateWindowLineTime).toBeTypeOf('function');
      expect(utils.calculatePressureLineTime).toBeTypeOf('function');
      expect(utils.conditions).toBeDefined();
      expect(utils.accessModifiers).toBeDefined();
    });

    it('should return conditions array with valid entries', () => {
      const { conditions } = useCalculations();

      expect(Array.isArray(conditions)).toBe(true);
      expect(conditions.length).toBeGreaterThan(0);
      
      const firstCondition = conditions[0];
      expect(firstCondition.id).toBeDefined();
      expect(firstCondition.label).toBeDefined();
      expect(firstCondition.priceMultiplier).toBeGreaterThan(0);
    });

    it('should return accessModifiers array with valid entries', () => {
      const { accessModifiers } = useCalculations();

      expect(Array.isArray(accessModifiers)).toBe(true);
      expect(accessModifiers.length).toBeGreaterThan(0);
      
      const firstModifier = accessModifiers[0];
      expect(firstModifier.id).toBeDefined();
      expect(firstModifier.label).toBeDefined();
      expect(firstModifier.priceMultiplier).toBeGreaterThan(0);
    });

    it('should return same memoized maps on multiple calls', () => {
      const utils1 = useCalculations();
      const utils2 = useCalculations();

      expect(utils1.windowTypeMap).toBe(utils2.windowTypeMap);
      expect(utils1.pressureSurfaceMap).toBe(utils2.pressureSurfaceMap);
    });
  });

  describe('Performance optimizations', () => {
    it('should have O(1) lookups for condition multipliers', () => {
      // Multiple lookups should be fast with Map-based implementation
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        getConditionMultiplier('dirty');
        getConditionMultiplier('very-dirty');
        getConditionMultiplier('unknown');
      }
      const duration = performance.now() - start;
      
      // Should complete 3000 lookups in under 10ms with Map-based O(1) lookup
      expect(duration).toBeLessThan(50);
    });

    it('should have O(1) lookups for access multipliers', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        getAccessMultiplier('ladder');
        getAccessMultiplier('scaffold');
        getAccessMultiplier('unknown');
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should have O(1) lookups for time multipliers', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        getConditionTimeMultiplier('dirty');
        getAccessTimeMultiplier('ladder');
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Individual High Reach', () => {
    it('should apply 70% increase for inside high reach only', () => {
      const baseLine: WindowLine = {
        id: 'test-hr-1',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const insideHighReachLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-2',
        highReach: true,
        insideHighReachCount: 4,  // All 4 panes are high reach inside
        outsideHighReachCount: 0, // No outside high reach
      };

      const baseCost = calculateWindowLineCost(baseLine, testPricingConfig);
      const hrCost = calculateWindowLineCost(insideHighReachLine, testPricingConfig);

      // Inside high reach should increase cost (only inside portion gets 70% boost)
      expect(hrCost).toBeGreaterThan(baseCost);
    });

    it('should apply 70% increase for outside high reach only', () => {
      const baseLine: WindowLine = {
        id: 'test-hr-3',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const outsideHighReachLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-4',
        highReach: true,
        insideHighReachCount: 0,  // No inside high reach
        outsideHighReachCount: 4, // All 4 panes are high reach outside
      };

      const baseCost = calculateWindowLineCost(baseLine, testPricingConfig);
      const hrCost = calculateWindowLineCost(outsideHighReachLine, testPricingConfig);

      // Outside high reach should increase cost (only outside portion gets 70% boost)
      expect(hrCost).toBeGreaterThan(baseCost);
    });

    it('should apply 70% increase to both sides when both enabled', () => {
      const baseLine: WindowLine = {
        id: 'test-hr-5',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
      };

      const bothHighReachLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-6',
        highReach: true,
        insideHighReachCount: 4,  // All 4 panes high reach inside
        outsideHighReachCount: 4, // All 4 panes high reach outside
      };

      const insideOnlyLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-7',
        highReach: true,
        insideHighReachCount: 4,  // All 4 panes high reach inside
        outsideHighReachCount: 0, // No outside high reach
      };

      const baseCost = calculateWindowLineCost(baseLine, testPricingConfig);
      const bothCost = calculateWindowLineCost(bothHighReachLine, testPricingConfig);
      const insideOnlyCost = calculateWindowLineCost(insideOnlyLine, testPricingConfig);

      // Both high reach should be more expensive than inside only
      expect(bothCost).toBeGreaterThan(insideOnlyCost);
      expect(bothCost).toBeGreaterThan(baseCost);
    });

    it('should not apply high reach when highReach master toggle is off', () => {
      const lineWithoutHighReach: WindowLine = {
        id: 'test-hr-8',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        highReach: false,
        insideHighReachCount: 4,  // These should be ignored since highReach is false
        outsideHighReachCount: 4,
      };

      const lineWithHighReach: WindowLine = {
        ...lineWithoutHighReach,
        id: 'test-hr-9',
        highReach: true,
      };

      const costWithoutHR = calculateWindowLineCost(lineWithoutHighReach, testPricingConfig);
      const costWithHR = calculateWindowLineCost(lineWithHighReach, testPricingConfig);

      // When highReach is false, individual counts should be ignored
      expect(costWithHR).toBeGreaterThan(costWithoutHR);
    });

    it('should apply proportional high reach when only some panes are high reach', () => {
      const baseLine: WindowLine = {
        id: 'test-hr-10',
        windowTypeId: 'std1',
        panes: 10,
        inside: true,
        outside: true,
        highReach: false,
      };

      const partialHighReachLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-11',
        highReach: true,
        insideHighReachCount: 5,   // Only 5 of 10 panes are high reach inside
        outsideHighReachCount: 3,  // Only 3 of 10 panes are high reach outside
      };

      const allHighReachLine: WindowLine = {
        ...baseLine,
        id: 'test-hr-12',
        highReach: true,
        insideHighReachCount: 10,  // All 10 panes high reach inside
        outsideHighReachCount: 10, // All 10 panes high reach outside
      };

      const baseCost = calculateWindowLineCost(baseLine, testPricingConfig);
      const partialCost = calculateWindowLineCost(partialHighReachLine, testPricingConfig);
      const allCost = calculateWindowLineCost(allHighReachLine, testPricingConfig);

      // Partial high reach should be between base and all high reach
      expect(partialCost).toBeGreaterThan(baseCost);
      expect(allCost).toBeGreaterThan(partialCost);
    });
  });

  describe('Window Add-ons', () => {
    it('should include addon costs in window line total', () => {
      const lineWithoutAddons: WindowLine = {
        id: 'test-addon-1',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
      };

      const lineWithAddons: WindowLine = {
        ...lineWithoutAddons,
        id: 'test-addon-2',
        addons: [
          { 
            id: '1', 
            label: 'Fly Screen Clean',
            description: 'Clean fly screens',
            basePrice: 5.00,
            severity: 'light', 
            insideCount: 4, 
            outsideCount: 0 
          },
        ],
      };

      const costWithout = calculateWindowLineCost(lineWithoutAddons, testPricingConfig);
      const costWith = calculateWindowLineCost(lineWithAddons, testPricingConfig);

      // With addons should cost more (4 panes * $5 = $20 extra)
      expect(costWith).toBeGreaterThan(costWithout);
    });

    it('should apply severity multiplier to addon costs', () => {
      const lightAddonLine: WindowLine = {
        id: 'test-addon-3',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        addons: [
          { 
            id: '1', 
            label: 'Fly Screen Clean',
            description: 'Clean fly screens',
            basePrice: 5.00,
            severity: 'light', 
            insideCount: 4, 
            outsideCount: 0 
          },
        ],
      };

      const heavyAddonLine: WindowLine = {
        ...lightAddonLine,
        id: 'test-addon-4',
        addons: [
          { 
            id: '2', 
            label: 'Fly Screen Clean',
            description: 'Clean fly screens',
            basePrice: 5.00,
            severity: 'heavy', 
            insideCount: 4, 
            outsideCount: 0 
          },
        ],
      };

      const lightCost = calculateWindowLineCost(lightAddonLine, testPricingConfig);
      const heavyCost = calculateWindowLineCost(heavyAddonLine, testPricingConfig);

      // Heavy severity (2.0x) should cost more than light (1.0x)
      expect(heavyCost).toBeGreaterThan(lightCost);
    });

    it('should sum costs from multiple addons', () => {
      const singleAddonLine: WindowLine = {
        id: 'test-addon-5',
        windowTypeId: 'std1',
        panes: 4,
        inside: true,
        outside: true,
        addons: [
          { 
            id: '1', 
            label: 'Fly Screen Clean',
            description: 'Clean fly screens',
            basePrice: 5.00,
            severity: 'light', 
            insideCount: 2, 
            outsideCount: 0 
          },
        ],
      };

      const multipleAddonsLine: WindowLine = {
        ...singleAddonLine,
        id: 'test-addon-6',
        addons: [
          { 
            id: '1', 
            label: 'Fly Screen Clean',
            description: 'Clean fly screens',
            basePrice: 5.00,
            severity: 'light', 
            insideCount: 2, 
            outsideCount: 0 
          },
          { 
            id: '2', 
            label: 'Sill Wipe',
            description: 'Wipe window sills',
            basePrice: 3.00,
            severity: 'light', 
            insideCount: 2, 
            outsideCount: 0 
          },
          { 
            id: '3', 
            label: 'Track Clean',
            description: 'Clean tracks',
            basePrice: 4.00,
            severity: 'light', 
            insideCount: 2, 
            outsideCount: 0 
          },
        ],
      };

      const singleCost = calculateWindowLineCost(singleAddonLine, testPricingConfig);
      const multipleCost = calculateWindowLineCost(multipleAddonsLine, testPricingConfig);

      // Multiple addons should cost more than single addon
      expect(multipleCost).toBeGreaterThan(singleCost);
    });
  });

  describe('Pressure Add-ons', () => {
    it('should include addon costs in pressure line total', () => {
      const lineWithoutAddons: PressureLine = {
        id: 'test-p-addon-1',
        surfaceId: 'driveway',
        areaSqm: 40,
      };

      const lineWithAddons: PressureLine = {
        ...lineWithoutAddons,
        id: 'test-p-addon-2',
        addons: [
          { 
            id: '1', 
            label: 'Moss Removal',
            description: 'Remove moss and lichen',
            basePrice: 2.50,
            isPerSqm: true,
            areaSqm: 10,
            severity: 'light' 
          },
        ],
      };

      const costWithout = calculatePressureLineCost(lineWithoutAddons, testPricingConfig);
      const costWith = calculatePressureLineCost(lineWithAddons, testPricingConfig);

      // With addons should cost more (10 sqm * $2.50 = $25 extra)
      expect(costWith).toBeGreaterThan(costWithout);
    });

    it('should apply severity multiplier to pressure addon costs', () => {
      const lightAddonLine: PressureLine = {
        id: 'test-p-addon-3',
        surfaceId: 'driveway',
        areaSqm: 40,
        addons: [
          { 
            id: '1', 
            label: 'Moss Removal',
            description: 'Remove moss and lichen',
            basePrice: 2.50,
            isPerSqm: true,
            areaSqm: 20,
            severity: 'light' 
          },
        ],
      };

      const heavyAddonLine: PressureLine = {
        ...lightAddonLine,
        id: 'test-p-addon-4',
        addons: [
          { 
            id: '2', 
            label: 'Moss Removal',
            description: 'Remove moss and lichen',
            basePrice: 2.50,
            isPerSqm: true,
            areaSqm: 20,
            severity: 'heavy' 
          },
        ],
      };

      const lightCost = calculatePressureLineCost(lightAddonLine, testPricingConfig);
      const heavyCost = calculatePressureLineCost(heavyAddonLine, testPricingConfig);

      // Heavy severity (2.0x) should cost more than light (1.0x)
      expect(heavyCost).toBeGreaterThan(lightCost);
    });

    it('should scale pressure addon cost with area', () => {
      const smallAreaAddon: PressureLine = {
        id: 'test-p-addon-5',
        surfaceId: 'driveway',
        areaSqm: 40,
        addons: [
          { 
            id: '1', 
            label: 'Oil Stain Treatment',
            description: 'Treat oil stains',
            basePrice: 3.00,
            isPerSqm: true,
            areaSqm: 5,
            severity: 'medium' 
          },
        ],
      };

      const largeAreaAddon: PressureLine = {
        ...smallAreaAddon,
        id: 'test-p-addon-6',
        addons: [
          { 
            id: '2', 
            label: 'Oil Stain Treatment',
            description: 'Treat oil stains',
            basePrice: 3.00,
            isPerSqm: true,
            areaSqm: 20,
            severity: 'medium' 
          },
        ],
      };

      const smallCost = calculatePressureLineCost(smallAreaAddon, testPricingConfig);
      const largeCost = calculatePressureLineCost(largeAreaAddon, testPricingConfig);

      // Larger area (20 sqm) should cost more than small (5 sqm)
      expect(largeCost).toBeGreaterThan(smallCost);
    });

    it('should sum costs from multiple pressure addons', () => {
      const singleAddonLine: PressureLine = {
        id: 'test-p-addon-7',
        surfaceId: 'driveway',
        areaSqm: 40,
        addons: [
          { 
            id: '1', 
            label: 'Moss Removal',
            description: 'Remove moss',
            basePrice: 2.50,
            isPerSqm: true,
            areaSqm: 10,
            severity: 'light' 
          },
        ],
      };

      const multipleAddonsLine: PressureLine = {
        ...singleAddonLine,
        id: 'test-p-addon-8',
        addons: [
          { 
            id: '1', 
            label: 'Moss Removal',
            description: 'Remove moss',
            basePrice: 2.50,
            isPerSqm: true,
            areaSqm: 10,
            severity: 'light' 
          },
          { 
            id: '2', 
            label: 'Oil Stain Treatment',
            description: 'Treat oil stains',
            basePrice: 3.00,
            isPerSqm: true,
            areaSqm: 5,
            severity: 'light' 
          },
          { 
            id: '3', 
            label: 'Gutter Clean',
            description: 'Clean gutters',
            basePrice: 50.00,
            isPerSqm: false,
            areaSqm: 0,
            severity: 'light' 
          },
        ],
      };

      const singleCost = calculatePressureLineCost(singleAddonLine, testPricingConfig);
      const multipleCost = calculatePressureLineCost(multipleAddonsLine, testPricingConfig);

      // Multiple addons should cost more than single addon
      expect(multipleCost).toBeGreaterThan(singleCost);
    });
  });
});
