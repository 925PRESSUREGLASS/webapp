// conditions-modifiers.js
// Enhanced window conditions and access modifiers for Perth WA market
// Detailed condition assessment and difficulty factors
// ES5 compatible - no arrow functions, const/let, or template literals

(function() {
  'use strict';

  // ========================================
  // WINDOW CONDITIONS
  // Time multipliers based on dirt/stain severity
  // ========================================

  var WINDOW_CONDITIONS = {

    LIGHT_DUST: {
      id: 'light_dust',
      name: 'Light Dust',
      level: 'light',
      multiplier: 1.0,
      description: 'Recent clean, just dusty',
      notes: 'Quick wipe down, minimal effort',
      color: '#28a745'
    },

    NORMAL_DIRT: {
      id: 'normal_dirt',
      name: 'Normal Dirt',
      level: 'medium',
      multiplier: 1.2,
      description: '3-6 months since last clean',
      notes: 'Standard residential cleaning',
      color: '#ffc107'
    },

    HEAVY_DIRT: {
      id: 'heavy_dirt',
      name: 'Heavy Dirt',
      level: 'heavy',
      multiplier: 1.5,
      description: '6-12 months, visible grime',
      notes: 'Requires extra scrubbing',
      color: '#fd7e14'
    },

    SEVERE_NEGLECT: {
      id: 'severe_neglect',
      name: 'Severe Neglect',
      level: 'severe',
      multiplier: 2.0,
      description: '1+ years, heavy buildup',
      notes: 'May require multiple passes, specialized cleaning',
      color: '#dc3545'
    },

    PAINT_OVERSPRAY: {
      id: 'paint_overspray',
      name: 'Paint Overspray',
      level: 'specialist',
      multiplier: 2.5,
      description: 'Requires scraping, solvent',
      notes: 'Razor blade work, paint remover, very time-consuming',
      materials: 'Razor blades, paint remover solvent',
      color: '#6f42c1'
    },

    CONSTRUCTION_DEBRIS: {
      id: 'construction',
      name: 'Construction/Renovation',
      level: 'specialist',
      multiplier: 2.0,
      description: 'Concrete, plaster, adhesive',
      notes: 'Post-construction clean, scraping required',
      materials: 'Scrapers, acid wash, multiple cleaning agents',
      color: '#6f42c1'
    },

    HARD_WATER_STAINS: {
      id: 'hard_water',
      name: 'Hard Water Stains',
      level: 'specialist',
      multiplier: 1.8,
      description: 'Mineral buildup, requires acid',
      notes: 'Common on reticulation-affected windows, needs acid treatment',
      materials: 'Acid-based cleaner, extra rinse time',
      color: '#17a2b8'
    },

    BIRD_DROPPINGS: {
      id: 'bird_droppings',
      name: 'Bird Droppings (Heavy)',
      level: 'heavy',
      multiplier: 1.5,
      description: 'Multiple windows affected',
      notes: 'Soaking time required, detail work',
      color: '#fd7e14'
    },

    COASTAL_SALT: {
      id: 'coastal_salt',
      name: 'Coastal Salt Buildup',
      level: 'medium',
      multiplier: 1.3,
      description: 'Perth coastal properties',
      notes: 'Common in Fremantle, Scarborough areas - salt spray buildup',
      materials: 'Extra rinse cycles',
      color: '#20c997'
    },

    FLY_SPOTS: {
      id: 'fly_spots',
      name: 'Fly Spots',
      level: 'medium',
      multiplier: 1.2,
      description: 'Requires extra detail work',
      notes: 'Common in summer, window sills and edges',
      color: '#6c757d'
    },

    MOULD_MILDEW: {
      id: 'mould_mildew',
      name: 'Mould/Mildew',
      level: 'specialist',
      multiplier: 1.6,
      description: 'Requires treatment, extra care',
      notes: 'Bathroom windows, shaded areas - needs anti-fungal treatment',
      materials: 'Mould treatment solution',
      color: '#198754'
    }
  };

  // ========================================
  // ACCESS/DIFFICULTY MODIFIERS
  // Account for job difficulty beyond window condition
  // ========================================

  var ACCESS_MODIFIERS = {

    GROUND_LEVEL: {
      id: 'ground_level',
      name: 'Ground Level',
      level: 'easy',
      multiplier: 1.0,
      description: 'Easy access, no ladder',
      notes: 'Standard ground floor, walk-up access',
      color: '#28a745'
    },

    SINGLE_STORY: {
      id: 'single_story',
      name: 'Single Story (Ladder)',
      level: 'medium',
      multiplier: 1.2,
      description: 'Standard extension ladder',
      notes: 'Up to 4-5m height, standard ladder work',
      color: '#ffc107'
    },

    TWO_STORY: {
      id: 'two_story',
      name: 'Two Story',
      level: 'difficult',
      multiplier: 1.5,
      description: 'Large ladder, slower work',
      notes: '6-8m height, requires larger ladder, safety considerations',
      equipment: 'Extension ladder (7m+)',
      color: '#fd7e14'
    },

    THREE_STORY: {
      id: 'three_story',
      name: 'Three Story+',
      level: 'specialist',
      multiplier: 2.0,
      description: 'Specialized equipment, high risk',
      notes: '8m+ height, may require scaffolding or boom lift',
      equipment: 'Scaffolding or boom lift rental',
      color: '#dc3545'
    },

    DIFFICULT_ACCESS: {
      id: 'difficult_access',
      name: 'Difficult Access',
      level: 'difficult',
      multiplier: 1.8,
      description: 'Tight spaces, obstacles, balconies',
      notes: 'Narrow side passages, furniture obstacles, balcony access',
      color: '#fd7e14'
    },

    OVER_ROOF: {
      id: 'over_roof',
      name: 'Over Roof/Extension',
      level: 'specialist',
      multiplier: 1.7,
      description: 'Walking on roof, extra care',
      notes: 'Must access via roof, tile care required, safety harness recommended',
      equipment: 'Roof ladder, safety harness',
      color: '#6f42c1'
    },

    SECURITY_SCREENS: {
      id: 'security_screens',
      name: 'Security Screens (Remove)',
      level: 'medium',
      multiplier: 1.4,
      description: 'Must remove/replace screens',
      notes: 'Time to remove, clean behind, and replace security screens',
      color: '#17a2b8'
    },

    TINTED_FILM: {
      id: 'tinted_film',
      name: 'Window Film/Tint',
      level: 'delicate',
      multiplier: 1.3,
      description: 'Delicate, no scraping',
      notes: 'Must avoid scraping, gentle cleaning only, risk of film damage',
      color: '#6c757d'
    },

    STRATA_ACCESS: {
      id: 'strata_access',
      name: 'Strata/Apartment Complex',
      level: 'medium',
      multiplier: 1.2,
      description: 'Access restrictions, parking issues',
      notes: 'May require strata approval, limited parking, restricted water access',
      color: '#6c757d'
    }
  };

  // ========================================
  // PRESSURE WASHING CONDITIONS
  // Stain types and surface conditions for pressure cleaning
  // ========================================

  var PRESSURE_CONDITIONS = {

    LIGHT_GRIME: {
      id: 'light_grime',
      name: 'Light Grime',
      level: 'light',
      multiplier: 1.0,
      description: 'Surface cleaning only',
      notes: 'Recent clean, minimal buildup',
      applicableTo: ['pressure'],
      color: '#28a745'
    },

    MODERATE_GRIME: {
      id: 'moderate_grime',
      name: 'Moderate Grime',
      level: 'medium',
      multiplier: 1.3,
      description: '6-12 months buildup',
      notes: 'Standard residential cleaning',
      applicableTo: ['pressure'],
      color: '#ffc107'
    },

    HEAVY_BUILDUP: {
      id: 'heavy_buildup',
      name: 'Heavy Buildup',
      level: 'heavy',
      multiplier: 1.6,
      description: '1+ years, thick grime',
      notes: 'Requires multiple passes',
      applicableTo: ['pressure'],
      color: '#fd7e14'
    },

    OIL_STAINS: {
      id: 'oil_stains',
      name: 'Oil Stains (Driveway)',
      level: 'specialist',
      multiplier: 2.0,
      description: 'Degreaser needed, extra time',
      notes: 'Common on concrete driveways - requires hot water and degreaser',
      materials: 'Degreaser, hot water',
      applicableTo: ['pressure'],
      color: '#6f42c1'
    },

    RUST_STAINS: {
      id: 'rust_stains',
      name: 'Rust Stains',
      level: 'specialist',
      multiplier: 1.6,
      description: 'Oxalic acid treatment',
      notes: 'Common from metal furniture, reticulation - needs rust remover',
      materials: 'Oxalic acid or rust remover',
      applicableTo: ['pressure'],
      color: '#dc3545'
    },

    ALGAE_GREEN: {
      id: 'algae_green',
      name: 'Green Algae',
      level: 'medium',
      multiplier: 1.4,
      description: 'Common in Perth shade areas',
      notes: 'Slippery, requires treatment and dwell time',
      materials: 'Algae treatment solution',
      applicableTo: ['pressure'],
      color: '#198754'
    },

    LICHEN: {
      id: 'lichen',
      name: 'Lichen Growth',
      level: 'specialist',
      multiplier: 1.8,
      description: 'Requires scraping, multiple passes',
      notes: 'Very stubborn, slow removal - common on pavers and concrete',
      materials: 'Scraper, treatment solution',
      applicableTo: ['pressure'],
      color: '#6f42c1'
    },

    EFFLORESCENCE: {
      id: 'efflorescence',
      name: 'Efflorescence (White Salt)',
      level: 'specialist',
      multiplier: 1.5,
      description: 'Acid wash required',
      notes: 'Mineral deposits on concrete and brick',
      materials: 'Acid wash solution',
      applicableTo: ['pressure'],
      color: '#17a2b8'
    },

    CHEWING_GUM: {
      id: 'chewing_gum',
      name: 'Chewing Gum Removal',
      level: 'specialist',
      multiplier: 3.0,
      description: 'Hot water, scraping, very slow',
      notes: 'Extremely time-consuming - charge premium',
      materials: 'Hot water, scrapers, chemical remover',
      applicableTo: ['pressure'],
      color: '#dc3545'
    },

    GRAFFITI: {
      id: 'graffiti',
      name: 'Graffiti Removal',
      level: 'specialist',
      multiplier: 2.5,
      description: 'Chemical stripper, multiple passes',
      notes: 'May need specialist chemicals - test surface first',
      materials: 'Graffiti remover, sealers',
      applicableTo: ['pressure'],
      color: '#6f42c1'
    },

    CALCIUM_SCALE: {
      id: 'calcium_scale',
      name: 'Calcium/Scale (Pool)',
      level: 'specialist',
      multiplier: 1.7,
      description: 'Pool waterline calcium buildup',
      notes: 'Common on pool tiles - requires acid',
      materials: 'Acid solution, detail brushes',
      applicableTo: ['pressure'],
      color: '#17a2b8'
    },

    TANNIN_STAINS: {
      id: 'tannin_stains',
      name: 'Tannin Stains (Leaves)',
      level: 'medium',
      multiplier: 1.3,
      description: 'Brown leaf stains on concrete',
      notes: 'Common under trees - requires oxalic acid',
      materials: 'Oxalic acid',
      applicableTo: ['pressure'],
      color: '#6c757d'
    },

    BLACK_MOULD: {
      id: 'black_mould',
      name: 'Black Mould/Mildew',
      level: 'specialist',
      multiplier: 1.6,
      description: 'Fungicidal treatment required',
      notes: 'Requires pre-treatment and dwell time',
      materials: 'Fungicide, protective equipment',
      applicableTo: ['pressure'],
      color: '#343a40'
    },

    TYRE_MARKS: {
      id: 'tyre_marks',
      name: 'Tyre Marks',
      level: 'medium',
      multiplier: 1.4,
      description: 'Driveway tyre scuff marks',
      notes: 'Requires degreaser and scrubbing',
      materials: 'Degreaser',
      applicableTo: ['pressure'],
      color: '#6c757d'
    },

    FERTILIZER_STAINS: {
      id: 'fertilizer_stains',
      name: 'Fertilizer/Chemical Stains',
      level: 'medium',
      multiplier: 1.3,
      description: 'Garden chemical staining',
      notes: 'Discoloration from lawn treatments',
      applicableTo: ['pressure'],
      color: '#20c997'
    }
  };

  // ========================================
  // TECHNIQUE MODIFIERS
  // Special cleaning techniques that affect time/cost
  // ========================================

  var TECHNIQUE_MODIFIERS = {

    SOFT_WASH_ONLY: {
      id: 'soft_wash_only',
      name: 'Soft Wash Only',
      level: 'delicate',
      multiplier: 1.4,
      description: 'Chemical dwell time, gentle rinse',
      notes: 'Delicate surfaces (render, painted, limestone) - no high pressure',
      applicableTo: ['pressure'],
      color: '#17a2b8'
    },

    HOT_WATER_REQUIRED: {
      id: 'hot_water_required',
      name: 'Hot Water Required',
      level: 'medium',
      multiplier: 1.2,
      description: 'Hot water for grease/oil',
      notes: 'Better for oil stains and sanitization',
      equipment: 'Hot water system',
      applicableTo: ['pressure'],
      color: '#fd7e14'
    },

    ROTARY_CLEANER: {
      id: 'rotary_cleaner',
      name: 'Surface Cleaner (Rotary)',
      level: 'efficient',
      multiplier: 0.8,
      description: 'Faster for large flat areas',
      notes: 'Reduces time for driveways, patios',
      equipment: 'Rotary surface cleaner',
      applicableTo: ['pressure'],
      color: '#28a745'
    },

    DETAIL_WORK: {
      id: 'detail_work',
      name: 'Detail/Edging Work',
      level: 'slow',
      multiplier: 1.5,
      description: 'Corners, edges, grout lines',
      notes: 'Time-consuming precision work',
      applicableTo: ['pressure'],
      color: '#6c757d'
    },

    NO_WATER_ACCESS: {
      id: 'no_water_access',
      name: 'No Water Access (Tank)',
      level: 'difficult',
      multiplier: 1.5,
      description: 'Must bring water tank',
      notes: 'Slower fill times, limited capacity, extra setup',
      equipment: 'Water tank and trailer',
      applicableTo: ['pressure'],
      color: '#dc3545'
    },

    POOR_DRAINAGE: {
      id: 'poor_drainage',
      name: 'Poor Drainage',
      level: 'medium',
      multiplier: 1.3,
      description: 'Must manage runoff, squeegee work',
      notes: 'Indoor or covered areas with no drainage',
      applicableTo: ['pressure'],
      color: '#6c757d'
    },

    DELICATE_PLANTS: {
      id: 'delicate_plants',
      name: 'Delicate Plants/Garden',
      level: 'medium',
      multiplier: 1.2,
      description: 'Extra care, tarps, rinsing',
      notes: 'Must protect landscaping',
      applicableTo: ['pressure'],
      color: '#198754'
    },

    NARROW_GATE: {
      id: 'narrow_gate',
      name: 'Narrow Gate Access',
      level: 'difficult',
      multiplier: 1.4,
      description: 'Equipment hard to maneuver',
      notes: 'May need smaller equipment or hand carry',
      applicableTo: ['pressure'],
      color: '#fd7e14'
    },

    NO_VEHICLE_ACCESS: {
      id: 'no_vehicle_access',
      name: 'No Vehicle Access',
      level: 'difficult',
      multiplier: 1.6,
      description: 'Must wheelbarrow equipment',
      notes: 'Long carry distance, multiple trips',
      applicableTo: ['pressure'],
      color: '#dc3545'
    }
  };

  // ========================================
  // COMBINED CONDITION PRESETS
  // Common combinations for quick selection
  // ========================================

  var CONDITION_PRESETS = {

    NEW_HOME_CLEAN: {
      id: 'new_home',
      name: 'New Home / Post-Construction',
      condition: 'construction',
      access: 'ground_level',
      description: 'New build with construction debris',
      estimatedMultiplier: 2.0
    },

    STANDARD_RESIDENTIAL: {
      id: 'standard_resi',
      name: 'Standard Residential (6-month)',
      condition: 'normal_dirt',
      access: 'single_story',
      description: 'Typical suburban home, regular maintenance',
      estimatedMultiplier: 1.44
    },

    COASTAL_HOME: {
      id: 'coastal',
      name: 'Coastal Property',
      condition: 'coastal_salt',
      access: 'single_story',
      description: 'Perth coastal area with salt buildup',
      estimatedMultiplier: 1.56
    },

    NEGLECTED_RENTAL: {
      id: 'neglected',
      name: 'Neglected Rental Property',
      condition: 'severe_neglect',
      access: 'single_story',
      description: 'Long-term rental, minimal maintenance',
      estimatedMultiplier: 2.4
    },

    TWO_STORY_MODERN: {
      id: 'two_story_modern',
      name: 'Two-Story Modern Home',
      condition: 'normal_dirt',
      access: 'two_story',
      description: 'Modern two-story with standard dirt',
      estimatedMultiplier: 1.8
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  var ConditionHelpers = {

    /**
     * Get modifier by ID (searches all types)
     * @param {string} modId - Modifier ID
     * @returns {Object|null} Modifier object or null
     */
    getModifier: function(modId) {
      if (!modId) return null;

      // Search window conditions
      if (WINDOW_CONDITIONS[modId.toUpperCase()]) {
        return WINDOW_CONDITIONS[modId.toUpperCase()];
      }

      // Search access modifiers
      if (ACCESS_MODIFIERS[modId.toUpperCase()]) {
        return ACCESS_MODIFIERS[modId.toUpperCase()];
      }

      // Search pressure conditions
      if (PRESSURE_CONDITIONS[modId.toUpperCase()]) {
        return PRESSURE_CONDITIONS[modId.toUpperCase()];
      }

      // Search technique modifiers
      if (TECHNIQUE_MODIFIERS[modId.toUpperCase()]) {
        return TECHNIQUE_MODIFIERS[modId.toUpperCase()];
      }

      return null;
    },

    /**
     * Get all modifiers
     * @returns {Object} Object containing all modifier types
     */
    getAllModifiers: function() {
      return {
        windowConditions: WINDOW_CONDITIONS,
        accessModifiers: ACCESS_MODIFIERS,
        pressureConditions: PRESSURE_CONDITIONS,
        techniqueModifiers: TECHNIQUE_MODIFIERS
      };
    },

    /**
     * Get modifiers applicable to job type
     * @param {string} jobType - 'window' or 'pressure'
     * @returns {Array} Array of applicable modifiers
     */
    getApplicableModifiers: function(jobType) {
      var results = [];

      // All window conditions apply to windows
      if (jobType === 'window') {
        for (var key in WINDOW_CONDITIONS) {
          if (WINDOW_CONDITIONS.hasOwnProperty(key)) {
            results.push(WINDOW_CONDITIONS[key]);
          }
        }
      }

      // All pressure conditions apply to pressure jobs
      if (jobType === 'pressure') {
        for (var key2 in PRESSURE_CONDITIONS) {
          if (PRESSURE_CONDITIONS.hasOwnProperty(key2)) {
            results.push(PRESSURE_CONDITIONS[key2]);
          }
        }
      }

      // Access modifiers apply to both
      for (var key3 in ACCESS_MODIFIERS) {
        if (ACCESS_MODIFIERS.hasOwnProperty(key3)) {
          results.push(ACCESS_MODIFIERS[key3]);
        }
      }

      // Technique modifiers (mostly pressure)
      if (jobType === 'pressure') {
        for (var key4 in TECHNIQUE_MODIFIERS) {
          if (TECHNIQUE_MODIFIERS.hasOwnProperty(key4)) {
            results.push(TECHNIQUE_MODIFIERS[key4]);
          }
        }
      }

      return results;
    },

    /**
     * Apply single modifier to base price
     * @param {number} basePrice - Base price in dollars
     * @param {string} modifierId - Modifier ID
     * @returns {number} Adjusted price
     */
    applyModifier: function(basePrice, modifierId) {
      var mod = this.getModifier(modifierId);
      if (!mod) return basePrice;

      return basePrice * mod.multiplier;
    },

    /**
     * Apply multiple modifiers to base price
     * @param {number} basePrice - Base price in dollars
     * @param {Array} modifierIds - Array of modifier IDs
     * @returns {number} Adjusted price
     */
    applyMultipleModifiers: function(basePrice, modifierIds) {
      if (!modifierIds || modifierIds.length === 0) return basePrice;

      var finalPrice = basePrice;

      for (var i = 0; i < modifierIds.length; i++) {
        var mod = this.getModifier(modifierIds[i]);
        if (mod) {
          finalPrice = finalPrice * mod.multiplier;
        }
      }

      return finalPrice;
    },

    /**
     * Calculate combined multiplier
     * @param {Array} modifierIds - Array of modifier IDs
     * @returns {number} Combined multiplier
     */
    getCombinedMultiplier: function(modifierIds) {
      if (!modifierIds || modifierIds.length === 0) return 1.0;

      var combined = 1.0;

      for (var i = 0; i < modifierIds.length; i++) {
        var mod = this.getModifier(modifierIds[i]);
        if (mod) {
          combined = combined * mod.multiplier;
        }
      }

      return combined;
    },

    /**
     * Get modifiers by category
     * @param {string} category - Category name
     * @returns {Array} Array of modifiers in that category
     */
    getModifiersByCategory: function(category) {
      var results = [];
      var allMods = this.getAllModifiers();

      for (var type in allMods) {
        if (allMods.hasOwnProperty(type)) {
          var modGroup = allMods[type];
          for (var key in modGroup) {
            if (modGroup.hasOwnProperty(key)) {
              var mod = modGroup[key];
              if (mod.level === category) {
                results.push(mod);
              }
            }
          }
        }
      }

      return results;
    }
  };

  // Convert to array format for dropdowns
  var WINDOW_CONDITIONS_ARRAY = [];
  var ACCESS_MODIFIERS_ARRAY = [];
  var PRESSURE_CONDITIONS_ARRAY = [];
  var TECHNIQUE_MODIFIERS_ARRAY = [];
  var CONDITION_PRESETS_ARRAY = [];

  for (var key in WINDOW_CONDITIONS) {
    if (WINDOW_CONDITIONS.hasOwnProperty(key)) {
      WINDOW_CONDITIONS_ARRAY.push(WINDOW_CONDITIONS[key]);
    }
  }

  for (var key2 in ACCESS_MODIFIERS) {
    if (ACCESS_MODIFIERS.hasOwnProperty(key2)) {
      ACCESS_MODIFIERS_ARRAY.push(ACCESS_MODIFIERS[key2]);
    }
  }

  for (var key3 in PRESSURE_CONDITIONS) {
    if (PRESSURE_CONDITIONS.hasOwnProperty(key3)) {
      PRESSURE_CONDITIONS_ARRAY.push(PRESSURE_CONDITIONS[key3]);
    }
  }

  for (var key4 in TECHNIQUE_MODIFIERS) {
    if (TECHNIQUE_MODIFIERS.hasOwnProperty(key4)) {
      TECHNIQUE_MODIFIERS_ARRAY.push(TECHNIQUE_MODIFIERS[key4]);
    }
  }

  for (var key5 in CONDITION_PRESETS) {
    if (CONDITION_PRESETS.hasOwnProperty(key5)) {
      CONDITION_PRESETS_ARRAY.push(CONDITION_PRESETS[key5]);
    }
  }

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('conditionsModifiers', {
      windowConditions: WINDOW_CONDITIONS,
      accessModifiers: ACCESS_MODIFIERS,
      pressureConditions: PRESSURE_CONDITIONS,
      techniqueModifiers: TECHNIQUE_MODIFIERS,
      presets: CONDITION_PRESETS,
      helpers: ConditionHelpers
    });
  }

  // Export globally
  window.WINDOW_CONDITIONS = WINDOW_CONDITIONS;
  window.ACCESS_MODIFIERS = ACCESS_MODIFIERS;
  window.PRESSURE_CONDITIONS = PRESSURE_CONDITIONS;
  window.TECHNIQUE_MODIFIERS = TECHNIQUE_MODIFIERS;
  window.CONDITION_PRESETS = CONDITION_PRESETS;
  window.WINDOW_CONDITIONS_ARRAY = WINDOW_CONDITIONS_ARRAY;
  window.ACCESS_MODIFIERS_ARRAY = ACCESS_MODIFIERS_ARRAY;
  window.PRESSURE_CONDITIONS_ARRAY = PRESSURE_CONDITIONS_ARRAY;
  window.TECHNIQUE_MODIFIERS_ARRAY = TECHNIQUE_MODIFIERS_ARRAY;
  window.CONDITION_PRESETS_ARRAY = CONDITION_PRESETS_ARRAY;

  // Unified API
  window.ConditionsModifiers = {
    windowConditions: WINDOW_CONDITIONS,
    accessModifiers: ACCESS_MODIFIERS,
    pressureConditions: PRESSURE_CONDITIONS,
    techniqueModifiers: TECHNIQUE_MODIFIERS,
    presets: CONDITION_PRESETS,
    getModifier: ConditionHelpers.getModifier.bind(ConditionHelpers),
    getAllModifiers: ConditionHelpers.getAllModifiers.bind(ConditionHelpers),
    getApplicableModifiers: ConditionHelpers.getApplicableModifiers.bind(ConditionHelpers),
    applyModifier: ConditionHelpers.applyModifier.bind(ConditionHelpers),
    applyMultipleModifiers: ConditionHelpers.applyMultipleModifiers.bind(ConditionHelpers),
    getCombinedMultiplier: ConditionHelpers.getCombinedMultiplier.bind(ConditionHelpers),
    getModifiersByCategory: ConditionHelpers.getModifiersByCategory.bind(ConditionHelpers)
  };

  var totalModifiers =
    WINDOW_CONDITIONS_ARRAY.length +
    ACCESS_MODIFIERS_ARRAY.length +
    PRESSURE_CONDITIONS_ARRAY.length +
    TECHNIQUE_MODIFIERS_ARRAY.length;

  console.log('[CONDITIONS-MODIFIERS] Loaded ' + totalModifiers + ' total modifiers');

})();
