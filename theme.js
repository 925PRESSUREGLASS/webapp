// theme.js - Dark/Light theme toggle with system preference detection
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var THEME_KEY = 'quote-engine-theme';
  var currentTheme = 'dark'; // default

  // Detect system preference
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Load saved theme or use system preference
  function loadTheme() {
    try {
      var savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) {
        return savedTheme;
      }
      return getSystemTheme();
    } catch (e) {
      return 'dark';
    }
  }

  // Save theme preference
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }

  // Apply theme to document
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    // Update toggle button if exists
    updateToggleButton();

    // Save preference
    saveTheme(theme);
  }

  // Toggle between themes
  function toggleTheme() {
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);

    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo('Switched to ' + newTheme + ' theme');
    }
  }

  // Update toggle button appearance
  function updateToggleButton() {
    var btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    if (currentTheme === 'dark') {
      btn.innerHTML = '☀️ Light';
      btn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      btn.innerHTML = '🌙 Dark';
      btn.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  // Listen for system theme changes
  function setupSystemThemeListener() {
    if (window.matchMedia) {
      var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Modern browsers
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', function(e) {
          // Only auto-switch if user hasn't manually set a preference
          var savedTheme = localStorage.getItem(THEME_KEY);
          if (!savedTheme) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
      // Older browsers
      else if (darkModeQuery.addListener) {
        darkModeQuery.addListener(function(e) {
          var savedTheme = localStorage.getItem(THEME_KEY);
          if (!savedTheme) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
  }

  // Initialize theme
  function init() {
    var theme = loadTheme();
    applyTheme(theme);
    setupSystemThemeListener();

    // Add toggle button to header if not exists
    addToggleButton();

    console.log('Theme system initialized:', theme);
  }

  // Add theme toggle button to header
  function addToggleButton() {
    var headerActions = document.querySelector('.hdr-actions');
    if (!headerActions) return;

    // Check if button already exists
    if (document.getElementById('themeToggleBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-small theme-toggle-btn';
    btn.onclick = toggleTheme;

    // Insert before other buttons
    headerActions.insertBefore(btn, headerActions.firstChild);
    updateToggleButton();
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.ThemeManager = {
    toggle: toggleTheme,
    set: applyTheme,
    get: function() { return currentTheme; },
    getSystem: getSystemTheme
  };

})();
