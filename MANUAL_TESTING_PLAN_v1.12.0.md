# TicTacStick v1.12.0 - Prioritized Manual Testing Plan

**Version:** 1.12.0
**Created:** 2025-11-18
**Purpose:** Strategic testing plan for v1.12.0 deployment readiness
**Total Tests:** 70 (from MANUAL_TESTING_v1.12.0.md)

---

## Executive Summary

### What's New in v1.12.0
This release adds ~10,000 lines of new code across 19 modules:
- 📋 **Contract Management** - Recurring service contracts with automation
- 📊 **Enhanced Analytics** - Advanced dashboards with Chart.js visualizations
- 📱 **Mobile Features** - Camera, geolocation, push notifications
- 💾 **Backup & Recovery** - Comprehensive data protection
- ❓ **Help System** - In-app guidance and tutorials
- 🧪 **Testing Infrastructure** - Production-quality test framework

### Testing Time Estimates

| Priority | Features | Tests | Time | When to Test |
|----------|----------|-------|------|--------------|
| 🔴 **Priority 1** | Critical features | 18 tests | ~60 min | **Before deployment** |
| 🟡 **Priority 2** | Important features | 27 tests | ~70 min | **Strongly recommended** |
| 🟢 **Priority 3** | Nice-to-have | 25 tests | ~65 min | **If time permits** |
| **TOTAL** | All features | 70 tests | ~3 hours | Full validation |

### Quick Decision Matrix

**Have 1 hour?** → Test Priority 1 only (critical features)
**Have 2 hours?** → Test Priority 1 + Contract Management from Priority 2
**Have 3+ hours?** → Test all priorities (complete validation)

---

## 🔴 PRIORITY 1: Critical Features (Must Test)

**Why Critical:** These features protect data, handle money, and form the core business value. Bugs here could cause data loss or revenue loss.

**Time:** ~60 minutes
**Device:** Desktop (Chrome/Firefox on macOS)
**When:** Before ANY deployment

### Tests to Run

#### 1.1 Backup & Recovery (20 minutes) ⭐ TEST FIRST

**Why First:** Ensures you can recover if anything goes wrong during testing.

**Tests from Checklist:**
- [ ] **Test 4.1.1** - Open Backup Manager (5 min)
- [ ] **Test 4.1.2** - Create full backup (5 min)
  - **Sample Data:** Use current state with at least 3 quotes, 2 clients, 1 invoice
  - **Validation:** Check downloaded JSON file contains all data
  - **Expected Size:** ~50-200 KB depending on data
- [ ] **Test 4.2.1** - Restore full backup (10 min)
  - **Steps:**
    1. Note current quote count
    2. Delete one quote
    3. Restore backup
    4. Verify deleted quote returns
  - **Critical:** Verify ALL data restored correctly

**Pass Criteria:** ✅ Can create backup, download contains valid JSON, restore works perfectly

---

#### 1.2 Contract Management Core (25 minutes)

**Why Critical:** Revenue-generating feature for recurring business.

**Tests from Checklist:**
- [ ] **Test 1.1.1-1.1.3** - Create new contract (10 min)
  - **Sample Client:** "ABC Pty Ltd, 123 Main St Perth"
  - **Service Scope:**
    - 10 standard windows (in/out)
    - 50m² concrete driveway
  - **Frequency:** Monthly (10% discount)
  - **Expected Price:** Calculate base → apply 10% discount
- [ ] **Test 1.2.1** - Activate contract (5 min)
  - **Validation:** Status changes to "active"
  - **Check:** Next service date calculated (1 month from start)
- [ ] **Test 1.2.7** - View revenue forecasting (10 min)
  - **Check MRR:** Monthly recurring revenue displays
  - **Check ARR:** Annual recurring revenue = MRR × 12
  - **Validation:** Numbers match contract pricing

**Pass Criteria:** ✅ Can create, activate contract, MRR/ARR calculate correctly

---

#### 1.3 Analytics Dashboard Basics (15 minutes)

**Why Critical:** Business intelligence for decision-making.

**Tests from Checklist:**
- [ ] **Test 2.1.1-2.1.2** - Open dashboard and view revenue chart (10 min)
  - **Prerequisite:** Need at least 5 saved quotes with varying dates
  - **Sample Data:** Create 2-3 test quotes if needed
  - **Validation:**
    - Chart renders without errors
    - Data points visible
    - Tooltips work on hover
- [ ] **Test 2.1.5** - Change date range filter (5 min)
  - **Try:** Last 7 days, 30 days, year, all-time
  - **Validation:** Chart updates, data changes appropriately

**Pass Criteria:** ✅ Dashboard loads, charts render, filters work

---

### Priority 1 Checklist Summary

- [ ] Backup & Recovery works (20 min)
- [ ] Contract creation and activation works (25 min)
- [ ] Analytics dashboard displays (15 min)

**Total Time:** ~60 minutes
**Result:** If all pass, **safe to deploy** with core functionality validated

---

## 🟡 PRIORITY 2: Important Features (Should Test)

**Why Important:** These enhance user experience and enable field work. Not critical for deployment but strongly recommended.

**Time:** ~70 minutes
**Device:** Mix of desktop and mobile (iPad/iPhone if available)
**When:** Before production release to all users

### Tests to Run

#### 2.1 Contract Management Extended (15 minutes)

**Tests from Checklist:**
- [ ] **Test 1.2.2-1.2.4** - Pause, cancel, renew contracts (15 min)
  - **Pause Test:**
    1. Create and activate a contract
    2. Pause it
    3. Verify status = "paused", no new tasks generated
  - **Cancel Test:**
    1. Cancel a contract with reason "Client moved"
    2. Verify status = "cancelled", reason recorded
  - **Renew Test:**
    1. Create contract with end date = today
    2. Renew it
    3. Verify new contract created with same terms

---

#### 2.2 Enhanced Analytics (20 minutes)

**Tests from Checklist:**
- [ ] **Test 2.1.3-2.1.4** - Conversion funnel and service breakdown (10 min)
  - **Prerequisites:** Need quotes + invoices
  - **Sample Data:** Convert 1-2 quotes to invoices
  - **Validation:** Funnel shows Quote → Invoice flow
- [ ] **Test 2.1.6** - Export analytics to PDF (5 min)
  - **Validation:** PDF downloads, contains charts
- [ ] **Test 2.2.1-2.2.3** - KPI calculations (5 min)
  - **Check:** Avg quote value, win rate, CLV calculate

---

#### 2.3 Mobile Features - Camera & Geolocation (20 minutes)

**Tests from Checklist:**
- [ ] **Test 3.1.1-3.1.2** - Camera integration (10 min)
  - **Device:** iPhone or iPad with camera
  - **Steps:**
    1. Create new quote
    2. Tap "Add Photo" → "Take Photo"
    3. Grant camera permission
    4. Capture photo
    5. Verify photo added to quote
  - **Validation:** Photo displays in quote, EXIF data extracted
- [ ] **Test 3.2.1-3.2.2** - Geolocation (10 min)
  - **Device:** Mobile device or browser with location services
  - **Steps:**
    1. Create quote with address field
    2. Click "Use Current Location"
    3. Grant location permission
    4. Verify address fills automatically
  - **Validation:** GPS coordinates captured, address formatted correctly

---

#### 2.4 Help System (5 minutes)

**Tests from Checklist:**
- [ ] **Test 5.1** - Open Help System (2 min)
  - **Click:** Help button in header
  - **Validation:** Help modal opens
- [ ] **Test 5.2** - Search help content (3 min)
  - **Search:** "create contract"
  - **Validation:** Relevant articles appear

---

#### 2.5 Cross-Browser - Desktop (10 minutes)

**Tests from Checklist:**
- [ ] **Test 6.1-6.2** - Chrome and Firefox (10 min)
  - **Test in Chrome:**
    - Create contract
    - View analytics
    - Create backup
  - **Test in Firefox:**
    - Open app
    - Verify no console errors
    - Test one contract workflow

---

### Priority 2 Checklist Summary

- [ ] Contract pause/cancel/renew (15 min)
- [ ] Enhanced analytics and export (20 min)
- [ ] Mobile camera and geolocation (20 min)
- [ ] Help system (5 min)
- [ ] Cross-browser desktop (10 min)

**Total Time:** ~70 minutes
**Result:** If all pass, **production-ready** with full feature validation

---

## 🟢 PRIORITY 3: Nice-to-Have (Test If Time Permits)

**Why Nice-to-Have:** These are advanced features or edge cases. Good to test but not deployment blockers.

**Time:** ~65 minutes
**Device:** Multiple devices/browsers
**When:** Pre-release QA, beta testing phase

### Tests to Run

#### 3.1 Push Notifications (15 minutes)

**Tests from Checklist:**
- [ ] **Test 3.3.1-3.3.3** - Enable and receive notifications (15 min)
  - **Device:** Desktop Chrome or Firefox
  - **Note:** iOS Safari has limited notification support
  - **Steps:**
    1. Enable push notifications
    2. Grant browser permission
    3. Schedule test notification
    4. Wait for delivery
  - **Validation:** Notification appears at scheduled time

---

#### 3.2 Advanced Analytics (15 minutes)

**Tests from Checklist:**
- [ ] **Test 2.2.4-2.2.6** - Cohort analysis, stats, aggregation (15 min)
  - **Prerequisites:** Need historical data (20+ quotes)
  - **Tests:**
    - Cohort analysis by acquisition month
    - Statistical functions (mean, median)
    - Data aggregation across sources
  - **Note:** May require seeding test data

---

#### 3.3 Mobile Advanced Features (15 minutes)

**Tests from Checklist:**
- [ ] **Test 3.1.3-3.1.4** - EXIF data and multiple photos (10 min)
- [ ] **Test 3.2.3-3.2.6** - Distance calc, nearby clients (5 min)
  - **Device:** Mobile with GPS
  - **Validation:** Distance calculations accurate, nearby search works

---

#### 3.4 Cross-Browser - Safari/Mobile (20 minutes)

**Tests from Checklist:**
- [ ] **Test 6.5-6.6** - Safari iOS/macOS testing (20 min)
  - **Test on Safari:**
    - Open app on iPhone/iPad
    - Test offline mode (airplane mode)
    - Verify Service Worker caching
    - Test ES5 compatibility (no syntax errors)
  - **Critical for:** Field use on iPads

---

### Priority 3 Checklist Summary

- [ ] Push notifications (15 min)
- [ ] Advanced analytics (15 min)
- [ ] Mobile advanced features (15 min)
- [ ] Safari/iOS testing (20 min)

**Total Time:** ~65 minutes
**Result:** If all pass, **fully validated** with comprehensive coverage

---

## 🚀 Quick Smoke Test (15 minutes)

**Use Case:** Rapid validation after deployment or quick sanity check.

**Device:** Desktop Chrome
**Time:** 15 minutes

### Smoke Test Checklist

1. **App Loads** (1 min)
   - [ ] Navigate to app URL
   - [ ] No console errors
   - [ ] UI renders correctly

2. **Create Quote** (3 min)
   - [ ] Add window line (5 standard windows)
   - [ ] Add pressure line (20m² concrete)
   - [ ] Verify total calculates
   - [ ] Save quote

3. **Create Contract** (4 min)
   - [ ] Open Contracts page
   - [ ] Create new contract
   - [ ] Select client, define scope
   - [ ] Set monthly frequency
   - [ ] Activate contract

4. **View Analytics** (2 min)
   - [ ] Open Analytics Dashboard
   - [ ] Verify chart renders
   - [ ] No errors in console

5. **Create Backup** (3 min)
   - [ ] Open Settings → Backup
   - [ ] Create full backup
   - [ ] Download completes successfully

6. **Test Help** (2 min)
   - [ ] Open Help system
   - [ ] Search for "contract"
   - [ ] Results display

**Pass Criteria:** All 6 steps complete without errors
**Result:** ✅ Core functionality operational

---

## Testing Strategy

### Recommended Testing Order

1. **Start with Backup** - Always test backup FIRST so you can recover data
2. **Desktop before Mobile** - Easier to debug on desktop Chrome DevTools
3. **Happy path first** - Test normal workflows before edge cases
4. **One feature at a time** - Complete each section fully before moving on

### Sample Test Data

Use realistic data that mirrors actual business use:

**Sample Client:**
- Name: "ABC Commercial Cleaning Pty Ltd"
- Location: "Unit 5, 123 Main Street, Perth WA 6000"
- Contact: "John Smith, 0400 123 456, john@abc.com.au"

**Sample Contract:**
- Type: Commercial
- Frequency: Monthly
- Services:
  - 20 standard windows (inside + outside)
  - 10 sliding doors
  - 100m² concrete pressure cleaning
- Expected monthly price: ~$450-500 (with 10% monthly discount)

**Sample Quote:**
- Title: "Perth CBD Office - Monthly Service"
- 15 standard windows @ 3 min each
- 75m² driveway cleaning
- Base fee: $120
- Hourly rate: $95

### Common Issues to Watch For

**Contract Management:**
- ⚠️ Discount not applying correctly
- ⚠️ MRR/ARR calculations off by factor of 12
- ⚠️ Next service date not calculating

**Analytics:**
- ⚠️ Charts not rendering (Chart.js not loaded)
- ⚠️ Date filters not updating data
- ⚠️ Export PDF fails silently

**Mobile Features:**
- ⚠️ Camera permission denied (need to allow in browser)
- ⚠️ Geolocation timeout (need location services enabled)
- ⚠️ Photos not compressing (file size too large)

**Backup:**
- ⚠️ JSON file corrupted (check format)
- ⚠️ Restore doesn't overwrite existing data
- ⚠️ LocalStorage quota exceeded

### Browser-Specific Notes

**Chrome/Edge (Chromium):**
- ✅ Full support for all features
- ✅ Best DevTools for debugging
- ✅ Push notifications work well

**Firefox:**
- ✅ Full support
- ⚠️ Camera API may require HTTPS
- ✅ Good privacy controls

**Safari (macOS):**
- ✅ Good support
- ⚠️ Push notifications limited
- ⚠️ May need specific permissions

**Safari (iOS):**
- ✅ Critical for field use
- ⚠️ Camera works but UI different
- ⚠️ No push notifications
- ✅ Offline mode crucial - TEST THOROUGHLY

---

## Progress Tracking

### Priority 1: Critical Features

| Test | Feature | Time | Status | Issues Found |
|------|---------|------|--------|--------------|
| 4.1.1-4.2.1 | Backup & Recovery | 20m | ⬜ | |
| 1.1.1-1.2.7 | Contract Core | 25m | ⬜ | |
| 2.1.1-2.1.5 | Analytics Basics | 15m | ⬜ | |

### Priority 2: Important Features

| Test | Feature | Time | Status | Issues Found |
|------|---------|------|--------|--------------|
| 1.2.2-1.2.4 | Contract Extended | 15m | ⬜ | |
| 2.1.3-2.2.3 | Enhanced Analytics | 20m | ⬜ | |
| 3.1.1-3.2.2 | Mobile Camera/Geo | 20m | ⬜ | |
| 5.1-5.2 | Help System | 5m | ⬜ | |
| 6.1-6.2 | Cross-Browser Desktop | 10m | ⬜ | |

### Priority 3: Nice-to-Have

| Test | Feature | Time | Status | Issues Found |
|------|---------|------|--------|--------------|
| 3.3.1-3.3.3 | Push Notifications | 15m | ⬜ | |
| 2.2.4-2.2.6 | Advanced Analytics | 15m | ⬜ | |
| 3.1.3-3.2.6 | Mobile Advanced | 15m | ⬜ | |
| 6.5-6.6 | Safari/iOS | 20m | ⬜ | |

**Status Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

---

## Issue Logging Template

When you find issues during testing, log them here:

| Issue # | Priority | Module | Description | Severity | Workaround | Status |
|---------|----------|--------|-------------|----------|------------|--------|
| 001 | P1 | Contracts | Discount not applying on monthly contracts | High | Manually calculate discount | 🔴 Open |
| 002 | P2 | Analytics | Chart doesn't update with date filter | Medium | Refresh page | 🔴 Open |

**Severity Levels:**
- **Critical** - Blocks deployment, causes data loss
- **High** - Major feature broken, no workaround
- **Medium** - Feature impaired, workaround exists
- **Low** - Minor issue, cosmetic

---

## Deployment Readiness Criteria

### ✅ Ready to Deploy If:
- [ ] All Priority 1 tests pass
- [ ] Backup & Recovery works flawlessly
- [ ] Contract creation and activation functional
- [ ] Analytics dashboard displays without errors
- [ ] No critical or high severity issues found

### ⚠️ Deploy with Caution If:
- [ ] Priority 1 passes but Priority 2 has issues
- [ ] Mobile features have minor bugs (can be fixed post-deployment)
- [ ] Analytics has cosmetic issues only

### 🛑 DO NOT Deploy If:
- [ ] Backup/Recovery fails
- [ ] Contract creation broken
- [ ] Critical data loss bugs found
- [ ] Analytics dashboard crashes browser

---

## Post-Testing Actions

### After Priority 1 Testing:
1. **Document Results** - Fill in progress tracking table
2. **Log Issues** - Record all bugs found
3. **Decide:** Deploy now or test Priority 2?

### After Priority 2 Testing:
1. **Update Status** - Mark all tests complete
2. **Triage Issues** - Classify by severity
3. **Create Bug Fixes** - Address high/critical issues
4. **Decide:** Deploy to production or continue testing?

### After All Testing Complete:
1. **Final Report** - Complete MANUAL_TESTING_v1.12.0.md sign-off
2. **Document Findings** - Update CHANGELOG.md with known issues
3. **Backup Before Deploy** - Create full production backup
4. **Deploy** - Push to production
5. **Monitor** - Watch for errors in first 24 hours

---

## References

- **Full Test Details:** [MANUAL_TESTING_v1.12.0.md](MANUAL_TESTING_v1.12.0.md)
- **Test Infrastructure:** [CLAUDE.md - Testing Section](CLAUDE.md#testing)
- **Deployment Tools:** [deployment-helper.js](deployment-helper.js)
- **Health Monitoring:** [health-check.js](health-check.js)

---

## Quick Links

**Before Testing:**
- [ ] Read this entire plan
- [ ] Set up test environment (local server running)
- [ ] Prepare sample test data
- [ ] Have backup checklist open

**During Testing:**
- [ ] Follow priority order (P1 → P2 → P3)
- [ ] Log issues immediately
- [ ] Take screenshots of errors
- [ ] Note time taken for each section

**After Testing:**
- [ ] Complete progress tracking tables
- [ ] Review all logged issues
- [ ] Make deployment decision
- [ ] Update CHANGELOG.md

---

**Testing Champion:** Gerard Varone
**Target Completion:** Before v1.12.0 production deployment
**Questions?** See CLAUDE.md troubleshooting section

---

**Good luck! 🚀 Test methodically, one feature at a time.**
