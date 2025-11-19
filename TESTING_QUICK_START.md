# Testing Quick Start - TicTacStick v1.13.0

**CRITICAL TESTS ONLY - 45 MINUTES**

---

## Prerequisites

```bash
# 1. Start server
cd /Users/gerardvarone/Documents/GitHub/webapp
python3 -m http.server 8080

# 2. Open browser
open http://localhost:8080

# 3. Open DevTools Console
# Chrome/Firefox: F12 or Cmd+Option+I
# Safari: Develop → Show JavaScript Console
```

---

## Script 1: Verify Modules Loaded (2 min)

**Copy-paste into console:**

```javascript
(function() {
  var modules = ['APP', 'Storage', 'Security', 'BackupManager', 'ContractManager', 'JobManager'];
  var failed = [];
  modules.forEach(function(m) {
    if (typeof window[m] === 'undefined') failed.push(m);
  });
  if (failed.length === 0) {
    console.log('✅ All critical modules loaded');
  } else {
    console.error('❌ Missing: ' + failed.join(', '));
  }
})();
```

**Expected:** `✅ All critical modules loaded`

---

## Script 2: Test Backup System (Bug #1 & #2) (10 min)

**Copy-paste into console:**

```javascript
(function() {
  console.log('=== Backup Test Start ===');
  
  // Create test data
  var testQuote = { id: 'test_' + Date.now(), title: 'Backup Test', total: 250 };
  var quotes = JSON.parse(localStorage.getItem('tictacstick_saved_quotes_v1') || '[]');
  quotes.push(testQuote);
  localStorage.setItem('tictacstick_saved_quotes_v1', JSON.stringify(quotes));
  console.log('✅ Test data created');
  
  // Export
  var backupJSON = window.BackupManager.exportAllData();
  console.log('✅ Backup exported (' + (backupJSON.length / 1024).toFixed(1) + ' KB)');
  
  // Validate JSON (Bug #1 check)
  var backup = JSON.parse(backupJSON);
  if (typeof backup.data === 'string') {
    console.error('❌ CRITICAL: Bug #1 present (double-escaping)');
    return false;
  }
  console.log('✅ Bug #1 FIXED (no double-escaping)');
  
  // Import (Bug #2 check)
  var result = window.BackupManager.importBackup(backupJSON);
  if (typeof result === 'undefined' || typeof result.success === 'undefined') {
    console.error('❌ CRITICAL: Bug #2 present (import returns undefined)');
    return false;
  }
  console.log('✅ Bug #2 FIXED (import returns result object)');
  
  // Verify
  var restored = JSON.parse(localStorage.getItem('tictacstick_saved_quotes_v1') || '[]');
  var found = restored.find(function(q) { return q.id === testQuote.id; });
  if (found && found.total === testQuote.total) {
    console.log('✅ Data integrity verified');
  } else {
    console.error('❌ Data corruption detected');
    return false;
  }
  
  // Cleanup
  var clean = restored.filter(function(q) { return q.id !== testQuote.id; });
  localStorage.setItem('tictacstick_saved_quotes_v1', JSON.stringify(clean));
  console.log('✅ Cleanup complete');
  
  console.log('=== ✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅ ===');
  return true;
})();
```

**Expected:** `✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅`

---

## Manual Test: Backup Export (5 min)

1. Navigate to **Settings**
2. Click **"Export All Data"**
3. **Verify:** File downloads (e.g., `tictacstick-backup-2025-11-19_HHMMSS.json`)
4. Open file in text editor
5. **Verify:** Valid JSON (starts with `{`, ends with `}`)
6. **Check:** `"data": {` is an object, NOT a string
7. **Check:** No `"{\"data\":` double-escaping

**PASS:** ✅ File downloads, JSON is valid, no double-escaping
**FAIL:** ❌ Any of the above checks fail

---

## Manual Test: Backup Import (10 min)

1. With exported backup from previous test
2. Open **DevTools** → **Application** → **Storage** → **Clear Site Data**
3. **Refresh page** (Cmd+R / Ctrl+R)
4. **Verify:** All data cleared (no quotes, clients, invoices)
5. Navigate to **Settings**
6. Click **"Import Backup"**
7. Select exported JSON file
8. **Watch console** for errors
9. **Verify:** Page reloads automatically (1-2 seconds)
10. **Verify:** All data restored

**Console Should Show:**
```
[BACKUP] Restoring quotes: X items
[BACKUP] Restoring clients: Y items
[BACKUP] Backup restored successfully
```

**PASS:** ✅ Page reloads, all data restored, no console errors
**FAIL:** ❌ Console errors, data not restored, page doesn't reload

---

## Manual Test: Contract Creation (10 min)

1. Click **"📋 Contracts"** button
2. Click **"New Contract"**
3. **Step 1:** Select existing client (or create one)
4. **Step 2:** Add service items (windows/pressure)
5. **Step 3:** Select **"Monthly"** frequency
6. **Verify:** 10% discount applied automatically
7. **Step 4:** Set dates (start: today, end: +1 year)
8. **Step 5:** Preview contract
9. **Save:** Click **"Create Contract"**
10. **Verify:** Contract appears in list with status "draft"

**Console Check:**
```javascript
var contracts = JSON.parse(localStorage.getItem('tts_contracts') || '[]');
console.log('Total contracts:', contracts.length);
console.log('Latest:', contracts[contracts.length - 1]);
```

**PASS:** ✅ Contract created, discount applied, saved to storage
**FAIL:** ❌ Wizard doesn't complete, discount wrong, not saved

---

## Manual Test: Jobs Tracking (10 min)

1. Click **"📋 Jobs"** button
2. Verify jobs page loads
3. Click **"➕ Create Job"**
4. Select quote from dropdown
5. Set scheduled date/time
6. Click **"Create Job"**
7. **Verify:** Success toast appears
8. **Verify:** Job appears in list
9. Click job card
10. **Verify:** Active job page opens
11. Click **"Start Job"**
12. **Verify:** Timer starts

**Console Check:**
```javascript
var jobs = JSON.parse(localStorage.getItem('tts_jobs') || '[]');
console.log('Total jobs:', jobs.length);
console.log('Latest:', jobs[jobs.length - 1]);
```

**PASS:** ✅ Job created, appears in list, timer works
**FAIL:** ❌ Job not created, doesn't appear, timer doesn't start

---

## Results Template

```
=== CRITICAL TESTS RESULTS ===
Date: __________
Tester: __________

[ ] Script 1: Modules Loaded        ✅ / ❌
[ ] Script 2: Backup Test           ✅ / ❌
[ ] Manual: Backup Export           ✅ / ❌
[ ] Manual: Backup Import           ✅ / ❌
[ ] Manual: Contract Creation       ✅ / ❌
[ ] Manual: Jobs Tracking           ✅ / ❌

Tests Passed: ____ / 6
Critical Bugs Found: ____

Ready for Production: YES / NO

Signature: ________________
```

---

## If Tests FAIL

1. **Document the failure:**
   - Screenshot the error
   - Copy console errors
   - Note exact steps to reproduce

2. **Check common issues:**
   - Modules not loaded? Refresh page
   - LocalStorage quota? Export, clear, import
   - Console errors? Check browser compatibility

3. **Report bug:**
   - Bug ID: BUG-###
   - Severity: Critical / High / Medium / Low
   - Module: Backup / Contracts / Jobs
   - Steps to reproduce
   - Expected vs Actual

4. **DO NOT DEPLOY** if critical tests fail

---

## Full Documentation

For complete testing guide with all 70 test cases:
- **See:** `MANUAL_TESTING_GUIDE_v1.13.0.md`

For test analysis and mission report:
- **See:** `MANUAL_TESTING_REPORT.md`

For iOS-specific testing:
- **See:** `docs/iOS-SAFARI-TESTING-CHECKLIST.md`

---

**Estimated Time:** 45 minutes (critical tests only)
**Status:** Ready for execution
**Last Updated:** 2025-11-19

---

END OF QUICK START
