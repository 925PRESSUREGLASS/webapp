// custom-window-calculator.js
// Calculate pricing and time for custom-sized windows
// Live preview and instant feedback for non-standard sizes
// ES5 compatible

(function() {
  'use strict';

  var CustomWindowCalculator = {

    // Base formula: $0.015 per cm² of glass
    PRICE_PER_CM2: 0.015,

    // Time calculation: 1 minute per 500cm² of glass
    TIME_PER_500CM2: 1.0,

    // Minimum values
    MIN_PRICE: 10.00,
    MIN_TIME: 2.0,

    // Calculate price and time for custom window
    calculate: function(width, height, type) {
      width = parseInt(width, 10) || 0;
      height = parseInt(height, 10) || 0;

      if (width <= 0 || height <= 0) {
        return {
          valid: false,
          error: 'Invalid dimensions'
        };
      }

      // Convert mm to cm
      var widthCm = width / 10;
      var heightCm = height / 10;

      // Calculate area
      var areaCm2 = widthCm * heightCm;

      // Base price calculation
      var basePrice = areaCm2 * this.PRICE_PER_CM2;
      basePrice = Math.max(basePrice, this.MIN_PRICE);

      // Base time calculation
      var baseTime = areaCm2 / 500;
      baseTime = Math.max(baseTime, this.MIN_TIME);

      // Apply type modifiers
      var typeMultiplier = this.getTypeMultiplier(type);
      var finalPrice = basePrice * typeMultiplier;
      var finalTime = baseTime * typeMultiplier;

      // Round appropriately
      finalPrice = Math.round(finalPrice * 100) / 100;
      finalTime = Math.round(finalTime * 10) / 10;

      return {
        valid: true,
        width: width,
        height: height,
        widthCm: widthCm,
        heightCm: heightCm,
        areaCm2: areaCm2,
        areaM2: areaCm2 / 10000,
        basePrice: basePrice,
        baseTime: baseTime,
        finalPrice: finalPrice,
        finalTime: finalTime,
        typeMultiplier: typeMultiplier,
        type: type || 'fixed'
      };
    },

    // Get type multiplier
    getTypeMultiplier: function(type) {
      var multipliers = {
        'fixed': 1.0,      // Fixed glass, easiest
        'opening': 1.2,    // Opening window (slider, casement, awning)
        'louvre': 2.0,     // Louvre window, many slats
        'door': 1.3,       // Glass door
        'bifold': 1.5      // Bi-fold door, multiple panels
      };

      return multipliers[type] || 1.0;
    },

    // Create UI for custom window calculator
    createCalculatorUI: function(onCalculate) {
      var container = document.createElement('div');
      container.className = 'custom-window-calculator';
      container.style.cssText = 'padding: 16px; background: #f8fafc; border-radius: 8px;';

      // Title
      var title = document.createElement('h3');
      title.textContent = 'Custom Window Size Calculator';
      title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600;';
      container.appendChild(title);

      // Width input
      var widthGroup = this.createInputGroup('Width (mm):', 'width', '1200');
      container.appendChild(widthGroup.container);

      // Common width presets
      var widthPresets = this.createPresets([600, 900, 1200, 1500, 1800, 2400], function(value) {
        widthGroup.input.value = value;
        updateCalculation();
      });
      container.appendChild(widthPresets);

      // Height input
      var heightGroup = this.createInputGroup('Height (mm):', 'height', '1200');
      container.appendChild(heightGroup.container);

      // Common height presets
      var heightPresets = this.createPresets([600, 900, 1200, 1500, 2100], function(value) {
        heightGroup.input.value = value;
        updateCalculation();
      });
      container.appendChild(heightPresets);

      // Type selector
      var typeGroup = this.createTypeSelector();
      container.appendChild(typeGroup.container);

      // Results display
      var results = document.createElement('div');
      results.className = 'calc-results';
      results.style.cssText = 'margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 2px solid #e2e8f0;';
      results.innerHTML = '<div style="color: #94a3b8; font-style: italic;">Enter dimensions to see pricing...</div>';
      container.appendChild(results);

      // Update calculation
      var self = this;
      function updateCalculation() {
        var width = widthGroup.input.value;
        var height = heightGroup.input.value;
        var type = typeGroup.select.value;

        var calc = self.calculate(width, height, type);

        if (calc.valid) {
          results.innerHTML =
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' +
            '<div><strong>Area:</strong> ' + calc.areaM2.toFixed(2) + ' m²</div>' +
            '<div><strong>Type:</strong> ' + self.getTypeName(type) + '</div>' +
            '<div><strong>Est. Time:</strong> ' + calc.finalTime + ' min</div>' +
            '<div><strong>Est. Price:</strong> $' + calc.finalPrice.toFixed(2) + '</div>' +
            '</div>' +
            '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">' +
            'Base time: ' + calc.baseTime.toFixed(1) + ' min × ' + calc.typeMultiplier.toFixed(1) + 'x = ' + calc.finalTime + ' min' +
            '</div>';

          if (onCalculate) {
            onCalculate(calc);
          }
        } else {
          results.innerHTML = '<div style="color: #ef4444;">Invalid dimensions</div>';
        }
      }

      // Add event listeners
      widthGroup.input.addEventListener('input', updateCalculation);
      heightGroup.input.addEventListener('input', updateCalculation);
      typeGroup.select.addEventListener('change', updateCalculation);

      // Initial calculation
      updateCalculation();

      return container;
    },

    // Create input group
    createInputGroup: function(label, id, defaultValue) {
      var container = document.createElement('div');
      container.style.cssText = 'margin-bottom: 8px;';

      var labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.cssText = 'display: block; margin-bottom: 4px; font-weight: 500; font-size: 14px;';

      var input = document.createElement('input');
      input.type = 'number';
      input.id = 'calc-' + id;
      input.min = '100';
      input.max = '5000';
      input.step = '100';
      input.value = defaultValue || '';
      input.style.cssText = 'width: 100%; padding: 12px; font-size: 16px; border: 2px solid #cbd5e1; border-radius: 6px;';

      container.appendChild(labelEl);
      container.appendChild(input);

      return {
        container: container,
        input: input
      };
    },

    // Create preset buttons
    createPresets: function(values, onClick) {
      var container = document.createElement('div');
      container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;';

      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = value + 'mm';
        btn.style.cssText = 'padding: 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; cursor: pointer;';

        btn.addEventListener('click', (function(val) {
          return function() {
            onClick(val);
          };
        })(value));

        container.appendChild(btn);
      }

      return container;
    },

    // Create type selector
    createTypeSelector: function() {
      var container = document.createElement('div');
      container.style.cssText = 'margin-bottom: 16px;';

      var label = document.createElement('label');
      label.textContent = 'Window Type:';
      label.style.cssText = 'display: block; margin-bottom: 4px; font-weight: 500; font-size: 14px;';

      var select = document.createElement('select');
      select.style.cssText = 'width: 100%; padding: 12px; font-size: 16px; border: 2px solid #cbd5e1; border-radius: 6px;';

      var options = [
        { value: 'fixed', label: 'Fixed Glass (1.0x time)', desc: 'Non-opening panel' },
        { value: 'opening', label: 'Opening Window (1.2x time)', desc: 'Slider, awning, casement' },
        { value: 'door', label: 'Glass Door (1.3x time)', desc: 'Sliding or hinged door' },
        { value: 'bifold', label: 'Bi-fold Door (1.5x time)', desc: 'Multiple panels' },
        { value: 'louvre', label: 'Louvre Window (2.0x time)', desc: 'Multiple slats - very slow!' }
      ];

      for (var i = 0; i < options.length; i++) {
        var opt = document.createElement('option');
        opt.value = options[i].value;
        opt.textContent = options[i].label;
        select.appendChild(opt);
      }

      container.appendChild(label);
      container.appendChild(select);

      return {
        container: container,
        select: select
      };
    },

    // Get type name
    getTypeName: function(type) {
      var names = {
        'fixed': 'Fixed Glass',
        'opening': 'Opening Window',
        'louvre': 'Louvre Window',
        'door': 'Glass Door',
        'bifold': 'Bi-fold Door'
      };
      return names[type] || 'Unknown';
    }
  };

  // Export globally
  window.CustomWindowCalculator = CustomWindowCalculator;

})();
