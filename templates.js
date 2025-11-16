// templates.js - Quote template system
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Built-in templates
  var BUILTIN_TEMPLATES = {
    'standard-house': {
      name: 'Standard House Package',
      description: '3-bedroom house - standard windows',
      config: {
        baseFee: 120,
        hourlyRate: 95,
        minimumJob: 180,
        highReachModifierPercent: 60,
        insideMultiplier: 1.0,
        outsideMultiplier: 1.0,
        pressureHourlyRate: 120,
        setupBufferMinutes: 15
      },
      windowLines: [
        {
          windowType: 'standard_1x1',
          quantity: 8,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'medium',
          tintLevel: 'none'
        },
        {
          windowType: 'standard_1x2',
          quantity: 6,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'medium',
          tintLevel: 'none'
        },
        {
          windowType: 'glass_door',
          quantity: 2,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'light',
          tintLevel: 'none'
        }
      ],
      pressureLines: []
    },

    'apartment-balcony': {
      name: 'Apartment Balcony Special',
      description: 'Balcony glass and sliding doors',
      config: {
        baseFee: 120,
        hourlyRate: 95,
        minimumJob: 150,
        highReachModifierPercent: 60,
        insideMultiplier: 1.0,
        outsideMultiplier: 1.2,
        pressureHourlyRate: 120,
        setupBufferMinutes: 10
      },
      windowLines: [
        {
          windowType: 'glass_balustrade',
          quantity: 10,
          insideChecked: false,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'heavy',
          tintLevel: 'none'
        },
        {
          windowType: 'glass_door',
          quantity: 2,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'medium',
          tintLevel: 'none'
        }
      ],
      pressureLines: []
    },

    'commercial-storefront': {
      name: 'Commercial Storefront',
      description: 'Retail shop front windows',
      config: {
        baseFee: 150,
        hourlyRate: 110,
        minimumJob: 200,
        highReachModifierPercent: 50,
        insideMultiplier: 1.0,
        outsideMultiplier: 1.1,
        pressureHourlyRate: 130,
        setupBufferMinutes: 20
      },
      windowLines: [
        {
          windowType: 'feature_window',
          quantity: 4,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'heavy',
          tintLevel: 'none'
        },
        {
          windowType: 'glass_door',
          quantity: 2,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'heavy',
          tintLevel: 'none'
        }
      ],
      pressureLines: []
    },

    'pressure-driveway': {
      name: 'Driveway & Paths Package',
      description: 'Standard residential pressure cleaning',
      config: {
        baseFee: 120,
        hourlyRate: 95,
        minimumJob: 200,
        highReachModifierPercent: 60,
        insideMultiplier: 1.0,
        outsideMultiplier: 1.0,
        pressureHourlyRate: 120,
        setupBufferMinutes: 20
      },
      windowLines: [],
      pressureLines: [
        {
          surfaceType: 'concrete',
          areaSqm: 40,
          soilLevel: 'medium',
          accessDifficulty: 'easy'
        },
        {
          surfaceType: 'paving',
          areaSqm: 20,
          soilLevel: 'medium',
          accessDifficulty: 'easy'
        }
      ]
    },

    'full-service': {
      name: 'Full Service Package',
      description: 'Windows + Pressure cleaning combo',
      config: {
        baseFee: 150,
        hourlyRate: 95,
        minimumJob: 300,
        highReachModifierPercent: 60,
        insideMultiplier: 1.0,
        outsideMultiplier: 1.0,
        pressureHourlyRate: 120,
        setupBufferMinutes: 25
      },
      windowLines: [
        {
          windowType: 'standard_1x1',
          quantity: 10,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'medium',
          tintLevel: 'none'
        },
        {
          windowType: 'glass_door',
          quantity: 2,
          insideChecked: true,
          outsideChecked: true,
          highReachChecked: false,
          soilLevel: 'medium',
          tintLevel: 'none'
        }
      ],
      pressureLines: [
        {
          surfaceType: 'concrete',
          areaSqm: 30,
          soilLevel: 'medium',
          accessDifficulty: 'easy'
        }
      ]
    }
  };

  // Load template
  function loadTemplate(templateId) {
    try {
      var template = BUILTIN_TEMPLATES[templateId];
      if (!template) {
        showError('Template not found');
        return false;
      }

      if (!window.APP) {
        showError('App not ready');
        return false;
      }

      // Clear existing data
      if (confirm('This will replace your current quote. Continue?')) {
        applyTemplate(template);
        showSuccess('Template loaded: ' + template.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Template load error:', error);
      showError('Failed to load template: ' + error.message);
      return false;
    }
  }

  // Apply template to current quote
  function applyTemplate(template) {
    // Clear title/client info (keep them empty for new quote)
    document.getElementById('quoteTitleInput').value = '';
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientLocationInput').value = '';
    document.getElementById('jobTypeInput').value = '';

    // Apply config
    if (template.config) {
      document.getElementById('baseFeeInput').value = template.config.baseFee || 120;
      document.getElementById('hourlyRateInput').value = template.config.hourlyRate || 95;
      document.getElementById('minimumJobInput').value = template.config.minimumJob || 180;
      document.getElementById('highReachModifierInput').value = template.config.highReachModifierPercent || 60;
      document.getElementById('insideMultiplierInput').value = template.config.insideMultiplier || 1.0;
      document.getElementById('outsideMultiplierInput').value = template.config.outsideMultiplier || 1.0;
      document.getElementById('pressureHourlyRateInput').value = template.config.pressureHourlyRate || 120;
      document.getElementById('setupBufferMinutesInput').value = template.config.setupBufferMinutes || 15;
    }

    // Clear existing lines (simulate clear all)
    var clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
      clearBtn.click();
    }

    // Add window lines
    if (template.windowLines && template.windowLines.length > 0) {
      template.windowLines.forEach(function(line) {
        if (window.APP && window.APP.addWindowLine) {
          window.APP.addWindowLine(line);
        }
      });
    }

    // Add pressure lines
    if (template.pressureLines && template.pressureLines.length > 0) {
      template.pressureLines.forEach(function(line) {
        if (window.APP && window.APP.addPressureLine) {
          window.APP.addPressureLine(line);
        }
      });
    }

    // Recalculate
    if (window.APP && window.APP.recalculate) {
      window.APP.recalculate();
    }
  }

  // Get all templates
  function getAllTemplates() {
    var templates = [];
    for (var id in BUILTIN_TEMPLATES) {
      if (BUILTIN_TEMPLATES.hasOwnProperty(id)) {
        templates.push({
          id: id,
          name: BUILTIN_TEMPLATES[id].name,
          description: BUILTIN_TEMPLATES[id].description
        });
      }
    }
    return templates;
  }

  // Save custom template
  function saveCustomTemplate(name, description) {
    try {
      if (!window.APP || !window.APP.getState) {
        showError('Cannot save template: App not ready');
        return false;
      }

      var state = window.APP.getState();
      var customTemplates = loadCustomTemplates();

      var templateId = 'custom_' + Date.now();
      customTemplates[templateId] = {
        name: name,
        description: description || '',
        config: {
          baseFee: state.baseFee,
          hourlyRate: state.hourlyRate,
          minimumJob: state.minimumJob,
          highReachModifierPercent: state.highReachModifierPercent,
          insideMultiplier: state.insideMultiplier,
          outsideMultiplier: state.outsideMultiplier,
          pressureHourlyRate: state.pressureHourlyRate,
          setupBufferMinutes: state.setupBufferMinutes
        },
        windowLines: state.windowLines || [],
        pressureLines: state.pressureLines || []
      };

      saveCustomTemplates(customTemplates);
      showSuccess('Template saved: ' + name);
      updateTemplateSelect();
      return true;
    } catch (error) {
      console.error('Save template error:', error);
      showError('Failed to save template: ' + error.message);
      return false;
    }
  }

  // Load custom templates from localStorage
  function loadCustomTemplates() {
    try {
      var stored = localStorage.getItem('quoteTemplates');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load custom templates:', e);
      return {};
    }
  }

  // Save custom templates to localStorage
  function saveCustomTemplates(templates) {
    try {
      localStorage.setItem('quoteTemplates', JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to save templates:', e);
      showError('Failed to save template: Storage error');
    }
  }

  // Delete custom template
  function deleteCustomTemplate(templateId) {
    if (!templateId.startsWith('custom_')) {
      showError('Cannot delete built-in templates');
      return false;
    }

    var customTemplates = loadCustomTemplates();
    delete customTemplates[templateId];
    saveCustomTemplates(customTemplates);
    showSuccess('Template deleted');
    updateTemplateSelect();
    return true;
  }

  // Update template select dropdown
  function updateTemplateSelect() {
    var select = document.getElementById('templateSelect');
    if (!select) return;

    // Clear existing options
    select.innerHTML = '<option value="">Choose Template...</option>';

    // Add built-in templates
    var builtinGroup = document.createElement('optgroup');
    builtinGroup.label = 'Built-in Templates';
    for (var id in BUILTIN_TEMPLATES) {
      if (BUILTIN_TEMPLATES.hasOwnProperty(id)) {
        var option = document.createElement('option');
        option.value = id;
        option.textContent = BUILTIN_TEMPLATES[id].name;
        builtinGroup.appendChild(option);
      }
    }
    select.appendChild(builtinGroup);

    // Add custom templates
    var customTemplates = loadCustomTemplates();
    var hasCustom = false;
    for (var customId in customTemplates) {
      if (customTemplates.hasOwnProperty(customId)) {
        if (!hasCustom) {
          var customGroup = document.createElement('optgroup');
          customGroup.label = 'Custom Templates';
          customGroup.id = 'customTemplateGroup';
          select.appendChild(customGroup);
          hasCustom = true;
        }
        var customOption = document.createElement('option');
        customOption.value = customId;
        customOption.textContent = customTemplates[customId].name;
        document.getElementById('customTemplateGroup').appendChild(customOption);
      }
    }
  }

  // Helper functions
  function showError(message) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(message);
    } else if (window.KeyboardShortcuts) {
      window.KeyboardShortcuts.showToast(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }

  function showSuccess(message) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess(message);
    } else if (window.KeyboardShortcuts) {
      window.KeyboardShortcuts.showToast(message, 'success');
    }
  }

  // Initialize
  function init() {
    updateTemplateSelect();

    // Add template select change handler
    var templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
      templateSelect.addEventListener('change', function() {
        var templateId = this.value;
        if (templateId) {
          loadTemplate(templateId);
          this.value = ''; // Reset select
        }
      });
    }

    // Add save template button handler
    var saveTemplateBtn = document.getElementById('saveTemplateBtn');
    if (saveTemplateBtn) {
      saveTemplateBtn.addEventListener('click', function() {
        var name = prompt('Enter template name:');
        if (name) {
          var description = prompt('Enter template description (optional):');
          saveCustomTemplate(name, description);
        }
      });
    }

    console.log('Templates initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.QuoteTemplates = {
    load: loadTemplate,
    save: saveCustomTemplate,
    delete: deleteCustomTemplate,
    getAll: getAllTemplates,
    getBuiltin: function() { return BUILTIN_TEMPLATES; }
  };

})();
