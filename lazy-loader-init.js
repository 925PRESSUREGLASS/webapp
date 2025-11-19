// lazy-loader-init.js - Initialize lazy loading event handlers
// Wires up UI buttons to load modules on demand
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Wait for DOM to be ready
  function init() {
    console.log('[LAZY-INIT] Initializing lazy loading handlers...');

    // ============================================
    // ANALYTICS MODULE
    // ============================================
    // NOTE: Analytics is no longer lazy-loaded - it loads immediately via <script> tag
    // This is needed for core functionality and tests

    var viewAnalyticsBtn = document.getElementById('viewAnalyticsBtn');
    if (viewAnalyticsBtn) {
      viewAnalyticsBtn.addEventListener('click', function() {
        if (window.QuoteAnalytics && window.QuoteAnalytics.renderDashboard) {
          window.QuoteAnalytics.renderDashboard('all');
        } else {
          console.error('[LAZY-INIT] QuoteAnalytics not available');
          if (window.showToast) {
            window.showToast('Analytics module not loaded', 'error');
          }
        }
      });
    }

    var exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener('click', function() {
        if (window.QuoteAnalytics && window.QuoteAnalytics.exportHistory) {
          window.QuoteAnalytics.exportHistory();
        } else {
          console.error('[LAZY-INIT] QuoteAnalytics not available');
          if (window.showToast) {
            window.showToast('Analytics module not loaded', 'error');
          }
        }
      });
    }

    // ============================================
    // CHARTS MODULE
    // ============================================

    // Charts need Chart.js library + charts module
    function loadCharts(callback) {
      if (window.LazyLoader) {
        // Load Chart.js library first
        window.LazyLoader.loadLibrary('chartjs', function(error) {
          if (error) {
            console.error('[LAZY-INIT] Failed to load Chart.js:', error);
            if (window.showToast) {
              window.showToast('Failed to load charts library', 'error');
            }
            callback(error);
            return;
          }

          // Then load charts module
          window.LazyLoader.load('charts', function(error) {
            if (error) {
              console.error('[LAZY-INIT] Failed to load charts module:', error);
              if (window.showToast) {
                window.showToast('Failed to load charts module', 'error');
              }
            }
            callback(error);
          });
        });
      } else {
        callback(null);
      }
    }

    // ============================================
    // PRELOADING STRATEGY
    // ============================================

    // NOTE: Aggressive preloading disabled to avoid initialization issues
    // Modules will be loaded on-demand when actually needed
    // This prevents dependencies and DOM-readiness issues

    // Future: could re-enable preloading with proper dependency checking
    console.log('[LAZY-INIT] Lazy loading configured - modules load on-demand only');

    // ============================================
    // PHOTO MODAL MODULE
    // ============================================

    // Photo modal will be loaded when first photo is clicked
    // Hook into photos.js if it exists
    if (window.Photos) {
      var originalOpenPhoto = window.Photos.openPhoto;
      if (originalOpenPhoto) {
        window.Photos.openPhoto = function(photoId) {
          if (window.LazyLoader && !window.LazyLoader.isLoaded('photo-modal')) {
            window.LazyLoader.load('photo-modal', function(error) {
              if (error) {
                console.error('[LAZY-INIT] Failed to load photo modal:', error);
                return;
              }
              originalOpenPhoto.call(window.Photos, photoId);
            });
          } else {
            originalOpenPhoto.call(window.Photos, photoId);
          }
        };
      }
    }

    console.log('[LAZY-INIT] Lazy loading handlers initialized');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
