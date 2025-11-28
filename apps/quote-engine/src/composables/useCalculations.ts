/**
 * useCalculations Composable
 * 
 * Provides shared calculation utilities for window and pressure cleaning costs.
 * Centralizes multiplier lookups and type map creation to avoid duplication.
 */

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

// Memoized type maps - created once at module level and exported
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
 */
export function useCalculations() {
  return {
    // Memoized type maps
    windowTypeMap,
    pressureSurfaceMap,
    
    // Multiplier lookup functions
    getConditionMultiplier,
    getAccessMultiplier,
    getConditionTimeMultiplier,
    getAccessTimeMultiplier,
    
    // Cost calculation helpers
    calculateWindowLineCost,
    calculatePressureLineCost,
    
    // Time calculation helpers
    calculateWindowLineTime,
    calculatePressureLineTime,
    
    // Re-export condition and access data for UI
    conditions: WINDOW_CONDITIONS,
    accessModifiers: ACCESS_MODIFIERS,
  };
}

// Default export for convenience
export default useCalculations;
