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
    },

    // ========================================
    // ADDITIONAL SPECIALTY SURFACES
    // ========================================

    PATIO_SANDSTONE: {
      id: 'patio_sandstone',
      name: 'Sandstone Paving',
      code: 'PAT-SAND',
      category: 'patio',
      minutesPerSqm: 2.4,
      baseRate: 14.00,
      description: 'Natural sandstone, gentle cleaning',
      notes: 'DELICATE: Low pressure only, can stain easily'
    },

    WALL_LIMESTONE: {
      id: 'wall_limestone',
      name: 'Limestone Wall',
      code: 'WALL-LIME',
      category: 'walls',
      minutesPerSqm: 2.5,
      baseRate: 12.00,
      description: 'Natural limestone blocks, soft wash',
      notes: 'Perth limestone, VERY SOFT - low pressure only!'
    },

    GARAGE_FLOOR: {
      id: 'garage_floor',
      name: 'Garage Floor (Indoor)',
      code: 'GARG-FLR',
      category: 'specialty',
      minutesPerSqm: 2.0,
      baseRate: 10.00,
      description: 'Indoor concrete, drainage concerns',
      notes: 'Must manage water runoff carefully, often oil-stained'
    },

    DRIVEWAY_BRICK: {
      id: 'driveway_brick',
      name: 'Brick Driveway',
      code: 'DRV-BRCK',
      category: 'driveway',
      minutesPerSqm: 2.3,
      baseRate: 11.00,
      description: 'Clay brick pavers',
      notes: 'Mortar joints need care, avoid displacing sand'
    },

    DECK_BAMBOO: {
      id: 'deck_bamboo',
      name: 'Bamboo Decking',
      code: 'DECK-BAMB',
      category: 'decking',
      minutesPerSqm: 1.9,
      baseRate: 11.00,
      description: 'Bamboo composite decking',
      notes: 'Low pressure, gentle approach'
    },

    ROOF_ASBESTOS: {
      id: 'roof_asbestos',
      name: 'Asbestos Roof (OLD)',
      code: 'ROOF-ASBS',
      category: 'roofing',
      minutesPerSqm: 4.0,
      baseRate: 25.00,
      description: 'OLD MATERIAL - EXTREME CARE REQUIRED',
      notes: 'MAY REQUIRE LICENSED CONTRACTOR - Check regulations!'
    },

    FENCE_BRICK: {
      id: 'fence_brick',
      name: 'Brick Fence/Wall',
      code: 'FNCE-BRCK',
      category: 'fencing',
      unit: 'linear m',
      minutesPerLinearM: 1.8,
      baseRate: 6.00,
      description: 'Brick boundary fence',
      notes: 'Common in Perth, moderate effort'
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  var SurfaceHelpers = {

    /**
     * Get surface by ID
     * @param {string} surfaceId - Surface ID
     * @returns {Object|null} Surface object or null
     */
    getSurface: function(surfaceId) {
      if (!surfaceId) return null;
      for (var key in PRESSURE_SURFACES_EXTENDED) {
        if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
          if (PRESSURE_SURFACES_EXTENDED[key].id === surfaceId) {
            return PRESSURE_SURFACES_EXTENDED[key];
          }
        }
      }
      return null;
    },

    /**
     * Get all surfaces
     * @returns {Object} All surfaces
     */
    getAllSurfaces: function() {
      return PRESSURE_SURFACES_EXTENDED;
    },

    /**
     * Get surfaces by category
     * @param {string} category - Category name
     * @returns {Array} Array of surfaces in that category
     */
    getSurfacesByCategory: function(category) {
      var results = [];
      for (var key in PRESSURE_SURFACES_EXTENDED) {
        if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
          var surface = PRESSURE_SURFACES_EXTENDED[key];
          if (surface.category === category) {
            results.push(surface);
          }
        }
      }
      return results;
    },

    /**
     * Calculate time for surface
     * @param {string} surfaceId - Surface ID
     * @param {number} quantity - Area/length/count
     * @returns {number} Total minutes
     */
    calculateTime: function(surfaceId, quantity) {
      var surface = this.getSurface(surfaceId);
      if (!surface) return 0;

      // Determine which time metric to use
      var timePerUnit = surface.minutesPerSqm ||
                        surface.minutesPerLinearM ||
                        surface.minutesPerPanel ||
                        0;

      return Math.round(timePerUnit * quantity);
    },

    /**
     * Calculate base price for surface
     * @param {string} surfaceId - Surface ID
     * @param {number} quantity - Area/length/count
     * @returns {number} Base price in dollars
     */
    calculateBasePrice: function(surfaceId, quantity) {
      var surface = this.getSurface(surfaceId);
      if (!surface || !surface.baseRate) return 0;

      return surface.baseRate * quantity;
    },

    /**
     * Get difficulty level for a surface
     * @param {string} surfaceId - Surface ID
     * @returns {string} Difficulty level (easy, medium, hard, extreme)
     */
    getDifficulty: function(surfaceId) {
      var surface = this.getSurface(surfaceId);
      if (!surface) return 'medium';

      // Determine difficulty based on category and notes
      if (surface.category === 'roofing') return 'hard';
      if (surface.id === 'roof_asbestos') return 'extreme';
      if (surface.notes && surface.notes.indexOf('DELICATE') !== -1) return 'hard';
      if (surface.notes && surface.notes.indexOf('SOFT') !== -1) return 'hard';
      if (surface.baseRate >= 12.00) return 'medium';

      return 'easy';
    },

    /**
     * Get difficulty multiplier
     * @param {string} difficulty - Difficulty level
     * @returns {number} Multiplier
     */
    getDifficultyMultiplier: function(difficulty) {
      var multipliers = {
        'easy': 1.0,
        'medium': 1.2,
        'hard': 1.5,
        'extreme': 2.0
      };
      return multipliers[difficulty] || 1.0;
    },

    /**
     * Search surfaces by name or description
     * @param {string} query - Search query
     * @returns {Array} Matching surfaces
     */
    searchSurfaces: function(query) {
      if (!query) return [];

      var results = [];
      var lowerQuery = query.toLowerCase();

      for (var key in PRESSURE_SURFACES_EXTENDED) {
        if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
          var surface = PRESSURE_SURFACES_EXTENDED[key];
          var nameMatch = surface.name && surface.name.toLowerCase().indexOf(lowerQuery) !== -1;
          var descMatch = surface.description && surface.description.toLowerCase().indexOf(lowerQuery) !== -1;
          var codeMatch = surface.code && surface.code.toLowerCase().indexOf(lowerQuery) !== -1;

          if (nameMatch || descMatch || codeMatch) {
            results.push(surface);
          }
        }
      }

      return results;
    },

    /**
     * Get categories list
     * @returns {Array} List of unique categories
     */
    getCategories: function() {
      var categories = [];
      var seen = {};

      for (var key in PRESSURE_SURFACES_EXTENDED) {
        if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
          var cat = PRESSURE_SURFACES_EXTENDED[key].category;
          if (cat && !seen[cat]) {
            categories.push(cat);
            seen[cat] = true;
          }
        }
      }

      return categories;
    },

    /**
     * Get surface by code
     * @param {string} code - Surface code (e.g., 'DRV-CONC')
     * @returns {Object|null} Surface or null
     */
    getSurfaceByCode: function(code) {
      if (!code) return null;

      for (var key in PRESSURE_SURFACES_EXTENDED) {
        if (PRESSURE_SURFACES_EXTENDED.hasOwnProperty(key)) {
          if (PRESSURE_SURFACES_EXTENDED[key].code === code) {
            return PRESSURE_SURFACES_EXTENDED[key];
          }
        }
      }

      return null;
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

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('pressureSurfacesExtended', {
      surfaces: PRESSURE_SURFACES_EXTENDED,
      helpers: SurfaceHelpers,
      getSurface: SurfaceHelpers.getSurface.bind(SurfaceHelpers),
      getAllSurfaces: SurfaceHelpers.getAllSurfaces.bind(SurfaceHelpers),
      calculateTime: SurfaceHelpers.calculateTime.bind(SurfaceHelpers),
      calculateBasePrice: SurfaceHelpers.calculateBasePrice.bind(SurfaceHelpers),
      searchSurfaces: SurfaceHelpers.searchSurfaces.bind(SurfaceHelpers)
    });
  }

  // Export globally
  window.PRESSURE_SURFACES_EXTENDED = PRESSURE_SURFACES_EXTENDED;
  window.PRESSURE_SURFACES_ARRAY_EXT = PRESSURE_SURFACES_ARRAY;
  window.PressureSurfacesExtended = {
    surfaces: PRESSURE_SURFACES_EXTENDED,
    getSurface: SurfaceHelpers.getSurface.bind(SurfaceHelpers),
    getAllSurfaces: SurfaceHelpers.getAllSurfaces.bind(SurfaceHelpers),
    getSurfacesByCategory: SurfaceHelpers.getSurfacesByCategory.bind(SurfaceHelpers),
    calculateTime: SurfaceHelpers.calculateTime.bind(SurfaceHelpers),
    calculateBasePrice: SurfaceHelpers.calculateBasePrice.bind(SurfaceHelpers),
    getDifficulty: SurfaceHelpers.getDifficulty.bind(SurfaceHelpers),
    getDifficultyMultiplier: SurfaceHelpers.getDifficultyMultiplier.bind(SurfaceHelpers),
    searchSurfaces: SurfaceHelpers.searchSurfaces.bind(SurfaceHelpers),
    getCategories: SurfaceHelpers.getCategories.bind(SurfaceHelpers),
    getSurfaceByCode: SurfaceHelpers.getSurfaceByCode.bind(SurfaceHelpers)
  };

  console.log('[PRESSURE-SURFACES-EXTENDED] Loaded ' + PRESSURE_SURFACES_ARRAY.length + ' pressure surface types');

})();
