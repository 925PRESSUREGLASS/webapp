/**
 * @tictacstick/calculation-engine - Window Types Data
 * 
 * Ported from v1.x data.js and window-types-extended.js
 * Australian window types with pricing and time estimates
 */

import { WindowType, WindowCategory } from '../types';

/**
 * Core window types - basic selection
 */
export const CORE_WINDOW_TYPES: WindowType[] = [
  {
    id: 'std1',
    label: 'Standard 1x1 (small)',
    description: 'Small basic pane; quick clean.',
    category: 'fixed',
    baseMinutesInside: 2.5,
    baseMinutesOutside: 2.5,
    basePrice: 16,
  },
  {
    id: 'std2',
    label: 'Standard 1x2 (taller)',
    description: 'Typical bedroom or hallway window.',
    category: 'fixed',
    baseMinutesInside: 3.5,
    baseMinutesOutside: 3.5,
    basePrice: 20,
  },
  {
    id: 'std3',
    label: 'Standard 2x2',
    description: 'Common living or dining windows.',
    category: 'fixed',
    baseMinutesInside: 5.0,
    baseMinutesOutside: 5.0,
    basePrice: 24,
  },
  {
    id: 'door',
    label: 'Glass Door / Slider',
    description: 'Sliding or hinged glass door.',
    category: 'door',
    baseMinutesInside: 4.5,
    baseMinutesOutside: 4.5,
    basePrice: 25,
  },
  {
    id: 'balustrade',
    label: 'Glass Balustrade (panel)',
    description: 'Balcony or pool fence panel.',
    category: 'balustrade',
    baseMinutesInside: 3.0,
    baseMinutesOutside: 3.0,
    basePrice: 22,
  },
  {
    id: 'feature',
    label: 'Feature / Picture Window',
    description: 'Large fixed window with more edges.',
    category: 'feature',
    baseMinutesInside: 6.0,
    baseMinutesOutside: 6.0,
    basePrice: 32,
  },
];

/**
 * Extended Australian window types - full selection
 */
export const EXTENDED_WINDOW_TYPES: WindowType[] = [
  // Sliding windows by size
  {
    id: 'sliding_600',
    label: 'Sliding 600mm',
    category: 'sliding',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 20,
  },
  {
    id: 'sliding_750',
    label: 'Sliding 750mm',
    category: 'sliding',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 22,
  },
  {
    id: 'sliding_900',
    label: 'Sliding 900mm',
    category: 'sliding',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 24,
  },
  {
    id: 'sliding_1200',
    label: 'Sliding 1200mm',
    category: 'sliding',
    baseMinutesInside: 5,
    baseMinutesOutside: 5,
    basePrice: 25,
  },
  {
    id: 'sliding_1500',
    label: 'Sliding 1500mm',
    category: 'sliding',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 28,
  },
  {
    id: 'sliding_1800',
    label: 'Sliding 1800mm',
    category: 'sliding',
    baseMinutesInside: 7,
    baseMinutesOutside: 7,
    basePrice: 30,
  },

  // Awning windows
  {
    id: 'awning_small',
    label: 'Awning Small',
    category: 'awning',
    baseMinutesInside: 3,
    baseMinutesOutside: 3,
    basePrice: 18,
  },
  {
    id: 'awning_large',
    label: 'Awning Large',
    category: 'awning',
    baseMinutesInside: 5,
    baseMinutesOutside: 5,
    basePrice: 22,
  },

  // Fixed windows
  {
    id: 'fixed_small',
    label: 'Fixed Small',
    category: 'fixed',
    baseMinutesInside: 3,
    baseMinutesOutside: 3,
    basePrice: 16,
  },
  {
    id: 'fixed_large',
    label: 'Fixed Large',
    category: 'fixed',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 24,
  },

  // Louvre windows (difficult)
  {
    id: 'louvre_300',
    label: 'Louvre 300mm',
    category: 'louvre',
    baseMinutesInside: 3,
    baseMinutesOutside: 3,
    basePrice: 18,
    difficulty: 'hard',
  },
  {
    id: 'louvre_600',
    label: 'Louvre 600mm',
    category: 'louvre',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 22,
    difficulty: 'hard',
  },

  // Double hung windows
  {
    id: 'double_hung_small',
    label: 'Double Hung Small',
    category: 'double',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 20,
  },
  {
    id: 'double_hung_large',
    label: 'Double Hung Large',
    category: 'double',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 26,
  },

  // Doors
  {
    id: 'door_glass',
    label: 'Glass Door',
    category: 'door',
    baseMinutesInside: 4,
    baseMinutesOutside: 4,
    basePrice: 25,
  },
  {
    id: 'door_slider',
    label: 'Sliding Door',
    category: 'door',
    baseMinutesInside: 5,
    baseMinutesOutside: 5,
    basePrice: 26,
  },

  // Feature windows
  {
    id: 'bay_window',
    label: 'Bay Window',
    category: 'feature',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 30,
  },
  {
    id: 'picture_window',
    label: 'Picture Window',
    category: 'feature',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 32,
  },
  {
    id: 'feature_arch',
    label: 'Feature Arch',
    category: 'feature',
    baseMinutesInside: 7,
    baseMinutesOutside: 7,
    basePrice: 34,
    difficulty: 'hard',
  },
  {
    id: 'stairwell',
    label: 'Stairwell Window',
    category: 'feature',
    baseMinutesInside: 8,
    baseMinutesOutside: 8,
    basePrice: 36,
    difficulty: 'hard',
  },
  {
    id: 'atrium',
    label: 'Atrium Glass',
    category: 'feature',
    baseMinutesInside: 9,
    baseMinutesOutside: 9,
    basePrice: 40,
    difficulty: 'hard',
  },

  // Commercial
  {
    id: 'shopfront_small',
    label: 'Shopfront Small',
    category: 'commercial',
    baseMinutesInside: 5,
    baseMinutesOutside: 5,
    basePrice: 28,
  },
  {
    id: 'shopfront_large',
    label: 'Shopfront Large',
    category: 'commercial',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 32,
  },

  // Skylights (difficult)
  {
    id: 'skylight_small',
    label: 'Skylight Small',
    category: 'skylight',
    baseMinutesInside: 6,
    baseMinutesOutside: 6,
    basePrice: 30,
    difficulty: 'hard',
  },
  {
    id: 'skylight_large',
    label: 'Skylight Large',
    category: 'skylight',
    baseMinutesInside: 8,
    baseMinutesOutside: 8,
    basePrice: 36,
    difficulty: 'hard',
  },

  // Balustrades
  {
    id: 'balcony_glass',
    label: 'Balcony Glass',
    category: 'balustrade',
    baseMinutesInside: 5,
    baseMinutesOutside: 5,
    basePrice: 28,
    difficulty: 'medium',
  },
];

/**
 * All window types combined (core + extended)
 */
export const ALL_WINDOW_TYPES: WindowType[] = [
  ...CORE_WINDOW_TYPES,
  ...EXTENDED_WINDOW_TYPES,
];

/**
 * Window type lookup map
 */
export function createWindowTypeMap(types: WindowType[] = ALL_WINDOW_TYPES): Map<string, WindowType> {
  const map = new Map<string, WindowType>();
  for (const type of types) {
    map.set(type.id, type);
  }
  return map;
}

/**
 * Get window types by category
 */
export function getWindowTypesByCategory(category: WindowCategory): WindowType[] {
  return ALL_WINDOW_TYPES.filter(t => t.category === category);
}

/**
 * Window category labels for UI
 */
export const WINDOW_CATEGORY_LABELS: Record<WindowCategory, string> = {
  sliding: 'Sliding Windows',
  awning: 'Awning Windows',
  fixed: 'Fixed Windows',
  louvre: 'Louvre Windows',
  double: 'Double Hung',
  door: 'Glass Doors',
  feature: 'Feature Windows',
  commercial: 'Commercial',
  skylight: 'Skylights',
  balustrade: 'Balustrades',
};

/**
 * Default window type map
 */
export const DEFAULT_WINDOW_TYPE_MAP = createWindowTypeMap();
