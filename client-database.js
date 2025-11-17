// client-database.js - Client registry and management system
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var CLIENTS_KEY = 'client-database';
  var clients = [];

  // Load clients from storage
  function loadClients() {
    try {
      clients = window.Security.safeJSONParse(
        localStorage.getItem(CLIENTS_KEY),
        null,
        []
      );
      return clients;
    } catch (e) {
      console.error('Failed to load clients:', e);
      return [];
    }
  }

  // Save clients to storage
  function saveClients() {
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      return true;
    } catch (e) {
      console.error('Failed to save clients:', e);
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Failed to save client data');
      }
      return false;
    }
  }

  // Add or update client
  function saveClient(clientData) {
    if (!clientData.name || clientData.name.trim() === '') {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Client name is required');
      }
      return null;
    }

    var client = {
      id: clientData.id || 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: clientData.name.trim(),
      email: clientData.email || '',
      phone: clientData.phone || '',
      address: clientData.address || '',
      location: clientData.location || '',
      notes: clientData.notes || '',
      createdAt: clientData.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    // Check if client exists
    var existingIndex = -1;
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id === client.id) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex >= 0) {
      // Update existing
      clients[existingIndex] = client;
    } else {
      // Add new
      clients.push(client);
    }

    saveClients();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess(existingIndex >= 0 ? 'Client updated' : 'Client added');
    }

    return client;
  }

  // Delete client
  function deleteClient(clientId) {
    var clientIndex = -1;
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id === clientId) {
        clientIndex = i;
        break;
      }
    }

    if (clientIndex === -1) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Client not found');
      }
      return false;
    }

    var clientName = clients[clientIndex].name;

    if (confirm('Delete client "' + clientName + '"? This will not delete their quotes.')) {
      clients.splice(clientIndex, 1);
      saveClients();

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Client deleted');
      }

      return true;
    }

    return false;
  }

  // Get client by ID
  function getClient(clientId) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id === clientId) {
        return clients[i];
      }
    }
    return null;
  }

  // Get client by name (case-insensitive)
  function getClientByName(name) {
    if (!name) return null;

    var searchName = name.toLowerCase().trim();
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].name.toLowerCase() === searchName) {
        return clients[i];
      }
    }
    return null;
  }

  // Search clients
  function searchClients(query) {
    if (!query || query.trim() === '') {
      return clients.slice(0);
    }

    var searchQuery = query.toLowerCase().trim();
    var results = [];

    for (var i = 0; i < clients.length; i++) {
      var client = clients[i];
      if (
        client.name.toLowerCase().indexOf(searchQuery) !== -1 ||
        client.email.toLowerCase().indexOf(searchQuery) !== -1 ||
        client.phone.indexOf(searchQuery) !== -1 ||
        client.location.toLowerCase().indexOf(searchQuery) !== -1
      ) {
        results.push(client);
      }
    }

    return results;
  }

  // Get all clients
  function getAllClients() {
    return clients.slice(0).sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  // Get client statistics
  function getClientStats(clientId) {
    if (!window.QuoteAnalytics) {
      return null;
    }

    var history = window.QuoteAnalytics.getHistory();
    var clientQuotes = [];

    for (var i = 0; i < history.length; i++) {
      if (history[i].clientName === getClient(clientId).name) {
        clientQuotes.push(history[i]);
      }
    }

    if (clientQuotes.length === 0) {
      return {
        quoteCount: 0,
        totalRevenue: 0,
        averageQuote: 0,
        firstQuote: null,
        lastQuote: null
      };
    }

    var totalRevenue = 0;
    for (var j = 0; j < clientQuotes.length; j++) {
      totalRevenue += clientQuotes[j].total || 0;
    }

    return {
      quoteCount: clientQuotes.length,
      totalRevenue: totalRevenue,
      averageQuote: totalRevenue / clientQuotes.length,
      firstQuote: new Date(clientQuotes[clientQuotes.length - 1].timestamp),
      lastQuote: new Date(clientQuotes[0].timestamp)
    };
  }

  // Render client list modal
  function showClientList() {
    var modal = createClientListModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
    renderClientList();
  }

  // Create client list modal
  function createClientListModal() {
    var existing = document.getElementById('clientListModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'clientListModal';
    modal.className = 'client-modal';
    modal.innerHTML =
      '<div class="client-modal-content">' +
        '<div class="client-modal-header">' +
          '<h2>Client Database</h2>' +
          '<button type="button" class="client-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="client-modal-body">' +
          '<div class="client-search-bar">' +
            '<input type="text" id="clientSearchInput" placeholder="Search clients..." />' +
            '<button type="button" class="btn btn-primary" id="addClientBtn">+ Add Client</button>' +
          '</div>' +
          '<div id="clientListContainer"></div>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.client-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    var searchInput = modal.querySelector('#clientSearchInput');
    searchInput.oninput = function() {
      renderClientList(searchInput.value);
    };

    modal.querySelector('#addClientBtn').onclick = function() {
      showClientForm(null);
    };

    return modal;
  }

  // Render client list
  function renderClientList(searchQuery) {
    var container = document.getElementById('clientListContainer');
    if (!container) return;

    var clientsToShow = searchQuery ? searchClients(searchQuery) : getAllClients();

    if (clientsToShow.length === 0) {
      container.innerHTML = '<p class="client-list-empty">No clients found. Add your first client!</p>';
      return;
    }

    var html = '<div class="client-list">';

    clientsToShow.forEach(function(client) {
      var stats = getClientStats(client.id);

      html += '<div class="client-card" data-client-id="' + client.id + '">';
      html += '<div class="client-card-header">';
      html += '<h3>' + escapeHtml(client.name) + '</h3>';
      html += '<div class="client-card-actions">';
      html += '<button type="button" class="btn-icon" onclick="window.ClientDatabase.selectClient(\'' + client.id + '\')" title="Use Client">✓</button>';
      html += '<button type="button" class="btn-icon" onclick="window.ClientDatabase.editClient(\'' + client.id + '\')" title="Edit">✎</button>';
      html += '<button type="button" class="btn-icon btn-danger" onclick="window.ClientDatabase.deleteClient(\'' + client.id + '\')" title="Delete">×</button>';
      html += '</div>';
      html += '</div>';

      html += '<div class="client-card-info">';
      if (client.email) {
        html += '<div class="client-info-row"><span class="client-info-label">Email:</span> ' + escapeHtml(client.email) + '</div>';
      }
      if (client.phone) {
        html += '<div class="client-info-row"><span class="client-info-label">Phone:</span> ' + escapeHtml(client.phone) + '</div>';
      }
      if (client.location) {
        html += '<div class="client-info-row"><span class="client-info-label">Location:</span> ' + escapeHtml(client.location) + '</div>';
      }
      html += '</div>';

      if (stats && stats.quoteCount > 0) {
        html += '<div class="client-card-stats">';
        html += '<div class="client-stat"><span>' + stats.quoteCount + '</span> quotes</div>';
        html += '<div class="client-stat"><span>$' + stats.totalRevenue.toFixed(2) + '</span> total</div>';
        html += '<div class="client-stat"><span>$' + stats.averageQuote.toFixed(2) + '</span> avg</div>';
        html += '</div>';
      }

      html += '</div>';
    });

    html += '</div>';

    container.innerHTML = html;
  }

  // Show client form
  function showClientForm(clientId) {
    var client = clientId ? getClient(clientId) : null;
    var modal = createClientFormModal(client);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create client form modal
  function createClientFormModal(client) {
    var existing = document.getElementById('clientFormModal');
    if (existing) {
      existing.remove();
    }

    var isEdit = !!client;
    var modal = document.createElement('div');
    modal.id = 'clientFormModal';
    modal.className = 'client-modal';
    modal.innerHTML =
      '<div class="client-modal-content client-modal-small">' +
        '<div class="client-modal-header">' +
          '<h2>' + (isEdit ? 'Edit Client' : 'Add Client') + '</h2>' +
          '<button type="button" class="client-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="client-modal-body">' +
          '<form id="clientForm" class="client-form">' +
            '<div class="form-group">' +
              '<label for="clientFormName">Client Name *</label>' +
              '<input type="text" id="clientFormName" required value="' + (client ? escapeHtml(client.name) : '') + '" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="clientFormEmail">Email</label>' +
              '<input type="email" id="clientFormEmail" value="' + (client ? escapeHtml(client.email) : '') + '" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="clientFormPhone">Phone</label>' +
              '<input type="tel" id="clientFormPhone" value="' + (client ? escapeHtml(client.phone) : '') + '" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="clientFormLocation">Location</label>' +
              '<input type="text" id="clientFormLocation" value="' + (client ? escapeHtml(client.location) : '') + '" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="clientFormAddress">Full Address</label>' +
              '<textarea id="clientFormAddress" rows="2">' + (client ? escapeHtml(client.address) : '') + '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="clientFormNotes">Notes</label>' +
              '<textarea id="clientFormNotes" rows="3">' + (client ? escapeHtml(client.notes) : '') + '</textarea>' +
            '</div>' +
            '<div class="form-actions">' +
              '<button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancel</button>' +
              '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update' : 'Add') + ' Client</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    // Event listeners
    modal.querySelector('.client-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#cancelFormBtn').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#clientForm').onsubmit = function(e) {
      e.preventDefault();

      var clientData = {
        id: client ? client.id : null,
        name: document.getElementById('clientFormName').value,
        email: document.getElementById('clientFormEmail').value,
        phone: document.getElementById('clientFormPhone').value,
        location: document.getElementById('clientFormLocation').value,
        address: document.getElementById('clientFormAddress').value,
        notes: document.getElementById('clientFormNotes').value,
        createdAt: client ? client.createdAt : null
      };

      var savedClient = saveClient(clientData);
      if (savedClient) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
        renderClientList();
      }
    };

    return modal;
  }

  // Select client and fill form
  function selectClient(clientId) {
    var client = getClient(clientId);
    if (!client) return;

    // Fill client fields in main form
    var clientNameInput = document.getElementById('clientNameInput');
    var clientLocationInput = document.getElementById('clientLocationInput');

    if (clientNameInput) clientNameInput.value = client.name;
    if (clientLocationInput) clientLocationInput.value = client.location;

    // Close modal
    var modal = document.getElementById('clientListModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    }

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('Client selected: ' + client.name);
    }
  }

  // Edit client
  function editClient(clientId) {
    showClientForm(clientId);
  }

  // HTML escape helper
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize auto-complete on client name field
  function initAutoComplete() {
    var clientNameInput = document.getElementById('clientNameInput');
    if (!clientNameInput) return;

    var datalist = document.createElement('datalist');
    datalist.id = 'clientNameDatalist';
    clientNameInput.setAttribute('list', 'clientNameDatalist');
    clientNameInput.parentNode.appendChild(datalist);

    function updateDatalist() {
      var allClients = getAllClients();
      var options = '';
      allClients.forEach(function(client) {
        options += '<option value="' + escapeHtml(client.name) + '">';
      });
      datalist.innerHTML = options;
    }

    updateDatalist();

    // Auto-fill other fields when client name is selected
    clientNameInput.addEventListener('change', function() {
      var client = getClientByName(clientNameInput.value);
      if (client) {
        var clientLocationInput = document.getElementById('clientLocationInput');
        if (clientLocationInput && !clientLocationInput.value) {
          clientLocationInput.value = client.location;
        }
      }
    });
  }

  // Add "Manage Clients" button to UI
  function addManageButton() {
    var header = document.querySelector('.hdr-meta');
    if (!header) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'manageClientsBtn';
    button.className = 'btn btn-secondary btn-small';
    button.textContent = '👥 Clients';
    button.onclick = showClientList;
    button.style.marginLeft = '10px';

    var clientNameField = document.querySelector('.hdr-meta-field');
    if (clientNameField) {
      clientNameField.appendChild(button);
    }
  }

  // Initialize
  function init() {
    loadClients();
    initAutoComplete();
    addManageButton();
    DEBUG.log('[CLIENT-DB] Client database initialized (' + clients.length + ' clients)');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on window load
  window.addEventListener('load', function() {
    setTimeout(function() {
      initAutoComplete();
      addManageButton();
    }, 500);
  });

  // Export public API
  window.ClientDatabase = {
    save: saveClient,
    delete: deleteClient,
    get: getClient,
    getByName: getClientByName,
    search: searchClients,
    getAll: getAllClients,
    getStats: getClientStats,
    showList: showClientList,
    selectClient: selectClient,
    editClient: editClient
  };

})();
