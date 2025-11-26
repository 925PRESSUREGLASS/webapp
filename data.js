// data.js – static pricing + lookup tables

// PRICING DATA – base pane times & modifiers for AU window types
var PRICING_DATA = {
  windowTypes: [
    {
      id: "standard",
      label: "Standard Window (alias)",
      description: "Generic window type for legacy tests",
      baseMinutesInside: 4.0,
      baseMinutesOutside: 4.0
    },
    {
      id: "std1",
      label: "Standard 1x1 (small)",
      description: "Small basic pane; quick clean.",
      baseMinutesInside: 2.5,
      baseMinutesOutside: 2.5
    },
    {
      id: "std2",
      label: "Standard 1x2 (taller)",
      description: "Typical bedroom or hallway window.",
      baseMinutesInside: 3.5,
      baseMinutesOutside: 3.5
    },
    {
      id: "std3",
      label: "Standard 2x2",
      description: "Common living or dining windows.",
      baseMinutesInside: 5.0,
      baseMinutesOutside: 5.0
    },
    {
      id: "door",
      label: "Glass Door / Slider",
      description: "Sliding or hinged glass door.",
      baseMinutesInside: 4.5,
      baseMinutesOutside: 4.5
    },
    {
      id: "balustrade",
      label: "Glass Balustrade (panel)",
      description: "Balcony or pool fence panel.",
      baseMinutesInside: 3.0,
      baseMinutesOutside: 3.0
    },
    {
      id: "feature",
      label: "Feature / Picture Window",
      description: "Large fixed window with more edges.",
      baseMinutesInside: 6.0,
      baseMinutesOutside: 6.0
    }
  ],

  modifiers: {
    tint: {
      none: { label: "No Tint", factor: 1.0 },
      light: { label: "Light Tint", factor: 1.05 },
      heavy: { label: "Dark / Reflective Tint", factor: 1.1 }
    },
    soil: {
      light: { label: "Light Dust", factor: 1.0 },
      medium: { label: "Dirty", factor: 1.2 },
      heavy: { label: "Very Dirty / Built-up", factor: 1.4 }
    },
    access: {
      easy: { label: "Easy Access", factor: 1.0 },
      ladder: { label: "Ladder / Awkward", factor: 1.25 },
      highReach: { label: "High Reach Pole", factor: 1.4 }
    }
  },

  // Pressure cleaning surfaces
  pressureSurfaces: [
    {
      id: "concrete",
      label: "Concrete Surface (alias)",
      minutesPerSqm: 1.5,
      notes: "Generic concrete surface option for tests"
    },
    {
      id: "driveway",
      label: "Concrete Driveway",
      minutesPerSqm: 1.4,
      notes: "Standard concrete, average staining."
    },
    {
      id: "paving",
      label: "Paved Area",
      minutesPerSqm: 1.6,
      notes: "Brick or stone pavers, more joints/edges."
    },
    {
      id: "limestone",
      label: "Limestone / Porous",
      minutesPerSqm: 2.0,
      notes: "More absorbent, often slower."
    },
    {
      id: "deck",
      label: "Decking / Timber",
      minutesPerSqm: 1.8,
      notes: "Boards and gaps require care."
    },
    {
      id: "patio",
      label: "Patio / Alfresco Mix",
      minutesPerSqm: 1.5,
      notes: "Mixed surfaces, average difficulty."
    }
  ]
};

// Fallback extended datasets (used when extended arrays are not provided separately)
var FALLBACK_WINDOW_TYPES_EXT = [
  { id: "sliding_600", label: "Sliding 600mm", category: "sliding", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 20 },
  { id: "sliding_750", label: "Sliding 750mm", category: "sliding", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 22 },
  { id: "sliding_900", label: "Sliding 900mm", category: "sliding", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 24 },
  { id: "sliding_1200", label: "Sliding 1200mm", category: "sliding", baseMinutesInside: 5, baseMinutesOutside: 5, basePrice: 25 },
  { id: "sliding_1500", label: "Sliding 1500mm", category: "sliding", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 28 },
  { id: "sliding_1800", label: "Sliding 1800mm", category: "sliding", baseMinutesInside: 7, baseMinutesOutside: 7, basePrice: 30 },
  { id: "awning_small", label: "Awning Small", category: "awning", baseMinutesInside: 3, baseMinutesOutside: 3, basePrice: 18 },
  { id: "awning_large", label: "Awning Large", category: "awning", baseMinutesInside: 5, baseMinutesOutside: 5, basePrice: 22 },
  { id: "fixed_small", label: "Fixed Small", category: "fixed", baseMinutesInside: 3, baseMinutesOutside: 3, basePrice: 16 },
  { id: "fixed_large", label: "Fixed Large", category: "fixed", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 24 },
  { id: "louvre_300", label: "Louvre 300mm", category: "louvre", baseMinutesInside: 3, baseMinutesOutside: 3, basePrice: 18, difficulty: "hard" },
  { id: "louvre_600", label: "Louvre 600mm", category: "louvre", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 22, difficulty: "hard" },
  { id: "double_hung_small", label: "Double Hung Small", category: "double", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 20 },
  { id: "double_hung_large", label: "Double Hung Large", category: "double", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 26 },
  { id: "door_glass", label: "Glass Door", category: "door", baseMinutesInside: 4, baseMinutesOutside: 4, basePrice: 25 },
  { id: "door_slider", label: "Sliding Door", category: "door", baseMinutesInside: 5, baseMinutesOutside: 5, basePrice: 26 },
  { id: "bay_window", label: "Bay Window", category: "feature", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 30 },
  { id: "picture_window", label: "Picture Window", category: "feature", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 32 },
  { id: "feature_arch", label: "Feature Arch", category: "feature", baseMinutesInside: 7, baseMinutesOutside: 7, basePrice: 34, difficulty: "hard" },
  { id: "stairwell", label: "Stairwell Window", category: "feature", baseMinutesInside: 8, baseMinutesOutside: 8, basePrice: 36, difficulty: "hard" },
  { id: "atrium", label: "Atrium Glass", category: "feature", baseMinutesInside: 9, baseMinutesOutside: 9, basePrice: 40, difficulty: "hard" },
  { id: "shopfront_small", label: "Shopfront Small", category: "commercial", baseMinutesInside: 5, baseMinutesOutside: 5, basePrice: 28 },
  { id: "shopfront_large", label: "Shopfront Large", category: "commercial", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 32 },
  { id: "skylight_small", label: "Skylight Small", category: "skylight", baseMinutesInside: 6, baseMinutesOutside: 6, basePrice: 30, difficulty: "hard" },
  { id: "skylight_large", label: "Skylight Large", category: "skylight", baseMinutesInside: 8, baseMinutesOutside: 8, basePrice: 36, difficulty: "hard" },
  { id: "balcony_glass", label: "Balcony Glass", category: "balustrade", baseMinutesInside: 5, baseMinutesOutside: 5, basePrice: 28, difficulty: "medium" }
];

var FALLBACK_PRESSURE_SURFACES_EXT = [
  { id: "driveway_concrete", label: "Driveway - Concrete", category: "driveway", minutesPerSqm: 1.4, baseRate: 8, difficulty: "easy", notes: "Standard concrete" },
  { id: "driveway_paving", label: "Driveway - Paving", category: "driveway", minutesPerSqm: 1.6, baseRate: 9, difficulty: "medium", notes: "Pavers" },
  { id: "driveway_exposed", label: "Driveway - Exposed Aggregate", category: "driveway", minutesPerSqm: 1.7, baseRate: 10, difficulty: "medium", notes: "Aggregate" },
  { id: "driveway_stamped", label: "Driveway - Stamped Concrete", category: "driveway", minutesPerSqm: 1.6, baseRate: 9, difficulty: "medium", notes: "Stamped finish" },
  { id: "patio_concrete", label: "Patio - Concrete", category: "patio", minutesPerSqm: 1.6, baseRate: 8, difficulty: "easy", notes: "Flat patio concrete" },
  { id: "patio_limestone", label: "Patio - Limestone", category: "patio", minutesPerSqm: 1.8, baseRate: 10, difficulty: "hard", notes: "SOFT surface" },
  { id: "patio_paving", label: "Patio - Paving", category: "patio", minutesPerSqm: 1.7, baseRate: 9, difficulty: "medium", notes: "Pavers patio" },
  { id: "deck_timber", label: "Deck - Timber", category: "decking", minutesPerSqm: 1.9, baseRate: 11, difficulty: "hard", notes: "Delicate timber" },
  { id: "deck_composite", label: "Deck - Composite", category: "decking", minutesPerSqm: 1.7, baseRate: 10, difficulty: "medium", notes: "Composite boards" },
  { id: "pool_surround", label: "Pool Surround", category: "patio", minutesPerSqm: 1.6, baseRate: 9, difficulty: "medium", notes: "Mixed surfaces" },
  { id: "roof_tile", label: "Roof - Tile", category: "roof", minutesPerSqm: 2.2, baseRate: 12, difficulty: "hard", notes: "Roof work" },
  { id: "roof_metal", label: "Roof - Metal", category: "roof", minutesPerSqm: 2.0, baseRate: 11, difficulty: "hard", notes: "Roof work" },
  { id: "roof_asbestos", label: "Roof - Asbestos", category: "roof", minutesPerSqm: 3.0, baseRate: 15, difficulty: "extreme", notes: "Special handling" },
  { id: "wall_brick", label: "Wall - Brick", category: "walls", minutesPerSqm: 1.5, baseRate: 8, difficulty: "medium", notes: "Walls" },
  { id: "wall_render", label: "Wall - Render", category: "walls", minutesPerSqm: 1.7, baseRate: 9, difficulty: "medium", notes: "Render" },
  { id: "wall_cladding", label: "Wall - Cladding", category: "walls", minutesPerSqm: 1.6, baseRate: 9, difficulty: "medium", notes: "Cladding" },
  { id: "path_concrete", label: "Path - Concrete", category: "paths", minutesPerSqm: 1.4, baseRate: 7, difficulty: "easy", notes: "Concrete path" },
  { id: "path_paver", label: "Path - Paver", category: "paths", minutesPerSqm: 1.6, baseRate: 8, difficulty: "medium", notes: "Paver path" },
  { id: "garage_floor", label: "Garage Floor", category: "garage", minutesPerSqm: 1.5, baseRate: 8, difficulty: "easy", notes: "Garage" },
  { id: "carpark", label: "Car Park", category: "commercial", minutesPerSqm: 1.3, baseRate: 7, difficulty: "easy", notes: "Large flat" },
  { id: "factory_floor", label: "Factory Floor", category: "commercial", minutesPerSqm: 1.5, baseRate: 8, difficulty: "medium", notes: "Factory" },
  { id: "warehouse", label: "Warehouse", category: "commercial", minutesPerSqm: 1.4, baseRate: 7, difficulty: "easy", notes: "Warehouse" },
  { id: "tennis_court", label: "Tennis Court", category: "sports", minutesPerSqm: 1.8, baseRate: 10, difficulty: "hard", notes: "Sports court" },
  { id: "basketball_court", label: "Basketball Court", category: "sports", minutesPerSqm: 1.7, baseRate: 9, difficulty: "medium", notes: "Sports court" },
  { id: "playground", label: "Playground", category: "public", minutesPerSqm: 1.9, baseRate: 11, difficulty: "hard", notes: "Playground" },
  { id: "steps", label: "Steps", category: "paths", minutesPerSqm: 1.8, baseRate: 10, difficulty: "medium", notes: "Steps" },
  { id: "retaining_wall", label: "Retaining Wall", category: "walls", minutesPerSqm: 1.7, baseRate: 9, difficulty: "medium", notes: "Retaining" },
  { id: "bin_area", label: "Bin Area", category: "commercial", minutesPerSqm: 1.6, baseRate: 9, difficulty: "medium", notes: "Bin area" },
  { id: "graffiti_wall", label: "Graffiti Wall", category: "walls", minutesPerSqm: 2.0, baseRate: 12, difficulty: "hard", notes: "Graffiti removal" },
  { id: "solar_panel", label: "Solar Panel Cleaning", category: "roof", minutesPerSqm: 2.5, baseRate: 14, difficulty: "hard", notes: "Roof delicate" },
  { id: "fence_wood", label: "Fence Wood", category: "fence", minutesPerSqm: 1.6, baseRate: 8, difficulty: "medium", notes: "Fence" },
  { id: "fence_colorbond", label: "Fence Colorbond", category: "fence", minutesPerSqm: 1.4, baseRate: 7, difficulty: "easy", notes: "Fence" }
];

// Quick lookup maps
var windowTypeMap = {};
var pressureSurfaceMap = {};
var windowConditionMap = {};
var accessModifierMap = {};

// Feature flag: enable extended Australian window types
var USE_EXTENDED_TYPES = true;

function mergeUniqueById(baseArr, extraArr) {
  var map = {};
  var result = [];
  var i;
  for (i = 0; i < baseArr.length; i++) {
    map[baseArr[i].id] = true;
    result.push(baseArr[i]);
  }
  for (i = 0; i < extraArr.length; i++) {
    if (!map[extraArr[i].id]) {
      map[extraArr[i].id] = true;
      result.push(extraArr[i]);
    }
  }
  return result;
}

(function initDataMaps() {
  // Ensure extended arrays exist even if not provided externally
  if (!window.WINDOW_TYPES_ARRAY || !window.WINDOW_TYPES_ARRAY.length) {
    window.WINDOW_TYPES_ARRAY = mergeUniqueById(PRICING_DATA.windowTypes, FALLBACK_WINDOW_TYPES_EXT);
  }
  if (!window.PRESSURE_SURFACES_ARRAY_EXT || !window.PRESSURE_SURFACES_ARRAY_EXT.length) {
    window.PRESSURE_SURFACES_ARRAY_EXT = mergeUniqueById(PRICING_DATA.pressureSurfaces, FALLBACK_PRESSURE_SURFACES_EXT);
  }

  // Build window type map
  var windowTypesToUse = PRICING_DATA.windowTypes;

  // If extended types are available and enabled, merge them
  if (USE_EXTENDED_TYPES && window.WINDOW_TYPES_ARRAY) {
    // Keep original types for backward compatibility
    // Add extended types after, removing duplicates
    windowTypesToUse = mergeUniqueById(PRICING_DATA.windowTypes, WINDOW_TYPES_ARRAY);
  }

  // Build map
  for (var i = 0; i < windowTypesToUse.length; i++) {
    var wt = windowTypesToUse[i];
    windowTypeMap[wt.id] = wt;
  }

  // Build pressure surface map
  for (var j = 0; j < PRICING_DATA.pressureSurfaces.length; j++) {
    var ps = PRICING_DATA.pressureSurfaces[j];
    pressureSurfaceMap[ps.id] = ps;
  }

  // Build condition maps if available
  if (window.WINDOW_CONDITIONS_ARRAY) {
    for (var k = 0; k < WINDOW_CONDITIONS_ARRAY.length; k++) {
      var cond = WINDOW_CONDITIONS_ARRAY[k];
      windowConditionMap[cond.id] = cond;
    }
  }

  if (window.ACCESS_MODIFIERS_ARRAY) {
    for (var m = 0; m < ACCESS_MODIFIERS_ARRAY.length; m++) {
      var acc = ACCESS_MODIFIERS_ARRAY[m];
      accessModifierMap[acc.id] = acc;
    }
  }
})();

// Helper: Get all available window types
function getAvailableWindowTypes() {
  if (USE_EXTENDED_TYPES && window.WINDOW_TYPES_ARRAY) {
    return PRICING_DATA.windowTypes.concat(WINDOW_TYPES_ARRAY);
  }
  return PRICING_DATA.windowTypes;
}

// Helper: Get condition multiplier by ID or legacy level
function getConditionMultiplier(conditionIdOrLevel) {
  if (!conditionIdOrLevel) return 1.0;

  // Try new system first
  if (windowConditionMap[conditionIdOrLevel]) {
    return windowConditionMap[conditionIdOrLevel].multiplier;
  }

  // Fall back to legacy soil levels
  if (PRICING_DATA.modifiers && PRICING_DATA.modifiers.soil) {
    var legacySoil = PRICING_DATA.modifiers.soil[conditionIdOrLevel];
    if (legacySoil) return legacySoil.factor;
  }

  // Default multipliers for legacy values
  if (conditionIdOrLevel === 'light') return 1.0;
  if (conditionIdOrLevel === 'medium') return 1.2;
  if (conditionIdOrLevel === 'heavy') return 1.4;

  return 1.0;
}

// Helper: Get access multiplier by ID or legacy level
function getAccessMultiplier(accessIdOrLevel) {
  if (!accessIdOrLevel) return 1.0;

  // Try new system first
  if (accessModifierMap[accessIdOrLevel]) {
    return accessModifierMap[accessIdOrLevel].multiplier;
  }

  // Fall back to legacy access levels
  if (PRICING_DATA.modifiers && PRICING_DATA.modifiers.access) {
    var legacyAccess = PRICING_DATA.modifiers.access[accessIdOrLevel];
    if (legacyAccess) return legacyAccess.factor;
  }

  // Default multipliers for legacy values
  if (accessIdOrLevel === 'easy') return 1.0;
  if (accessIdOrLevel === 'ladder') return 1.25;
  if (accessIdOrLevel === 'highReach') return 1.4;

  return 1.0;
}
