// analytics.js - Quote history tracking and business analytics
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var HISTORY_KEY = 'quote-history';
  var MAX_HISTORY = 100; // Keep last 100 quotes

  // Save quote to history
  function saveQuoteToHistory() {
    try {
      if (!window.APP || !window.APP.getState) {
        return false;
      }

      var state = window.APP.getState();

      // Don't save if quote has no line items
      var hasItems = (state.windowLines && state.windowLines.length > 0) ||
                     (state.pressureLines && state.pressureLines.length > 0);

      if (!hasItems) {
        return false;
      }

      var history = loadHistory();

      // Get totals from DOM
      var totalText = document.getElementById('totalIncGstDisplay');
      var total = totalText ? parseFloat(totalText.textContent.replace(/[$,]/g, '')) : 0;

      var timeText = document.getElementById('timeEstimateDisplay');
      var timeMatch = timeText ? timeText.textContent.match(/([\d.]+)\s*hrs/) : null;
      var timeHours = timeMatch ? parseFloat(timeMatch[1]) : 0;

      // Create history entry
      var entry = {
        id: 'quote_' + Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString(),
        quoteTitle: state.quoteTitle || 'Untitled Quote',
        clientName: state.clientName || '',
        clientLocation: state.clientLocation || '',
        jobType: state.jobType || '',
        total: total,
        timeEstimate: timeHours,
        windowLineCount: state.windowLines ? state.windowLines.length : 0,
        pressureLineCount: state.pressureLines ? state.pressureLines.length : 0,
        gst: total * 0.1 / 1.1, // Calculate GST component
        subtotal: total / 1.1
      };

      // Add to beginning of array
      history.unshift(entry);

      // Limit to MAX_HISTORY
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }

      // Save
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Quote saved to history');
      }

      return true;
    } catch (error) {
      console.error('Failed to save quote to history:', error);
      return false;
    }
  }

  // Load history
  function loadHistory() {
    try {
      var stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  }

  // Get analytics data
  function getAnalytics(timeframe) {
    var history = loadHistory();
    var now = Date.now();
    var cutoff;

    // Determine cutoff time
    switch (timeframe) {
      case 'week':
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoff = now - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = 0; // all time
    }

    // Filter by timeframe
    var filtered = history.filter(function(entry) {
      return entry.timestamp >= cutoff;
    });

    if (filtered.length === 0) {
      return {
        totalQuotes: 0,
        totalRevenue: 0,
        averageQuote: 0,
        totalHours: 0,
        averageHours: 0,
        windowQuotes: 0,
        pressureQuotes: 0,
        mixedQuotes: 0,
        byJobType: {},
        revenueByMonth: {},
        topClients: []
      };
    }

    // Calculate statistics
    var totalRevenue = 0;
    var totalHours = 0;
    var windowQuotes = 0;
    var pressureQuotes = 0;
    var mixedQuotes = 0;
    var byJobType = {};
    var revenueByMonth = {};
    var clientRevenue = {};

    filtered.forEach(function(entry) {
      totalRevenue += entry.total || 0;
      totalHours += entry.timeEstimate || 0;

      // Count quote types
      if (entry.windowLineCount > 0 && entry.pressureLineCount > 0) {
        mixedQuotes++;
      } else if (entry.windowLineCount > 0) {
        windowQuotes++;
      } else if (entry.pressureLineCount > 0) {
        pressureQuotes++;
      }

      // By job type
      if (entry.jobType) {
        byJobType[entry.jobType] = (byJobType[entry.jobType] || 0) + 1;
      }

      // By month
      var date = new Date(entry.timestamp);
      var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + entry.total;

      // By client
      if (entry.clientName) {
        clientRevenue[entry.clientName] = (clientRevenue[entry.clientName] || 0) + entry.total;
      }
    });

    // Top clients
    var topClients = Object.keys(clientRevenue).map(function(name) {
      return { name: name, revenue: clientRevenue[name] };
    }).sort(function(a, b) {
      return b.revenue - a.revenue;
    }).slice(0, 10);

    return {
      totalQuotes: filtered.length,
      totalRevenue: totalRevenue,
      averageQuote: totalRevenue / filtered.length,
      totalHours: totalHours,
      averageHours: totalHours / filtered.length,
      windowQuotes: windowQuotes,
      pressureQuotes: pressureQuotes,
      mixedQuotes: mixedQuotes,
      byJobType: byJobType,
      revenueByMonth: revenueByMonth,
      topClients: topClients
    };
  }

  // Format currency
  function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Pad zero
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  // Render analytics dashboard
  function renderAnalyticsDashboard(timeframe) {
    var container = document.getElementById('analyticsContainer');
    if (!container) return;

    // Show loading state
    if (window.LoadingState) {
      window.LoadingState.showElement('analyticsContainer', 'Loading analytics...');
    }

    // Small delay to allow loading UI to render
    setTimeout(function() {
      var analytics = getAnalytics(timeframe || 'all');
      renderAnalyticsContent(container, analytics);
    }, 10);
  }

  // Render analytics content
  function renderAnalyticsContent(container, analytics) {

    var html = '<div class="analytics-dashboard">';

    // Summary cards
    html += '<div class="analytics-summary">';
    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Quotes</div>';
    html += '<div class="analytics-card-value">' + analytics.totalQuotes + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Revenue</div>';
    html += '<div class="analytics-card-value">' + formatCurrency(analytics.totalRevenue) + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Average Quote</div>';
    html += '<div class="analytics-card-value">' + formatCurrency(analytics.averageQuote) + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Hours</div>';
    html += '<div class="analytics-card-value">' + analytics.totalHours.toFixed(1) + ' hrs</div>';
    html += '</div>';
    html += '</div>';

    // Revenue trend chart
    if (Object.keys(analytics.revenueByMonth).length > 0) {
      html += '<div class="analytics-chart">';
      html += '<h3>Revenue Trend</h3>';
      html += '<canvas id="revenueTrendChart" style="max-height: 250px;"></canvas>';
      html += '</div>';
    }

    // Quote type chart
    if (analytics.totalQuotes > 0) {
      html += '<div class="analytics-chart-row">';
      html += '<div class="analytics-chart analytics-chart-half">';
      html += '<h3>Quote Types</h3>';
      html += '<canvas id="quoteTypeChart" style="max-height: 220px;"></canvas>';
      html += '</div>';

      // Top clients chart
      if (analytics.topClients.length > 0) {
        html += '<div class="analytics-chart analytics-chart-half">';
        html += '<h3>Top 5 Clients</h3>';
        html += '<canvas id="topClientsChart" style="max-height: 220px;"></canvas>';
        html += '</div>';
      }

      html += '</div>';
    }

    // Quote breakdown
    html += '<div class="analytics-breakdown">';
    html += '<h3>Quote Breakdown</h3>';
    html += '<ul>';
    html += '<li><span>Windows Only:</span> <strong>' + analytics.windowQuotes + '</strong></li>';
    html += '<li><span>Pressure Only:</span> <strong>' + analytics.pressureQuotes + '</strong></li>';
    html += '<li><span>Combined:</span> <strong>' + analytics.mixedQuotes + '</strong></li>';
    html += '</ul>';
    html += '</div>';

    // Top clients
    if (analytics.topClients.length > 0) {
      html += '<div class="analytics-clients">';
      html += '<h3>Top Clients</h3>';
      html += '<ul>';
      analytics.topClients.forEach(function(client) {
        html += '<li><span>' + client.name + '</span> <strong>' + formatCurrency(client.revenue) + '</strong></li>';
      });
      html += '</ul>';
      html += '</div>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Render charts
    if (window.AnalyticsCharts) {
      setTimeout(function() {
        window.AnalyticsCharts.renderAll(analytics);
      }, 50);
    }

    // Hide loading state
    if (window.LoadingState) {
      window.LoadingState.hideElement('analyticsContainer');
    }
  }

  // Clear history (with confirmation)
  function clearHistory() {
    if (confirm('This will delete all quote history. This cannot be undone. Continue?')) {
      try {
        localStorage.removeItem(HISTORY_KEY);
        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess('History cleared');
        }
        renderAnalyticsDashboard();
        return true;
      } catch (e) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Failed to clear history');
        }
        return false;
      }
    }
    return false;
  }

  // Export history to CSV
  function exportHistory() {
    var history = loadHistory();
    if (history.length === 0) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showWarning('No history to export');
      }
      return;
    }

    var csv = 'Date,Quote Title,Client Name,Location,Job Type,Total,GST,Subtotal,Hours,Window Lines,Pressure Lines\n';

    history.forEach(function(entry) {
      var date = new Date(entry.timestamp).toLocaleDateString();
      var row = [
        date,
        csvEscape(entry.quoteTitle),
        csvEscape(entry.clientName),
        csvEscape(entry.clientLocation),
        csvEscape(entry.jobType),
        entry.total.toFixed(2),
        entry.gst.toFixed(2),
        entry.subtotal.toFixed(2),
        entry.timeEstimate.toFixed(2),
        entry.windowLineCount,
        entry.pressureLineCount
      ];
      csv += row.join(',') + '\n';
    });

    // Download
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'quote-history_' + Date.now() + '.csv';
    link.click();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('History exported');
    }
  }

  function csvEscape(value) {
    if (!value) return '';
    var str = String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Initialize
  function init() {
    // Add Save to History button to export section
    var notesFooter = document.querySelector('.notes-footer');
    if (notesFooter) {
      var historyBtn = document.createElement('button');
      historyBtn.id = 'saveToHistoryBtn';
      historyBtn.type = 'button';
      historyBtn.className = 'btn btn-secondary';
      historyBtn.textContent = 'Save to History';
      historyBtn.onclick = saveQuoteToHistory;
      notesFooter.appendChild(historyBtn);
    }

    DEBUG.log('[ANALYTICS] Analytics initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.QuoteAnalytics = {
    save: saveQuoteToHistory,
    getHistory: loadHistory,
    getAnalytics: getAnalytics,
    renderDashboard: renderAnalyticsDashboard,
    exportHistory: exportHistory,
    clearHistory: clearHistory
  };

})();
