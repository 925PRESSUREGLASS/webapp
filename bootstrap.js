// bootstrap.js - APP Initialization Bootstrap
// Creates the global APP namespace before any other modules load
// Provides initialization tracking and module registration
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  console.log('[BOOTSTRAP] Initializing Tic-Tac-Stick APP object...');

  // Prevent double initialization
  if (window.APP) {
    console.warn('[BOOTSTRAP] window.APP already exists!');
    return;
  }

  // Create global APP object with initialization state
  window.APP = {
    version: '1.7.0',
    initialized: false,
    initPromise: null,
    modules: {},

    // Module registration
    registerModule: function(name, module) {
      if (this.modules[name]) {
        console.warn('[BOOTSTRAP] Module "' + name + '" already registered. Overwriting.');
      }
      this.modules[name] = module;
      console.log('[BOOTSTRAP] Module registered: ' + name);
      return this; // Allow chaining
    },

    // Get module
    getModule: function(name) {
      if (!this.modules[name]) {
        console.error('[BOOTSTRAP] Module "' + name + '" not found!');
        return null;
      }
      return this.modules[name];
    },

    // Initialization
    init: function() {
      if (this.initialized) {
        console.warn('[BOOTSTRAP] APP already initialized');
        return Promise.resolve();
      }

      if (this.initPromise) {
        return this.initPromise;
      }

      console.log('[BOOTSTRAP] Starting APP initialization...');

      var self = this;

      this.initPromise = new Promise(function(resolve, reject) {
        // Use setTimeout to make async (allows tests to await reliably)
        setTimeout(function() {
          try {
            // Initialize storage (with error handling)
            if (self.modules.storage) {
              try {
                self.modules.storage.init();
              } catch (e) {
                console.error('[BOOTSTRAP] Storage init failed:', e);
                // Continue even if storage fails
              }
            }

            // Load saved state
            if (self.modules.app) {
              try {
                self.modules.app.loadState();
              } catch (e) {
                console.error('[BOOTSTRAP] Load state failed:', e);
              }
            }

            // Initialize UI
            if (self.modules.ui) {
              try {
                self.modules.ui.init();
              } catch (e) {
                console.error('[BOOTSTRAP] UI init failed:', e);
              }
            }

            // Mark as initialized (both flags for backward compatibility)
            self.initialized = true;
            self.isInitialized = true;
            console.log('[BOOTSTRAP] APP initialization complete ✅');

            // Dispatch custom event (for analytics, monitoring)
            if (typeof CustomEvent !== 'undefined') {
              window.dispatchEvent(new CustomEvent('app:initialized'));
            }

            resolve();
          } catch (error) {
            console.error('[BOOTSTRAP] Initialization failed:', error);
            reject(error);
          }
        }, 0);
      });

      return this.initPromise;
    },

    // Wait for initialization (test-friendly)
    waitForInit: function(timeout) {
      timeout = timeout || 5000;

      if (this.initialized) {
        return Promise.resolve();
      }

      if (this.initPromise) {
        return this.initPromise;
      }

      // If init hasn't started, trigger it
      return this.init();
    },

    // Reset APP state for testing
    // Clears initialization state but preserves registered modules
    // This allows tests to have clean initialization state without losing module references
    reset: function() {
      console.log('[BOOTSTRAP] Resetting APP state...');
      
      // Reset initialization state
      this.initialized = false;
      this.isInitialized = false;
      this.initPromise = null;
      
      // DON'T clear modules - they're already registered and clearing them
      // would break the app since modules won't auto-re-register without page reload
      
      // Reset placeholder methods to null (they'll be repopulated if needed)
      this.addWindowLine = null;
      this.addPressureLine = null;
      this.recalculate = null;
      this.duplicateWindowLine = null;
      this.duplicatePressureLine = null;
      this.getState = null;
      
      console.log('[BOOTSTRAP] APP state reset complete');
    },

    // Placeholder methods that will be populated by app.js
    addWindowLine: null,
    addPressureLine: null,
    recalculate: null,
    duplicateWindowLine: null,
    duplicatePressureLine: null,
    getState: null,
    isInitialized: false // Legacy compatibility - updated on init
  };

  console.log('[BOOTSTRAP] APP object created ✅');

  // For debugging in console
  if (typeof console !== 'undefined' && console.log) {
    console.log('[BOOTSTRAP] Access via window.APP or just APP');
    console.log('[BOOTSTRAP] Methods: registerModule(), getModule(), init(), waitForInit()');
  }
})();
