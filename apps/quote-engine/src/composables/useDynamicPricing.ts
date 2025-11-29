/**
 * useDynamicPricing Composable
 * 
 * Bridges API pricing data from meta-api to the calculation engine format.
 * Provides functions to create window type and pressure surface maps from dynamic data.
 * Falls back to hardcoded data from calculation-engine when API data unavailable.
 */

import { computed } from 'vue';
import { usePricingStore } from '../stores/pricing';
import {
  type WindowTypeConfig,
  type PressureSurfaceConfig,
  createWindowTypeMap as createDefaultWindowTypeMap,
  createPressureSurfaceMap as createDefaultPressureSurfaceMap,
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
} from '@tictacstick/calculation-engine';

// API service type from meta-api
interface ApiServiceType {
  id: string;
  code: string;
  name: string;
  description: string;
  baseRate: number;
  baseMinutesPerUnit: number;
  unit: string;
  tags: string[];
  serviceLine: {
    id: string;
    name: string;
    category?: string;
  };
}

// API modifier from meta-api
interface ApiModifier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  flatAdjust: number | null;
  scope: string;
  tags: string[];
}

/**
 * Convert API service type to WindowTypeConfig
 */
function apiToWindowTypeConfig(st: ApiServiceType): WindowTypeConfig {
  return {
    id: st.code, // Use code as ID for compatibility
    label: st.name,
    baseMinutesInside: st.baseMinutesPerUnit,
    baseMinutesOutside: st.baseMinutesPerUnit,
  };
}

/**
 * Convert API service type to PressureSurfaceConfig
 */
function apiToPressureSurfaceConfig(st: ApiServiceType): PressureSurfaceConfig {
  // For pressure cleaning, baseMinutesPerUnit is per sqm
  return {
    id: st.code,
    label: st.name,
    minutesPerSqm: st.baseMinutesPerUnit,
  };
}

/**
 * Main composable function
 */
export function useDynamicPricing() {
  const pricingStore = usePricingStore();

  // Computed: Create window type map from API data
  const dynamicWindowTypeMap = computed((): Map<string, WindowTypeConfig> => {
    if (!pricingStore.isLoaded || pricingStore.serviceTypes.length === 0) {
      // Fall back to defaults
      return createDefaultWindowTypeMap();
    }

    const map = new Map<string, WindowTypeConfig>();
    
    // Filter to window-related service types
    pricingStore.serviceTypes.forEach(st => {
      const apiSt = st as unknown as ApiServiceType;
      if (apiSt.code.startsWith('WIN-') || apiSt.tags?.includes('window')) {
        const config = apiToWindowTypeConfig(apiSt);
        map.set(config.id, config);
      }
    });

    // If no window types found from API, use defaults
    if (map.size === 0) {
      return createDefaultWindowTypeMap();
    }

    return map;
  });

  // Computed: Create pressure surface map from API data
  const dynamicPressureSurfaceMap = computed((): Map<string, PressureSurfaceConfig> => {
    if (!pricingStore.isLoaded || pricingStore.serviceTypes.length === 0) {
      return createDefaultPressureSurfaceMap();
    }

    const map = new Map<string, PressureSurfaceConfig>();
    
    // Filter to pressure-related service types (non-window)
    pricingStore.serviceTypes.forEach(st => {
      const apiSt = st as unknown as ApiServiceType;
      if (!apiSt.code.startsWith('WIN-') && !apiSt.tags?.includes('window')) {
        const config = apiToPressureSurfaceConfig(apiSt);
        map.set(config.id, config);
      }
    });

    // If no pressure surfaces found from API, use defaults
    if (map.size === 0) {
      return createDefaultPressureSurfaceMap();
    }

    return map;
  });

  // Computed: Condition multipliers from API modifiers
  const dynamicConditionMultipliers = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    
    // Start with defaults from calculation engine
    WINDOW_CONDITIONS.forEach(c => {
      map.set(c.id, c.priceMultiplier);
    });

    // Override with API modifiers if available
    if (pricingStore.isLoaded) {
      pricingStore.modifiers.forEach(mod => {
        const apiMod = mod as unknown as ApiModifier;
        if (apiMod.tags?.includes('soil') || apiMod.tags?.includes('tint')) {
          // Map API modifier IDs to condition IDs
          const conditionId = mapModifierToConditionId(apiMod);
          if (conditionId) {
            map.set(conditionId, apiMod.multiplier);
          }
        }
      });
    }

    return map;
  });

  // Computed: Access multipliers from API modifiers
  const dynamicAccessMultipliers = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    
    // Start with defaults
    ACCESS_MODIFIERS.forEach(a => {
      map.set(a.id, a.priceMultiplier);
    });

    // Override with API modifiers if available
    if (pricingStore.isLoaded) {
      pricingStore.modifiers.forEach(mod => {
        const apiMod = mod as unknown as ApiModifier;
        if (apiMod.tags?.includes('access') || apiMod.tags?.includes('ladder')) {
          const accessId = mapModifierToAccessId(apiMod);
          if (accessId) {
            map.set(accessId, apiMod.multiplier);
          }
        }
      });
    }

    return map;
  });

  // Helper: Map API modifier to condition ID
  function mapModifierToConditionId(mod: ApiModifier): string | null {
    const idMap: Record<string, string> = {
      'mod-soil-dirty': 'dirty',
      'mod-soil-very-dirty': 'very-dirty',
      'mod-tint-light': 'light_tint',
      'mod-tint-heavy': 'heavy_tint',
    };
    return idMap[mod.id] || null;
  }

  // Helper: Map API modifier to access ID
  function mapModifierToAccessId(mod: ApiModifier): string | null {
    const idMap: Record<string, string> = {
      'mod-access-ladder': 'ladder',
      'mod-access-highreach': 'highReach',
    };
    return idMap[mod.id] || null;
  }

  // Get condition multiplier with API override
  function getConditionMultiplier(id: string): number {
    return dynamicConditionMultipliers.value.get(id) ?? 1.0;
  }

  // Get access multiplier with API override
  function getAccessMultiplier(id: string): number {
    return dynamicAccessMultipliers.value.get(id) ?? 1.0;
  }

  // Check if using dynamic pricing
  const isUsingDynamicPricing = computed(() => {
    return pricingStore.isLoaded && pricingStore.serviceTypes.length > 0;
  });

  // Get pricing source info
  const pricingSource = computed(() => {
    if (!pricingStore.isLoaded) {
      return { type: 'default', message: 'Using default pricing (loading...)' };
    }
    if (pricingStore.error) {
      return { type: 'cached', message: pricingStore.error };
    }
    if (pricingStore.serviceTypes.length === 0) {
      return { type: 'default', message: 'Using default pricing (no API data)' };
    }
    return { 
      type: 'api', 
      message: `Using API pricing (${pricingStore.serviceTypes.length} service types)`,
      lastUpdated: pricingStore.lastUpdated,
    };
  });

  return {
    // Maps
    dynamicWindowTypeMap,
    dynamicPressureSurfaceMap,
    dynamicConditionMultipliers,
    dynamicAccessMultipliers,
    
    // Lookup functions
    getConditionMultiplier,
    getAccessMultiplier,
    
    // Status
    isUsingDynamicPricing,
    pricingSource,
    
    // Store reference for direct access
    pricingStore,
  };
}

export default useDynamicPricing;
