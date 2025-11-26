// export.js - Enhanced export functionality (CSV, Excel-compatible)
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // Export to CSV
  function exportToCSV() {
    try {
      // Show loading state
      if (window.LoadingState) {
        window.LoadingState.setButtonLoading('exportCsvBtn', true);
      }

      var state = window.APP ? window.APP.getState() : null;
      if (!state) {
        if (window.LoadingState) {
          window.LoadingState.setButtonLoading('exportCsvBtn', false);
        }
        showError('Unable to access quote data');
        return;
      }

      var csvContent = generateCSVContent(state);
      var filename = generateFilename('csv');
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');

      // Hide loading state
      if (window.LoadingState) {
        window.LoadingState.setButtonLoading('exportCsvBtn', false);
      }

      if (window.KeyboardShortcuts) {
        window.KeyboardShortcuts.showToast('Quote exported to CSV', 'success');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      // Hide loading state on error
      if (window.LoadingState) {
        window.LoadingState.setButtonLoading('exportCsvBtn', false);
      }
      showError('Failed to export CSV: ' + error.message);
    }
  }

  // Generate CSV content
  function generateCSVContent(state) {
    var lines = [];
    var quote = state || {};

    // Header
    lines.push('QUOTE EXPORT - TIC-TAC-STICK QUOTE ENGINE');
    lines.push('925 Pressure Glass - Window & Pressure Cleaning');
    lines.push('');

    // Quote metadata
    lines.push('Quote Information');
    lines.push('Field,Value');
    lines.push(csvEscape('Quote Title') + ',' + csvEscape(quote.quoteTitle || ''));
    lines.push(csvEscape('Client Name') + ',' + csvEscape(quote.clientName || ''));
    lines.push(csvEscape('Client Location') + ',' + csvEscape(quote.clientLocation || ''));
    lines.push(csvEscape('Job Type') + ',' + csvEscape(quote.jobType || ''));
    lines.push(csvEscape('Date Generated') + ',' + csvEscape(new Date().toLocaleDateString()));
    lines.push('');

    // Configuration
    lines.push('Job Settings');
    lines.push('Setting,Value');
    lines.push('Base Callout Fee,$' + (quote.baseFee || 0));
    lines.push('Hourly Rate (Windows),$' + (quote.hourlyRate || 0));
    lines.push('Hourly Rate (Pressure),$' + (quote.pressureHourlyRate || 0));
    lines.push('Minimum Job Charge,$' + (quote.minimumJob || 0));
    lines.push('High Reach Modifier,' + (quote.highReachModifierPercent || 0) + '%');
    lines.push('Inside Multiplier,' + (quote.insideMultiplier || 1));
    lines.push('Outside Multiplier,' + (quote.outsideMultiplier || 1));
    lines.push('Setup Buffer,' + (quote.setupBufferMinutes || 0) + ' mins');
    lines.push('Travel Time,' + (quote.travelMinutes || 0) + ' mins');
    lines.push('Travel Distance,' + (quote.travelKm || 0) + ' km');
    lines.push('Travel Rate (/hr),$' + (quote.travelRatePerHour || 0));
    lines.push('Travel Rate (/km),$' + (quote.travelRatePerKm || 0));
    lines.push('');

    // Window lines
    if (quote.windowLines && quote.windowLines.length > 0) {
      lines.push('Window Cleaning Lines');
      lines.push('Window Type,Quantity,Inside,Outside,High Reach,Soil Level,Tint Level');

      quote.windowLines.forEach(function(line) {
        var row = [
          csvEscape(line.windowType || ''),
          line.quantity || 0,
          line.insideChecked ? 'Yes' : 'No',
          line.outsideChecked ? 'Yes' : 'No',
          line.highReachChecked ? 'Yes' : 'No',
          csvEscape(line.soilLevel || 'medium'),
          csvEscape(line.tintLevel || 'none')
        ];
        lines.push(row.join(','));
      });
      lines.push('');
    }

    // Pressure lines
    if (quote.pressureLines && quote.pressureLines.length > 0) {
      lines.push('Pressure Cleaning Lines');
      lines.push('Surface Type,Area (sqm),Soil Level,Access Difficulty');

      quote.pressureLines.forEach(function(line) {
        var row = [
          csvEscape(line.surfaceType || ''),
          line.areaSqm || 0,
          csvEscape(line.soilLevel || 'medium'),
          csvEscape(line.accessDifficulty || 'easy')
        ];
        lines.push(row.join(','));
      });
      lines.push('');
    }

    // Summary (prefer fresh calculation, fallback to DOM snapshot)
    var calcSummary = calculateQuote(state);
    var summary = calcSummary || getQuoteSummary();
    if (summary) {
      lines.push('Quote Summary');
      lines.push('Item,Amount');
      lines.push('Base Callout,' + summary.baseFee);
      lines.push('Windows Labour,' + summary.windows);
      lines.push('Pressure Labour,' + summary.pressure);
      lines.push('High Reach Premium,' + summary.highReach);
      lines.push('Setup Buffer,' + summary.setup);
      lines.push('Travel,' + summary.travel);
      lines.push('Other Adjustments,' + summary.otherAdjustments);
      lines.push('Subtotal (excl. GST),' + summary.subtotal);
      lines.push('GST (10%),' + summary.gst);
      if (summary.minimumApplied) {
        lines.push('Minimum Job Applied,' + summary.minimumApplied);
      }
      lines.push('Final Total (incl. GST),' + summary.total);
      lines.push('');
      lines.push('Time Estimate,' + summary.timeEstimate);
      lines.push('Windows Time,' + summary.windowsTime);
      lines.push('Pressure Time,' + summary.pressureTime);
      lines.push('Setup Time,' + summary.setupTime);
      lines.push('Travel Time,' + summary.travelTime);
      lines.push('High Reach Time,' + summary.highReachTime);
      lines.push('');
    }

    // Notes
    if (quote.internalNotes || quote.clientNotes) {
      lines.push('Notes');
      if (quote.internalNotes) {
        lines.push('Internal Notes,' + csvEscape(quote.internalNotes));
      }
      if (quote.clientNotes) {
        lines.push('Client Notes,' + csvEscape(quote.clientNotes));
      }
    }

    return lines.join('\n');
  }

  // Get quote summary from DOM
  function getQuoteSummary() {
    try {
      var subtotal = getElementText('subtotalDisplay');
      var highReach = getElementText('highReachDisplay');
      var gst = getElementText('gstDisplay');
      var total = getElementText('totalIncGstDisplay');
      var baseFee = getElementText('baseFeeDisplay');
      var windows = getElementText('windowsCostDisplay');
      var pressure = getElementText('pressureCostDisplay');
      var setup = getElementText('setupCostDisplay') || '0';
      var travel = getElementText('travelCostDisplay') || '0';
      var otherAdjustments = getElementText('otherAdjustmentsDisplay') || '0';
      var minimumApplied = '';
      var minNote = document.getElementById('minimumAppliedNote');
      if (minNote && minNote.style.display !== 'none') {
        minimumApplied = getElementText('minimumAppliedValue');
      }

      return {
        baseFee: baseFee,
        windows: windows,
        pressure: pressure,
        highReach: highReach,
        setup: setup,
        travel: travel,
        otherAdjustments: otherAdjustments,
        subtotal: subtotal,
        gst: gst,
        total: total,
        minimumApplied: minimumApplied,
        timeEstimate: getElementText('timeEstimateDisplay'),
        windowsTime: getElementText('windowsTimeDisplay'),
        pressureTime: getElementText('pressureTimeDisplay'),
        setupTime: getElementText('setupTimeDisplay'),
        travelTime: getElementText('travelTimeDisplay'),
        highReachTime: getElementText('highReachTimeDisplay')
      };
    } catch (e) {
      return null;
    }
  }

  // Calculate totals directly from state when available
  function calculateQuote(state) {
    if (!state) return null;
    var result = null;
    try {
      if (window.PrecisionCalc && typeof PrecisionCalc.calculate === 'function') {
        result = PrecisionCalc.calculate({
          windowLines: state.windowLines || [],
          pressureLines: state.pressureLines || [],
          baseFee: state.baseFee,
          hourlyRate: state.hourlyRate,
          minimumJob: state.minimumJob,
          highReachModifierPercent: state.highReachModifierPercent,
          insideMultiplier: state.insideMultiplier,
          outsideMultiplier: state.outsideMultiplier,
          pressureHourlyRate: state.pressureHourlyRate,
          setupBufferMinutes: state.setupBufferMinutes,
          travelMinutes: state.travelMinutes,
          travelKm: state.travelKm,
          travelRatePerHour: state.travelRatePerHour,
          travelRatePerKm: state.travelRatePerKm
        });
      } else if (window.Calc && typeof Calc.calculate === 'function') {
        result = Calc.calculate(state);
      }
    } catch (e) {
      // ignore and fallback
      result = null;
    }

    if (!result || !result.money || !result.time) return null;

    var money = result.money;
    var time = result.time;
    var gst = (money.subtotal || 0) * 0.10;
    var minApplied = '';
    if (money.total > money.subtotal) {
      minApplied = formatMoney(money.minimumJob || money.total);
    }

    return {
      baseFee: formatMoney(money.baseFee || 0),
      windows: formatMoney(money.windows || 0),
      pressure: formatMoney(money.pressure || 0),
      highReach: formatMoney(money.highReach || 0),
      setup: formatMoney(money.setup || 0),
      travel: formatMoney(money.travel || 0),
      otherAdjustments: formatMoney((money.setup || 0) + (money.travel || 0)),
      subtotal: formatMoney(money.subtotal || 0),
      gst: formatMoney(gst),
      total: formatMoney((money.total || 0) + gst),
      minimumApplied: minApplied,
      timeEstimate: formatHours(time.totalHours),
      windowsTime: formatHours(time.windowsHours),
      pressureTime: formatHours(time.pressureHours),
      setupTime: formatHours(time.setupHours),
      travelTime: formatHours(time.travelHours),
      highReachTime: formatHours(time.highReachHours)
    };
  }

  function formatMoney(value) {
    var n = parseFloat(value);
    if (isNaN(n)) n = 0;
    return '$' + n.toFixed(2);
  }

  function formatHours(value) {
    var n = parseFloat(value);
    if (isNaN(n)) n = 0;
    return n.toFixed(2) + ' hrs';
  }

  // Helper to get element text
  function getElementText(id) {
    var el = document.getElementById(id);
    return el ? el.textContent.trim() : '';
  }

  // CSV escape
  function csvEscape(value) {
    if (value === null || value === undefined) return '';
    var str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Generate filename
  function generateFilename(extension) {
    var state = window.APP ? window.APP.getState() : null;
    var clientName = state && state.clientName ? state.clientName : 'Quote';
    var date = new Date();
    var dateStr = date.getFullYear() + '-' +
      padZero(date.getMonth() + 1) + '-' +
      padZero(date.getDate());

    // Clean filename
    var cleanName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return 'quote_' + cleanName + '_' + dateStr + '.' + extension;
  }

  // Pad single digit with zero
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  // Download file
  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var link = document.createElement('a');

    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(function() {
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  }

  // Show error message
  function showError(message) {
    if (window.KeyboardShortcuts) {
      window.KeyboardShortcuts.showToast(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }

  // Export quote comparison (multiple quotes)
  function exportQuoteComparison(quotes) {
    try {
      if (!quotes || quotes.length === 0) {
        showError('No quotes to compare');
        return;
      }

      var csvContent = generateComparisonCSV(quotes);
      var filename = 'quote_comparison_' + new Date().getTime() + '.csv';
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');

      if (window.KeyboardShortcuts) {
        window.KeyboardShortcuts.showToast('Comparison exported', 'success');
      }
    } catch (error) {
      console.error('Comparison export error:', error);
      showError('Failed to export comparison: ' + error.message);
    }
  }

  // Generate comparison CSV
  function generateComparisonCSV(quotes) {
    var lines = [];

    lines.push('QUOTE COMPARISON');
    lines.push('');

    // Headers
    var headers = ['Metric'];
    quotes.forEach(function(quote, index) {
      headers.push('Quote ' + (index + 1) + ' - ' + csvEscape(quote.quoteTitle || 'Untitled'));
    });
    lines.push(headers.join(','));

    // Client names
    var clientRow = ['Client Name'];
    quotes.forEach(function(quote) {
      clientRow.push(csvEscape(quote.clientName || ''));
    });
    lines.push(clientRow.join(','));

    // Totals
    var totalRow = ['Total Amount'];
    quotes.forEach(function(quote) {
      totalRow.push('$' + (quote.total || 0));
    });
    lines.push(totalRow.join(','));

    // Window count
    var windowCountRow = ['Window Lines'];
    quotes.forEach(function(quote) {
      windowCountRow.push(quote.windowLines ? quote.windowLines.length : 0);
    });
    lines.push(windowCountRow.join(','));

    // Pressure count
    var pressureCountRow = ['Pressure Lines'];
    quotes.forEach(function(quote) {
      pressureCountRow.push(quote.pressureLines ? quote.pressureLines.length : 0);
    });
    lines.push(pressureCountRow.join(','));

    return lines.join('\n');
  }

  // Initialize export functionality
  function init() {
    // Add export button if not exists
    var notesFooter = document.querySelector('.notes-footer');
    if (notesFooter) {
      var csvBtn = document.createElement('button');
      csvBtn.id = 'exportCsvBtn';
      csvBtn.type = 'button';
      csvBtn.className = 'btn btn-secondary';
      csvBtn.textContent = 'Export to CSV/Excel';
      csvBtn.onclick = exportToCSV;
      notesFooter.appendChild(csvBtn);
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.QuoteExport = {
    toCSV: exportToCSV,
    compareQuotes: exportQuoteComparison
  };

})();
