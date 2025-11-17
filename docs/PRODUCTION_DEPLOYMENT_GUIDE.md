# TicTacStick Production Deployment & Launch Readiness Guide

**Version:** 1.7
**Status:** Ready for Production Deployment
**Last Updated:** 2025-11-17
**Business Risk Level:** HIGH - Real customer invoices, financial data, tax compliance

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Backup & Restore Procedures](#2-backup--restore-procedures)
3. [Deployment Methods](#3-deployment-methods)
4. [Post-Deployment Verification](#4-post-deployment-verification)
5. [Gradual Rollout Plan](#5-gradual-rollout-plan)
6. [Monitoring & Error Tracking](#6-monitoring--error-tracking)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Customer Communication Plan](#8-customer-communication-plan)
9. [Success Metrics](#9-success-metrics)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## Overview

This guide provides a complete, step-by-step process for deploying TicTacStick's invoice system to production with zero data loss and full rollback capabilities.

**Current Status:**
- ✅ All tests passing (Playwright suite - 100%)
- ✅ Manual verification complete (30 scenarios)
- ✅ Input validation implemented
- ✅ Invoice features working correctly
- ⚠️ Never used with real customers yet
- ⚠️ No formal backup procedure in place
- ⚠️ No monitoring or error tracking
- ⚠️ No rollback plan if issues arise

**Deployment Goals:**
1. **Zero data loss** - Existing quotes/clients must remain intact
2. **Safe rollback** - Can revert to working version if needed
3. **Monitoring** - Know immediately if something breaks
4. **Backup** - Regular automated backups of all data
5. **Confidence** - Feel secure using with real customers

**Timeline:**
- Reading this guide: 30 minutes
- Pre-deployment tasks: 2 hours
- Deployment: 30 minutes
- Week 1 monitoring: Daily checks (5-10 min/day)

---

## 1. Pre-Deployment Checklist

**Complete ALL "Critical" and "Must Complete" items before deploying to production.**

### 1.1 Code Quality (Must Complete)

- [ ] **All Playwright tests passing (100%)**
  - Run: `npm test`
  - Expected: All tests green, zero failures
  - If failures: Fix before deploying

- [ ] **Manual testing complete (30 scenarios)**
  - Reference: `docs/MANUAL_TESTING_VERIFICATION.md`
  - All scenarios passed
  - Screenshots captured

- [ ] **Input validation implemented and tested**
  - Reference: `docs/INPUT_VALIDATION_IMPLEMENTATION.md`
  - XSS prevention working
  - Invalid data rejected
  - User-friendly error messages

- [ ] **No console errors during normal use**
  - Open browser DevTools
  - Navigate through entire app
  - Create quote, invoice, client
  - Check for red errors in console
  - Warning OK, errors NOT OK

- [ ] **Debug mode tested**
  - Enable: `DEBUG_CONFIG.enabled = true` in app.js
  - Verify debug panel appears
  - Check validation bypass works
  - Disable before production: `DEBUG_CONFIG.enabled = false`

- [ ] **All TODO/FIXME comments resolved**
  - Search codebase: `grep -r "TODO" js/`
  - Search codebase: `grep -r "FIXME" js/`
  - Resolve or document each one

- [ ] **Code reviewed (or self-reviewed)**
  - Check invoice.js for logic errors
  - Check validation.js for security issues
  - Check calc.js for calculation accuracy
  - Verify GST calculations correct (10%)

---

### 1.2 Data Safety (Critical)

- [ ] **Full LocalStorage backup created**
  - Use backup script (Section 2.2)
  - Run in browser console
  - Verify JSON output valid

- [ ] **Backup stored in 3 locations**
  1. **iPad Files app** (local device)
  2. **iCloud Drive** (cloud backup)
  3. **Email to self or Dropbox** (external backup)

- [ ] **Restore procedure tested**
  - Use restore script (Section 2.3)
  - Test on development/test environment
  - Verify data actually restored
  - Time how long it takes (<5 min target)

- [ ] **Export functionality tested**
  - Export quotes as JSON
  - Export invoices as JSON
  - Export clients as JSON
  - Verify files download correctly

- [ ] **Import functionality tested**
  - Import previously exported data
  - Verify data appears correctly
  - No data corruption

- [ ] **Backup includes ALL 10 LocalStorage keys**
  1. `tictacstick_autosave_state_v1`
  2. `tictacstick_saved_quotes_v1`
  3. `tictacstick_presets_v1`
  4. `quote-history`
  5. `client-database`
  6. `invoice-database`
  7. `invoice-settings`
  8. `quote-templates`
  9. `debug-enabled`
  10. `lastBackupDate`

---

### 1.3 Browser Compatibility (Must Test)

- [ ] **Tested on iPad Safari (primary device)**
  - Full app navigation
  - Create invoice
  - Save invoice
  - Record payment
  - Export invoice

- [ ] **Tested on iPhone Safari (mobile access)**
  - UI displays correctly
  - Touch interactions work
  - Can view invoices
  - Can view quotes

- [ ] **Tested on desktop Safari (office use)**
  - Larger screen layout works
  - All features accessible
  - Print functionality works

- [ ] **Tested on Chrome (client demo, backup browser)**
  - Full functionality works
  - No Chrome-specific errors
  - Service Worker installs

- [ ] **Service Worker working (offline mode confirmed)**
  - Open DevTools → Application → Service Workers
  - Verify "activated and running"
  - Turn off WiFi
  - App still works offline
  - Turn WiFi back on - syncs correctly

- [ ] **PWA install working (Add to Home Screen)**
  - Safari: Share → Add to Home Screen
  - Icon appears on home screen
  - Opens as standalone app
  - No Safari UI visible

---

### 1.4 Security Review (Important)

- [ ] **XSS prevention verified (security.js working)**
  - Test: Enter `<script>alert('XSS')</script>` in client name
  - Expected: Script tags removed, no alert shown
  - Test in all text inputs

- [ ] **Input sanitization tested (no script injection)**
  - Test: `<img src=x onerror=alert(1)>` in invoice notes
  - Expected: Sanitized, no execution
  - Reference: `docs/INPUT_VALIDATION_IMPLEMENTATION.md`

- [ ] **CSP headers in place (Content-Security-Policy)**
  - Check if hosting platform supports CSP
  - Add to hosting configuration
  - Test with browser DevTools

- [ ] **No sensitive data in console logs**
  - Search code for `console.log()`
  - Remove any logs containing customer data
  - Remove any logs containing financial data

- [ ] **No customer PII in debug output**
  - Check debug panel output
  - Verify no client names/addresses/emails logged
  - If present, redact before logging

- [ ] **Bank details encryption reviewed**
  - Currently stored in plain text (acceptable for LocalStorage)
  - Document: Only accessible on device owner's device
  - Future: Consider encryption for Phase 3 cloud sync

---

### 1.5 Documentation (Recommended)

- [ ] **README.md updated to v1.7**
  - Version number correct
  - Invoice features documented
  - Installation instructions current

- [ ] **PROJECT_STATE.md current**
  - Reflects latest changes
  - Phase 2 marked complete
  - Known issues documented

- [ ] **Invoice feature usage guide written**
  - How to create invoice
  - How to send invoice
  - How to record payment
  - How to mark as paid

- [ ] **Troubleshooting guide created**
  - See Section 10 of this document
  - Common issues documented
  - Solutions provided

- [ ] **Known issues documented**
  - Any bugs found during testing
  - Workarounds provided
  - Priority assigned

- [ ] **Rollback procedure documented**
  - See Section 7 of this document
  - Emergency contacts listed
  - Backup locations documented

---

### 1.6 Infrastructure (If Using Hosting)

- [ ] **Domain/subdomain configured**
  - DNS records set up
  - Propagation verified (can take 24-48 hours)
  - Test: `nslookup yourdomain.com`

- [ ] **HTTPS enabled (SSL certificate)**
  - All hosting platforms provide free SSL
  - Verify: URL starts with `https://`
  - Check: Padlock icon in browser

- [ ] **CDN configured (if using)**
  - Netlify/Vercel provide automatic CDN
  - Improves load times globally
  - No additional setup needed

- [ ] **Custom 404 page (if using)**
  - Create `404.html` file
  - User-friendly error message
  - Link back to home page

- [ ] **Analytics enabled (if desired)**
  - Google Analytics (free)
  - Plausible Analytics (privacy-focused)
  - Or skip for privacy

- [ ] **Backup hosting prepared (secondary server)**
  - Deploy to 2 platforms (e.g., GitHub Pages + Netlify)
  - If one goes down, use the other
  - Keep both updated

---

### 1.7 Business Readiness (Critical)

- [ ] **Tax compliance verified (10% GST accurate)**
  - Test: Create invoice for $100
  - Expected: GST = $10, Total = $110
  - Test: Create invoice for $275.50
  - Expected: GST = $27.55, Total = $303.05
  - Reference: `docs/TAX_CALCULATION_VERIFICATION.md`

- [ ] **Invoice template professional**
  - Company name correct
  - Logo included (if applicable)
  - Layout clean and readable
  - Looks professional when printed

- [ ] **Bank details correct (BSB, account, ABN)**
  - Verify in invoice-settings.js
  - Double-check BSB: XXX-XXX
  - Double-check Account: XXXXXXXX
  - Double-check ABN: XX XXX XXX XXX
  - **Critical: Errors here = payment to wrong account!**

- [ ] **Invoice numbering sequence set**
  - Decide starting number (e.g., INV-001 or INV-1001)
  - Set in invoice settings
  - Test: Create test invoice, verify number correct

- [ ] **Payment terms defined**
  - Default: "Due on receipt" or "Net 7 days"
  - Set in invoice settings
  - Consistent across all invoices

- [ ] **Client communication prepared**
  - See Section 8 for templates
  - Email template ready
  - SMS template ready
  - Practice explaining new system

---

### Pre-Deployment Checklist Summary

**Before proceeding:**
- Count total items checked
- **Minimum required:** All "Critical" and "Must Complete" items
- **Recommended:** All items checked
- **If any critical items unchecked:** STOP - Address before deploying

**Estimated time to complete:** 2 hours

**Ready to deploy?** → Proceed to Section 2 (Backup & Restore)

---

## 2. Backup & Restore Procedures

**Critical: You MUST have a reliable backup before using with real data.**

### 2.1 Why Backups Matter

- **LocalStorage is fragile** - Can be cleared by browser, iOS updates, storage full
- **No cloud backup** - Data only exists on your device (Phase 2)
- **Financial data** - Invoices are legally required for tax purposes
- **Customer data** - Client information cannot be recreated if lost
- **Peace of mind** - Sleep well knowing data is safe

### 2.2 Complete Backup Script

**Copy-paste ready JavaScript - Run in browser console**

```javascript
/**
 * TicTacStick Complete Backup Script v1.7
 *
 * USAGE:
 * 1. Open TicTacStick app in Safari
 * 2. Open browser console (Safari: Develop → Show JavaScript Console)
 * 3. Paste this entire script
 * 4. Run: copy(createBackup())
 * 5. Paste result into text editor
 * 6. Save as: TicTacStick_Backup_YYYY-MM-DD.json
 *
 * On iPad without console access:
 * 1. Use the app's built-in export functionality
 * 2. Or access via desktop Safari with iPad in developer mode
 */

function createBackup() {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const backup = {
    version: '1.7',
    timestamp: timestamp,
    dateStr: dateStr,
    environment: {
      userAgent: navigator.userAgent,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform
    },
    data: {
      autosave: localStorage.getItem('tictacstick_autosave_state_v1'),
      savedQuotes: localStorage.getItem('tictacstick_saved_quotes_v1'),
      presets: localStorage.getItem('tictacstick_presets_v1'),
      quoteHistory: localStorage.getItem('quote-history'),
      clientDatabase: localStorage.getItem('client-database'),
      invoiceDatabase: localStorage.getItem('invoice-database'),
      invoiceSettings: localStorage.getItem('invoice-settings'),
      quoteTemplates: localStorage.getItem('quote-templates'),
      debugEnabled: localStorage.getItem('debug-enabled'),
      lastBackupDate: localStorage.getItem('lastBackupDate')
    },
    statistics: {
      totalQuotes: 0,
      totalInvoices: 0,
      totalClients: 0,
      totalPaidInvoices: 0,
      totalUnpaidInvoices: 0,
      totalRevenue: 0,
      storageUsedKB: 0,
      storageUsedMB: 0
    }
  };

  // Calculate statistics
  try {
    // Quotes
    const history = JSON.parse(backup.data.quoteHistory || '[]');
    backup.statistics.totalQuotes = history.length;

    // Invoices
    const invoices = JSON.parse(backup.data.invoiceDatabase || '[]');
    backup.statistics.totalInvoices = invoices.length;

    // Count paid/unpaid
    let totalRevenue = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        paidCount++;
        totalRevenue += parseFloat(inv.total || 0);
      } else {
        unpaidCount++;
      }
    });

    backup.statistics.totalPaidInvoices = paidCount;
    backup.statistics.totalUnpaidInvoices = unpaidCount;
    backup.statistics.totalRevenue = totalRevenue.toFixed(2);

    // Clients
    const clients = JSON.parse(backup.data.clientDatabase || '[]');
    backup.statistics.totalClients = clients.length;

    // Storage used
    let totalBytes = 0;
    for (const key in backup.data) {
      if (backup.data[key]) {
        totalBytes += backup.data[key].length;
      }
    }
    backup.statistics.storageUsedKB = Math.round(totalBytes / 1024);
    backup.statistics.storageUsedMB = (totalBytes / 1024 / 1024).toFixed(2);
  } catch (e) {
    backup.statistics.error = e.message;
    console.error('Error calculating statistics:', e);
  }

  // Update last backup date in LocalStorage
  localStorage.setItem('lastBackupDate', timestamp);

  // Log summary
  console.log('✅ Backup created successfully');
  console.log('📊 Statistics:');
  console.log('   - Quotes: ' + backup.statistics.totalQuotes);
  console.log('   - Invoices: ' + backup.statistics.totalInvoices + ' (' + backup.statistics.totalPaidInvoices + ' paid, ' + backup.statistics.totalUnpaidInvoices + ' unpaid)');
  console.log('   - Clients: ' + backup.statistics.totalClients);
  console.log('   - Revenue (paid): $' + backup.statistics.totalRevenue);
  console.log('   - Storage: ' + backup.statistics.storageUsedKB + ' KB (' + backup.statistics.storageUsedMB + ' MB)');
  console.log('');
  console.log('💾 Save as: TicTacStick_Backup_' + dateStr + '.json');
  console.log('📋 Backup copied to clipboard (if copy() supported)');

  return JSON.stringify(backup, null, 2);
}

// Try to copy to clipboard automatically (if supported)
try {
  const backupData = createBackup();
  if (typeof copy === 'function') {
    copy(backupData);
  } else {
    console.log('ℹ️ Manual copy required: Select output and copy');
    console.log(backupData);
  }
} catch (e) {
  console.log('⚠️ Run manually: createBackup()');
}
```

**How to use:**

1. **On Desktop (Easiest):**
   - Open TicTacStick in desktop Safari/Chrome
   - Press F12 (or Cmd+Option+I on Mac)
   - Go to Console tab
   - Paste entire script above
   - Press Enter
   - Backup is copied to clipboard
   - Paste into text editor, save as `TicTacStick_Backup_2025-11-17.json`

2. **On iPad (Advanced):**
   - Enable Safari Web Inspector on Mac
   - Connect iPad to Mac via USB
   - Open TicTacStick on iPad
   - Open Safari on Mac → Develop → [Your iPad] → TicTacStick
   - Follow desktop instructions

3. **Alternative Method (No Console Needed):**
   - Add this script to a bookmarklet
   - Or use the app's built-in export feature (if implemented)

---

### 2.3 Complete Restore Script

**Copy-paste ready JavaScript - Use ONLY to restore from backup**

```javascript
/**
 * TicTacStick Restore Script v1.7
 *
 * ⚠️ WARNING: This will OVERWRITE all current data!
 * Only use if you need to restore from a backup.
 *
 * USAGE:
 * 1. Open TicTacStick app in Safari
 * 2. Open browser console
 * 3. Paste this entire script
 * 4. Open your backup JSON file
 * 5. Copy the ENTIRE contents
 * 6. Run: restoreBackup(PASTE_BACKUP_HERE)
 *
 * SAFETY: Creates emergency backup before restore
 */

function restoreBackup(backupData) {
  console.log('🔄 Starting restore process...');

  // Parse backup
  let backup;
  try {
    // If passed as string, parse it
    if (typeof backupData === 'string') {
      backup = JSON.parse(backupData);
    } else {
      backup = backupData;
    }
  } catch (e) {
    console.error('❌ Invalid backup file:', e);
    return {
      success: false,
      error: 'Invalid JSON - could not parse backup file',
      details: e.message
    };
  }

  // Validate backup structure
  if (!backup.data || !backup.timestamp) {
    console.error('❌ Invalid backup structure');
    return {
      success: false,
      error: 'Invalid backup structure - missing data or timestamp'
    };
  }

  // Display backup info
  console.log('📦 Backup Information:');
  console.log('   - Version: ' + backup.version);
  console.log('   - Created: ' + backup.timestamp);
  console.log('   - Quotes: ' + (backup.statistics?.totalQuotes || 'unknown'));
  console.log('   - Invoices: ' + (backup.statistics?.totalInvoices || 'unknown'));
  console.log('   - Clients: ' + (backup.statistics?.totalClients || 'unknown'));
  console.log('');

  // Confirm with user
  const confirmMessage =
    '⚠️ WARNING: This will OVERWRITE ALL current data!\n\n' +
    'Backup Information:\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Created: ' + backup.timestamp + '\n' +
    'Version: ' + backup.version + '\n' +
    'Quotes: ' + (backup.statistics?.totalQuotes || 'unknown') + '\n' +
    'Invoices: ' + (backup.statistics?.totalInvoices || 'unknown') + '\n' +
    'Clients: ' + (backup.statistics?.totalClients || 'unknown') + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    'An emergency backup of your CURRENT data will be created first.\n\n' +
    'Do you want to continue with the restore?';

  const confirmed = window.confirm(confirmMessage);

  if (!confirmed) {
    console.log('❌ Restore cancelled by user');
    return {
      success: false,
      error: 'Cancelled by user'
    };
  }

  // Create emergency backup of current state
  console.log('💾 Creating emergency backup of current state...');
  let emergencyBackup;
  try {
    emergencyBackup = createBackup(); // Uses backup function from above
    console.log('✅ Emergency backup created');
    console.log('ℹ️ If restore fails, you can use this emergency backup');
    console.log('📋 Emergency backup stored in variable: emergencyBackup');
  } catch (e) {
    console.warn('⚠️ Could not create emergency backup:', e);
    const proceedAnyway = window.confirm(
      'Could not create emergency backup.\n\n' +
      'This is risky - if restore fails, you may lose data.\n\n' +
      'Continue anyway?'
    );
    if (!proceedAnyway) {
      return { success: false, error: 'Aborted - could not create emergency backup' };
    }
  }

  // Restore each key
  console.log('🔄 Restoring data...');
  let restored = 0;
  let failed = [];

  const keyMap = {
    autosave: 'tictacstick_autosave_state_v1',
    savedQuotes: 'tictacstick_saved_quotes_v1',
    presets: 'tictacstick_presets_v1',
    quoteHistory: 'quote-history',
    clientDatabase: 'client-database',
    invoiceDatabase: 'invoice-database',
    invoiceSettings: 'invoice-settings',
    quoteTemplates: 'quote-templates',
    debugEnabled: 'debug-enabled',
    lastBackupDate: 'lastBackupDate'
  };

  for (const backupKey in backup.data) {
    const storageKey = keyMap[backupKey];
    const value = backup.data[backupKey];

    if (storageKey && value !== null && value !== undefined) {
      try {
        localStorage.setItem(storageKey, value);
        restored++;
        console.log('   ✅ Restored: ' + storageKey);
      } catch (e) {
        failed.push({
          key: storageKey,
          error: e.message
        });
        console.error('   ❌ Failed: ' + storageKey + ' - ' + e.message);
      }
    }
  }

  // Summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Restore Summary:');
  console.log('   - Restored: ' + restored + ' keys');
  console.log('   - Failed: ' + failed.length + ' keys');

  if (failed.length > 0) {
    console.log('');
    console.log('⚠️ Failed items:');
    failed.forEach(f => {
      console.log('   - ' + f.key + ': ' + f.error);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (restored > 0) {
    console.log('✅ Restore complete!');
    console.log('🔄 Page will reload in 3 seconds to apply changes...');
    console.log('');

    // Set last restore date
    localStorage.setItem('lastRestoreDate', new Date().toISOString());
    localStorage.setItem('lastRestoreSource', backup.timestamp);

    // Reload page after delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  } else {
    console.error('❌ No data was restored');
  }

  return {
    success: restored > 0,
    restored: restored,
    failed: failed,
    emergencyBackup: emergencyBackup
  };
}

// Store emergency backup function
window.viewEmergencyBackup = function() {
  if (window.emergencyBackupData) {
    console.log(window.emergencyBackupData);
    if (typeof copy === 'function') {
      copy(window.emergencyBackupData);
      console.log('📋 Emergency backup copied to clipboard');
    }
  } else {
    console.log('ℹ️ No emergency backup available (restore not run yet)');
  }
};

console.log('✅ Restore function loaded');
console.log('');
console.log('📖 Usage:');
console.log('   1. Copy your entire backup JSON file contents');
console.log('   2. Run: restoreBackup(PASTE_JSON_HERE)');
console.log('   3. Confirm the restore');
console.log('   4. Wait for page to reload');
console.log('');
console.log('ℹ️ An emergency backup will be created automatically');
console.log('ℹ️ To view emergency backup: viewEmergencyBackup()');
```

**How to use:**

1. **Open browser console** (as described in backup section)
2. **Paste restore script** (entire code block above)
3. **Open your backup file** (TicTacStick_Backup_2025-11-17.json)
4. **Copy ENTIRE contents** of backup file
5. **Run in console:**
   ```javascript
   restoreBackup(`PASTE_ENTIRE_BACKUP_JSON_HERE`)
   ```
6. **Confirm restore** when prompted
7. **Wait for reload** (automatic after 3 seconds)
8. **Verify data restored** correctly

---

### 2.4 Backup Strategy & Schedule

**When to create backups:**

#### **Pre-Launch Backup (Critical)**

- [ ] Create backup BEFORE first production invoice
- [ ] Store in 3 locations:
  1. **iPad Files app** → On My iPad → TicTacStick → Backups
  2. **iCloud Drive** → TicTacStick → Backups
  3. **External** → Email to self, Dropbox, Google Drive, etc.
- [ ] Test restore procedure (on test device if possible)
- [ ] Document backup locations

#### **Daily Backups (First Week)**

| Day | When | Action | Store Where |
|-----|------|--------|-------------|
| Day 1 | After first invoice | Create backup | All 3 locations |
| Day 2 | End of day | Create backup | iCloud + External |
| Day 3 | End of day | Create backup | iCloud + External |
| Day 4 | End of day | Create backup | iCloud + External |
| Day 5 | End of day | Create backup | iCloud + External |
| Day 6 | End of day | Create backup | All 3 locations |
| Day 7 | End of day | Create backup + test restore | All 3 locations |

**Rationale:** High-frequency backups during risky first week.

#### **Weekly Backups (Ongoing - Weeks 2+)**

- **When:** Every Friday at 5:00 PM (end of work week)
- **How:** Run backup script
- **Store:** iCloud Drive/Backups/TicTacStick/Weekly/
- **Naming:** `TicTacStick_Weekly_2025-11-22.json`
- **Retention:** Keep last 4 weeks (1 month of history)
- **Cleanup:** Delete backups older than 1 month

**Setup reminder:**
- Add calendar event: "TicTacStick Backup" every Friday 5pm
- Set notification: 15 minutes before

#### **Monthly Backups (Long-Term Archive)**

- **When:** Last business day of each month
- **How:** Run backup script
- **Store:** iCloud Drive/Backups/TicTacStick/Monthly/
- **Naming:** `TicTacStick_Archive_2025-11.json`
- **Retention:** Keep for 12 months (tax/audit purposes)
- **Cleanup:** Delete archives older than 12 months

**Rationale:** Tax records required for 7 years in Australia. Monthly backups provide checkpoint for financial data.

#### **Event-Driven Backups**

Create backup BEFORE:
- [ ] Updating app code
- [ ] Migrating to Phase 3 (cloud sync)
- [ ] Changing LocalStorage schema
- [ ] Major browser/iOS updates
- [ ] Any risky operations

Create backup AFTER:
- [ ] First invoice sent
- [ ] Milestone achieved (e.g., 10 invoices, 50 invoices)
- [ ] Large batch operations (e.g., import 20 clients)
- [ ] Major app changes deployed

---

### 2.5 Backup Storage Strategy

**The 3-2-1 Rule:**
- **3** copies of your data
- **2** different media types
- **1** offsite backup

**For TicTacStick:**

| Location | Type | Purpose | Accessibility |
|----------|------|---------|---------------|
| iPad Files app | Local | Quick access, fast restore | Immediate |
| iCloud Drive | Cloud | Automatic sync, accessible from any device | Fast (requires internet) |
| Email/Dropbox | Offsite | Disaster recovery, independent of Apple ecosystem | Moderate (requires login) |

**Directory structure (iCloud Drive):**

```
iCloud Drive/
└── TicTacStick/
    └── Backups/
        ├── Weekly/
        │   ├── TicTacStick_Weekly_2025-11-15.json
        │   ├── TicTacStick_Weekly_2025-11-22.json
        │   ├── TicTacStick_Weekly_2025-11-29.json
        │   └── TicTacStick_Weekly_2025-12-06.json
        ├── Monthly/
        │   ├── TicTacStick_Archive_2025-10.json
        │   ├── TicTacStick_Archive_2025-11.json
        │   └── TicTacStick_Archive_2025-12.json
        └── Emergency/
            └── TicTacStick_PreDeploy_2025-11-17.json
```

---

### 2.6 Backup Verification

**Don't assume backups work - TEST THEM!**

**Pre-deployment test (Do once before launch):**

1. **Create test backup**
   - Run backup script
   - Save to file

2. **Verify backup valid**
   - Open JSON file in text editor
   - Check file is not empty
   - Check JSON is valid (use jsonlint.com)
   - Check statistics section shows correct counts

3. **Test restore (on test environment)**
   - **WARNING:** Only test on separate browser profile or device
   - Run restore script
   - Paste backup JSON
   - Confirm restore
   - Verify data appears correctly

4. **Time the restore**
   - Should take < 5 minutes
   - If slower, investigate why
   - Document actual time

5. **Document procedure**
   - Note any issues
   - Create troubleshooting notes
   - Ensure you're confident in process

**Monthly verification (Ongoing):**

- Pick one monthly backup
- Open in text editor
- Verify JSON is valid
- Check statistics match expected values
- Don't restore (unless needed)

---

## 3. Deployment Methods

**Choose the deployment method that best fits your needs.**

### Comparison Matrix

| Method | Difficulty | Cost | Deploy Time | Best For | Offline Support |
|--------|-----------|------|-------------|----------|-----------------|
| **Local/Direct** | ⭐ Easy | Free | 0 min | Testing, offline use | ✅ Full |
| **GitHub Pages** | ⭐⭐ Moderate | Free | 1-2 min | Version control, free hosting | ✅ Yes (PWA) |
| **Netlify** | ⭐⭐ Moderate | Free | 10-20 sec | Fast deploys, preview URLs | ✅ Yes (PWA) |
| **Vercel** | ⭐⭐⭐ Advanced | Free | 15-30 sec | Professional, analytics | ✅ Yes (PWA) |

**Recommendation:** Start with **Local/Direct** for immediate use, then add **GitHub Pages** for accessibility.

---

### 3.1 Option 1: Local/Direct Use (Simplest)

**Best for:** Testing, personal use, full offline access

#### Pros:
- ✅ No hosting required
- ✅ Completely offline
- ✅ No deployment process
- ✅ Maximum privacy (data never leaves device)
- ✅ Zero cost

#### Cons:
- ❌ No cross-device access
- ❌ No public URL
- ❌ Manual file management
- ❌ No automatic updates

#### Steps:

**1. Backup current data (Critical)**
```
- Run backup script (Section 2.2)
- Save to 3 locations
- Verify backup valid
```

**2. Ensure all files are on device**
```
Check you have:
- index.html
- js/app.js
- js/invoice.js
- js/validation.js
- js/calc.js
- js/security.js
- css/styles.css
- manifest.json
- service-worker.js
- All other required files
```

**3. Open in Safari**
```
- Navigate to index.html file
- Should be in: Files app → On My iPad → TicTacStick → index.html
- Tap to open in Safari
- Or use "Share → Open in Safari"
```

**4. Verify Service Worker installs**
```
- Open Safari Developer Tools (if on Mac)
- Check Application → Service Workers
- Should show "activated and running"
- Test offline: Turn off WiFi, reload page
- Should still work
```

**5. Add to Home Screen (Important)**
```
- Open index.html in Safari
- Tap Share button (box with arrow)
- Scroll down, tap "Add to Home Screen"
- Name: "TicTacStick"
- Tap "Add"
- Icon appears on home screen
```

**6. Use as standalone app**
```
- Tap home screen icon
- Opens full-screen (no Safari UI)
- Behaves like native app
- All features work offline
```

**7. Test functionality**
```
- Create test quote
- Create test invoice
- Save invoice
- Verify data persists after closing/reopening
```

**8. Configure settings**
```
- Open Invoice Settings
- Enter bank details (BSB, account, ABN)
- Set payment terms
- Configure invoice numbering
- Save settings
```

**Done!** Ready to use locally. No further deployment needed.

---

### 3.2 Option 2: GitHub Pages (Free, Easy)

**Best for:** Free hosting, version control, easy updates, shareable URL

#### Pros:
- ✅ Free hosting (forever)
- ✅ Automatic version control (git)
- ✅ HTTPS included
- ✅ Easy updates (git push)
- ✅ Public or private repository
- ✅ Reliable (GitHub uptime ~99.9%)

#### Cons:
- ❌ 1-2 minute deploy time
- ❌ Requires GitHub account
- ❌ Public repo (unless GitHub Pro)
- ❌ Basic features only

#### Initial Setup (One-Time):

**Step 1: Create GitHub Repository**

```bash
# On desktop (Mac or PC with git installed)

# Navigate to your project directory
cd /path/to/tictacstick

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - TicTacStick v1.7 with invoice system"

# Create main branch
git branch -M main
```

**Step 2: Create repository on GitHub**

1. Go to https://github.com
2. Sign in (or create account)
3. Click "+" → "New repository"
4. Name: `tictacstick-app`
5. Description: "TicTacStick - Window Cleaning Quote & Invoice App"
6. Public or Private (your choice)
7. **Do NOT** initialize with README (we already have files)
8. Click "Create repository"

**Step 3: Push code to GitHub**

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/tictacstick-app.git

# Push code
git push -u origin main

# Enter GitHub username and password (or token)
```

**Step 4: Enable GitHub Pages**

1. Go to repository: https://github.com/YOUR_USERNAME/tictacstick-app
2. Click "Settings" tab
3. Scroll to "Pages" in left sidebar
4. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"
6. Wait 1-2 minutes for deployment

**Step 5: Get your URL**

```
Your app is now live at:
https://YOUR_USERNAME.github.io/tictacstick-app/

Example: https://gerard925.github.io/tictacstick-app/
```

**Step 6: Test deployment**

1. Open URL in Safari
2. Verify app loads
3. Check all features work
4. Test Service Worker (offline mode)
5. Add to Home Screen on iPad

**Step 7: Configure custom domain (Optional)**

If you have a domain (e.g., app.925pressureglass.com.au):

1. Create file `CNAME` in repository root
2. Contents: `app.925pressureglass.com.au`
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: YOUR_USERNAME.github.io
   ```
4. Wait for DNS propagation (24-48 hours)
5. GitHub automatically provisions SSL

#### Future Updates:

**After making changes to code:**

```bash
# Add changed files
git add .

# Commit with descriptive message
git commit -m "Update: Added XYZ feature"

# Push to GitHub
git push

# Auto-deploys in 1-2 minutes
```

**Check deployment status:**
- Go to repository → "Actions" tab
- See deployment progress
- Green checkmark = deployed successfully

---

### 3.3 Option 3: Netlify (Fastest Deploy)

**Best for:** Instant deploys, preview URLs, custom domains, best developer experience

#### Pros:
- ✅ Free tier (100GB bandwidth/month)
- ✅ Fastest deploys (10-20 seconds)
- ✅ Preview URLs for branches
- ✅ Easy rollback (one click)
- ✅ Automatic HTTPS
- ✅ Custom domains included
- ✅ Form handling (future feature)
- ✅ Serverless functions (if needed for Phase 3)

#### Cons:
- ❌ Requires GitHub account
- ❌ Bandwidth limits (free tier)

#### Initial Setup:

**Step 1: Push code to GitHub**
(Follow GitHub Pages steps 1-3 above if not done)

**Step 2: Sign up for Netlify**

1. Go to https://netlify.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Netlify to access GitHub

**Step 3: Create new site**

1. Click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Select `tictacstick-app` repository
4. Configure build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `/` (root)
   - **Branch:** `main`
5. Click "Deploy site"

**Step 4: Get deployment URL**

```
Netlify assigns random URL:
https://random-name-123456.netlify.app

Example: https://tictacstick-app.netlify.app
```

**Step 5: Customize site name (Optional)**

1. Go to "Site settings"
2. Click "Change site name"
3. Enter: `tictacstick-app` (or your preferred name)
4. New URL: https://tictacstick-app.netlify.app

**Step 6: Configure custom domain (Optional)**

1. Go to "Domain settings"
2. Click "Add custom domain"
3. Enter: `app.925pressureglass.com.au`
4. Netlify provides DNS configuration
5. Update DNS records at your registrar
6. Netlify auto-provisions SSL (Let's Encrypt)
7. Force HTTPS: ON

**Step 7: Configure deploy settings**

1. Go to "Site settings" → "Build & deploy"
2. Deploy contexts:
   - Production branch: `main`
   - Branch deploys: All (optional, for testing)
   - Deploy previews: On (for pull requests)
3. Save settings

**Step 8: Test deployment**

1. Open Netlify URL
2. Verify app loads correctly
3. Test all features
4. Check Service Worker
5. Test offline mode

#### Future Updates:

**After making changes:**

```bash
git add .
git commit -m "Update: XYZ feature"
git push
```

- Netlify automatically detects push
- Deploys in 10-20 seconds
- Live immediately
- Old version retained (can rollback)

**View deployment:**
- Go to Netlify dashboard
- See "Deploys" tab
- View build log
- Click "Preview deploy" to test before publishing

**Rollback to previous version:**
- Go to "Deploys" tab
- Find previous successful deploy
- Click "..." → "Publish deploy"
- Instant rollback!

---

### 3.4 Option 4: Vercel (Developer-Friendly)

**Best for:** Professional hosting, analytics, edge network, fast global delivery

#### Pros:
- ✅ Free tier (100GB bandwidth/month)
- ✅ Fast deploys (15-30 seconds)
- ✅ Edge network (fast globally)
- ✅ Preview deployments
- ✅ Analytics dashboard (paid)
- ✅ Great developer experience
- ✅ Automatic HTTPS
- ✅ Serverless functions (if needed)

#### Cons:
- ❌ Slightly more complex than Netlify
- ❌ Analytics require paid plan ($20/month)

#### Initial Setup:

**Step 1: Push code to GitHub**
(Follow GitHub Pages steps 1-3 if not done)

**Step 2: Sign up for Vercel**

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

**Step 3: Import project**

1. Click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Select `tictacstick-app` from list
4. Click "Import"

**Step 4: Configure project**

1. Project name: `tictacstick-app`
2. Framework Preset: "Other" (no framework)
3. Root Directory: `./` (leave as default)
4. Build Command: (leave empty)
5. Output Directory: (leave empty)
6. Install Command: (leave empty)
7. Click "Deploy"

**Step 5: Wait for deployment**

```
Deploys in 15-30 seconds
URL: https://tictacstick-app.vercel.app

Or auto-generated: https://tictacstick-app-abcd1234.vercel.app
```

**Step 6: Configure custom domain (Optional)**

1. Go to project → "Settings" → "Domains"
2. Add domain: `app.925pressureglass.com.au`
3. Follow DNS configuration instructions
4. SSL automatically provisioned

**Step 7: Test deployment**

1. Open Vercel URL
2. Verify app works
3. Test all features
4. Check performance (should be very fast)

#### Future Updates:

**After making changes:**

```bash
git add .
git commit -m "Update: XYZ"
git push
```

- Vercel detects push automatically
- Deploys in 15-30 seconds
- Creates preview URL for branch
- Merging to `main` deploys to production

**View deployments:**
- Go to Vercel dashboard
- See all deployments
- View build logs
- Instant rollback available

---

### 3.5 Deployment Decision Matrix

**Which method should you choose?**

| Your Situation | Recommended Method | Rationale |
|----------------|-------------------|-----------|
| Just want to use it on iPad | Local/Direct | Simplest, no setup needed |
| Want to access from multiple devices | GitHub Pages | Free, reliable, easy |
| Need fast updates frequently | Netlify | 10-20 second deploys |
| Want professional hosting | Vercel | Best performance, analytics |
| Maximum privacy/offline | Local/Direct | Data never leaves device |
| Free hosting, easy updates | GitHub Pages or Netlify | Both excellent free options |
| Custom domain required | Netlify or Vercel | Easier domain setup |

**Recommendation for Gerard (925 Pressure Glass):**

**Phase 1 (Immediate):**
- Deploy **Local/Direct** today
- Use on iPad immediately
- Zero setup time
- Start creating real invoices

**Phase 2 (Within 1 week):**
- Deploy to **GitHub Pages**
- Get version control
- Access from office computer
- Shareable URL (if needed)

**Phase 3 (Future):**
- Migrate to **Netlify** when moving to cloud sync
- Fast deploys
- Serverless functions for backend
- Professional hosting

---

## 4. Post-Deployment Verification

**Critical: Verify deployment was successful before using with real customers.**

### 4.1 Deployment Smoke Tests (10 minutes)

**Run ALL tests immediately after deploying.**

#### **Test 1: Basic Functionality (2 minutes)**

- [ ] **App loads without errors**
  - Open deployed URL
  - Page loads completely
  - No blank screen
  - No "404 Not Found"

- [ ] **All scripts load**
  - Open DevTools → Network tab
  - Reload page
  - Verify all JS files load (200 status)
  - Check: app.js, invoice.js, validation.js, calc.js, security.js

- [ ] **Service Worker installs**
  - Open DevTools → Application → Service Workers
  - Should show "activated and running"
  - If not: Clear cache, reload, check again

- [ ] **Console shows no errors**
  - Open DevTools → Console
  - Should be clean (no red errors)
  - Warnings OK, errors NOT OK
  - If errors: Investigate before proceeding

---

#### **Test 2: Data Integrity (2 minutes)**

- [ ] **Existing quotes visible**
  - Navigate to Quotes section
  - Verify all quotes present
  - Count matches expected number
  - Open one quote, verify details correct

- [ ] **Existing clients visible**
  - Navigate to Clients section
  - Verify all clients present
  - Count matches expected number
  - Open one client, verify details correct

- [ ] **Existing invoices visible (if any)**
  - Navigate to Invoices section
  - Verify all invoices present
  - Count matches expected number
  - Open one invoice, verify details correct

- [ ] **All data intact (no corruption)**
  - Spot-check several records
  - Verify no garbled text
  - Verify no missing fields
  - Verify calculations correct

---

#### **Test 3: Invoice Features (3 minutes)**

- [ ] **Can create new invoice**
  - Click "New Invoice"
  - Invoice form appears
  - All fields present
  - No errors

- [ ] **Can add line items**
  - Add 1 line item: "Test Service - $100"
  - Verify appears in list
  - Add 2nd line item: "Another Service - $50"
  - Verify both visible

- [ ] **GST calculates correctly**
  - Check subtotal: $150
  - Check GST (10%): $15
  - Check total: $165
  - Verify math correct

- [ ] **Can save invoice**
  - Fill in client details
  - Click "Save Invoice"
  - Success message appears
  - No errors in console

- [ ] **Invoice appears in list**
  - Navigate to invoice list
  - Find newly created invoice
  - Verify details correct
  - Delete test invoice after verification

---

#### **Test 4: Offline Mode (2 minutes)**

- [ ] **Turn off WiFi/cellular**
  - Disable WiFi on device
  - Disable cellular data
  - Device should be completely offline

- [ ] **App still works**
  - Reload app (should load from cache)
  - Navigate between sections
  - All UI functional

- [ ] **Can create invoice offline**
  - Create new invoice
  - Add line items
  - Fill in details
  - Save invoice

- [ ] **Data saves to LocalStorage**
  - Check DevTools → Application → LocalStorage
  - Verify new invoice saved
  - Data persists offline

- [ ] **Turn WiFi back on - no errors**
  - Re-enable WiFi
  - Reload app
  - Verify no sync errors (none expected - LocalStorage only)
  - Verify data still intact

---

#### **Test 5: Mobile Test (1 minute)**

- [ ] **Open on iPhone**
  - Navigate to deployment URL
  - App loads correctly
  - UI responsive (fits screen)
  - Touch interactions work

- [ ] **Open on iPad**
  - Navigate to deployment URL
  - App loads correctly
  - UI optimized for tablet
  - Touch interactions work

- [ ] **Touch interactions work**
  - Tap buttons
  - Scroll lists
  - Fill in forms
  - All responsive, no lag

- [ ] **UI displays correctly**
  - No overlapping elements
  - Text readable
  - Buttons accessible
  - Professional appearance

- [ ] **No layout issues**
  - Rotate device (portrait/landscape)
  - UI adapts correctly
  - No broken layouts
  - All content visible

---

### 4.2 Smoke Test Results

**After completing all tests:**

| Test | Status | Notes |
|------|--------|-------|
| Basic Functionality | ✅ Pass / ❌ Fail | |
| Data Integrity | ✅ Pass / ❌ Fail | |
| Invoice Features | ✅ Pass / ❌ Fail | |
| Offline Mode | ✅ Pass / ❌ Fail | |
| Mobile Test | ✅ Pass / ❌ Fail | |

**Decision:**

- **All tests passed (✅✅✅✅✅):**
  - ✅ Deployment successful
  - ✅ Ready to proceed to gradual rollout (Section 5)

- **Any test failed (❌):**
  - ⛔ STOP - Do not use with real customers yet
  - 🔍 Investigate failures
  - 🛠️ Fix issues
  - 🔄 Re-run smoke tests
  - Only proceed when ALL tests pass

---

### 4.3 Performance Verification

**Optional but recommended - Check app performance.**

#### **Load Time Test**

1. **Clear browser cache**
2. **Open deployment URL**
3. **Measure load time:**
   - DevTools → Network tab
   - Reload page
   - Check "Load" time at bottom
   - **Target:** < 2 seconds (first load)
   - **Target:** < 1 second (cached load)

#### **Lighthouse Audit (Desktop Chrome)**

1. Open deployed URL in Chrome
2. DevTools → Lighthouse tab
3. Select: Performance, Accessibility, Best Practices, SEO, PWA
4. Click "Analyze page load"
5. Review scores:
   - **Performance:** Target 90+
   - **Accessibility:** Target 90+
   - **Best Practices:** Target 90+
   - **PWA:** Target 90+

#### **Storage Usage**

1. DevTools → Application → Storage
2. Check "Usage" section
3. Verify: < 5 MB used (LocalStorage is small)
4. Note: Plenty of room for growth

---

### 4.4 Security Verification

**Quick security checks post-deployment.**

- [ ] **HTTPS enabled**
  - URL starts with `https://`
  - Padlock icon in browser
  - Certificate valid

- [ ] **No mixed content warnings**
  - Console shows no "Mixed content" warnings
  - All resources loaded via HTTPS

- [ ] **XSS prevention working**
  - Test: Enter `<script>alert('test')</script>` in client name
  - Expected: Script stripped, no alert
  - Actual: _____

- [ ] **CSP headers (if configured)**
  - DevTools → Network → Select any file → Response Headers
  - Look for `Content-Security-Policy`
  - Present: Yes / No (OK if No - not critical for Phase 2)

---

## 5. Gradual Rollout Plan

**DO NOT use all features immediately. Phase in carefully to minimize risk.**

### 5.1 Rollout Philosophy

**Why gradual rollout?**
- Minimize financial risk
- Catch issues early (with low-value invoices)
- Build confidence incrementally
- Easy to rollback if needed
- Learn best practices before full adoption

**3-Week Rollout Timeline:**

| Week | Focus | Volume | Risk Level |
|------|-------|--------|------------|
| Week 1 | Single invoice test | 1 invoice | Low |
| Week 2 | Limited rollout | 3-5 invoices | Medium |
| Week 3-4 | Full production | All invoices | Normal |

---

### 5.2 Week 1: Soft Launch (Single Invoice Test)

**Goal:** Verify system works with ONE real customer transaction.

#### **Day 1 (Monday) - First Invoice**

**Morning:**
- [ ] **Create full backup**
  - Run backup script
  - Save to all 3 locations
  - Verify backup valid
  - Label: "Pre-First-Invoice Backup"

- [ ] **Select lowest-risk customer**
  - Criteria:
    - Small amount ($200-$500)
    - Trusted, long-term client
    - Simple job (few line items)
    - Forgiving if issues arise
    - Has email address

- [ ] **Create invoice**
  - Use invoice system
  - Add accurate line items
  - Verify GST calculation (10%)
  - Verify total correct
  - Double-check bank details
  - Review for errors

- [ ] **Generate PDF/email invoice**
  - Export as PDF (or send via email)
  - Verify PDF displays correctly
  - Check all details present
  - Professional appearance

**Afternoon:**
- [ ] **Send invoice to customer**
  - Email with friendly message (see Section 8)
  - Attach PDF
  - Include payment instructions
  - Keep copy of sent email

- [ ] **Monitor for issues**
  - Check email for customer questions
  - Check phone for calls
  - Be ready to explain new system

**Evening:**
- [ ] **Review day**
  - Any issues encountered?
  - Customer confusion?
  - App errors?
  - Document findings

---

#### **Day 2-3 (Tuesday-Wednesday) - Monitor**

- [ ] **Check for customer feedback**
  - Email questions?
  - Phone calls?
  - Payment received?

- [ ] **Check app for errors**
  - Open app on iPad
  - Review console (if accessible)
  - Verify invoice still saved
  - No data corruption

- [ ] **Document observations**
  - What went well?
  - What was confusing?
  - What could be improved?
  - Customer reaction?

**If issues found:**
- 🛑 STOP creating more invoices
- 🔍 Investigate root cause
- 🛠️ Fix issues
- 🧪 Test fix
- 📝 Document resolution

---

#### **Day 4-5 (Thursday-Friday) - Payment Processing**

**When payment received:**

- [ ] **Record payment on invoice**
  - Open invoice in system
  - Click "Record Payment"
  - Enter payment details:
    - Amount received
    - Date received
    - Payment method (bank transfer, cash, etc.)
  - Save

- [ ] **Verify payment tracking works**
  - Invoice status updates to "Paid"
  - Payment amount displayed correctly
  - Date recorded accurately

- [ ] **Mark invoice as paid**
  - Confirm status shows "Paid"
  - Invoice moves to "Paid Invoices" section
  - No longer appears in "Unpaid" list

- [ ] **Verify status updates**
  - Refresh app
  - Status persists (LocalStorage working)
  - No data loss

**End of Week:**
- [ ] **Friday evening tasks**
  - Create weekly backup
  - Review entire week
  - Document lessons learned
  - Decide: Continue or fix issues?

---

#### **Weekend - Week 1 Review**

- [ ] **Create backup**
  - Run backup script
  - Save to all 3 locations
  - Label: "End-of-Week-1 Backup"

- [ ] **Review Week 1 experience**
  - Invoice creation smooth?
  - Customer understood new system?
  - Payment tracking worked?
  - Any bugs/issues?

- [ ] **Document any issues**
  - Write down every problem
  - Note workarounds used
  - Prioritize fixes

- [ ] **Make Go/No-Go decision**
  - ✅ **GO (proceed to Week 2)** if:
    - Invoice worked perfectly
    - Client received invoice without issues
    - Payment tracked correctly
    - No critical bugs
    - Confident in system

  - ⛔ **NO-GO (fix issues first)** if:
    - Any calculation errors
    - Data corruption
    - Customer confusion (major)
    - Critical bugs
    - Not confident in system

---

### 5.3 Week 2: Limited Rollout (3-5 Invoices)

**Goal:** Test system with variety of invoice types.

#### **Monday-Friday - Create 3-5 invoices**

**Invoice variety (test different scenarios):**

1. **Residential job ($300-$800)**
   - Standard window cleaning
   - 5-8 line items
   - Regular customer

2. **Commercial job ($1000-$2000)**
   - Larger amount
   - 10+ line items
   - Business client

3. **Pressure cleaning job ($400-$600)**
   - Different service type
   - Verify presets work
   - Different GST scenario

4. **Mixed job - windows + pressure ($800-$1500)**
   - Combined services
   - Complex line items
   - Multiple item types

5. **Small job ($150-$250)**
   - Few line items
   - Quick invoice
   - Edge case (low value)

**For EACH invoice:**

- [ ] **Before creating:**
  - Quick backup (if first invoice of day)
  - Select appropriate customer

- [ ] **While creating:**
  - Use relevant presets
  - Verify calculations
  - Check GST (10%)
  - Review for errors

- [ ] **After sending:**
  - Monitor customer feedback
  - Check for questions
  - Note any confusion

- [ ] **After payment:**
  - Record payment promptly
  - Verify status updates
  - Confirm tracking works

---

#### **Key Observations - Week 2**

Track these metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Invoices created | 3-5 | ____ |
| Invoices sent successfully | 100% | ____ |
| Customer confusion incidents | 0 | ____ |
| Calculation errors | 0 | ____ |
| Data loss incidents | 0 | ____ |
| Time saved vs paper (per invoice) | 5-10 min | ____ |
| Payment tracking success | 100% | ____ |

**Questions to answer:**

- [ ] Does invoice numbering work correctly?
  - Sequential numbering?
  - No duplicates?
  - No gaps?

- [ ] Do different job types work?
  - Window cleaning?
  - Pressure cleaning?
  - Mixed jobs?

- [ ] Do large invoices work?
  - $2000+ amounts?
  - Calculations correct?
  - UI handles large numbers?

- [ ] Do complex invoices work?
  - 10+ line items?
  - UI scrolls correctly?
  - Totals calculate accurately?

---

#### **Weekend - Week 2 Review**

- [ ] **Create backup**
  - Label: "End-of-Week-2 Backup"
  - Store in all 3 locations

- [ ] **Review all invoices created**
  - Open each one
  - Verify data intact
  - Check calculations
  - Confirm no corruption

- [ ] **Calculate time saved**
  - Estimate: Time with invoice system
  - Compare: Time with paper invoices
  - Calculate: Total time saved
  - Expected: 15-30 minutes total

- [ ] **Make decision: Full rollout or continue limited?**

  **Full rollout (Week 3) if:**
  - ✅ All 3-5 invoices successful
  - ✅ Zero critical issues
  - ✅ Customer acceptance high
  - ✅ Time savings realized
  - ✅ Confident in system

  **Continue limited rollout if:**
  - ⚠️ Minor issues found (fix first)
  - ⚠️ Some customer confusion (refine messaging)
  - ⚠️ Not fully confident yet (more practice needed)

---

### 5.4 Week 3-4: Full Production Use

**Goal:** Use invoice system for ALL new jobs.

#### **Transition to Full Production**

**Monday Week 3:**
- [ ] **Announce transition**
  - "All invoices now digital"
  - Stop using paper/manual invoices
  - Update processes

- [ ] **Daily backup routine**
  - Every evening: Create backup
  - Store in iCloud Drive
  - Weekly: Store in external location

- [ ] **Monitor daily for issues**
  - Morning: Quick app check
  - After each invoice: Verify saved
  - Evening: Review day's invoices

**Tuesday-Friday Week 3:**
- [ ] **Use for ALL new jobs**
  - Every invoice goes through system
  - No exceptions
  - Build muscle memory

- [ ] **Track metrics daily**
  - Invoices created: ____
  - Time saved: ____
  - Issues encountered: ____

**Week 4:**
- [ ] **Continue full production use**
- [ ] **Refine workflow**
- [ ] **Document best practices**
- [ ] **Train any staff (if applicable)**

---

#### **Success Metrics - Week 3-4**

**Technical Success:**
- [ ] 100% of invoices created digitally
- [ ] Zero data loss incidents
- [ ] Zero calculation errors
- [ ] App uptime: 100% (always accessible)
- [ ] No critical bugs

**Business Success:**
- [ ] Invoices sent faster (vs paper)
- [ ] Time saved: 15-30 min/day
- [ ] Payment tracking easier
- [ ] Better recordkeeping
- [ ] Professional appearance

**User Experience Success:**
- [ ] Confident using system
- [ ] Faster than previous method
- [ ] Easy to track payments
- [ ] Would continue using
- [ ] Would recommend to others

---

#### **End of Week 4 - Celebrate Success! 🎉**

**If you've reached this point:**

- ✅ You've successfully deployed to production
- ✅ You've created 20+ invoices (estimated)
- ✅ You've saved hours of admin time
- ✅ You have better financial records
- ✅ You're ready for Phase 3 (cloud sync)

**Take a moment to:**
- [ ] Review accomplishment
- [ ] Document lessons learned
- [ ] Create final "Month 1 Complete" backup
- [ ] Plan next improvements (Phase 3?)
- [ ] Pat yourself on the back!

---

### 5.5 Rollout Risk Mitigation

**What if things go wrong during rollout?**

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|-----------|--------|------------|-------------|
| Data loss | Low | High | Daily backups | Restore from backup |
| Calculation error | Low | High | Test before each use | Manual calculation verification |
| App won't load | Low | Medium | Test deployment first | Use backup deployment URL |
| Customer confusion | Medium | Low | Clear communication | Phone call to explain |
| Payment tracking fails | Low | Medium | Verify after each payment | Manual spreadsheet backup |
| Browser crash loses data | Low | Medium | Auto-save every 30sec | Restore from autosave |

**Emergency contacts:**
- Gerard (you): [Your phone number]
- Backup support: [If applicable]

**Rollback trigger:**
- If >1 critical issue in same week → Rollback
- If data corruption detected → Immediate rollback
- If customer complaints >2 → Pause and investigate

---

## 6. Monitoring & Error Tracking

**Know immediately if something breaks.**

### 6.1 Why Monitor?

- **Early detection** - Catch issues before they become serious
- **Data protection** - Detect corruption early
- **User confidence** - Know system is working correctly
- **Continuous improvement** - Identify areas to improve
- **Audit trail** - Track what happened and when

---

### 6.2 Manual Monitoring (Week 1-4)

**Daily monitoring routine - Takes 5-10 minutes.**

#### **Every Morning (5 minutes)**

- [ ] **Open app on primary device (iPad)**
  - Should load within 2 seconds
  - No blank screens
  - No error messages

- [ ] **Check browser console for errors**
  - If on Mac: Connect iPad, use Safari Web Inspector
  - Or: Check for visible errors in UI
  - Red errors = investigate immediately
  - Warnings = note, but OK

- [ ] **Verify last invoice still exists**
  - Navigate to invoice list
  - Find yesterday's last invoice
  - Open it, verify details intact
  - Confirms no overnight data loss

- [ ] **Quick functionality test**
  - Create test quote (don't save)
  - Verify calculations work
  - Cancel test quote
  - Confirms app functional

**Red flags (investigate immediately):**
- ⚠️ App won't load
- ⚠️ Console errors (especially storage-related)
- ⚠️ Data missing
- ⚠️ Calculations wrong
- ⚠️ UI broken

---

#### **After Each Invoice (2 minutes)**

- [ ] **Check console for errors**
  - Right after saving invoice
  - Look for red errors
  - Note any warnings

- [ ] **Verify invoice saved**
  - Close invoice
  - Navigate to invoice list
  - Find newly created invoice
  - Open it, verify details correct

- [ ] **Verify appears in invoice list**
  - Correct invoice number
  - Correct customer name
  - Correct total amount
  - Correct date

- [ ] **Take screenshot (evidence of success)**
  - Optional but recommended
  - Screenshot of completed invoice
  - Store in Photos app
  - Useful for records/troubleshooting

**If any step fails:**
- 🛑 STOP creating invoices
- 🔍 Investigate immediately
- 💾 Create emergency backup
- 📝 Document issue
- 🛠️ Fix before continuing

---

#### **End of Day (5 minutes)**

- [ ] **Review all invoices created today**
  - Open invoice list
  - Scroll through today's invoices
  - Spot-check 2-3 invoices
  - Verify all intact

- [ ] **Check for any anomalies**
  - Missing data?
  - Wrong calculations?
  - Duplicate invoice numbers?
  - Any errors?

- [ ] **Create daily backup**
  - Run backup script (Section 2.2)
  - Save to iCloud Drive
  - Label: `TicTacStick_Daily_2025-11-17.json`
  - Verify file saved correctly

- [ ] **Document any issues in notes**
  - Use Notes app or similar
  - Write down any problems
  - Note how you resolved them
  - Track patterns

**End of day checklist:**

| Check | Status | Notes |
|-------|--------|-------|
| All invoices saved? | ✅ / ❌ | |
| Any errors today? | Yes / No | |
| Backup created? | ✅ / ❌ | |
| Issues documented? | ✅ / ❌ | |

---

### 6.3 Weekly Monitoring (15 minutes every Friday)

- [ ] **Review week's activity**
  - Total invoices created: ____
  - Total paid: ____
  - Total unpaid: ____
  - Any issues: ____

- [ ] **Data integrity check**
  - Export all invoices as JSON
  - Verify export successful
  - Check file size reasonable
  - Store export as backup

- [ ] **Performance check**
  - App load time: ____ seconds
  - Feels fast? Yes / No
  - Any lag? Yes / No
  - Where: ____

- [ ] **Storage check**
  - DevTools → Application → Storage
  - Usage: ____ KB / ____ MB
  - Plenty of space? Yes / No
  - Approaching limit (5MB)? Yes / No

- [ ] **Create weekly backup**
  - Run backup script
  - Save to all 3 locations
  - Label: `TicTacStick_Weekly_2025-11-22.json`
  - Delete old weekly backups (keep last 4)

---

### 6.4 Automated Monitoring (Optional)

**For more advanced monitoring, add error logging.**

#### **Option 1: Browser Console Logger**

Add to `js/app.js` (at the very top):

```javascript
/**
 * Error Logger - Automatically logs all errors to LocalStorage
 * View errors: console.log(JSON.parse(localStorage.getItem('error-log')))
 */

(function initErrorLogger() {
  const MAX_ERRORS = 50; // Keep last 50 errors

  // Log all JavaScript errors
  window.addEventListener('error', function(event) {
    logError({
      type: 'JavaScript Error',
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null
    });
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    logError({
      type: 'Unhandled Promise Rejection',
      message: event.reason,
      promise: String(event.promise)
    });
  });

  function logError(errorData) {
    try {
      // Get existing error log
      let errorLog = JSON.parse(localStorage.getItem('error-log') || '[]');

      // Add new error with timestamp
      errorLog.push({
        timestamp: new Date().toISOString(),
        ...errorData,
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // Keep only last MAX_ERRORS errors
      if (errorLog.length > MAX_ERRORS) {
        errorLog = errorLog.slice(-MAX_ERRORS);
      }

      // Save back to LocalStorage
      localStorage.setItem('error-log', JSON.stringify(errorLog));

      // Also log to console for immediate visibility
      console.error('Error logged:', errorData);
    } catch (e) {
      // If logging fails, at least log to console
      console.error('Failed to log error to LocalStorage:', e);
      console.error('Original error:', errorData);
    }
  }

  console.log('✅ Error logger initialized');
})();

/**
 * View error log:
 * console.log(JSON.parse(localStorage.getItem('error-log')))
 *
 * Clear error log:
 * localStorage.removeItem('error-log')
 */
```

**How to use:**

1. **View errors:**
   ```javascript
   // In browser console:
   JSON.parse(localStorage.getItem('error-log'))
   ```

2. **Check for errors daily:**
   ```javascript
   // In browser console:
   const errors = JSON.parse(localStorage.getItem('error-log') || '[]');
   console.log('Total errors:', errors.length);
   if (errors.length > 0) {
     console.log('Recent errors:', errors.slice(-5));
   }
   ```

3. **Clear old errors:**
   ```javascript
   // After reviewing:
   localStorage.removeItem('error-log');
   ```

---

#### **Option 2: Sentry.io (Production Error Tracking)**

**If you want professional error monitoring:**

1. **Sign up at sentry.io**
   - Free tier: 5,000 errors/month
   - Email alerts on errors
   - Error dashboard

2. **Add to `index.html` (before closing `</head>`):**

```html
<!-- Sentry Error Tracking -->
<script
  src="https://browser.sentry-cdn.com/7.100.0/bundle.min.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
<script>
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN_HERE', // Get from Sentry dashboard
    environment: 'production',
    release: 'tictacstick@1.7.0',

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Only send errors, not debug info
    beforeSend(event, hint) {
      // Don't send errors in debug mode
      if (localStorage.getItem('debug-enabled') === 'true') {
        return null;
      }
      return event;
    },

    // Tag errors with user context
    initialScope: {
      tags: {
        app: 'tictacstick',
        version: '1.7'
      }
    }
  });
</script>
```

3. **Get email alerts:**
   - Sentry emails you when errors occur
   - See error details, stack trace, user context
   - Track error frequency

4. **View dashboard:**
   - Go to sentry.io
   - See all errors
   - Filter by date, error type
   - Prioritize fixes

**Recommended for:**
- Full production use (Week 3+)
- High-value deployments
- Peace of mind

**Optional for:**
- Week 1-2 (manual monitoring sufficient)
- Low-volume use

---

### 6.5 Monitoring Checklist Summary

**Daily (5-10 min):**
- [ ] Morning: Check app loads, verify data intact
- [ ] After each invoice: Verify saved correctly
- [ ] Evening: Create backup, review day

**Weekly (15 min):**
- [ ] Review week's invoices
- [ ] Check performance
- [ ] Check storage
- [ ] Create weekly backup

**Monthly (30 min):**
- [ ] Review month's metrics
- [ ] Create monthly archive backup
- [ ] Analyze trends
- [ ] Plan improvements

---

## 7. Rollback Procedure

**If something goes catastrophically wrong, revert quickly.**

### 7.1 When to Rollback

**Rollback triggers - Act immediately:**

| Situation | Severity | Action |
|-----------|----------|--------|
| 🚨 Data corruption detected | CRITICAL | Immediate rollback |
| 🚨 Invoices calculating wrong amounts | CRITICAL | Immediate rollback |
| 🚨 Multiple customers report issues | CRITICAL | Immediate rollback |
| 🚨 App completely broken (won't load) | CRITICAL | Immediate rollback |
| ⚠️ Minor UI glitch | LOW | Note, fix later |
| ⚠️ One customer confused | LOW | Provide support, continue |
| ⚠️ Slow performance | MEDIUM | Monitor, optimize if persists |

**When in doubt:**
- If you've lost confidence in the system → Rollback
- If you're worried about data safety → Rollback
- If multiple small issues stack up → Rollback

**Remember:** It's better to rollback safely than continue with broken system.

---

### 7.2 Emergency Rollback Procedure (5 minutes)

**Follow these steps in order. Do NOT skip steps.**

#### **Step 1: Stop Using Immediately**

- [ ] **Stop creating new invoices**
  - Don't create any more data
  - Don't edit existing data
  - Minimize further risk

- [ ] **Inform team to stop using (if applicable)**
  - Text/call any staff
  - "STOP using invoice system immediately"
  - "Issues detected, rolling back"

- [ ] **Switch to backup method**
  - Use paper invoices temporarily
  - Use email templates
  - Use manual Word/PDF creation
  - Whatever worked before

**Time:** 2 minutes

---

#### **Step 2: Preserve Current State**

- [ ] **Create emergency backup (even if corrupted)**
  - Run backup script (Section 2.2)
  - Save as: `TicTacStick_EMERGENCY_2025-11-17.json`
  - Store in all 3 locations
  - **Rationale:** May contain partial good data

- [ ] **Save error logs**
  - If using error logger (Section 6.4):
    ```javascript
    copy(localStorage.getItem('error-log'))
    ```
  - Paste into file: `errors_2025-11-17.txt`
  - Save to iCloud Drive

- [ ] **Take screenshots of issues**
  - Screenshot any errors
  - Screenshot broken UI
  - Screenshot data corruption
  - Store in Photos app

- [ ] **Document exactly what happened**
  - Open Notes app
  - Write:
    - What were you doing when issue occurred?
    - What error messages appeared?
    - What data is affected?
    - When did this start?
    - Any recent changes?

**Time:** 3 minutes

---

#### **Step 3: Restore from Last Good Backup**

- [ ] **Identify last known good backup**
  - Check iCloud Drive/Backups/
  - Find most recent backup BEFORE issues started
  - Verify backup file valid (not corrupted)
  - If unsure: Use backup from 1 day ago

- [ ] **Open browser console**
  - Connect iPad to Mac (if needed)
  - Safari → Develop → [iPad] → TicTacStick
  - Or use desktop browser if deployed

- [ ] **Paste restore function**
  - Copy restore script from Section 2.3
  - Paste entire function into console
  - Press Enter (loads function)

- [ ] **Load backup file**
  - Open backup JSON file
  - Select ALL contents (Cmd+A)
  - Copy (Cmd+C)

- [ ] **Run restore**
  - In console, type:
    ```javascript
    restoreBackup(`PASTE_BACKUP_JSON_HERE`)
    ```
  - Press Enter
  - Confirm restore when prompted

- [ ] **Wait for reload**
  - Page reloads automatically
  - Takes 3-5 seconds

**Time:** 5 minutes

---

#### **Step 4: Verify Rollback Success**

- [ ] **Check all invoices present**
  - Open invoice list
  - Count total invoices
  - Compare to expected number
  - Open 2-3 invoices, verify details

- [ ] **Check all clients present**
  - Open client list
  - Count total clients
  - Spot-check details

- [ ] **Check all quotes present**
  - Open quote history
  - Verify recent quotes there
  - Spot-check details

- [ ] **Create test quote (not invoice)**
  - Create simple test quote
  - Verify calculations work
  - **Don't create invoice yet**
  - Delete test quote

- [ ] **Verify calculations work**
  - Calculator functioning?
  - GST calculates correctly?
  - Totals add up?

**If verification fails:**
- Try restoring from older backup
- Repeat Step 3 with previous day's backup
- Keep going back until you find clean backup

**Time:** 5 minutes

---

#### **Step 5: Revert Code (if using hosting)**

**If you deployed new code that caused issues:**

##### **GitHub Pages:**

```bash
# Find last good commit
git log --oneline

# Identify commit hash before issue (e.g., abc123)
git revert HEAD  # Revert most recent commit

# Or reset to specific commit
git reset --hard abc123

# Force push (overwrites remote)
git push -f origin main

# Wait 1-2 minutes for GitHub Pages to redeploy
```

##### **Netlify:**

1. Go to Netlify dashboard
2. Click project
3. Go to "Deploys" tab
4. Find last successful deploy before issues
5. Click "..." → "Publish deploy"
6. Confirm
7. **Instant rollback!**

##### **Vercel:**

1. Go to Vercel dashboard
2. Click project
3. Go to "Deployments" tab
4. Find last successful deployment before issues
5. Click "..." → "Promote to Production"
6. Confirm
7. **Instant rollback!**

##### **Local deployment:**

- Copy old files back from backup
- Replace current files
- Reload app

**Time:** 2-5 minutes (depending on method)

---

#### **Step 6: Investigate Issue**

**DO NOT re-deploy until you understand what went wrong.**

- [ ] **Review error logs**
  - Check emergency backup errors
  - Check browser console errors
  - Look for patterns

- [ ] **Identify root cause**
  - What triggered the issue?
  - Code bug?
  - Data corruption?
  - Browser issue?
  - User error?

- [ ] **Test fix in separate environment**
  - Create test deployment
  - Fix the bug
  - Test thoroughly
  - Verify fix works

- [ ] **Don't re-deploy until confident**
  - Fixed and tested?
  - Root cause understood?
  - Prevention measures in place?
  - **Then** re-deploy

**Time:** Varies (could be hours or days)

---

#### **Step 7: Communicate (if customers affected)**

**If customers received wrong invoices or experienced issues:**

##### **Email Template:**

```
Subject: Correction to Recent Invoice

Hi [Customer Name],

I'm writing to let you know about a technical issue with the invoice
I sent you on [date].

[Briefly explain issue - e.g., "Due to a calculation error..." or
"Due to a system glitch..."]

I've corrected the issue and attached the updated invoice.

The correct amount is: $XXX.XX

I sincerely apologize for any confusion. Please disregard the previous
invoice and use this corrected version.

If you have any questions, please don't hesitate to call me.

Thanks for your understanding,

Gerard
925 Pressure Glass
[Phone]
```

##### **Phone Call (if significant error):**

- Call customer directly
- Explain situation briefly
- Apologize sincerely
- Provide correct information
- Offer small discount if appropriate (e.g., "I'll take 10% off for the inconvenience")
- Confirm they understand

**Time:** 5-10 minutes per customer

---

### 7.3 Rollback Testing (Before Production)

**Practice rollback BEFORE you need it.**

**Test rollback procedure (30 minutes):**

1. **Create test backup**
   - Run backup script
   - Save to file: `test_backup.json`

2. **Make some changes**
   - Create 2-3 test invoices
   - Edit a client
   - Change a setting

3. **Practice restore**
   - Run restore script
   - Load test backup
   - Verify restore works
   - Confirm changes reverted

4. **Time the process**
   - How long did it take?
   - Slower than 5 minutes?
   - Identify bottlenecks

5. **Document any issues**
   - What was confusing?
   - What went wrong?
   - How to improve?

6. **Refine procedure**
   - Update rollback docs
   - Simplify steps if possible
   - Ensure you're confident

**Goal:** Confident you can rollback in <5 minutes in emergency.

---

### 7.4 Rollback Checklist (Quick Reference)

**Print this and keep handy:**

```
EMERGENCY ROLLBACK - QUICK CHECKLIST
═══════════════════════════════════════

□ STOP using system immediately
□ Create emergency backup (even if corrupted)
□ Take screenshots of errors
□ Document what happened

□ Open browser console
□ Load restore function (Section 2.3)
□ Copy last good backup JSON
□ Run: restoreBackup(`PASTE_JSON_HERE`)
□ Confirm restore

□ Verify data restored:
  □ All invoices present
  □ All clients present
  □ All quotes present
  □ Calculations work

□ Revert code (if using hosting):
  □ GitHub Pages: git revert + push
  □ Netlify: Deploys → Publish old deploy
  □ Vercel: Deployments → Promote old one

□ Investigate root cause
□ Test fix separately
□ Only re-deploy when confident

□ Communicate with affected customers (if needed)

═══════════════════════════════════════
BACKUP LOCATIONS:
1. iCloud Drive/Backups/TicTacStick/
2. iPad Files app
3. Email/Dropbox

EMERGENCY CONTACT: [Your phone number]
═══════════════════════════════════════
```

---

## 8. Customer Communication Plan

**How to explain the new invoice system to your clients.**

### 8.1 Why Communication Matters

- **Reduces confusion** - Customers know what to expect
- **Builds trust** - Professional communication
- **Prevents questions** - Proactive explanations
- **Maintains relationships** - Customers feel informed

---

### 8.2 Email Template (Professional)

**For first invoice sent via new system:**

```
Subject: Invoice #[NUMBER] - [Customer Name] - [Address]

Hi [Customer Name],

Thanks for choosing 925 Pressure Glass for your recent [window cleaning /
pressure cleaning] at [Address].

I've attached your invoice below. We've recently upgraded to a new digital
invoicing system to serve you better with faster, more professional invoices.

INVOICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: #[NUMBER]
Date: [DATE]
Services: [Brief description]
Total: $[AMOUNT] (inc. GST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT OPTIONS:
We accept payment via:
• Bank Transfer (preferred):
  BSB: [YOUR BSB]
  Account: [YOUR ACCOUNT]
  Reference: INV-[NUMBER]

• Cash
• Card (in person)

Payment is due: [Due date - e.g., "upon receipt" or "within 7 days"]

If you have any questions about your invoice or our services, please don't
hesitate to call me on [PHONE] or reply to this email.

Thanks again for your business!

Cheers,
Gerard

---
925 Pressure Glass
[Phone Number]
[Email]
ABN: [YOUR ABN]
```

**Customize for your business:**
- Replace [bracketed items] with actual details
- Add your logo (if you have one)
- Adjust tone to match your style
- Include any special offers/notes

---

### 8.3 Email Template (Casual/Friendly)

**For established customers:**

```
Subject: Invoice for [Address] - $[AMOUNT]

Hey [Customer Name],

Hope you're happy with the [windows / driveway / etc.]!

I've attached your invoice - we've gone digital with our invoicing now,
so you'll get a nice professional PDF instead of my handwritten notes. 😊

Total: $[AMOUNT] (inc. GST)

Bank details for transfer:
BSB: [BSB]
Account: [ACCOUNT]
Reference: INV-[NUMBER]

Or cash/card works too!

Any questions, just give me a call.

Thanks!
Gerard
925 Pressure Glass
[Phone]
```

**When to use:**
- Long-term customers
- Residential clients
- Casual relationships
- Local community

---

### 8.4 SMS Template

**For customers who prefer text:**

```
Hi [Name], thanks for choosing 925 Pressure Glass! Your invoice
($[AMOUNT] inc GST) has been emailed to [email]. Bank details:
BSB [BSB], Acc [ACCOUNT], Ref INV-[NUMBER]. Any questions, just call!
- Gerard
```

**Character count:** ~190 characters (fits in single SMS)

**When to use:**
- Quick notification
- Customer requested text
- Follow-up to email
- Reminder

---

### 8.5 Phone Script

**For customers who need explanation:**

**Opening:**
> "Hi [Customer], it's Gerard from 925 Pressure Glass. I just wanted to let you
> know I've sent your invoice via email. We've upgraded to a new digital system."

**If they ask "What's different?":**
> "Instead of handwritten invoices, you'll now receive a professional PDF that
> clearly shows all the services, costs, and payment details. Makes it easier
> for you to keep records and pay electronically if you prefer."

**Payment instructions:**
> "You can pay the same way as before - bank transfer, cash, or card. The
> invoice has all the bank details if you'd like to transfer. Total is
> $[AMOUNT] including GST."

**Closing:**
> "I've emailed it to [email address] - can you confirm that's the right
> address? ... Great! Let me know if you don't receive it or have any questions."

**If they don't have email:**
> "No problem! I can print a copy and drop it in your mailbox, or you can
> pick it up from me. Whatever works best for you."

---

### 8.6 FAQ - Anticipated Questions

**Be prepared to answer:**

#### **"Why are you changing to digital invoices?"**

**Answer:**
> "To provide better service! Digital invoices are more professional, easier
> to keep track of for both of us, and better for the environment. Plus it's
> easier for you to pay electronically if you prefer."

---

#### **"I don't have email / I'm not good with computers"**

**Answer:**
> "That's no problem at all! I can print your invoice and either mail it to
> you, drop it in your letterbox, or you can pick it up. Whatever is easiest
> for you. I'll make sure you always get your invoice."

---

#### **"Is this secure? I'm worried about scams."**

**Answer:**
> "Great question! The invoice will always come from my regular email address
> [your email]. If you ever receive an invoice that looks suspicious or from
> a different email, give me a call before paying. I'll never ask for payment
> to a different account than the one I've always used."

---

#### **"Can I still pay cash?"**

**Answer:**
> "Absolutely! Nothing changes with payment options. You can still pay cash,
> card, or bank transfer - whatever you prefer. The invoice just looks more
> professional now."

---

#### **"I didn't receive the email"**

**Answer:**
> "No worries, let me check the email address I have... [confirm address].
> Is that correct? ... OK, I'll resend it now. Can you check your spam folder
> just in case? If it's still not there in 5 minutes, I'll print a copy
> for you."

---

#### **"The invoice shows the wrong amount"**

**Answer:**
> "I apologize for that! Let me check... [review invoice]. You're right,
> that should be $[correct amount]. I'll send you a corrected invoice right
> away. Sorry for the confusion!"

**Then:**
- Create corrected invoice
- Send immediately
- Follow up to confirm received

---

### 8.7 Customer Communication Checklist

**For each invoice sent:**

**Before sending:**
- [ ] Verify customer email address correct
- [ ] Double-check invoice amounts
- [ ] Review invoice for errors
- [ ] Ensure professional appearance

**When sending:**
- [ ] Use appropriate email template (professional vs casual)
- [ ] Personalize message (use customer name, address)
- [ ] Include clear payment instructions
- [ ] Attach invoice PDF (or include in email body)

**After sending:**
- [ ] Follow up if no response in 24 hours (optional)
- [ ] Answer questions promptly
- [ ] Record payment when received
- [ ] Thank customer

**For first-time digital invoice customers:**
- [ ] Mention this is new system
- [ ] Emphasize benefits
- [ ] Offer to answer questions
- [ ] Provide phone number for support

---

### 8.8 Transitioning Existing Customers

**For customers who've received paper invoices before:**

**First digital invoice - Include in email:**

```
NOTE: This is our first digital invoice to you! We've upgraded our system
to provide more professional, detailed invoices. Everything else stays the
same - same great service, same payment options, same bank details. If you
have any questions, just let me know!
```

**Or mention on phone/in person:**
> "Just so you know, next time I'll send your invoice via email instead of
> paper. It'll look more professional and be easier to keep track of. I'll
> still drop it off in person if you prefer!"

---

## 9. Success Metrics

**How to measure if deployment was successful.**

### 9.1 Why Measure Success?

- **Objective assessment** - Know if system is working
- **Continuous improvement** - Identify areas to improve
- **Business value** - Quantify time/money saved
- **Confidence** - Prove system is reliable
- **Decision-making** - Data for future improvements

---

### 9.2 Week 1 Success Metrics

**After first week of production use:**

#### **Technical Metrics (Must Achieve):**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Data loss incidents | 0 | ____ | ✅ / ❌ |
| Invoice calculation errors | 0 | ____ | ✅ / ❌ |
| App uptime (accessibility) | 100% | ____% | ✅ / ❌ |
| Page load time | <2s first, <1s cached | ____s | ✅ / ❌ |
| Critical bugs found | 0 | ____ | ✅ / ❌ |
| Successful saves | 100% | ____% | ✅ / ❌ |

**Pass criteria:** All targets met (✅✅✅✅✅✅)

---

#### **Business Metrics:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Invoices created | 1-3 | ____ | ✅ / ❌ |
| Invoices sent successfully | 100% | ____% | ✅ / ❌ |
| Payments recorded | ≥1 | ____ | ✅ / ❌ |
| Customer confusion incidents | 0 | ____ | ✅ / ❌ |
| Customer complaints | 0 | ____ | ✅ / ❌ |
| Time saved (vs paper) | 15-30 min | ____ min | ✅ / ❌ |

**Pass criteria:** ≥4 out of 6 targets met

---

#### **User Experience Metrics:**

| Question | Target | Actual | Status |
|----------|--------|--------|--------|
| Confident using system? | Yes | Yes / No | ✅ / ❌ |
| Faster than paper invoices? | Yes | Yes / No | ✅ / ❌ |
| Professional appearance? | Yes | Yes / No | ✅ / ❌ |
| Easy to track payments? | Yes | Yes / No | ✅ / ❌ |
| Would continue using? | Yes | Yes / No | ✅ / ❌ |
| Ready for Week 2 rollout? | Yes | Yes / No | ✅ / ❌ |

**Pass criteria:** All "Yes" (✅✅✅✅✅✅)

---

#### **Week 1 Overall Success:**

**PASS if:**
- ✅ All technical metrics met (zero tolerance for critical issues)
- ✅ ≥4 business metrics met
- ✅ All user experience metrics "Yes"

**CONDITIONAL PASS if:**
- ✅ All technical metrics met
- ⚠️ 3 business metrics met (investigate why)
- ✅ ≥4 user experience metrics "Yes"
- → Proceed to Week 2 with caution

**FAIL if:**
- ❌ Any technical metric failed (data loss, calculation errors, critical bugs)
- ❌ <3 business metrics met
- ❌ <4 user experience metrics "Yes"
- → STOP, fix issues before proceeding

---

### 9.3 Month 1 Success Metrics

**After 4 weeks of production use:**

#### **Volume Metrics:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Total invoices created | 20+ | ____ | ✅ / ❌ |
| Total invoices paid | 10+ | ____ | ✅ / ❌ |
| Total invoices unpaid | <10 | ____ | ✅ / ❌ |
| Repeat customers invoiced | 5+ | ____ | ✅ / ❌ |
| Different invoice types tested | ≥3 (residential, commercial, mixed) | ____ | ✅ / ❌ |

---

#### **Quality Metrics:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Calculation errors | 0 | ____ | ✅ / ❌ |
| Data loss incidents | 0 | ____ | ✅ / ❌ |
| Customer complaints | 0 | ____ | ✅ / ❌ |
| GST compliance | 100% | ____% | ✅ / ❌ |
| Invoice number sequence correct | Yes (no duplicates/gaps) | Yes / No | ✅ / ❌ |
| Payment tracking accuracy | 100% | ____% | ✅ / ❌ |

---

#### **Efficiency Metrics:**

| Metric | Baseline (Paper) | Current (Digital) | Improvement | Target |
|--------|------------------|-------------------|-------------|--------|
| Time to create invoice | ~10 min | ____ min | ____% | -50% (5 min) |
| Time to send invoice | ~5 min | ____ min | ____% | -80% (1 min) |
| Time to track payment | ~3 min | ____ min | ____% | -66% (1 min) |
| Total time saved per month | 0 | ____ hours | ____ hours | 2-4 hours |
| Admin work reduced | 0 | ____ | ____ | Noticeable |

---

#### **Financial Metrics:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Total revenue invoiced | $5,000+ | $____ | ✅ / ❌ |
| Total revenue collected | $2,500+ | $____ | ✅ / ❌ |
| Average invoice value | $300-$800 | $____ | ✅ / ❌ |
| Payment time (days to pay) | <14 days | ____ days | ✅ / ❌ |
| Unpaid invoices >30 days | 0 | ____ | ✅ / ❌ |

---

#### **Confidence Metrics:**

| Question | Target | Actual |
|----------|--------|--------|
| Trust the system completely? | Yes | Yes / No |
| Would recommend to other businesses? | Yes | Yes / No |
| Ready for Phase 3 (cloud sync)? | Yes | Yes / No |
| Feel more professional? | Yes | Yes / No |
| Better organized? | Yes | Yes / No |
| Less stressed about invoicing? | Yes | Yes / No |

---

### 9.4 Month 1 Overall Assessment

**Score each category:**

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Volume Metrics | ____ / 5 | 1x | ____ |
| Quality Metrics | ____ / 6 | 3x | ____ (critical) |
| Efficiency Metrics | ____ / 5 | 2x | ____ |
| Financial Metrics | ____ / 5 | 1x | ____ |
| Confidence Metrics | ____ / 6 | 2x | ____ |
| **TOTAL** | | | ____ / 64 |

**Interpretation:**

- **60-64 points:** 🌟 **Excellent** - Deployment highly successful, ready for Phase 3
- **50-59 points:** ✅ **Good** - Deployment successful, minor improvements needed
- **40-49 points:** ⚠️ **Acceptable** - Working, but needs optimization
- **<40 points:** ❌ **Poor** - Significant issues, investigate and fix

---

### 9.5 Success Metrics Dashboard

**Create simple tracking spreadsheet:**

**Week 1 Dashboard:**

```
WEEK 1 METRICS DASHBOARD
═══════════════════════════════════════════════════

TECHNICAL
Data Loss:          0 ✅
Calc Errors:        0 ✅
Uptime:             100% ✅
Load Time:          1.2s ✅
Critical Bugs:      0 ✅

BUSINESS
Invoices Created:   2 ✅
Sent Success:       100% ✅
Payments Recorded:  1 ✅
Customer Issues:    0 ✅
Time Saved:         25 min ✅

CONFIDENCE
Using confidently:  ✅
Faster than paper:  ✅
Professional:       ✅
Good tracking:      ✅
Will continue:      ✅

OVERALL: ✅ PASS - Proceed to Week 2
═══════════════════════════════════════════════════
```

**Month 1 Dashboard:**

```
MONTH 1 METRICS DASHBOARD
═══════════════════════════════════════════════════

VOLUME
Invoices Created:   24 ✅
Invoices Paid:      18 ✅
Repeat Customers:   7 ✅

QUALITY
Errors:             0 ✅
Data Loss:          0 ✅
Complaints:         0 ✅
GST Compliance:     100% ✅

EFFICIENCY
Time Saved:         3.5 hours/month ✅
Avg Create Time:    4 min (was 10 min) ✅
Avg Send Time:      30 sec (was 5 min) ✅

FINANCIAL
Total Invoiced:     $6,840 ✅
Total Collected:    $5,220 ✅
Avg Invoice:        $285 ⚠️ (target $300-800)
Avg Payment Time:   9 days ✅

CONFIDENCE: ✅✅✅✅✅✅ All positive

OVERALL SCORE: 58/64 (91%) - EXCELLENT ✅
Ready for Phase 3!
═══════════════════════════════════════════════════
```

---

### 9.6 Celebrating Milestones

**Acknowledge achievements:**

| Milestone | Celebration |
|-----------|-------------|
| First invoice sent | Screenshot + note in journal |
| First payment received | Small celebration (coffee, etc.) |
| Week 1 complete | Review success, plan Week 2 |
| 10 invoices created | Recognize progress |
| Month 1 complete | Treat yourself! Document success |
| Zero errors for month | Major achievement - celebrate! |

**Share success (optional):**
- Tell a friend/colleague
- Post on social media (if comfortable)
- Write testimonial for tools used
- Document lessons learned

---

## 10. Troubleshooting Guide

**Common issues and how to fix them.**

### 10.1 Troubleshooting Matrix

| Issue | Symptoms | Likely Cause | Solution | Prevention |
|-------|----------|--------------|----------|------------|
| **Invoice won't save** | Error message, nothing happens | LocalStorage quota full | Delete old data, export archives | Regular backups, data cleanup |
| **GST incorrect** | Wrong calculation, doesn't match 10% | Rounding error, calc bug | Check calc.js line 156, verify math | Test GST matrix regularly |
| **Data disappeared** | Empty lists, missing invoices | LocalStorage cleared by browser/iOS | Restore from backup | Daily backups, multiple backup locations |
| **App won't load** | Blank screen, infinite loading | Service Worker issue, JS error | Clear cache, hard reload, check console | Test after deployments |
| **Slow performance** | Laggy UI, slow responses | Too much data in LocalStorage | Archive old data, optimize queries | Limit history to 100 items |
| **Can't add payment** | Button disabled, form won't submit | Validation failing, required field empty | Check console errors, fill all required fields | Test payment flow regularly |
| **PDF won't generate** | Export fails, blank PDF | Browser compatibility, missing data | Try different browser, check invoice data | Test export on iOS Safari |
| **Offline mode broken** | Only works online, errors when offline | Service Worker not installed/updated | Reinstall SW, check SW registration | Test offline mode after updates |
| **Invoice number duplicate** | Same number used twice | Manual override, numbering bug | Check invoice settings, verify auto-increment | Don't manually set invoice numbers |
| **Customer can't open invoice** | "File won't open", "Corrupted file" | PDF compatibility, email client issue | Resend as inline, try different format | Test PDF in multiple email clients |

---

### 10.2 Quick Fixes - Step-by-Step

#### **Problem 1: "App won't load" (Blank screen)**

**Symptoms:**
- Opening URL shows blank white screen
- Loading spinner forever
- No UI appears

**Diagnosis:**
```javascript
// Open browser console (F12)
// Check for errors (red text)
```

**Solution:**

**Step 1: Hard refresh**
```
Desktop: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
iPad: Close tab, clear Safari history, reopen
```

**Step 2: Clear cache (not LocalStorage)**
```
Safari (iPad): Settings → Safari → Clear History and Website Data
- Choose: "Last Hour" (not "All Time" - preserves LocalStorage)

Chrome (Desktop): DevTools → Application → Clear storage
- Uncheck "Local storage"
- Check "Cache", "Cookies"
- Click "Clear site data"
```

**Step 3: Restart browser**
```
Close all tabs
Force quit browser
Reopen browser
Navigate to app
```

**Step 4: Check internet connection**
```
First load requires internet (to download app)
Subsequent loads work offline
Verify WiFi connected
```

**If still not loading:**
```
Check deployment status:
- GitHub Pages: Check Actions tab
- Netlify: Check Deploys tab
- Vercel: Check Deployments tab

If deployment failed: Rollback to previous version
```

---

#### **Problem 2: "Data missing" (Invoices/quotes disappeared)**

**Symptoms:**
- Invoice list empty
- Clients gone
- Recent work vanished

**Diagnosis:**
```javascript
// Open DevTools → Application → Local Storage
// Check keys present:
// - invoice-database
// - client-database
// - quote-history

// If keys missing or empty: LocalStorage was cleared
```

**Solution:**

**Step 1: Don't panic - Check backup**
```
Do NOT create any new data yet (might overwrite autosave)

Check iCloud Drive/Backups/TicTacStick/
Find most recent backup
Verify backup date (should be recent)
```

**Step 2: Restore from backup**
```
Open browser console
Paste restore function (Section 2.3)
Load backup JSON
Run: restoreBackup(`PASTE_BACKUP_HERE`)
Confirm restore
Wait for reload
```

**Step 3: Verify data restored**
```
Check invoice list - all present?
Check client list - all present?
Check quote history - all present?
Create test quote (verify functionality)
```

**Step 4: Investigate why data was cleared**
```
Common causes:
- iOS update cleared Safari data
- Manually cleared browser data
- "Offload Unused Apps" enabled (iOS)
- Storage full (iOS cleared cache)

Prevention:
- Daily backups
- Disable "Offload Unused Apps"
- Keep storage space available (>1GB free)
```

---

#### **Problem 3: "Invoice calculation wrong" (GST incorrect)**

**Symptoms:**
- GST not 10% of subtotal
- Total doesn't match subtotal + GST
- Numbers don't add up

**Diagnosis:**
```javascript
// Open invoice in app
// Check console for errors
// Manually calculate:
//   Subtotal: $100
//   GST (10%): $10
//   Total: $110

// If app shows different numbers: Calculation bug
```

**Solution:**

**Step 1: Check debug mode**
```
Open js/app.js
Find: DEBUG_CONFIG.enabled
If true: Debug mode is on (calculations may be bypassed)
Set to false: DEBUG_CONFIG.enabled = false
Reload app
```

**Step 2: Verify line item totals**
```
Open invoice
Check each line item:
  Quantity × Price = Line Total
Add up all line totals manually
Should match Subtotal
```

**Step 3: Recalculate GST**
```
Subtotal × 0.10 = GST
Subtotal + GST = Total

Example:
$275.50 × 0.10 = $27.55 GST
$275.50 + $27.55 = $303.05 Total
```

**Step 4: Check for rounding errors**
```
GST should round to 2 decimal places
Example:
$100.00 × 0.10 = $10.00 ✅
$100.33 × 0.10 = $10.033 → $10.03 ✅ (rounds down)
$100.36 × 0.10 = $10.036 → $10.04 ✅ (rounds up)

If rounding is wrong: Bug in calc.js
Check: calc.js line 156 (round() function)
```

**Step 5: Report bug if persistent**
```
If calculations consistently wrong:
1. Document exact example:
   - Subtotal: $____
   - Expected GST: $____
   - Actual GST: $____
2. Take screenshot
3. Check calc.js for bugs
4. Fix or rollback to previous version
```

---

#### **Problem 4: "Can't send invoice" (Email/export fails)**

**Symptoms:**
- PDF won't generate
- Export button doesn't work
- Email attachment fails

**Diagnosis:**
```javascript
// Check console for errors
// Try exporting to JSON (does that work?)
// Try different browser
```

**Solution:**

**Step 1: Verify invoice data complete**
```
Open invoice
Check all required fields filled:
- Customer name ✅
- Customer email ✅
- Invoice date ✅
- At least 1 line item ✅
- Totals calculated ✅
```

**Step 2: Try different export method**
```
Method 1: Export as PDF (primary)
Method 2: Export as JSON (backup)
Method 3: Copy/paste invoice details into email manually
Method 4: Screenshot invoice (last resort)
```

**Step 3: Check browser compatibility**
```
PDF generation works best in:
- Safari (iOS) ✅
- Chrome (Desktop) ✅
- Safari (Mac) ✅

May not work in:
- Old browsers ❌
- Firefox (sometimes) ⚠️

Try different browser if available
```

**Step 4: Manual email as backup**
```
If export fails, send manually:

1. Copy invoice details
2. Paste into email
3. Format nicely
4. Send

Template:
---
INVOICE #[NUMBER]
Date: [DATE]
Customer: [NAME]

Line Items:
- [Item 1]: $[Amount]
- [Item 2]: $[Amount]

Subtotal: $[Amount]
GST (10%): $[Amount]
TOTAL: $[Amount]

Payment details:
BSB: [BSB]
Account: [ACCOUNT]
---
```

---

### 10.3 Error Messages - Meanings & Fixes

| Error Message | Meaning | Fix |
|---------------|---------|-----|
| "QuotaExceededError" | LocalStorage full (>5MB) | Delete old data, export archives |
| "Failed to register service worker" | Service Worker installation failed | Check HTTPS enabled, reload page |
| "Invalid JSON" | Data corrupted in LocalStorage | Restore from backup |
| "Cannot read property 'map' of null" | Data structure missing/corrupted | Restore from backup, check data |
| "Uncaught ReferenceError: X is not defined" | JavaScript file didn't load | Hard refresh, check deployment |
| "NetworkError when attempting to fetch resource" | File not found (404) | Check deployment, verify all files deployed |
| "SecurityError: The operation is insecure" | Mixed content (HTTP on HTTPS page) | Ensure all resources loaded via HTTPS |
| "Script error." | Generic JS error (privacy protected) | Check console in development mode |

---

### 10.4 Performance Troubleshooting

**Issue: App is slow/laggy**

**Diagnosis:**
```javascript
// Check LocalStorage size
let total = 0;
for (let key in localStorage) {
  total += localStorage[key].length;
}
console.log('LocalStorage used: ' + (total / 1024).toFixed(2) + ' KB');

// Check number of records
console.log('Invoices:', JSON.parse(localStorage.getItem('invoice-database') || '[]').length);
console.log('Clients:', JSON.parse(localStorage.getItem('client-database') || '[]').length);
console.log('Quotes:', JSON.parse(localStorage.getItem('quote-history') || '[]').length);
```

**Solutions:**

**1. Archive old data**
```
Export old invoices (>6 months) to JSON
Save to iCloud Drive/Archives/
Delete from app (free up space)
Keep only recent data (last 100 items)
```

**2. Optimize queries**
```
Check if code is filtering large arrays
Use pagination (show 20 items at a time)
Lazy load older items
```

**3. Clear autosave (if huge)**
```
// Check autosave size
console.log('Autosave size:', localStorage.getItem('tictacstick_autosave_state_v1').length);

// If >1MB, clear it
localStorage.removeItem('tictacstick_autosave_state_v1');
```

**4. Check Service Worker cache**
```
DevTools → Application → Service Workers
Click "Unregister"
Reload page (will re-register)
May improve performance
```

---

### 10.5 Troubleshooting Checklist

**Before asking for help, try:**

- [ ] **Hard refresh** (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] **Clear cache** (NOT LocalStorage)
- [ ] **Restart browser**
- [ ] **Check console for errors**
- [ ] **Try different browser**
- [ ] **Check internet connection**
- [ ] **Verify deployment status**
- [ ] **Check backups exist**
- [ ] **Restore from recent backup** (if data issue)
- [ ] **Review this troubleshooting guide**

**If still stuck:**
- [ ] Document exact steps to reproduce
- [ ] Take screenshots of errors
- [ ] Note when issue started
- [ ] Check if recent changes made
- [ ] Create emergency backup (if data at risk)

---

### 10.6 Getting Help

**Resources:**

1. **This guide** - Section 10 Troubleshooting
2. **Project docs** - README.md, PROJECT_STATE.md
3. **Browser DevTools** - Console, Network, Application tabs
4. **Backup & Restore** - Section 2 of this guide
5. **Rollback Procedure** - Section 7 if critical issue

**Self-help checklist:**
- Read error message carefully
- Search this guide for keywords
- Check console for detailed errors
- Try solutions in order listed
- Document what you tried

---

## Appendix A: Quick Reference Cards

### Pre-Deployment Checklist (1-Page)

```
═══════════════════════════════════════════════════
PRE-DEPLOYMENT CHECKLIST - TicTacStick v1.7
═══════════════════════════════════════════════════

CODE QUALITY
□ All tests passing (npm test)
□ Manual testing complete (30 scenarios)
□ Input validation working
□ No console errors
□ Debug mode tested & disabled
□ All TODOs resolved

DATA SAFETY (CRITICAL)
□ Full LocalStorage backup created
□ Backup stored in 3 locations
□ Restore procedure tested
□ Export/import functionality tested
□ All 10 LocalStorage keys backed up

BROWSER COMPATIBILITY
□ Tested on iPad Safari
□ Tested on iPhone Safari
□ Tested on desktop Safari/Chrome
□ Service Worker working
□ PWA install working
□ Offline mode confirmed

SECURITY
□ XSS prevention verified
□ Input sanitization tested
□ No sensitive data in logs
□ CSP headers configured (if possible)

BUSINESS READINESS (CRITICAL)
□ Tax compliance verified (10% GST)
□ Invoice template professional
□ Bank details correct (BSB, Account, ABN)
□ Invoice numbering set
□ Payment terms defined
□ Customer communication prepared

═══════════════════════════════════════════════════
ALL CRITICAL ITEMS CHECKED? → DEPLOY
ANY UNCHECKED? → ADDRESS FIRST
═══════════════════════════════════════════════════
```

---

### Emergency Rollback Card

```
═══════════════════════════════════════════════════
EMERGENCY ROLLBACK - QUICK REFERENCE
═══════════════════════════════════════════════════

WHEN TO USE:
🚨 Data corruption
🚨 Critical functionality broken
🚨 Multiple customer complaints
🚨 Lost confidence in system

STEPS:
1. □ STOP using system immediately
2. □ Create emergency backup (even if corrupted)
3. □ Take screenshots of errors
4. □ Open browser console
5. □ Load restore function (Section 2.3 of guide)
6. □ Copy last good backup JSON
7. □ Run: restoreBackup(`PASTE_JSON_HERE`)
8. □ Verify data restored correctly
9. □ Revert code deployment (if applicable)
10. □ Investigate root cause before re-deploying

BACKUP LOCATIONS:
1. iCloud Drive/Backups/TicTacStick/
2. iPad Files app
3. Email/Dropbox

TARGET TIME: <5 minutes

═══════════════════════════════════════════════════
```

---

### Daily Monitoring Card

```
═══════════════════════════════════════════════════
DAILY MONITORING CHECKLIST
═══════════════════════════════════════════════════

MORNING (5 min):
□ Open app - loads correctly?
□ Check console - no errors?
□ Last invoice still exists?
□ Quick functionality test

AFTER EACH INVOICE (2 min):
□ Check console for errors
□ Verify invoice saved
□ Appears in list correctly
□ Take screenshot (optional)

END OF DAY (5 min):
□ Review all today's invoices
□ Check for anomalies
□ Create daily backup
□ Document any issues

RED FLAGS (Investigate immediately):
⚠️ Console errors
⚠️ Invoices not saving
⚠️ Calculations wrong
⚠️ Data missing
⚠️ App not loading

═══════════════════════════════════════════════════
```

---

## Conclusion

### You're Ready to Deploy! 🚀

**This guide has provided:**

✅ **Pre-deployment checklist** - 50+ verification items
✅ **Backup & restore scripts** - Copy-paste ready
✅ **Deployment methods** - 4 options (Local, GitHub Pages, Netlify, Vercel)
✅ **Post-deployment verification** - Smoke tests
✅ **Gradual rollout plan** - Safe 3-week approach
✅ **Monitoring procedures** - Manual & automated
✅ **Rollback procedure** - Emergency recovery <5 min
✅ **Customer communication** - Email/SMS templates
✅ **Success metrics** - Week 1 & Month 1
✅ **Troubleshooting guide** - Common issues & fixes

---

### Recommended Timeline

| Day | Activity | Duration |
|-----|----------|----------|
| **Today** | Read this guide thoroughly | 30 min |
| **Today** | Complete pre-deployment checklist | 2 hours |
| **Today** | Create pre-launch backup (3 locations) | 15 min |
| **Today/Tomorrow** | Deploy (choose method) | 30 min |
| **Today/Tomorrow** | Run post-deployment smoke tests | 10 min |
| **Week 1** | Soft launch (1 invoice) | Ongoing |
| **Week 2** | Limited rollout (3-5 invoices) | Ongoing |
| **Week 3-4** | Full production use | Ongoing |
| **End Month 1** | Review success metrics | 30 min |

**Total time investment:** ~4 hours initial + ongoing monitoring

---

### Final Pre-Launch Checklist

**Before creating your first production invoice:**

- [ ] Read this entire guide (30 min)
- [ ] Complete all "Critical" pre-deployment items
- [ ] Create backup stored in 3 locations
- [ ] Test restore procedure
- [ ] Deploy to chosen platform
- [ ] Run all smoke tests (all passed)
- [ ] Verify bank details correct (BSB, Account, ABN)
- [ ] Test GST calculation (10% accurate)
- [ ] Prepare customer communication email
- [ ] Feel confident and ready

**All checked? → You're ready to go! 🎉**

---

### Support & Resources

**If you need help:**

1. **Re-read relevant section** of this guide
2. **Check Troubleshooting Guide** (Section 10)
3. **Review project docs** (README.md, PROJECT_STATE.md)
4. **Check browser console** for detailed errors
5. **Restore from backup** if data at risk

**Remember:**
- Start small (1 invoice Week 1)
- Daily backups are critical
- Don't skip the gradual rollout
- You can always rollback
- It's OK to pause if issues arise

---

### Next Steps After Month 1

**If deployment successful:**

1. **Celebrate!** You've successfully deployed a production invoice system
2. **Review metrics** - Calculate time/money saved
3. **Document lessons learned** - What went well? What could improve?
4. **Plan Phase 3** - Cloud sync, multi-device access
5. **Continue backups** - Weekly ongoing, monthly archives

**Potential Phase 3 features:**
- Cloud storage (Firebase, Supabase)
- Multi-device sync
- Automated email sending
- Payment reminders
- Advanced reporting
- Mobile app (React Native)

---

### Good Luck! 🍀

You've done the hard work:
- ✅ Built a robust invoice system
- ✅ Tested thoroughly (Playwright + manual)
- ✅ Added input validation
- ✅ Prepared for deployment

**Now it's time to launch safely and confidently.**

**You've got this!** 💪

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Author:** Claude (Anthropic)
**For:** Gerard Saliba, 925 Pressure Glass
**Project:** TicTacStick Invoice System v1.7

---

**End of Production Deployment & Launch Readiness Guide**
