// debug.js - Debug logging system with toggleable output
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Debug configuration
  var DEBUG_CONFIG = {
    // Set to true for development, false for production
    enabled: false,

    // Module-specific debug levels (future enhancement)
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
    } catch (e) {
      // localStorage not available or error reading
    }
  }

  // Save debug state to localStorage
  function saveDebugState() {
    if (!DEBUG_CONFIG.persistState) return;

    try {
      localStorage.setItem(DEBUG_CONFIG.storageKey, DEBUG_CONFIG.enabled ? 'true' : 'false');
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
  }

})();
