// window-types-extended.js
// Comprehensive Australian standard window types for Perth WA market
// All dimensions in millimeters, times in minutes, prices in AUD
// ES5 compatible - no arrow functions, const/let, or template literals

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[WINDOW-TYPES-EXTENDED] Skipped in test mode');
    return;
  }

  // Australian Standard Window Types
  // Based on common residential window sizing in Perth/Western Australia
  var WINDOW_TYPES_EXTENDED = {

    // ========================================
    // SLIDING WINDOWS (Most Common in Australia)
    // ========================================

    SLIDING_600: {
      id: 'sliding_600',
      name: 'Sliding Window 600mm',
      code: 'SLD-600',
      category: 'sliding',
      width: 600,
      height: 1200,
      baseMinutesInside: 3,
      baseMinutesOutside: 3,
      basePrice: 15.00,
      description: 'Small sliding window, single door unit',
      commonLocations: 'Bathroom, laundry, small bedroom'
    },

    SLIDING_900: {
      id: 'sliding_900',
      name: 'Sliding Window 900mm',
      code: 'SLD-900',
      category: 'sliding',
      width: 900,
      height: 1200,
      baseMinutesInside: 4,
      baseMinutesOutside: 4,
      basePrice: 20.00,
      description: 'Medium sliding window',
      commonLocations: 'Bedroom, office'
    },

    SLIDING_1200: {
      id: 'sliding_1200',
      name: 'Sliding Window 1200mm',
      code: 'SLD-1200',
      category: 'sliding',
      width: 1200,
      height: 1200,
      baseMinutesInside: 5,
      baseMinutesOutside: 5,
      basePrice: 25.00,
      description: 'Large sliding window, double door unit',
      commonLocations: 'Living room, dining room'
    },

    SLIDING_1800: {
      id: 'sliding_1800',
      name: 'Sliding Window 1800mm',
      code: 'SLD-1800',
      category: 'sliding',
      width: 1800,
      height: 1200,
      baseMinutesInside: 7,
      baseMinutesOutside: 7,
      basePrice: 35.00,
      description: 'Extra large sliding, triple door unit',
      commonLocations: 'Living room, alfresco'
    },

    SLIDING_2400: {
      id: 'sliding_2400',
      name: 'Sliding Window 2400mm',
      code: 'SLD-2400',
      category: 'sliding',
      width: 2400,
      height: 1200,
      baseMinutesInside: 9,
      baseMinutesOutside: 9,
      basePrice: 45.00,
      description: 'Quad sliding door unit',
      commonLocations: 'Large living areas, entertainment rooms'
    },

    // ========================================
    // AWNING WINDOWS (Top-Hinged)
    // ========================================

    AWNING_600: {
      id: 'awning_600',
      name: 'Awning Window 600mm',
      code: 'AWN-600',
      category: 'awning',
      width: 600,
      height: 600,
      baseMinutesInside: 2,
      baseMinutesOutside: 2,
      basePrice: 12.00,
      description: 'Small awning/hopper window',
      commonLocations: 'Bathroom, toilet, laundry'
    },

    AWNING_900: {
      id: 'awning_900',
      name: 'Awning Window 900mm',
      code: 'AWN-900',
      category: 'awning',
      width: 900,
      height: 600,
      baseMinutesInside: 3,
      baseMinutesOutside: 3,
      basePrice: 15.00,
      description: 'Medium awning window',
      commonLocations: 'Kitchen, bedroom'
    },

    AWNING_1200: {
      id: 'awning_1200',
      name: 'Awning Window 1200mm',
      code: 'AWN-1200',
      category: 'awning',
      width: 1200,
      height: 600,
      baseMinutesInside: 4,
      baseMinutesOutside: 4,
      basePrice: 18.00,
      description: 'Large awning window',
      commonLocations: 'Living areas, bedrooms'
    },

    // ========================================
    // FIXED WINDOWS (Non-Opening)
    // ========================================

    FIXED_900: {
      id: 'fixed_900',
      name: 'Fixed Window 900mm',
      code: 'FIX-900',
      category: 'fixed',
      width: 900,
      height: 1200,
      baseMinutesInside: 3,
      baseMinutesOutside: 3,
      basePrice: 15.00,
      description: 'Standard fixed glass panel',
      commonLocations: 'Feature windows, sidelights'
    },

    FIXED_1200: {
      id: 'fixed_1200',
      name: 'Fixed Window 1200mm',
      code: 'FIX-1200',
      category: 'fixed',
      width: 1200,
      height: 1200,
      baseMinutesInside: 4,
      baseMinutesOutside: 4,
      basePrice: 20.00,
      description: 'Medium fixed glass panel',
      commonLocations: 'Living room, hallway'
    },

    FIXED_1800: {
      id: 'fixed_1800',
      name: 'Fixed Window 1800mm',
      code: 'FIX-1800',
      category: 'fixed',
      width: 1800,
      height: 1200,
      baseMinutesInside: 5,
      baseMinutesOutside: 5,
      basePrice: 25.00,
      description: 'Large fixed panel',
      commonLocations: 'Picture windows, feature walls'
    },

    FIXED_2400: {
      id: 'fixed_2400',
      name: 'Fixed Window 2400mm',
      code: 'FIX-2400',
      category: 'fixed',
      width: 2400,
      height: 2100,
      baseMinutesInside: 8,
      baseMinutesOutside: 8,
      basePrice: 40.00,
      description: 'Large fixed panel, floor to ceiling',
      commonLocations: 'Feature windows, modern homes'
    },

    // ========================================
    // CASEMENT WINDOWS (Side-Hinged)
    // ========================================

    CASEMENT_600: {
      id: 'casement_600',
      name: 'Casement Window 600mm',
      code: 'CSM-600',
      category: 'casement',
      width: 600,
      height: 1200,
      baseMinutesInside: 4,
      baseMinutesOutside: 4,
      basePrice: 18.00,
      description: 'Single casement, hand crank',
      commonLocations: 'Kitchen, bathroom'
    },

    CASEMENT_900: {
      id: 'casement_900',
      name: 'Casement Window 900mm',
      code: 'CSM-900',
      category: 'casement',
      width: 900,
      height: 1200,
      baseMinutesInside: 5,
      baseMinutesOutside: 5,
      basePrice: 22.00,
      description: 'Medium casement window',
      commonLocations: 'Bedrooms, study'
    },

    // ========================================
    // LOUVRE WINDOWS (Multiple Glass Slats)
    // ========================================

    LOUVRE_600: {
      id: 'louvre_600',
      name: 'Louvre Window 600mm',
      code: 'LVR-600',
      category: 'louvre',
      width: 600,
      height: 900,
      baseMinutesInside: 8,
      baseMinutesOutside: 8,
      basePrice: 30.00,
      description: 'Multiple glass slats, labor intensive',
      commonLocations: 'Bathroom, laundry, older homes',
      notes: 'Time-consuming! Multiple slats to clean individually'
    },

    LOUVRE_900: {
      id: 'louvre_900',
      name: 'Louvre Window 900mm',
      code: 'LVR-900',
      category: 'louvre',
      width: 900,
      height: 900,
      baseMinutesInside: 12,
      baseMinutesOutside: 12,
      basePrice: 45.00,
      description: 'Large louvre, many slats',
      commonLocations: 'Living areas in older homes',
      notes: 'Very time-consuming! Quote carefully'
    },

    // ========================================
    // BI-FOLD WINDOWS/DOORS
    // ========================================

    BIFOLD_2400: {
      id: 'bifold_2400',
      name: 'Bi-fold Door 2400mm',
      code: 'BFD-2400',
      category: 'bifold',
      width: 2400,
      height: 2100,
      baseMinutesInside: 15,
      baseMinutesOutside: 15,
      basePrice: 70.00,
      description: '3-panel bi-fold door',
      commonLocations: 'Alfresco, patio access',
      notes: 'Multiple panels, frames, and tracks to clean'
    },

    BIFOLD_3600: {
      id: 'bifold_3600',
      name: 'Bi-fold Door 3600mm',
      code: 'BFD-3600',
      category: 'bifold',
      width: 3600,
      height: 2100,
      baseMinutesInside: 20,
      baseMinutesOutside: 20,
      basePrice: 95.00,
      description: '4-5 panel bi-fold door system',
      commonLocations: 'Large alfresco, indoor-outdoor living',
      notes: 'Complex system, many tracks and seals'
    },

    // ========================================
    // STACKER DOORS (Sliding Cavity)
    // ========================================

    STACKER_2400: {
      id: 'stacker_2400',
      name: 'Stacker Door 2400mm',
      code: 'STK-2400',
      category: 'stacker',
      width: 2400,
      height: 2100,
      baseMinutesInside: 12,
      baseMinutesOutside: 12,
      basePrice: 60.00,
      description: '2-panel stacker door',
      commonLocations: 'Alfresco, dining room access'
    },

    STACKER_3600: {
      id: 'stacker_3600',
      name: 'Stacker Door 3600mm',
      code: 'STK-3600',
      category: 'stacker',
      width: 3600,
      height: 2100,
      baseMinutesInside: 18,
      baseMinutesOutside: 18,
      basePrice: 85.00,
      description: '3-panel stacker door',
      commonLocations: 'Large living areas, entertainment rooms'
    },

    // ========================================
    // SKYLIGHTS (Roof Windows)
    // ========================================

    SKYLIGHT_600: {
      id: 'skylight_600',
      name: 'Skylight 600x600mm',
      code: 'SKY-600',
      category: 'skylight',
      width: 600,
      height: 600,
      baseMinutesInside: 10,
      baseMinutesOutside: 10,
      basePrice: 40.00,
      description: 'Roof skylight, requires ladder/height access',
      commonLocations: 'Bathroom, hallway, kitchen',
      notes: 'Difficult access, ladder work, charge premium'
    },

    SKYLIGHT_900: {
      id: 'skylight_900',
      name: 'Skylight 900x900mm',
      code: 'SKY-900',
      category: 'skylight',
      width: 900,
      height: 900,
      baseMinutesInside: 15,
      baseMinutesOutside: 15,
      basePrice: 60.00,
      description: 'Large skylight',
      commonLocations: 'Living areas, vaulted ceilings',
      notes: 'Requires roof access, safety considerations'
    },

    // ========================================
    // ADDITIONAL SIZES
    // ========================================

    FIXED_600: {
      id: 'fixed_600',
      name: 'Fixed Window 600mm',
      code: 'FIX-600',
      category: 'fixed',
      width: 600,
      height: 1200,
      baseMinutesInside: 2,
      baseMinutesOutside: 2,
      basePrice: 12.00,
      description: 'Small fixed glass panel',
      commonLocations: 'Sidelights, small feature windows'
    },

    BIFOLD_4800: {
      id: 'bifold_4800',
      name: 'Bi-fold Door 4800mm',
      code: 'BFD-4800',
      category: 'bifold',
      width: 4800,
      height: 2100,
      baseMinutesInside: 28,
      baseMinutesOutside: 28,
      basePrice: 120.00,
      description: '6-panel bi-fold door system',
      commonLocations: 'Large alfresco, premium homes',
      notes: 'Very large system, premium pricing'
    },

    STACKER_4800: {
      id: 'stacker_4800',
      name: 'Stacker Door 4800mm',
      code: 'STK-4800',
      category: 'stacker',
      width: 4800,
      height: 2100,
      baseMinutesInside: 24,
      baseMinutesOutside: 24,
      basePrice: 110.00,
      description: '4-panel stacker door',
      commonLocations: 'Very large openings, luxury homes'
    },

    SKYLIGHT_1200: {
      id: 'skylight_1200',
      name: 'Skylight 1200x1200mm',
      code: 'SKY-1200',
      category: 'skylight',
      width: 1200,
      height: 1200,
      baseMinutesInside: 18,
      baseMinutesOutside: 18,
      basePrice: 80.00,
      description: 'Very large skylight',
      commonLocations: 'Large living areas, cathedral ceilings',
      notes: 'Difficult access, premium pricing'
    },

    // ========================================
    // CUSTOM SIZE (User Input)
    // ========================================

    CUSTOM: {
      id: 'custom',
      name: 'Custom Size Window',
      code: 'CUSTOM',
      category: 'custom',
      width: null,
      height: null,
      baseMinutesInside: null,
      baseMinutesOutside: null,
      basePrice: null,
      description: 'Non-standard size, manual entry',
      notes: 'Will be calculated based on dimensions entered'
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  var WindowTypeHelpers = {

    /**
     * Get window type by ID
     * @param {string} typeId - The window type ID
     * @returns {Object|null} Window type object or null if not found
     */
    getType: function(typeId) {
      if (!typeId) return null;
      for (var key in WINDOW_TYPES_EXTENDED) {
        if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
          if (WINDOW_TYPES_EXTENDED[key].id === typeId) {
            return WINDOW_TYPES_EXTENDED[key];
          }
        }
      }
      return null;
    },

    /**
     * Get all window types
     * @returns {Object} All window types
     */
    getAllTypes: function() {
      return WINDOW_TYPES_EXTENDED;
    },

    /**
     * Get window types by category
     * @param {string} category - Category name (sliding, awning, fixed, etc.)
     * @returns {Array} Array of window types in that category
     */
    getTypesByCategory: function(category) {
      var results = [];
      for (var key in WINDOW_TYPES_EXTENDED) {
        if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
          var type = WINDOW_TYPES_EXTENDED[key];
          if (type.category === category) {
            results.push(type);
          }
        }
      }
      return results;
    },

    /**
     * Calculate time for window type
     * @param {string} typeId - Window type ID
     * @param {number} quantity - Number of windows
     * @param {boolean} inside - Clean inside?
     * @param {boolean} outside - Clean outside?
     * @returns {number} Total minutes
     */
    calculateTime: function(typeId, quantity, inside, outside) {
      var type = this.getType(typeId);
      if (!type) return 0;

      var timeIn = inside ? (type.baseMinutesInside || 0) : 0;
      var timeOut = outside ? (type.baseMinutesOutside || 0) : 0;
      var timePerWindow = timeIn + timeOut;

      return Math.round(timePerWindow * quantity);
    },

    /**
     * Calculate base price for window type
     * @param {string} typeId - Window type ID
     * @param {number} quantity - Number of windows
     * @returns {number} Base price in dollars
     */
    calculateBasePrice: function(typeId, quantity) {
      var type = this.getType(typeId);
      if (!type || !type.basePrice) return 0;

      return type.basePrice * quantity;
    },

    /**
     * Get difficulty level for a window type
     * @param {string} typeId - Window type ID
     * @returns {string} Difficulty level (easy, medium, hard)
     */
    getDifficulty: function(typeId) {
      var type = this.getType(typeId);
      if (!type) return 'medium';

      // Determine difficulty based on category and size
      if (type.category === 'louvre') return 'hard';
      if (type.category === 'bifold' || type.category === 'stacker') return 'hard';
      if (type.category === 'skylight') return 'hard';
      if (type.category === 'casement') return 'medium';
      if (type.width >= 2400) return 'medium';

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
        'hard': 1.5
      };
      return multipliers[difficulty] || 1.0;
    },

    /**
     * Search window types by name or description
     * @param {string} query - Search query
     * @returns {Array} Matching window types
     */
    searchTypes: function(query) {
      if (!query) return [];

      var results = [];
      var lowerQuery = query.toLowerCase();

      for (var key in WINDOW_TYPES_EXTENDED) {
        if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
          var type = WINDOW_TYPES_EXTENDED[key];
          var nameMatch = type.name && type.name.toLowerCase().indexOf(lowerQuery) !== -1;
          var descMatch = type.description && type.description.toLowerCase().indexOf(lowerQuery) !== -1;
          var codeMatch = type.code && type.code.toLowerCase().indexOf(lowerQuery) !== -1;

          if (nameMatch || descMatch || codeMatch) {
            results.push(type);
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

      for (var key in WINDOW_TYPES_EXTENDED) {
        if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
          var cat = WINDOW_TYPES_EXTENDED[key].category;
          if (cat && !seen[cat]) {
            categories.push(cat);
            seen[cat] = true;
          }
        }
      }

      return categories;
    },

    /**
     * Get window type by code
     * @param {string} code - Window type code (e.g., 'SLD-1200')
     * @returns {Object|null} Window type or null
     */
    getTypeByCode: function(code) {
      if (!code) return null;

      for (var key in WINDOW_TYPES_EXTENDED) {
        if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
          if (WINDOW_TYPES_EXTENDED[key].code === code) {
            return WINDOW_TYPES_EXTENDED[key];
          }
        }
      }

      return null;
    }
  };

  // Convert to array format compatible with existing system
  var WINDOW_TYPES_ARRAY = [];

  for (var key in WINDOW_TYPES_EXTENDED) {
    if (WINDOW_TYPES_EXTENDED.hasOwnProperty(key)) {
      var wt = WINDOW_TYPES_EXTENDED[key];
      WINDOW_TYPES_ARRAY.push({
        id: wt.id,
        label: wt.name,
        description: wt.description,
        baseMinutesInside: wt.baseMinutesInside,
        baseMinutesOutside: wt.baseMinutesOutside,
        code: wt.code,
        category: wt.category,
        width: wt.width,
        height: wt.height,
        basePrice: wt.basePrice,
        commonLocations: wt.commonLocations,
        notes: wt.notes
      });
    }
  }

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('windowTypesExtended', {
      types: WINDOW_TYPES_EXTENDED,
      helpers: WindowTypeHelpers,
      getType: WindowTypeHelpers.getType.bind(WindowTypeHelpers),
      getAllTypes: WindowTypeHelpers.getAllTypes.bind(WindowTypeHelpers),
      calculateTime: WindowTypeHelpers.calculateTime.bind(WindowTypeHelpers),
      calculateBasePrice: WindowTypeHelpers.calculateBasePrice.bind(WindowTypeHelpers),
      searchTypes: WindowTypeHelpers.searchTypes.bind(WindowTypeHelpers)
    });
  }

  // Export globally
  window.WINDOW_TYPES_EXTENDED = WINDOW_TYPES_EXTENDED;
  window.WINDOW_TYPES_ARRAY = WINDOW_TYPES_ARRAY;
  window.WindowTypesExtended = {
    types: WINDOW_TYPES_EXTENDED,
    getType: WindowTypeHelpers.getType.bind(WindowTypeHelpers),
    getAllTypes: WindowTypeHelpers.getAllTypes.bind(WindowTypeHelpers),
    getTypesByCategory: WindowTypeHelpers.getTypesByCategory.bind(WindowTypeHelpers),
    calculateTime: WindowTypeHelpers.calculateTime.bind(WindowTypeHelpers),
    calculateBasePrice: WindowTypeHelpers.calculateBasePrice.bind(WindowTypeHelpers),
    getDifficulty: WindowTypeHelpers.getDifficulty.bind(WindowTypeHelpers),
    getDifficultyMultiplier: WindowTypeHelpers.getDifficultyMultiplier.bind(WindowTypeHelpers),
    searchTypes: WindowTypeHelpers.searchTypes.bind(WindowTypeHelpers),
    getCategories: WindowTypeHelpers.getCategories.bind(WindowTypeHelpers),
    getTypeByCode: WindowTypeHelpers.getTypeByCode.bind(WindowTypeHelpers)
  };

  console.log('[WINDOW-TYPES-EXTENDED] Loaded ' + WINDOW_TYPES_ARRAY.length + ' window types');

})();
