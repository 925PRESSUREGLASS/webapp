// pressure-surfaces-extended.js
// Extended pressure washing surface types for Perth WA
// 25+ surface types with accurate pricing and time estimates
// ES5 compatible

(function() {
  'use strict';

  var PRESSURE_SURFACES_EXTENDED = {

    // DRIVEWAYS
    DRIVEWAY_CONCRETE: {
      id: 'driveway_concrete',
      name: 'Concrete Driveway',
      code: 'DRV-CONC',
      category: 'driveway',
      minutesPerSqm: 1.4,
      baseRate: 8.00,
      description: 'Standard concrete, average staining',
      notes: 'Most common Perth driveway type'
    },

    DRIVEWAY_EXPOSED: {
      id: 'driveway_exposed',
      name: 'Exposed Aggregate Driveway',
      code: 'DRV-EXP',
      category: 'driveway',
      minutesPerSqm: 2.0,
      baseRate: 10.00,
      description: 'Exposed aggregate, requires gentlepressure',
      notes: 'Popular in Perth, needs careful cleaning to avoid damage'
    },

    DRIVEWAY_PAVER: {
      id: 'driveway_paver',
      name: 'Paver Driveway',
      code: 'DRV-PAVR',
      category: 'driveway',
      minutesPerSqm: 2.2,
      baseRate: 12.00,
      description: 'Interlocking pavers, detailed work',
      notes: 'Many joints, requires careful cleaning'
    },

    DRIVEWAY_ASPHALT: {
      id: 'driveway_asphalt',
      name: 'Asphalt/Bitumen Driveway',
      code: 'DRV-ASPH',
      category: 'driveway',
      minutesPerSqm: 1.2,
      baseRate: 6.00,
      description: 'Sealed asphalt, quick clean',
      notes: 'Less common in Perth, straightforward'
    },

    // PATIOS & OUTDOOR LIVING
    PATIO_CONCRETE: {
      id: 'patio_concrete',
      name: 'Concrete Patio',
      code: 'PAT-CONC',
      category: 'patio',
      minutesPerSqm: 1.6,
      baseRate: 9.00,
      description: 'Outdoor patio slab',
      notes: 'Standard alfresco area'
    },

    PATIO_LIMESTONE: {
      id: 'patio_limestone',
      name: 'Limestone Paving',
      code: 'PAT-LIME',
      category: 'patio',
      minutesPerSqm: 2.5,
      baseRate: 15.00,
      description: 'Perth limestone, soft wash only',
      notes: 'CRITICAL: Low pressure only, limestone is soft!'
    },

    PATIO_TILE: {
      id: 'patio_tile',
      name: 'Outdoor Tiles',
      code: 'PAT-TILE',
      category: 'patio',
      minutesPerSqm: 1.8,
      baseRate: 10.00,
      description: 'Ceramic/porcelain outdoor tiles',
      notes: 'Common in modern Perth homes'
    },

    PATIO_TRAVERTINE: {
      id: 'patio_travertine',
      name: 'Travertine Paving',
      code: 'PAT-TRAV',
      category: 'patio',
      minutesPerSqm: 2.2,
      baseRate: 13.00,
      description: 'Natural stone, careful cleaning',
      notes: 'Popular in upmarket Perth properties'
    },

    // DECKING
    DECKING_TIMBER: {
      id: 'decking_timber',
      name: 'Timber Decking',
      code: 'DECK-TMBR',
      category: 'decking',
      minutesPerSqm: 2.0,
      baseRate: 12.00,
      description: 'Timber deck, requires low pressure',
      notes: 'CARE: Low pressure to avoid damage, boards and gaps'
    },

    DECKING_COMPOSITE: {
      id: 'decking_composite',
      name: 'Composite Decking',
      code: 'DECK-COMP',
      category: 'decking',
      minutesPerSqm: 1.7,
      baseRate: 10.00,
      description: 'Composite/Trex decking',
      notes: 'More durable than timber, easier to clean'
    },

    // PATHWAYS
    PATHWAY_CONCRETE: {
      id: 'pathway_concrete',
      name: 'Concrete Path',
      code: 'PATH-CONC',
      category: 'pathway',
      minutesPerSqm: 1.5,
      baseRate: 7.00,
      description: 'Standard concrete pathway',
      notes: 'Common front/side paths'
    },

    PATHWAY_PAVER: {
      id: 'pathway_paver',
      name: 'Paver Path',
      code: 'PATH-PAVR',
      category: 'pathway',
      minutesPerSqm: 1.8,
      baseRate: 10.00,
      description: 'Brick or stone pavers',
      notes: 'Many joints, moderate effort'
    },

    PATHWAY_GRAVEL: {
      id: 'pathway_gravel',
      name: 'Gravel/Aggregate Path',
      code: 'PATH-GRVL',
      category: 'pathway',
      minutesPerSqm: 1.2,
      baseRate: 6.00,
      description: 'Loose gravel or aggregate',
      notes: 'Be careful not to displace gravel'
    },

    // WALLS & FENCES
    WALL_BRICK: {
      id: 'wall_brick',
      name: 'Brick Wall',
      code: 'WALL-BRCK',
      category: 'walls',
      minutesPerSqm: 2.0,
      baseRate: 8.00,
      description: 'Standard brick exterior',
      notes: 'Common Perth boundary walls'
    },

    WALL_RENDER: {
      id: 'wall_render',
      name: 'Rendered Wall',
      code: 'WALL-RNDR',
      category: 'walls',
      minutesPerSqm: 1.8,
      baseRate: 7.00,
      description: 'Smooth render, careful pressure',
      notes: 'Modern Perth homes, avoid damage to render'
    },

    WALL_HEBEL: {
      id: 'wall_hebel',
      name: 'Hebel/AAC Block',
      code: 'WALL-HEBL',
      category: 'walls',
      minutesPerSqm: 2.2,
      baseRate: 9.00,
      description: 'Aerated concrete, low pressure',
      notes: 'Common in Perth, porous material'
    },

    FENCE_TIMBER: {
      id: 'fence_timber',
      name: 'Timber Fence',
      code: 'FNCE-TMBR',
      category: 'fencing',
      unit: 'linear m',
      minutesPerLinearM: 1.5,
      baseRate: 5.00,
      description: 'Both sides if accessible',
      notes: 'Low pressure to avoid splintering'
    },

    FENCE_COLORBOND: {
      id: 'fence_colorbond',
      name: 'Colorbond Fence',
      code: 'FNCE-CLRB',
      category: 'fencing',
      unit: 'linear m',
      minutesPerLinearM: 1.2,
      baseRate: 4.00,
      description: 'Metal fence panels',
      notes: 'Very common in Perth, quick to clean'
    },

    // ROOFS
    ROOF_TILE: {
      id: 'roof_tile',
      name: 'Tile Roof',
      code: 'ROOF-TILE',
      category: 'roofing',
      minutesPerSqm: 3.0,
      baseRate: 15.00,
      description: 'Terracotta/concrete tiles, slow careful work',
      notes: 'SAFETY: Requires roof access, careful pressure'
    },

    ROOF_COLORBOND: {
      id: 'roof_colorbond',
      name: 'Colorbond Roof',
      code: 'ROOF-CLRB',
      category: 'roofing',
      minutesPerSqm: 2.5,
      baseRate: 12.00,
      description: 'Metal roof, careful pressure',
      notes: 'Common in Perth, avoid walking on panels'
    },

    // POOL AREAS
    POOL_PAVING: {
      id: 'pool_paving',
      name: 'Pool Paving',
      code: 'POOL-PAVG',
      category: 'pool',
      minutesPerSqm: 2.0,
      baseRate: 12.00,
      description: 'Pool surrounds, careful near water',
      notes: 'Extra care around pool edge and equipment'
    },

    POOL_TILES: {
      id: 'pool_tiles',
      name: 'Pool Tiles (Waterline)',
      code: 'POOL-TILE',
      category: 'pool',
      unit: 'linear m',
      minutesPerLinearM: 3.0,
      baseRate: 15.00,
      description: 'Calcium/scale removal',
      notes: 'Specialized cleaning, often requires acid'
    },

    // SPECIALTY SURFACES
    TENNIS_COURT: {
      id: 'tennis_court',
      name: 'Tennis Court',
      code: 'TNIS',
      category: 'specialty',
      minutesPerSqm: 1.5,
      baseRate: 7.00,
      description: 'Hard court surface',
      notes: 'Large area, straightforward'
    },

    SOLAR_PANELS: {
      id: 'solar_panels',
      name: 'Solar Panel Cleaning',
      code: 'SOLAR',
      category: 'specialty',
      unit: 'per panel',
      minutesPerPanel: 2.5,
      baseRate: 8.00,
      description: 'Pure water, no chemicals',
      notes: 'CRITICAL: Pure water only, no chemicals or soaps!'
    },

    GUTTER_CLEAN: {
      id: 'gutter_clean',
      name: 'Gutter Cleaning',
      code: 'GUTR',
      category: 'specialty',
      unit: 'linear m',
      minutesPerLinearM: 2.0,
      baseRate: 6.00,
      description: 'Clear debris, flush clean',
      notes: 'Ladder work, safety considerations'
    },

    CARPORT: {
      id: 'carport',
      name: 'Carport Slab',
      code: 'CRPT',
      category: 'driveway',
      minutesPerSqm: 1.3,
      baseRate: 7.00,
      description: 'Covered parking area',
      notes: 'Usually lighter soiling than exposed driveway'
    }
  };

  // Convert to array format
  var PRESSURE_SURFACES_ARRAY = [];

  for (var key in PRESSURE_SURFACES_EXTENDED) {
    if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
      var surface = PRESSURE_SURFACES_EXTENDED[key];
      PRESSURE_SURFACES_ARRAY.push({
        id: surface.id,
        label: surface.name,
        code: surface.code,
        category: surface.category,
        minutesPerSqm: surface.minutesPerSqm,
        minutesPerLinearM: surface.minutesPerLinearM,
        minutesPerPanel: surface.minutesPerPanel,
        unit: surface.unit || 'm²',
        baseRate: surface.baseRate,
        description: surface.description,
        notes: surface.notes
      });
    }
  }

  // Export globally
  window.PRESSURE_SURFACES_EXTENDED = PRESSURE_SURFACES_EXTENDED;
  window.PRESSURE_SURFACES_ARRAY_EXT = PRESSURE_SURFACES_ARRAY;

})();
