// quote-workflow.js - Quote status tracking and workflow management
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var QUOTE_STATUSES = {
    draft: { label: 'Draft', color: '#94a3b8', icon: '📝' },
    sent: { label: 'Sent', color: '#38bdf8', icon: '📤' },
    accepted: { label: 'Accepted', color: '#22c55e', icon: '✓' },
    declined: { label: 'Declined', color: '#ef4444', icon: '✗' },
    scheduled: { label: 'Scheduled', color: '#a855f7', icon: '📅' },
    completed: { label: 'Completed', color: '#10b981', icon: '✓✓' }
  };

  // Add status field to quote when saving
  function enhanceQuoteSave(originalSaveFunction) {
    return function() {
      // Call original save
      var result = originalSaveFunction.apply(this, arguments);

      // Add status to saved data
      var currentStatus = getCurrentStatus();
      if (currentStatus && window.APP && window.APP.getState) {
        var state = window.APP.getState();
        state.quoteStatus = currentStatus;
        state.statusUpdatedAt = Date.now();
      }

      return result;
    };
  }

  // Get current quote status from localStorage or default to draft
  function getCurrentStatus() {
    try {
      var status = localStorage.getItem('current-quote-status');
      return status && QUOTE_STATUSES[status] ? status : 'draft';
    } catch (e) {
      return 'draft';
    }
  }

  // Set current quote status
  function setCurrentStatus(status) {
    if (!QUOTE_STATUSES[status]) {
      console.error('Invalid status:', status);
      return false;
    }

    try {
      localStorage.setItem('current-quote-status', status);
      updateStatusDisplay();

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Status updated to: ' + QUOTE_STATUSES[status].label);
      }

      return true;
    } catch (e) {
      console.error('Failed to save status:', e);
      return false;
    }
  }

  // Update status display in UI
  function updateStatusDisplay() {
    var status = getCurrentStatus();
    var statusData = QUOTE_STATUSES[status];
    var statusBadge = document.getElementById('quoteStatusBadge');

    if (statusBadge) {
      statusBadge.textContent = statusData.icon + ' ' + statusData.label;
      statusBadge.style.backgroundColor = statusData.color;
    }
  }

  // Show status selector modal
  function showStatusSelector() {
    var modal = createStatusModal();
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create status selector modal
  function createStatusModal() {
    var existing = document.getElementById('statusModal');
    if (existing) {
      existing.remove();
    }

    var currentStatus = getCurrentStatus();
    var modal = document.createElement('div');
    modal.id = 'statusModal';
    modal.className = 'status-modal';

    var html = '<div class="status-modal-content">';
    html += '<div class="status-modal-header">';
    html += '<h2>Update Quote Status</h2>';
    html += '<button type="button" class="status-modal-close" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="status-modal-body">';
    html += '<div class="status-grid">';

    Object.keys(QUOTE_STATUSES).forEach(function(key) {
      var statusData = QUOTE_STATUSES[key];
      var isActive = key === currentStatus;
      html += '<button type="button" class="status-option' + (isActive ? ' active' : '') + '" ';
      html += 'data-status="' + key + '" ';
      html += 'style="border-color: ' + statusData.color + ';">';
      html += '<div class="status-icon" style="color: ' + statusData.color + ';">' + statusData.icon + '</div>';
      html += '<div class="status-label">' + statusData.label + '</div>';
      if (isActive) {
        html += '<div class="status-check">✓</div>';
      }
      html += '</button>';
    });

    html += '</div>';
    html += '</div>';
    html += '</div>';

    modal.innerHTML = html;

    // Event listeners
    modal.querySelector('.status-modal-close').onclick = function() {
      modal.classList.remove('active');
      setTimeout(function() { modal.remove(); }, 300);
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      }
    };

    var statusOptions = modal.querySelectorAll('.status-option');
    for (var i = 0; i < statusOptions.length; i++) {
      statusOptions[i].onclick = function() {
        var newStatus = this.getAttribute('data-status');
        setCurrentStatus(newStatus);
        modal.classList.remove('active');
        setTimeout(function() { modal.remove(); }, 300);
      };
    }

    return modal;
  }

  // Add status badge to header
  function addStatusBadge() {
    var header = document.querySelector('.hdr-row:first-child');
    if (!header) return;

    var badge = document.createElement('button');
    badge.type = 'button';
    badge.id = 'quoteStatusBadge';
    badge.className = 'quote-status-badge';
    badge.onclick = showStatusSelector;
    badge.title = 'Click to change quote status';

    header.appendChild(badge);
    updateStatusDisplay();
  }

  // Get conversion metrics
  function getConversionMetrics() {
    if (!window.QuoteAnalytics) {
      return null;
    }

    var history = window.QuoteAnalytics.getHistory();
    var metrics = {
      total: history.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      declined: 0,
      scheduled: 0,
      completed: 0,
      conversionRate: 0,
      declineRate: 0
    };

    history.forEach(function(quote) {
      var status = quote.quoteStatus || 'draft';
      if (metrics.hasOwnProperty(status)) {
        metrics[status]++;
      }
    });

    var sentTotal = metrics.sent + metrics.accepted + metrics.declined + metrics.scheduled + metrics.completed;
    if (sentTotal > 0) {
      metrics.conversionRate = ((metrics.accepted + metrics.scheduled + metrics.completed) / sentTotal * 100).toFixed(1);
      metrics.declineRate = (metrics.declined / sentTotal * 100).toFixed(1);
    }

    return metrics;
  }

  // Enhance analytics to include conversion metrics
  function enhanceAnalytics() {
    if (!window.QuoteAnalytics || !window.QuoteAnalytics.renderDashboard) {
      return;
    }

    var originalRender = window.QuoteAnalytics.renderDashboard;
    window.QuoteAnalytics.renderDashboard = function(timeframe) {
      originalRender.call(this, timeframe);

      // Add conversion metrics section
      setTimeout(function() {
        var container = document.getElementById('analyticsContainer');
        if (!container) return;

        var metrics = getConversionMetrics();
        if (!metrics) return;

        var metricsHtml = '<div class="conversion-metrics">';
        metricsHtml += '<h3>Quote Pipeline</h3>';
        metricsHtml += '<div class="pipeline-stats">';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #94a3b8;">Draft</span> <strong>' + metrics.draft + '</strong></div>';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #38bdf8;">Sent</span> <strong>' + metrics.sent + '</strong></div>';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #22c55e;">Accepted</span> <strong>' + metrics.accepted + '</strong></div>';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #a855f7;">Scheduled</span> <strong>' + metrics.scheduled + '</strong></div>';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #10b981;">Completed</span> <strong>' + metrics.completed + '</strong></div>';
        metricsHtml += '<div class="pipeline-stat"><span style="color: #ef4444;">Declined</span> <strong>' + metrics.declined + '</strong></div>';
        metricsHtml += '</div>';
        metricsHtml += '<div class="conversion-rates">';
        metricsHtml += '<div class="conversion-rate"><span>Win Rate:</span> <strong style="color: #22c55e;">' + metrics.conversionRate + '%</strong></div>';
        metricsHtml += '<div class="conversion-rate"><span>Decline Rate:</span> <strong style="color: #ef4444;">' + metrics.declineRate + '%</strong></div>';
        metricsHtml += '</div>';
        metricsHtml += '</div>';

        var analyticsContent = container.querySelector('.analytics-dashboard');
        if (analyticsContent) {
          var metricsDiv = document.createElement('div');
          metricsDiv.innerHTML = metricsHtml;
          analyticsContent.insertBefore(metricsDiv.firstChild, analyticsContent.firstChild.nextSibling);
        }
      }, 100);
    };
  }

  // Initialize
  function init() {
    addStatusBadge();
    enhanceAnalytics();
    DEBUG.log('[WORKFLOW] Quote workflow initialized - Status: ' + getCurrentStatus());
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
      addStatusBadge();
      updateStatusDisplay();
    }, 500);
  });

  // Export public API
  window.QuoteWorkflow = {
    getCurrentStatus: getCurrentStatus,
    setStatus: setCurrentStatus,
    showStatusSelector: showStatusSelector,
    getMetrics: getConversionMetrics,
    statuses: QUOTE_STATUSES
  };

})();
