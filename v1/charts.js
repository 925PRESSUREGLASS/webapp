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

  // Render quote status chart
  function renderQuoteStatusChart(quoteMetrics) {
    var canvas = document.getElementById('quoteStatusChart');
    if (!canvas || !window.Chart || !quoteMetrics) return;

    // Destroy existing chart
    if (chartInstances.quoteStatus) {
      chartInstances.quoteStatus.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';

    var statusData = quoteMetrics.byStatus || {};
    var labels = [];
    var data = [];
    var colors = [];

    var colorMap = {
      draft: 'rgba(156, 163, 175, 0.8)',
      sent: 'rgba(59, 130, 246, 0.8)',
      accepted: 'rgba(16, 185, 129, 0.8)',
      declined: 'rgba(239, 68, 68, 0.8)',
      expired: 'rgba(245, 158, 11, 0.8)',
      cancelled: 'rgba(107, 114, 128, 0.8)'
    };

    var borderColorMap = {
      draft: '#9ca3af',
      sent: '#3b82f6',
      accepted: '#10b981',
      declined: '#ef4444',
      expired: '#f59e0b',
      cancelled: '#6b7280'
    };

    Object.keys(statusData).forEach(function(status) {
      var statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      labels.push(statusLabel);
      data.push(statusData[status]);
      colors.push(colorMap[status] || 'rgba(156, 163, 175, 0.8)');
    });

    chartInstances.quoteStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: Object.keys(statusData).map(function(s) {
            return borderColorMap[s] || '#9ca3af';
          }),
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
              font: { size: 11 },
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)',
            borderWidth: 1,
            padding: 12
          }
        }
      }
    });
  }

  // Render conversion rate trend chart
  function renderConversionTrendChart(trendMetrics) {
    var canvas = document.getElementById('conversionTrendChart');
    if (!canvas || !window.Chart || !trendMetrics) return;

    // Destroy existing chart
    if (chartInstances.conversionTrend) {
      chartInstances.conversionTrend.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';
    var gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';

    var data = trendMetrics.conversionByMonth || [];
    var labels = data.map(function(d) {
      var parts = d.month.split('-');
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[parseInt(parts[1]) - 1] + ' ' + parts[0];
    });

    chartInstances.conversionTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Conversion Rate (%)',
          data: data.map(function(d) { return d.rate; }),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
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
                return context.parsed.y.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, display: false },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: function(value) {
                return value + '%';
              }
            },
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  // Render service mix chart
  function renderServiceMixChart(serviceMetrics) {
    var canvas = document.getElementById('serviceMixChart');
    if (!canvas || !window.Chart || !serviceMetrics) return;

    // Destroy existing chart
    if (chartInstances.serviceMix) {
      chartInstances.serviceMix.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';
    var gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';

    var services = serviceMetrics.popularServices || [];
    var labels = services.map(function(s) {
      var label = s.service.replace(/-/g, ' ');
      return label.charAt(0).toUpperCase() + label.slice(1);
    });

    chartInstances.serviceMix = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quote Count',
          data: services.map(function(s) { return s.count; }),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, display: false },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Render client type chart
  function renderClientTypeChart(revenueMetrics) {
    var canvas = document.getElementById('clientTypeChart');
    if (!canvas || !window.Chart || !revenueMetrics) return;

    // Destroy existing chart
    if (chartInstances.clientType) {
      chartInstances.clientType.destroy();
    }

    var ctx = canvas.getContext('2d');
    var isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';
    var textColor = isDarkTheme ? '#e5e7eb' : '#0f172a';

    var clientData = revenueMetrics.byClientType || {};
    var labels = [];
    var data = [];

    Object.keys(clientData).forEach(function(type) {
      var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      labels.push(typeLabel);
      data.push(clientData[type].won);
    });

    chartInstances.clientType = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b'
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
              font: { size: 11 },
              padding: 10
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
                return label + ': $' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

    // Backward compatible - old revenue chart
    if (analytics.revenueByMonth && Object.keys(analytics.revenueByMonth).length > 0) {
      renderRevenueTrendChart(analytics.revenueByMonth);
    }

    // Backward compatible - old quote type chart
    if (analytics.totalQuotes > 0) {
      renderQuoteTypeChart(analytics.windowQuotes, analytics.pressureQuotes, analytics.mixedQuotes);
    }

    // Backward compatible - old top clients chart
    if (analytics.topClients && analytics.topClients.length > 0) {
      renderTopClientsChart(analytics.topClients);
    }

    // New comprehensive charts
    if (analytics.quotes) {
      renderQuoteStatusChart(analytics.quotes);
    }

    if (analytics.trends) {
      renderConversionTrendChart(analytics.trends);
    }

    if (analytics.services) {
      renderServiceMixChart(analytics.services);
    }

    if (analytics.revenue) {
      renderClientTypeChart(analytics.revenue);
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
    renderQuoteStatus: renderQuoteStatusChart,
    renderConversionTrend: renderConversionTrendChart,
    renderServiceMix: renderServiceMixChart,
    renderClientType: renderClientTypeChart,
    destroyAll: destroyAllCharts
  };

})();
