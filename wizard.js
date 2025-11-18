// wizard.js – overlay-based wizards for Tic-Tac-Stick
// Works with index.html (#wizardOverlay) + app.js (global Wizard.open*)

(function () {
  "use strict";

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

    overlay = $("wizardOverlay");
    titleEl = $("wizardTitle");
    contentEl = $("wizardContent");
    closeBtn = $("wizardCloseBtn");

    if (!overlay || !titleEl || !contentEl || !closeBtn) {
      // DOM not ready or HTML missing; nothing else to do
      return;
    }

    closeBtn.addEventListener("click", closeOverlay);

    // Click on dark backdrop closes wizard
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closeOverlay();
      }
    });

    isReady = true;
  }

  function openOverlay() {
    if (!isReady) initOverlay();
    if (!overlay) return;
    overlay.classList.add("wizard-open");

    // Set focus to first focusable element for accessibility
    setTimeout(function() {
      var firstInput = overlay.querySelector('input, select, textarea, button');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("wizard-open");
    // Clear content to avoid stale listeners
    if (contentEl) {
      contentEl.innerHTML = "";
    }
  }

  // -------------------------
  // WINDOW WIZARD
  // -------------------------

  function buildWindowWizardContent() {
    if (!contentEl) return;

    // Use extended types if available, otherwise fall back to basic types
    var windowTypes = [];
    if (typeof getAvailableWindowTypes === 'function') {
      windowTypes = getAvailableWindowTypes();
    } else if (window.PRICING_DATA && PRICING_DATA.windowTypes) {
      windowTypes = PRICING_DATA.windowTypes;
    }

    var optionsHtml = "";
    var i;

    // Group by category if extended types are available
    var hasCategories = windowTypes.length > 0 && windowTypes[0].category;

    if (hasCategories) {
      // Build grouped options
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

      for (i = 0; i < windowTypes.length; i++) {
        var wt = windowTypes[i];
        var cat = wt.category || 'other';
        if (categories[cat]) {
          categories[cat].push(wt);
        } else {
          categories.other.push(wt);
        }
      }

      // Build HTML with optgroups
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

      for (var catKey in categories) {
        if (categories[catKey].length > 0) {
          optionsHtml += '<optgroup label="' + categoryLabels[catKey] + '">';
          for (var j = 0; j < categories[catKey].length; j++) {
            var w = categories[catKey][j];
            var priceStr = w.basePrice ? ' - $' + w.basePrice.toFixed(0) : '';
            optionsHtml +=
              '<option value="' + w.id + '">' +
              w.label + priceStr +
              '</option>';
          }
          optionsHtml += '</optgroup>';
        }
      }
    } else {
      // Simple flat list
      for (i = 0; i < windowTypes.length; i++) {
        var wt2 = windowTypes[i];
        optionsHtml +=
          '<option value="' +
          wt2.id +
          '">' +
          wt2.label +
          "</option>";
      }
    }

    var html = "";
    html += '<div class="wizard-intro">';
    html +=
      "Quickly add a typical window setup. You can fine-tune panes, soil and tint after it is added.";
    html += "</div>";

    html += '<div class="wizard-section-title">Window details</div>';
    html += '<div class="wizard-grid">';

    // Title / location
    html += '<label class="field">';
    html += '<span class="field-label">Line Title</span>';
    html +=
      '<input id="wizWinTitle" type="text" placeholder="e.g. Balcony sliders / Front windows" aria-label="Window line title" />';
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Location / Notes</span>';
    html +=
      '<input id="wizWinLocation" type="text" placeholder="e.g. Balcony, street-facing, etc." aria-label="Window location or notes" />';
    html += "</label>";

    // Type + panes
    html += '<label class="field">';
    html += '<span class="field-label">Window Type</span>';
    html += '<select id="wizWinType" aria-label="Select window type">';
    html += optionsHtml || '<option value="">(No types configured)</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Approx. Panes</span>';
    html +=
      '<input id="wizWinPanes" type="number" min="1" step="1" value="4" aria-label="Approximate number of panes" />';
    html += "</label>";

    // Flags
    html += '<label class="field">';
    html += '<span class="field-label">Inside / Outside</span>';
    html += '<div class="toggle">';
    html +=
      '<input id="wizWinInside" class="form-checkbox" type="checkbox" checked aria-label="Clean inside of windows" /> <span>Inside</span>';
    html +=
      '<input id="wizWinOutside" class="form-checkbox checkbox-inline-spaced" type="checkbox" checked aria-label="Clean outside of windows" /> <span>Outside</span>';
    html += "</div>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">High Reach</span>';
    html += '<div class="toggle">';
    html += '<input id="wizWinHigh" class="form-checkbox" type="checkbox" aria-label="High reach required" /> <span>High reach</span>';
    html += "</div>";
    html += "</label>";

    // Condition (soil) - use enhanced conditions if available
    html += '<label class="field">';
    html += '<span class="field-label">Condition</span>';
    html += '<select id="wizWinCondition" aria-label="Window condition or soil level">';

    if (window.WINDOW_CONDITIONS_ARRAY && WINDOW_CONDITIONS_ARRAY.length > 0) {
      // Use enhanced conditions
      for (var c = 0; c < WINDOW_CONDITIONS_ARRAY.length; c++) {
        var cond = WINDOW_CONDITIONS_ARRAY[c];
        var selected = cond.id === 'normal_dirt' ? ' selected' : '';
        html += '<option value="' + cond.id + '"' + selected + '>' +
                cond.name + ' (' + (cond.multiplier * 100).toFixed(0) + '%)' +
                '</option>';
      }
    } else {
      // Fall back to legacy soil levels
      html += '<option value="light">Light</option>';
      html += '<option value="medium" selected>Medium</option>';
      html += '<option value="heavy">Heavy</option>';
    }

    html += "</select>";
    html += "</label>";

    // Access modifier - use enhanced modifiers if available
    html += '<label class="field">';
    html += '<span class="field-label">Access</span>';
    html += '<select id="wizWinAccess" aria-label="Access difficulty level">';

    if (window.ACCESS_MODIFIERS_ARRAY && ACCESS_MODIFIERS_ARRAY.length > 0) {
      // Use enhanced access modifiers
      for (var a = 0; a < ACCESS_MODIFIERS_ARRAY.length; a++) {
        var acc = ACCESS_MODIFIERS_ARRAY[a];
        var selectedAcc = acc.id === 'ground_level' ? ' selected' : '';
        html += '<option value="' + acc.id + '"' + selectedAcc + '>' +
                acc.name + ' (' + (acc.multiplier * 100).toFixed(0) + '%)' +
                '</option>';
      }
    } else {
      // Fall back to legacy access (will use highReach checkbox instead)
      html += '<option value="easy" selected>Easy Access</option>';
      html += '<option value="ladder">Ladder Required</option>';
      html += '<option value="highReach">High Reach</option>';
    }

    html += "</select>";
    html += "</label>";

    // Tint level
    html += '<label class="field">';
    html += '<span class="field-label">Tint Level</span>';
    html += '<select id="wizWinTint">';
    html += '<option value="none" selected>None</option>';
    html += '<option value="light">Light</option>';
    html += '<option value="heavy">Heavy</option>';
    html += "</select>";
    html += "</label>";

    html += "</div>"; // .wizard-grid

    // Buttons
    html += '<div class="wizard-button-group">';
    html +=
      '<button id="wizWinCancel" type="button" class="btn btn-tertiary btn-sm">Cancel</button>';
    html +=
      '<button id="wizWinApply" type="button" class="btn btn-sm btn-primary">Add to Window List</button>';
    html += "</div>";

    contentEl.innerHTML = html;

    // Wire events
    var cancelBtn = $("wizWinCancel");
    var applyBtn = $("wizWinApply");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        closeOverlay();
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        try {
          if (!window.APP || typeof APP.addWindowLine !== "function") {
            closeOverlay();
            return;
          }

          var title = $("wizWinTitle") ? $("wizWinTitle").value : "";
          var location =
            $("wizWinLocation") && $("wizWinLocation").value
              ? $("wizWinLocation").value
              : "";
          var typeSel = $("wizWinType");
          var windowTypeId = typeSel ? typeSel.value : "";
          var panes = toInt(
            $("wizWinPanes") ? $("wizWinPanes").value : "4",
            4
          );
          if (panes < 1) panes = 1;

          var inside =
            $("wizWinInside") && $("wizWinInside").checked ? true : false;
          var outside =
            $("wizWinOutside") && $("wizWinOutside").checked ? true : false;

          // If both unchecked, force outside as fallback
          if (!inside && !outside) {
            outside = true;
          }

          var highReach =
            $("wizWinHigh") && $("wizWinHigh").checked ? true : false;

          // Get condition and access from new dropdowns if available
          var conditionId = null;
          var accessId = null;
          var soilLevel = "medium"; // Legacy fallback

          if ($("wizWinCondition")) {
            conditionId = $("wizWinCondition").value;
            // Also set soilLevel for backward compatibility
            if (conditionId === 'light_dust') soilLevel = 'light';
            else if (conditionId === 'normal_dirt') soilLevel = 'medium';
            else if (conditionId === 'heavy_dirt' || conditionId === 'severe_neglect') soilLevel = 'heavy';
          } else if ($("wizWinSoil")) {
            soilLevel = $("wizWinSoil").value;
          }

          if ($("wizWinAccess")) {
            accessId = $("wizWinAccess").value;
            // Set highReach for backward compatibility
            if (accessId && accessId.indexOf('high') !== -1) {
              highReach = true;
            }
          }

          var tintLevel =
            $("wizWinTint") && $("wizWinTint").value
              ? $("wizWinTint").value
              : "none";

          var opts = {
            title: title || "Window Line",
            windowTypeId: windowTypeId,
            panes: panes,
            inside: inside,
            outside: outside,
            highReach: highReach,
            soilLevel: soilLevel,
            conditionId: conditionId,
            accessId: accessId,
            tintLevel: tintLevel,
            location: location
          };

          APP.addWindowLine(opts);
          closeOverlay();
        } catch (err) {
          if (window.console && console.error) {
            console.error("Window wizard apply error:", err);
          }
          closeOverlay();
        }
      });
    }
  }

  function openWindowWizard() {
    initOverlay();
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = "Window Wizard";
    buildWindowWizardContent();
    openOverlay();
  }

  // -------------------------
  // PRESSURE WIZARD
  // -------------------------

  function buildPressureWizardContent() {
    if (!contentEl) return;

    var surfaces =
      (window.PRICING_DATA && PRICING_DATA.pressureSurfaces) || [];
    var optionsHtml = "";
    var i;
    for (i = 0; i < surfaces.length; i++) {
      var s = surfaces[i];
      optionsHtml +=
        '<option value="' +
        s.id +
        '">' +
        s.label +
        "</option>";
    }

    var html = "";
    html += '<div class="wizard-intro">';
    html +=
      "Estimate typical driveway / paving / patio pressure cleaning in a single line.";
    html += "</div>";

    html += '<div class="wizard-section-title">Surface details</div>';
    html += '<div class="wizard-grid">';

    // Title / notes
    html += '<label class="field">';
    html += '<span class="field-label">Line Title</span>';
    html +=
      '<input id="wizPrTitle" type="text" placeholder="e.g. Front driveway / Rear paving" aria-label="Pressure cleaning line title" />';
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Extra Notes</span>';
    html +=
      '<input id="wizPrNotes" type="text" placeholder="e.g. Oil stains on centre, heavy moss" aria-label="Extra notes about surface condition" />';
    html += "</label>";

    // Surface + area
    html += '<label class="field">';
    html += '<span class="field-label">Surface Type</span>';
    html += '<select id="wizPrSurface" aria-label="Select surface type">';
    html += optionsHtml || '<option value="">(No surfaces configured)</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Area (sqm)</span>';
    html +=
      '<input id="wizPrArea" type="number" min="5" step="1" value="30" aria-label="Area in square meters" />';
    html += "</label>";

    // Soil / access
    html += '<label class="field">';
    html += '<span class="field-label">Soil Level</span>';
    html += '<select id="wizPrSoil" aria-label="Soil or dirt level">';
    html += '<option value="light">Light</option>';
    html += '<option value="medium" selected>Medium</option>';
    html += '<option value="heavy">Heavy</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Access</span>';
    html += '<select id="wizPrAccess" aria-label="Access difficulty">';
    html += '<option value="easy" selected>Easy / open</option>';
    html += '<option value="ladder">Ladder / tricky</option>';
    html += '<option value="highReach">High reach / long hose</option>';
    html += "</select>";
    html += "</label>";

    html += "</div>"; // .wizard-grid

    // Buttons
    html += '<div class="wizard-button-group">';
    html +=
      '<button id="wizPrCancel" type="button" class="btn btn-tertiary btn-sm">Cancel</button>';
    html +=
      '<button id="wizPrApply" type="button" class="btn btn-sm btn-primary">Add to Pressure List</button>';
    html += "</div>";

    contentEl.innerHTML = html;

    // Wire events
    var cancelBtn = $("wizPrCancel");
    var applyBtn = $("wizPrApply");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        closeOverlay();
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        try {
          if (!window.APP || typeof APP.addPressureLine !== "function") {
            closeOverlay();
            return;
          }

          var title = $("wizPrTitle") ? $("wizPrTitle").value : "";
          var notes = $("wizPrNotes") ? $("wizPrNotes").value : "";

          var surfaceSel = $("wizPrSurface");
          var surfaceId = surfaceSel ? surfaceSel.value : "";

          var area = toFloat(
            $("wizPrArea") ? $("wizPrArea").value : "30",
            30
          );
          if (area <= 0) area = 30;

          var soilLevel =
            $("wizPrSoil") && $("wizPrSoil").value
              ? $("wizPrSoil").value
              : "medium";
          var access =
            $("wizPrAccess") && $("wizPrAccess").value
              ? $("wizPrAccess").value
              : "easy";

          var opts = {
            title: title || "Pressure Line",
            surfaceId: surfaceId,
            areaSqm: area,
            soilLevel: soilLevel,
            access: access,
            notes: notes
          };

          APP.addPressureLine(opts);
          closeOverlay();
        } catch (err) {
          if (window.console && console.error) {
            console.error("Pressure wizard apply error:", err);
          }
          closeOverlay();
        }
      });
    }
  }

  function openPressureWizard() {
    initOverlay();
    if (!overlay || !titleEl || !contentEl) return;
    titleEl.textContent = "Pressure Wizard";
    buildPressureWizardContent();
    openOverlay();
  }

  // -------------------------
  // Export global Wizard API
  // -------------------------
  window.Wizard = {
    openWindowWizard: openWindowWizard,
    openPressureWizard: openPressureWizard
  };

  // Ensure overlay is initialised once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOverlay);
  } else {
    initOverlay();
  }
})();