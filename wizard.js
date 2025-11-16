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

    var windowTypes = (window.PRICING_DATA && PRICING_DATA.windowTypes) || [];
    var optionsHtml = "";
    var i;
    for (i = 0; i < windowTypes.length; i++) {
      var wt = windowTypes[i];
      optionsHtml +=
        '<option value="' +
        wt.id +
        '">' +
        wt.label +
        "</option>";
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
      '<input id="wizWinTitle" type="text" placeholder="e.g. Balcony sliders / Front windows" />';
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Location / Notes</span>';
    html +=
      '<input id="wizWinLocation" type="text" placeholder="e.g. Balcony, street-facing, etc." />';
    html += "</label>";

    // Type + panes
    html += '<label class="field">';
    html += '<span class="field-label">Window Type</span>';
    html += '<select id="wizWinType">';
    html += optionsHtml || '<option value="">(No types configured)</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Approx. Panes</span>';
    html +=
      '<input id="wizWinPanes" type="number" min="1" step="1" value="4" />';
    html += "</label>";

    // Flags
    html += '<label class="field">';
    html += '<span class="field-label">Inside / Outside</span>';
    html += '<div class="toggle">';
    html +=
      '<input id="wizWinInside" type="checkbox" checked /> <span>Inside</span>';
    html +=
      '<input id="wizWinOutside" type="checkbox" checked style="margin-left:10px;" /> <span>Outside</span>';
    html += "</div>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">High Reach</span>';
    html += '<div class="toggle">';
    html += '<input id="wizWinHigh" type="checkbox" /> <span>High reach</span>';
    html += "</div>";
    html += "</label>";

    // Soil & tint
    html += '<label class="field">';
    html += '<span class="field-label">Soil Level</span>';
    html += '<select id="wizWinSoil">';
    html += '<option value="light">Light</option>';
    html += '<option value="medium" selected>Medium</option>';
    html += '<option value="heavy">Heavy</option>';
    html += "</select>";
    html += "</label>";

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
    html +=
      '<div style="margin-top:8px;display:flex;justify-content:space-between;gap:6px;">';
    html +=
      '<button id="wizWinCancel" type="button" class="btn btn-ghost btn-small">Cancel</button>';
    html +=
      '<button id="wizWinApply" type="button" class="btn btn-small">Add to Window List</button>';
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

          var soilLevel =
            $("wizWinSoil") && $("wizWinSoil").value
              ? $("wizWinSoil").value
              : "medium";

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
      '<input id="wizPrTitle" type="text" placeholder="e.g. Front driveway / Rear paving" />';
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Extra Notes</span>';
    html +=
      '<input id="wizPrNotes" type="text" placeholder="e.g. Oil stains on centre, heavy moss" />';
    html += "</label>";

    // Surface + area
    html += '<label class="field">';
    html += '<span class="field-label">Surface Type</span>';
    html += '<select id="wizPrSurface">';
    html += optionsHtml || '<option value="">(No surfaces configured)</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Area (sqm)</span>';
    html +=
      '<input id="wizPrArea" type="number" min="5" step="1" value="30" />';
    html += "</label>";

    // Soil / access
    html += '<label class="field">';
    html += '<span class="field-label">Soil Level</span>';
    html += '<select id="wizPrSoil">';
    html += '<option value="light">Light</option>';
    html += '<option value="medium" selected>Medium</option>';
    html += '<option value="heavy">Heavy</option>';
    html += "</select>";
    html += "</label>";

    html += '<label class="field">';
    html += '<span class="field-label">Access</span>';
    html += '<select id="wizPrAccess">';
    html += '<option value="easy" selected>Easy / open</option>';
    html += '<option value="ladder">Ladder / tricky</option>';
    html += '<option value="highReach">High reach / long hose</option>';
    html += "</select>";
    html += "</label>";

    html += "</div>"; // .wizard-grid

    // Buttons
    html +=
      '<div style="margin-top:8px;display:flex;justify-content:space-between;gap:6px;">';
    html +=
      '<button id="wizPrCancel" type="button" class="btn btn-ghost btn-small">Cancel</button>';
    html +=
      '<button id="wizPrApply" type="button" class="btn btn-small">Add to Pressure List</button>';
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