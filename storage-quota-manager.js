// storage-quota-manager.js - LocalStorage Quota Management
// Monitors usage, provides cleanup utilities, and warns before quota exceeded
// ES5 compatible for iOS Safari 12+

(function() {
  'use strict';

  var QUOTA_WARNING_THRESHOLD = 75; // Warn at 75% usage
  var QUOTA_CRITICAL_THRESHOLD = 90; // Critical at 90% usage
  var ESTIMATED_QUOTA_MB = 5; // iOS Safari typical quota

  /**
   * Calculate current LocalStorage usage
   */
  function calculateUsage() {
    if (!window.localStorage) {
      return {
        usedBytes: 0,
        usedMB: 0,
        quotaBytes: 0,
        quotaMB: 0,
        usagePercent: 0,
        itemCount: 0
      };
    }

    try {
      var totalBytes = 0;
      var itemCount = 0;

      for (var key in localStorage) {
        var value = localStorage[key];
        // UTF-16: 2 bytes per character
        totalBytes += (key.length + value.length) * 2;
        itemCount++;
      }

      var quotaBytes = ESTIMATED_QUOTA_MB * 1024 * 1024;
      var usagePercent = (totalBytes / quotaBytes) * 100;

      return {
        usedBytes: totalBytes,
        usedMB: totalBytes / (1024 * 1024),
        quotaBytes: quotaBytes,
        quotaMB: ESTIMATED_QUOTA_MB,
        usagePercent: usagePercent,
        itemCount: itemCount,
        availableMB: (quotaBytes - totalBytes) / (1024 * 1024)
      };
    } catch (e) {
      console.error('[STORAGE-QUOTA] Usage calculation failed:', e);
      return null;
    }
  }

  /**
   * Get breakdown of storage by key prefix
   */
  function getStorageBreakdown() {
    var breakdown = {};
    var totalSize = 0;

    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        var prefix = key.split('-')[0] || 'other';
        var size = (key.length + localStorage[key].length) * 2;

        if (!breakdown[prefix]) {
          breakdown[prefix] = {
            count: 0,
            bytes: 0,
            mb: 0,
            percent: 0
          };
        }

        breakdown[prefix].count++;
        breakdown[prefix].bytes += size;
        totalSize += size;
      }
    }

    // Calculate percentages (handle empty storage)
    if (totalSize > 0) {
      for (var pfx in breakdown) {
        if (breakdown.hasOwnProperty(pfx)) {
          breakdown[pfx].mb = breakdown[pfx].bytes / (1024 * 1024);
          breakdown[pfx].percent = (breakdown[pfx].bytes / totalSize) * 100;
        }
      }
    }

    return breakdown;
  }

  /**
   * Find largest items in LocalStorage
   */
  function getLargestItems(limit) {
    limit = limit || 10;
    var items = [];

    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        var size = (key.length + localStorage[key].length) * 2;
        items.push({
          key: key,
          bytes: size,
          mb: size / (1024 * 1024),
          preview: localStorage[key].substring(0, 50)
        });
      }
    }

    // Sort by size descending
    items.sort(function(a, b) {
      return b.bytes - a.bytes;
    });

    return items.slice(0, limit);
  }

  /**
   * Clean up old quote history (keep most recent N)
   */
  function cleanupQuoteHistory(keepCount) {
    keepCount = keepCount || 100;

    try {
      var historyKey = 'quote-history';
      var historyStr = localStorage.getItem(historyKey);
      
      if (!historyStr) {
        return { removed: 0, kept: 0 };
      }

      var history = JSON.parse(historyStr);
      
      if (!Array.isArray(history) || history.length <= keepCount) {
        return { removed: 0, kept: history.length };
      }

      // Sort by date (newest first) and keep only recent ones
      history.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      var removed = history.length - keepCount;
      var cleaned = history.slice(0, keepCount);

      localStorage.setItem(historyKey, JSON.stringify(cleaned));

      console.log('[STORAGE-QUOTA] Cleaned up ' + removed + ' old quote(s), kept ' + keepCount);
      
      return { removed: removed, kept: keepCount };
    } catch (e) {
      console.error('[STORAGE-QUOTA] Quote cleanup failed:', e);
      return { removed: 0, kept: 0, error: e.message };
    }
  }

  /**
   * Remove items older than specified days
   */
  function cleanupOldData(daysOld) {
    daysOld = daysOld || 365;
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    var removed = [];

    try {
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          var value = localStorage[key];
          
          try {
            var data = JSON.parse(value);
            
            // Check if data has a date field
            if (data && data.date) {
              var itemDate = new Date(data.date);
              
              if (itemDate < cutoffDate) {
                localStorage.removeItem(key);
                removed.push(key);
              }
            }
          } catch (e) {
            // Not JSON or no date field, skip
            continue;
          }
        }
      }

      if (removed.length > 0) {
        console.log('[STORAGE-QUOTA] Removed ' + removed.length + ' item(s) older than ' + daysOld + ' days');
      }

      return { removed: removed.length, keys: removed };
    } catch (e) {
      console.error('[STORAGE-QUOTA] Old data cleanup failed:', e);
      return { removed: 0, keys: [], error: e.message };
    }
  }

  /**
   * Compress data before storing (remove whitespace from JSON)
   */
  function compressForStorage(obj) {
    return JSON.stringify(obj); // No whitespace
  }

  /**
   * Check if adding data would exceed quota
   */
  function canStoreData(dataSize) {
    var usage = calculateUsage();
    
    if (!usage) {
      return false;
    }

    var wouldExceedQuota = (usage.usedBytes + dataSize) > usage.quotaBytes;
    var wouldExceedWarning = ((usage.usedBytes + dataSize) / usage.quotaBytes * 100) > QUOTA_WARNING_THRESHOLD;

    return {
      canStore: !wouldExceedQuota,
      wouldWarn: wouldExceedWarning,
      availableBytes: usage.quotaBytes - usage.usedBytes,
      neededBytes: dataSize
    };
  }

  /**
   * Show warning if quota is high
   */
  function checkAndWarn() {
    var usage = calculateUsage();
    
    if (!usage) {
      return;
    }

    if (usage.usagePercent >= QUOTA_CRITICAL_THRESHOLD) {
      var message = '⚠️ CRITICAL: LocalStorage is ' + usage.usagePercent.toFixed(1) + '% full (' + 
                    usage.usedMB.toFixed(2) + ' MB / ' + usage.quotaMB + ' MB). ' +
                    'Please export and clean up old data to avoid data loss.';
      
      console.error('[STORAGE-QUOTA] ' + message);
      
      // Show user-visible alert
      if (window.Toast && window.Toast.error) {
        window.Toast.error(message, { duration: 10000 });
      } else {
        alert(message);
      }

      return { level: 'critical', message: message };
    } else if (usage.usagePercent >= QUOTA_WARNING_THRESHOLD) {
      var warningMsg = '⚠️ Warning: LocalStorage is ' + usage.usagePercent.toFixed(1) + '% full (' + 
                       usage.usedMB.toFixed(2) + ' MB / ' + usage.quotaMB + ' MB). ' +
                       'Consider exporting and cleaning up old data.';
      
      console.warn('[STORAGE-QUOTA] ' + warningMsg);
      
      if (window.Toast && window.Toast.warning) {
        window.Toast.warning(warningMsg, { duration: 5000 });
      }

      return { level: 'warning', message: warningMsg };
    }

    return { level: 'ok', message: 'Storage usage is healthy' };
  }

  /**
   * Get recommendations for cleanup
   */
  function getCleanupRecommendations() {
    var usage = calculateUsage();
    var breakdown = getStorageBreakdown();
    var largest = getLargestItems(5);
    var recommendations = [];

    if (usage.usagePercent > QUOTA_WARNING_THRESHOLD) {
      recommendations.push({
        priority: 'high',
        action: 'Export and clean up quote history (keep last 100)',
        estimatedSavingsMB: 0 // Calculate based on actual data
      });

      recommendations.push({
        priority: 'high',
        action: 'Remove data older than 1 year',
        estimatedSavingsMB: 0
      });

      // Find largest categories
      var sortedBreakdown = Object.keys(breakdown).map(function(key) {
        return { prefix: key, mb: breakdown[key].mb };
      }).sort(function(a, b) {
        return b.mb - a.mb;
      });

      if (sortedBreakdown.length > 0 && sortedBreakdown[0].mb > 1) {
        recommendations.push({
          priority: 'medium',
          action: 'Review and clean up "' + sortedBreakdown[0].prefix + '" data (' + 
                  sortedBreakdown[0].mb.toFixed(2) + ' MB)',
          estimatedSavingsMB: sortedBreakdown[0].mb
        });
      }
    }

    return recommendations;
  }

  // Public API
  var StorageQuotaManager = {
    calculateUsage: calculateUsage,
    getStorageBreakdown: getStorageBreakdown,
    getLargestItems: getLargestItems,
    cleanupQuoteHistory: cleanupQuoteHistory,
    cleanupOldData: cleanupOldData,
    compressForStorage: compressForStorage,
    canStoreData: canStoreData,
    checkAndWarn: checkAndWarn,
    getCleanupRecommendations: getCleanupRecommendations,
    setQuotaThresholds: function(warning, critical) {
      QUOTA_WARNING_THRESHOLD = warning || 75;
      QUOTA_CRITICAL_THRESHOLD = critical || 90;
    }
  };

  // Register with APP if available
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('storageQuotaManager', StorageQuotaManager);
  }

  // Global access
  window.StorageQuotaManager = StorageQuotaManager;

  // Auto-check on load
  setTimeout(function() {
    checkAndWarn();
  }, 2000);

  console.log('[STORAGE-QUOTA] Storage quota manager loaded');
})();
