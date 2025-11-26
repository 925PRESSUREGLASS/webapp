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

    var lineOpts = {
      windowTypeId: selectedId,
      panes: quantity,
      inside: $('wizWinInside') && $('wizWinInside').checked,
      outside: $('wizWinOutside') && $('wizWinOutside').checked,
      highReach: $('wizWinHigh') && $('wizWinHigh').checked,
      conditionId: $('wizWinCondition') ? $('wizWinCondition').value : null,
      accessId: $('wizWinAccess') ? $('wizWinAccess').value : null,
      tintLevel: $('wizWinTint') ? $('wizWinTint').value : 'none',
      modifiers: []
    };

    if (lineOpts.conditionId) lineOpts.modifiers.push({ id: lineOpts.conditionId });
    if (lineOpts.accessId) lineOpts.modifiers.push({ id: lineOpts.accessId });
    if (lineOpts.tintLevel && lineOpts.tintLevel !== 'none') lineOpts.modifiers.push({ id: 'tint_' + lineOpts.tintLevel });

    var line = window.APP && APP.buildWindowLine ? APP.buildWindowLine(lineOpts) : lineOpts;

    var state = window.APP && APP.getState ? APP.getState() : null;
    if (state) {
      var tempState = JSON.parse(JSON.stringify(state));
      tempState.windowLines = tempState.windowLines || [];
      tempState.windowLines.push(line);

      var result = null;
      if (window.PrecisionCalc && typeof PrecisionCalc.calculate === 'function') {
        try {
          result = PrecisionCalc.calculate({
            windowLines: tempState.windowLines,
            pressureLines: tempState.pressureLines || [],
            baseFee: tempState.baseFee,
            hourlyRate: tempState.hourlyRate,
            minimumJob: tempState.minimumJob,
            highReachModifierPercent: tempState.highReachModifierPercent,
            insideMultiplier: tempState.insideMultiplier,
            outsideMultiplier: tempState.outsideMultiplier,
            pressureHourlyRate: tempState.pressureHourlyRate,
            setupBufferMinutes: tempState.setupBufferMinutes
          });
        } catch (eCalc) {
          result = null;
        }
      }
      if (!result && window.Calc && typeof Calc.calculate === 'function') {
        try {
          result = Calc.calculate(tempState);
        } catch (eCalc2) {
          result = null;
        }
      }

      if (result && result.money && typeof result.money.subtotal === 'number') {
        var currentSubtotal = state.money && typeof state.money.subtotal === 'number' ? state.money.subtotal : 0;
        var delta = result.money.subtotal - currentSubtotal;
        amountDiv.textContent = '$' + delta.toFixed(2);
        estimateDiv.style.display = 'block';
        return;
      }
    }

    estimateDiv.style.display = 'none';

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

    var lineOpts = {
      surfaceId: selectedId,
      areaSqm: quantity,
      soilLevel: $('wizPrSoil') && $('wizPrSoil').value ? $('wizPrSoil').value : 'medium',
      access: $('wizPrAccess') && $('wizPrAccess').value ? $('wizPrAccess').value : 'easy',
      modifiers: []
    };

    if (lineOpts.soilLevel) lineOpts.modifiers.push({ id: lineOpts.soilLevel });
    if (lineOpts.access) lineOpts.modifiers.push({ id: lineOpts.access });

    var line = window.APP && APP.buildPressureLine ? APP.buildPressureLine(lineOpts) : lineOpts;

    var state = window.APP && APP.getState ? APP.getState() : null;
    if (state) {
      var tempState = JSON.parse(JSON.stringify(state));
      tempState.pressureLines = tempState.pressureLines || [];
      tempState.pressureLines.push(line);

      var result = null;
      if (window.PrecisionCalc && typeof PrecisionCalc.calculate === 'function') {
        try {
          result = PrecisionCalc.calculate({
            windowLines: tempState.windowLines || [],
            pressureLines: tempState.pressureLines,
            baseFee: tempState.baseFee,
            hourlyRate: tempState.hourlyRate,
            minimumJob: tempState.minimumJob,
            highReachModifierPercent: tempState.highReachModifierPercent,
            insideMultiplier: tempState.insideMultiplier,
            outsideMultiplier: tempState.outsideMultiplier,
            pressureHourlyRate: tempState.pressureHourlyRate,
            setupBufferMinutes: tempState.setupBufferMinutes
          });
        } catch (eCalc) {
          result = null;
        }
      }
      if (!result && window.Calc && typeof Calc.calculate === 'function') {
        try {
          result = Calc.calculate(tempState);
        } catch (eCalc2) {
          result = null;
        }
      }

      if (result && result.money && typeof result.money.subtotal === 'number') {
        var currentSubtotal = state.money && typeof state.money.subtotal === 'number' ? state.money.subtotal : 0;
        var delta = result.money.subtotal - currentSubtotal;
        amountDiv.textContent = '$' + delta.toFixed(2);
        estimateDiv.style.display = 'block';
        return;
      }
    }

    estimateDiv.style.display = 'none';

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
