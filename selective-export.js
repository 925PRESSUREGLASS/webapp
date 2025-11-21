// selective-export.js - Selective Data Export Module
// Export specific data types (quotes, clients, templates, etc.)
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  // Available export categories
  var exportCategories = {
    quotes: {
      label: 'Quote History',
      key: 'quote-history',
      description: 'All saved quotes and their details',
      icon: '📊'
    },
    clients: {
      label: 'Client Database',
      key: 'client-database',
      description: 'Client contact information and history',
      icon: '👥'
    },
    templates: {
      label: 'Quote Templates',
      key: 'quoteTemplates',
      description: 'Saved quote templates',
      icon: '📝'
    },
    settings: {
      label: 'App Settings',
      key: 'appSettings',
      description: 'Application preferences and configuration',
      icon: '⚙️'
    },
    current: {
      label: 'Current Quote',
      key: 'savedQuote',
      description: 'Current unsaved quote draft',
      icon: '✏️'
    },
    workflow: {
      label: 'Quote Status',
      key: 'current-quote-status',
      description: 'Quote workflow status information',
      icon: '🔄'
    }
  };

  /**
   * Export selected data categories
   */
  function exportSelected(selectedCategories) {
    try {
      if (!selectedCategories || selectedCategories.length === 0) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Please select at least one category to export');
        }
        return false;
      }

      if (window.LoadingState) {
        window.LoadingState.show('Creating export...');
      }

      var exportData = {
        version: '1.13.3',
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        exportType: 'selective',
        categories: selectedCategories,
        data: {}
      };

      // Collect selected data
      var totalItems = 0;
      selectedCategories.forEach(function(categoryId) {
        var category = exportCategories[categoryId];
        if (category) {
          try {
            var value = localStorage.getItem(category.key);
            if (value) {
              var parsed = window.Security ? 
                window.Security.safeJSONParse(value, null, null) : 
                JSON.parse(value);
              
              exportData.data[category.key] = parsed;
              
              // Count items
              if (Array.isArray(parsed)) {
                totalItems += parsed.length;
              } else if (parsed && typeof parsed === 'object') {
                totalItems += Object.keys(parsed).length;
              }
            }
          } catch (e) {
            console.warn('Failed to export category:', categoryId, e);
          }
        }
      });

      if (totalItems === 0) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showWarning('No data found in selected categories');
        }
        return false;
      }

      // Create filename based on categories
      var dateStr = new Date().toISOString().split('T')[0];
      var categoryNames = selectedCategories.map(function(id) {
        return exportCategories[id] ? exportCategories[id].label.toLowerCase().replace(/\s+/g, '-') : id;
      });
      var filename = 'tic-tac-stick-' + categoryNames.join('-') + '_' + dateStr + '.json';

      // Download
      downloadJSON(exportData, filename);

      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Export created: ' + totalItems + ' item(s)');
      }

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('Export failed: ' + error.message);
      }
      return false;
    }
  }

  /**
   * Export quotes only as CSV
   */
  function exportQuotesAsCSV() {
    try {
      if (window.LoadingState) {
        window.LoadingState.show('Creating CSV export...');
      }

      var quotesStr = localStorage.getItem('quote-history');
      if (!quotesStr) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showWarning('No quotes to export');
        }
        return false;
      }

      var quotes = window.Security ? 
        window.Security.safeJSONParse(quotesStr, null, []) : 
        JSON.parse(quotesStr);

      if (!Array.isArray(quotes) || quotes.length === 0) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showWarning('No quotes to export');
        }
        return false;
      }

      // Build CSV
      var csv = buildQuotesCSV(quotes);

      // Create filename
      var dateStr = new Date().toISOString().split('T')[0];
      var filename = 'tic-tac-stick-quotes_' + dateStr + '.csv';

      // Download
      downloadCSV(csv, filename);

      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Exported ' + quotes.length + ' quote(s) to CSV');
      }

      return true;
    } catch (error) {
      console.error('CSV export failed:', error);
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('CSV export failed: ' + error.message);
      }
      return false;
    }
  }

  /**
   * Build CSV from quotes array
   */
  function buildQuotesCSV(quotes) {
    // CSV headers
    var headers = [
      'Quote ID',
      'Client Name',
      'Location',
      'Date',
      'Subtotal',
      'GST',
      'Total',
      'Window Lines',
      'Pressure Lines',
      'Status',
      'Notes'
    ];

    var rows = [headers];

    // Add quote rows
    quotes.forEach(function(quote) {
      var row = [
        quote.id || '',
        escapeCsvValue(quote.clientName || ''),
        escapeCsvValue(quote.clientLocation || ''),
        quote.date ? new Date(quote.date).toISOString().split('T')[0] : '',
        quote.subtotal || '0',
        quote.gstAmount || '0',
        quote.total || '0',
        quote.windowLines ? quote.windowLines.length : '0',
        quote.pressureLines ? quote.pressureLines.length : '0',
        quote.status || 'draft',
        escapeCsvValue(quote.notes || '')
      ];
      rows.push(row);
    });

    // Convert to CSV string
    return rows.map(function(row) {
      return row.join(',');
    }).join('\n');
  }

  /**
   * Escape CSV value (handle commas and quotes)
   */
  function escapeCsvValue(value) {
    if (!value) return '';
    
    var stringValue = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes
    if (stringValue.indexOf(',') !== -1 || 
        stringValue.indexOf('"') !== -1 || 
        stringValue.indexOf('\n') !== -1) {
      // Escape quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""');
      return '"' + stringValue + '"';
    }
    
    return stringValue;
  }

  /**
   * Export clients as CSV
   */
  function exportClientsAsCSV() {
    try {
      if (window.LoadingState) {
        window.LoadingState.show('Creating CSV export...');
      }

      var clientsStr = localStorage.getItem('client-database');
      if (!clientsStr) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showWarning('No clients to export');
        }
        return false;
      }

      var clients = window.Security ? 
        window.Security.safeJSONParse(clientsStr, null, []) : 
        JSON.parse(clientsStr);

      if (!Array.isArray(clients) || clients.length === 0) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showWarning('No clients to export');
        }
        return false;
      }

      // Build CSV
      var csv = buildClientsCSV(clients);

      // Create filename
      var dateStr = new Date().toISOString().split('T')[0];
      var filename = 'tic-tac-stick-clients_' + dateStr + '.csv';

      // Download
      downloadCSV(csv, filename);

      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Exported ' + clients.length + ' client(s) to CSV');
      }

      return true;
    } catch (error) {
      console.error('CSV export failed:', error);
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      if (window.ErrorHandler) {
        window.ErrorHandler.showError('CSV export failed: ' + error.message);
      }
      return false;
    }
  }

  /**
   * Build CSV from clients array
   */
  function buildClientsCSV(clients) {
    // CSV headers
    var headers = [
      'Client ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Notes',
      'Created Date',
      'Last Contact'
    ];

    var rows = [headers];

    // Add client rows
    clients.forEach(function(client) {
      var row = [
        client.id || '',
        escapeCsvValue(client.name || ''),
        client.email || '',
        client.phone || '',
        escapeCsvValue(client.address || ''),
        escapeCsvValue(client.notes || ''),
        client.createdDate ? new Date(client.createdDate).toISOString().split('T')[0] : '',
        client.lastContact ? new Date(client.lastContact).toISOString().split('T')[0] : ''
      ];
      rows.push(row);
    });

    // Convert to CSV string
    return rows.map(function(row) {
      return row.join(',');
    }).join('\n');
  }

  /**
   * Download JSON file
   */
  function downloadJSON(data, filename) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, filename);
  }

  /**
   * Download CSV file
   */
  function downloadCSV(csvContent, filename) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  }

  /**
   * Download blob as file
   */
  function downloadBlob(blob, filename) {
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(function() {
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  }

  /**
   * Show selective export modal
   */
  function showSelectiveExportModal() {
    var modal = createSelectiveExportModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  /**
   * Create selective export modal UI
   */
  function createSelectiveExportModal() {
    var existing = document.getElementById('selectiveExportModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'selectiveExportModal';
    modal.className = 'selective-export-modal';

    modal.innerHTML =
      '<div class="selective-export-modal-content">' +
        '<div class="selective-export-modal-header">' +
          '<h2>Selective Export</h2>' +
          '<button type="button" class="selective-export-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="selective-export-modal-body">' +
          '<p>Select the data you want to export:</p>' +
          '<div class="export-categories" id="exportCategories"></div>' +
          '<div class="export-format-section">' +
            '<h3>Export Format</h3>' +
            '<div class="export-format-options">' +
              '<label class="radio-label">' +
                '<input type="radio" name="exportFormat" value="json" checked /> ' +
                '<span>JSON (Full data, can be re-imported)</span>' +
              '</label>' +
              '<label class="radio-label">' +
                '<input type="radio" name="exportFormat" value="csv" /> ' +
                '<span>CSV (Spreadsheet format, quotes or clients only)</span>' +
              '</label>' +
            '</div>' +
          '</div>' +
          '<div class="export-actions">' +
            '<button type="button" class="btn btn-secondary" id="cancelExportBtn">Cancel</button>' +
            '<button type="button" class="btn btn-primary" id="performExportBtn">Export Selected</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Populate categories
    var categoriesContainer = modal.querySelector('#exportCategories');
    Object.keys(exportCategories).forEach(function(categoryId) {
      var category = exportCategories[categoryId];
      
      // Check if data exists
      var hasData = !!localStorage.getItem(category.key);
      var itemCount = 0;
      
      if (hasData) {
        try {
          var data = localStorage.getItem(category.key);
          var parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            itemCount = parsed.length;
          } else if (parsed && typeof parsed === 'object') {
            itemCount = Object.keys(parsed).length;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      var checkbox = document.createElement('div');
      checkbox.className = 'export-category-item';
      if (!hasData) {
        checkbox.className += ' disabled';
      }

      checkbox.innerHTML =
        '<label>' +
          '<input type="checkbox" name="exportCategory" value="' + categoryId + '" ' +
            (hasData ? '' : 'disabled') + ' /> ' +
          '<span class="category-icon">' + category.icon + '</span>' +
          '<span class="category-label">' +
            '<strong>' + category.label + '</strong>' +
            '<small>' + category.description + '</small>' +
            (itemCount > 0 ? '<small class="item-count">(' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ')</small>' : '') +
          '</span>' +
        '</label>';

      categoriesContainer.appendChild(checkbox);
    });

    // Event listeners
    modal.querySelector('.selective-export-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.querySelector('#cancelExportBtn').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    // Export button
    modal.querySelector('#performExportBtn').onclick = function() {
      var checkboxes = modal.querySelectorAll('input[name="exportCategory"]:checked');
      var selectedCategories = [];
      
      for (var i = 0; i < checkboxes.length; i++) {
        selectedCategories.push(checkboxes[i].value);
      }

      if (selectedCategories.length === 0) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Please select at least one category');
        }
        return;
      }

      // Get selected format
      var formatInputs = modal.querySelectorAll('input[name="exportFormat"]');
      var format = 'json';
      for (var j = 0; j < formatInputs.length; j++) {
        if (formatInputs[j].checked) {
          format = formatInputs[j].value;
          break;
        }
      }

      // Close modal
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);

      // Perform export
      if (format === 'csv') {
        // CSV export only supports quotes or clients
        if (selectedCategories.indexOf('quotes') !== -1) {
          exportQuotesAsCSV();
        } else if (selectedCategories.indexOf('clients') !== -1) {
          exportClientsAsCSV();
        } else {
          if (window.ErrorHandler) {
            window.ErrorHandler.showWarning('CSV export only supports quotes or clients. Using JSON format.');
          }
          exportSelected(selectedCategories);
        }
      } else {
        exportSelected(selectedCategories);
      }
    };

    return modal;
  }

  // Export public API
  window.SelectiveExport = {
    showModal: showSelectiveExportModal,
    exportSelected: exportSelected,
    exportQuotesAsCSV: exportQuotesAsCSV,
    exportClientsAsCSV: exportClientsAsCSV,
    categories: exportCategories
  };

  console.log('[SELECTIVE-EXPORT] Selective export module loaded');

})();
