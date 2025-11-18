// theme-customizer.js - Advanced theme customization system
// Allows users to create custom color schemes and upload logos
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var CUSTOM_THEME_KEY = 'quote-engine-custom-theme';
  var CUSTOM_LOGO_KEY = 'quote-engine-custom-logo';
  var isPreviewMode = false;
  var customTheme = null;

  // Default color variables for dark theme
  var DEFAULT_DARK_COLORS = {
    bgPrimary: '#0f172a',
    bgSecondary: '#1f2937',
    bgTertiary: '#020617',
    bgCard: '#1f2937',
    bgCardHover: '#374151',
    textPrimary: '#e5e7eb',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    textMuted: '#64748b',
    borderColor: '#334155',
    borderHover: '#475569',
    accentPrimary: '#38bdf8',
    accentSecondary: '#0ea5e9',
    accentHover: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };

  // Default color variables for light theme
  var DEFAULT_LIGHT_COLORS = {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgCard: '#ffffff',
    bgCardHover: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    textMuted: '#94a3b8',
    borderColor: '#e2e8f0',
    borderHover: '#cbd5e1',
    accentPrimary: '#0284c7',
    accentSecondary: '#38bdf8',
    accentHover: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };

  // Color variable mapping (CSS property name to friendly name)
  var COLOR_LABELS = {
    bgPrimary: 'Background Primary',
    bgSecondary: 'Background Secondary',
    bgTertiary: 'Background Tertiary',
    bgCard: 'Card Background',
    bgCardHover: 'Card Hover Background',
    textPrimary: 'Text Primary',
    textSecondary: 'Text Secondary',
    textTertiary: 'Text Tertiary',
    textMuted: 'Text Muted',
    borderColor: 'Border Color',
    borderHover: 'Border Hover',
    accentPrimary: 'Accent Primary',
    accentSecondary: 'Accent Secondary',
    accentHover: 'Accent Hover',
    success: 'Success Color',
    warning: 'Warning Color',
    error: 'Error Color',
    info: 'Info Color'
  };

  // Load custom theme from localStorage
  function loadCustomTheme() {
    try {
      var savedTheme = localStorage.getItem(CUSTOM_THEME_KEY);
      if (savedTheme) {
        customTheme = JSON.parse(savedTheme);
        return customTheme;
      }
    } catch (e) {
      console.error('Failed to load custom theme:', e);
    }
    return null;
  }

  // Save custom theme to localStorage
  function saveCustomTheme(theme) {
    try {
      customTheme = theme;
      localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(theme));
      return true;
    } catch (e) {
      console.error('Failed to save custom theme:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to save custom theme');
      }
      return false;
    }
  }

  // Load custom logo from localStorage
  function loadCustomLogo() {
    try {
      return localStorage.getItem(CUSTOM_LOGO_KEY);
    } catch (e) {
      console.error('Failed to load custom logo:', e);
      return null;
    }
  }

  // Save custom logo to localStorage
  function saveCustomLogo(logoDataUrl) {
    try {
      localStorage.setItem(CUSTOM_LOGO_KEY, logoDataUrl);
      return true;
    } catch (e) {
      console.error('Failed to save custom logo:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to save logo. File may be too large.');
      }
      return false;
    }
  }

  // Apply custom theme colors to document
  function applyCustomColors(colors) {
    var root = document.documentElement;

    console.log('[THEME-CUSTOMIZER] Applying custom colors:', colors);

    // Apply each color as a CSS variable
    // We use inline styles on documentElement which have higher specificity than :root
    for (var key in colors) {
      if (colors.hasOwnProperty(key)) {
        var cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        // Set property with important flag to override base theme
        root.style.setProperty(cssVarName, colors[key], 'important');

        console.log('[THEME-CUSTOMIZER] Set', cssVarName, '=', colors[key]);
      }
    }
  }

  // Apply custom logo
  function applyCustomLogo(logoDataUrl) {
    var logoElement = document.querySelector('.hdr-ic');
    if (!logoElement) return;

    if (logoDataUrl) {
      // Replace icon content with logo image
      logoElement.style.backgroundImage = 'url(' + logoDataUrl + ')';
      logoElement.style.backgroundSize = 'cover';
      logoElement.style.backgroundPosition = 'center';
      logoElement.innerHTML = ''; // Clear emoji
    } else {
      // Restore default emoji
      logoElement.style.backgroundImage = '';
      logoElement.innerHTML = '🪟';
    }
  }

  // Apply complete custom theme
  function applyCustomTheme(theme) {
    if (!theme) return;

    // IMPORTANT: Do NOT call ThemeManager.set() here as it creates a circular reference
    // The base theme is already set by theme.js before calling this function

    // Apply custom colors immediately
    if (theme.colors) {
      applyCustomColors(theme.colors);
    }

    // Apply custom logo
    if (theme.logo) {
      applyCustomLogo(theme.logo);
    }

    // Mark as custom theme
    document.documentElement.setAttribute('data-custom-theme', 'true');

    console.log('[THEME-CUSTOMIZER] Custom theme applied:', theme);
  }

  // Reset to default theme
  function resetToDefault() {
    var root = document.documentElement;

    // Remove all custom CSS variables
    for (var key in DEFAULT_DARK_COLORS) {
      if (DEFAULT_DARK_COLORS.hasOwnProperty(key)) {
        var cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.removeProperty(cssVarName);
      }
    }

    // Remove custom theme marker
    document.documentElement.removeAttribute('data-custom-theme');

    // Clear custom theme from storage
    try {
      localStorage.removeItem(CUSTOM_THEME_KEY);
      localStorage.removeItem(CUSTOM_LOGO_KEY);
    } catch (e) {
      console.error('Failed to clear custom theme:', e);
    }

    // Restore default logo
    applyCustomLogo(null);

    customTheme = null;

    // Reset theme mode to dark
    if (window.ThemeManager) {
      window.ThemeManager.set('dark');
    }

    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo('Theme reset to defaults');
    }
  }

  // Create customizer modal UI
  function createCustomizerModal() {
    // Check if modal already exists
    if (document.getElementById('themeCustomizerModal')) {
      return document.getElementById('themeCustomizerModal');
    }

    var modal = document.createElement('div');
    modal.id = 'themeCustomizerModal';
    modal.className = 'theme-customizer-modal';
    modal.style.display = 'none';

    var currentTheme = customTheme || {
      name: 'My Custom Theme',
      baseTheme: window.ThemeManager ? window.ThemeManager.get() : 'dark',
      colors: window.ThemeManager && window.ThemeManager.get() === 'light'
        ? Object.assign({}, DEFAULT_LIGHT_COLORS)
        : Object.assign({}, DEFAULT_DARK_COLORS),
      logo: loadCustomLogo()
    };

    modal.innerHTML =
      '<div class="theme-customizer-overlay"></div>' +
      '<div class="theme-customizer-dialog">' +
        '<div class="theme-customizer-header">' +
          '<h2>🎨 Theme Customizer</h2>' +
          '<button type="button" class="theme-customizer-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="theme-customizer-body">' +
          '<div class="theme-customizer-section">' +
            '<h3>Base Theme</h3>' +
            '<select id="customThemeBase" class="theme-customizer-select">' +
              '<option value="dark" ' + (currentTheme.baseTheme === 'dark' ? 'selected' : '') + '>Dark</option>' +
              '<option value="light" ' + (currentTheme.baseTheme === 'light' ? 'selected' : '') + '>Light</option>' +
            '</select>' +
          '</div>' +
          '<div class="theme-customizer-section">' +
            '<h3>Custom Logo</h3>' +
            '<div class="theme-logo-upload">' +
              '<input type="file" id="logoUpload" accept="image/*" style="display: none;" />' +
              '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'logoUpload\').click()">📁 Upload Logo</button>' +
              '<button type="button" class="btn btn-tertiary" id="removeLogoBtn">🗑️ Remove Logo</button>' +
              '<div class="theme-logo-preview" id="logoPreview">' +
                (currentTheme.logo ? '<img src="' + currentTheme.logo + '" alt="Custom logo" />' : '<div class="theme-logo-placeholder">No logo uploaded</div>') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="theme-customizer-section">' +
            '<h3>Colors</h3>' +
            '<div class="theme-color-grid" id="colorGrid"></div>' +
          '</div>' +
        '</div>' +
        '<div class="theme-customizer-footer">' +
          '<button type="button" class="btn btn-secondary" id="resetThemeBtn">🔄 Reset to Defaults</button>' +
          '<button type="button" class="btn btn-secondary" id="exportThemeBtn">💾 Export Theme</button>' +
          '<button type="button" class="btn btn-secondary" id="importThemeBtn">📂 Import Theme</button>' +
          '<button type="button" class="btn" id="saveThemeBtn">✅ Save & Apply</button>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="importThemeFile" accept=".json" style="display: none;" />';

    document.body.appendChild(modal);

    // Populate color grid
    populateColorGrid(currentTheme.colors);

    // Attach event listeners
    attachCustomizerEvents(modal, currentTheme);

    return modal;
  }

  // Populate color picker grid
  function populateColorGrid(colors) {
    var grid = document.getElementById('colorGrid');
    if (!grid) return;

    grid.innerHTML = '';

    for (var key in colors) {
      if (colors.hasOwnProperty(key)) {
        var colorItem = document.createElement('div');
        colorItem.className = 'theme-color-item';

        colorItem.innerHTML =
          '<label for="color-' + key + '">' + COLOR_LABELS[key] + '</label>' +
          '<div class="theme-color-input-wrapper">' +
            '<input type="color" id="color-' + key + '" value="' + colors[key] + '" data-key="' + key + '" />' +
            '<input type="text" id="text-' + key + '" value="' + colors[key] + '" data-key="' + key + '" maxlength="7" />' +
          '</div>';

        grid.appendChild(colorItem);
      }
    }

    // Sync color picker with text input
    var colorInputs = grid.querySelectorAll('input[type="color"]');
    for (var i = 0; i < colorInputs.length; i++) {
      colorInputs[i].addEventListener('input', function(e) {
        var textInput = document.getElementById('text-' + e.target.dataset.key);
        if (textInput) {
          textInput.value = e.target.value;
        }
        // Live preview
        if (isPreviewMode) {
          var previewColors = {};
          previewColors[e.target.dataset.key] = e.target.value;
          applyCustomColors(previewColors);
        }
      });
    }

    var textInputs = grid.querySelectorAll('input[type="text"]');
    for (var j = 0; j < textInputs.length; j++) {
      textInputs[j].addEventListener('input', function(e) {
        var colorInput = document.getElementById('color-' + e.target.dataset.key);
        if (colorInput && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorInput.value = e.target.value;
          // Live preview
          if (isPreviewMode) {
            var previewColors = {};
            previewColors[e.target.dataset.key] = e.target.value;
            applyCustomColors(previewColors);
          }
        }
      });
    }
  }

  // Attach event listeners to customizer modal
  function attachCustomizerEvents(modal, currentTheme) {
    // Close button
    var closeBtn = modal.querySelector('.theme-customizer-close');
    var overlay = modal.querySelector('.theme-customizer-overlay');

    closeBtn.onclick = function() {
      closeCustomizer();
    };

    overlay.onclick = function() {
      closeCustomizer();
    };

    // Base theme change
    var baseThemeSelect = document.getElementById('customThemeBase');
    if (baseThemeSelect) {
      baseThemeSelect.onchange = function() {
        var newBase = this.value;
        currentTheme.baseTheme = newBase;

        // Update colors to match new base
        var defaultColors = newBase === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;
        currentTheme.colors = Object.assign({}, defaultColors);

        // Repopulate grid
        populateColorGrid(currentTheme.colors);

        // Apply base theme and then custom colors for preview
        if (isPreviewMode) {
          // Set base theme attribute
          document.documentElement.setAttribute('data-theme', newBase);
          document.body.setAttribute('data-theme', newBase);

          // Apply custom colors on top
          applyCustomTheme(currentTheme);
        }
      };
    }

    // Logo upload
    var logoUpload = document.getElementById('logoUpload');
    if (logoUpload) {
      logoUpload.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Please select an image file');
          }
          return;
        }

        // Limit file size to 500KB
        if (file.size > 500 * 1024) {
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Logo file must be under 500KB');
          }
          return;
        }

        var reader = new FileReader();
        reader.onload = function(event) {
          var logoDataUrl = event.target.result;
          currentTheme.logo = logoDataUrl;

          // Update preview
          var preview = document.getElementById('logoPreview');
          if (preview) {
            preview.innerHTML = '<img src="' + logoDataUrl + '" alt="Custom logo" />';
          }

          if (isPreviewMode) {
            applyCustomLogo(logoDataUrl);
          }
        };
        reader.readAsDataURL(file);
      };
    }

    // Remove logo
    var removeLogoBtn = document.getElementById('removeLogoBtn');
    if (removeLogoBtn) {
      removeLogoBtn.onclick = function() {
        currentTheme.logo = null;

        var preview = document.getElementById('logoPreview');
        if (preview) {
          preview.innerHTML = '<div class="theme-logo-placeholder">No logo uploaded</div>';
        }

        if (isPreviewMode) {
          applyCustomLogo(null);
        }
      };
    }

    // Reset theme
    var resetBtn = document.getElementById('resetThemeBtn');
    if (resetBtn) {
      resetBtn.onclick = function() {
        if (confirm('Are you sure you want to reset to default theme? This cannot be undone.')) {
          resetToDefault();
          closeCustomizer();

          // Reload page to ensure clean state
          setTimeout(function() {
            window.location.reload();
          }, 500);
        }
      };
    }

    // Export theme
    var exportBtn = document.getElementById('exportThemeBtn');
    if (exportBtn) {
      exportBtn.onclick = function() {
        exportTheme(currentTheme);
      };
    }

    // Import theme
    var importBtn = document.getElementById('importThemeBtn');
    var importFile = document.getElementById('importThemeFile');
    if (importBtn && importFile) {
      importBtn.onclick = function() {
        importFile.click();
      };

      importFile.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(event) {
          try {
            var importedTheme = JSON.parse(event.target.result);

            // Validate theme structure
            if (!importedTheme.baseTheme || !importedTheme.colors) {
              throw new Error('Invalid theme file');
            }

            // Apply imported theme
            currentTheme = importedTheme;

            // Update UI
            var baseSelect = document.getElementById('customThemeBase');
            if (baseSelect) {
              baseSelect.value = currentTheme.baseTheme;
            }

            populateColorGrid(currentTheme.colors);

            var logoPreview = document.getElementById('logoPreview');
            if (logoPreview && currentTheme.logo) {
              logoPreview.innerHTML = '<img src="' + currentTheme.logo + '" alt="Custom logo" />';
            }

            if (window.ErrorHandler) {
              window.ErrorHandler.showSuccess('Theme imported successfully');
            }

            // Preview imported theme
            isPreviewMode = true;
            applyCustomTheme(currentTheme);

          } catch (error) {
            if (window.ErrorHandler) {
              window.ErrorHandler.showError('Failed to import theme: ' + error.message);
            }
          }
        };
        reader.readAsText(file);
      };
    }

    // Save & Apply
    var saveBtn = document.getElementById('saveThemeBtn');
    if (saveBtn) {
      saveBtn.onclick = function() {
        // Collect current colors from inputs
        var colorInputs = document.querySelectorAll('#colorGrid input[type="color"]');
        var updatedColors = {};

        for (var i = 0; i < colorInputs.length; i++) {
          var key = colorInputs[i].dataset.key;
          updatedColors[key] = colorInputs[i].value;
        }

        currentTheme.colors = updatedColors;

        // Save theme
        if (saveCustomTheme(currentTheme)) {
          if (currentTheme.logo) {
            saveCustomLogo(currentTheme.logo);
          }

          // Set theme mode to 'custom'
          if (window.ThemeManager) {
            window.ThemeManager.set('custom');
          }

          if (window.ErrorHandler) {
            window.ErrorHandler.showSuccess('Custom theme saved and applied');
          }

          closeCustomizer();
        }
      };
    }

    // Enable preview mode
    isPreviewMode = true;
    applyCustomTheme(currentTheme);
  }

  // Export theme as JSON file
  function exportTheme(theme) {
    try {
      var themeJson = JSON.stringify(theme, null, 2);
      var blob = new Blob([themeJson], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = (theme.name || 'custom-theme').replace(/\s+/g, '-').toLowerCase() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Theme exported successfully');
      }
    } catch (e) {
      console.error('Failed to export theme:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to export theme');
      }
    }
  }

  // Open customizer modal
  function openCustomizer() {
    var modal = createCustomizerModal();
    modal.style.display = 'block';

    // Trap focus in modal for accessibility
    var focusableElements = modal.querySelectorAll('button, input, select');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  // Close customizer modal
  function closeCustomizer() {
    var modal = document.getElementById('themeCustomizerModal');
    if (modal) {
      modal.style.display = 'none';
      isPreviewMode = false;
    }
  }

  // Add customizer button to header
  function addCustomizerButton() {
    var headerActions = document.querySelector('.hdr-actions');
    if (!headerActions) return;

    // Check if button already exists
    if (document.getElementById('themeCustomizerBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'themeCustomizerBtn';
    btn.type = 'button';
    btn.className = 'btn btn-tertiary btn-sm';
    btn.innerHTML = '🎨 Customize';
    btn.onclick = openCustomizer;
    btn.setAttribute('aria-label', 'Open theme customizer');

    // Insert after theme toggle button
    var themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle && themeToggle.nextSibling) {
      headerActions.insertBefore(btn, themeToggle.nextSibling);
    } else {
      headerActions.appendChild(btn);
    }
  }

  // Initialize theme customizer
  function init() {
    // Add customizer button
    addCustomizerButton();

    // Note: Custom theme application is now handled by theme.js
    // when the theme mode is set to 'custom'

    DEBUG.log('[THEME-CUSTOMIZER] Theme customizer initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.ThemeCustomizer = {
    open: openCustomizer,
    close: closeCustomizer,
    apply: applyCustomTheme,
    reset: resetToDefault,
    export: exportTheme,
    save: saveCustomTheme,
    load: loadCustomTheme
  };

})();
