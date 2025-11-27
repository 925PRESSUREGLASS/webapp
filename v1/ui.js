// ui.js – small UI wiring (accordion, live recalc, mode toggle)

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  // Debounce utility for performance optimization
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function toggleCardBody(e) {
    var targetId = e.currentTarget.getAttribute("data-target");
    var body = document.getElementById(targetId);
    if (!body) return;

    var isOpen = body.classList.contains("card-body-open");
    if (isOpen) {
      body.classList.remove("card-body-open");
    } else {
      body.classList.add("card-body-open");
    }
  }

  function initAccordions() {
    var toggles = document.querySelectorAll(".card-toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", toggleCardBody);
    }

    // Open key sections by default
    // Keep primary sections open, but leave Job Settings collapsed by default
    var defaultOpen = ["windowsBody", "summaryBody"];
    for (var j = 0; j < defaultOpen.length; j++) {
      var el = $(defaultOpen[j]);
      if (el) el.classList.add("card-body-open");
    }
  }

  function initModeToggle() {
    var btn = $("toggleModeBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var body = document.body;
      if (body.classList.contains("accordion-mode")) {
        body.classList.remove("accordion-mode");
        btn.textContent = "Switch to Wizard Mode";
      } else {
        body.classList.add("accordion-mode");
        btn.textContent = "Switch to Flat Mode";
      }
    });
  }

  function initLiveRecalc() {
    if (!window.APP || typeof APP.recalculate !== "function") return;

    var inputs = [
      "baseFeeInput",
      "hourlyRateInput",
      "minimumJobInput",
      "highReachModifierInput",
      "insideMultiplierInput",
      "outsideMultiplierInput",
      "pressureHourlyRateInput",
      "setupBufferMinutesInput"
    ];

    // Immediate handler for change events
    function changeHandler() {
      APP.recalculate();
    }

    // Debounced handler for input events (300ms delay)
    var debouncedHandler = debounce(function() {
      APP.recalculate();
    }, 300);

    for (var i = 0; i < inputs.length; i++) {
      var el = $(inputs[i]);
      if (!el) continue;
      // Use debounced handler for input events (while typing)
      el.addEventListener("input", debouncedHandler);
      // Use immediate handler for change events (blur, enter key)
      el.addEventListener("change", changeHandler);
    }
  }

  function initInputValidation() {
    // Prevent negative values on numeric inputs
    var numericInputs = [
      "baseFeeInput",
      "hourlyRateInput",
      "minimumJobInput",
      "highReachModifierInput",
      "insideMultiplierInput",
      "outsideMultiplierInput",
      "pressureHourlyRateInput",
      "setupBufferMinutesInput"
    ];

    function validateNumericInput(e) {
      var input = e.target;
      var value = parseFloat(input.value);

      // Handle multipliers differently (minimum 0.1)
      if (input.id === "insideMultiplierInput" || input.id === "outsideMultiplierInput") {
        if (!isNaN(value) && value < 0.1) {
          input.value = 0.1;
        }
      } else {
        // For other inputs, prevent negative values
        if (!isNaN(value) && value < 0) {
          input.value = 0;
        }
      }
    }

    for (var i = 0; i < numericInputs.length; i++) {
      var el = $(numericInputs[i]);
      if (!el) continue;

      // Validate on blur (when user leaves field)
      el.addEventListener("blur", validateNumericInput);

      // Also validate on change
      el.addEventListener("change", validateNumericInput);
    }
  }

  function initUI() {
    initAccordions();
    initModeToggle();
    initLiveRecalc();
    initInputValidation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
