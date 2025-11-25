// customer-directory-ui.js - Customer Directory Page UI Controller
// Dependencies: client-database.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[CUSTOMER-DIR] Skipped in test mode');
    return;
  }

  var currentFilter = '';
  var currentSort = 'name-asc';

  // Show the customers page
  function showCustomersPage() {
    // Hide main quote app
    var appEl = document.querySelector('.app');
    if (appEl) {
      appEl.style.display = 'none';
    }

    // Hide tasks page if visible
    var tasksPage = document.getElementById('page-tasks');
    if (tasksPage) {
      tasksPage.style.display = 'none';
    }

    // Show customers page
    var customersPage = document.getElementById('page-customers');
    if (customersPage) {
      customersPage.style.display = 'block';
    }

    // Render the customer list
    renderCustomerDirectory();
  }

  // Hide customers page and return to quotes
  function backToQuotes() {
    // Show main quote app
    var appEl = document.querySelector('.app');
    if (appEl) {
      appEl.style.display = 'block';
    }

    // Hide customers page
    var customersPage = document.getElementById('page-customers');
    if (customersPage) {
      customersPage.style.display = 'none';
    }
  }

  // Render customer directory
  function renderCustomerDirectory() {
    if (!window.ClientDatabase) {
      console.error('[CUSTOMER-DIR] ClientDatabase not loaded');
      return;
    }

    var searchInput = document.getElementById('customer-search-input');
    var sortSelect = document.getElementById('customer-sort-select');

    // Get filter and sort values
    if (searchInput) {
      currentFilter = searchInput.value;
    }
    if (sortSelect) {
      currentSort = sortSelect.value;
    }

    // Get all customers
    var allCustomers = window.ClientDatabase.getAll();

    // Apply search filter
    var filteredCustomers = currentFilter
      ? window.ClientDatabase.search(currentFilter)
      : allCustomers;

    // Apply sorting
    var sortedCustomers = sortCustomers(filteredCustomers, currentSort);

    // Update stats
    updateCustomerStats(allCustomers);

    // Render customer list
    renderCustomerList(sortedCustomers);
  }

  // Sort customers
  function sortCustomers(customers, sortType) {
    var sorted = customers.slice(0); // Copy array

    if (sortType === 'name-asc') {
      sorted.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
    } else if (sortType === 'name-desc') {
      sorted.sort(function(a, b) {
        return b.name.localeCompare(a.name);
      });
    } else if (sortType === 'recent') {
      sorted.sort(function(a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } else if (sortType === 'oldest') {
      sorted.sort(function(a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    } else if (sortType === 'most-quotes') {
      sorted.sort(function(a, b) {
        var statsA = window.ClientDatabase.getStats(a.id) || { quoteCount: 0 };
        var statsB = window.ClientDatabase.getStats(b.id) || { quoteCount: 0 };
        return statsB.quoteCount - statsA.quoteCount;
      });
    } else if (sortType === 'highest-revenue') {
      sorted.sort(function(a, b) {
        var statsA = window.ClientDatabase.getStats(a.id) || { totalRevenue: 0 };
        var statsB = window.ClientDatabase.getStats(b.id) || { totalRevenue: 0 };
        return statsB.totalRevenue - statsA.totalRevenue;
      });
    }

    return sorted;
  }

  // Update customer stats summary
  function updateCustomerStats(customers) {
    var totalCustomersEl = document.getElementById('total-customers');
    var totalQuotesEl = document.getElementById('total-customer-quotes');
    var totalRevenueEl = document.getElementById('total-customer-revenue');
    var avgQuoteValueEl = document.getElementById('avg-quote-value');

    var totalQuotes = 0;
    var totalRevenue = 0;

    for (var i = 0; i < customers.length; i++) {
      var stats = window.ClientDatabase.getStats(customers[i].id);
      if (stats) {
        totalQuotes += stats.quoteCount || 0;
        totalRevenue += stats.totalRevenue || 0;
      }
    }

    var avgQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;

    if (totalCustomersEl) totalCustomersEl.textContent = customers.length;
    if (totalQuotesEl) totalQuotesEl.textContent = totalQuotes;
    if (totalRevenueEl) totalRevenueEl.textContent = '$' + totalRevenue.toFixed(2);
    if (avgQuoteValueEl) avgQuoteValueEl.textContent = '$' + avgQuoteValue.toFixed(2);
  }

  // Render customer list
  function renderCustomerList(customers) {
    var container = document.getElementById('customer-list');
    var emptyState = document.getElementById('customers-empty-state');

    if (!container) return;

    container.setAttribute('role', 'grid');
    container.setAttribute('aria-label', 'Customer directory');

    if (customers.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    var html = '';

    for (var i = 0; i < customers.length; i++) {
      var customer = customers[i];
      var stats = window.ClientDatabase.getStats(customer.id);
      var escapedName = escapeHtml(customer.name);
      var escapedEmail = escapeHtml(customer.email);
      var escapedPhone = escapeHtml(customer.phone);
      var escapedLocation = escapeHtml(customer.location);
      var escapedNotes = escapeHtml(customer.notes);

      html += '<div class="customer-card card" tabindex="0" role="row" aria-label="Customer ' + escapedName + '">';
      html += '<div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">';
      html += '<div>';
      html += '<h3 class="card-title" style="margin: 0;">' + escapedName + '</h3>';
      if (customer.location) {
        html += '<div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">📍 ' + escapedLocation + '</div>';
      }
      html += '</div>';
      html += '<div class="customer-card-actions">';
      html += '<button class="btn btn-sm btn-success" onclick="addCustomerToQuote(\'' + customer.id + '\')" title="Add to Quote" aria-label="Add ' + escapedName + ' to quote" role="button">+ Quote</button>';
      html += '<button class="btn btn-sm btn-secondary" onclick="editCustomerFromDirectory(\'' + customer.id + '\')" title="Edit" aria-label="Edit ' + escapedName + '" role="button">✎ Edit</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="deleteCustomerFromDirectory(\'' + customer.id + '\')" title="Delete" aria-label="Delete ' + escapedName + '" role="button">🗑️ Delete</button>';
      html += '</div>';
      html += '</div>';

      html += '<div class="card-body">';

      // Contact info
      if (customer.email || customer.phone) {
        html += '<div style="margin-bottom: 1rem;">';
        if (customer.email) {
          html += '<div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">';
          html += '<span style="color: #6b7280;">📧</span>';
          html += '<a href="mailto:' + escapedEmail + '" style="color: #3b82f6;">' + escapedEmail + '</a>';
          html += '</div>';
        }
        if (customer.phone) {
          html += '<div style="display: flex; align-items: center; gap: 0.5rem;">';
          html += '<span style="color: #6b7280;">📞</span>';
          html += '<a href="tel:' + escapedPhone + '" style="color: #3b82f6;">' + escapedPhone + '</a>';
          html += '</div>';
        }
        html += '</div>';
      }

      // Notes
      if (customer.notes) {
        html += '<div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(148, 163, 184, 0.1); border-radius: 0.5rem;">';
        html += '<div style="color: #6b7280; font-size: 0.75rem; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Notes</div>';
        html += '<div style="color: #e5e7eb; font-size: 0.875rem;">' + escapedNotes + '</div>';
        html += '</div>';
      }

      // Stats
      if (stats && stats.quoteCount > 0) {
        html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid rgba(148, 163, 184, 0.2);">';
        html += '<div style="text-align: center;">';
        html += '<div style="color: #6b7280; font-size: 0.75rem; margin-bottom: 0.25rem;">Quotes</div>';
        html += '<div style="font-weight: 600; color: #3b82f6;">' + stats.quoteCount + '</div>';
        html += '</div>';
        html += '<div style="text-align: center;">';
        html += '<div style="color: #6b7280; font-size: 0.75rem; margin-bottom: 0.25rem;">Total Revenue</div>';
        html += '<div style="font-weight: 600; color: #10b981;">$' + (stats.totalRevenue || 0).toFixed(2) + '</div>';
        html += '</div>';
        html += '<div style="text-align: center;">';
        html += '<div style="color: #6b7280; font-size: 0.75rem; margin-bottom: 0.25rem;">Avg. Quote</div>';
        html += '<div style="font-weight: 600; color: #f59e0b;">$' + (stats.averageQuote || 0).toFixed(2) + '</div>';
        html += '</div>';
        html += '</div>';
      } else {
        html += '<div style="text-align: center; padding: 1rem; color: #6b7280; font-size: 0.875rem; border-top: 1px solid rgba(148, 163, 184, 0.2);">';
        html += 'No quotes yet';
        html += '</div>';
      }

      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;

    if (window.EventHandlers && window.EventHandlers.enableKeyboardTableNavigation) {
      window.EventHandlers.enableKeyboardTableNavigation(container, '.customer-card', function(row) {
        var editBtn = row.querySelector('.btn-secondary');
        if (editBtn) {
          editBtn.click();
        }
      });
    }
  }

  // Add customer to current quote
  function addCustomerToQuote(customerId) {
    if (!window.ClientDatabase) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Client database not available', 'error');
      }
      return;
    }

    var customer = window.ClientDatabase.get(customerId);
    if (!customer) {
      if (window.UIComponents) {
        window.UIComponents.showToast('Customer not found', 'error');
      }
      return;
    }

    // Fill quote form fields
    var clientNameInput = document.getElementById('clientNameInput');
    var clientLocationInput = document.getElementById('clientLocationInput');

    if (clientNameInput) clientNameInput.value = customer.name;
    if (clientLocationInput) clientLocationInput.value = customer.location || '';

    // Navigate back to quotes page
    backToQuotes();

    // Show success message
    if (window.UIComponents) {
      window.UIComponents.showToast('Customer added to quote: ' + customer.name, 'success');
    } else if (window.showToast) {
      window.showToast('Customer added to quote: ' + customer.name, 'success');
    }
  }

  // Edit customer from directory
  function editCustomerFromDirectory(customerId) {
    if (!window.ClientDatabase || !window.ClientDatabase.editClient) {
      console.error('[CUSTOMER-DIR] ClientDatabase.editClient not available');
      return;
    }

    // Call the existing edit function from client-database.js
    window.ClientDatabase.editClient(customerId);

    // Re-render directory after a short delay to allow for modal close
    setTimeout(function() {
      renderCustomerDirectory();
    }, 500);
  }

  // Delete customer from directory
  function deleteCustomerFromDirectory(customerId) {
    if (!window.ClientDatabase || !window.ClientDatabase.get) {
      return;
    }

    var customer = window.ClientDatabase.get(customerId);
    if (!customer) return;

    // Show confirmation
    if (window.UIComponents && window.UIComponents.showConfirm) {
      window.UIComponents.showConfirm({
        title: 'Delete Customer?',
        message: 'Are you sure you want to delete "' + customer.name + '"? This will not delete their quotes.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
        onConfirm: function() {
          performCustomerDelete(customerId);
        }
      });
    } else {
      // Fallback to native confirm
      if (confirm('Delete customer "' + customer.name + '"? This will not delete their quotes.')) {
        performCustomerDelete(customerId);
      }
    }
  }

  // Perform customer deletion
  function performCustomerDelete(customerId) {
    if (!window.ClientDatabase || !window.ClientDatabase.delete) {
      return;
    }

    var success = window.ClientDatabase.delete(customerId);

    if (success) {
      // Re-render directory
      renderCustomerDirectory();

      // Show success message
      if (window.UIComponents) {
        window.UIComponents.showToast('Customer deleted successfully', 'success');
      } else if (window.showToast) {
        window.showToast('Customer deleted', 'success');
      }
    }
  }

  // Open add customer modal
  function openAddCustomerModal() {
    if (!window.ClientDatabase) {
      console.error('[CUSTOMER-DIR] ClientDatabase not loaded');
      return;
    }

    // Call the existing showClientForm function from client-database.js
    // Pass null to indicate new customer
    if (window.ClientDatabase.showList) {
      // Use the modal from client-database.js
      var modal = createCustomerFormModal(null);
      document.body.appendChild(modal);
      modal.classList.add('active');
    }
  }

  // Create customer form modal (simplified version for directory page)
  function createCustomerFormModal(customer) {
    var existing = document.getElementById('customerFormModal');
    if (existing) {
      existing.remove();
    }

    var isEdit = !!customer;
    var modalOverlay = document.createElement('div');
    modalOverlay.id = 'customerFormModal';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'flex';

    var html = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="customerFormTitle">';
    html += '<div class="modal-header">';
    html += '<h2 class="modal-title" id="customerFormTitle">' + (isEdit ? 'Edit Customer' : 'Add Customer') + '</h2>';
    html += '<button type="button" class="modal-close" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<form id="customerForm">';
    html += '<div class="form-group">';
    html += '<label class="form-label form-label-required" for="customerFormName">Customer Name</label>';
    html += '<input type="text" id="customerFormName" class="form-input" required value="' + (customer ? escapeHtml(customer.name) : '') + '" aria-required="true" />';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label class="form-label" for="customerFormEmail">Email</label>';
    html += '<input type="email" id="customerFormEmail" class="form-input" value="' + (customer ? escapeHtml(customer.email) : '') + '" />';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label class="form-label" for="customerFormPhone">Phone</label>';
    html += '<input type="tel" id="customerFormPhone" class="form-input" value="' + (customer ? escapeHtml(customer.phone) : '') + '" />';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label class="form-label" for="customerFormLocation">Location</label>';
    html += '<input type="text" id="customerFormLocation" class="form-input" value="' + (customer ? escapeHtml(customer.location) : '') + '" placeholder="e.g. Perth CBD, Subiaco" />';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label class="form-label" for="customerFormAddress">Full Address</label>';
    html += '<textarea id="customerFormAddress" class="form-textarea" rows="2">' + (customer ? escapeHtml(customer.address) : '') + '</textarea>';
    html += '</div>';
    html += '<div class="form-group">';
    html += '<label class="form-label" for="customerFormNotes">Notes</label>';
    html += '<textarea id="customerFormNotes" class="form-textarea" rows="3" placeholder="Any special requirements or notes about the customer...">' + (customer ? escapeHtml(customer.notes) : '') + '</textarea>';
    html += '</div>';
    html += '</form>';
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancel</button>';
    html += '<button type="button" class="btn btn-primary" id="submitFormBtn">' + (isEdit ? 'Update' : 'Add') + ' Customer</button>';
    html += '</div>';
    html += '</div>';

    modalOverlay.innerHTML = html;

    // Event listeners
    modalOverlay.querySelector('.modal-close').onclick = function() {
      modalOverlay.style.display = 'none';
      setTimeout(function() { modalOverlay.remove(); }, 300);
    };

    modalOverlay.querySelector('#cancelFormBtn').onclick = function() {
      modalOverlay.style.display = 'none';
      setTimeout(function() { modalOverlay.remove(); }, 300);
    };

    modalOverlay.onclick = function(e) {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
        setTimeout(function() { modalOverlay.remove(); }, 300);
      }
    };

    // Form submit handler
    var submitHandler = function() {
      var customerData = {
        id: customer ? customer.id : null,
        name: document.getElementById('customerFormName').value,
        email: document.getElementById('customerFormEmail').value,
        phone: document.getElementById('customerFormPhone').value,
        location: document.getElementById('customerFormLocation').value,
        address: document.getElementById('customerFormAddress').value,
        notes: document.getElementById('customerFormNotes').value,
        createdAt: customer ? customer.createdAt : null
      };

      if (!customerData.name || customerData.name.trim() === '') {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Please enter a customer name', 'error');
        } else {
          alert('Please enter a customer name');
        }
        return;
      }

      if (!window.ClientDatabase || !window.ClientDatabase.save) {
        console.error('[CUSTOMER-DIR] ClientDatabase.save not available');
        return;
      }

      var savedCustomer = window.ClientDatabase.save(customerData);
      if (savedCustomer) {
        modalOverlay.style.display = 'none';
        setTimeout(function() { modalOverlay.remove(); }, 300);
        renderCustomerDirectory();
      }
    };

    modalOverlay.querySelector('#submitFormBtn').onclick = submitHandler;

    // Handle Enter key in form
    modalOverlay.querySelector('#customerForm').onsubmit = function(e) {
      e.preventDefault();
      submitHandler();
    };

    if (window.EventHandlers && window.EventHandlers.setupModalNavigation) {
      window.EventHandlers.setupModalNavigation(modalOverlay, {
        onClose: function() {
          modalOverlay.style.display = 'none';
          setTimeout(function() { modalOverlay.remove(); }, 300);
        },
        onSubmit: submitHandler,
        initialFocusSelector: '#customerFormName',
        labelledBy: 'customerFormTitle'
      });
    }

    return modalOverlay;
  }

  // HTML escape helper
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize event listeners
  function init() {
    // Search input
    var searchInput = document.getElementById('customer-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderCustomerDirectory();
      });
    }

    // Sort select
    var sortSelect = document.getElementById('customer-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        renderCustomerDirectory();
      });
    }

    console.log('[CUSTOMER-DIR] Customer directory UI initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on window load
  window.addEventListener('load', function() {
    setTimeout(init, 500);
  });

  // Export public API
  window.showCustomersPage = showCustomersPage;
  window.backToQuotes = backToQuotes;
  window.addCustomerToQuote = addCustomerToQuote;
  window.editCustomerFromDirectory = editCustomerFromDirectory;
  window.deleteCustomerFromDirectory = deleteCustomerFromDirectory;
  window.openAddCustomerModal = openAddCustomerModal;

  // Register with APP if available
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('customerDirectoryUI', {
      showCustomersPage: showCustomersPage,
      backToQuotes: backToQuotes,
      render: renderCustomerDirectory
    });
  }

})();
