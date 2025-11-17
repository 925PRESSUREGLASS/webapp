// job-presets.js
// Common job templates for quick quoting
// Perth WA residential and commercial presets
// ES5 compatible

(function() {
  'use strict';

  var JobPresets = {

    // Residential house templates
    residential: {

      HOUSE_2BED_1BATH: {
        id: 'house_2x1',
        name: '2 Bed, 1 Bath House',
        category: 'residential',
        description: 'Typical Perth 2x1 home, ~100m² building',
        estimatedTotal: 360,
        estimatedTime: 90,
        windows: [
          { typeId: 'sliding_1200', quantity: 6, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'awning_900', quantity: 4, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'fixed_900', quantity: 2, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: []
      },

      HOUSE_3BED_2BATH: {
        id: 'house_3x2',
        name: '3 Bed, 2 Bath House',
        category: 'residential',
        description: 'Standard 3x2 Perth home, ~150m² building',
        estimatedTotal: 520,
        estimatedTime: 135,
        windows: [
          { typeId: 'sliding_1200', quantity: 10, conditionId: 'normal_dirt', accessId: 'single_story' },
          { typeId: 'awning_900', quantity: 6, conditionId: 'normal_dirt', accessId: 'single_story' },
          { typeId: 'fixed_1200', quantity: 3, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'stacker_2400', quantity: 1, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: []
      },

      HOUSE_4BED_2BATH_DOUBLE: {
        id: 'house_4x2_double',
        name: '4 Bed, 2 Bath (Double Story)',
        category: 'residential',
        description: 'Large two-story home, ~250m² building',
        estimatedTotal: 890,
        estimatedTime: 240,
        windows: [
          { typeId: 'sliding_1200', quantity: 15, conditionId: 'normal_dirt', accessId: 'two_story' },
          { typeId: 'awning_900', quantity: 8, conditionId: 'normal_dirt', accessId: 'two_story' },
          { typeId: 'fixed_1800', quantity: 4, conditionId: 'normal_dirt', accessId: 'two_story' },
          { typeId: 'bifold_3600', quantity: 1, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: []
      },

      APARTMENT_1BED: {
        id: 'apt_1bed',
        name: '1 Bed Apartment',
        category: 'residential',
        description: 'Small apartment or unit',
        estimatedTotal: 180,
        estimatedTime: 45,
        windows: [
          { typeId: 'sliding_900', quantity: 3, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'fixed_900', quantity: 2, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: []
      },

      APARTMENT_2BED: {
        id: 'apt_2bed',
        name: '2 Bed Apartment',
        category: 'residential',
        description: 'Medium apartment',
        estimatedTotal: 280,
        estimatedTime: 70,
        windows: [
          { typeId: 'sliding_1200', quantity: 5, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'awning_600', quantity: 2, conditionId: 'normal_dirt', accessId: 'ground_level' },
          { typeId: 'fixed_1200', quantity: 2, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: []
      }
    },

    // Pressure washing templates
    pressure: {

      DRIVEWAY_STANDARD: {
        id: 'driveway_std',
        name: 'Standard Driveway',
        category: 'pressure',
        description: 'Single car concrete driveway, ~30m²',
        estimatedTotal: 260,
        estimatedTime: 75,
        windows: [],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 30, conditionId: 'moderate_grime' }
        ]
      },

      DRIVEWAY_DOUBLE: {
        id: 'driveway_double',
        name: 'Double Driveway + Path',
        category: 'pressure',
        description: 'Double car driveway with front path, ~55m²',
        estimatedTotal: 450,
        estimatedTime: 120,
        windows: [],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 45, conditionId: 'moderate_grime' },
          { surfaceId: 'pathway_concrete', area: 10, conditionId: 'moderate_grime' }
        ]
      },

      PATIO_STANDARD: {
        id: 'patio_std',
        name: 'Standard Patio/Alfresco',
        category: 'pressure',
        description: 'Outdoor patio area, ~20m²',
        estimatedTotal: 220,
        estimatedTime: 60,
        windows: [],
        pressure: [
          { surfaceId: 'patio_concrete', area: 20, conditionId: 'mould_mildew' }
        ]
      }
    },

    // Combined packages
    packages: {

      FULL_EXTERIOR_SMALL: {
        id: 'full_ext_small',
        name: 'Full Exterior - Small House',
        category: 'package',
        description: 'Windows + driveway + patio for 2-3 bed house',
        estimatedTotal: 820,
        estimatedTime: 240,
        windows: [
          { typeId: 'sliding_1200', quantity: 8, conditionId: 'normal_dirt', accessId: 'single_story' },
          { typeId: 'awning_900', quantity: 5, conditionId: 'normal_dirt', accessId: 'single_story' }
        ],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 30, conditionId: 'moderate_grime' },
          { surfaceId: 'patio_concrete', area: 15, conditionId: 'mould_mildew' }
        ]
      },

      FULL_EXTERIOR_LARGE: {
        id: 'full_ext_large',
        name: 'Full Exterior - Large House',
        category: 'package',
        description: 'Windows + driveway + patio for 4 bed house',
        estimatedTotal: 1450,
        estimatedTime: 360,
        windows: [
          { typeId: 'sliding_1200', quantity: 15, conditionId: 'normal_dirt', accessId: 'two_story' },
          { typeId: 'awning_900', quantity: 8, conditionId: 'normal_dirt', accessId: 'two_story' },
          { typeId: 'bifold_2400', quantity: 1, conditionId: 'normal_dirt', accessId: 'ground_level' }
        ],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 50, conditionId: 'moderate_grime' },
          { surfaceId: 'patio_concrete', area: 30, conditionId: 'mould_mildew' },
          { surfaceId: 'pathway_concrete', area: 15, conditionId: 'moderate_grime' }
        ]
      },

      MOVE_OUT_CLEAN: {
        id: 'move_out',
        name: 'Move-Out/End of Lease Clean',
        category: 'package',
        description: 'Comprehensive exterior clean for rental property',
        estimatedTotal: 650,
        estimatedTime: 180,
        windows: [
          { typeId: 'sliding_1200', quantity: 8, conditionId: 'heavy_dirt', accessId: 'single_story' },
          { typeId: 'awning_900', quantity: 6, conditionId: 'heavy_dirt', accessId: 'single_story' }
        ],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 35, conditionId: 'heavy_buildup' },
          { surfaceId: 'patio_concrete', area: 20, conditionId: 'mould_mildew' }
        ]
      },

      NEW_HOME_CONSTRUCTION: {
        id: 'new_home_const',
        name: 'New Home - Post-Construction',
        category: 'package',
        description: 'Initial clean after construction complete',
        estimatedTotal: 980,
        estimatedTime: 300,
        windows: [
          { typeId: 'sliding_1200', quantity: 12, conditionId: 'construction', accessId: 'single_story' },
          { typeId: 'awning_900', quantity: 8, conditionId: 'construction', accessId: 'single_story' },
          { typeId: 'fixed_2400', quantity: 2, conditionId: 'construction', accessId: 'ground_level' }
        ],
        pressure: [
          { surfaceId: 'driveway_concrete', area: 40, conditionId: 'construction_debris' }
        ]
      }
    },

    // Get all presets as flat array
    getAllPresets: function() {
      var presets = [];

      // Add residential
      for (var resKey in this.residential) {
        if (this.residential.hasOwnProperty(resKey)) {
          presets.push(this.residential[resKey]);
        }
      }

      // Add pressure
      for (var pressKey in this.pressure) {
        if (this.pressure.hasOwnProperty(pressKey)) {
          presets.push(this.pressure[pressKey]);
        }
      }

      // Add packages
      for (var pkgKey in this.packages) {
        if (this.packages.hasOwnProperty(pkgKey)) {
          presets.push(this.packages[pkgKey]);
        }
      }

      return presets;
    },

    // Get preset by ID
    getPreset: function(id) {
      var all = this.getAllPresets();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) {
          return all[i];
        }
      }
      return null;
    },

    // Create UI for preset selector
    createPresetSelectorUI: function(onSelect) {
      var container = document.createElement('div');
      container.className = 'preset-selector';
      container.style.cssText = 'padding: 16px;';

      var title = document.createElement('h3');
      title.textContent = 'Start with Template';
      title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600;';
      container.appendChild(title);

      // Categories
      var categories = [
        { key: 'residential', label: '🏠 Residential', items: this.residential },
        { key: 'pressure', label: '🚗 Driveways & Patios', items: this.pressure },
        { key: 'packages', label: '📦 Full Packages', items: this.packages }
      ];

      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];

        var catTitle = document.createElement('h4');
        catTitle.textContent = cat.label;
        catTitle.style.cssText = 'margin: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #64748b;';
        container.appendChild(catTitle);

        var grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px;';

        for (var key in cat.items) {
          if (cat.items.hasOwnProperty(key)) {
            var preset = cat.items[key];
            var card = this.createPresetCard(preset, onSelect);
            grid.appendChild(card);
          }
        }

        container.appendChild(grid);
      }

      // Custom option
      var customBtn = document.createElement('button');
      customBtn.type = 'button';
      customBtn.className = 'btn btn-secondary';
      customBtn.textContent = '✏️ Custom from Scratch';
      customBtn.style.cssText = 'width: 100%; margin-top: 16px; min-height: 50px;';
      customBtn.addEventListener('click', function() {
        if (onSelect) {
          onSelect(null); // null = custom
        }
      });
      container.appendChild(customBtn);

      return container;
    },

    // Create preset card
    createPresetCard: function(preset, onSelect) {
      var card = document.createElement('div');
      card.style.cssText =
        'padding: 12px; ' +
        'border: 2px solid #e2e8f0; ' +
        'border-radius: 8px; ' +
        'cursor: pointer; ' +
        'transition: all 0.2s; ' +
        'background: white;';

      card.addEventListener('mouseenter', function() {
        card.style.borderColor = '#3b82f6';
        card.style.background = '#f8fafc';
      });

      card.addEventListener('mouseleave', function() {
        card.style.borderColor = '#e2e8f0';
        card.style.background = 'white';
      });

      card.addEventListener('click', function() {
        if (onSelect) {
          onSelect(preset);
        }
      });

      var name = document.createElement('div');
      name.style.cssText = 'font-weight: 600; margin-bottom: 4px; font-size: 14px;';
      name.textContent = preset.name;

      var description = document.createElement('div');
      description.style.cssText = 'font-size: 12px; color: #64748b; margin-bottom: 8px;';
      description.textContent = preset.description;

      var stats = document.createElement('div');
      stats.style.cssText = 'display: flex; justify-content: space-between; font-size: 13px;';

      var price = document.createElement('span');
      price.style.cssText = 'color: #10b981; font-weight: 600;';
      price.textContent = '~$' + preset.estimatedTotal;

      var time = document.createElement('span');
      time.style.cssText = 'color: #64748b;';
      time.textContent = '~' + Math.round(preset.estimatedTime / 60 * 10) / 10 + ' hrs';

      stats.appendChild(price);
      stats.appendChild(time);

      card.appendChild(name);
      card.appendChild(description);
      card.appendChild(stats);

      return card;
    }
  };

  // Export globally
  window.JobPresets = JobPresets;

})();
