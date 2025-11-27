/**
 * @tictacstick/calculation-engine - Pressure Surfaces Data
 * 
 * Ported from v1.x data.js and pressure-surfaces-extended.js
 * Australian pressure cleaning surfaces with pricing and time estimates
 */

import { PressureSurface, PressureSurfaceCategory } from '../types';

/**
 * Core pressure surfaces - basic selection
 */
export const CORE_PRESSURE_SURFACES: PressureSurface[] = [
  {
    id: 'driveway',
    label: 'Concrete Driveway',
    category: 'driveway',
    minutesPerSqm: 1.4,
    baseRate: 8,
    difficulty: 'easy',
    notes: 'Standard concrete, average staining.',
  },
  {
    id: 'paving',
    label: 'Paved Area',
    category: 'patio',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Brick or stone pavers, more joints/edges.',
  },
  {
    id: 'limestone',
    label: 'Limestone / Porous',
    category: 'patio',
    minutesPerSqm: 2.0,
    baseRate: 10,
    difficulty: 'hard',
    notes: 'More absorbent, often slower.',
  },
  {
    id: 'deck',
    label: 'Decking / Timber',
    category: 'decking',
    minutesPerSqm: 1.8,
    baseRate: 11,
    difficulty: 'hard',
    notes: 'Boards and gaps require care.',
  },
  {
    id: 'patio',
    label: 'Patio / Alfresco Mix',
    category: 'patio',
    minutesPerSqm: 1.5,
    baseRate: 8,
    difficulty: 'medium',
    notes: 'Mixed surfaces, average difficulty.',
  },
];

/**
 * Extended pressure surfaces - full selection
 */
export const EXTENDED_PRESSURE_SURFACES: PressureSurface[] = [
  // Driveways
  {
    id: 'driveway_concrete',
    label: 'Driveway - Concrete',
    category: 'driveway',
    minutesPerSqm: 1.4,
    baseRate: 8,
    difficulty: 'easy',
    notes: 'Standard concrete',
  },
  {
    id: 'driveway_paving',
    label: 'Driveway - Paving',
    category: 'driveway',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Pavers',
  },
  {
    id: 'driveway_exposed',
    label: 'Driveway - Exposed Aggregate',
    category: 'driveway',
    minutesPerSqm: 1.7,
    baseRate: 10,
    difficulty: 'medium',
    notes: 'Aggregate',
  },
  {
    id: 'driveway_stamped',
    label: 'Driveway - Stamped Concrete',
    category: 'driveway',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Stamped finish',
  },

  // Patios
  {
    id: 'patio_concrete',
    label: 'Patio - Concrete',
    category: 'patio',
    minutesPerSqm: 1.6,
    baseRate: 8,
    difficulty: 'easy',
    notes: 'Flat patio concrete',
  },
  {
    id: 'patio_limestone',
    label: 'Patio - Limestone',
    category: 'patio',
    minutesPerSqm: 1.8,
    baseRate: 10,
    difficulty: 'hard',
    notes: 'SOFT surface',
  },
  {
    id: 'patio_paving',
    label: 'Patio - Paving',
    category: 'patio',
    minutesPerSqm: 1.7,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Pavers patio',
  },
  {
    id: 'pool_surround',
    label: 'Pool Surround',
    category: 'patio',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Mixed surfaces',
  },

  // Decking
  {
    id: 'deck_timber',
    label: 'Deck - Timber',
    category: 'decking',
    minutesPerSqm: 1.9,
    baseRate: 11,
    difficulty: 'hard',
    notes: 'Delicate timber',
  },
  {
    id: 'deck_composite',
    label: 'Deck - Composite',
    category: 'decking',
    minutesPerSqm: 1.7,
    baseRate: 10,
    difficulty: 'medium',
    notes: 'Composite boards',
  },

  // Roofs
  {
    id: 'roof_tile',
    label: 'Roof - Tile',
    category: 'roof',
    minutesPerSqm: 2.2,
    baseRate: 12,
    difficulty: 'hard',
    notes: 'Roof work',
  },
  {
    id: 'roof_metal',
    label: 'Roof - Metal',
    category: 'roof',
    minutesPerSqm: 2.0,
    baseRate: 11,
    difficulty: 'hard',
    notes: 'Roof work',
  },
  {
    id: 'roof_asbestos',
    label: 'Roof - Asbestos',
    category: 'roof',
    minutesPerSqm: 3.0,
    baseRate: 15,
    difficulty: 'extreme',
    notes: 'Special handling',
  },
  {
    id: 'solar_panel',
    label: 'Solar Panel Cleaning',
    category: 'roof',
    minutesPerSqm: 2.5,
    baseRate: 14,
    difficulty: 'hard',
    notes: 'Roof delicate',
  },

  // Walls
  {
    id: 'wall_brick',
    label: 'Wall - Brick',
    category: 'walls',
    minutesPerSqm: 1.5,
    baseRate: 8,
    difficulty: 'medium',
    notes: 'Walls',
  },
  {
    id: 'wall_render',
    label: 'Wall - Render',
    category: 'walls',
    minutesPerSqm: 1.7,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Render',
  },
  {
    id: 'wall_cladding',
    label: 'Wall - Cladding',
    category: 'walls',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Cladding',
  },
  {
    id: 'retaining_wall',
    label: 'Retaining Wall',
    category: 'walls',
    minutesPerSqm: 1.7,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Retaining',
  },
  {
    id: 'graffiti_wall',
    label: 'Graffiti Wall',
    category: 'walls',
    minutesPerSqm: 2.0,
    baseRate: 12,
    difficulty: 'hard',
    notes: 'Graffiti removal',
  },

  // Paths
  {
    id: 'path_concrete',
    label: 'Path - Concrete',
    category: 'paths',
    minutesPerSqm: 1.4,
    baseRate: 7,
    difficulty: 'easy',
    notes: 'Concrete path',
  },
  {
    id: 'path_paver',
    label: 'Path - Paver',
    category: 'paths',
    minutesPerSqm: 1.6,
    baseRate: 8,
    difficulty: 'medium',
    notes: 'Paver path',
  },
  {
    id: 'steps',
    label: 'Steps',
    category: 'paths',
    minutesPerSqm: 1.8,
    baseRate: 10,
    difficulty: 'medium',
    notes: 'Steps',
  },

  // Garage
  {
    id: 'garage_floor',
    label: 'Garage Floor',
    category: 'garage',
    minutesPerSqm: 1.5,
    baseRate: 8,
    difficulty: 'easy',
    notes: 'Garage',
  },

  // Commercial
  {
    id: 'carpark',
    label: 'Car Park',
    category: 'commercial',
    minutesPerSqm: 1.3,
    baseRate: 7,
    difficulty: 'easy',
    notes: 'Large flat',
  },
  {
    id: 'factory_floor',
    label: 'Factory Floor',
    category: 'commercial',
    minutesPerSqm: 1.5,
    baseRate: 8,
    difficulty: 'medium',
    notes: 'Factory',
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    category: 'commercial',
    minutesPerSqm: 1.4,
    baseRate: 7,
    difficulty: 'easy',
    notes: 'Warehouse',
  },
  {
    id: 'bin_area',
    label: 'Bin Area',
    category: 'commercial',
    minutesPerSqm: 1.6,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Bin area',
  },

  // Sports
  {
    id: 'tennis_court',
    label: 'Tennis Court',
    category: 'sports',
    minutesPerSqm: 1.8,
    baseRate: 10,
    difficulty: 'hard',
    notes: 'Sports court',
  },
  {
    id: 'basketball_court',
    label: 'Basketball Court',
    category: 'sports',
    minutesPerSqm: 1.7,
    baseRate: 9,
    difficulty: 'medium',
    notes: 'Sports court',
  },

  // Public
  {
    id: 'playground',
    label: 'Playground',
    category: 'public',
    minutesPerSqm: 1.9,
    baseRate: 11,
    difficulty: 'hard',
    notes: 'Playground',
  },

  // Fences
  {
    id: 'fence_wood',
    label: 'Fence Wood',
    category: 'fence',
    minutesPerSqm: 1.6,
    baseRate: 8,
    difficulty: 'medium',
    notes: 'Fence',
  },
  {
    id: 'fence_colorbond',
    label: 'Fence Colorbond',
    category: 'fence',
    minutesPerSqm: 1.4,
    baseRate: 7,
    difficulty: 'easy',
    notes: 'Fence',
  },
];

/**
 * All pressure surfaces combined
 */
export const ALL_PRESSURE_SURFACES: PressureSurface[] = [
  ...CORE_PRESSURE_SURFACES,
  ...EXTENDED_PRESSURE_SURFACES,
];

/**
 * Pressure surface lookup map
 */
export function createPressureSurfaceMap(
  surfaces: PressureSurface[] = ALL_PRESSURE_SURFACES
): Map<string, PressureSurface> {
  const map = new Map<string, PressureSurface>();
  for (const surface of surfaces) {
    map.set(surface.id, surface);
  }
  return map;
}

/**
 * Get surfaces by category
 */
export function getSurfacesByCategory(category: PressureSurfaceCategory): PressureSurface[] {
  return ALL_PRESSURE_SURFACES.filter(s => s.category === category);
}

/**
 * Surface category labels for UI
 */
export const SURFACE_CATEGORY_LABELS: Record<PressureSurfaceCategory, string> = {
  driveway: 'Driveways',
  patio: 'Patios & Pool',
  decking: 'Decking',
  roof: 'Roofs & Solar',
  walls: 'Walls',
  paths: 'Paths & Steps',
  garage: 'Garage',
  commercial: 'Commercial',
  sports: 'Sports',
  public: 'Public Areas',
  fence: 'Fences',
};

/**
 * Default surface map
 */
export const DEFAULT_PRESSURE_SURFACE_MAP = createPressureSurfaceMap();
