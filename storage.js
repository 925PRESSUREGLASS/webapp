// storage.js – localStorage wrapper for autosave & saved quotes

var AppStorage = (function () {
  var AUTOSAVE_KEY = "tictacstick_autosave_state_v1";
  var PRESETS_KEY = "tictacstick_presets_v1";
  var SAVED_QUOTES_KEY = "tictacstick_saved_quotes_v1";

  function safeParse(json, fallback) {
    try {
      var val = JSON.parse(json);
      return val == null ? fallback : val;
    } catch (e) {
      return fallback;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      return safeParse(raw, null);
    } catch (e) {
      return null;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function loadPresets() {
    try {
      var raw = localStorage.getItem(PRESETS_KEY);
      return safeParse(raw, []);
    } catch (e) {
      return [];
    }
  }

  function savePresets(list) {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list || []));
    } catch (e) {
      // ignore
    }
  }

  function loadSavedQuotes() {
    try {
      var raw = localStorage.getItem(SAVED_QUOTES_KEY);
      return safeParse(raw, []);
    } catch (e) {
      return [];
    }
  }

  function saveSavedQuotes(list) {
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(list || []));
    } catch (e) {
      // ignore
    }
  }

  return {
    saveState: saveState,
    loadState: loadState,
    clearState: clearState,
    loadPresets: loadPresets,
    savePresets: savePresets,
    loadSavedQuotes: loadSavedQuotes,
    saveSavedQuotes: saveSavedQuotes
  };
})();