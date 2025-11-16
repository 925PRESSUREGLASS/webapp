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

(function initDataMaps() {
  for (var i = 0; i < PRICING_DATA.windowTypes.length; i++) {
    var wt = PRICING_DATA.windowTypes[i];
    windowTypeMap[wt.id] = wt;
  }
  for (var j = 0; j < PRICING_DATA.pressureSurfaces.length; j++) {
    var ps = PRICING_DATA.pressureSurfaces[j];
    pressureSurfaceMap[ps.id] = ps;
  }
})();