# TicTacStick v1.13.0 - Manual Testing Execution Guide

**Version:** 1.13.0
**Date:** 2025-11-19
**Phase:** Phase 6 - Production Readiness Validation
**Total Tests:** 70 manual tests
**Estimated Time:** 2-3 hours

---

## 📋 Executive Summary

This guide provides step-by-step instructions for executing the manual testing checklist for TicTacStick v1.13.0. Manual testing is required due to:

1. **Service Worker limitations** in Playwright (causes test hangs)
2. **Mobile/native features** requiring real device interaction
3. **User workflow validation** requiring human judgment
4. **Cross-browser testing** needing multiple environments

---

## 🚀 Quick Start

### Prerequisites

1. **Local Server Running:**
   ```bash
   cd /Users/gerardvarone/Documents/GitHub/webapp
   python3 -m http.server 8080
   ```

2. **Browser Access:**
   - Primary: Chrome/Safari on macOS
   - Mobile: iOS Safari on iPad/iPhone (recommended)

3. **Test Data:**
   - Create 2-3 sample quotes
   - Add 2-3 sample clients
   - Generate 1-2 invoices

4. **Device Requirements:**
   - Camera-enabled device (for camera tests)
   - GPS-enabled device (for geolocation tests)
   - Push notification support (modern browser)

---

## ✅ Testing Categories Overview

| Category | Tests | Est. Time | Priority | Automation |
|----------|-------|-----------|----------|------------|
| 1. Contract Management | 15 | 30 min | HIGH | Manual |
| 2. Enhanced Analytics | 12 | 25 min | HIGH | Partial |
| 3. Mobile Features | 16 | 40 min | MEDIUM | Device-only |
| 4. Backup & Recovery | 8 | 20 min | **CRITICAL** | Manual |
| 5. Help System | 5 | 10 min | LOW | Manual |
| 6. Cross-Browser | 6 | 20 min | HIGH | Manual |
| 7. End-to-End Workflows | 8 | 30 min | **CRITICAL** | Manual |
| **TOTAL** | **70** | **2-3 hrs** | - | - |

---

## 🎯 Priority Execution Order

For time-constrained testing, execute in this order:

### Phase A: Critical (Must Pass) - 45 minutes
1. **Backup & Recovery** (8 tests) - Verify Bug #1 and #2 fixes
2. **End-to-End Workflow 1** (5 tests) - Contract automation
3. **End-to-End Workflow 2** (3 tests) - Mobile field work

### Phase B: High Priority - 1 hour
1. **Contract Management** (15 tests)
2. **Cross-Browser** (6 tests)

### Phase C: Standard - 45 minutes
1. **Enhanced Analytics** (12 tests)
2. **Help System** (5 tests)

### Phase D: Device-Dependent (Optional) - 40 minutes
1. **Mobile Features** (16 tests) - Requires real mobile device

---

## 📋 DETAILED TEST PROCEDURES

---

## 💾 1. BACKUP & RECOVERY (CRITICAL - Start Here)

**Purpose:** Verify Bug #1 and Bug #2 fixes from Phase 6

### Test 4.1: Backup Export (Bug #1 Verification)

**Steps:**
1. Open `http://localhost:8080`
2. Create test data if needed:
   ```
   - Add Quote: "Test Quote 12345" ($250)
   - Add Client: "Jane Doe" (jane@test.com)
   - Create Invoice: INV-001 ($300)
   ```

3. Navigate to **Settings** (⚙️ icon in header)
4. Scroll to **Backup & Recovery** section
5. Click **"Export All Data"** button

**Expected Results:**
- ✅ File downloads: `tictacstick_backup_2025-11-19_HHMMSS.json`
- ✅ Toast notification: "Backup exported successfully!"
- ✅ "Last backup" timestamp updates

6. **Open downloaded file** in text editor

**Verification - Check JSON Structure:**
```json
{
  "version": "1.13.0",
  "timestamp": "2025-11-19T...",
  "data": {
    "quotes": [ ... ],      // ← Should be ARRAY, not string
    "clients": [ ... ],     // ← Should be ARRAY, not string
    "invoices": [ ... ]     // ← Should be ARRAY, not string
  }
}
```

**❌ FAIL Indicators:**
- File contains: `"{\"data\":\"...\"}"` (double-escaped JSON)
- Cannot parse JSON (syntax error)
- Data objects are strings instead of arrays

**✅ PASS:** JSON is valid, data structures are correct arrays/objects

---

### Test 4.2: Backup Import (Bug #2 Verification)

**Steps:**
1. With exported backup from Test 4.1
2. In Settings → **Clear All Data** (or open DevTools → Application → Storage → Clear All)
3. Confirm data is cleared (refresh page, check quotes are gone)
4. Navigate back to **Settings**
5. Click **"Import Backup"** button
6. Select the exported JSON file

**Expected Results:**
- ✅ Toast notification: "Backup imported successfully!"
- ✅ Page **automatically reloads** (1-2 seconds)
- ✅ After reload, all data is restored:
  - "Test Quote 12345" is back
  - "Jane Doe" is in clients
  - Invoice INV-001 is present

7. **Check Browser Console** (F12 → Console):
   ```
   ✅ [BACKUP] Restoring quotes: X items
   ✅ [BACKUP] Restoring clients: Y items
   ✅ [BACKUP] Backup restored successfully
   ```

**❌ FAIL Indicators:**
- Console error: `Cannot read property 'success' of undefined`
- Console error: `TypeError: result.message is undefined`
- Data not restored after page reload
- Page doesn't reload automatically

**✅ PASS:** All data restored, no console errors, automatic reload works

---

### Test 4.3: Round-Trip Data Integrity

**Steps:**
1. Create specific test data:
   ```
   Quote: "Integrity Test Quote" with $456.78 total
   Client: "John Smith Test" with phone 0412345678
   Invoice: "INV-777" with $123.45 total
   ```

2. **Export backup**
3. **Note exact values** (write them down)
4. **Clear all data** completely
5. **Import backup**
6. **Verify exact matches:**
   - Quote title exactly: "Integrity Test Quote"
   - Quote total exactly: $456.78
   - Client name exactly: "John Smith Test"
   - Client phone exactly: 0412345678
   - Invoice number exactly: "INV-777"
   - Invoice total exactly: $123.45

**❌ FAIL Indicators:**
- Any value differs from original
- Rounding errors in decimals
- Missing data fields
- Corrupted text (special characters)

**✅ PASS:** All values match exactly, zero data loss

---

### Test 4.4: Selective Backup

**Steps:**
1. In Settings → Backup → **Choose Modules to Export**
2. Select only: **Clients** (uncheck quotes, invoices, etc.)
3. Export selective backup
4. Open JSON file

**Expected:**
```json
{
  "version": "1.13.0",
  "data": {
    "clients": [ ... ],  // ← Only clients present
    "quotes": null,      // ← Others are null or empty
    "invoices": null
  }
}
```

**✅ PASS:** Only selected data exported

---

### Test 4.5: Automatic Backup Scheduling

**Steps:**
1. Check "Last backup" timestamp in Settings
2. Change system time to +25 hours (OR wait 24 hours)
3. Open app again

**Expected:**
- ✅ System prompts: "Automatic backup is due"
- ✅ Backup created automatically

**Note:** This test may require time manipulation or waiting

---

### Test 4.6: Backup Verification (Corrupted File)

**Steps:**
1. Export a backup
2. Open backup file in editor
3. Manually corrupt JSON (e.g., delete a closing brace `}`)
4. Try to import corrupted backup

**Expected:**
- ✅ System detects corruption
- ✅ Error message: "Backup file is corrupted"
- ✅ Import aborted (no data changed)

**✅ PASS:** System validates backup before import

---

### Test 4.7: Backup History Tracking

**Steps:**
1. Create multiple backups (3-4 times)
2. View backup history in Settings

**Expected:**
- ✅ All backups listed with timestamps
- ✅ Can view details of each backup
- ✅ Can restore from any backup

---

### Test 4.8: Cloud Backup Integration (Optional)

**If configured:**
1. Export to cloud (Google Drive, Dropbox, etc.)
2. Verify upload successful
3. Download from cloud
4. Restore from cloud backup

**✅ PASS:** Cloud integration works

---

## 📋 2. CONTRACT MANAGEMENT SYSTEM

### Test 1.1: Contract Creation Wizard

**Steps:**
1. Open app: `http://localhost:8080`
2. Click **"📋 Contracts"** button in header
3. Click **"New Contract"** button

**Expected:**
- ✅ Wizard modal opens
- ✅ Shows "Step 1: Client Selection"

**Test 1.1.1 - Client Selection:**
4. Select existing client from dropdown
   **Expected:** Client info auto-fills (name, location, contact)

**Test 1.1.2 - Service Scope:**
5. Click "Next" to Step 2
6. Add windows: Standard × 10
7. Add pressure: Concrete 50 sqm
   **Expected:** Pricing updates automatically

**Test 1.1.3 - Frequency & Pricing:**
8. Click "Next" to Step 3
9. Select frequency: **Monthly**
   **Expected:** 10% discount applied automatically
10. Try **Quarterly**: 15% discount
11. Try **Annual**: 20% discount

**Test 1.1.4 - Dates:**
12. Set start date: Today
    **Expected:** End date defaults to +1 year

**Test 1.1.5 - Preview:**
13. Click "Preview Contract"
    **Expected:** All details display correctly (pricing, frequency, terms)

**Test 1.1.6 - Save:**
14. Click "Create Contract"
    **Expected:** Success toast, contract appears in list with status "draft"

---

### Test 1.2: Contract Status Management

**Test 1.2.1 - Activate:**
1. Find draft contract
2. Click "Activate"
   **Expected:** Status → "active", next service date calculated

**Test 1.2.2 - Pause:**
3. Click "Pause Contract"
   **Expected:** Status → "paused", no new tasks generated

**Test 1.2.3 - Cancel:**
4. Click "Cancel Contract"
5. Enter reason: "Client moved"
   **Expected:** Status → "cancelled", reason recorded

**Test 1.2.4 - Renew:**
6. Find expiring contract
7. Click "Renew"
   **Expected:** New contract created, start date = old end date

---

### Test 1.3: Contract Filtering & Search

**Test 1.3.1 - Filter by Status:**
1. Filter contracts: **Active only**
   **Expected:** Only active contracts shown

**Test 1.3.2 - Client History:**
2. Select client "Jane Doe"
3. View contract history
   **Expected:** All contracts for Jane Doe displayed

---

### Test 1.4: Revenue Forecasting

**Test 1.4.1 - MRR Calculation:**
1. Navigate to Contracts → **Revenue Forecasting**
2. View Monthly Recurring Revenue (MRR)
   **Expected:** Correctly sums all monthly contract values

**Test 1.4.2 - ARR Calculation:**
3. View Annual Recurring Revenue (ARR)
   **Expected:** ARR = MRR × 12

**Validation:**
- Create contract: $500/month
- MRR should increase by $500
- ARR should increase by $6,000

---

## 📊 3. ENHANCED ANALYTICS SYSTEM

### Test 2.1: Analytics Dashboard

**Steps:**
1. Create test data (if not present):
   ```
   - 5 quotes (3 accepted, 2 declined)
   - 3 invoices (2 paid, 1 pending)
   ```

2. Click **"View Analytics"** or **"📊 Analytics"** in header

**Test 2.1.1 - Dashboard Loads:**
   **Expected:** Dashboard displays with charts and KPIs

**Test 2.1.2 - Revenue Trend Chart:**
3. Check line/bar chart
   **Expected:** Shows revenue over time with correct data points

**Test 2.1.3 - Conversion Funnel:**
4. Scroll to conversion funnel
   **Expected:** Shows Quote → Invoice → Payment stages with %

**Test 2.1.4 - Service Breakdown Pie Chart:**
5. View pie chart
   **Expected:** % split between Windows vs Pressure cleaning

**Test 2.1.5 - Date Range Filter:**
6. Change filter: **Last 7 days**
   **Expected:** All charts update
7. Try: **Last 30 days**, **All time**
   **Expected:** Charts adjust to range

**Test 2.1.6 - Export Report:**
8. Click **"Export to PDF"**
   **Expected:** PDF downloads with all charts and metrics

---

### Test 2.2: Analytics Engine Calculations

**Test 2.2.1 - KPI Accuracy:**
1. Manually calculate:
   - Average Quote Value = Total $ ÷ # Quotes
   - Win Rate = Accepted ÷ Total Quotes
2. Compare with dashboard KPIs
   **Expected:** Values match manual calculations

**Test 2.2.2 - CLV (Customer Lifetime Value):**
3. Find repeat client with multiple jobs
4. Check CLV calculation
   **Expected:** CLV = Sum of all invoices from that client

**Test 2.2.3 - Trend Detection:**
5. Create quotes with increasing values over time
6. Check trend indicator
   **Expected:** Shows "Upward trend" or ↗️

---

## 📱 4. MOBILE & NATIVE FEATURES (Requires Mobile Device)

**Note:** These tests require a real mobile device (iPad/iPhone) with camera and GPS.

### Test 3.1: Camera Integration

**Steps:**
1. On mobile device, open app
2. Create new quote
3. Scroll to **Photos** section
4. Click **"Add Photo"** → **"Take Photo"**

**Test 3.1.1 - Camera Launch:**
   **Expected:** Device camera app launches, requests permission

**Test 3.1.2 - Capture Photo:**
5. Take a photo
   **Expected:** Photo preview displays, can retake or accept

**Test 3.1.3 - EXIF Data:**
6. Accept photo
7. Check photo metadata
   **Expected:** Date/time, GPS coordinates extracted

**Test 3.1.4 - Multiple Photos:**
8. Add 3-4 more photos
   **Expected:** All photos added to quote with thumbnails

---

### Test 3.2: Geolocation Services

**Test 3.2.1 - Current Location:**
1. In quote, find **Client Location** field
2. Click **"Use Current Location"** button
   **Expected:** Browser requests permission, then fills address

**Test 3.2.2 - Geocoding:**
3. Type address: "123 Main St, Perth WA"
   **Expected:** Address converted to GPS coordinates (displayed in hidden field or console)

**Test 3.2.3 - Reverse Geocoding:**
4. Take photo with GPS (Test 3.1.3)
5. Check if address auto-fills from GPS
   **Expected:** GPS → Address conversion

**Test 3.2.4 - Distance Calculation:**
6. Navigate to **Travel Calculator**
7. Enter job site address
   **Expected:** Distance in km, travel time estimated

**Test 3.2.5 - Nearby Clients:**
8. In CRM, filter by **Nearby** (if available)
   **Expected:** Clients sorted by distance from current location

**Test 3.2.6 - Service Area Validation:**
9. Enter address far away (e.g., "Sydney NSW")
   **Expected:** Warning: "Outside service area"

---

### Test 3.3: Push Notifications

**Test 3.3.1 - Enable Notifications:**
1. Settings → **Notifications**
2. Click **"Enable Push Notifications"**
   **Expected:** Browser requests permission

**Test 3.3.2 - Schedule Notification:**
3. Create reminder for task due tomorrow
   **Expected:** Notification scheduled

**Test 3.3.3 - Receive Notification:**
4. Wait for scheduled time (or trigger manually if possible)
   **Expected:** Notification appears on device

**Test 3.3.4 - Click Notification:**
5. Click notification
   **Expected:** App opens to relevant page (task/contract)

**Test 3.3.5 - Notification History:**
6. View notification history
   **Expected:** Past notifications listed

**Test 3.3.6 - Clear Notifications:**
7. Click **"Clear All"**
   **Expected:** History cleared

---

## ❓ 5. HELP SYSTEM

### Test 5.1: Open Help

**Steps:**
1. Click **"Help"** or **"?"** button in header
   **Expected:** Help modal opens with search bar

### Test 5.2: Search Help

2. Search: **"create contract"**
   **Expected:** Relevant articles appear (contract creation guide)

### Test 5.3: Interactive Tutorial

3. Click **"Getting Started Tutorial"**
   **Expected:** Step-by-step guided tour launches

### Test 5.4: Keyboard Shortcuts

4. Click **"Keyboard Shortcuts"**
   **Expected:** List of shortcuts with descriptions (e.g., Ctrl+S = Save)

### Test 5.5: FAQ

5. Navigate to **"FAQ"** section
   **Expected:** Common questions displayed with answers

---

## 🌐 6. CROSS-BROWSER COMPATIBILITY

**Test on multiple browsers:**

### Chrome/Edge (Chromium) - Tests 6.1-6.3

**Steps:**
1. Open in Chrome: `http://localhost:8080`
2. **Test 6.1:** Create contract (follow Test 1.1)
   **Expected:** Wizard works, contract created successfully
3. **Test 6.2:** View analytics (follow Test 2.1)
   **Expected:** Charts render correctly (Chart.js works)
4. **Test 6.3:** Test camera (if device has camera)
   **Expected:** Camera integration works

---

### Firefox - Test 6.4

**Steps:**
1. Open in Firefox: `http://localhost:8080`
2. Run through all v1.13.0 features:
   - Contract creation
   - Analytics dashboard
   - Backup/restore
3. Check console for errors
   **Expected:** No errors, all features work

---

### Safari (iOS/macOS) - Tests 6.5-6.6

**Steps:**
1. Open in Safari: `http://localhost:8080`
2. **Test 6.5 - ES5 Compatibility:**
   - Open Console (Safari → Develop → Show JavaScript Console)
   - Check for syntax errors
   **Expected:** No errors (no const/let/arrow functions breaking)

3. **Test 6.6 - Service Worker Offline:**
   - Load app fully
   - Turn off WiFi / Enable Airplane Mode
   - Refresh page or navigate
   **Expected:** App still works offline

---

## 🔄 7. END-TO-END WORKFLOWS (CRITICAL)

### Workflow 1: Recurring Contract with Automation (Tests 7.1-7.5)

**Complete user journey:**

**Step 1 - Create Contract (Test 7.1):**
1. Contracts → New Contract
2. Client: "ABC Company"
3. Service: Windows × 20 + Pressure 100 sqm
4. Frequency: **Monthly** (10% discount)
5. Start: Today, End: +1 year
6. Save contract

**Step 2 - Activate & Auto-Task (Test 7.2):**
7. Activate contract
8. Check **Tasks** page
   **Expected:** Service task auto-generated with due date = next month

**Step 3 - Complete Service (Test 7.3):**
9. Mark service task as **Complete**
10. Check **Invoices** page
    **Expected:** Invoice auto-created for service ($500 for example)

**Step 4 - Next Service Date (Test 7.4):**
11. Check contract details
    **Expected:** Next service date = +1 month from last service

**Step 5 - MRR Update (Test 7.5):**
12. Contracts → Revenue Forecasting → MRR
    **Expected:** MRR increased by contract monthly value

**✅ PASS if:** All automation triggers work, no manual intervention needed

---

### Workflow 2: Mobile Field Work (Tests 7.6-7.8)

**Complete mobile journey:**

**Step 1 - Geolocation (Test 7.6):**
1. On mobile device, open app
2. New Quote → Client Location
3. Click **"Use Current Location"**
   **Expected:** GPS coordinates → Address filled

**Step 2 - Photos (Test 7.7):**
4. Scroll to Photos
5. Click **"Take Photo"** (use camera)
6. Capture 3-4 photos of "job site"
   **Expected:** All photos attached with GPS metadata

**Step 3 - Complete Quote (Test 7.8):**
7. Fill in quote details (windows, pricing)
8. Save quote
9. Check quote in list
   **Expected:** Quote shows location, has photo thumbnails, ready to send

**✅ PASS if:** Entire workflow possible without desktop, GPS and photos work on mobile

---

## 📊 RESULTS SUMMARY TEMPLATE

Use this template to record results:

### Summary Statistics

- **Total Tests:** 70
- **Tests Executed:** _____ / 70
- **Tests Passed:** _____ / 70
- **Tests Failed:** _____ / 70
- **Tests Skipped:** _____ / 70 (reason: _______)
- **Pass Rate:** _____%
- **Execution Time:** _____ hours

### Critical Test Results

| Test | Status | Notes |
|------|--------|-------|
| 4.1 - Backup Export (Bug #1) | ✅ / ❌ | |
| 4.2 - Backup Import (Bug #2) | ✅ / ❌ | |
| 4.3 - Round-Trip Integrity | ✅ / ❌ | |
| 7.1-7.5 - Contract Workflow | ✅ / ❌ | |
| 7.6-7.8 - Mobile Workflow | ✅ / ❌ | |

### Bugs Found

| Bug ID | Severity | Module | Description | Workaround |
|--------|----------|--------|-------------|------------|
| BUG-001 | High/Med/Low | Module | Description | Workaround |

### Browser Compatibility

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | ___ | ✅ / ❌ | |
| Firefox | ___ | ✅ / ❌ | |
| Safari | ___ | ✅ / ❌ | |
| Safari iOS | ___ | ✅ / ❌ | |

### Performance Notes

- **Page Load Time:** _____ seconds
- **Dashboard Render Time:** _____ seconds
- **Large Dataset Performance:** Good / Fair / Poor
- **Memory Usage:** Normal / High

### Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority bugs documented
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tester:** _________________
**Date:** _________________
**Environment:** Local / Staging / Production
**Device:** _________________

---

## 🎯 NEXT STEPS AFTER TESTING

### If All Tests Pass (✅)

1. **Create final test results report** (use template above)
2. **Update PROJECT_STATE.md** with integration status (100%)
3. **Create deployment checklist** for production
4. **Tag release** in git: `git tag v1.13.0`
5. **Deploy to production**

### If Tests Fail (❌)

1. **Document all failures** in bugs table
2. **Prioritize bugs** (critical → high → medium → low)
3. **Fix critical bugs** before deployment
4. **Re-run failed tests** after fixes
5. **Create bug fix report** (e.g., `BUG_FIX_REPORT_2025-11-19.md`)

### If Tests Skipped (⏸️)

1. **Document reason** for skip (e.g., "No mobile device available")
2. **Schedule deferred testing** (e.g., "Test on real iPad next week")
3. **Mark in report** which tests are pending

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue: Tests taking too long**
- **Solution:** Focus on Critical and High Priority tests first (Phase A & B)

**Issue: No mobile device available**
- **Solution:** Skip mobile tests (Tests 3.1-3.3, 7.6-7.8), mark as deferred

**Issue: Browser crashes/hangs**
- **Solution:** This is expected due to Service Worker. Simply restart browser and continue.

**Issue: Can't find feature/button**
- **Solution:** Check CLAUDE.md for exact button locations, or use browser search (Ctrl+F)

**Issue: Data corruption**
- **Solution:** Clear localStorage, start fresh, re-run test

---

## ✅ COMPLETION CHECKLIST

Before marking Phase 6 complete:

- [ ] All Backup & Recovery tests passed (Tests 4.1-4.8)
- [ ] End-to-End Workflow 1 passed (Contract automation)
- [ ] Results documented in summary template
- [ ] Bugs logged (if any found)
- [ ] Test report created and saved

**Estimated Minimum Testing Time:** 45 minutes (Critical tests only)
**Estimated Full Testing Time:** 2-3 hours (All 70 tests)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Status:** Ready for execution
