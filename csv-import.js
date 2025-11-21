// csv-import.js - CSV Import with Column Mapping
// Import quotes from CSV/Excel files with smart column mapping
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  // Configuration constants
  var GST_RATE = 0.1; // 10% GST rate for Australia
  var GST_VALIDATION_TOLERANCE = 1; // Allow $1 difference in GST calculation

  // CSV parsing helper
  function parseCSV(csvText) {
    var lines = csvText.split(/\r?\n/);
    var result = [];
    var headers = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      var values = parseCSVLine(line);

      if (i === 0 || !headers) {
        headers = values;
      } else {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j] || '';
        }
        result.push(row);
      }
    }

    return {
      headers: headers,
      data: result
    };
  }

  // Parse single CSV line (handles quoted values)
  function parseCSVLine(line) {
    var values = [];
    var current = '';
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  // Column mapping definitions
  var columnMappings = {
    clientName: ['client', 'client name', 'customer', 'customer name', 'name'],
    clientLocation: ['location', 'address', 'site', 'job location', 'client location'],
    date: ['date', 'quote date', 'created', 'created date'],
    total: ['total', 'total amount', 'amount', 'price', 'quote total'],
    subtotal: ['subtotal', 'sub total', 'net'],
    gstAmount: ['gst', 'tax', 'gst amount', 'tax amount'],
    windowCount: ['windows', 'window count', 'num windows', 'window qty'],
    pressureCount: ['pressure', 'pressure count', 'pressure items'],
    notes: ['notes', 'comments', 'description', 'details'],
    status: ['status', 'quote status', 'state']
  };

  // Auto-detect column mapping
  function autoDetectMapping(headers) {
    var mapping = {};

    headers.forEach(function(header, index) {
      var normalized = header.toLowerCase().trim();

      for (var field in columnMappings) {
        if (columnMappings.hasOwnProperty(field)) {
          var matches = columnMappings[field];
          for (var i = 0; i < matches.length; i++) {
            if (normalized === matches[i] || normalized.indexOf(matches[i]) !== -1) {
              mapping[field] = index;
              break;
            }
          }
        }
      }
    });

    return mapping;
  }

  // Convert CSV row to quote object
  function rowToQuote(row, mapping, headers) {
    var quote = {
      id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      clientName: '',
      clientLocation: '',
      total: 0,
      subtotal: 0,
      gstAmount: 0,
      windowLines: [],
      pressureLines: [],
      notes: '',
      status: 'draft',
      imported: true,
      importDate: new Date().toISOString()
    };

    // Map columns to quote fields
    for (var field in mapping) {
      if (mapping.hasOwnProperty(field)) {
        var columnIndex = mapping[field];
        var value = row[headers[columnIndex]];

        if (field === 'total' || field === 'subtotal' || field === 'gstAmount') {
          // Parse currency
          var cleaned = value.replace(/[$,]/g, '');
          quote[field] = parseFloat(cleaned) || 0;
        } else if (field === 'windowCount' || field === 'pressureCount') {
          quote[field] = parseInt(value) || 0;
        } else if (field === 'date') {
          // Try to parse date
          var dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            quote.date = dateValue.toISOString();
          }
        } else {
          quote[field] = value;
        }
      }
    }

    // Validate required fields
    if (!quote.clientName) {
      quote.clientName = 'Imported Customer';
    }

    // Calculate GST if not provided
    if (quote.total && !quote.gstAmount) {
      quote.gstAmount = quote.total * GST_RATE / (1 + GST_RATE);
      quote.subtotal = quote.total - quote.gstAmount;
    }

    return quote;
  }

  // Validate quote data
  function validateQuote(quote) {
    var errors = [];

    if (!quote.clientName || quote.clientName.trim() === '') {
      errors.push('Missing client name');
    }

    if (quote.total < 0) {
      errors.push('Invalid total amount');
    }

    if (quote.gstAmount < 0) {
      errors.push('Invalid GST amount');
    }

    // Check GST is correct percentage of subtotal
    if (quote.subtotal > 0 && quote.gstAmount > 0) {
      var expectedGST = quote.subtotal * GST_RATE;
      var diff = Math.abs(quote.gstAmount - expectedGST);
      if (diff > GST_VALIDATION_TOLERANCE) {
        errors.push('GST does not match ' + (GST_RATE * 100) + '% of subtotal');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Show CSV import modal
  function showCSVImportModal() {
    var modal = createCSVImportModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create CSV import modal UI
  function createCSVImportModal() {
    var existing = document.getElementById('csvImportModal');
    if (existing) {
      existing.remove();
    }

    var modal = document.createElement('div');
    modal.id = 'csvImportModal';
    modal.className = 'csv-import-modal';

    modal.innerHTML =
      '<div class="csv-import-modal-content">' +
        '<div class="csv-import-modal-header">' +
          '<h2>📥 Import Quotes from CSV</h2>' +
          '<button type="button" class="csv-import-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="csv-import-modal-body">' +
          '<div class="csv-import-step" id="csvUploadStep">' +
            '<h3>Step 1: Select CSV File</h3>' +
            '<p>Upload a CSV or Excel file containing quote data.</p>' +
            '<input type="file" id="csvFileInput" accept=".csv" style="display: none;" />' +
            '<button type="button" class="btn btn-primary" id="selectCSVBtn">Select CSV File</button>' +
            '<div class="csv-import-help">' +
              '<p><strong>Expected columns:</strong> Client Name, Location, Date, Total, Notes, etc.</p>' +
              '<p>The system will auto-detect columns and let you map them.</p>' +
            '</div>' +
          '</div>' +
          '<div class="csv-import-step" id="csvMappingStep" style="display: none;">' +
            '<h3>Step 2: Map Columns</h3>' +
            '<p>Match CSV columns to quote fields:</p>' +
            '<div id="csvMappingContainer"></div>' +
            '<div class="csv-import-actions">' +
              '<button type="button" class="btn btn-secondary" id="csvBackBtn">Back</button>' +
              '<button type="button" class="btn btn-primary" id="csvPreviewBtn">Preview Import</button>' +
            '</div>' +
          '</div>' +
          '<div class="csv-import-step" id="csvPreviewStep" style="display: none;">' +
            '<h3>Step 3: Preview & Import</h3>' +
            '<div id="csvPreviewContainer"></div>' +
            '<div class="csv-import-actions">' +
              '<button type="button" class="btn btn-secondary" id="csvBackToMappingBtn">Back</button>' +
              '<button type="button" class="btn btn-primary" id="csvImportBtn">Import Quotes</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // State
    var csvData = null;
    var columnMapping = null;
    var previewQuotes = null;

    // Event listeners
    modal.querySelector('.csv-import-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    // File selection
    var fileInput = modal.querySelector('#csvFileInput');
    modal.querySelector('#selectCSVBtn').onclick = function() {
      fileInput.click();
    };

    fileInput.onchange = function(e) {
      var file = e.target.files[0];
      if (file) {
        readCSVFile(file);
      }
    };

    // Read CSV file
    function readCSVFile(file) {
      if (window.LoadingState) {
        window.LoadingState.show('Reading CSV file...');
      }

      var reader = new FileReader();

      reader.onload = function(e) {
        try {
          var text = e.target.result;
          csvData = parseCSV(text);

          if (csvData.headers.length === 0 || csvData.data.length === 0) {
            throw new Error('CSV file is empty or invalid');
          }

          // Auto-detect column mapping
          columnMapping = autoDetectMapping(csvData.headers);

          // Show mapping step
          showMappingStep();

          if (window.LoadingState) {
            window.LoadingState.hide();
          }
        } catch (error) {
          if (window.LoadingState) {
            window.LoadingState.hide();
          }
          if (window.ErrorHandler) {
            window.ErrorHandler.showError('Failed to parse CSV: ' + error.message);
          }
        }
      };

      reader.onerror = function() {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Failed to read file');
        }
      };

      reader.readAsText(file);
    }

    // Show mapping step
    function showMappingStep() {
      modal.querySelector('#csvUploadStep').style.display = 'none';
      modal.querySelector('#csvMappingStep').style.display = 'block';

      var container = modal.querySelector('#csvMappingContainer');
      container.innerHTML = '';

      // Create mapping selects
      var fields = [
        { key: 'clientName', label: 'Client Name', required: true },
        { key: 'clientLocation', label: 'Location', required: false },
        { key: 'date', label: 'Date', required: false },
        { key: 'total', label: 'Total Amount', required: false },
        { key: 'subtotal', label: 'Subtotal', required: false },
        { key: 'gstAmount', label: 'GST Amount', required: false },
        { key: 'notes', label: 'Notes', required: false },
        { key: 'status', label: 'Status', required: false }
      ];

      fields.forEach(function(field) {
        var row = document.createElement('div');
        row.className = 'csv-mapping-row';

        var label = document.createElement('label');
        label.textContent = field.label + (field.required ? ' *' : '');
        label.className = field.required ? 'required' : '';

        var select = document.createElement('select');
        select.className = 'csv-mapping-select';
        select.dataset.field = field.key;

        // Add options
        var noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '(skip)';
        select.appendChild(noneOption);

        csvData.headers.forEach(function(header, index) {
          var option = document.createElement('option');
          option.value = index;
          option.textContent = header;

          // Pre-select if auto-detected
          if (columnMapping[field.key] === index) {
            option.selected = true;
          }

          select.appendChild(option);
        });

        select.onchange = function() {
          var fieldKey = this.dataset.field;
          var value = this.value;
          if (value === '') {
            delete columnMapping[fieldKey];
          } else {
            columnMapping[fieldKey] = parseInt(value);
          }
        };

        row.appendChild(label);
        row.appendChild(select);
        container.appendChild(row);
      });
    }

    // Preview button
    modal.querySelector('#csvPreviewBtn').onclick = function() {
      // Validate mapping - check if clientName is mapped
      if (columnMapping.clientName === undefined || columnMapping.clientName === null) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Client Name is required');
        }
        return;
      }

      // Convert rows to quotes
      previewQuotes = csvData.data.map(function(row) {
        return rowToQuote(row, columnMapping, csvData.headers);
      });

      // Validate quotes
      var validQuotes = [];
      var invalidQuotes = [];

      previewQuotes.forEach(function(quote) {
        var validation = validateQuote(quote);
        if (validation.valid) {
          validQuotes.push(quote);
        } else {
          invalidQuotes.push({
            quote: quote,
            errors: validation.errors
          });
        }
      });

      showPreviewStep(validQuotes, invalidQuotes);
    };

    // Show preview step
    function showPreviewStep(validQuotes, invalidQuotes) {
      modal.querySelector('#csvMappingStep').style.display = 'none';
      modal.querySelector('#csvPreviewStep').style.display = 'block';

      var container = modal.querySelector('#csvPreviewContainer');
      container.innerHTML = '';

      // Summary
      var summary = document.createElement('div');
      summary.className = 'csv-import-summary';
      summary.innerHTML =
        '<p><strong>Total rows:</strong> ' + csvData.data.length + '</p>' +
        '<p style="color: green;"><strong>Valid quotes:</strong> ' + validQuotes.length + '</p>' +
        (invalidQuotes.length > 0 ?
          '<p style="color: orange;"><strong>Invalid quotes (will be skipped):</strong> ' + invalidQuotes.length + '</p>' : '');
      container.appendChild(summary);

      // Show sample valid quotes
      if (validQuotes.length > 0) {
        var validSection = document.createElement('div');
        validSection.className = 'csv-preview-section';
        validSection.innerHTML = '<h4>Sample Valid Quotes (first 5):</h4>';

        var table = document.createElement('table');
        table.className = 'csv-preview-table';
        table.innerHTML =
          '<thead><tr>' +
            '<th>Client</th>' +
            '<th>Location</th>' +
            '<th>Total</th>' +
            '<th>GST</th>' +
            '<th>Date</th>' +
          '</tr></thead><tbody></tbody>';

        var tbody = table.querySelector('tbody');
        validQuotes.slice(0, 5).forEach(function(quote) {
          var row = document.createElement('tr');
          row.innerHTML =
            '<td>' + (quote.clientName || '') + '</td>' +
            '<td>' + (quote.clientLocation || '') + '</td>' +
            '<td>$' + quote.total.toFixed(2) + '</td>' +
            '<td>$' + quote.gstAmount.toFixed(2) + '</td>' +
            '<td>' + new Date(quote.date).toLocaleDateString() + '</td>';
          tbody.appendChild(row);
        });

        validSection.appendChild(table);
        container.appendChild(validSection);
      }

      // Show invalid quotes if any
      if (invalidQuotes.length > 0) {
        var invalidSection = document.createElement('div');
        invalidSection.className = 'csv-preview-section';
        invalidSection.innerHTML = '<h4>Invalid Quotes (will be skipped):</h4>';

        var errorList = document.createElement('ul');
        errorList.className = 'csv-error-list';

        invalidQuotes.slice(0, 5).forEach(function(item) {
          var li = document.createElement('li');
          li.textContent = (item.quote.clientName || 'Unknown') + ': ' + item.errors.join(', ');
          errorList.appendChild(li);
        });

        invalidSection.appendChild(errorList);
        container.appendChild(invalidSection);
      }

      // Store valid quotes for import
      previewQuotes = validQuotes;
    }

    // Back buttons
    modal.querySelector('#csvBackBtn').onclick = function() {
      modal.querySelector('#csvMappingStep').style.display = 'none';
      modal.querySelector('#csvUploadStep').style.display = 'block';
    };

    modal.querySelector('#csvBackToMappingBtn').onclick = function() {
      modal.querySelector('#csvPreviewStep').style.display = 'none';
      modal.querySelector('#csvMappingStep').style.display = 'block';
    };

    // Import button
    modal.querySelector('#csvImportBtn').onclick = function() {
      if (!previewQuotes || previewQuotes.length === 0) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('No valid quotes to import');
        }
        return;
      }

      var confirmMsg = 'Import ' + previewQuotes.length + ' quote(s) into quote history?';
      if (!confirm(confirmMsg)) {
        return;
      }

      importQuotes(previewQuotes);
    };

    // Import quotes into history
    function importQuotes(quotes) {
      try {
        if (window.LoadingState) {
          window.LoadingState.show('Importing ' + quotes.length + ' quote(s)...');
        }

        // Get existing history
        var historyStr = localStorage.getItem('quote-history');
        var history = historyStr ? JSON.parse(historyStr) : [];

        // Add imported quotes
        quotes.forEach(function(quote) {
          history.push(quote);
        });

        // Save back
        localStorage.setItem('quote-history', JSON.stringify(history));

        if (window.LoadingState) {
          window.LoadingState.hide();
        }

        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess(quotes.length + ' quote(s) imported successfully!');
        }

        // Close modal
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);

        // Reload if analytics page is open
        if (window.location.hash === '#analytics' || document.querySelector('.analytics-dashboard')) {
          setTimeout(function() {
            if (window.AnalyticsDashboard && window.AnalyticsDashboard.refresh) {
              window.AnalyticsDashboard.refresh();
            }
          }, 500);
        }

      } catch (error) {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Import failed: ' + error.message);
        }
      }
    }

    return modal;
  }

  // Export public API
  window.CSVImport = {
    showImportModal: showCSVImportModal,
    parseCSV: parseCSV,
    autoDetectMapping: autoDetectMapping
  };

  console.log('[CSV-IMPORT] CSV import module loaded');

})();
