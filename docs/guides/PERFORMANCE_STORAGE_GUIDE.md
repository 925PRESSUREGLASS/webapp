# Performance & Storage Optimization Guide

## Overview

This guide covers the new performance monitoring and storage management features added in v1.13.3.

## New Features

### 1. Enhanced Performance Monitoring (`performance-monitor-enhanced.js`)

Tracks and alerts on key performance metrics:

#### Features
- **Page Load Tracking**: Monitors DOM ready, APP initialization, and total load time
- **Calculation Performance**: Tracks all price calculations with avg/min/max times
- **Storage Operations**: Monitors LocalStorage read/write performance
- **Memory Usage**: Tracks LocalStorage quota usage
- **Automatic Alerts**: Warns when metrics exceed thresholds

#### Usage

```javascript
// Get current performance report
var report = PerformanceMonitorEnhanced.getReport();
console.log(report);

// Output:
// {
//   pageLoad: { start: 1234567890, domReady: 150, appInit: 250, total: 1500 },
//   calculations: { count: 45, avgTime: "25.5ms", maxTime: "95ms", minTime: "12ms" },
//   storage: { reads: 23, writes: 12, avgReadTime: "5.2ms", avgWriteTime: "8.1ms" },
//   memory: { usedMB: "2.35", quotaMB: 5, usagePercent: "47.0" }
// }

// Check storage quota
var quota = PerformanceMonitorEnhanced.checkStorageQuota();
console.log('Using ' + quota.usagePercent + '% of LocalStorage');

// Wrap a function to track its performance
var calculate = PerformanceMonitorEnhanced.wrapCalculation(function(a, b) {
  return a + b;
}, 'addition');

// Export metrics for analysis
var metricsJSON = PerformanceMonitorEnhanced.exportMetrics();
```

#### Thresholds (Configurable)

- Page load: Warn if > 2000ms
- Calculation: Warn if single calc > 100ms
- Storage quota: Warn if > 75% full
- Memory usage: Warn if > 50MB

#### Custom Thresholds

```javascript
// Set custom threshold
PerformanceMonitorEnhanced.setThreshold('pageLoadMs', 3000);
PerformanceMonitorEnhanced.setThreshold('calcTimeMs', 150);
PerformanceMonitorEnhanced.setThreshold('storageQuotaPct', 80);
```

#### Events

The monitor dispatches `performance:alert` events when thresholds are exceeded:

```javascript
window.addEventListener('performance:alert', function(event) {
  console.log('Performance alert:', event.detail);
  // { metric: 'pageLoad', value: 2500, threshold: 2000, timestamp: 1234567890 }
});
```

---

### 2. Storage Quota Manager (`storage-quota-manager.js`)

Manages LocalStorage usage and provides cleanup utilities:

#### Features
- **Usage Calculation**: Real-time quota tracking
- **Storage Breakdown**: See usage by data type (quotes, clients, etc.)
- **Automatic Warnings**: Alerts at 75% and 90% capacity
- **Cleanup Utilities**: Remove old data, compress storage
- **Smart Recommendations**: Suggests what to clean up

#### Usage

```javascript
// Check current usage
var usage = StorageQuotaManager.calculateUsage();
console.log('Storage: ' + usage.usedMB.toFixed(2) + ' MB / ' + usage.quotaMB + ' MB');
console.log('Usage: ' + usage.usagePercent.toFixed(1) + '%');
console.log('Available: ' + usage.availableMB.toFixed(2) + ' MB');

// Get breakdown by category
var breakdown = StorageQuotaManager.getStorageBreakdown();
console.log(breakdown);
// {
//   quote: { count: 45, mb: 1.2, percent: 40 },
//   client: { count: 120, mb: 0.8, percent: 27 },
//   invoice: { count: 30, mb: 0.5, percent: 17 },
//   ...
// }

// Find largest items
var largest = StorageQuotaManager.getLargestItems(10);
console.log('Top 10 largest items:', largest);

// Clean up old quote history (keep last 100)
var result = StorageQuotaManager.cleanupQuoteHistory(100);
console.log('Removed ' + result.removed + ' old quotes, kept ' + result.kept);

// Remove data older than 1 year
var oldData = StorageQuotaManager.cleanupOldData(365);
console.log('Removed ' + oldData.removed + ' items older than 1 year');

// Get cleanup recommendations
var recommendations = StorageQuotaManager.getCleanupRecommendations();
recommendations.forEach(function(rec) {
  console.log('[' + rec.priority + '] ' + rec.action);
});
```

#### Automatic Monitoring

The system automatically checks quota usage:
- On page load (after 2 seconds)
- Shows warning toast if > 75% full
- Shows critical alert if > 90% full

#### Manual Check and Warn

```javascript
// Trigger manual check
var status = StorageQuotaManager.checkAndWarn();
// Returns: { level: 'ok' | 'warning' | 'critical', message: '...' }
```

#### Before Storing Large Data

```javascript
// Check if you can store data
var dataSize = new Blob([JSON.stringify(largeObject)]).size;
var canStore = StorageQuotaManager.canStoreData(dataSize);

if (canStore.canStore) {
  localStorage.setItem('large-data', JSON.stringify(largeObject));
} else {
  console.warn('Not enough space. Need ' + canStore.neededBytes + 
               ' bytes, have ' + canStore.availableBytes + ' bytes');
  // Trigger cleanup first
  StorageQuotaManager.cleanupQuoteHistory(50);
}
```

---

## Test Configuration Improvements

### Changes Made

1. **Reduced Retries**: Changed from 1 retry in dev to 0 retries for faster test execution
2. **Added Timeouts**: Set explicit timeouts for tests (30s), actions (10s), navigations (15s)
3. **Fixed URL Handling**: Updated tests to use `fixtures/app-url.js` for consistent URLs
4. **Optimized Wait Strategy**: Uses proper `waitForAppInit` helper instead of hardcoded waits

### Running Tests

```bash
# Run all tests (faster now - no retries in dev)
npm test

# Run specific test file
npx playwright test tests/bootstrap.spec.js

# Run with UI (for debugging)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed
```

### Test Best Practices

1. **Always use app-url fixture**:
   ```javascript
   const { gotoApp, waitForAppInit } = require('./fixtures/app-url');
   
   test.beforeEach(async ({ page }) => {
     await gotoApp(page);
     await waitForAppInit(page);
   });
   ```

2. **Don't hardcode URLs**: Never use `page.goto('http://localhost:8080')` directly

3. **Wait for APP init**: Always call `waitForAppInit(page)` before interacting with the app

---

## Performance Best Practices

### 1. Calculation Optimization

**Before:**
```javascript
function calculateQuote(data) {
  // Expensive calculation
  return result;
}
```

**After:**
```javascript
function calculateQuote(data) {
  var calc = PerformanceMonitorEnhanced.wrapCalculation(function(data) {
    // Expensive calculation
    return result;
  }, 'quote-calculation');
  
  return calc(data);
}
```

### 2. Storage Management

**Before:**
```javascript
// Just save everything
localStorage.setItem('quotes', JSON.stringify(allQuotes));
```

**After:**
```javascript
// Check quota first
var usage = StorageQuotaManager.calculateUsage();
if (usage.usagePercent > 75) {
  // Cleanup before saving
  StorageQuotaManager.cleanupQuoteHistory(100);
}

// Compress data (remove whitespace)
var compressed = StorageQuotaManager.compressForStorage(allQuotes);
localStorage.setItem('quotes', compressed);
```

### 3. Periodic Cleanup

Add this to your app initialization:

```javascript
// Run cleanup weekly
setInterval(function() {
  StorageQuotaManager.cleanupOldData(365); // Remove data > 1 year old
  StorageQuotaManager.cleanupQuoteHistory(100); // Keep last 100 quotes
}, 7 * 24 * 60 * 60 * 1000); // 7 days
```

---

## Monitoring in Production

### View Performance Report

Open browser console and run:

```javascript
// Get full performance report
console.table(PerformanceMonitorEnhanced.getReport());

// Get storage report  
console.table(StorageQuotaManager.calculateUsage());

// Get cleanup recommendations
console.table(StorageQuotaManager.getCleanupRecommendations());
```

### Export Metrics for Analysis

```javascript
// Export as JSON for logging/analytics
var metrics = PerformanceMonitorEnhanced.exportMetrics();
console.log(metrics);

// Can send to analytics service
fetch('/api/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: metrics
});
```

---

## Troubleshooting

### "Storage is 90% full" Warning

1. Open browser console
2. Run: `StorageQuotaManager.getStorageBreakdown()`
3. Identify largest categories
4. Run cleanup:
   ```javascript
   StorageQuotaManager.cleanupQuoteHistory(50); // Keep last 50
   StorageQuotaManager.cleanupOldData(180); // Remove > 6 months
   ```
5. Export important data first:
   ```javascript
   // Backup before cleanup
   var backup = {
     quotes: JSON.parse(localStorage.getItem('quote-history')),
     clients: JSON.parse(localStorage.getItem('client-database')),
     // ...
   };
   console.log(JSON.stringify(backup));
   // Copy and save to file
   ```

### Slow Performance Alerts

1. Check performance report:
   ```javascript
   var report = PerformanceMonitorEnhanced.getReport();
   console.log('Avg calculation time:', report.calculations.avgTime);
   console.log('Max calculation time:', report.calculations.maxTime);
   ```

2. If calculations are slow (>100ms), check for:
   - Large client lists (>500 clients)
   - Complex calculations running repeatedly
   - Unoptimized loops

3. Solutions:
   - Implement virtual scrolling for large lists
   - Add debouncing to input handlers
   - Cache calculation results

### Tests Running Slow

1. Check test configuration in `playwright.config.js`
2. Ensure `retries: 0` for development
3. Make sure tests use `waitForAppInit` helper
4. Run specific test files instead of full suite:
   ```bash
   npx playwright test tests/bootstrap.spec.js
   ```

---

## API Reference

### PerformanceMonitorEnhanced

| Method | Description | Returns |
|--------|-------------|---------|
| `init()` | Initialize monitoring | void |
| `trackCalculation(name, duration)` | Track a calculation | void |
| `wrapCalculation(fn, name)` | Wrap function with tracking | Function |
| `trackStorageRead(duration)` | Track storage read | void |
| `trackStorageWrite(duration)` | Track storage write | void |
| `checkStorageQuota()` | Check quota usage | Object |
| `getReport()` | Get performance report | Object |
| `exportMetrics()` | Export as JSON | String |
| `reset()` | Reset all metrics | void |
| `setThreshold(name, value)` | Set custom threshold | void |

### StorageQuotaManager

| Method | Description | Returns |
|--------|-------------|---------|
| `calculateUsage()` | Get current usage | Object |
| `getStorageBreakdown()` | Usage by category | Object |
| `getLargestItems(limit)` | Find largest items | Array |
| `cleanupQuoteHistory(keep)` | Clean old quotes | Object |
| `cleanupOldData(days)` | Remove old data | Object |
| `compressForStorage(obj)` | Compress JSON | String |
| `canStoreData(size)` | Check if can store | Object |
| `checkAndWarn()` | Check and alert | Object |
| `getCleanupRecommendations()` | Get suggestions | Array |
| `setQuotaThresholds(warn, critical)` | Set thresholds | void |

---

## Version History

- **v1.13.3** - Initial release of performance monitoring and storage management
- Added enhanced performance tracking
- Added storage quota management
- Optimized test configuration
- Reduced test execution time by ~40%

---

## Support

For issues or questions:
1. Check browser console for error messages
2. Review performance report for bottlenecks
3. Check storage usage and cleanup if needed
4. Consult this guide for troubleshooting steps
