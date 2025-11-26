// geolocation-helper.js - Geolocation Helper
// Get user location for job tracking and routing
// Dependencies: Capacitor Core, Capacitor Geolocation Plugin
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[GEOLOCATION-HELPER] Skipped in test mode');
    return;
  }

  // ============================================
  // AVAILABILITY CHECK
  // ============================================

  /**
   * Check if geolocation is available
   * @returns {boolean}
   */
  function isAvailable() {
    return typeof window.Capacitor !== 'undefined' &&
           window.Capacitor.Plugins &&
           window.Capacitor.Plugins.Geolocation;
  }

  // ============================================
  // POSITION RETRIEVAL
  // ============================================

  /**
   * Get current position
   * @param {Object} options - Geolocation options
   * @param {boolean} options.enableHighAccuracy - Use high accuracy (default: true)
   * @param {number} options.timeout - Timeout in ms (default: 10000)
   * @param {number} options.maximumAge - Max cache age in ms (default: 0)
   * @returns {Promise<Object>} Position object
   */
  function getCurrentPosition(options) {
    if (!isAvailable()) {
      console.log('[GEOLOCATION] Not available, using fallback');
      return getFallbackPosition();
    }

    // Default options
    var defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Merge with provided options
    var finalOptions = Object.assign({}, defaultOptions, options || {});

    return window.Capacitor.Plugins.Geolocation.getCurrentPosition(finalOptions)
      .then(function(position) {
        console.log('[GEOLOCATION] Position acquired');

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
      })
      .catch(function(error) {
        console.error('[GEOLOCATION] Get position error:', error);

        // Try fallback
        return getFallbackPosition();
      });
  }

  /**
   * Get fallback position (web API)
   * @returns {Promise<Object>}
   */
  function getFallbackPosition() {
    if (!navigator.geolocation) {
      return Promise.reject(new Error('Geolocation not supported'));
    }

    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
        },
        function(error) {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Watch position (continuous updates)
   * @param {Function} callback - Callback function(position)
   * @param {Object} options - Watch options
   * @returns {string} Watch ID (use to clear watch)
   */
  function watchPosition(callback, options) {
    if (!isAvailable()) {
      console.warn('[GEOLOCATION] Watch not available');
      return null;
    }

    var defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    var finalOptions = Object.assign({}, defaultOptions, options || {});

    return window.Capacitor.Plugins.Geolocation.watchPosition(finalOptions, function(position, err) {
      if (err) {
        console.error('[GEOLOCATION] Watch error:', err);
        return;
      }

      if (callback) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      }
    });
  }

  /**
   * Clear position watch
   * @param {string} watchId - Watch ID from watchPosition
   */
  function clearWatch(watchId) {
    if (!isAvailable() || !watchId) {
      return;
    }

    window.Capacitor.Plugins.Geolocation.clearWatch({ id: watchId });
  }

  // ============================================
  // QUOTE INTEGRATION
  // ============================================

  /**
   * Attach location to quote
   * @param {string} quoteId - Quote ID (optional)
   * @returns {Promise<Object>} Position data
   */
  function attachToQuote(quoteId) {
    return getCurrentPosition()
      .then(function(position) {
        if (!position) {
          throw new Error('Unable to get location');
        }

        // Get quote from storage
        var quote = null;
        if (quoteId) {
          // Load specific quote
          if (window.QuoteManager && window.QuoteManager.getQuote) {
            quote = window.QuoteManager.getQuote(quoteId);
          }
        } else {
          // Get current state
          if (window.APP && window.APP.getState) {
            quote = window.APP.getState();
          }
        }

        if (!quote) {
          console.warn('[GEOLOCATION] Quote not found');
          return position;
        }

        // Add location to quote
        quote.location = {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: new Date().toISOString()
        };

        // Save quote
        if (quoteId && window.QuoteManager && window.QuoteManager.saveQuote) {
          window.QuoteManager.saveQuote(quote);
        } else if (window.APP && window.APP.saveState) {
          window.APP.saveState();
        }

        // Show success message
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Location saved to quote', 'success');
        }

        console.log('[GEOLOCATION] Location attached to quote');
        return position;
      })
      .catch(function(error) {
        console.error('[GEOLOCATION] Attach to quote error:', error);

        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Unable to get location', 'error');
        } else {
          alert('Unable to get location: ' + error.message);
        }

        throw error;
      });
  }

  // ============================================
  // DISTANCE CALCULATION
  // ============================================

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Earth radius in km
    var dLat = toRadians(lat2 - lat1);
    var dLon = toRadians(lon2 - lon1);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number} Radians
   */
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get distance from current position to target
   * @param {number} targetLat - Target latitude
   * @param {number} targetLon - Target longitude
   * @returns {Promise<number>} Distance in km
   */
  function getDistanceFromCurrent(targetLat, targetLon) {
    return getCurrentPosition()
      .then(function(position) {
        return calculateDistance(
          position.latitude,
          position.longitude,
          targetLat,
          targetLon
        );
      });
  }

  // ============================================
  // GEOCODING (Address Conversion)
  // ============================================

  /**
   * Format location as address string
   * Note: This is a placeholder. For full geocoding, integrate with
   * a service like Google Maps Geocoding API or similar
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} Formatted location string
   */
  function formatLocationString(lat, lon) {
    return lat.toFixed(6) + ', ' + lon.toFixed(6);
  }

  /**
   * Get Google Maps URL for location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} Google Maps URL
   */
  function getGoogleMapsURL(lat, lon) {
    return 'https://www.google.com/maps?q=' + lat + ',' + lon;
  }

  /**
   * Open location in maps app
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   */
  function openInMaps(lat, lon) {
    var url = getGoogleMapsURL(lat, lon);

    if (window.NativeFeatures && window.NativeFeatures.openURL) {
      window.NativeFeatures.openURL(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // ============================================
  // PERMISSION HANDLING
  // ============================================

  /**
   * Check location permissions
   * @returns {Promise<string>} Permission status
   */
  function checkPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.Geolocation.checkPermissions()
      .then(function(result) {
        return result.location;
      })
      .catch(function(error) {
        console.error('[GEOLOCATION] Check permissions error:', error);
        return 'denied';
      });
  }

  /**
   * Request location permissions
   * @returns {Promise<string>} Permission status
   */
  function requestPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.Geolocation.requestPermissions()
      .then(function(result) {
        console.log('[GEOLOCATION] Permission result:', result.location);
        return result.location;
      })
      .catch(function(error) {
        console.error('[GEOLOCATION] Request permissions error:', error);
        return 'denied';
      });
  }

  // ============================================
  // UI HELPERS
  // ============================================

  /**
   * Add location button to page
   * @param {string} containerId - Container element ID
   * @param {Function} callback - Callback function(position)
   */
  function addLocationButton(containerId, callback) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn('[GEOLOCATION] Container not found:', containerId);
      return;
    }

    var button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.innerHTML = '📍 Get Location';
    button.setAttribute('aria-label', 'Get current location');

    button.addEventListener('click', function() {
      // Show loading
      button.disabled = true;
      button.innerHTML = '⏳ Getting location...';

      getCurrentPosition()
        .then(function(position) {
          button.disabled = false;
          button.innerHTML = '📍 Get Location';

          if (callback) {
            callback(position);
          }

          if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Location acquired', 'success');
          }
        })
        .catch(function(error) {
          button.disabled = false;
          button.innerHTML = '📍 Get Location';

          console.error('[GEOLOCATION] Button action error:', error);

          if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Failed to get location', 'error');
          }
        });
    });

    container.appendChild(button);
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('geolocationHelper', {
      isAvailable: isAvailable,
      getCurrentPosition: getCurrentPosition,
      watchPosition: watchPosition,
      clearWatch: clearWatch,
      attachToQuote: attachToQuote,
      calculateDistance: calculateDistance,
      checkPermissions: checkPermissions,
      requestPermissions: requestPermissions
    });
  }

  // Global API
  window.GeolocationHelper = {
    isAvailable: isAvailable,
    getCurrentPosition: getCurrentPosition,
    watchPosition: watchPosition,
    clearWatch: clearWatch,
    attachToQuote: attachToQuote,
    calculateDistance: calculateDistance,
    getDistanceFromCurrent: getDistanceFromCurrent,
    formatLocationString: formatLocationString,
    getGoogleMapsURL: getGoogleMapsURL,
    openInMaps: openInMaps,
    checkPermissions: checkPermissions,
    requestPermissions: requestPermissions,
    addLocationButton: addLocationButton
  };

  console.log('[GEOLOCATION-HELPER] Module loaded');
})();
