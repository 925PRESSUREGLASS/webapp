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
      console.error('[STORAGE] Failed to save state:', e);
      if (e.name === 'QuotaExceededError') {
        if (window.showToast) {
          window.showToast('Storage full! Please export and delete old data.', 'error');
        }
      }
    }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      return safeParse(raw, null);
    } catch (e) {
      console.error('[STORAGE] Failed to load state:', e);
      return null;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {
      console.error('[STORAGE] Failed to clear state:', e);
    }
  }

  function loadPresets() {
    try {
      var raw = localStorage.getItem(PRESETS_KEY);
      return safeParse(raw, []);
    } catch (e) {
      console.error('[STORAGE] Failed to load presets:', e);
      return [];
    }
  }

  function savePresets(list) {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list || []));
    } catch (e) {
      console.error('[STORAGE] Failed to save presets:', e);
      if (e.name === 'QuotaExceededError') {
        if (window.showToast) {
          window.showToast('Storage full! Cannot save preset.', 'error');
        }
      }
    }
  }

  function loadSavedQuotes() {
    try {
      var raw = localStorage.getItem(SAVED_QUOTES_KEY);
      return safeParse(raw, []);
    } catch (e) {
      console.error('[STORAGE] Failed to load saved quotes:', e);
      return [];
    }
  }

  function saveSavedQuotes(list) {
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(list || []));
    } catch (e) {
      console.error('[STORAGE] Failed to save quotes:', e);
      if (e.name === 'QuotaExceededError') {
        if (window.showToast) {
          window.showToast('Storage full! Cannot save quote.', 'error');
        }
      }
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