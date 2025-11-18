// ghl-client.js - GoHighLevel API Client
// Dependencies: ghl-config.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // API Endpoints
  var GHL_ENDPOINTS = {
    // Authentication
    oauth: {
      authorize: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
      token: 'https://services.leadconnectorhq.com/oauth/token'
    },

    // Contacts
    contacts: {
      list: '/contacts/',
      get: '/contacts/{contactId}',
      create: '/contacts/',
      update: '/contacts/{contactId}',
      delete: '/contacts/{contactId}',
      search: '/contacts/search',
      lookup: '/contacts/lookup'
    },

    // Opportunities
    opportunities: {
      list: '/opportunities/',
      get: '/opportunities/{opportunityId}',
      create: '/opportunities/',
      update: '/opportunities/{opportunityId}',
      delete: '/opportunities/{opportunityId}',
      search: '/opportunities/search',
      status: '/opportunities/{opportunityId}/status'
    },

    // Pipelines
    pipelines: {
      list: '/pipelines/',
      get: '/pipelines/{pipelineId}'
    },

    // Tasks
    tasks: {
      list: '/tasks/',
      get: '/tasks/{taskId}',
      create: '/tasks/',
      update: '/tasks/{taskId}',
      delete: '/tasks/{taskId}'
    },

    // Notes
    notes: {
      create: '/contacts/{contactId}/notes',
      list: '/contacts/{contactId}/notes',
      update: '/notes/{noteId}',
      delete: '/notes/{noteId}'
    },

    // Custom Fields
    customFields: {
      list: '/custom-fields/',
      create: '/custom-fields/',
      update: '/custom-fields/{fieldId}',
      delete: '/custom-fields/{fieldId}'
    }
  };

  // Request queue for offline support
  var _requestQueue = [];
  var _isOnline = navigator.onLine;
  var _syncInProgress = false;

  /**
   * Check if API is configured
   */
  function isConfigured() {
    return !!(GHL_CONFIG.accessToken && GHL_CONFIG.locationId);
  }

  /**
   * Check if access token is valid
   */
  function isTokenValid() {
    if (!GHL_CONFIG.accessToken) return false;
    if (!GHL_CONFIG.tokenExpiry) return true; // Assume valid if no expiry

    var now = new Date().getTime();
    var expiry = new Date(GHL_CONFIG.tokenExpiry).getTime();

    // Consider expired if within 5 minutes of expiry
    return expiry > (now + 5 * 60 * 1000);
  }

  /**
   * Refresh access token
   */
  function refreshAccessToken(callback) {
    if (!GHL_CONFIG.refreshToken) {
      console.error('[GHL-CLIENT] No refresh token available');
      if (callback) callback(new Error('No refresh token'));
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', GHL_ENDPOINTS.oauth.token, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var response = JSON.parse(xhr.responseText);

          // Update tokens
          GHL_CONFIG.accessToken = response.access_token;
          GHL_CONFIG.refreshToken = response.refresh_token || GHL_CONFIG.refreshToken;
          GHL_CONFIG.tokenExpiry = new Date(Date.now() + (response.expires_in * 1000)).toISOString();

          window.GHLConfig.save();

          console.log('[GHL-CLIENT] Access token refreshed');
          if (callback) callback(null, response);

        } catch (e) {
          console.error('[GHL-CLIENT] Failed to parse token response:', e);
          if (callback) callback(e);
        }
      } else {
        console.error('[GHL-CLIENT] Token refresh failed:', xhr.status);
        if (callback) callback(new Error('Token refresh failed'));
      }
    };

    xhr.onerror = function() {
      console.error('[GHL-CLIENT] Token refresh request failed');
      if (callback) callback(new Error('Network error'));
    };

    var params = 'grant_type=refresh_token' +
      '&client_id=' + encodeURIComponent(GHL_CONFIG.clientId) +
      '&client_secret=' + encodeURIComponent(GHL_CONFIG.clientSecret) +
      '&refresh_token=' + encodeURIComponent(GHL_CONFIG.refreshToken);

    xhr.send(params);
  }

  /**
   * Check rate limit
   */
  function checkRateLimit() {
    var now = Date.now();

    // Reset counter if past reset time
    if (GHL_CONFIG.rateLimit.resetTime && now > GHL_CONFIG.rateLimit.resetTime) {
      GHL_CONFIG.rateLimit.currentCount = 0;
      GHL_CONFIG.rateLimit.resetTime = now + 60000; // 1 minute from now
    }

    // Initialize reset time if not set
    if (!GHL_CONFIG.rateLimit.resetTime) {
      GHL_CONFIG.rateLimit.resetTime = now + 60000;
    }

    // Check if under limit
    return GHL_CONFIG.rateLimit.currentCount < GHL_CONFIG.rateLimit.maxRequests;
  }

  /**
   * Increment rate limit counter
   */
  function incrementRateLimit() {
    GHL_CONFIG.rateLimit.currentCount++;
  }

  /**
   * Build URL with query params
   */
  function buildUrl(endpoint, params) {
    var url = GHL_CONFIG.apiBaseUrl + endpoint;

    // Add location ID if not in endpoint
    if (endpoint.indexOf('locationId') === -1) {
      var separator = endpoint.indexOf('?') > -1 ? '&' : '?';
      url += separator + 'locationId=' + GHL_CONFIG.locationId;
    }

    // Add additional params
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(function(key) {
        url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      });
    }

    return url;
  }

  /**
   * Replace URL placeholders
   */
  function replacePlaceholders(endpoint, placeholders) {
    var result = endpoint;

    if (placeholders && typeof placeholders === 'object') {
      Object.keys(placeholders).forEach(function(key) {
        var placeholder = '{' + key + '}';
        result = result.replace(placeholder, placeholders[key]);
      });
    }

    return result;
  }

  /**
   * Make API request
   */
  function makeRequest(method, endpoint, data, callback) {
    // Check configuration
    if (!isConfigured()) {
      console.error('[GHL-CLIENT] GHL not configured');
      if (callback) callback(new Error('GHL not configured'));
      return;
    }

    // Check token validity
    if (!isTokenValid()) {
      console.log('[GHL-CLIENT] Token expired, refreshing...');
      refreshAccessToken(function(error) {
        if (error) {
          console.error('[GHL-CLIENT] Token refresh failed:', error);
          if (callback) callback(error);
          return;
        }
        // Retry original request
        makeRequest(method, endpoint, data, callback);
      });
      return;
    }

    // Check online status
    if (!_isOnline && GHL_CONFIG.syncSettings.offlineQueue) {
      console.log('[GHL-CLIENT] Offline - queueing request');
      queueRequest(method, endpoint, data, callback);
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      console.warn('[GHL-CLIENT] Rate limit exceeded, queueing request');
      setTimeout(function() {
        makeRequest(method, endpoint, data, callback);
      }, 1000);
      return;
    }

    // Build URL
    var url = buildUrl(endpoint);

    // Create request
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + GHL_CONFIG.accessToken);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Version', GHL_CONFIG.apiVersion);

    xhr.onload = function() {
      incrementRateLimit();

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (callback) callback(null, response);
        } catch (e) {
          console.error('[GHL-CLIENT] Failed to parse response:', e);
          if (callback) callback(e);
        }
      } else if (xhr.status === 401) {
        // Unauthorized - token invalid
        console.error('[GHL-CLIENT] Unauthorized - token may be invalid');
        refreshAccessToken(function(error) {
          if (!error) {
            // Retry request
            makeRequest(method, endpoint, data, callback);
          } else {
            if (callback) callback(new Error('Authentication failed'));
          }
        });
      } else if (xhr.status === 429) {
        // Rate limited
        console.warn('[GHL-CLIENT] Rate limited by API');
        setTimeout(function() {
          makeRequest(method, endpoint, data, callback);
        }, 60000); // Wait 1 minute
      } else {
        var errorMsg = 'API request failed: ' + xhr.status;
        try {
          var errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.message) {
            errorMsg += ' - ' + errorResponse.message;
          }
        } catch (e) {
          // Ignore parse error
        }
        console.error('[GHL-CLIENT]', errorMsg);
        if (callback) callback(new Error(errorMsg));
      }
    };

    xhr.onerror = function() {
      console.error('[GHL-CLIENT] Network error');
      if (callback) callback(new Error('Network error'));
    };

    // Send request
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  }

  /**
   * Queue request for offline sync
   */
  function queueRequest(method, endpoint, data, callback) {
    var request = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      method: method,
      endpoint: endpoint,
      data: data,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    _requestQueue.push(request);
    saveRequestQueue();

    console.log('[GHL-CLIENT] Request queued:', request.id);

    // Note: callback is not saved (can't serialize functions)
    // Queued requests won't trigger callbacks
  }

  /**
   * Save request queue to localStorage
   */
  function saveRequestQueue() {
    try {
      // Remove callbacks before saving (can't serialize functions)
      var queueToSave = _requestQueue.map(function(req) {
        return {
          id: req.id,
          method: req.method,
          endpoint: req.endpoint,
          data: req.data,
          timestamp: req.timestamp,
          retries: req.retries
        };
      });

      localStorage.setItem('tts_ghl_queue', JSON.stringify(queueToSave));
    } catch (e) {
      console.error('[GHL-CLIENT] Failed to save request queue:', e);
    }
  }

  /**
   * Load request queue from localStorage
   */
  function loadRequestQueue() {
    try {
      var saved = localStorage.getItem('tts_ghl_queue');
      if (saved) {
        _requestQueue = JSON.parse(saved);
        console.log('[GHL-CLIENT] Loaded', _requestQueue.length, 'queued requests');
      }
    } catch (e) {
      console.error('[GHL-CLIENT] Failed to load request queue:', e);
    }
  }

  /**
   * Process queued requests
   */
  function processQueue(callback) {
    if (_syncInProgress || !_isOnline || _requestQueue.length === 0) {
      if (callback) callback(null, { processed: 0, failed: 0 });
      return;
    }

    _syncInProgress = true;
    console.log('[GHL-CLIENT] Processing', _requestQueue.length, 'queued requests...');

    var processed = 0;
    var failed = 0;

    function processNext() {
      if (_requestQueue.length === 0) {
        _syncInProgress = false;
        console.log('[GHL-CLIENT] Queue processed:', processed, 'succeeded,', failed, 'failed');
        saveRequestQueue();
        if (callback) callback(null, { processed: processed, failed: failed });
        return;
      }

      var request = _requestQueue.shift();

      makeRequest(request.method, request.endpoint, request.data, function(error, response) {
        if (error) {
          failed++;
          request.retries++;

          // Retry up to 3 times
          if (request.retries < 3) {
            console.log('[GHL-CLIENT] Request failed, requeueing:', request.id);
            _requestQueue.push(request);
          } else {
            console.error('[GHL-CLIENT] Request failed permanently:', request.id);
          }
        } else {
          processed++;
          console.log('[GHL-CLIENT] Request processed:', request.id);
        }

        // Process next after short delay
        setTimeout(processNext, 500);
      });
    }

    processNext();
  }

  /**
   * Clear request queue
   */
  function clearQueue() {
    _requestQueue = [];
    saveRequestQueue();
    console.log('[GHL-CLIENT] Queue cleared');
  }

  /**
   * Get queue length
   */
  function getQueueLength() {
    return _requestQueue.length;
  }

  /**
   * Handle online/offline events
   */
  window.addEventListener('online', function() {
    console.log('[GHL-CLIENT] Back online');
    _isOnline = true;
    if (GHL_CONFIG.syncSettings.autoSync) {
      processQueue();
    }
  });

  window.addEventListener('offline', function() {
    console.log('[GHL-CLIENT] Gone offline');
    _isOnline = false;
  });

  /**
   * Auto-sync on interval
   */
  if (GHL_CONFIG.syncSettings.autoSync) {
    setInterval(function() {
      if (_isOnline && !_syncInProgress && _requestQueue.length > 0) {
        processQueue();
      }
    }, GHL_CONFIG.syncSettings.syncInterval);
  }

  // Load queue on startup
  loadRequestQueue();

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlClient', {
      isConfigured: isConfigured,
      isTokenValid: isTokenValid,
      refreshAccessToken: refreshAccessToken,
      makeRequest: makeRequest,
      processQueue: processQueue,
      clearQueue: clearQueue,
      getQueueLength: getQueueLength,
      endpoints: GHL_ENDPOINTS
    });
  }

  // Make globally available
  window.GHLClient = {
    isConfigured: isConfigured,
    isTokenValid: isTokenValid,
    refreshAccessToken: refreshAccessToken,
    makeRequest: makeRequest,
    processQueue: processQueue,
    clearQueue: clearQueue,
    getQueueLength: getQueueLength,
    endpoints: GHL_ENDPOINTS
  };

  console.log('[GHL-CLIENT] Initialized');
})();
