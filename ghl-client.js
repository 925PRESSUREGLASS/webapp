// ghl-client.js - GoHighLevel API Client
// Dependencies: None (standalone API client)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // GHL API Configuration
  var GHL_CONFIG = {
    apiKey: '',
    locationId: '',
    baseUrl: 'https://rest.gohighlevel.com/v1',
    version: 'v1',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    features: {
      taskSync: false,
      opportunitySync: false,
      contactSync: false
    }
  };

  /**
   * Load configuration from localStorage
   */
  function loadConfig() {
    try {
      var saved = localStorage.getItem('ghl_config');
      if (saved) {
        var config = JSON.parse(saved);
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            if (typeof config[key] === 'object' && !Array.isArray(config[key])) {
              // Merge nested objects
              if (!GHL_CONFIG[key]) {
                GHL_CONFIG[key] = {};
              }
              for (var subkey in config[key]) {
                if (config[key].hasOwnProperty(subkey)) {
                  GHL_CONFIG[key][subkey] = config[key][subkey];
                }
              }
            } else {
              GHL_CONFIG[key] = config[key];
            }
          }
        }
        console.log('[GHL-CLIENT] Configuration loaded');
      }
    } catch (e) {
      console.error('[GHL-CLIENT] Failed to load config:', e);
    }
  }

  /**
   * Save configuration to localStorage
   */
  function saveConfig() {
    try {
      localStorage.setItem('ghl_config', JSON.stringify(GHL_CONFIG));
      console.log('[GHL-CLIENT] Configuration saved');
    } catch (e) {
      console.error('[GHL-CLIENT] Failed to save config:', e);
    }
  }

  /**
   * Update configuration
   */
  function updateConfig(updates) {
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          // Merge nested objects
          if (!GHL_CONFIG[key]) {
            GHL_CONFIG[key] = {};
          }
          for (var subkey in updates[key]) {
            if (updates[key].hasOwnProperty(subkey)) {
              GHL_CONFIG[key][subkey] = updates[key][subkey];
            }
          }
        } else {
          GHL_CONFIG[key] = updates[key];
        }
      }
    }
    saveConfig();
  }

  /**
   * Get current configuration
   */
  function getConfig() {
    return GHL_CONFIG;
  }

  /**
   * Check if GHL is configured
   */
  function isConfigured() {
    return !!(GHL_CONFIG.apiKey && GHL_CONFIG.locationId);
  }

  /**
   * Make API request to GHL
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint (e.g., '/contacts/', '/opportunities/')
   * @param {object} data - Request payload
   * @param {function} callback - Callback function(error, response)
   */
  function makeRequest(method, endpoint, data, callback) {
    if (!isConfigured()) {
      var error = new Error('GHL not configured. Please set API key and location ID.');
      console.error('[GHL-CLIENT]', error.message);
      if (callback) callback(error);
      return;
    }

    var url = GHL_CONFIG.baseUrl + endpoint;

    // Add location ID to query params for certain endpoints
    if (endpoint.indexOf('?') === -1 && (method === 'GET' || method === 'POST')) {
      url += '?locationId=' + encodeURIComponent(GHL_CONFIG.locationId);
    }

    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    // Set headers
    xhr.setRequestHeader('Authorization', 'Bearer ' + GHL_CONFIG.apiKey);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    // Set timeout
    xhr.timeout = GHL_CONFIG.timeout;

    // Handle response
    xhr.onload = function() {
      try {
        var response = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('[GHL-CLIENT] Request successful:', method, endpoint);
          if (callback) callback(null, response);
        } else {
          var error = new Error('GHL API error: ' + xhr.status + ' ' + (response.message || xhr.statusText));
          console.error('[GHL-CLIENT] Request failed:', error);
          if (callback) callback(error, response);
        }
      } catch (e) {
        console.error('[GHL-CLIENT] Failed to parse response:', e);
        if (callback) callback(e);
      }
    };

    // Handle errors
    xhr.onerror = function() {
      var error = new Error('Network error - failed to connect to GHL API');
      console.error('[GHL-CLIENT]', error.message);
      if (callback) callback(error);
    };

    xhr.ontimeout = function() {
      var error = new Error('Request timeout after ' + GHL_CONFIG.timeout + 'ms');
      console.error('[GHL-CLIENT]', error.message);
      if (callback) callback(error);
    };

    // Send request
    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  }

  /**
   * Make request with retry logic
   */
  function makeRequestWithRetry(method, endpoint, data, callback, attemptNumber) {
    attemptNumber = attemptNumber || 0;

    makeRequest(method, endpoint, data, function(error, response) {
      if (error && attemptNumber < GHL_CONFIG.retryAttempts) {
        console.log('[GHL-CLIENT] Retry attempt ' + (attemptNumber + 1) + '/' + GHL_CONFIG.retryAttempts);

        setTimeout(function() {
          makeRequestWithRetry(method, endpoint, data, callback, attemptNumber + 1);
        }, GHL_CONFIG.retryDelay * Math.pow(2, attemptNumber)); // Exponential backoff
      } else {
        if (callback) callback(error, response);
      }
    });
  }

  /**
   * Test API connection
   */
  function testConnection(callback) {
    console.log('[GHL-CLIENT] Testing connection...');

    makeRequest('GET', '/locations/' + GHL_CONFIG.locationId, null, function(error, response) {
      if (error) {
        console.error('[GHL-CLIENT] Connection test failed:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-CLIENT] Connection test successful');
      if (callback) callback(null, {
        success: true,
        location: response.location
      });
    });
  }

  // ============================================
  // CONTACT API METHODS
  // ============================================

  /**
   * Create contact
   */
  function createContact(contactData, callback) {
    var payload = {
      locationId: GHL_CONFIG.locationId,
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      name: contactData.name || (contactData.firstName + ' ' + contactData.lastName),
      email: contactData.email || '',
      phone: contactData.phone || '',
      address1: contactData.address || '',
      city: contactData.city || '',
      state: contactData.state || '',
      postalCode: contactData.postalCode || '',
      country: contactData.country || 'AU',
      source: contactData.source || 'TicTacStick',
      tags: contactData.tags || []
    };

    makeRequestWithRetry('POST', '/contacts/', payload, callback);
  }

  /**
   * Update contact
   */
  function updateContact(contactId, contactData, callback) {
    var endpoint = '/contacts/' + contactId;
    makeRequestWithRetry('PUT', endpoint, contactData, callback);
  }

  /**
   * Get contact by ID
   */
  function getContact(contactId, callback) {
    var endpoint = '/contacts/' + contactId;
    makeRequest('GET', endpoint, null, callback);
  }

  /**
   * Search contacts
   */
  function searchContacts(query, callback) {
    var endpoint = '/contacts/search?locationId=' + GHL_CONFIG.locationId + '&query=' + encodeURIComponent(query);
    makeRequest('GET', endpoint, null, callback);
  }

  // ============================================
  // OPPORTUNITY API METHODS
  // ============================================

  /**
   * Create opportunity
   */
  function createOpportunity(opportunityData, callback) {
    var payload = {
      locationId: GHL_CONFIG.locationId,
      name: opportunityData.name,
      pipelineId: opportunityData.pipelineId,
      pipelineStageId: opportunityData.pipelineStageId,
      status: opportunityData.status || 'open',
      contactId: opportunityData.contactId,
      monetaryValue: opportunityData.monetaryValue || 0,
      assignedTo: opportunityData.assignedTo || null,
      notes: opportunityData.notes || '',
      source: opportunityData.source || 'TicTacStick'
    };

    // Add custom fields if provided
    if (opportunityData.customFields) {
      payload.customFields = opportunityData.customFields;
    }

    makeRequestWithRetry('POST', '/opportunities/', payload, callback);
  }

  /**
   * Update opportunity
   */
  function updateOpportunity(opportunityId, updates, callback) {
    var endpoint = '/opportunities/' + opportunityId;
    makeRequestWithRetry('PUT', endpoint, updates, callback);
  }

  /**
   * Get opportunity by ID
   */
  function getOpportunity(opportunityId, callback) {
    var endpoint = '/opportunities/' + opportunityId;
    makeRequest('GET', endpoint, null, callback);
  }

  /**
   * Delete opportunity
   */
  function deleteOpportunity(opportunityId, callback) {
    var endpoint = '/opportunities/' + opportunityId;
    makeRequest('DELETE', endpoint, null, callback);
  }

  /**
   * Update opportunity status
   */
  function updateOpportunityStatus(opportunityId, status, callback) {
    updateOpportunity(opportunityId, { status: status }, callback);
  }

  // ============================================
  // PIPELINE API METHODS
  // ============================================

  /**
   * Get pipelines for location
   */
  function getPipelines(callback) {
    var endpoint = '/pipelines/?locationId=' + GHL_CONFIG.locationId;
    makeRequest('GET', endpoint, null, callback);
  }

  /**
   * Get pipeline stages
   */
  function getPipelineStages(pipelineId, callback) {
    var endpoint = '/pipelines/' + pipelineId + '/stages';
    makeRequest('GET', endpoint, null, callback);
  }

  // ============================================
  // TASK API METHODS
  // ============================================

  /**
   * Create task
   */
  function createTask(taskData, callback) {
    var payload = {
      locationId: GHL_CONFIG.locationId,
      title: taskData.title,
      body: taskData.body || '',
      contactId: taskData.contactId,
      dueDate: taskData.dueDate || null,
      completed: taskData.completed || false,
      assignedTo: taskData.assignedTo || null
    };

    makeRequestWithRetry('POST', '/tasks/', payload, callback);
  }

  /**
   * Update task
   */
  function updateTask(taskId, updates, callback) {
    var endpoint = '/tasks/' + taskId;
    makeRequestWithRetry('PUT', endpoint, updates, callback);
  }

  /**
   * Get task by ID
   */
  function getTask(taskId, callback) {
    var endpoint = '/tasks/' + taskId;
    makeRequest('GET', endpoint, null, callback);
  }

  /**
   * Delete task
   */
  function deleteTask(taskId, callback) {
    var endpoint = '/tasks/' + taskId;
    makeRequest('DELETE', endpoint, null, callback);
  }

  // ============================================
  // NOTE API METHODS
  // ============================================

  /**
   * Create note
   */
  function createNote(noteData, callback) {
    var payload = {
      contactId: noteData.contactId,
      body: noteData.body,
      userId: noteData.userId || null
    };

    makeRequestWithRetry('POST', '/notes/', payload, callback);
  }

  // ============================================
  // CUSTOM FIELD API METHODS
  // ============================================

  /**
   * Get custom fields for opportunities
   */
  function getOpportunityCustomFields(callback) {
    var endpoint = '/custom-fields/?model=opportunity&locationId=' + GHL_CONFIG.locationId;
    makeRequest('GET', endpoint, null, callback);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  var GHLClient = {
    // Configuration
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    updateConfig: updateConfig,
    getConfig: getConfig,
    isConfigured: isConfigured,
    testConnection: testConnection,

    // Core request method
    makeRequest: makeRequest,
    makeRequestWithRetry: makeRequestWithRetry,

    // Contact methods
    createContact: createContact,
    updateContact: updateContact,
    getContact: getContact,
    searchContacts: searchContacts,

    // Opportunity methods
    createOpportunity: createOpportunity,
    updateOpportunity: updateOpportunity,
    getOpportunity: getOpportunity,
    deleteOpportunity: deleteOpportunity,
    updateOpportunityStatus: updateOpportunityStatus,

    // Pipeline methods
    getPipelines: getPipelines,
    getPipelineStages: getPipelineStages,

    // Task methods
    createTask: createTask,
    updateTask: updateTask,
    getTask: getTask,
    deleteTask: deleteTask,

    // Note methods
    createNote: createNote,

    // Custom field methods
    getOpportunityCustomFields: getOpportunityCustomFields
  };

  // Make globally available
  window.GHLClient = GHLClient;

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlClient', GHLClient);
  }

  // Auto-load config on initialization
  loadConfig();

  console.log('[GHL-CLIENT] Module loaded');
})();
