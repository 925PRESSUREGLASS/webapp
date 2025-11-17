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

  // Convert to array format for dropdowns
  var WINDOW_CONDITIONS_ARRAY = [];
  var ACCESS_MODIFIERS_ARRAY = [];
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

  for (var key3 in CONDITION_PRESETS) {
    if (CONDITION_PRESETS.hasOwnProperty(key3)) {
      CONDITION_PRESETS_ARRAY.push(CONDITION_PRESETS[key3]);
    }
  }

  // Export globally
  window.WINDOW_CONDITIONS = WINDOW_CONDITIONS;
  window.ACCESS_MODIFIERS = ACCESS_MODIFIERS;
  window.CONDITION_PRESETS = CONDITION_PRESETS;
  window.WINDOW_CONDITIONS_ARRAY = WINDOW_CONDITIONS_ARRAY;
  window.ACCESS_MODIFIERS_ARRAY = ACCESS_MODIFIERS_ARRAY;
  window.CONDITION_PRESETS_ARRAY = CONDITION_PRESETS_ARRAY;

})();
