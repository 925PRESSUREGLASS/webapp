/**
 * useCalculations Composable
 * 
 * Provides shared calculation utilities for window and pressure cleaning costs.
 * Centralizes multiplier lookups and type map creation to avoid duplication.
 * 
 * Supports both static (default) and dynamic (API) pricing data.
 * When dynamic pricing is loaded from the API, calculations use those values.
 * Falls back to hardcoded defaults when API data is unavailable.
 */

import { computed } from 'vue';
import {
  calculateWindowCost,
  calculatePressureCost,
  calculateWindowTime,
  calculatePressureTime,
  createWindowTypeMap,
  createPressureSurfaceMap,
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
  type WindowLine,
  type PressureLine,
  type PricingConfig,
  type WindowTypeConfig,
  type PressureSurfaceConfig,
} from '@tictacstick/calculation-engine';
import { useDynamicPricing } from './useDynamicPricing';

// Static type maps - used as fallback when dynamic pricing unavailable
export const windowTypeMap: Map<string, WindowTypeConfig> = createWindowTypeMap();
export const pressureSurfaceMap: Map<string, PressureSurfaceConfig> = createPressureSurfaceMap();

// Memoized multiplier maps for O(1) lookups instead of O(n) array searches
const conditionPriceMultiplierMap = new Map<string, number>(
  WINDOW_CONDITIONS.map(c => [c.id, c.priceMultiplier])
);
const conditionTimeMultiplierMap = new Map<string, number>(
  WINDOW_CONDITIONS.map(c => [c.id, c.timeMultiplier])
);
const accessPriceMultiplierMap = new Map<string, number>(
  ACCESS_MODIFIERS.map(a => [a.id, a.priceMultiplier])
);
const accessTimeMultiplierMap = new Map<string, number>(
  ACCESS_MODIFIERS.map(a => [a.id, a.timeMultiplier])
);

/**
 * Get the price multiplier for a window condition
 * @param id - The condition ID (e.g., 'dirty', 'very-dirty')
 * @returns The price multiplier (defaults to 1.0 if not found)
 */
export function getConditionMultiplier(id: string): number {
  return conditionPriceMultiplierMap.get(id) ?? 1.0;
}

/**
 * Get the price multiplier for an access modifier
 * @param id - The access ID (e.g., 'ladder', 'scaffold')
 * @returns The price multiplier (defaults to 1.0 if not found)
 */
export function getAccessMultiplier(id: string): number {
  return accessPriceMultiplierMap.get(id) ?? 1.0;
}

/**
 * Get the time multiplier for a window condition
 * @param id - The condition ID
 * @returns The time multiplier (defaults to 1.0 if not found)
 */
export function getConditionTimeMultiplier(id: string): number {
  return conditionTimeMultiplierMap.get(id) ?? 1.0;
}

/**
 * Get the time multiplier for an access modifier
 * @param id - The access ID
 * @returns The time multiplier (defaults to 1.0 if not found)
 */
export function getAccessTimeMultiplier(id: string): number {
  return accessTimeMultiplierMap.get(id) ?? 1.0;
}

/**
 * Calculate the cost for a single window line
 */
export function calculateWindowLineCost(
  line: WindowLine,
  pricingConfig: PricingConfig
): number {
  return calculateWindowCost(
    line,
    pricingConfig,
    windowTypeMap,
    getConditionMultiplier,
    getAccessMultiplier
  );
}

/**
 * Calculate the cost for a single pressure line
 */
export function calculatePressureLineCost(
  line: PressureLine,
  pricingConfig: PricingConfig
): number {
  return calculatePressureCost(line, pricingConfig, pressureSurfaceMap);
}

/**
 * Calculate the time for a single window line
 */
export function calculateWindowLineTime(
  line: WindowLine,
  insideMultiplier: number = 1,
  outsideMultiplier: number = 1
): number {
  return calculateWindowTime(line, windowTypeMap, insideMultiplier, outsideMultiplier);
}

/**
 * Calculate the time for a single pressure line
 */
export function calculatePressureLineTime(line: PressureLine): number {
  return calculatePressureTime(line, pressureSurfaceMap);
}

/**
 * Main composable function
 * Returns all calculation utilities and memoized maps
 * 
 * Uses dynamic pricing from API when available, falls back to static defaults.
 */
export function useCalculations() {
  // Get dynamic pricing composable
  const dynamicPricing = useDynamicPricing();

  // Reactive window type map - uses API data when available
  const activeWindowTypeMap = computed(() => {
    if (dynamicPricing.isUsingDynamicPricing.value) {
      return dynamicPricing.dynamicWindowTypeMap.value;
    }
    return windowTypeMap;
  });

  // Reactive pressure surface map - uses API data when available
  const activePressureSurfaceMap = computed(() => {
    if (dynamicPricing.isUsingDynamicPricing.value) {
      return dynamicPricing.dynamicPressureSurfaceMap.value;
    }
    return pressureSurfaceMap;
  });

  // Dynamic condition multiplier getter
  function getDynamicConditionMultiplier(id: string): number {
    if (dynamicPricing.isUsingDynamicPricing.value) {
      return dynamicPricing.getConditionMultiplier(id);
    }
    return getConditionMultiplier(id);
  }

  // Dynamic access multiplier getter
  function getDynamicAccessMultiplier(id: string): number {
    if (dynamicPricing.isUsingDynamicPricing.value) {
      return dynamicPricing.getAccessMultiplier(id);
    }
    return getAccessMultiplier(id);
  }

  // Calculate window line cost with dynamic pricing
  function calculateWindowLineCostDynamic(
    line: WindowLine,
    pricingConfig: PricingConfig
  ): number {
    return calculateWindowCost(
      line,
      pricingConfig,
      activeWindowTypeMap.value,
      getDynamicConditionMultiplier,
      getDynamicAccessMultiplier
    );
  }

  // Calculate pressure line cost with dynamic pricing
  function calculatePressureLineCostDynamic(
    line: PressureLine,
    pricingConfig: PricingConfig
  ): number {
    return calculatePressureCost(line, pricingConfig, activePressureSurfaceMap.value);
  }

  // Calculate window line time with dynamic pricing
  function calculateWindowLineTimeDynamic(
    line: WindowLine,
    insideMultiplier: number = 1,
    outsideMultiplier: number = 1
  ): number {
    return calculateWindowTime(line, activeWindowTypeMap.value, insideMultiplier, outsideMultiplier);
  }

  // Calculate pressure line time with dynamic pricing  
  function calculatePressureLineTimeDynamic(line: PressureLine): number {
    return calculatePressureTime(line, activePressureSurfaceMap.value);
  }

  return {
    // Static type maps (for backward compatibility)
    windowTypeMap,
    pressureSurfaceMap,
    
    // Dynamic type maps (reactive, uses API data when available)
    activeWindowTypeMap,
    activePressureSurfaceMap,
    
    // Static multiplier lookup functions (for backward compatibility)
    getConditionMultiplier,
    getAccessMultiplier,
    getConditionTimeMultiplier,
    getAccessTimeMultiplier,
    
    // Dynamic multiplier lookup functions
    getDynamicConditionMultiplier,
    getDynamicAccessMultiplier,
    
    // Static cost calculation helpers (for backward compatibility)
    calculateWindowLineCost,
    calculatePressureLineCost,
    
    // Dynamic cost calculation helpers (uses API data when available)
    calculateWindowLineCostDynamic,
    calculatePressureLineCostDynamic,
    
    // Static time calculation helpers (for backward compatibility)
    calculateWindowLineTime,
    calculatePressureLineTime,
    
    // Dynamic time calculation helpers
    calculateWindowLineTimeDynamic,
    calculatePressureLineTimeDynamic,
    
    // Re-export condition and access data for UI
    conditions: WINDOW_CONDITIONS,
    accessModifiers: ACCESS_MODIFIERS,
    
    // Pricing source info
    pricingSource: dynamicPricing.pricingSource,
    isUsingDynamicPricing: dynamicPricing.isUsingDynamicPricing,
  };
}

// Default export for convenience
export default useCalculations;
