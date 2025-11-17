// migration-monitoring.js - Monitoring, metrics, and alerting for migration
// iOS Safari compatible - ES5 JavaScript only
// Purpose: Track migration and sync health, alert on issues

(function() {
  'use strict';

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  var CONFIG = {
    metricsKey: 'tictacstick_migration_metrics',
    alertsKey: 'tictacstick_migration_alerts',
    enableConsoleLogging: true,
    enableAlerts: true,

    // Alert thresholds
    thresholds: {
      syncFailureRate: 0.10,      // 10% failure rate
      queueLength: 100,            // 100 items in queue
      syncLatency: 10000,          // 10 seconds
      conflictRate: 0.05           // 5% conflict rate
    }
  };

  // =============================================================================
  // METRICS STORAGE
  // =============================================================================

  var metrics = {
    // Sync metrics
    totalSyncAttempts: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflicts: 0,

    // Latency metrics (milliseconds)
    syncLatencies: [],
    averageSyncLatency: 0,
    p95SyncLatency: 0,
    p99SyncLatency: 0,

    // Queue metrics
    currentQueueLength: 0,
    maxQueueLength: 0,
    failedQueueLength: 0,

    // Migration metrics
    migrationCompleted: false,
    totalRecordsMigrated: 0,
    migrationDuration: 0,
    migrationIssues: [],

    // Time tracking
    lastSyncTime: null,
    lastUpdateTime: Date.now()
  };

  // =============================================================================
  // METRICS COLLECTION
  // =============================================================================

  /**
   * Load metrics from localStorage
   */
  function loadMetrics() {
    try {
      var stored = localStorage.getItem(CONFIG.metricsKey);
      if (stored) {
        var loaded = JSON.parse(stored);
        Object.keys(loaded).forEach(function(key) {
          metrics[key] = loaded[key];
        });
      }
    } catch (e) {
      DEBUG.error('[MONITORING] Failed to load metrics', e);
    }
  }

  /**
   * Save metrics to localStorage
   */
  function saveMetrics() {
    try {
      metrics.lastUpdateTime = Date.now();
      localStorage.setItem(CONFIG.metricsKey, JSON.stringify(metrics));
    } catch (e) {
      DEBUG.error('[MONITORING] Failed to save metrics', e);
    }
  }

  /**
   * Record a successful sync
   * @param {number} latency - Sync latency in milliseconds
   */
  function recordSyncSuccess(latency) {
    metrics.totalSyncAttempts++;
    metrics.successfulSyncs++;
    metrics.lastSyncTime = Date.now();

    if (latency) {
      recordLatency(latency);
    }

    saveMetrics();
    checkAlertThresholds();
  }

  /**
   * Record a failed sync
   * @param {Object} error - Error details
   */
  function recordSyncFailure(error) {
    metrics.totalSyncAttempts++;
    metrics.failedSyncs++;

    saveMetrics();
    checkAlertThresholds();

    DEBUG.error('[MONITORING] Sync failure recorded', error);
  }

  /**
   * Record a conflict
   * @param {string} entity - Entity type
   * @param {string} strategy - Resolution strategy used
   * @param {string} result - Resolution result
   */
  function recordConflict(entity, strategy, result) {
    metrics.conflicts++;

    saveMetrics();
    checkAlertThresholds();

    DEBUG.warn('[MONITORING] Conflict recorded: ' + entity + ' resolved via ' + strategy + ' → ' + result);
  }

  /**
   * Record sync latency
   * @param {number} latency - Latency in milliseconds
   */
  function recordLatency(latency) {
    metrics.syncLatencies.push(latency);

    // Keep only last 100 latencies
    if (metrics.syncLatencies.length > 100) {
      metrics.syncLatencies.shift();
    }

    // Calculate percentiles
    calculateLatencyPercentiles();
  }

  /**
   * Calculate latency percentiles
   */
  function calculateLatencyPercentiles() {
    if (metrics.syncLatencies.length === 0) {
      return;
    }

    var sorted = metrics.syncLatencies.slice().sort(function(a, b) {
      return a - b;
    });

    // Average
    var sum = sorted.reduce(function(a, b) { return a + b; }, 0);
    metrics.averageSyncLatency = Math.round(sum / sorted.length);

    // P95
    var p95Index = Math.floor(sorted.length * 0.95);
    metrics.p95SyncLatency = sorted[p95Index] || sorted[sorted.length - 1];

    // P99
    var p99Index = Math.floor(sorted.length * 0.99);
    metrics.p99SyncLatency = sorted[p99Index] || sorted[sorted.length - 1];
  }

  /**
   * Update queue metrics
   * @param {number} queueLength - Current queue length
   * @param {number} failedLength - Failed queue length
   */
  function updateQueueMetrics(queueLength, failedLength) {
    metrics.currentQueueLength = queueLength;
    metrics.failedQueueLength = failedLength;

    if (queueLength > metrics.maxQueueLength) {
      metrics.maxQueueLength = queueLength;
    }

    saveMetrics();
    checkAlertThresholds();
  }

  /**
   * Record migration completion
   * @param {Object} results - Migration results
   */
  function recordMigration(results) {
    metrics.migrationCompleted = true;
    metrics.totalRecordsMigrated = results.totalMigrated || 0;
    metrics.migrationDuration = results.duration || 0;
    metrics.migrationIssues = results.keys
      ? results.keys.filter(function(k) { return k.issues && k.issues.length > 0; })
      : [];

    saveMetrics();

    DEBUG.log('[MONITORING] Migration recorded: ' + metrics.totalRecordsMigrated + ' records in ' + metrics.migrationDuration + 'ms');
  }

  // =============================================================================
  // ALERTING
  // =============================================================================

  /**
   * Check if any alert thresholds are exceeded
   */
  function checkAlertThresholds() {
    if (!CONFIG.enableAlerts) {
      return;
    }

    // Sync failure rate
    if (metrics.totalSyncAttempts > 10) {
      var failureRate = metrics.failedSyncs / metrics.totalSyncAttempts;
      if (failureRate > CONFIG.thresholds.syncFailureRate) {
        recordAlert(
          'Sync failure rate high: ' + (failureRate * 100).toFixed(1) + '%',
          'critical',
          { failureRate: failureRate, threshold: CONFIG.thresholds.syncFailureRate }
        );
      }
    }

    // Queue length
    if (metrics.currentQueueLength > CONFIG.thresholds.queueLength) {
      recordAlert(
        'Sync queue backing up: ' + metrics.currentQueueLength + ' items',
        'warning',
        { queueLength: metrics.currentQueueLength, threshold: CONFIG.thresholds.queueLength }
      );
    }

    // Sync latency
    if (metrics.p95SyncLatency > CONFIG.thresholds.syncLatency) {
      recordAlert(
        'Sync latency high: ' + metrics.p95SyncLatency + 'ms (p95)',
        'warning',
        { latency: metrics.p95SyncLatency, threshold: CONFIG.thresholds.syncLatency }
      );
    }

    // Conflict rate
    if (metrics.totalSyncAttempts > 10) {
      var conflictRate = metrics.conflicts / metrics.totalSyncAttempts;
      if (conflictRate > CONFIG.thresholds.conflictRate) {
        recordAlert(
          'High conflict rate: ' + (conflictRate * 100).toFixed(1) + '%',
          'info',
          { conflictRate: conflictRate, threshold: CONFIG.thresholds.conflictRate }
        );
      }
    }
  }

  /**
   * Record an alert
   * @param {string} message - Alert message
   * @param {string} severity - critical, warning, info
   * @param {Object} data - Additional data
   */
  function recordAlert(message, severity, data) {
    var alerts = getAlerts();

    // Check if this alert was already recorded recently (within 1 hour)
    var recentlySent = alerts.some(function(alert) {
      return alert.message === message &&
             (Date.now() - alert.timestamp) < 3600000;
    });

    if (recentlySent) {
      return; // Don't spam same alert
    }

    var alert = {
      id: 'alert_' + Date.now(),
      message: message,
      severity: severity,
      data: data,
      timestamp: Date.now()
    };

    alerts.push(alert);

    // Keep only last 50 alerts
    if (alerts.length > 50) {
      alerts = alerts.slice(-50);
    }

    try {
      localStorage.setItem(CONFIG.alertsKey, JSON.stringify(alerts));
    } catch (e) {
      DEBUG.error('[MONITORING] Failed to save alert', e);
    }

    // Show user notification for critical alerts
    if (severity === 'critical' && window.ErrorHandler) {
      window.ErrorHandler.showError(message);
    }

    DEBUG.warn('[MONITORING] ALERT [' + severity + ']: ' + message, data);
  }

  /**
   * Get all alerts
   * @returns {Array} Array of alerts
   */
  function getAlerts() {
    try {
      var raw = localStorage.getItem(CONFIG.alertsKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear all alerts
   */
  function clearAlerts() {
    try {
      localStorage.setItem(CONFIG.alertsKey, JSON.stringify([]));
      DEBUG.log('[MONITORING] Alerts cleared');
    } catch (e) {
      DEBUG.error('[MONITORING] Failed to clear alerts', e);
    }
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  /**
   * Get system health status
   * @returns {Object} Health status
   */
  function getHealth() {
    var health = {
      status: 'healthy',
      issues: [],
      metrics: getMetrics()
    };

    // Check sync health
    if (metrics.totalSyncAttempts > 10) {
      var failureRate = metrics.failedSyncs / metrics.totalSyncAttempts;
      if (failureRate > CONFIG.thresholds.syncFailureRate) {
        health.status = 'degraded';
        health.issues.push('High sync failure rate: ' + (failureRate * 100).toFixed(1) + '%');
      }
    }

    // Check queue health
    if (metrics.currentQueueLength > CONFIG.thresholds.queueLength) {
      health.status = 'degraded';
      health.issues.push('Sync queue backing up: ' + metrics.currentQueueLength + ' items');
    }

    // Check failed queue
    if (metrics.failedQueueLength > 10) {
      health.status = 'degraded';
      health.issues.push('Failed queue has ' + metrics.failedQueueLength + ' items');
    }

    // Check if online
    if (window.StorageSync && !window.StorageSync.isOnline()) {
      health.status = 'offline';
      health.issues.push('Device is offline');
    }

    return health;
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  function getMetrics() {
    // Calculate derived metrics
    var failureRate = metrics.totalSyncAttempts > 0
      ? (metrics.failedSyncs / metrics.totalSyncAttempts)
      : 0;

    var successRate = metrics.totalSyncAttempts > 0
      ? (metrics.successfulSyncs / metrics.totalSyncAttempts)
      : 0;

    var conflictRate = metrics.totalSyncAttempts > 0
      ? (metrics.conflicts / metrics.totalSyncAttempts)
      : 0;

    return {
      // Raw metrics
      totalSyncAttempts: metrics.totalSyncAttempts,
      successfulSyncs: metrics.successfulSyncs,
      failedSyncs: metrics.failedSyncs,
      conflicts: metrics.conflicts,

      // Calculated metrics
      successRate: (successRate * 100).toFixed(1) + '%',
      failureRate: (failureRate * 100).toFixed(1) + '%',
      conflictRate: (conflictRate * 100).toFixed(1) + '%',

      // Latency metrics
      averageSyncLatency: metrics.averageSyncLatency + 'ms',
      p95SyncLatency: metrics.p95SyncLatency + 'ms',
      p99SyncLatency: metrics.p99SyncLatency + 'ms',

      // Queue metrics
      currentQueueLength: metrics.currentQueueLength,
      maxQueueLength: metrics.maxQueueLength,
      failedQueueLength: metrics.failedQueueLength,

      // Migration metrics
      migrationCompleted: metrics.migrationCompleted,
      totalRecordsMigrated: metrics.totalRecordsMigrated,
      migrationDuration: metrics.migrationDuration + 'ms',
      migrationIssues: metrics.migrationIssues.length,

      // Timestamps
      lastSyncTime: metrics.lastSyncTime ? new Date(metrics.lastSyncTime).toISOString() : null,
      lastUpdateTime: new Date(metrics.lastUpdateTime).toISOString()
    };
  }

  // =============================================================================
  // DASHBOARD UI
  // =============================================================================

  /**
   * Show monitoring dashboard
   */
  function showDashboard() {
    var modal = createDashboardModal();
    document.body.appendChild(modal);
    setTimeout(function() {
      modal.classList.add('active');
    }, 10);
  }

  /**
   * Create dashboard modal
   * @returns {HTMLElement} Modal element
   */
  function createDashboardModal() {
    var modal = document.createElement('div');
    modal.className = 'monitoring-modal';

    var health = getHealth();
    var metricsData = getMetrics();
    var alerts = getAlerts();

    var healthColor = health.status === 'healthy' ? '#22c55e' :
                     health.status === 'degraded' ? '#f59e0b' : '#ef4444';

    var html = '<div class="monitoring-modal-content">';
    html += '<div class="monitoring-modal-header">';
    html += '<h2>Migration & Sync Status</h2>';
    html += '<button type="button" class="monitoring-modal-close" onclick="this.closest(\'.monitoring-modal\').remove()">&times;</button>';
    html += '</div>';
    html += '<div class="monitoring-modal-body">';

    // Health status
    html += '<div class="health-status" style="background-color: ' + healthColor + ';">';
    html += '<h3>System Health: ' + health.status.toUpperCase() + '</h3>';
    if (health.issues.length > 0) {
      html += '<ul>';
      health.issues.forEach(function(issue) {
        html += '<li>' + issue + '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';

    // Metrics
    html += '<div class="metrics-grid">';
    html += '<div class="metric-card">';
    html += '<h4>Sync Success Rate</h4>';
    html += '<div class="metric-value">' + metricsData.successRate + '</div>';
    html += '<div class="metric-detail">Total attempts: ' + metricsData.totalSyncAttempts + '</div>';
    html += '</div>';

    html += '<div class="metric-card">';
    html += '<h4>Sync Latency (p95)</h4>';
    html += '<div class="metric-value">' + metricsData.p95SyncLatency + '</div>';
    html += '<div class="metric-detail">Avg: ' + metricsData.averageSyncLatency + '</div>';
    html += '</div>';

    html += '<div class="metric-card">';
    html += '<h4>Queue Length</h4>';
    html += '<div class="metric-value">' + metricsData.currentQueueLength + '</div>';
    html += '<div class="metric-detail">Failed: ' + metricsData.failedQueueLength + '</div>';
    html += '</div>';

    html += '<div class="metric-card">';
    html += '<h4>Conflicts</h4>';
    html += '<div class="metric-value">' + metricsData.conflicts + '</div>';
    html += '<div class="metric-detail">Rate: ' + metricsData.conflictRate + '</div>';
    html += '</div>';
    html += '</div>';

    // Alerts
    if (alerts.length > 0) {
      html += '<div class="alerts-section">';
      html += '<h3>Recent Alerts</h3>';
      alerts.slice(-10).reverse().forEach(function(alert) {
        var alertColor = alert.severity === 'critical' ? '#ef4444' :
                        alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';
        html += '<div class="alert-item" style="border-left: 4px solid ' + alertColor + ';">';
        html += '<div class="alert-severity">' + alert.severity.toUpperCase() + '</div>';
        html += '<div class="alert-message">' + alert.message + '</div>';
        html += '<div class="alert-time">' + new Date(alert.timestamp).toLocaleString() + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    modal.innerHTML = html;
    return modal;
  }

  // =============================================================================
  // PERIODIC HEALTH CHECK
  // =============================================================================

  /**
   * Start periodic health checks
   */
  function startHealthCheck() {
    setInterval(function() {
      // Update queue metrics
      if (window.StorageSync) {
        var queue = window.StorageSync.getSyncQueue();
        var failed = window.StorageSync.getFailedQueue();
        updateQueueMetrics(queue.length, failed.length);
      }

      // Check thresholds
      checkAlertThresholds();
    }, 30000); // Every 30 seconds
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize monitoring module
   */
  function init() {
    loadMetrics();
    startHealthCheck();

    // Listen for migration completion
    window.addEventListener('migration-complete', function(e) {
      if (e.detail && e.detail.results) {
        recordMigration(e.detail.results);
      }
    });

    DEBUG.log('[MONITORING] Module initialized');
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  window.MigrationMonitoring = {
    // Recording
    recordSyncSuccess: recordSyncSuccess,
    recordSyncFailure: recordSyncFailure,
    recordConflict: recordConflict,
    recordMigration: recordMigration,
    recordAlert: recordAlert,

    // Metrics
    getMetrics: getMetrics,
    getHealth: getHealth,

    // Alerts
    getAlerts: getAlerts,
    clearAlerts: clearAlerts,

    // UI
    showDashboard: showDashboard,

    // Configuration
    configure: function(config) {
      Object.keys(config).forEach(function(key) {
        if (CONFIG.hasOwnProperty(key)) {
          CONFIG[key] = config[key];
        }
      });
    }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  DEBUG.log('[MONITORING] Module loaded');

})();
