/**
 * @tictacstick/calculation-engine - Modifiers Data
 * 
 * Ported from v1.x conditions-modifiers.js
 * Australian window/pressure cleaning conditions and modifiers
 */

import {
  Modifier,
  WindowCondition,
  AccessModifier,
  PressureCondition,
  TechniqueModifier,
  ModifierCategory,
} from '../types';

// ==================== WINDOW CONDITIONS ====================

/**
 * Window conditions that affect cleaning time/price
 * From v1: WINDOW_CONDITIONS array
 */
export const WINDOW_CONDITIONS: WindowCondition[] = [
  // Debris / Dirt Level
  {
    id: 'clean',
    label: 'Clean / Light Soiling',
    category: 'debris',
    timeMultiplier: 0.9,
    priceMultiplier: 1.0,
    description: 'Windows appear relatively clean with minimal dust or spots.',
    icon: 'sparkles',
    recommended: true,
  },
  {
    id: 'moderate_dust',
    label: 'Moderate Dust / Marks',
    category: 'debris',
    timeMultiplier: 1.0,
    priceMultiplier: 1.0,
    description: 'Standard dirt level; typical residential window.',
    icon: 'dust',
  },
  {
    id: 'cobwebs',
    label: 'Cobwebs / Bugs',
    category: 'debris',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Extra time to clear webs and insect residue.',
    icon: 'spider',
  },
  {
    id: 'heavy_dust',
    label: 'Heavy Dust / Grime',
    category: 'debris',
    timeMultiplier: 1.3,
    priceMultiplier: 1.2,
    description: 'Thick buildup requiring extra scrubbing.',
    icon: 'cloud',
  },
  {
    id: 'building_dust',
    label: 'Post-Construction Dust',
    category: 'debris',
    timeMultiplier: 1.5,
    priceMultiplier: 1.4,
    description: 'Fine construction dust is very difficult to remove.',
    icon: 'construction',
  },

  // Staining
  {
    id: 'water_stains',
    label: 'Hard Water Stains',
    category: 'staining',
    timeMultiplier: 1.4,
    priceMultiplier: 1.3,
    description: 'Mineral deposits from sprinklers or bore water.',
    icon: 'droplet',
  },
  {
    id: 'paint_splatter',
    label: 'Paint Splatter',
    category: 'staining',
    timeMultiplier: 1.5,
    priceMultiplier: 1.4,
    description: 'Requires careful scraping and solvent work.',
    icon: 'paint-bucket',
  },
  {
    id: 'oxidation',
    label: 'Oxidation / Haze',
    category: 'staining',
    timeMultiplier: 1.6,
    priceMultiplier: 1.5,
    description: 'Permanent glass damage may not fully clean.',
    icon: 'warning',
  },
  {
    id: 'salt_spray',
    label: 'Salt Spray (Coastal)',
    category: 'staining',
    timeMultiplier: 1.25,
    priceMultiplier: 1.15,
    description: 'Ocean salt buildup on coastal properties.',
    icon: 'waves',
  },

  // Screens & Frames
  {
    id: 'screens_light',
    label: 'Screens - Light Clean',
    category: 'screens',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Quick wipe down of removable screens.',
    icon: 'grid',
  },
  {
    id: 'screens_full',
    label: 'Screens - Full Wash',
    category: 'screens',
    timeMultiplier: 1.3,
    priceMultiplier: 1.25,
    description: 'Complete screen removal, wash, dry, reinstall.',
    icon: 'grid-full',
  },
  {
    id: 'frames_clean',
    label: 'Frames / Tracks Clean',
    category: 'screens',
    timeMultiplier: 1.2,
    priceMultiplier: 1.15,
    description: 'Detailed track and frame cleaning.',
    icon: 'square',
  },
];

// ==================== ACCESS MODIFIERS ====================

/**
 * Access modifiers affecting job difficulty
 * From v1: ACCESS_MODIFIERS array
 */
export const ACCESS_MODIFIERS: AccessModifier[] = [
  // Height / Access
  {
    id: 'ground_level',
    label: 'Ground Level',
    category: 'height',
    timeMultiplier: 1.0,
    priceMultiplier: 1.0,
    description: 'Standard ground-level access.',
    icon: 'ground',
    recommended: true,
  },
  {
    id: 'ladder_short',
    label: 'Short Ladder (< 2m)',
    category: 'height',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Step ladder or small A-frame.',
    icon: 'ladder',
  },
  {
    id: 'ladder_medium',
    label: 'Medium Ladder (2-4m)',
    category: 'height',
    timeMultiplier: 1.3,
    priceMultiplier: 1.25,
    description: 'Extension ladder work.',
    icon: 'ladder-tall',
  },
  {
    id: 'ladder_high',
    label: 'High Ladder (4m+)',
    category: 'height',
    timeMultiplier: 1.5,
    priceMultiplier: 1.4,
    description: 'Tall ladder with safety considerations.',
    icon: 'ladder-high',
  },
  {
    id: 'rope_access',
    label: 'Rope Access',
    category: 'height',
    timeMultiplier: 2.0,
    priceMultiplier: 2.0,
    description: 'Industrial rope access techniques.',
    icon: 'rope',
  },
  {
    id: 'wfp_pole',
    label: 'Water Fed Pole',
    category: 'height',
    timeMultiplier: 1.2,
    priceMultiplier: 1.1,
    description: 'Extended pole with pure water system.',
    icon: 'pole',
  },
  {
    id: 'ewp',
    label: 'Elevated Work Platform',
    category: 'height',
    timeMultiplier: 1.4,
    priceMultiplier: 1.5,
    description: 'Cherry picker or scissor lift required.',
    icon: 'ewp',
  },

  // Obstacles
  {
    id: 'furniture',
    label: 'Furniture to Move',
    category: 'obstacles',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Indoor furniture blocking access.',
    icon: 'couch',
  },
  {
    id: 'plants_garden',
    label: 'Garden / Plants',
    category: 'obstacles',
    timeMultiplier: 1.1,
    priceMultiplier: 1.05,
    description: 'Outdoor plants blocking windows.',
    icon: 'tree',
  },
  {
    id: 'pool_proximity',
    label: 'Pool Area',
    category: 'obstacles',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Working around pool requires extra care.',
    icon: 'pool',
  },
  {
    id: 'difficult_terrain',
    label: 'Difficult Terrain',
    category: 'obstacles',
    timeMultiplier: 1.2,
    priceMultiplier: 1.15,
    description: 'Slopes, uneven ground, or restricted space.',
    icon: 'mountain',
  },
  {
    id: 'roof_walk',
    label: 'Roof Walk Required',
    category: 'obstacles',
    timeMultiplier: 1.4,
    priceMultiplier: 1.35,
    description: 'Must access via walking on roof.',
    icon: 'roof',
  },
];

// ==================== PRESSURE CONDITIONS ====================

/**
 * Pressure cleaning conditions
 * From v1: PRESSURE_CONDITIONS array
 */
export const PRESSURE_CONDITIONS: PressureCondition[] = [
  // Dirt Level
  {
    id: 'light_dirt',
    label: 'Light Dirt',
    category: 'dirt',
    timeMultiplier: 0.9,
    priceMultiplier: 1.0,
    description: 'Minimal staining, quick clean.',
    icon: 'light',
  },
  {
    id: 'moderate_dirt',
    label: 'Moderate Dirt',
    category: 'dirt',
    timeMultiplier: 1.0,
    priceMultiplier: 1.0,
    description: 'Standard residential driveway.',
    icon: 'moderate',
    recommended: true,
  },
  {
    id: 'heavy_dirt',
    label: 'Heavy Dirt / Stains',
    category: 'dirt',
    timeMultiplier: 1.25,
    priceMultiplier: 1.2,
    description: 'Significant buildup requiring extra passes.',
    icon: 'heavy',
  },
  {
    id: 'oil_stains',
    label: 'Oil Stains',
    category: 'dirt',
    timeMultiplier: 1.4,
    priceMultiplier: 1.35,
    description: 'Vehicle oil requiring degreaser and dwell time.',
    icon: 'oil',
  },
  {
    id: 'rust_stains',
    label: 'Rust Stains',
    category: 'dirt',
    timeMultiplier: 1.5,
    priceMultiplier: 1.45,
    description: 'Iron staining from bore water or metal.',
    icon: 'rust',
  },

  // Organic Growth
  {
    id: 'mould_light',
    label: 'Light Mould / Algae',
    category: 'organic',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Surface growth, responds well to treatment.',
    icon: 'leaf',
  },
  {
    id: 'mould_heavy',
    label: 'Heavy Mould / Lichen',
    category: 'organic',
    timeMultiplier: 1.35,
    priceMultiplier: 1.3,
    description: 'Established growth requiring pre-treatment.',
    icon: 'mould',
  },
  {
    id: 'moss',
    label: 'Moss Growth',
    category: 'organic',
    timeMultiplier: 1.4,
    priceMultiplier: 1.35,
    description: 'Thick moss buildup in shaded areas.',
    icon: 'moss',
  },
  {
    id: 'leaf_stains',
    label: 'Leaf / Tannin Stains',
    category: 'organic',
    timeMultiplier: 1.2,
    priceMultiplier: 1.15,
    description: 'Organic staining from leaves.',
    icon: 'leaf-stain',
  },

  // Surface Condition
  {
    id: 'sealed',
    label: 'Sealed Surface',
    category: 'surface',
    timeMultiplier: 0.9,
    priceMultiplier: 1.0,
    description: 'Previously sealed, cleans easier.',
    icon: 'seal',
  },
  {
    id: 'porous',
    label: 'Porous / Unsealed',
    category: 'surface',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Absorbs stains, harder to clean.',
    icon: 'porous',
  },
  {
    id: 'damaged',
    label: 'Damaged / Cracked',
    category: 'surface',
    timeMultiplier: 1.2,
    priceMultiplier: 1.15,
    description: 'Cracks and chips require care.',
    icon: 'crack',
  },
  {
    id: 'delicate',
    label: 'Delicate Surface',
    category: 'surface',
    timeMultiplier: 1.3,
    priceMultiplier: 1.25,
    description: 'Limestone, sandstone, aged pavers.',
    icon: 'delicate',
  },
];

// ==================== TECHNIQUE MODIFIERS ====================

/**
 * Technique/method modifiers
 * From v1: TECHNIQUE_MODIFIERS array
 */
export const TECHNIQUE_MODIFIERS: TechniqueModifier[] = [
  // Window Techniques
  {
    id: 'traditional',
    label: 'Traditional Squeegee',
    category: 'window',
    timeMultiplier: 1.0,
    priceMultiplier: 1.0,
    description: 'Standard hand cleaning with squeegee.',
    icon: 'squeegee',
    recommended: true,
  },
  {
    id: 'pure_water',
    label: 'Pure Water System',
    category: 'window',
    timeMultiplier: 0.85,
    priceMultiplier: 1.0,
    description: 'Deionized water for spot-free finish.',
    icon: 'water',
  },
  {
    id: 'restoration',
    label: 'Glass Restoration',
    category: 'window',
    timeMultiplier: 2.0,
    priceMultiplier: 2.5,
    description: 'Polishing to remove scratches and stains.',
    icon: 'polish',
  },

  // Pressure Techniques
  {
    id: 'hot_water',
    label: 'Hot Water Pressure',
    category: 'pressure',
    timeMultiplier: 0.85,
    priceMultiplier: 1.15,
    description: 'Hot water for faster grease removal.',
    icon: 'hot',
  },
  {
    id: 'soft_wash',
    label: 'Soft Wash',
    category: 'pressure',
    timeMultiplier: 1.1,
    priceMultiplier: 1.1,
    description: 'Low pressure with chemical treatment.',
    icon: 'soft',
  },
  {
    id: 'turbo_nozzle',
    label: 'Turbo Nozzle',
    category: 'pressure',
    timeMultiplier: 0.9,
    priceMultiplier: 1.0,
    description: 'Rotating nozzle for faster cleaning.',
    icon: 'turbo',
  },
  {
    id: 'surface_cleaner',
    label: 'Surface Cleaner Attachment',
    category: 'pressure',
    timeMultiplier: 0.75,
    priceMultiplier: 1.0,
    description: 'Flat surface attachment for driveways.',
    icon: 'surface',
    recommended: true,
  },

  // Treatments
  {
    id: 'pre_treatment',
    label: 'Pre-Treatment Chemical',
    category: 'treatment',
    timeMultiplier: 1.15,
    priceMultiplier: 1.1,
    description: 'Dwell time for chemical treatment.',
    icon: 'chemical',
  },
  {
    id: 'sealing',
    label: 'Sealing After Clean',
    category: 'treatment',
    timeMultiplier: 1.5,
    priceMultiplier: 1.8,
    description: 'Apply sealant after cleaning.',
    icon: 'seal-apply',
  },
  {
    id: 'anti_mould',
    label: 'Anti-Mould Treatment',
    category: 'treatment',
    timeMultiplier: 1.1,
    priceMultiplier: 1.15,
    description: 'Preventative mould treatment.',
    icon: 'shield',
  },
];

// ==================== COMBINED EXPORTS ====================

/**
 * All modifiers combined
 */
export const ALL_MODIFIERS: Modifier[] = [
  ...WINDOW_CONDITIONS,
  ...ACCESS_MODIFIERS,
  ...PRESSURE_CONDITIONS,
  ...TECHNIQUE_MODIFIERS,
];

/**
 * Create modifier lookup map
 */
export function createModifierMap(modifiers: Modifier[] = ALL_MODIFIERS): Map<string, Modifier> {
  const map = new Map<string, Modifier>();
  for (const mod of modifiers) {
    map.set(mod.id, mod);
  }
  return map;
}

/**
 * Get modifiers by category
 */
export function getModifiersByCategory(category: ModifierCategory): Modifier[] {
  return ALL_MODIFIERS.filter(m => m.category === category);
}

/**
 * Calculate combined multiplier from selected modifier IDs
 */
export function calculateCombinedMultiplier(
  modifierIds: string[],
  type: 'time' | 'price',
  modifierMap: Map<string, Modifier> = DEFAULT_MODIFIER_MAP
): number {
  let multiplier = 1.0;
  for (const id of modifierIds) {
    const mod = modifierMap.get(id);
    if (mod) {
      multiplier *= type === 'time' ? mod.timeMultiplier : mod.priceMultiplier;
    }
  }
  return multiplier;
}

/**
 * Modifier category labels for UI
 */
export const MODIFIER_CATEGORY_LABELS: Record<ModifierCategory, string> = {
  debris: 'Debris Level',
  staining: 'Staining',
  screens: 'Screens & Frames',
  height: 'Height / Access',
  obstacles: 'Obstacles',
  dirt: 'Dirt Level',
  organic: 'Organic Growth',
  surface: 'Surface Condition',
  window: 'Window Techniques',
  pressure: 'Pressure Techniques',
  treatment: 'Treatments',
};

/**
 * Default modifier map
 */
export const DEFAULT_MODIFIER_MAP = createModifierMap();
