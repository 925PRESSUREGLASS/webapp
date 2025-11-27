// debug.js - Debug logging system with toggleable output
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Debug configuration
  var DEBUG_CONFIG = {
    // Set to true for development, false for production
    enabled: false,

    // Module-specific debug levels
    // Use DEBUG.enableModule(name) / DEBUG.disableModule(name) to control
    modules: {
      app: true,
      calc: true,
      invoice: true,
      ui: true,
      wizard: true,
      storage: true,
      analytics: true,
      export: true,
      import: true
    },

    // Persist debug state to localStorage
    persistState: true,

    // Storage key for debug state
    storageKey: 'tictacstick-debug-enabled'
  };

  // Load saved debug state from localStorage
  function loadDebugState() {
    if (!DEBUG_CONFIG.persistState) return;

    try {
      var saved = localStorage.getItem(DEBUG_CONFIG.storageKey);
      if (saved !== null) {
        DEBUG_CONFIG.enabled = saved === 'true';
      }

      // Load module-specific settings
      var moduleSettings = localStorage.getItem(DEBUG_CONFIG.storageKey + '-modules');
      if (moduleSettings) {
        var parsed = JSON.parse(moduleSettings);
        DEBUG_CONFIG.modules = parsed;
      }
    } catch (e) {
      // localStorage not available or error reading
    }
  }

  // Save debug state to localStorage
  function saveDebugState() {
    if (!DEBUG_CONFIG.persistState) return;

    try {
      localStorage.setItem(DEBUG_CONFIG.storageKey, DEBUG_CONFIG.enabled ? 'true' : 'false');

      // Save module-specific settings
      localStorage.setItem(
        DEBUG_CONFIG.storageKey + '-modules',
        JSON.stringify(DEBUG_CONFIG.modules)
      );
    } catch (e) {
      // localStorage not available or quota exceeded
    }
  }

  // Debug module object
  var DebugModule = {
    /**
     * Log debug message (only when debug enabled)
     * @param {...*} arguments - Messages to log
     */
    log: function() {
      if (!DEBUG_CONFIG.enabled) return;

      // Ensure console.log exists (old browsers)
      if (window.console && console.log) {
        console.log.apply(console, arguments);
      }
    },

    /**
     * Log info message (only when debug enabled)
     * @param {...*} arguments - Messages to log
     */
    info: function() {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.info) {
        console.info.apply(console, arguments);
      } else if (window.console && console.log) {
        console.log.apply(console, arguments);
      }
    },

    /**
     * Log warning message (always shown - important)
     * @param {...*} arguments - Messages to log
     */
    warn: function() {
      if (window.console && console.warn) {
        console.warn.apply(console, arguments);
      } else if (window.console && console.log) {
        console.log.apply(console, ['WARN:'].concat(Array.prototype.slice.call(arguments)));
      }
    },

    /**
     * Log error message (always shown - critical)
     * @param {...*} arguments - Messages to log
     */
    error: function() {
      if (window.console && console.error) {
        console.error.apply(console, arguments);
      } else if (window.console && console.log) {
        console.log.apply(console, ['ERROR:'].concat(Array.prototype.slice.call(arguments)));
      }
    },

    /**
     * Start a collapsible log group (only when debug enabled)
     * @param {string} label - Group label
     */
    group: function(label) {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.group) {
        console.group(label);
      } else if (window.console && console.log) {
        console.log('┌─ ' + label);
      }
    },

    /**
     * Start a collapsed log group (only when debug enabled)
     * @param {string} label - Group label
     */
    groupCollapsed: function(label) {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.groupCollapsed) {
        console.groupCollapsed(label);
      } else if (window.console && console.group) {
        console.group(label);
      } else if (window.console && console.log) {
        console.log('┌─ ' + label + ' (collapsed)');
      }
    },

    /**
     * End a log group (only when debug enabled)
     */
    groupEnd: function() {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.groupEnd) {
        console.groupEnd();
      } else if (window.console && console.log) {
        console.log('└─');
      }
    },

    /**
     * Log a table (only when debug enabled)
     * Fallback to log if console.table not available
     * @param {*} data - Data to display
     * @param {Array} columns - Optional column names
     */
    table: function(data, columns) {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.table) {
        console.table(data, columns);
      } else if (window.console && console.log) {
        console.log(data);
      }
    },

    /**
     * Assert condition and log error if false (always checked)
     * @param {boolean} condition - Condition to test
     * @param {...*} messages - Messages to log if assertion fails
     */
    assert: function(condition) {
      if (condition) return;

      var messages = Array.prototype.slice.call(arguments, 1);

      if (window.console && console.assert) {
        console.assert.apply(console, arguments);
      } else if (window.console && console.error) {
        console.error.apply(console, ['Assertion failed:'].concat(messages));
      }
    },

    /**
     * Start a performance timer (only when debug enabled)
     * @param {string} label - Timer label
     */
    time: function(label) {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.time) {
        console.time(label);
      }
    },

    /**
     * End a performance timer (only when debug enabled)
     * @param {string} label - Timer label
     */
    timeEnd: function(label) {
      if (!DEBUG_CONFIG.enabled) return;

      if (window.console && console.timeEnd) {
        console.timeEnd(label);
      }
    },

    /**
     * Enable debug logging
     */
    enable: function() {
      DEBUG_CONFIG.enabled = true;
      saveDebugState();

      if (window.console && console.log) {
        console.log('%c[DEBUG] Debug logging enabled', 'color: #22c55e; font-weight: bold;');
      }
    },

    /**
     * Disable debug logging
     */
    disable: function() {
      if (window.console && console.log) {
        console.log('%c[DEBUG] Debug logging disabled', 'color: #ef4444; font-weight: bold;');
      }

      DEBUG_CONFIG.enabled = false;
      saveDebugState();
    },

    /**
     * Toggle debug logging on/off
     * @returns {boolean} New debug state
     */
    toggle: function() {
      if (DEBUG_CONFIG.enabled) {
        this.disable();
      } else {
        this.enable();
      }
      return DEBUG_CONFIG.enabled;
    },

    /**
     * Check if debug logging is enabled
     * @returns {boolean} Debug enabled state
     */
    isEnabled: function() {
      return DEBUG_CONFIG.enabled;
    },

    /**
     * Get current configuration
     * @returns {Object} Debug configuration
     */
    getConfig: function() {
      return {
        enabled: DEBUG_CONFIG.enabled,
        modules: DEBUG_CONFIG.modules,
        persistState: DEBUG_CONFIG.persistState
      };
    },

    /**
     * Enable debug logging for a specific module
     * @param {string} moduleName - Name of module to enable
     * @returns {boolean} True if module was enabled
     */
    enableModule: function(moduleName) {
      if (!moduleName) {
        console.warn('[DEBUG] enableModule: module name is required');
        return false;
      }

      DEBUG_CONFIG.modules[moduleName] = true;
      saveDebugState();

      if (window.console && console.log) {
        console.log('[DEBUG] Module "' + moduleName + '" debug logging enabled');
      }
      return true;
    },

    /**
     * Disable debug logging for a specific module
     * @param {string} moduleName - Name of module to disable
     * @returns {boolean} True if module was disabled
     */
    disableModule: function(moduleName) {
      if (!moduleName) {
        console.warn('[DEBUG] disableModule: module name is required');
        return false;
      }

      DEBUG_CONFIG.modules[moduleName] = false;
      saveDebugState();

      if (window.console && console.log) {
        console.log('[DEBUG] Module "' + moduleName + '" debug logging disabled');
      }
      return true;
    },

    /**
     * Check if a specific module has debug logging enabled
     * @param {string} moduleName - Name of module to check
     * @returns {boolean} True if module debug logging is enabled
     */
    isModuleEnabled: function(moduleName) {
      return DEBUG_CONFIG.modules[moduleName] === true;
    },

    /**
     * Get list of all enabled modules
     * @returns {Array<string>} Array of enabled module names
     */
    getEnabledModules: function() {
      var enabled = [];
      for (var moduleName in DEBUG_CONFIG.modules) {
        if (DEBUG_CONFIG.modules.hasOwnProperty(moduleName) && DEBUG_CONFIG.modules[moduleName]) {
          enabled.push(moduleName);
        }
      }
      return enabled;
    },

    /**
     * Get list of all disabled modules
     * @returns {Array<string>} Array of disabled module names
     */
    getDisabledModules: function() {
      var disabled = [];
      for (var moduleName in DEBUG_CONFIG.modules) {
        if (DEBUG_CONFIG.modules.hasOwnProperty(moduleName) && !DEBUG_CONFIG.modules[moduleName]) {
          disabled.push(moduleName);
        }
      }
      return disabled;
    },

    /**
     * Enable debug logging for all modules
     */
    enableAllModules: function() {
      for (var moduleName in DEBUG_CONFIG.modules) {
        if (DEBUG_CONFIG.modules.hasOwnProperty(moduleName)) {
          DEBUG_CONFIG.modules[moduleName] = true;
        }
      }
      saveDebugState();

      if (window.console && console.log) {
        console.log('[DEBUG] All module debug logging enabled');
      }
    },

    /**
     * Disable debug logging for all modules
     */
    disableAllModules: function() {
      for (var moduleName in DEBUG_CONFIG.modules) {
        if (DEBUG_CONFIG.modules.hasOwnProperty(moduleName)) {
          DEBUG_CONFIG.modules[moduleName] = false;
        }
      }
      saveDebugState();

      if (window.console && console.log) {
        console.log('[DEBUG] All module debug logging disabled');
      }
    },

    /**
     * Module-specific debug logger
     * @param {string} moduleName - Name of module
     * @returns {Object} Module-specific logger
     */
    forModule: function(moduleName) {
      var self = this;
      return {
        log: function() {
          if (!DEBUG_CONFIG.enabled) return;
          if (!DEBUG_CONFIG.modules[moduleName]) return;

          var args = ['[' + moduleName.toUpperCase() + ']'].concat(Array.prototype.slice.call(arguments));
          if (window.console && console.log) {
            console.log.apply(console, args);
          }
        },
        info: function() {
          if (!DEBUG_CONFIG.enabled) return;
          if (!DEBUG_CONFIG.modules[moduleName]) return;

          var args = ['[' + moduleName.toUpperCase() + ']'].concat(Array.prototype.slice.call(arguments));
          if (window.console && console.info) {
            console.info.apply(console, args);
          }
        },
        warn: self.warn,
        error: self.error,
        group: self.group,
        groupEnd: self.groupEnd
      };
    }
  };

  // Load saved debug state
  loadDebugState();

  // Export to global scope
  window.DEBUG = DebugModule;

  // Also make it available as window.DebugLogger for clarity
  window.DebugLogger = DebugModule;

  // Initial startup message (only if enabled)
  if (DEBUG_CONFIG.enabled && window.console && console.log) {
    console.log('%c[DEBUG] Debug system initialized', 'color: #38bdf8; font-weight: bold;');
    console.log('[DEBUG] Type DEBUG.disable() to turn off debug logging');
    console.log('[DEBUG] Type DEBUG.enable() to turn on debug logging');
    console.log('[DEBUG] Module controls:');
    console.log('[DEBUG]   DEBUG.enableModule("moduleName") - Enable specific module');
    console.log('[DEBUG]   DEBUG.disableModule("moduleName") - Disable specific module');
    console.log('[DEBUG]   DEBUG.getEnabledModules() - List enabled modules');
    console.log('[DEBUG]   DEBUG.isModuleEnabled("moduleName") - Check module status');
  }

})();
