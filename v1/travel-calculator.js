// travel-calculator.js
// Travel time and cost calculator for Perth WA metro area
// Zone-based system for accurate job costing
// ES5 compatible

(function() {
  'use strict';

  var TravelCalculator = {

    // Base location (Perth CBD or your home base)
    baseLocation: {
      lat: -31.9505,
      lng: 115.8605,
      name: 'Perth CBD'
    },

    // Target hourly rate
    targetHourlyRate: 150.00,

    // Perth metro travel zones
    zones: {
      LOCAL: {
        id: 'local',
        name: 'Local (0-5km)',
        maxDistance: 5,
        travelTimeMinutes: 15,
        travelCharge: 0,
        color: '#10b981',
        description: 'No travel charge, built into base fee',
        suburbs: ['Perth', 'Northbridge', 'Leederville', 'Subiaco']
      },

      NEARBY: {
        id: 'nearby',
        name: 'Nearby (5-15km)',
        maxDistance: 15,
        travelTimeMinutes: 30,
        travelCharge: 25.00,
        color: '#3b82f6',
        description: 'Short travel time',
        suburbs: ['Scarborough', 'Inglewood', 'Como', 'Fremantle']
      },

      METRO: {
        id: 'metro',
        name: 'Metro (15-30km)',
        maxDistance: 30,
        travelTimeMinutes: 60,
        travelCharge: 50.00,
        color: '#f59e0b',
        description: 'Standard metro area',
        suburbs: ['Joondalup', 'Midland', 'Rockingham', 'Mandurah']
      },

      OUTER: {
        id: 'outer',
        name: 'Outer Metro (30-50km)',
        maxDistance: 50,
        travelTimeMinutes: 90,
        travelCharge: 75.00,
        color: '#ef4444',
        description: 'Extended travel time',
        suburbs: ['Yanchep', 'Ellenbrook', 'Serpentine']
      },

      REGIONAL: {
        id: 'regional',
        name: 'Regional (50km+)',
        maxDistance: 999,
        travelTimeMinutes: 120,
        travelCharge: 100.00,
        color: '#991b1b',
        description: 'Regional areas - quote individually',
        suburbs: []
      }
    },

    // Calculate travel for a job
    calculate: function(distanceKm, customRate) {
      var zone = this.getZoneForDistance(distanceKm);
      var hourlyRate = customRate || this.targetHourlyRate;

      var travelTimeHours = zone.travelTimeMinutes / 60;
      var opportunityCost = travelTimeHours * hourlyRate;

      return {
        distance: distanceKm,
        zone: zone,
        travelTimeMinutes: zone.travelTimeMinutes,
        travelTimeHours: travelTimeHours,
        travelCharge: zone.travelCharge,
        opportunityCost: opportunityCost,
        totalCost: zone.travelCharge + opportunityCost,
        recommendation: this.getRecommendation(zone, opportunityCost)
      };
    },

    // Get zone for distance
    getZoneForDistance: function(distanceKm) {
      var zones = [
        this.zones.LOCAL,
        this.zones.NEARBY,
        this.zones.METRO,
        this.zones.OUTER,
        this.zones.REGIONAL
      ];

      for (var i = 0; i < zones.length; i++) {
        if (distanceKm <= zones[i].maxDistance) {
          return zones[i];
        }
      }

      return this.zones.REGIONAL;
    },

    // Get recommendation
    getRecommendation: function(zone, opportunityCost) {
      if (zone.id === 'local') {
        return 'Ideal location - minimal travel time';
      } else if (zone.id === 'nearby') {
        return 'Good location - reasonable travel';
      } else if (zone.id === 'metro') {
        return 'Ensure job value justifies 1 hour travel time';
      } else if (zone.id === 'outer') {
        return 'WARNING: 1.5 hours travel - need larger job to justify';
      } else {
        return 'CAUTION: Extended travel - may need multi-visit or full day';
      }
    },

    // Calculate minimum job value to justify travel
    calculateMinimumJobValue: function(distanceKm, targetProfit) {
      var travel = this.calculate(distanceKm);
      targetProfit = targetProfit || 0;

      // Minimum = Travel cost + Travel time opportunity cost + target profit
      var minimum = travel.travelCharge + travel.opportunityCost + targetProfit;

      return {
        minimumJobValue: minimum,
        breakdownMessage:
          'Travel charge: $' + travel.travelCharge.toFixed(2) + ' + ' +
          'Opportunity cost: $' + travel.opportunityCost.toFixed(2) +
          (targetProfit > 0 ? ' + Target profit: $' + targetProfit.toFixed(2) : '')
      };
    },

    // Create UI for travel calculator
    createTravelUI: function(onCalculate) {
      var container = document.createElement('div');
      container.className = 'travel-calculator';
      container.style.cssText = 'padding: 16px; background: #f8fafc; border-radius: 8px;';

      var title = document.createElement('h3');
      title.textContent = 'Travel Calculator';
      title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600;';
      container.appendChild(title);

      // Distance input
      var inputGroup = document.createElement('div');
      inputGroup.style.cssText = 'margin-bottom: 12px;';

      var label = document.createElement('label');
      label.textContent = 'Distance (km):';
      label.style.cssText = 'display: block; margin-bottom: 4px; font-weight: 500;';

      var input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '200';
      input.step = '1';
      input.value = '10';
      input.style.cssText = 'width: 100%; padding: 12px; font-size: 16px; border: 2px solid #cbd5e1; border-radius: 6px;';

      inputGroup.appendChild(label);
      inputGroup.appendChild(input);
      container.appendChild(inputGroup);

      // Zone selector (alternative to distance)
      var zoneSelector = this.createZoneSelector(function(zone) {
        // Estimate distance for zone
        var avgDistance = zone.maxDistance / 2;
        if (zone.id === 'local') avgDistance = 2.5;
        if (zone.id === 'regional') avgDistance = 75;
        input.value = avgDistance;
        updateCalculation();
      });
      container.appendChild(zoneSelector);

      // Results display
      var results = document.createElement('div');
      results.className = 'travel-results';
      results.style.cssText = 'margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 2px solid #e2e8f0;';
      container.appendChild(results);

      // Update calculation
      var self = this;
      function updateCalculation() {
        var distance = parseFloat(input.value) || 0;
        var calc = self.calculate(distance);

        results.innerHTML =
          '<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid ' + calc.zone.color + ';">' +
          '<div style="font-size: 18px; font-weight: 600; color: ' + calc.zone.color + ';">' + calc.zone.name + '</div>' +
          '<div style="font-size: 13px; color: #64748b; margin-top: 4px;">' + calc.zone.description + '</div>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">' +
          '<div><strong>Distance:</strong> ' + calc.distance + ' km</div>' +
          '<div><strong>Travel Time:</strong> ' + calc.travelTimeMinutes + ' min</div>' +
          '<div><strong>Travel Charge:</strong> $' + calc.travelCharge.toFixed(2) + '</div>' +
          '<div><strong>Opportunity Cost:</strong> $' + calc.opportunityCost.toFixed(2) + '</div>' +
          '</div>' +
          '<div style="padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 13px;">' +
          '<strong>💡 Tip:</strong> ' + calc.recommendation +
          '</div>';

        if (onCalculate) {
          onCalculate(calc);
        }
      }

      input.addEventListener('input', updateCalculation);
      updateCalculation();

      return container;
    },

    // Create zone selector buttons
    createZoneSelector: function(onSelect) {
      var container = document.createElement('div');
      container.style.cssText = 'margin: 12px 0;';

      var label = document.createElement('div');
      label.textContent = 'Or select zone:';
      label.style.cssText = 'font-size: 13px; color: #64748b; margin-bottom: 8px;';
      container.appendChild(label);

      var zones = [
        this.zones.LOCAL,
        this.zones.NEARBY,
        this.zones.METRO,
        this.zones.OUTER,
        this.zones.REGIONAL
      ];

      var buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

      for (var i = 0; i < zones.length; i++) {
        var zone = zones[i];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = zone.name;
        btn.style.cssText =
          'padding: 8px 12px; ' +
          'font-size: 13px; ' +
          'border: 2px solid ' + zone.color + '; ' +
          'color: ' + zone.color + '; ' +
          'border-radius: 6px; ' +
          'background: white; ' +
          'cursor: pointer; ' +
          'transition: all 0.2s;';

        btn.addEventListener('click', (function(z) {
          return function() {
            onSelect(z);
          };
        })(zone));

        btn.addEventListener('mouseenter', (function(z, b) {
          return function() {
            b.style.background = z.color;
            b.style.color = 'white';
          };
        })(zone, btn));

        btn.addEventListener('mouseleave', (function(z, b) {
          return function() {
            b.style.background = 'white';
            b.style.color = z.color;
          };
        })(zone, btn));

        buttonsContainer.appendChild(btn);
      }

      container.appendChild(buttonsContainer);
      return container;
    }
  };

  // Export globally
  window.TravelCalculator = TravelCalculator;

})();
