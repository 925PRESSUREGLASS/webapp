// data.js – static pricing + lookup tables

// PRICING DATA – base pane times & modifiers for AU window types
var PRICING_DATA = {
  windowTypes: [
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

// Quick lookup maps
var windowTypeMap = {};
var pressureSurfaceMap = {};
var windowConditionMap = {};
var accessModifierMap = {};

// Feature flag: enable extended Australian window types
var USE_EXTENDED_TYPES = true;

(function initDataMaps() {
  // Build window type map
  var windowTypesToUse = PRICING_DATA.windowTypes;

  // If extended types are available and enabled, merge them
  if (USE_EXTENDED_TYPES && window.WINDOW_TYPES_ARRAY) {
    // Keep original types for backward compatibility
    // Add extended types after
    windowTypesToUse = PRICING_DATA.windowTypes.concat(WINDOW_TYPES_ARRAY);
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