/**
 * @tictacstick/calculation-engine - Data Module Index
 * 
 * Re-exports all data arrays and utilities for convenient importing
 */

// Window types
export {
  CORE_WINDOW_TYPES,
  EXTENDED_WINDOW_TYPES,
  ALL_WINDOW_TYPES,
  createWindowTypeMap,
  getWindowTypesByCategory,
  WINDOW_CATEGORY_LABELS,
  DEFAULT_WINDOW_TYPE_MAP,
} from './window-types';

// Pressure surfaces
export {
  CORE_PRESSURE_SURFACES,
  EXTENDED_PRESSURE_SURFACES,
  ALL_PRESSURE_SURFACES,
  createPressureSurfaceMap,
  getSurfacesByCategory,
  SURFACE_CATEGORY_LABELS,
  DEFAULT_PRESSURE_SURFACE_MAP,
} from './pressure-surfaces';

// Modifiers
export {
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
  PRESSURE_CONDITIONS,
  TECHNIQUE_MODIFIERS,
  ALL_MODIFIERS,
  createModifierMap,
  getModifiersByCategory,
  calculateCombinedMultiplier,
  MODIFIER_CATEGORY_LABELS,
  DEFAULT_MODIFIER_MAP,
} from './modifiers';
