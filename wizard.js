// wizard.js – Enhanced overlay-based wizards for Tic-Tac-Stick
// v2.0 - Optimized with design system, accessibility, and smart features
// ES5 compatible - no arrow functions, const/let, or template literals

(function () {
  'use strict';

  // -------------------------
  // Basic helpers
  // -------------------------
  function $(id) {
    return document.getElementById(id);
  }

  function toInt(str, fallback) {
    if (fallback === void 0) fallback = 0;
    var n = parseInt(str, 10);
    return isNaN(n) ? fallback : n;
  }

  function toFloat(str, fallback) {
    if (fallback === void 0) fallback = 0;
    var n = parseFloat(str);
    return isNaN(n) ? fallback : n;
  }

  function escapeHTML(str) {
    if (!str) return '';
    if (window.Security && window.Security.escapeHTML) {
      return window.Security.escapeHTML(str);
    }
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // -------------------------
  // Elements
  // -------------------------
  var overlay = null;
  var titleEl = null;
  var contentEl = null;
  var closeBtn = null;
  var isReady = false;

  function initOverlay() {
    if (isReady) return;

    overlay = $('wizardOverlay');
    titleEl = $('wizardTitle');
    contentEl = $('wizardContent');
    closeBtn = $('wizardCloseBtn');

    if (!overlay || !titleEl || !contentEl || !closeBtn) {
      return;
    }

    closeBtn.addEventListener('click', closeOverlay);

    // Click on dark backdrop closes wizard
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeOverlay();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      if (overlay && overlay.classList.contains('wizard-open')) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          closeOverlay();
        }
      }
    });

    isReady = true;
  }

  function openOverlay() {
    if (!isReady) initOverlay();
    if (!overlay) return;
    overlay.classList.add('wizard-open');

    // Prevent body scroll
    document.body.classList.add('modal-open');

    // Focus first input
    setTimeout(function() {
      var firstInput = contentEl.querySelector('input, select, textarea');
      if (firstInput && firstInput.focus) {
        firstInput.focus();
      }
    }, 100);
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('wizard-open');
    document.body.classList.remove('modal-open');

    // Clear content to avoid stale listeners
    if (contentEl) {
      contentEl.innerHTML = '';
    }
  }

  // -------------------------
  // WINDOW WIZARD
  // -------------------------

  function buildWindowWizardContent() {
    if (!contentEl) return;

    // Get window types (extended if available)
    var windowTypes = [];
    if (window.WINDOW_TYPES_ARRAY && WINDOW_TYPES_ARRAY.length > 0) {
      windowTypes = window.WINDOW_TYPES_ARRAY;
    } else if (window.PRICING_DATA && PRICING_DATA.windowTypes) {
      windowTypes = PRICING_DATA.windowTypes;
    }

    var hasCategories = windowTypes.length > 0 && windowTypes[0].category;

    var html = '';

    // Intro
    html += '<div class="wizard-intro">';
    html += '<p>Quickly add a window cleaning line item. All details can be fine-tuned after adding.</p>';
    html += '</div>';

    // Search box (if we have many types)
    if (windowTypes.length > 10) {
      html += '<div class="form-group">';
      html += '<label class="form-label" for="wizWinSearch">Quick Search</label>';
      html += '<input id="wizWinSearch" type="text" class="form-input" placeholder="Search window types..." aria-label="Search window types" />';
      html += '<span class="form-hint">Type to filter window types by name or description</span>';
      html += '</div>';
    }

    html += '<div class="wizard-section-title">Window Details</div>';
    html += '<div class="wizard-grid">';

    // Title / location
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizWinTitle">Line Title</label>';
    html += '<input id="wizWinTitle" type="text" class="form-input" placeholder="e.g., Balcony sliders, Front windows" aria-label="Window line title" />';
    html += '<span class="form-hint">Brief description for your reference</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizWinLocation">Location / Notes</label>';
    html += '<input id="wizWinLocation" type="text" class="form-input" placeholder="e.g., Balcony, street-facing" aria-label="Window location" />';
    html += '<span class="form-hint">Optional location details</span>';
    html += '</div>';

    // Type selector with categories
    html += '<div class="form-group">';
    html += '<label class="form-label form-label-required" for="wizWinType">Window Type</label>';
    html += '<select id="wizWinType" class="form-select" aria-required="true" aria-label="Select window type">';
    html += '<option value="">Select window type...</option>';

    if (hasCategories) {
      // Grouped by category
      var categories = {
        sliding: [],
        awning: [],
        fixed: [],
        casement: [],
        louvre: [],
        bifold: [],
        stacker: [],
        skylight: [],
        custom: [],
        other: []
      };

      for (var i = 0; i < windowTypes.length; i++) {
        var wt = windowTypes[i];
        var cat = wt.category || 'other';
        if (categories[cat]) {
          categories[cat].push(wt);
        } else {
          categories.other.push(wt);
        }
      }

      var categoryLabels = {
        sliding: 'Sliding Windows',
        awning: 'Awning Windows',
        fixed: 'Fixed Windows',
        casement: 'Casement Windows',
        louvre: 'Louvre Windows',
        bifold: 'Bi-fold Doors',
        stacker: 'Stacker Doors',
        skylight: 'Skylights',
        custom: 'Custom',
        other: 'Other'
      };

      for (var catKey in categoryLabels) {
        if (categories[catKey] && categories[catKey].length > 0) {
          html += '<optgroup label="' + categoryLabels[catKey] + '">';
          for (var j = 0; j < categories[catKey].length; j++) {
            var w = categories[catKey][j];
            var priceStr = w.basePrice ? ' - $' + w.basePrice.toFixed(0) : '';
            var sizeStr = w.width ? ' (' + w.width + 'mm)' : '';
            html += '<option value="' + w.id + '" data-price="' + (w.basePrice || 0) + '" data-category="' + (w.category || '') + '">';
            html += escapeHTML(w.label) + sizeStr + priceStr;
            html += '</option>';
          }
          html += '</optgroup>';
        }
      }
    } else {
      // Simple flat list
      for (var k = 0; k < windowTypes.length; k++) {
        var wt2 = windowTypes[k];
        html += '<option value="' + wt2.id + '">' + escapeHTML(wt2.label) + '</option>';
      }
    }

    html += '</select>';
    html += '<span class="form-hint" id="wizWinTypeHint">Choose the window type that best matches</span>';
    html += '</div>';

    // Window type details (shown when type selected)
    html += '<div id="wizWinTypeDetails" class="card" style="display:none; grid-column: 1 / -1; margin-top: 8px; padding: 12px; background: var(--color-neutral-50);">';
    html += '<div id="wizWinTypeDetailsContent"></div>';
    html += '</div>';

    // Quantity
    html += '<div class="form-group">';
    html += '<label class="form-label form-label-required" for="wizWinPanes">Quantity</label>';
    html += '<input id="wizWinPanes" type="number" min="1" step="1" value="4" class="form-input" aria-required="true" aria-label="Number of windows" />';
    html += '<span class="form-hint">Number of windows/panes</span>';
    html += '</div>';

    // Inside / Outside checkboxes
    html += '<div class="form-group">';
    html += '<label class="form-label">Cleaning Sides</label>';
    html += '<div style="display: flex; gap: 16px; align-items: center;">';
    html += '<div class="form-checkbox-wrapper">';
    html += '<input id="wizWinInside" class="form-checkbox" type="checkbox" checked aria-label="Clean inside" />';
    html += '<label for="wizWinInside">Inside</label>';
    html += '</div>';
    html += '<div class="form-checkbox-wrapper">';
    html += '<input id="wizWinOutside" class="form-checkbox" type="checkbox" checked aria-label="Clean outside" />';
    html += '<label for="wizWinOutside">Outside</label>';
    html += '</div>';
    html += '</div>';
    html += '<span class="form-hint">Select which sides to clean</span>';
    html += '</div>';

    // High Reach
    html += '<div class="form-group">';
    html += '<label class="form-label">Special Requirements</label>';
    html += '<div class="form-checkbox-wrapper">';
    html += '<input id="wizWinHigh" class="form-checkbox" type="checkbox" aria-label="High reach required" />';
    html += '<label for="wizWinHigh">High Reach Required</label>';
    html += '</div>';
    html += '<span class="form-hint">Check if ladder or pole required</span>';
    html += '</div>';

    // Condition (enhanced if available)
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizWinCondition">Condition</label>';
    html += '<select id="wizWinCondition" class="form-select" aria-label="Window condition">';

    if (window.WINDOW_CONDITIONS_ARRAY && WINDOW_CONDITIONS_ARRAY.length > 0) {
      for (var c = 0; c < WINDOW_CONDITIONS_ARRAY.length; c++) {
        var cond = WINDOW_CONDITIONS_ARRAY[c];
        var selected = cond.id === 'normal_dirt' ? ' selected' : '';
        var mult = (cond.multiplier * 100).toFixed(0);
        html += '<option value="' + cond.id + '"' + selected + '>';
        html += escapeHTML(cond.name) + ' (' + mult + '% time)';
        html += '</option>';
      }
    } else {
      // Fallback
      html += '<option value="light">Light</option>';
      html += '<option value="medium" selected>Medium</option>';
      html += '<option value="heavy">Heavy</option>';
    }

    html += '</select>';
    html += '<span class="form-hint">Level of dirt/staining</span>';
    html += '</div>';

    // Access modifier (enhanced if available)
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizWinAccess">Access Difficulty</label>';
    html += '<select id="wizWinAccess" class="form-select" aria-label="Access difficulty">';

    if (window.ACCESS_MODIFIERS_ARRAY && ACCESS_MODIFIERS_ARRAY.length > 0) {
      for (var a = 0; a < ACCESS_MODIFIERS_ARRAY.length; a++) {
        var acc = ACCESS_MODIFIERS_ARRAY[a];
        var selectedAcc = acc.id === 'ground_level' ? ' selected' : '';
        var multAcc = (acc.multiplier * 100).toFixed(0);
        html += '<option value="' + acc.id + '"' + selectedAcc + '>';
        html += escapeHTML(acc.name) + ' (' + multAcc + '% time)';
        html += '</option>';
      }
    } else {
      // Fallback
      html += '<option value="easy" selected>Easy Access</option>';
      html += '<option value="ladder">Ladder Required</option>';
      html += '<option value="highReach">High Reach</option>';
    }

    html += '</select>';
    html += '<span class="form-hint">How difficult is access?</span>';
    html += '</div>';

    // Tint level
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizWinTint">Tint Level</label>';
    html += '<select id="wizWinTint" class="form-select" aria-label="Tint level">';
    html += '<option value="none" selected>No Tint</option>';
    html += '<option value="light">Light Tint</option>';
    html += '<option value="heavy">Heavy/Dark Tint</option>';
    html += '</select>';
    html += '<span class="form-hint">Window tinting level</span>';
    html += '</div>';

    html += '</div>'; // .wizard-grid

    // Price estimate
    html += '<div id="wizWinPriceEstimate" class="card" style="margin-top: 16px; padding: 12px; background: var(--color-primary-light); color: white; display: none;">';
    html += '<div style="font-size: 0.875rem; opacity: 0.9;">Estimated Price</div>';
    html += '<div style="font-size: 1.5rem; font-weight: 600;" id="wizWinPriceAmount">$0.00</div>';
    html += '<div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">Approximate only - final price may vary</div>';
    html += '</div>';

    // Buttons
    html += '<div style="margin-top: 16px; display: flex; justify-content: space-between; gap: 8px;">';
    html += '<button id="wizWinCancel" type="button" class="btn btn-tertiary" aria-label="Cancel">Cancel</button>';
    html += '<button id="wizWinApply" type="button" class="btn btn-primary" aria-label="Add to window list">Add to Window List</button>';
    html += '</div>';

    contentEl.innerHTML = html;

    // Wire up search functionality
    var searchInput = $('wizWinSearch');
    var typeSelect = $('wizWinType');

    if (searchInput && typeSelect) {
      searchInput.addEventListener('input', function() {
        var query = searchInput.value.toLowerCase();
        var options = typeSelect.querySelectorAll('option');
        var optgroups = typeSelect.querySelectorAll('optgroup');

        if (!query) {
          // Show all
          for (var i = 0; i < options.length; i++) {
            options[i].style.display = '';
          }
          for (var j = 0; j < optgroups.length; j++) {
            optgroups[j].style.display = '';
          }
          return;
        }

        // Filter options
        for (var k = 0; k < options.length; k++) {
          var opt = options[k];
          if (opt.value === '') {
            opt.style.display = '';
            continue;
          }
          var text = opt.textContent.toLowerCase();
          opt.style.display = text.indexOf(query) !== -1 ? '' : 'none';
        }

        // Hide empty optgroups
        for (var m = 0; m < optgroups.length; m++) {
          var grp = optgroups[m];
          var visibleOpts = 0;
          var grpOptions = grp.querySelectorAll('option');
          for (var n = 0; n < grpOptions.length; n++) {
            if (grpOptions[n].style.display !== 'none') {
              visibleOpts++;
            }
          }
          grp.style.display = visibleOpts > 0 ? '' : 'none';
        }
      });
    }

    // Show type details when selected
    if (typeSelect) {
      typeSelect.addEventListener('change', updateWindowTypeDetails);
      updateWindowTypeDetails(); // Initial update
    }

    // Update price estimate on any change
    var priceInputs = [
      $('wizWinType'),
      $('wizWinPanes'),
      $('wizWinInside'),
      $('wizWinOutside'),
      $('wizWinHigh'),
      $('wizWinCondition'),
      $('wizWinAccess'),
      $('wizWinTint')
    ];

    for (var p = 0; p < priceInputs.length; p++) {
      if (priceInputs[p]) {
        priceInputs[p].addEventListener('change', updateWindowPriceEstimate);
        priceInputs[p].addEventListener('input', updateWindowPriceEstimate);
      }
    }

    // Wire buttons
    var cancelBtn = $('wizWinCancel');
    var applyBtn = $('wizWinApply');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeOverlay);
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', handleWindowWizardApply);

      // Enter key submits
      contentEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          var target = e.target;
          if (target && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleWindowWizardApply();
          }
        }
      });
    }
  }

  function updateWindowTypeDetails() {
    var typeSelect = $('wizWinType');
    var detailsDiv = $('wizWinTypeDetails');
    var detailsContent = $('wizWinTypeDetailsContent');

    if (!typeSelect || !detailsDiv || !detailsContent) return;

    var selectedId = typeSelect.value;
    if (!selectedId) {
      detailsDiv.style.display = 'none';
      return;
    }

    // Find the selected window type
    var windowType = null;
    if (window.WindowTypesExtended && window.WindowTypesExtended.getType) {
      windowType = window.WindowTypesExtended.getType(selectedId);
    } else if (window.WINDOW_TYPES_ARRAY) {
      for (var i = 0; i < WINDOW_TYPES_ARRAY.length; i++) {
        if (WINDOW_TYPES_ARRAY[i].id === selectedId) {
          windowType = WINDOW_TYPES_ARRAY[i];
          break;
        }
      }
    }

    if (!windowType) {
      detailsDiv.style.display = 'none';
      return;
    }

    // Build details HTML
    var html = '<div style="font-weight: 600; margin-bottom: 8px;">' + escapeHTML(windowType.label || windowType.name) + '</div>';

    if (windowType.description) {
      html += '<div style="font-size: 0.875rem; margin-bottom: 8px;">' + escapeHTML(windowType.description) + '</div>';
    }

    var details = [];

    if (windowType.width && windowType.height) {
      details.push('Size: ' + windowType.width + 'mm × ' + windowType.height + 'mm');
    }

    if (windowType.basePrice) {
      details.push('Base price: $' + windowType.basePrice.toFixed(2) + ' each');
    }

    if (windowType.baseMinutesInside || windowType.baseMinutesOutside) {
      var timeIn = windowType.baseMinutesInside || 0;
      var timeOut = windowType.baseMinutesOutside || 0;
      details.push('Time: ' + timeIn + 'min inside + ' + timeOut + 'min outside');
    }

    if (windowType.commonLocations) {
      details.push('Common: ' + windowType.commonLocations);
    }

    if (details.length > 0) {
      html += '<div style="font-size: 0.75rem; color: var(--color-neutral-600);">';
      html += details.join(' • ');
      html += '</div>';
    }

    if (windowType.notes) {
      html += '<div style="margin-top: 8px; padding: 8px; background: var(--color-warning-light); border-left: 3px solid var(--color-warning); font-size: 0.75rem;">';
      html += '<strong>Note:</strong> ' + escapeHTML(windowType.notes);
      html += '</div>';
    }

    detailsContent.innerHTML = html;
    detailsDiv.style.display = 'block';
  }

  function updateWindowPriceEstimate() {
    var typeSelect = $('wizWinType');
    var panesInput = $('wizWinPanes');
    var estimateDiv = $('wizWinPriceEstimate');
    var amountDiv = $('wizWinPriceAmount');

    if (!typeSelect || !panesInput || !estimateDiv || !amountDiv) return;

    var selectedId = typeSelect.value;
    var quantity = toInt(panesInput.value, 0);

    if (!selectedId || quantity <= 0) {
      estimateDiv.style.display = 'none';
      return;
    }

    // Get window type
    var windowType = null;
    if (window.WindowTypesExtended && window.WindowTypesExtended.getType) {
      windowType = window.WindowTypesExtended.getType(selectedId);
    }

    if (!windowType || !windowType.basePrice) {
      estimateDiv.style.display = 'none';
      return;
    }

    // Calculate estimate
    var basePrice = windowType.basePrice * quantity;

    // Apply modifiers
    var condSelect = $('wizWinCondition');
    var accessSelect = $('wizWinAccess');
    var highCheck = $('wizWinHigh');

    var multiplier = 1.0;

    if (condSelect && condSelect.value) {
      // Find condition multiplier
      if (window.WINDOW_CONDITIONS_ARRAY) {
        for (var i = 0; i < WINDOW_CONDITIONS_ARRAY.length; i++) {
          if (WINDOW_CONDITIONS_ARRAY[i].id === condSelect.value) {
            multiplier *= WINDOW_CONDITIONS_ARRAY[i].multiplier || 1.0;
            break;
          }
        }
      } else {
        // Fallback multipliers
        var condMults = { light: 1.0, medium: 1.2, heavy: 1.4 };
        multiplier *= condMults[condSelect.value] || 1.0;
      }
    }

    if (accessSelect && accessSelect.value) {
      // Find access multiplier
      if (window.ACCESS_MODIFIERS_ARRAY) {
        for (var j = 0; j < ACCESS_MODIFIERS_ARRAY.length; j++) {
          if (ACCESS_MODIFIERS_ARRAY[j].id === accessSelect.value) {
            multiplier *= ACCESS_MODIFIERS_ARRAY[j].multiplier || 1.0;
            break;
          }
        }
      } else {
        // Fallback multipliers
        var accMults = { easy: 1.0, ladder: 1.25, highReach: 1.4 };
        multiplier *= accMults[accessSelect.value] || 1.0;
      }
    }

    if (highCheck && highCheck.checked) {
      multiplier *= 1.4;
    }

    var estimate = basePrice * multiplier;

    amountDiv.textContent = '$' + estimate.toFixed(2);
    estimateDiv.style.display = 'block';
  }

  function handleWindowWizardApply() {
    try {
      if (!window.APP || typeof APP.addWindowLine !== 'function') {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Window line creation not available', 'error');
        }
        closeOverlay();
        return;
      }

      // Validation
      var typeSelect = $('wizWinType');
      var windowTypeId = typeSelect ? typeSelect.value : '';

      if (!windowTypeId) {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Please select a window type', 'error');
        }
        if (typeSelect && typeSelect.focus) {
          typeSelect.focus();
        }
        return;
      }

      var title = $('wizWinTitle') ? $('wizWinTitle').value : '';
      var location = $('wizWinLocation') ? $('wizWinLocation').value : '';
      var panes = toInt($('wizWinPanes') ? $('wizWinPanes').value : '4', 4);

      if (panes < 1) panes = 1;

      var inside = $('wizWinInside') && $('wizWinInside').checked;
      var outside = $('wizWinOutside') && $('wizWinOutside').checked;

      // If both unchecked, force outside as fallback
      if (!inside && !outside) {
        outside = true;
      }

      var highReach = $('wizWinHigh') && $('wizWinHigh').checked;

      // Condition and access
      var conditionId = null;
      var accessId = null;
      var soilLevel = 'medium'; // Legacy fallback

      if ($('wizWinCondition')) {
        conditionId = $('wizWinCondition').value;
        // Map to legacy soilLevel
        if (conditionId === 'light_dust') soilLevel = 'light';
        else if (conditionId === 'normal_dirt') soilLevel = 'medium';
        else if (conditionId === 'heavy_dirt' || conditionId === 'severe_neglect') soilLevel = 'heavy';
      }

      if ($('wizWinAccess')) {
        accessId = $('wizWinAccess').value;
        // Set highReach for backward compatibility
        if (accessId && accessId.indexOf('high') !== -1) {
          highReach = true;
        }
      }

      var tintLevel = $('wizWinTint') && $('wizWinTint').value ? $('wizWinTint').value : 'none';

      var modifiers = [];
      if (conditionId) modifiers.push({ id: conditionId, type: 'condition' });
      if (accessId) modifiers.push({ id: accessId, type: 'access' });
      if (tintLevel && tintLevel !== 'none') modifiers.push({ id: 'tint_' + tintLevel, type: 'tint' });

      var opts = {
        title: title || 'Window Line',
        windowTypeId: windowTypeId,
        panes: panes,
        inside: inside,
        outside: outside,
        highReach: highReach,
        soilLevel: soilLevel,
        conditionId: conditionId,
        accessId: accessId,
        tintLevel: tintLevel,
        location: location,
        modifiers: modifiers
      };

      if (APP.buildWindowLine) {
        APP.addWindowLine(APP.buildWindowLine(opts));
      } else {
        APP.addWindowLine(opts);
      }

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Window line added successfully', 'success');
      }

      closeOverlay();
    } catch (err) {
      if (window.console && console.error) {
        console.error('[WIZARD] Window wizard apply error:', err);
      }
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Error adding window line', 'error');
      }
      closeOverlay();
    }
  }

  function openWindowWizard() {
    initOverlay();
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = 'Window Wizard';
    buildWindowWizardContent();
    openOverlay();
  }

  // -------------------------
  // PRESSURE WIZARD
  // -------------------------

  function buildPressureWizardContent() {
    if (!contentEl) return;

    // Get surfaces (extended if available)
    var surfaces = [];
    var useExtended = false;

    if (window.PRESSURE_SURFACES_ARRAY_EXT && PRESSURE_SURFACES_ARRAY_EXT.length > 0) {
      surfaces = window.PRESSURE_SURFACES_ARRAY_EXT;
      useExtended = true;
    } else if (window.PRICING_DATA && PRICING_DATA.pressureSurfaces) {
      surfaces = PRICING_DATA.pressureSurfaces;
    }

    var html = '';

    // Intro
    html += '<div class="wizard-intro">';
    html += '<p>Add a pressure cleaning line item for driveways, patios, decking, and more.</p>';
    html += '</div>';

    // Search box (if we have many surfaces)
    if (surfaces.length > 10) {
      html += '<div class="form-group">';
      html += '<label class="form-label" for="wizPrSearch">Quick Search</label>';
      html += '<input id="wizPrSearch" type="text" class="form-input" placeholder="Search surface types..." aria-label="Search surface types" />';
      html += '<span class="form-hint">Type to filter surface types by name or description</span>';
      html += '</div>';
    }

    html += '<div class="wizard-section-title">Surface Details</div>';
    html += '<div class="wizard-grid">';

    // Title / notes
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizPrTitle">Line Title</label>';
    html += '<input id="wizPrTitle" type="text" class="form-input" placeholder="e.g., Front driveway, Rear paving" aria-label="Pressure cleaning line title" />';
    html += '<span class="form-hint">Brief description for your reference</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizPrNotes">Extra Notes</label>';
    html += '<input id="wizPrNotes" type="text" class="form-input" placeholder="e.g., Oil stains, heavy moss" aria-label="Additional notes" />';
    html += '<span class="form-hint">Optional additional details</span>';
    html += '</div>';

    // Surface type selector
    html += '<div class="form-group">';
    html += '<label class="form-label form-label-required" for="wizPrSurface">Surface Type</label>';
    html += '<select id="wizPrSurface" class="form-select" aria-required="true" aria-label="Select surface type">';
    html += '<option value="">Select surface type...</option>';

    if (useExtended) {
      // Grouped by category
      var categories = {
        driveway: [],
        patio: [],
        decking: [],
        pathway: [],
        walls: [],
        fencing: [],
        roofing: [],
        pool: [],
        glass: [],
        furniture: [],
        specialty: []
      };

      for (var i = 0; i < surfaces.length; i++) {
        var s = surfaces[i];
        var cat = s.category || 'specialty';
        if (categories[cat]) {
          categories[cat].push(s);
        } else {
          categories.specialty.push(s);
        }
      }

      var categoryLabels = {
        driveway: 'Driveways & Car Parks',
        patio: 'Patios & Outdoor Living',
        decking: 'Decking',
        pathway: 'Pathways & Steps',
        walls: 'Walls & Retaining',
        fencing: 'Fencing',
        roofing: 'Roofing & Gutters',
        pool: 'Pool Areas',
        glass: 'Glass Surfaces',
        furniture: 'Outdoor Furniture & Features',
        specialty: 'Specialty Services'
      };

      for (var catKey in categoryLabels) {
        if (categories[catKey] && categories[catKey].length > 0) {
          html += '<optgroup label="' + categoryLabels[catKey] + '">';
          for (var j = 0; j < categories[catKey].length; j++) {
            var surf = categories[catKey][j];
            var unitLabel = surf.unit || 'm²';
            var rateStr = surf.baseRate ? ' - $' + surf.baseRate.toFixed(0) + '/' + unitLabel : '';
            html += '<option value="' + surf.id + '" data-unit="' + unitLabel + '" data-rate="' + (surf.baseRate || 0) + '">';
            html += escapeHTML(surf.label) + rateStr;
            html += '</option>';
          }
          html += '</optgroup>';
        }
      }
    } else {
      // Simple flat list
      for (var k = 0; k < surfaces.length; k++) {
        var s2 = surfaces[k];
        html += '<option value="' + s2.id + '">' + escapeHTML(s2.label) + '</option>';
      }
    }

    html += '</select>';
    html += '<span class="form-hint" id="wizPrSurfaceHint">Choose the surface type to clean</span>';
    html += '</div>';

    // Surface details (shown when surface selected)
    html += '<div id="wizPrSurfaceDetails" class="card" style="display:none; grid-column: 1 / -1; margin-top: 8px; padding: 12px; background: var(--color-neutral-50);">';
    html += '<div id="wizPrSurfaceDetailsContent"></div>';
    html += '</div>';

    // Quantity/Area (dynamic label based on unit)
    html += '<div class="form-group">';
    html += '<label class="form-label form-label-required" for="wizPrArea"><span id="wizPrQuantityLabel">Quantity/Area</span></label>';
    html += '<input id="wizPrArea" type="number" min="0.1" step="0.1" value="30" class="form-input" aria-required="true" aria-label="Quantity or area" />';
    html += '<span class="form-hint" id="wizPrQuantityHint">Enter area in m²</span>';
    html += '</div>';

    // Soil / access
    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizPrSoil">Soil Level</label>';
    html += '<select id="wizPrSoil" class="form-select" aria-label="Soil level">';
    html += '<option value="light">Light</option>';
    html += '<option value="medium" selected>Medium</option>';
    html += '<option value="heavy">Heavy</option>';
    html += '</select>';
    html += '<span class="form-hint">Level of dirt/staining</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label" for="wizPrAccess">Access</label>';
    html += '<select id="wizPrAccess" class="form-select" aria-label="Access difficulty">';
    html += '<option value="easy" selected>Easy / Open</option>';
    html += '<option value="ladder">Ladder / Tricky</option>';
    html += '<option value="highReach">High Reach / Long Hose</option>';
    html += '</select>';
    html += '<span class="form-hint">How difficult is access?</span>';
    html += '</div>';

    html += '</div>'; // .wizard-grid

    // Price estimate
    html += '<div id="wizPrPriceEstimate" class="card" style="margin-top: 16px; padding: 12px; background: var(--color-success); color: white; display: none;">';
    html += '<div style="font-size: 0.875rem; opacity: 0.9;">Estimated Price</div>';
    html += '<div style="font-size: 1.5rem; font-weight: 600;" id="wizPrPriceAmount">$0.00</div>';
    html += '<div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">Approximate only - final price may vary</div>';
    html += '</div>';

    // Buttons
    html += '<div style="margin-top: 16px; display: flex; justify-content: space-between; gap: 8px;">';
    html += '<button id="wizPrCancel" type="button" class="btn btn-tertiary" aria-label="Cancel">Cancel</button>';
    html += '<button id="wizPrApply" type="button" class="btn btn-primary" aria-label="Add to pressure list">Add to Pressure List</button>';
    html += '</div>';

    contentEl.innerHTML = html;

    // Wire up search functionality
    var searchInput = $('wizPrSearch');
    var surfaceSelect = $('wizPrSurface');

    if (searchInput && surfaceSelect) {
      searchInput.addEventListener('input', function() {
        var query = searchInput.value.toLowerCase();
        var options = surfaceSelect.querySelectorAll('option');
        var optgroups = surfaceSelect.querySelectorAll('optgroup');

        if (!query) {
          // Show all
          for (var i = 0; i < options.length; i++) {
            options[i].style.display = '';
          }
          for (var j = 0; j < optgroups.length; j++) {
            optgroups[j].style.display = '';
          }
          return;
        }

        // Filter options
        for (var k = 0; k < options.length; k++) {
          var opt = options[k];
          if (opt.value === '') {
            opt.style.display = '';
            continue;
          }
          var text = opt.textContent.toLowerCase();
          opt.style.display = text.indexOf(query) !== -1 ? '' : 'none';
        }

        // Hide empty optgroups
        for (var m = 0; m < optgroups.length; m++) {
          var grp = optgroups[m];
          var visibleOpts = 0;
          var grpOptions = grp.querySelectorAll('option');
          for (var n = 0; n < grpOptions.length; n++) {
            if (grpOptions[n].style.display !== 'none') {
              visibleOpts++;
            }
          }
          grp.style.display = visibleOpts > 0 ? '' : 'none';
        }
      });
    }

    // Update quantity label and surface details when surface changes
    if (surfaceSelect) {
      surfaceSelect.addEventListener('change', function() {
        updatePressureQuantityLabel();
        updatePressureSurfaceDetails();
      });
      updatePressureQuantityLabel();
      updatePressureSurfaceDetails();
    }

    // Update price estimate on any change
    var priceInputs = [
      $('wizPrSurface'),
      $('wizPrArea'),
      $('wizPrSoil'),
      $('wizPrAccess')
    ];

    for (var p = 0; p < priceInputs.length; p++) {
      if (priceInputs[p]) {
        priceInputs[p].addEventListener('change', updatePressurePriceEstimate);
        priceInputs[p].addEventListener('input', updatePressurePriceEstimate);
      }
    }

    // Wire buttons
    var cancelBtn = $('wizPrCancel');
    var applyBtn = $('wizPrApply');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeOverlay);
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', handlePressureWizardApply);

      // Enter key submits
      contentEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          var target = e.target;
          if (target && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handlePressureWizardApply();
          }
        }
      });
    }
  }

  function updatePressureQuantityLabel() {
    var surfaceSelect = $('wizPrSurface');
    var quantityLabel = $('wizPrQuantityLabel');
    var quantityHint = $('wizPrQuantityHint');
    var quantityInput = $('wizPrArea');

    if (!surfaceSelect || !quantityLabel) return;

    var selectedId = surfaceSelect.value;
    var selectedSurface = null;

    // Find the selected surface
    var surfaces = window.PRESSURE_SURFACES_ARRAY_EXT || [];
    for (var i = 0; i < surfaces.length; i++) {
      if (surfaces[i].id === selectedId) {
        selectedSurface = surfaces[i];
        break;
      }
    }

    if (selectedSurface && selectedSurface.unit) {
      var unit = selectedSurface.unit;

      if (unit === 'per panel') {
        quantityLabel.textContent = 'Number of Panels';
        if (quantityHint) quantityHint.textContent = 'How many panels?';
        if (quantityInput) quantityInput.value = '4';
      } else if (unit === 'per bin') {
        quantityLabel.textContent = 'Number of Bins';
        if (quantityHint) quantityHint.textContent = 'How many bins to clean?';
        if (quantityInput) quantityInput.value = '2';
      } else if (unit === 'per vehicle' || unit === 'per trailer') {
        quantityLabel.textContent = 'Number of Vehicles';
        if (quantityHint) quantityHint.textContent = 'How many to clean?';
        if (quantityInput) quantityInput.value = '1';
      } else if (unit === 'per set') {
        quantityLabel.textContent = 'Number of Sets';
        if (quantityHint) quantityHint.textContent = 'How many sets?';
        if (quantityInput) quantityInput.value = '1';
      } else if (unit === 'per item') {
        quantityLabel.textContent = 'Number of Items';
        if (quantityHint) quantityHint.textContent = 'How many items?';
        if (quantityInput) quantityInput.value = '1';
      } else if (unit === 'per sign') {
        quantityLabel.textContent = 'Number of Signs';
        if (quantityHint) quantityHint.textContent = 'How many signs?';
        if (quantityInput) quantityInput.value = '1';
      } else if (unit === 'per skylight') {
        quantityLabel.textContent = 'Number of Skylights';
        if (quantityHint) quantityHint.textContent = 'How many skylights?';
        if (quantityInput) quantityInput.value = '2';
      } else if (unit === 'per survey') {
        quantityLabel.textContent = 'Survey Required';
        if (quantityHint) quantityHint.textContent = 'Fixed price survey';
        if (quantityInput) quantityInput.value = '1';
      } else if (unit === 'per metre' || unit === 'linear m') {
        quantityLabel.textContent = 'Length (metres)';
        if (quantityHint) quantityHint.textContent = 'Enter length in metres';
        if (quantityInput) quantityInput.value = '10';
      } else {
        // Default to area (m²)
        quantityLabel.textContent = 'Area (m²)';
        if (quantityHint) quantityHint.textContent = 'Enter area in square metres';
        if (quantityInput) quantityInput.value = '30';
      }
    } else {
      // Default to area
      quantityLabel.textContent = 'Area (m²)';
      if (quantityHint) quantityHint.textContent = 'Enter area in square metres';
      if (quantityInput) quantityInput.value = '30';
    }
  }

  function updatePressureSurfaceDetails() {
    var surfaceSelect = $('wizPrSurface');
    var detailsDiv = $('wizPrSurfaceDetails');
    var detailsContent = $('wizPrSurfaceDetailsContent');

    if (!surfaceSelect || !detailsDiv || !detailsContent) return;

    var selectedId = surfaceSelect.value;
    if (!selectedId) {
      detailsDiv.style.display = 'none';
      return;
    }

    // Find the selected surface
    var surface = null;
    if (window.PressureSurfacesExtended && window.PressureSurfacesExtended.getSurface) {
      surface = window.PressureSurfacesExtended.getSurface(selectedId);
    } else if (window.PRESSURE_SURFACES_ARRAY_EXT) {
      for (var i = 0; i < PRESSURE_SURFACES_ARRAY_EXT.length; i++) {
        if (PRESSURE_SURFACES_ARRAY_EXT[i].id === selectedId) {
          surface = PRESSURE_SURFACES_ARRAY_EXT[i];
          break;
        }
      }
    }

    if (!surface) {
      detailsDiv.style.display = 'none';
      return;
    }

    // Build details HTML
    var html = '<div style="font-weight: 600; margin-bottom: 8px;">' + escapeHTML(surface.label || surface.name) + '</div>';

    if (surface.description) {
      html += '<div style="font-size: 0.875rem; margin-bottom: 8px;">' + escapeHTML(surface.description) + '</div>';
    }

    var details = [];

    if (surface.unit) {
      details.push('Unit: ' + surface.unit);
    }

    if (surface.baseRate) {
      var unitStr = surface.unit || 'm²';
      details.push('Rate: $' + surface.baseRate.toFixed(2) + '/' + unitStr);
    }

    var timePerUnit = surface.minutesPerSqm || surface.minutesPerLinearM || surface.minutesPerPanel;
    if (timePerUnit) {
      details.push('Time: ' + timePerUnit.toFixed(1) + 'min per unit');
    }

    if (details.length > 0) {
      html += '<div style="font-size: 0.75rem; color: var(--color-neutral-600);">';
      html += details.join(' • ');
      html += '</div>';
    }

    // Check for warnings
    var hasWarning = surface.notes && (
      surface.notes.indexOf('CRITICAL') !== -1 ||
      surface.notes.indexOf('DELICATE') !== -1 ||
      surface.notes.indexOf('CARE') !== -1 ||
      surface.notes.indexOf('LOW PRESSURE') !== -1 ||
      surface.notes.indexOf('SOFT') !== -1
    );

    if (surface.notes) {
      var warningClass = hasWarning ? 'var(--color-warning)' : 'var(--color-info)';
      html += '<div style="margin-top: 8px; padding: 8px; background: var(--color-neutral-100); border-left: 3px solid ' + warningClass + '; font-size: 0.75rem;">';
      html += '<strong>Note:</strong> ' + escapeHTML(surface.notes);
      html += '</div>';
    }

    detailsContent.innerHTML = html;
    detailsDiv.style.display = 'block';
  }

  function updatePressurePriceEstimate() {
    var surfaceSelect = $('wizPrSurface');
    var areaInput = $('wizPrArea');
    var estimateDiv = $('wizPrPriceEstimate');
    var amountDiv = $('wizPrPriceAmount');

    if (!surfaceSelect || !areaInput || !estimateDiv || !amountDiv) return;

    var selectedId = surfaceSelect.value;
    var quantity = toFloat(areaInput.value, 0);

    if (!selectedId || quantity <= 0) {
      estimateDiv.style.display = 'none';
      return;
    }

    // Get surface
    var surface = null;
    if (window.PressureSurfacesExtended && window.PressureSurfacesExtended.getSurface) {
      surface = window.PressureSurfacesExtended.getSurface(selectedId);
    } else if (window.PRESSURE_SURFACES_ARRAY_EXT) {
      for (var i = 0; i < PRESSURE_SURFACES_ARRAY_EXT.length; i++) {
        if (PRESSURE_SURFACES_ARRAY_EXT[i].id === selectedId) {
          surface = PRESSURE_SURFACES_ARRAY_EXT[i];
          break;
        }
      }
    }

    if (!surface || !surface.baseRate) {
      estimateDiv.style.display = 'none';
      return;
    }

    // Calculate estimate
    var basePrice = surface.baseRate * quantity;

    // Apply modifiers
    var soilSelect = $('wizPrSoil');
    var accessSelect = $('wizPrAccess');

    var multiplier = 1.0;

    if (soilSelect && soilSelect.value) {
      var soilMults = { light: 1.0, medium: 1.2, heavy: 1.4 };
      multiplier *= soilMults[soilSelect.value] || 1.0;
    }

    if (accessSelect && accessSelect.value) {
      var accMults = { easy: 1.0, ladder: 1.25, highReach: 1.4 };
      multiplier *= accMults[accessSelect.value] || 1.0;
    }

    var estimate = basePrice * multiplier;

    amountDiv.textContent = '$' + estimate.toFixed(2);
    estimateDiv.style.display = 'block';
  }

  function handlePressureWizardApply() {
    try {
      if (!window.APP || typeof APP.addPressureLine !== 'function') {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Pressure line creation not available', 'error');
        }
        closeOverlay();
        return;
      }

      // Validation
      var surfaceSelect = $('wizPrSurface');
      var surfaceId = surfaceSelect ? surfaceSelect.value : '';

      if (!surfaceId) {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Please select a surface type', 'error');
        }
        if (surfaceSelect && surfaceSelect.focus) {
          surfaceSelect.focus();
        }
        return;
      }

      var title = $('wizPrTitle') ? $('wizPrTitle').value : '';
      var notes = $('wizPrNotes') ? $('wizPrNotes').value : '';

      var area = toFloat($('wizPrArea') ? $('wizPrArea').value : '30', 30);
      if (area <= 0) {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Please enter a valid quantity/area', 'error');
        }
        return;
      }

      var soilLevel = $('wizPrSoil') && $('wizPrSoil').value ? $('wizPrSoil').value : 'medium';
      var access = $('wizPrAccess') && $('wizPrAccess').value ? $('wizPrAccess').value : 'easy';

      var modifiers = [];
      if (soilLevel) modifiers.push({ id: soilLevel, type: 'soil' });
      if (access) modifiers.push({ id: access, type: 'access' });

      var opts = {
        title: title || 'Pressure Line',
        surfaceId: surfaceId,
        areaSqm: area,
        soilLevel: soilLevel,
        access: access,
        notes: notes,
        modifiers: modifiers
      };

      if (APP.buildPressureLine) {
        APP.addPressureLine(APP.buildPressureLine(opts));
      } else {
        APP.addPressureLine(opts);
      }

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Pressure line added successfully', 'success');
      }

      closeOverlay();
    } catch (err) {
      if (window.console && console.error) {
        console.error('[WIZARD] Pressure wizard apply error:', err);
      }
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Error adding pressure line', 'error');
      }
      closeOverlay();
    }
  }

  function openPressureWizard() {
    initOverlay();
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = 'Pressure Wizard';
    buildPressureWizardContent();
    openOverlay();
  }

  // -------------------------
  // Export global Wizard API
  // -------------------------
  window.Wizard = {
    openWindowWizard: openWindowWizard,
    openPressureWizard: openPressureWizard,
    close: closeOverlay
  };

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('wizard', {
      openWindowWizard: openWindowWizard,
      openPressureWizard: openPressureWizard,
      close: closeOverlay
    });
  }

  // Ensure overlay is initialised once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
  } else {
    initOverlay();
  }

  console.log('[WIZARD] Enhanced wizards v2.0 initialized');
})();
