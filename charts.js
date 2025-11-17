// charts.js - Analytics charts using Chart.js
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var chartInstances = {}; // Store chart instances for cleanup

  // Render revenue trend chart
  function renderRevenueTrendChart(revenueByMonth) {
    var canvas = document.getElementById('revenueTrendChart');
    if (!canvas || !window.Chart) return;

    // Destroy existing chart
    if (chartInstances.revenueTrend) {
      chartInstances.revenueTrend.destroy();
    }

    var ctx = canvas.getContext('2d');
    var months = Object.keys(revenueByMonth).sort();
    var data = months.map(function(month) {
      return revenueByMonth[month];
    });

    // Format month labels
    var labels = months.map(function(month) {
      var parts = month.split('-');
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[parseInt(parts[1]) - 1] + ' ' + parts[0];
    });

    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';
    var gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';

    chartInstances.revenueTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: data,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return '$' + context.parsed.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
              display: false
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              },
              callback: function(value) {
                return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
          }
        }
      }
    });
  }

  // Render quote type breakdown chart
  function renderQuoteTypeChart(windowQuotes, pressureQuotes, mixedQuotes) {
    var canvas = document.getElementById('quoteTypeChart');
    if (!canvas || !window.Chart) return;

    // Destroy existing chart
    if (chartInstances.quoteType) {
      chartInstances.quoteType.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';

    chartInstances.quoteType = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Windows Only', 'Pressure Only', 'Combined'],
        datasets: [{
          data: [windowQuotes, pressureQuotes, mixedQuotes],
          backgroundColor: [
            'rgba(56, 189, 248, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            '#38bdf8',
            '#a855f7',
            '#22c55e'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: {
                size: 12
              },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                var label = context.label || '';
                var value = context.parsed;
                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                var percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return label + ': ' + value + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  // Render top clients chart
  function renderTopClientsChart(topClients) {
    var canvas = document.getElementById('topClientsChart');
    if (!canvas || !window.Chart || !topClients || topClients.length === 0) return;

    // Destroy existing chart
    if (chartInstances.topClients) {
      chartInstances.topClients.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';
    var gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';

    // Take top 5 clients
    var top5 = topClients.slice(0, 5);
    var labels = top5.map(function(client) {
      return client.name.length > 20 ? client.name.substr(0, 17) + '...' : client.name;
    });
    var data = top5.map(function(client) {
      return client.revenue;
    });

    chartInstances.topClients = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: data,
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: '#a855f7',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return '$' + context.parsed.x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              },
              callback: function(value) {
                return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
          },
          y: {
            grid: {
              color: gridColor,
              display: false
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  }

  // Render all analytics charts
  function renderAllCharts(analytics) {
    if (!analytics) return;

    // Revenue trend
    if (analytics.revenueByMonth && Object.keys(analytics.revenueByMonth).length > 0) {
      renderRevenueTrendChart(analytics.revenueByMonth);
    }

    // Quote type breakdown
    if (analytics.totalQuotes > 0) {
      renderQuoteTypeChart(analytics.windowQuotes, analytics.pressureQuotes, analytics.mixedQuotes);
    }

    // Top clients
    if (analytics.topClients && analytics.topClients.length > 0) {
      renderTopClientsChart(analytics.topClients);
    }
  }

  // Destroy all charts
  function destroyAllCharts() {
    Object.keys(chartInstances).forEach(function(key) {
      if (chartInstances[key]) {
        chartInstances[key].destroy();
      }
    });
    chartInstances = {};
  }

  // Update charts on theme change
  function updateChartsForTheme() {
    // Re-render all charts with new theme colors
    if (window.QuoteAnalytics && window.QuoteAnalytics.getAnalytics) {
      var analytics = window.QuoteAnalytics.getAnalytics('all');
      renderAllCharts(analytics);
    }
  }

  // Initialize
  function init() {
    // Listen for theme changes
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'data-theme') {
          updateChartsForTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    DEBUG.log('[CHARTS] Analytics charts initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.AnalyticsCharts = {
    renderAll: renderAllCharts,
    renderRevenueTrend: renderRevenueTrendChart,
    renderQuoteType: renderQuoteTypeChart,
    renderTopClients: renderTopClientsChart,
    destroyAll: destroyAllCharts
  };

})();
