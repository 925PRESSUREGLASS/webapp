// ui.js – small UI wiring (accordion, live recalc, mode toggle)

(function () {
  function $(id) {
    return document.getElementById(id);
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
    var defaultOpen = ["configBody", "windowsBody", "summaryBody"];
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

    function handler() {
      APP.recalculate();
    }

    for (var i = 0; i < inputs.length; i++) {
      var el = $(inputs[i]);
      if (!el) continue;
      el.addEventListener("change", handler);
      el.addEventListener("input", handler);
    }
  }

  function initUI() {
    initAccordions();
    initModeToggle();
    initLiveRecalc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();