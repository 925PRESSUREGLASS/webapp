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

    // Handle custom theme
    if (theme === 'custom') {
      // Apply custom theme if ThemeCustomizer is available
      if (window.ThemeCustomizer && window.ThemeCustomizer.load) {
        var customTheme = window.ThemeCustomizer.load();
        if (customTheme) {
          // Set base theme first
          var baseTheme = customTheme.baseTheme || 'dark';
          document.documentElement.setAttribute('data-theme', baseTheme);
          document.body.setAttribute('data-theme', baseTheme);

          // Apply custom theme
          window.ThemeCustomizer.apply(customTheme);
        } else {
          // No custom theme found, fall back to dark
          console.warn('[THEME] No custom theme found, falling back to dark');
          theme = 'dark';
          currentTheme = 'dark';
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.setAttribute('data-theme', 'dark');
        }
      }
    } else {
      // Apply standard light/dark theme
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
    }

    // Update toggle button if exists
    updateToggleButton();

    // Save preference
    saveTheme(theme);
  }

  // Toggle between themes (light -> dark -> custom -> light)
  function toggleTheme() {
    var newTheme;

    // Check if custom theme exists
    var hasCustomTheme = false;
    try {
      var customThemeData = localStorage.getItem('quote-engine-custom-theme');
      hasCustomTheme = !!customThemeData;
    } catch (e) {
      hasCustomTheme = false;
    }

    // Cycle through themes
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = hasCustomTheme ? 'custom' : 'light';
    } else {
      newTheme = 'light';
    }

    applyTheme(newTheme);

    if (window.ErrorHandler) {
      var themeName = newTheme === 'custom' ? 'custom' : newTheme;
      window.ErrorHandler.showInfo('Switched to ' + themeName + ' theme');
    }
  }

  // Update toggle button appearance
  function updateToggleButton() {
    var btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    // Check if custom theme exists
    var hasCustomTheme = false;
    try {
      var customThemeData = localStorage.getItem('quote-engine-custom-theme');
      hasCustomTheme = !!customThemeData;
    } catch (e) {
      hasCustomTheme = false;
    }

    if (currentTheme === 'dark') {
      if (hasCustomTheme) {
        btn.innerHTML = '🎨 Custom';
        btn.setAttribute('aria-label', 'Switch to custom theme');
      } else {
        btn.innerHTML = '☀️ Light';
        btn.setAttribute('aria-label', 'Switch to light theme');
      }
    } else if (currentTheme === 'light') {
      btn.innerHTML = '🌙 Dark';
      btn.setAttribute('aria-label', 'Switch to dark theme');
    } else if (currentTheme === 'custom') {
      btn.innerHTML = '☀️ Light';
      btn.setAttribute('aria-label', 'Switch to light theme');
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

    DEBUG.log('[THEME] Theme system initialized:', theme);
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
    btn.className = 'btn btn-tertiary btn-sm theme-toggle-btn';
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
