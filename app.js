// app.js - FIXED iOS Safari Compatible Version
// Properly formatted with no arrow functions or template literals

(function () {
  // ————————————————————
  // STATE
  // ————————————————————

  var state = {
    windowLines: [],
    pressureLines: []
  };

  // Default value counters
  var defaultCounters = {
    customer: 0,
    quote: 0
  };

  // Load counters from storage
  function loadDefaultCounters() {
    try {
      var saved = localStorage.getItem('tictacstick_default_counters');
      if (saved) {
        var parsed = JSON.parse(saved);
        defaultCounters.customer = parsed.customer || 0;
        defaultCounters.quote = parsed.quote || 0;
      }
    } catch (e) {
      console.error('Error loading default counters:', e);
    }
  }

  // Save counters to storage
  function saveDefaultCounters() {
    try {
      localStorage.setItem('tictacstick_default_counters', JSON.stringify(defaultCounters));
    } catch (e) {
      console.error('Error saving default counters:', e);
    }
  }

  // Generate default customer name
  function getDefaultClientName() {
    defaultCounters.customer++;
    saveDefaultCounters();
    return 'customer_' + defaultCounters.customer;
  }

  // Generate default quote title
  function getDefaultQuoteTitle() {
    defaultCounters.quote++;
    saveDefaultCounters();
    return 'Quote_' + defaultCounters.quote;
  }

  // ————————————————————
  // DOM HELPERS
  // ————————————————————

  function $(id) {
    return document.getElementById(id);
  }

  function q(selector) {
    return document.querySelector(selector);
  }

  function qa(selector) {
    return document.querySelectorAll(selector);
  }

  function createEl(tag, className) {
    var el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    return el;
  }

  var statusTimers = {};

  function showStatus(target, state, message) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el || !el.parentNode) return;

    var statusEl = el.parentNode.querySelector('.inline-status');
    if (!statusEl) {
      statusEl = createEl('span', 'inline-status');
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', 'polite');
      el.parentNode.appendChild(statusEl);
    }

    if (!el._statusKey) {
      el._statusKey = el.id || el.getAttribute('data-status-key') || 'status-' + Date.now();
    }
    var statusKey = el._statusKey;
    if (statusTimers[statusKey]) {
      clearTimeout(statusTimers[statusKey]);
    }

    if (state === 'clear') {
      statusEl.className = 'inline-status';
      statusEl.innerHTML = '';
      return;
    }

    statusEl.className = 'inline-status';
    statusEl.innerHTML = '';

    if (state === 'loading') {
      statusEl.classList.add('inline-status--loading');
      var spinner = createEl('span', 'inline-status__spinner');
      spinner.setAttribute('aria-hidden', 'true');
      statusEl.appendChild(spinner);

      var label = createEl('span', 'inline-status__label');
      label.textContent = message || 'Working...';
      statusEl.appendChild(label);
    } else if (state === 'success') {
      statusEl.classList.add('inline-status--success');
      var check = createEl('span', 'inline-status__check');
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      statusEl.appendChild(check);

      var labelSuccess = createEl('span', 'inline-status__label');
      labelSuccess.textContent = message || 'Done';
      statusEl.appendChild(labelSuccess);

      statusTimers[statusKey] = setTimeout(function () {
        showStatus(el, 'clear');
      }, 2200);
    }
  }

  // ————————————————————
  // GLOBAL APP OBJECT
  // ————————————————————
  // Note: APP registration happens at the end of this file after all functions are defined

  // ————————————————————
  // AUTOSAVE / LOAD
  // ————————————————————

  // Disable autosave in test mode to prevent interference with tests
  var autosaveEnabled = !window.APP_TEST_MODE;
  var autosaveTimer = null;
  var AUTOSAVE_DELAY_MS = 600;

  // Load autosaved state if available
  function loadInitialState() {
    var saved = AppStorage.loadState();
    if (saved && typeof saved === "object") {
      try {
        state = {
          windowLines: saved.windowLines || [],
          pressureLines: saved.pressureLines || [],
          baseFee: saved.baseFee,
          hourlyRate: saved.hourlyRate,
          minimumJob: saved.minimumJob,
          highReachModifierPercent: saved.highReachModifierPercent,
          insideMultiplier: saved.insideMultiplier,
          outsideMultiplier: saved.outsideMultiplier,
          pressureHourlyRate: saved.pressureHourlyRate,
          setupBufferMinutes: saved.setupBufferMinutes,
          quoteTitle: saved.quoteTitle || "",
          clientName: saved.clientName || "",
          clientLocation: saved.clientLocation || "",
          jobType: saved.jobType || "",
          internalNotes: saved.internalNotes || "",
          clientNotes: saved.clientNotes || ""
        };
        applyStateToUI();
      } catch (e) {
        console.error("Error applying saved state", e);
      }
    }
  }

  // Save state to localStorage
  function autosave() {
    if (!autosaveEnabled) return;

    var currentState = buildStateFromUI(true);

    // Validate before autosave (less strict - only checks critical fields)
    if (window.QuoteValidation && !window.QuoteValidation.validateForAutosave(currentState)) {
      console.warn('[APP] Skipping autosave - quote validation failed');
      return;
    }

    try {
      AppStorage.saveState(currentState);
    } catch (e) {
      console.error("Autosave error", e);
    }
  }

  // Schedule autosave
  function scheduleAutosave(force) {
    if (!autosaveEnabled && !force) return;
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }
    autosaveTimer = setTimeout(autosave, AUTOSAVE_DELAY_MS);
  }

  // ————————————————————
  // STATE <-> UI
  // ————————————————————

  function buildStateFromUI(includeLines, useDefaults) {
    // Ensure all numeric values are non-negative
    var baseFee = Math.max(0, parseFloat($("baseFeeInput").value) || 0);
    var hourlyRate = Math.max(0, parseFloat($("hourlyRateInput").value) || 0);
    var minimumJob = Math.max(0, parseFloat($("minimumJobInput").value) || 0);
    var highReachModifierPercent = Math.max(0, parseFloat(
      $("highReachModifierInput").value
    ) || 0);
    var insideMultiplier = Math.max(0.1, parseFloat(
      $("insideMultiplierInput").value
    ) || 1);
    var outsideMultiplier = Math.max(0.1, parseFloat(
      $("outsideMultiplierInput").value
    ) || 1);
    var pressureHourlyRate = Math.max(0, parseFloat(
      $("pressureHourlyRateInput").value
    ) || 0);
    var setupBufferMinutes = Math.max(0, parseFloat(
      $("setupBufferMinutesInput").value
    ) || 0);

    var quoteTitle = $("quoteTitleInput").value || "";
    var clientName = $("clientNameInput").value || "";
    var clientLocation = $("clientLocationInput").value || "";
    var jobType = $("jobTypeInput").value || "";
    var internalNotes = $("internalNotesInput").value || "";
    var clientNotes = $("clientNotesInput").value || "";

    // Apply defaults if requested and fields are empty
    if (useDefaults) {
      if (!quoteTitle || quoteTitle.trim() === "") {
        quoteTitle = getDefaultQuoteTitle();
      }
      if (!clientName || clientName.trim() === "") {
        clientName = getDefaultClientName();
      }
      if (!clientLocation || clientLocation.trim() === "") {
        clientLocation = "Location pending";
      }
      if (!jobType || jobType === "") {
        jobType = "residential";
      }
    }

    var s = {
      baseFee: baseFee,
      hourlyRate: hourlyRate,
      minimumJob: minimumJob,
      highReachModifierPercent: highReachModifierPercent,
      insideMultiplier: insideMultiplier,
      outsideMultiplier: outsideMultiplier,
      pressureHourlyRate: pressureHourlyRate,
      setupBufferMinutes: setupBufferMinutes,
      quoteTitle: quoteTitle,
      clientName: clientName,
      clientLocation: clientLocation,
      jobType: jobType,
      internalNotes: internalNotes,
      clientNotes: clientNotes
    };

    if (includeLines) {
      s.windowLines = state.windowLines.slice(0);
      s.pressureLines = state.pressureLines.slice(0);
    }

    return s;
  }

  function applyStateToUI() {
    if (typeof state.baseFee === "number")
      $("baseFeeInput").value = state.baseFee;
    if (typeof state.hourlyRate === "number")
      $("hourlyRateInput").value = state.hourlyRate;
    if (typeof state.minimumJob === "number")
      $("minimumJobInput").value = state.minimumJob;
    if (typeof state.highReachModifierPercent === "number")
      $("highReachModifierInput").value =
        state.highReachModifierPercent;
    if (typeof state.insideMultiplier === "number")
      $("insideMultiplierInput").value = state.insideMultiplier;
    if (typeof state.outsideMultiplier === "number")
      $("outsideMultiplierInput").value = state.outsideMultiplier;
    if (typeof state.pressureHourlyRate === "number")
      $("pressureHourlyRateInput").value =
        state.pressureHourlyRate;
    if (typeof state.setupBufferMinutes === "number")
      $("setupBufferMinutesInput").value =
        state.setupBufferMinutes;

    $("quoteTitleInput").value = state.quoteTitle || "";
    $("clientNameInput").value = state.clientName || "";
    $("clientLocationInput").value = state.clientLocation || "";
    $("jobTypeInput").value = state.jobType || "";
    $("internalNotesInput").value = state.internalNotes || "";
    $("clientNotesInput").value = state.clientNotes || "";

    renderLines();
    recalculate();
  }

  // ————————————————————
  // LINE HELPERS
  // ————————————————————

  var nextLineId = 1;

  function makeLineId() {
    return "L" + nextLineId++;
  }

  function addWindowLine(options) {
    options = options || {};
    var line = {
      id: makeLineId(),
      title: options.title || "Window Line",
      tags: options.tags || [],
      windowTypeId:
        options.windowTypeId ||
        (PRICING_DATA.windowTypes[2] &&
          PRICING_DATA.windowTypes[2].id) ||
        "",
      inside:
        typeof options.inside === "boolean"
          ? options.inside
          : true,
      outside:
        typeof options.outside === "boolean"
          ? options.outside
          : true,
      highReach: !!options.highReach,
      panes: typeof options.panes === "number" ? options.panes : 4,
      soilLevel: options.soilLevel || "medium",
      conditionId: options.conditionId || null,
      accessId: options.accessId || null,
      tintLevel: options.tintLevel || "none",
      location: options.location || ""
    };

    state.windowLines.push(line);
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  function addPressureLine(options) {
    options = options || {};
    var line = {
      id: makeLineId(),
      title: options.title || "Pressure Line",
      tags: options.tags || [],
      surfaceId:
        options.surfaceId ||
        (PRICING_DATA.pressureSurfaces[0] &&
          PRICING_DATA.pressureSurfaces[0].id) ||
        "",
      areaSqm:
        typeof options.areaSqm === "number" ? options.areaSqm : 30,
      soilLevel: options.soilLevel || "medium",
      access: options.access || "easy",
      notes: options.notes || ""
    };

    state.pressureLines.push(line);
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  function duplicateWindowLine(id) {
    var original = null;
    for (var i = 0; i < state.windowLines.length; i++) {
      if (state.windowLines[i].id === id) {
        original = state.windowLines[i];
        break;
      }
    }
    if (!original) return;

    var copy = JSON.parse(JSON.stringify(original));
    copy.id = makeLineId();
    copy.title = original.title + " (copy)";
    state.windowLines.push(copy);
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  function duplicatePressureLine(id) {
    var original = null;
    for (var i = 0; i < state.pressureLines.length; i++) {
      if (state.pressureLines[i].id === id) {
        original = state.pressureLines[i];
        break;
      }
    }
    if (!original) return;

    var copy = JSON.parse(JSON.stringify(original));
    copy.id = makeLineId();
    copy.title = original.title + " (copy)";
    state.pressureLines.push(copy);
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  function removeWindowLine(id) {
    state.windowLines = state.windowLines.filter(function (line) {
      return line.id !== id;
    });
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  function removePressureLine(id) {
    state.pressureLines = state.pressureLines.filter(function (line) {
      return line.id !== id;
    });
    renderLines();
    recalculate();
    scheduleAutosave(true);
  }

  // ————————————————————
  // RENDERING
  // ————————————————————


  var sortState = {
    window: { key: null, direction: 'asc' },
    pressure: { key: null, direction: 'asc' }
  };

  function renderLines() {
    applySort('window');
    applySort('pressure');
    renderWindowLines();
    renderPressureLines();
  }

  function applySort(type) {
    var config = sortState[type];
    if (!config || !config.key) return;

    var list = type === 'window' ? state.windowLines : state.pressureLines;
    list.sort(function (a, b) {
      var va = getSortValue(type, a, config.key);
      var vb = getSortValue(type, b, config.key);

      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return config.direction === 'asc' ? -1 : 1;
      if (va > vb) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function toggleSort(type, key) {
    var config = sortState[type];
    if (!config) return;

    if (config.key === key) {
      config.direction = config.direction === 'asc' ? 'desc' : 'asc';
    } else {
      config.key = key;
      config.direction = 'asc';
    }

    renderLines();
  }

  function updateSortIcons(type) {
    var config = sortState[type];
    var toggles = qa('.sort-toggle[data-type="' + type + '"]');
    var i;
    for (i = 0; i < toggles.length; i++) {
      toggles[i].classList.remove('sorted-asc');
      toggles[i].classList.remove('sorted-desc');
      if (config && config.key === toggles[i].getAttribute('data-key')) {
        toggles[i].classList.add(config.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    }
  }

  function getSortValue(type, line, key) {
    if (type === 'window') {
      if (key === 'title') return line.title || '';
      if (key === 'type') return getWindowTypeLabel(line.windowTypeId);
      if (key === 'panes') return typeof line.panes === 'number' ? line.panes : 0;
      if (key === 'condition') return getWindowConditionLabel(line);
      if (key === 'access') return getWindowAccessLabel(line);
      if (key === 'location') return line.location || '';
    }

    if (type === 'pressure') {
      if (key === 'title') return line.title || '';
      if (key === 'surface') return getPressureSurfaceLabel(line.surfaceId);
      if (key === 'area') return typeof line.areaSqm === 'number' ? line.areaSqm : 0;
      if (key === 'soil') return line.soilLevel || '';
      if (key === 'access') return getPressureAccessLabel(line.access);
    }

    return '';
  }

  function renderWindowLines() {
    var body = $("windowLinesTableBody");
    if (!body) return;
    body.innerHTML = "";

    if (!state.windowLines.length) {
      renderEmptyRow(body, 9, "No window lines added yet.");
      updateSortIcons('window');
      return;
    }

    for (var i = 0; i < state.windowLines.length; i++) {
      var line = state.windowLines[i];
      var row = renderWindowLineRow(line);
      body.appendChild(row);
    }

    updateSortIcons('window');
  }

  function renderPressureLines() {
    var body = $("pressureLinesTableBody");
    if (!body) return;
    body.innerHTML = "";

    if (!state.pressureLines.length) {
      renderEmptyRow(body, 7, "No pressure lines added yet.");
      updateSortIcons('pressure');
      return;
    }

    for (var i = 0; i < state.pressureLines.length; i++) {
      var line = state.pressureLines[i];
      var row = renderPressureLineRow(line);
      body.appendChild(row);
    }

    updateSortIcons('pressure');
  }

  function renderEmptyRow(body, columns, message) {
    var row = createEl('tr', 'lines-empty-row');
    var cell = createEl('td');
    cell.colSpan = columns;
    cell.textContent = message;
    row.appendChild(cell);
    body.appendChild(row);
  }

  function getWindowTypeLabel(typeId) {
    for (var i = 0; i < PRICING_DATA.windowTypes.length; i++) {
      if (PRICING_DATA.windowTypes[i].id === typeId) {
        return PRICING_DATA.windowTypes[i].label || '';
      }
    }
    return '';
  }

  function getWindowConditionLabel(line) {
    if (window.CONDITION_MODIFIERS_ARRAY && CONDITION_MODIFIERS_ARRAY.length > 0) {
      for (var i = 0; i < CONDITION_MODIFIERS_ARRAY.length; i++) {
        if (CONDITION_MODIFIERS_ARRAY[i].id === line.conditionId) {
          return CONDITION_MODIFIERS_ARRAY[i].name;
        }
      }
    }
    return line.soilLevel || '';
  }

  function getWindowAccessLabel(line) {
    if (window.ACCESS_MODIFIERS_ARRAY && ACCESS_MODIFIERS_ARRAY.length > 0) {
      for (var i = 0; i < ACCESS_MODIFIERS_ARRAY.length; i++) {
        if (ACCESS_MODIFIERS_ARRAY[i].id === line.accessId) {
          return ACCESS_MODIFIERS_ARRAY[i].name;
        }
      }
    }
    return line.accessId || '';
  }

  function getPressureSurfaceLabel(surfaceId) {
    for (var i = 0; i < PRICING_DATA.pressureSurfaces.length; i++) {
      if (PRICING_DATA.pressureSurfaces[i].id === surfaceId) {
        return PRICING_DATA.pressureSurfaces[i].label || '';
      }
    }
    return '';
  }

  function getPressureAccessLabel(accessId) {
    return accessId || '';
  }

  function renderWindowLineRow(line) {
    var row = createEl('tr');
    row.setAttribute('data-id', line.id);

    var titleCell = createEl('td');
    var titleRow = createEl('div', 'line-title-row');
    var titleEl = createEl('div', 'line-title');
    titleEl.textContent = line.title || 'Window Line';
    titleRow.appendChild(titleEl);

    var allTags = (line.tags || []).slice(0);
    if (line.location) allTags.push(line.location);
    if (line.highReach) allTags.push('high reach');
    if (line.inside && !line.outside) allTags.push('inside only');
    if (!line.inside && line.outside) allTags.push('outside only');

    if (allTags.length) {
      var meta = createEl('div', 'line-meta');
      meta.textContent = allTags.join(' • ');
      titleRow.appendChild(meta);
    }

    titleCell.appendChild(titleRow);
    row.appendChild(titleCell);

    var typeCell = createEl('td');
    var selectType = createEl('select');
    selectType.className = 'window-type-select';
    selectType.value = line.windowTypeId;

    var windowTypes = PRICING_DATA.windowTypes;
    var hasCategories = windowTypes.length > 0 && windowTypes[0].category;
    if (hasCategories) {
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

      for (var wti = 0; wti < windowTypes.length; wti++) {
        var wtItem = windowTypes[wti];
        var cat = wtItem.category || 'other';
        if (categories[cat]) {
          categories[cat].push(wtItem);
        } else {
          categories.other.push(wtItem);
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

      for (var catKey in categories) {
        if (categories[catKey].length > 0) {
          var optgroup = createEl("optgroup");
          optgroup.label = categoryLabels[catKey];
          for (var cti = 0; cti < categories[catKey].length; cti++) {
            var w = categories[catKey][cti];
            var opt = createEl("option");
            opt.value = w.id;
            var priceStr = w.basePrice ? ' - $' + w.basePrice.toFixed(0) : '';
            opt.textContent = w.label + priceStr;
            if (w.id === line.windowTypeId) opt.selected = true;
            optgroup.appendChild(opt);
          }
          selectType.appendChild(optgroup);
        }
      }
    } else {
      for (var j = 0; j < windowTypes.length; j++) {
        var wt = windowTypes[j];
        var opt = createEl("option");
        opt.value = wt.id;
        opt.textContent = wt.label;
        if (wt.id === line.windowTypeId) opt.selected = true;
        selectType.appendChild(opt);
      }
    }

    selectType.addEventListener("change", function (e) {
      line.windowTypeId = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    typeCell.appendChild(selectType);
    row.appendChild(typeCell);

    var panesCell = createEl('td');
    var panesInput = createEl("input");
    panesInput.type = "number";
    panesInput.className = "window-quantity-input";
    panesInput.min = "1";
    panesInput.step = "1";
    panesInput.value = line.panes;
    panesInput.addEventListener("input", function (e) {
      var val = parseInt(e.target.value, 10);
      line.panes = isNaN(val) ? 0 : val;
      scheduleAutosave(true);
      recalculate();
    });
    panesCell.appendChild(panesInput);
    row.appendChild(panesCell);

    var flagsCell = createEl('td');
    var flagsWrapper = createEl('div', 'flag-group');

    var insideLabel = createEl('label');
    var insideToggle = createEl("input");
    insideToggle.type = "checkbox";
    insideToggle.checked = line.inside;
    insideToggle.addEventListener("change", function (e) {
      line.inside = e.target.checked;
      scheduleAutosave(true);
      recalculate();
    });
    insideLabel.appendChild(insideToggle);
    insideLabel.appendChild(document.createTextNode('Inside'));

    var outsideLabel = createEl('label');
    var outsideToggle = createEl("input");
    outsideToggle.type = "checkbox";
    outsideToggle.checked = line.outside;
    outsideToggle.addEventListener("change", function (e) {
      line.outside = e.target.checked;
      scheduleAutosave(true);
      recalculate();
    });
    outsideLabel.appendChild(outsideToggle);
    outsideLabel.appendChild(document.createTextNode('Outside'));

    var highReachLabel = createEl('label');
    var highReachToggle = createEl("input");
    highReachToggle.type = "checkbox";
    highReachToggle.checked = line.highReach;
    highReachToggle.addEventListener("change", function (e) {
      line.highReach = e.target.checked;
      scheduleAutosave(true);
      recalculate();
    });
    highReachLabel.appendChild(highReachToggle);
    highReachLabel.appendChild(document.createTextNode('High'));

    flagsWrapper.appendChild(insideLabel);
    flagsWrapper.appendChild(outsideLabel);
    flagsWrapper.appendChild(highReachLabel);
    flagsCell.appendChild(flagsWrapper);
    row.appendChild(flagsCell);

    var conditionCell = createEl('td');
    var conditionSelect = createEl("select");

    if (window.CONDITION_MODIFIERS_ARRAY && CONDITION_MODIFIERS_ARRAY.length > 0) {
      for (var c = 0; c < CONDITION_MODIFIERS_ARRAY.length; c++) {
        var cond = CONDITION_MODIFIERS_ARRAY[c];
        var condOpt = createEl("option");
        condOpt.value = cond.id;
        condOpt.textContent = cond.name + " (" + cond.multiplier.toFixed(2) + "x)";
        if (line.conditionId === cond.id || (!line.conditionId && cond.id === 'normal')) {
          condOpt.selected = true;
        }
        conditionSelect.appendChild(condOpt);
      }
    } else {
      var soilOptions = [
        { v: "light", t: "Light" },
        { v: "medium", t: "Medium" },
        { v: "heavy", t: "Heavy" }
      ];
      for (var so = 0; so < soilOptions.length; so++) {
        var soEl = createEl("option");
        soEl.value = soilOptions[so].v;
        soEl.textContent = soilOptions[so].t;
        if (line.soilLevel === soilOptions[so].v) soEl.selected = true;
        conditionSelect.appendChild(soEl);
      }
    }

    conditionSelect.addEventListener("change", function (e) {
      line.conditionId = e.target.value;
      if (e.target.value === "light_dust") line.soilLevel = "light";
      else if (e.target.value === "normal_dirt") line.soilLevel = "medium";
      else if (e.target.value === "heavy_dirt" || e.target.value === "severe_neglect") line.soilLevel = "heavy";
      else line.soilLevel = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    conditionCell.appendChild(conditionSelect);
    row.appendChild(conditionCell);

    var accessCell = createEl('td');
    var accessSelect = createEl("select");

    if (window.ACCESS_MODIFIERS_ARRAY && ACCESS_MODIFIERS_ARRAY.length > 0) {
      for (var a = 0; a < ACCESS_MODIFIERS_ARRAY.length; a++) {
        var acc = ACCESS_MODIFIERS_ARRAY[a];
        var accOpt = createEl("option");
        accOpt.value = acc.id;
        accOpt.textContent = acc.name + " (" + (acc.multiplier * 100).toFixed(0) + "%)";
        if (line.accessId === acc.id || (!line.accessId && acc.id === "ground_level")) {
          accOpt.selected = true;
        }
        accessSelect.appendChild(accOpt);
      }
    } else {
      var accessOptions = [
        { v: "easy", t: "Easy Access" },
        { v: "ladder", t: "Ladder Required" },
        { v: "highReach", t: "High Reach" }
      ];
      for (var ax = 0; ax < accessOptions.length; ax++) {
        var axo = accessOptions[ax];
        var axEl = createEl("option");
        axEl.value = axo.v;
        axEl.textContent = axo.t;
        if (line.accessId === axo.v) axEl.selected = true;
        accessSelect.appendChild(axEl);
      }
    }

    accessSelect.addEventListener("change", function (e) {
      line.accessId = e.target.value;
      if (e.target.value && e.target.value.indexOf("high") !== -1) {
        line.highReach = true;
      }
      scheduleAutosave(true);
      recalculate();
    });
    accessCell.appendChild(accessSelect);
    row.appendChild(accessCell);

    var tintCell = createEl('td');
    var tintSelect = createEl("select");
    var tintOptions = [
      { v: "none", t: "None" },
      { v: "light", t: "Light" },
      { v: "heavy", t: "Heavy" }
    ];

    for (var t = 0; t < tintOptions.length; t++) {
      var to = tintOptions[t];
      var tEl = createEl("option");
      tEl.value = to.v;
      tEl.textContent = to.t;
      if (line.tintLevel === to.v) tEl.selected = true;
      tintSelect.appendChild(tEl);
    }

    tintSelect.addEventListener("change", function (e) {
      line.tintLevel = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    tintCell.appendChild(tintSelect);
    row.appendChild(tintCell);

    var locationCell = createEl('td');
    var locInput = createEl("input");
    locInput.type = "text";
    locInput.value = line.location || "";
    locInput.addEventListener("input", function (e) {
      line.location = e.target.value;
      scheduleAutosave(true);
    });
    locationCell.appendChild(locInput);
    row.appendChild(locationCell);

    var actionsCell = createEl('td');
    var actions = createEl('div', 'line-actions');
    var dupBtn = createEl("button", "btn btn-small btn-ghost");
    dupBtn.type = "button";
    dupBtn.textContent = "Duplicate";
    dupBtn.addEventListener("click", function () {
      duplicateWindowLine(line.id);
    });

    var delBtn = createEl("button", "btn btn-small btn-ghost");
    delBtn.type = "button";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", function () {
      removeWindowLine(line.id);
    });

    actions.appendChild(dupBtn);
    actions.appendChild(delBtn);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;
  }

  function renderPressureLineRow(line) {
    var row = createEl('tr');
    row.setAttribute('data-id', line.id);

    var titleCell = createEl('td');
    var titleRow = createEl('div', 'line-title-row');
    var titleEl = createEl('div', 'line-title');
    titleEl.textContent = line.title || 'Pressure Line';
    titleRow.appendChild(titleEl);

    var meta = createEl('div', 'line-meta');
    meta.textContent = line.notes || '';
    if (meta.textContent) {
      titleRow.appendChild(meta);
    }

    titleCell.appendChild(titleRow);
    row.appendChild(titleCell);

    var surfaceCell = createEl('td');
    var surfSelect = createEl("select");
    for (var j = 0; j < PRICING_DATA.pressureSurfaces.length; j++) {
      var ps = PRICING_DATA.pressureSurfaces[j];
      var opt = createEl("option");
      opt.value = ps.id;
      opt.textContent = ps.label;
      if (ps.id === line.surfaceId) opt.selected = true;
      surfSelect.appendChild(opt);
    }
    surfSelect.addEventListener("change", function (e) {
      line.surfaceId = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    surfaceCell.appendChild(surfSelect);
    row.appendChild(surfaceCell);

    var areaCell = createEl('td');
    var areaInput = createEl("input");
    areaInput.type = "number";
    areaInput.min = "0";
    areaInput.step = "1";
    areaInput.value = line.areaSqm;
    areaInput.addEventListener("input", function (e) {
      var val = parseFloat(e.target.value);
      line.areaSqm = isNaN(val) ? 0 : val;
      scheduleAutosave(true);
      recalculate();
    });
    areaCell.appendChild(areaInput);
    row.appendChild(areaCell);

    var soilCell = createEl('td');
    var soilSelect = createEl("select");
    var soilOptions = [
      { v: "light", t: "Light" },
      { v: "medium", t: "Medium" },
      { v: "heavy", t: "Heavy" }
    ];
    for (var s = 0; s < soilOptions.length; s++) {
      var so = soilOptions[s];
      var soEl = createEl("option");
      soEl.value = so.v;
      soEl.textContent = so.t;
      if (line.soilLevel === so.v) soEl.selected = true;
      soilSelect.appendChild(soEl);
    }
    soilSelect.addEventListener("change", function (e) {
      line.soilLevel = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    soilCell.appendChild(soilSelect);
    row.appendChild(soilCell);

    var accessCell = createEl('td');
    var accessSelect = createEl("select");
    var accessOptions = [
      { v: "easy", t: "Easy" },
      { v: "ladder", t: "Ladder" },
      { v: "highReach", t: "High Reach" }
    ];
    for (var a = 0; a < accessOptions.length; a++) {
      var ao = accessOptions[a];
      var axEl = createEl("option");
      axEl.value = ao.v;
      axEl.textContent = ao.t;
      if (line.access === ao.v) axEl.selected = true;
      accessSelect.appendChild(axEl);
    }
    accessSelect.addEventListener("change", function (e) {
      line.access = e.target.value;
      scheduleAutosave(true);
      recalculate();
    });
    accessCell.appendChild(accessSelect);
    row.appendChild(accessCell);

    var notesCell = createEl('td');
    var notesInput = createEl("input");
    notesInput.type = "text";
    notesInput.value = line.notes || "";
    notesInput.addEventListener("input", function (e) {
      line.notes = e.target.value;
      scheduleAutosave(true);
    });
    notesCell.appendChild(notesInput);
    row.appendChild(notesCell);

    var actionsCell = createEl('td');
    var actions = createEl('div', 'line-actions');

    var dupBtn = createEl("button", "btn btn-small btn-ghost");
    dupBtn.type = "button";
    dupBtn.textContent = "Duplicate";
    dupBtn.addEventListener("click", function () {
      duplicatePressureLine(line.id);
    });

    var delBtn = createEl("button", "btn btn-small btn-ghost");
    delBtn.type = "button";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", function () {
      removePressureLine(line.id);
    });

    actions.appendChild(dupBtn);
    actions.appendChild(delBtn);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;
  }

  function initSortToggles() {
    var toggles = qa('.sort-toggle');
    var i;
    for (i = 0; i < toggles.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var type = btn.getAttribute('data-type');
          var key = btn.getAttribute('data-key');
          toggleSort(type, key);
        });
      })(toggles[i]);
    }
  }

  // ————————————————————
  // CALCULATION & SUMMARY
  // ————————————————————

  var timeChart = null;

  function recalculate() {
    var s = buildStateFromUI(true);
    var result = null;

    // Use PrecisionCalc if available
    if (
      window.PrecisionCalc &&
      typeof PrecisionCalc.calculate === "function"
    ) {
      try {
        result = PrecisionCalc.calculate({
          windowLines: state.windowLines,
          pressureLines: state.pressureLines,
          baseFee: s.baseFee,
          hourlyRate: s.hourlyRate,
          minimumJob: s.minimumJob,
          highReachModifierPercent: s.highReachModifierPercent,
          insideMultiplier: s.insideMultiplier,
          outsideMultiplier: s.outsideMultiplier,
          pressureHourlyRate: s.pressureHourlyRate,
          setupBufferMinutes: s.setupBufferMinutes
        });
      } catch (e) {
        console.error("PrecisionCalc error", e);
      }
    } else if (window.Calc && typeof Calc.calculate === "function") {
      result = Calc.calculate(state);
    }

    if (!result) {
      return;
    }

    var money = result.money;
    var time = result.time;

    // Update summary
    $("baseFeeDisplay").textContent = formatMoney(money.baseFee);
    $("windowsCostDisplay").textContent = formatMoney(money.windows);
    $("pressureCostDisplay").textContent = formatMoney(money.pressure);
    $("highReachCostDisplay").textContent = formatMoney(
      money.highReach
    );
    $("otherAdjustmentsDisplay").textContent = formatMoney(
      money.setup || 0
    );
    $("subtotalDisplay").textContent = formatMoney(money.subtotal);
    $("highReachDisplay").textContent = formatMoney(money.highReach);
    // totalDisplay element doesn't exist in HTML, skip it
    // $("totalDisplay").textContent = formatMoney(money.total);
    // GST & total incl GST (10%)
    // GST should be calculated on subtotal, not total (which includes minimum job adjustment)
    var gst = money.subtotal * 0.10;
    var totalIncGst = money.total + gst;

    $("gstDisplay").textContent = formatMoney(gst);
    $("totalIncGstDisplay").textContent = formatMoney(totalIncGst);

    var workspaceStatus = $("workspaceStatusLive");
    if (workspaceStatus) {
      var totalLines = (state.windowLines || []).length +
        (state.pressureLines || []).length;
      workspaceStatus.textContent =
        totalLines + " line" + (totalLines === 1 ? "" : "s") +
        " · " + formatMoney(totalIncGst) + " incl. GST";
    }

    // Time
    $("windowsTimeDisplay").textContent =
      time.windowsHours.toFixed(2) + " hrs";
    $("pressureTimeDisplay").textContent =
      time.pressureHours.toFixed(2) + " hrs";
    $("highReachTimeDisplay").textContent =
      time.highReachHours.toFixed(2) + " hrs";
    $("setupTimeDisplay").textContent =
      time.setupHours.toFixed(2) + " hrs";
    $("timeEstimateDisplay").textContent =
      time.totalHours.toFixed(2) + " hrs total";

    // Update chart
    updateTimeChart(time);
  }

  function formatMoney(amount) {
    var n = typeof amount === "number" ? amount : 0;
    return "$" + n.toFixed(2);
  }

  function updateTimeChart(time) {
    var ctx = $("timeChart");
    if (!ctx || typeof Chart === "undefined") return;

    var data = [
      time.windowsHours,
      time.pressureHours,
      time.highReachHours,
      time.setupHours
    ];

    var labels = ["Windows", "Pressure", "High Reach", "Setup"];

    if (!timeChart) {
      timeChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: data
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "bottom"
            }
          }
        }
      });
    } else {
      timeChart.data.datasets[0].data = data;
      timeChart.update();
    }
  }

  // ————————————————————
  // SAVED QUOTES / PRESETS
  // ————————————————————

  function initSavedQuotes() {
    var select = $("savedQuotesSelect");
    if (!select) return;

    var savedQuotes = AppStorage.loadSavedQuotes() || [];
    renderSavedQuotesOptions(savedQuotes);

    $("saveQuoteBtn").addEventListener("click", function () {
      // Use defaults for missing fields when saving
      var currentState = buildStateFromUI(true, true);

      // Validate before save (strict validation)
      if (window.QuoteValidation) {
        var validation = window.QuoteValidation.validateForSave(currentState);
        if (!validation.valid) {
          window.QuoteValidation.showValidationErrors(validation.errors, 'Cannot save quote');
          return;
        }
      }

      var quoteName = prompt("Enter a name for this quote:");
      if (!quoteName || quoteName.trim() === "") {
        return;
      }

      showStatus('saveQuoteBtn', 'loading', 'Saving...');

      var newQuote = {
        id: "q" + Date.now(),
        title: quoteName.trim(),
        state: currentState,
        savedAt: new Date().toISOString()
      };

      savedQuotes.push(newQuote);
      AppStorage.saveSavedQuotes(savedQuotes);
      renderSavedQuotesOptions(savedQuotes);

      showStatus('saveQuoteBtn', 'success', 'Saved');

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Quote "' + quoteName + '" saved successfully!', 'success');
      } else if (window.showToast) {
        window.showToast('Quote "' + quoteName + '" saved successfully!', 'success');
      }
    });

    $("loadSavedQuoteBtn").addEventListener("click", function () {
      var id = select.value;
      if (!id) return;

      var found = null;
      var i;
      for (i = 0; i < savedQuotes.length; i++) {
        if (savedQuotes[i].id === id) {
          found = savedQuotes[i];
          break;
        }
      }

      if (!found) return;

      state = found.state || state;
      applyStateToUI();

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Quote "' + found.title + '" loaded successfully!', 'success');
      } else if (window.showToast) {
        window.showToast('Quote "' + found.title + '" loaded successfully!', 'success');
      }
    });

    $("deleteSavedQuoteBtn").addEventListener("click", function () {
      var id = select.value;
      if (!id) return;

      var found = null;
      var i;
      for (i = 0; i < savedQuotes.length; i++) {
        if (savedQuotes[i].id === id) {
          found = savedQuotes[i];
          break;
        }
      }

      if (!found) return;

      if (!confirm('Are you sure you want to delete "' + found.title + '"?')) {
        return;
      }

      savedQuotes = savedQuotes.filter(function (q) {
        return q.id !== id;
      });
      AppStorage.saveSavedQuotes(savedQuotes);
      renderSavedQuotesOptions(savedQuotes);

      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Quote "' + found.title + '" deleted!', 'info');
      } else if (window.showToast) {
        window.showToast('Quote "' + found.title + '" deleted!', 'info');
      }
    });

    $("savePresetBtn").addEventListener("click", function () {
      var presetName = prompt("Preset name?");
      if (!presetName) return;

      var presets = AppStorage.loadPresets() || [];
      presets.push({
        id: "p" + Date.now(),
        name: presetName,
        config: buildStateFromUI(false)
      });
      AppStorage.savePresets(presets);
      alert("Preset saved. (Reload not wired into selector yet.)");
    });
  }

  function renderSavedQuotesOptions(list) {
    var select = $("savedQuotesSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Select Saved Quote...</option>';
    var i;
    for (i = 0; i < list.length; i++) {
      var q = list[i];
      var opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = q.title || "Quote " + (i + 1);
      select.appendChild(opt);
    }
  }

  // ————————————————————
  // EXPORT / COPY (includes PDF export)
  // ————————————————————

  function initExportAndCopy() {
    var copyBtn = $("copySummaryBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", copySummaryToClipboard);
    }

    var pdfBtn = $("generatePdfBtn");
    if (pdfBtn) {
      pdfBtn.addEventListener("click", openQuotePrintWindow);
    }
  }

  // Separate formatting helpers for export document
  function fmtMoneyExport(amount) {
    if (typeof amount !== "number" || !isFinite(amount)) return "$0.00";
    var fixed = amount.toFixed(2);
    return "$" + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtHoursExport(hours) {
    if (typeof hours !== "number" || !isFinite(hours)) return "0.00 hrs";
    return hours.toFixed(2) + " hrs";
  }

  function buildQuoteHtml() {
    // Build state + run calculation again (same as recalculate)
    var s = buildStateFromUI(true);
    var result = null;

    if (
      window.PrecisionCalc &&
      typeof PrecisionCalc.calculate === "function"
    ) {
      result = PrecisionCalc.calculate({
        windowLines: state.windowLines,
        pressureLines: state.pressureLines,
        baseFee: s.baseFee,
        hourlyRate: s.hourlyRate,
        minimumJob: s.minimumJob,
        highReachModifierPercent: s.highReachModifierPercent,
        insideMultiplier: s.insideMultiplier,
        outsideMultiplier: s.outsideMultiplier,
        pressureHourlyRate: s.pressureHourlyRate,
        setupBufferMinutes: s.setupBufferMinutes
      });
    } else if (window.Calc && typeof Calc.calculate === "function") {
      result = Calc.calculate(state);
    }

    if (!result) {
      return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Quote</title></head><body><p>Unable to calculate quote.</p></body></html>";
    }

    var money = result.money;
    var time = result.time;

    var quoteTitle =
      s.quoteTitle || "Window & Pressure Cleaning Quote";
    var clientName = s.clientName || "";
    var clientLocation = s.clientLocation || "";
    var jobType = s.jobType || "";
    var clientNotes = s.clientNotes || "";

    var today = new Date();
    var dateStr = today.toLocaleDateString();

    // Build windows table
    function buildWindowsTable() {
      if (!state.windowLines.length) {
        return "<p>No window items in this quote.</p>";
      }

      var rows = "";
      var i;
      for (i = 0; i < state.windowLines.length; i++) {
        var line = state.windowLines[i];
        var lineTotalText = "";
        if (typeof line.total === "number") {
          lineTotalText = fmtMoneyExport(line.total);
        }

        rows +=
          "<tr>" +
          "<td>" +
          window.Security.escapeHTML(line.title || "Window Line") +
          "</td>" +
          "<td>" +
          window.Security.escapeHTML(line.location || "") +
          "</td>" +
          "<td>" +
          (line.panes != null ? line.panes : "") +
          "</td>" +
          "<td>" +
          (line.inside ? "✔" : "") +
          "</td>" +
          "<td>" +
          (line.outside ? "✔" : "") +
          "</td>" +
          "<td>" +
          (line.highReach ? "✔" : "") +
          "</td>" +
          "<td class='quote-doc-align-right'>" +
          lineTotalText +
          "</td>" +
          "</tr>";
      }

      var table =
        "<table class='quote-doc-table'>" +
        "<thead><tr>" +
        "<th>Description</th>" +
        "<th>Location / Notes</th>" +
        "<th>Panes</th>" +
        "<th>In</th>" +
        "<th>Out</th>" +
        "<th>High</th>" +
        "<th class='quote-doc-align-right'>Line Total</th>" +
        "</tr></thead>" +
        "<tbody>" +
        rows +
        "</tbody>" +
        "</table>";
      return table;
    }

    // Build pressure table
    function buildPressureTable() {
      if (!state.pressureLines.length) {
        return "<p>No pressure cleaning items in this quote.</p>";
      }

      var rows = "";
      var i;
      for (i = 0; i < state.pressureLines.length; i++) {
        var line = state.pressureLines[i];
        var lineTotalText = "";
        if (typeof line.total === "number") {
          lineTotalText = fmtMoneyExport(line.total);
        }

        rows +=
          "<tr>" +
          "<td>" +
          window.Security.escapeHTML(line.title || "Surface") +
          "</td>" +
          "<td>" +
          (line.areaSqm != null ? line.areaSqm + " m²" : "") +
          "</td>" +
          "<td>" +
          window.Security.escapeHTML(line.soilLevel || "") +
          "</td>" +
          "<td>" +
          window.Security.escapeHTML(line.access || "") +
          "</td>" +
          "<td>" +
          window.Security.escapeHTML(line.notes || "") +
          "</td>" +
          "<td class='quote-doc-align-right'>" +
          lineTotalText +
          "</td>" +
          "</tr>";
      }

      var table =
        "<table class='quote-doc-table'>" +
        "<thead><tr>" +
        "<th>Description</th>" +
        "<th>Area</th>" +
        "<th>Soil</th>" +
        "<th>Access</th>" +
        "<th>Notes</th>" +
        "<th class='quote-doc-align-right'>Line Total</th>" +
        "</tr></thead>" +
        "<tbody>" +
        rows +
        "</tbody>" +
        "</table>";
      return table;
    }

        var windowsTableHtml = buildWindowsTable();
    var pressureTableHtml = buildPressureTable();

    // Totals + GST
    var gst = (money.total || 0) * 0.10;
    var totalIncGst = (money.total || 0) + gst;

    var totalsHtml =
      "<div class='quote-doc-totals'>" +
        "<div class='quote-doc-totals-row'><div>Base callout:</div><div>" +
          fmtMoneyExport(money.baseFee || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>Windows labour:</div><div>" +
          fmtMoneyExport(money.windows || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>Pressure labour:</div><div>" +
          fmtMoneyExport(money.pressure || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>High reach premium:</div><div>" +
          fmtMoneyExport(money.highReach || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>Other adjustments:</div><div>" +
          fmtMoneyExport(money.setup || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>Subtotal (excl. GST):</div><div>" +
          fmtMoneyExport(money.subtotal || 0) +
        "</div></div>" +
        "<div class='quote-doc-totals-row'><div>GST (10%):</div><div>" +
          fmtMoneyExport(gst) +
        "</div></div>" +
        "<div class='quote-doc-totals-row quote-doc-strong-row'><div>Total (incl. GST):</div><div>" +
          fmtMoneyExport(totalIncGst) +
        "</div></div>" +
      "</div>";

    var timeHtml =
      "<p>" +
      "Estimated time: <strong>" +
      fmtHoursExport(time.totalHours || 0) +
      "</strong><br/>" +
      "Windows: " +
      fmtHoursExport(time.windowsHours || 0) +
      " · Pressure: " +
      fmtHoursExport(time.pressureHours || 0) +
      "<br/>" +
      "Travel / setup: " +
      fmtHoursExport(time.setupHours || 0) +
      " · High reach overhead: " +
      fmtHoursExport(time.highReachHours || 0) +
      "</p>";

    var notesHtml = "";
    if (clientNotes) {
      notesHtml =
        "<div class='quote-doc-notes'>" +
        "<strong>Notes:</strong><br/>" +
        window.Security.sanitizeWithLineBreaks(clientNotes) +
        "</div>";
    }

    // Assemble full document
    var html =
      "<!DOCTYPE html>" +
      "<html><head>" +
      "<meta charset='UTF-8' />" +
      "<title>" +
      quoteTitle +
      "</title>" +
      "<link rel='stylesheet' href='app.css' />" +
      "</head><body class='quote-doc-body'>" +
      "<div class='quote-doc-header'>" +
      "<div>" +
      "<div class='quote-doc-title'>" +
      quoteTitle +
      "</div>" +
      "<div class='quote-doc-sub'>Jim’s Window & Pressure Cleaning · 925 Pressure Glass</div>" +
      "</div>" +
      "<div class='quote-doc-meta'>" +
      (clientName
        ? "<div><strong>Client:</strong> " + window.Security.escapeHTML(clientName) + "</div>"
        : "") +
      (clientLocation
        ? "<div><strong>Location:</strong> " +
          window.Security.escapeHTML(clientLocation) +
          "</div>"
        : "") +
      (jobType
        ? "<div><strong>Job type:</strong> " + window.Security.escapeHTML(jobType) + "</div>"
        : "") +
      "<div><strong>Date:</strong> " +
      dateStr +
      "</div>" +
      "</div>" +
      "</div>" +
      "<div class='quote-doc-section-title'>Windows</div>" +
      windowsTableHtml +
      "<div class='quote-doc-section-title'>Pressure cleaning</div>" +
      pressureTableHtml +
      "<div class='quote-doc-section-title'>Totals &amp; time</div>" +
      totalsHtml +
      timeHtml +
      notesHtml +
      "<div class='quote-doc-disclaimer'>" +
      "This quote is based on the information provided and assumes reasonable access. " +
      "Any significant changes in scope or condition may require an updated quote." +
      "</div>" +
      "</body></html>";

    return html;
  }

  function openQuotePrintWindow() {
    showStatus('generatePdfBtn', 'loading', 'Preparing PDF...');

    var html = buildQuoteHtml();
    var win = window.open("", "_blank");
    if (!win) {
      alert(
        "Pop-up blocked. Please allow pop-ups for this site to print or save the quote as PDF."
      );
      showStatus('generatePdfBtn', 'clear');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function () {
      win.print();
      showStatus('generatePdfBtn', 'success', 'PDF ready');
    }, 300);
  }

  function copySummaryToClipboard() {
    var s = buildStateFromUI(true);
    var result = null;

    if (
      window.PrecisionCalc &&
      typeof PrecisionCalc.calculate === "function"
    ) {
      result = PrecisionCalc.calculate({
        windowLines: state.windowLines,
        pressureLines: state.pressureLines,
        baseFee: s.baseFee,
        hourlyRate: s.hourlyRate,
        minimumJob: s.minimumJob,
        highReachModifierPercent: s.highReachModifierPercent,
        insideMultiplier: s.insideMultiplier,
        outsideMultiplier: s.outsideMultiplier,
        pressureHourlyRate: s.pressureHourlyRate,
        setupBufferMinutes: s.setupBufferMinutes
      });
    } else if (window.Calc && typeof Calc.calculate === "function") {
      result = Calc.calculate(state);
    }

    if (!result) {
      alert("Unable to calculate summary.");
      return;
    }

    var money = result.money;
    var time = result.time;

    var lines = [];
    lines.push("Quote: " + (s.quoteTitle || "(no title)"));
    if (s.clientName) lines.push("Client: " + s.clientName);
    if (s.clientLocation)
      lines.push("Location: " + s.clientLocation);
    if (s.jobType) lines.push("Job Type: " + s.jobType);
    lines.push("");

    lines.push(
      "Total: " +
        formatMoney(money.total) +
        " (min job $" +
        money.minimumJob.toFixed(2) +
        ")"
    );
    lines.push("Subtotal: " + formatMoney(money.subtotal));
    lines.push(
      "Time: " +
        time.totalHours.toFixed(2) +
        " hrs (Windows " +
        time.windowsHours.toFixed(2) +
        ", Pressure " +
        time.pressureHours.toFixed(2) +
        ")"
    );
    lines.push("");

    if (s.clientNotes) {
      lines.push("Notes: " + s.clientNotes);
    }

    var text = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          alert("Summary copied to clipboard.");
        },
        function () {
          fallbackCopyText(text);
        }
      );
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      alert("Summary copied to clipboard.");
    } catch (e) {
      alert(
        "Unable to copy automatically. Please select and copy manually."
      );
    }
    document.body.removeChild(textarea);
  }

  // ————————————————————
  // CLEAR ALL
  // ————————————————————

  function initClearAll() {
    var btn = $("clearAllBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var ok = confirm("Clear all lines and reset state?");
      if (!ok) return;

      state.windowLines = [];
      state.pressureLines = [];
      state.quoteTitle = "";
      state.clientName = "";
      state.clientLocation = "";
      state.jobType = "";
      state.internalNotes = "";
      state.clientNotes = "";
      AppStorage.clearState();
      applyStateToUI();
    });
  }

  // ————————————————————
  // AUTOSAVE TOGGLE
  // ————————————————————

  function initAutosaveToggle() {
    var toggle = $("autosaveToggle");
    if (!toggle) return;

    autosaveEnabled = toggle.checked;

    toggle.addEventListener("change", function () {
      autosaveEnabled = toggle.checked;
      if (autosaveEnabled) {
        scheduleAutosave(true);
      }
    });
  }

  // ————————————————————
  // HEADER ACTION MENU TOGGLE
  // ————————————————————

  function initActionMenuToggle() {
    var toggle = $("actionMenuToggle");
    var actions = $("hdrActions");
    if (!toggle || !actions) return;

    var COLLAPSE_BREAKPOINT = 1080;

    function setCollapsed(collapsed) {
      if (collapsed) {
        actions.classList.add("is-collapsed");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Show actions menu");
        toggle.textContent = "☰ Actions";
      } else {
        actions.classList.remove("is-collapsed");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Hide actions menu");
        toggle.textContent = "✕ Close";
      }
    }

    function handleResize(forceCollapse) {
      if (window.innerWidth <= COLLAPSE_BREAKPOINT) {
        toggle.style.display = "inline-flex";
        if (forceCollapse && !actions.classList.contains("is-collapsed")) {
          setCollapsed(true);
        }
      } else {
        toggle.style.display = "none";
        setCollapsed(false);
      }
    }

    toggle.addEventListener("click", function () {
      var collapsed = actions.classList.contains("is-collapsed");
      setCollapsed(!collapsed);
    });

    window.addEventListener("resize", function () {
      handleResize(false);
    });

    handleResize(true);
  }

  // ————————————————————
  // INIT
  // ————————————————————

  function initApp() {
    // Load default counters for customer/quote naming
    loadDefaultCounters();

    loadInitialState();

    $("addWindowLineBtn").addEventListener("click", function () {
      addWindowLine({});
    });

    var emptyWindowBtn = $("emptyAddWindowLineBtn");
    if (emptyWindowBtn) {
      emptyWindowBtn.addEventListener("click", function () {
        addWindowLine({});
      });
    }

    $("addPressureLineBtn").addEventListener("click", function () {
      addPressureLine({});
    });

    var emptyPressureBtn = $("emptyAddPressureLineBtn");
    if (emptyPressureBtn) {
      emptyPressureBtn.addEventListener("click", function () {
        addPressureLine({});
      });
    }

    var wwBtn = $("openWindowWizardBtn");
    if (wwBtn) {
      wwBtn.addEventListener("click", function () {
        Wizard.openWindowWizard();
      });
    }

    var pwBtn = $("openPressureWizardBtn");
    if (pwBtn) {
      pwBtn.addEventListener("click", function () {
        Wizard.openPressureWizard();
      });
    }

    initActionMenuToggle();
    initSavedQuotes();
    initExportAndCopy();
    initClearAll();
    initAutosaveToggle();

    // Attach typing listeners to top-level fields for autosave
    var topInputs = [
      "quoteTitleInput",
      "clientNameInput",
      "clientLocationInput",
      "jobTypeInput",
      "internalNotesInput",
      "clientNotesInput"
    ];

    var i;
    for (i = 0; i < topInputs.length; i++) {
      var el = $(topInputs[i]);
      if (!el) continue;
      el.addEventListener("input", function () {
        scheduleAutosave(true);
      });
    }

    // First recalc
    recalculate();

    window.DEBUG.log('[APP] Application initialized successfully');
  }

  // ————————————————————
  // DEFERRED PLACEHOLDER UTILITIES
  // ————————————————————

  /**
   * Show a loading placeholder for deferred content
   * @param {string} elementId - The ID of the element to show placeholder in
   * @param {string} message - The loading message to display
   */
  function showDeferredPlaceholder(elementId, message) {
    var el = $(elementId);
    if (!el) return;
    
    var msg = message || 'Loading...';
    var placeholder = document.createElement('div');
    placeholder.className = 'deferred-placeholder';
    placeholder.setAttribute('data-placeholder-for', elementId);
    placeholder.style.cssText = 'padding: 2rem; text-align: center; color: var(--color-neutral-600); font-size: 0.875rem;';
    placeholder.textContent = msg;
    
    // Store original content if needed
    if (el.children.length > 0) {
      el.setAttribute('data-has-content', 'true');
    }
    
    // Clear and add placeholder
    el.innerHTML = '';
    el.appendChild(placeholder);
  }

  /**
   * Hide/remove the loading placeholder for deferred content
   * @param {string} elementId - The ID of the element to hide placeholder from
   */
  function hideDeferredPlaceholder(elementId) {
    var el = $(elementId);
    if (!el) return;
    
    var placeholder = el.querySelector('[data-placeholder-for="' + elementId + '"]');
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  }

  // ————————————————————
  // REGISTER WITH BOOTSTRAP
  // ————————————————————

  // Wait for APP to exist (created by bootstrap.js)
  if (typeof window.APP === 'undefined') {
    console.error('[APP] APP object not found! Bootstrap must load first.');
    // Can't proceed without APP object
    return;
  }

  // Register core app methods with existing APP object
  window.APP.addWindowLine = addWindowLine;
  window.APP.addPressureLine = addPressureLine;
  window.APP.recalculate = recalculate;
  window.APP.duplicateWindowLine = duplicateWindowLine;
  window.APP.duplicatePressureLine = duplicatePressureLine;
  window.APP.getState = function() {
    return buildStateFromUI(true);
  };

  // Create app module for registration
  var AppModule = {
    state: state,
    loadState: loadInitialState,
    saveState: autosave,
    buildStateFromUI: buildStateFromUI,
    applyStateToUI: applyStateToUI,
    showDeferredPlaceholder: showDeferredPlaceholder,
    hideDeferredPlaceholder: hideDeferredPlaceholder
  };

  if (window.APP) {
    APP.showDeferredPlaceholder = showDeferredPlaceholder;
    APP.hideDeferredPlaceholder = hideDeferredPlaceholder;
  }

  // Register with bootstrap
  window.APP.registerModule('app', AppModule);

  window.DEBUG.log('[APP] Module registered with bootstrap');

  // ————————————————————
  // INITIALIZATION
  // ————————————————————

  // iOS Safari compatible DOM ready check
  function tryInit() {
    try {
      initApp();

      // Trigger bootstrap initialization after app is ready
      if (window.APP && typeof APP.init === 'function') {
        APP.init().then(function() {
          window.DEBUG.log('[APP] Bootstrap initialization complete');
        }).catch(function(error) {
          console.error('[APP] Bootstrap initialization error:', error);
        });
      }
    } catch (e) {
      console.error("Error during initApp", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit);
  } else {
    // DOM already loaded (common on iOS)
    setTimeout(tryInit, 100);
  }

  // iOS Safari error display (commented out for production)
  /*
  window.onerror = function(msg, url, line) {
    alert("Error: " + msg + " at line " + line);
    return false;
  };
  */
})();
