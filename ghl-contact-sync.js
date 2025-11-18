// ghl-contact-sync.js - GoHighLevel Contact Sync Module
// Dependencies: ghl-config.js, ghl-client.js, client-database.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Map TicTacStick client to GHL contact format
   */
  function mapClientToContact(client) {
    var contact = {
      locationId: GHL_CONFIG.locationId,
      firstName: '',
      lastName: '',
      email: client.email || '',
      phone: client.phone || '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Australia',
      source: 'TicTacStick',
      tags: ['tictacstick']
    };

    // Parse name
    if (client.name) {
      var nameParts = client.name.trim().split(/\s+/);
      contact.firstName = nameParts[0] || '';
      contact.lastName = nameParts.slice(1).join(' ') || '';
    }

    // Parse address
    if (client.location) {
      // location is the address string in TicTacStick
      contact.address1 = client.location;

      // Try to parse city/state from address
      var parts = client.location.split(',');
      if (parts.length >= 2) {
        contact.city = parts[parts.length - 2].trim();
        contact.state = parts[parts.length - 1].trim();
      }
    }

    // Add service-specific tags
    if (client.serviceHistory && client.serviceHistory.length > 0) {
      var hasWindows = false;
      var hasPressure = false;

      client.serviceHistory.forEach(function(service) {
        if (service.type === 'window-cleaning') hasWindows = true;
        if (service.type === 'pressure-washing') hasPressure = true;
      });

      if (hasWindows) contact.tags.push('window-cleaning');
      if (hasPressure) contact.tags.push('pressure-washing');
    }

    // Add client type tag
    if (client.clientType) {
      var typeTag = client.clientType === 'residential' ? 'residential' : 'commercial';
      contact.tags.push(typeTag);
    }

    // Custom fields
    contact.customField = {};

    if (client.clientType) {
      contact.customField[GHL_CONFIG.customFields.clientType] = client.clientType;
    }

    if (client.source) {
      contact.customField[GHL_CONFIG.customFields.clientSource] = client.source;
    }

    if (client.lastJobDate) {
      contact.customField[GHL_CONFIG.customFields.lastJobDate] = client.lastJobDate;
    }

    if (client.totalRevenue) {
      contact.customField[GHL_CONFIG.customFields.totalRevenue] = client.totalRevenue.toString();
    }

    return contact;
  }

  /**
   * Map GHL contact to TicTacStick client format
   */
  function mapContactToClient(contact) {
    var client = {
      id: contact.id || ('ghl_' + Date.now()),
      ghlId: contact.id,
      name: '',
      email: contact.email || '',
      phone: contact.phone || '',
      location: '',
      clientType: 'residential',
      source: 'gohighlevel',
      notes: '',
      dateAdded: contact.dateAdded || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      serviceHistory: [],
      totalRevenue: 0
    };

    // Build name
    var nameParts = [];
    if (contact.firstName) nameParts.push(contact.firstName);
    if (contact.lastName) nameParts.push(contact.lastName);
    client.name = nameParts.join(' ') || 'Unknown';

    // Build location
    var locationParts = [];
    if (contact.address1) locationParts.push(contact.address1);
    if (contact.city) locationParts.push(contact.city);
    if (contact.state) locationParts.push(contact.state);
    if (contact.postalCode) locationParts.push(contact.postalCode);
    client.location = locationParts.join(', ');

    // Extract custom fields
    if (contact.customField) {
      var clientTypeField = GHL_CONFIG.customFields.clientType;
      var clientSourceField = GHL_CONFIG.customFields.clientSource;
      var lastJobDateField = GHL_CONFIG.customFields.lastJobDate;
      var totalRevenueField = GHL_CONFIG.customFields.totalRevenue;

      if (contact.customField[clientTypeField]) {
        client.clientType = contact.customField[clientTypeField];
      }

      if (contact.customField[clientSourceField]) {
        client.source = contact.customField[clientSourceField];
      }

      if (contact.customField[lastJobDateField]) {
        client.lastJobDate = contact.customField[lastJobDateField];
      }

      if (contact.customField[totalRevenueField]) {
        client.totalRevenue = parseFloat(contact.customField[totalRevenueField]) || 0;
      }
    }

    // Extract tags
    if (contact.tags && contact.tags.length > 0) {
      if (contact.tags.indexOf('commercial') > -1) {
        client.clientType = 'commercial';
      }
    }

    return client;
  }

  /**
   * Create contact in GHL
   */
  function createContact(client, callback) {
    if (!GHL_CONFIG.features.contactSync) {
      if (callback) callback(new Error('Contact sync disabled'));
      return;
    }

    var contactData = mapClientToContact(client);

    window.GHLClient.makeRequest('POST', '/contacts/', contactData, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to create contact:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-CONTACT-SYNC] Contact created:', response.contact.id);

      // Store GHL ID with client
      client.ghlId = response.contact.id;
      client.lastSync = new Date().toISOString();

      // Update client in storage
      if (window.ClientDatabase && window.ClientDatabase.updateClient) {
        window.ClientDatabase.updateClient(client);
      }

      if (callback) callback(null, response.contact);
    });
  }

  /**
   * Update contact in GHL
   */
  function updateContact(client, callback) {
    if (!client.ghlId) {
      console.error('[GHL-CONTACT-SYNC] Client has no GHL ID');
      if (callback) callback(new Error('No GHL ID'));
      return;
    }

    var contactData = mapClientToContact(client);
    var endpoint = '/contacts/' + client.ghlId;

    window.GHLClient.makeRequest('PUT', endpoint, contactData, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to update contact:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-CONTACT-SYNC] Contact updated:', client.ghlId);

      client.lastSync = new Date().toISOString();

      // Update client in storage
      if (window.ClientDatabase && window.ClientDatabase.updateClient) {
        window.ClientDatabase.updateClient(client);
      }

      if (callback) callback(null, response.contact);
    });
  }

  /**
   * Get contact from GHL
   */
  function getContact(ghlId, callback) {
    var endpoint = '/contacts/' + ghlId;

    window.GHLClient.makeRequest('GET', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to get contact:', error);
        if (callback) callback(error);
        return;
      }

      var client = mapContactToClient(response.contact);

      if (callback) callback(null, client);
    });
  }

  /**
   * Search contacts in GHL
   */
  function searchContacts(query, callback) {
    var endpoint = '/contacts/?query=' + encodeURIComponent(query);

    window.GHLClient.makeRequest('GET', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to search contacts:', error);
        if (callback) callback(error);
        return;
      }

      var clients = [];
      if (response.contacts && response.contacts.length > 0) {
        clients = response.contacts.map(mapContactToClient);
      }

      if (callback) callback(null, clients);
    });
  }

  /**
   * Delete contact from GHL
   */
  function deleteContact(client, callback) {
    if (!client.ghlId) {
      if (callback) callback(new Error('No GHL ID'));
      return;
    }

    var endpoint = '/contacts/' + client.ghlId;

    window.GHLClient.makeRequest('DELETE', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to delete contact:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-CONTACT-SYNC] Contact deleted:', client.ghlId);

      // Remove GHL ID from client
      client.ghlId = null;
      client.lastSync = new Date().toISOString();

      if (callback) callback(null, response);
    });
  }

  /**
   * Sync client with GHL
   * Creates if doesn't exist, updates if exists
   */
  function syncClient(client, callback) {
    if (!window.GHLClient.isConfigured()) {
      if (callback) callback(new Error('GHL not configured'));
      return;
    }

    if (client.ghlId) {
      // Update existing
      updateContact(client, callback);
    } else {
      // Search for existing by email or phone
      var searchQuery = client.email || client.phone;

      if (searchQuery) {
        searchContacts(searchQuery, function(error, contacts) {
          if (!error && contacts && contacts.length > 0) {
            // Found existing contact - use first match
            console.log('[GHL-CONTACT-SYNC] Found existing contact, updating...');
            client.ghlId = contacts[0].ghlId;
            updateContact(client, callback);
          } else {
            // Create new contact
            createContact(client, callback);
          }
        });
      } else {
        // No email or phone, just create
        createContact(client, callback);
      }
    }
  }

  /**
   * Sync all clients
   */
  function syncAllClients(callback) {
    if (!window.ClientDatabase || !window.ClientDatabase.getAllClients) {
      if (callback) callback(new Error('ClientDatabase not available'));
      return;
    }

    var clients = window.ClientDatabase.getAllClients();
    var synced = 0;
    var failed = 0;
    var total = clients.length;

    console.log('[GHL-CONTACT-SYNC] Syncing', total, 'clients to GHL...');

    if (total === 0) {
      if (callback) callback(null, { synced: 0, failed: 0, total: 0 });
      return;
    }

    function syncNext(index) {
      if (index >= total) {
        console.log('[GHL-CONTACT-SYNC] Sync complete:', synced, 'synced,', failed, 'failed');
        window.GHLConfig.updateLastSync('contacts');
        if (callback) callback(null, { synced: synced, failed: failed, total: total });
        return;
      }

      var client = clients[index];

      syncClient(client, function(error) {
        if (error) {
          failed++;
          console.error('[GHL-CONTACT-SYNC] Failed to sync client:', client.name);
        } else {
          synced++;
        }

        // Continue with next (rate limiting delay)
        setTimeout(function() {
          syncNext(index + 1);
        }, 500);
      });
    }

    syncNext(0);
  }

  /**
   * Add note to contact
   */
  function addNote(client, noteText, callback) {
    if (!client.ghlId) {
      if (callback) callback(new Error('No GHL ID'));
      return;
    }

    var endpoint = '/contacts/' + client.ghlId + '/notes';
    var noteData = {
      body: noteText,
      userId: GHL_CONFIG.userId || null
    };

    window.GHLClient.makeRequest('POST', endpoint, noteData, function(error, response) {
      if (error) {
        console.error('[GHL-CONTACT-SYNC] Failed to add note:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-CONTACT-SYNC] Note added to contact');
      if (callback) callback(null, response);
    });
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlContactSync', {
      createContact: createContact,
      updateContact: updateContact,
      getContact: getContact,
      searchContacts: searchContacts,
      deleteContact: deleteContact,
      syncClient: syncClient,
      syncAllClients: syncAllClients,
      addNote: addNote
    });
  }

  // Make globally available
  window.GHLContactSync = {
    createContact: createContact,
    updateContact: updateContact,
    getContact: getContact,
    searchContacts: searchContacts,
    deleteContact: deleteContact,
    syncClient: syncClient,
    syncAllClients: syncAllClients,
    addNote: addNote
  };

  console.log('[GHL-CONTACT-SYNC] Initialized');
})();
