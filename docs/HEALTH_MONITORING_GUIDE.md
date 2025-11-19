# Health Monitoring Setup Guide
**Version:** 1.0  
**Application:** TicTacStick Quote Engine  
**Created:** 2025-11-19

---

## Overview

The TicTacStick Health Monitoring system provides continuous automated health checks to ensure the application remains operational in production. It monitors LocalStorage, data integrity, performance, memory usage, and critical modules.

**System Location:** `health-check.js` (493 lines)

---

## Quick Start

### Automatic Monitoring (Production)

When deployed to a production domain (not localhost), health monitoring starts automatically after a 5-second delay:

```javascript
// Automatically runs on production domains
// Checks every 60 minutes
// No configuration needed
```

**Code:** health-check.js lines 485-491

### Manual Monitoring (Development/Testing)

```javascript
// Single health check
HealthCheck.runHealthCheck();

// Start monitoring every 15 minutes
HealthCheck.scheduleHealthChecks(15);

// Stop monitoring
HealthCheck.stopHealthChecks();

// Get last results
var results = HealthCheck.getLastCheckResults();
console.log(results);

// Export results to file
HealthCheck.exportHealthCheckResults();
```

---

## Monitored Metrics

### 1. LocalStorage Availability

**What it checks:**
- Can write to localStorage
- Can read from localStorage
- Can delete from localStorage

**Possible Results:**
- ✅ OK: "Available and writable"
- ❌ ERROR: "Not available: [error message]"

**What to do if it fails:**
- Check browser settings (localStorage enabled?)
- Check if quota exceeded
- Check if browser in private/incognito mode
- Check browser console for errors

---

### 2. Data Integrity

**What it checks:**
- Loads quotes from localStorage
- Verifies each quote has required fields (id, total)
- Counts corrupted records

**Possible Results:**
- ✅ OK: "All data valid (X quotes checked)"
- ⚠️ WARNING: "X corrupted quote(s) found out of Y"
- ❌ ERROR: "Quotes data corrupted: [error]"

**What to do if corrupted data found:**
1. Export quotes immediately (backup)
2. Identify corrupted records
3. Attempt data recovery
4. Delete corrupted records if recovery fails
5. Investigate root cause

---

### 3. Storage Capacity

**What it checks:**
- Total localStorage usage across all keys
- App-specific data usage (keys starting with tts_ or tictacstick_)
- Percentage of 5MB limit used

**Possible Results:**
- ✅ OK: "X% used (Y MB total, Z MB app data)"
- ⚠️ WARNING: "High: X% used" (75-90% full)
- ❌ ERROR: "Critical: X% used" (>90% full)

**What to do if storage is high:**
1. Export old quotes to backup
2. Delete quotes older than 6 months
3. Compress or remove old photos
4. Clear analytics history if needed
5. Prompt user to export data

**Prevention:**
- Schedule regular data exports
- Delete old/test quotes
- Use photo compression
- Limit analytics history to 100 entries

---

### 4. Calculation Performance

**What it checks:**
- Runs 100 typical money calculations
- Measures average time per calculation
- Uses Money.toCents() and Money.sumCents()

**Possible Results:**
- ✅ OK: "Calculations fast (X ms avg)" (< 1ms)
- ⚠️ WARNING: "Slow calculations: X ms avg" (> 1ms)
- ❌ ERROR: "Performance test failed: [error]"

**What to do if slow:**
- Check browser performance
- Close other heavy applications
- Restart browser
- Check for memory leaks
- Consider device upgrade if consistently slow

---

### 5. Error Handling

**What it checks:**
- Verifies global error handler exists (window.onerror)

**Possible Results:**
- ✅ OK: "Error handler active"
- ⚠️ WARNING: "No global error handler detected"

**What to do if no handler:**
- Check error-handler.js loaded
- Verify script load order in index.html
- Review browser console for errors

---

### 6. Memory Usage (Chrome/Edge Only)

**What it checks:**
- JavaScript heap size used
- Percentage of heap limit
- Available on Chrome/Edge (performance.memory API)

**Possible Results:**
- ✅ OK: "X% used (Y MB)" (< 70%)
- ⚠️ WARNING: "High: X% used" (70-90%)
- ❌ ERROR: "Critical: X% used" (> 90%)
- ℹ️ INFO: "Memory API not available (Safari/Firefox)"

**What to do if high memory:**
1. Reload application
2. Close unused browser tabs
3. Check for memory leaks in console
4. Export data and clear old records
5. Restart browser if persists

---

### 7. Modules Loaded

**What it checks:**
- Verifies critical modules are available:
  - Money (calculation utilities)
  - Time (time utilities)
  - APP (core application)
  - UIComponents (UI helpers)

**Possible Results:**
- ✅ OK: "All required modules loaded"
- ❌ ERROR: "Missing: [module list]"

**What to do if modules missing:**
1. Check browser console for script load errors
2. Verify all scripts in index.html
3. Check for 404 errors on scripts
4. Verify script load order (bootstrap.js first)
5. Check CSP not blocking scripts

---

### 8. Service Worker

**What it checks:**
- Service Worker API available in browser

**Possible Results:**
- ✅ OK: "Service Worker API available"
- ⚠️ WARNING: "Service Worker API not available"

**What to do if not available:**
- Browser doesn't support Service Workers (old browser)
- HTTPS not enabled (Service Worker requires HTTPS)
- Check browser compatibility
- PWA features limited without Service Worker

---

## Health Status Levels

### Healthy ✅

**Criteria:**
- All checks return OK status
- No warnings or errors

**Action Required:**
- None - system operating normally
- Continue regular monitoring

---

### Degraded ⚠️

**Criteria:**
- One or more warnings present
- No error-level checks failed

**Action Required:**
- Monitor closely
- Address warnings when possible
- Not urgent but should fix soon
- Document issues for future reference

**Example Scenarios:**
- Storage capacity at 75-80%
- Service Worker not available (old browser)
- No global error handler
- Memory usage at 70-80%

---

### Unhealthy ❌

**Criteria:**
- One or more error-level checks failed

**Action Required:**
- Immediate attention required
- Review errors and take corrective action
- May impact functionality
- Consider user notification if critical

**Example Scenarios:**
- LocalStorage not available
- Data corruption detected
- Storage capacity > 90%
- Memory usage > 90%
- Required modules missing

---

## Monitoring Intervals

### Recommended Intervals

**Production:**
- Default: 60 minutes (automatic)
- High-traffic: 30 minutes
- Post-deployment: 15 minutes (first 24 hours)
- Maintenance mode: 5 minutes

**Development:**
- Active development: Manual only
- Testing: 30 minutes
- Staging: 15 minutes

**How to set interval:**
```javascript
// Start monitoring every X minutes
HealthCheck.scheduleHealthChecks(X);

// Examples:
HealthCheck.scheduleHealthChecks(15);  // Every 15 min
HealthCheck.scheduleHealthChecks(30);  // Every 30 min
HealthCheck.scheduleHealthChecks(60);  // Every hour
```

---

## Exporting Health Check Results

### Export to File

```javascript
// Run health check first
HealthCheck.runHealthCheck();

// Then export results
HealthCheck.exportHealthCheckResults();
```

**Output:** Text file downloaded as `health-check-[timestamp].txt`

**Format:**
```
TicTacStick Health Check Report
================================

Timestamp: 2025-11-19T10:30:00Z
Overall Status: HEALTHY

Check Results:
-------------
LocalStorage: OK
  Available and writable
Data Integrity: OK
  All data valid (45 quotes checked)
Storage Capacity: OK
  15.2% used (0.76 MB total, 0.65 MB app data)
...
```

---

## Integration with Bug Tracking

When health checks detect issues, use the bug tracker to document:

```javascript
// Initialize bug tracker if not already
BugTracker.init();

// User reports issue or automated detection
// Bug report will include:
// - Health check results
// - Environment info
// - LocalStorage snapshot
// - Console errors
```

---

## Troubleshooting Common Issues

### Issue: Health check not running automatically

**Possible Causes:**
1. Running on localhost (automatic monitoring disabled)
2. Script not loaded (check index.html)
3. JavaScript error preventing execution

**Solution:**
```javascript
// Check if health check loaded
console.log(typeof HealthCheck);  // Should be 'object'

// Manually start monitoring
HealthCheck.scheduleHealthChecks(60);

// Check console for errors
```

---

### Issue: All checks fail immediately

**Possible Causes:**
1. Script load order incorrect
2. Dependencies not loaded (Money, APP, etc.)
3. Critical JavaScript error

**Solution:**
1. Open browser console
2. Check for red errors
3. Verify bootstrap.js loaded first
4. Check all required scripts loaded
5. Review Network tab for 404 errors

---

### Issue: Storage capacity always high

**Possible Causes:**
1. Too many saved quotes
2. Large photos in quotes
3. Excessive analytics history
4. Old test data

**Solution:**
```javascript
// Check storage breakdown
for (var key in localStorage) {
  var size = (localStorage.getItem(key).length / 1024).toFixed(2);
  console.log(key + ': ' + size + ' KB');
}

// Export and delete old data
// Via UI: Export History → Delete old quotes
```

---

### Issue: Performance degrading over time

**Possible Causes:**
1. Memory leaks
2. Too much data in memory
3. Browser cache full
4. Other applications consuming resources

**Solution:**
1. Reload application
2. Clear browser cache
3. Close unused tabs/applications
4. Export data and clear old records
5. Restart browser

---

## Best Practices

### 1. Regular Monitoring

- ✅ Review health check results daily (first week after deploy)
- ✅ Review weekly after stable
- ✅ Export results for record-keeping
- ✅ Document any recurring issues

### 2. Proactive Maintenance

- ✅ Export data regularly (weekly/monthly)
- ✅ Clear old quotes and test data
- ✅ Compress or remove old photos
- ✅ Monitor storage capacity trends

### 3. Issue Response

- ✅ Address warnings within 48 hours
- ✅ Address errors immediately
- ✅ Document all issues and resolutions
- ✅ Update runbooks based on learnings

### 4. Communication

- ✅ Notify Gerard of critical issues
- ✅ Plan maintenance windows for fixes
- ✅ Document workarounds for known issues
- ✅ Keep health check logs for analysis

---

## Automated Actions (Future Enhancement)

**Currently Manual:** All health check responses require manual intervention

**Future Enhancements:**
1. Auto-export data when storage reaches 80%
2. Auto-delete quotes older than X months (with confirmation)
3. Email notifications on error-level failures
4. Automatic bug report creation on critical errors
5. Integration with remote monitoring service

---

## Health Monitoring Checklist

### Daily (First Week Post-Deploy)
- [ ] Check latest health check results
- [ ] Verify overall status is Healthy or Degraded
- [ ] Address any new warnings
- [ ] Monitor storage capacity trend

### Weekly (After Stabilization)
- [ ] Review health check trends
- [ ] Export health check results for records
- [ ] Perform manual health check
- [ ] Review and address any warnings

### Monthly
- [ ] Export all health check results
- [ ] Analyze trends (storage, performance, errors)
- [ ] Plan proactive maintenance
- [ ] Update health check thresholds if needed

---

## Summary

**Key Commands:**
```javascript
// Single check
HealthCheck.runHealthCheck();

// Start monitoring (15 min intervals)
HealthCheck.scheduleHealthChecks(15);

// Stop monitoring
HealthCheck.stopHealthChecks();

// Get results
var results = HealthCheck.getLastCheckResults();

// Export
HealthCheck.exportHealthCheckResults();
```

**Status Levels:**
- ✅ Healthy: All good
- ⚠️ Degraded: Warnings present
- ❌ Unhealthy: Errors present

**Auto-Monitoring:**
- Production: Every 60 minutes (automatic)
- Development: Manual only

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-19  
**Maintained By:** Deployment Specialist Agent
