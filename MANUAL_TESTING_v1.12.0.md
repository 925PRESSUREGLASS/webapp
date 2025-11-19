# TicTacStick v1.12.0 - Manual Testing Checklist

**Version:** 1.12.0
**Date:** 2025-11-18
**Tester:** _________________
**Environment:** Production / Staging / Local
**Device:** _________________
**Browser:** _________________

---

## ✅ Testing Status

- [ ] **Contract Management** (15 tests)
- [ ] **Enhanced Analytics** (12 tests)
- [ ] **Mobile Features** (16 tests)
- [ ] **Backup & Recovery** (8 tests)
- [ ] **Help System** (5 tests)
- [ ] **Cross-Browser** (6 tests)
- [ ] **End-to-End Workflows** (8 tests)

**Total:** 70 manual tests

---

## 📋 1. CONTRACT MANAGEMENT SYSTEM

### 1.1 Contract Creation Wizard

- [ ] **Test 1.1.1:** Open Contracts page via "📋 Contracts" button in header
  - **Expected:** Contracts page displays with empty state or contract list

- [ ] **Test 1.1.2:** Click "New Contract" button to launch Contract Wizard
  - **Expected:** Wizard modal opens with Step 1 (Client Selection)

- [ ] **Test 1.1.3:** Select existing client from dropdown
  - **Expected:** Client info auto-fills (name, location, contact)

- [ ] **Test 1.1.4:** Define service scope with windows and pressure cleaning
  - **Expected:** Can add/remove line items, quantities update pricing

- [ ] **Test 1.1.5:** Choose contract frequency (monthly, quarterly, annual)
  - **Expected:** Discount automatically applies (10% monthly, 15% quarterly, 20% annual)

- [ ] **Test 1.1.6:** Set contract start and end dates
  - **Expected:** End date defaults to 1 year from start, can be customized

- [ ] **Test 1.1.7:** Review contract preview before creation
  - **Expected:** All details display correctly (pricing, frequency, scope, terms)

- [ ] **Test 1.1.8:** Save contract
  - **Expected:** Contract appears in contract list with status "draft"

### 1.2 Contract Management

- [ ] **Test 1.2.1:** Activate a draft contract
  - **Expected:** Status changes to "active", next service date is calculated

- [ ] **Test 1.2.2:** Pause an active contract
  - **Expected:** Status changes to "paused", no new service tasks generated

- [ ] **Test 1.2.3:** Cancel a contract with reason
  - **Expected:** Status changes to "cancelled", reason is recorded

- [ ] **Test 1.2.4:** Renew an expiring contract
  - **Expected:** New contract created with same terms, new start/end dates

- [ ] **Test 1.2.5:** View contract history for a client
  - **Expected:** Shows all contracts (past and present) for selected client

- [ ] **Test 1.2.6:** Filter contracts by status (active, paused, cancelled, expired)
  - **Expected:** List updates to show only contracts matching filter

- [ ] **Test 1.2.7:** View contract revenue forecasting (MRR, ARR)
  - **Expected:** Monthly Recurring Revenue and Annual Recurring Revenue display correctly

---

## 📊 2. ENHANCED ANALYTICS SYSTEM

### 2.1 Analytics Dashboard

- [ ] **Test 2.1.1:** Open Analytics Dashboard via "View Analytics" button
  - **Expected:** Dashboard loads with charts and metrics

- [ ] **Test 2.1.2:** Verify Revenue Trend Chart displays correctly
  - **Expected:** Line/bar chart shows revenue over time with accurate data

- [ ] **Test 2.1.3:** Verify Conversion Funnel Chart
  - **Expected:** Funnel shows Quote → Invoice → Payment conversion rates

- [ ] **Test 2.1.4:** Verify Service Breakdown Pie Chart
  - **Expected:** Pie chart shows % split between Windows and Pressure cleaning

- [ ] **Test 2.1.5:** Change date range filter (last 7 days, 30 days, year, all-time)
  - **Expected:** All charts and metrics update to reflect selected range

- [ ] **Test 2.1.6:** Export analytics report to PDF
  - **Expected:** PDF downloads with all charts and metrics

### 2.2 Analytics Engine

- [ ] **Test 2.2.1:** Verify KPI calculations (avg quote value, win rate, sales cycle)
  - **Expected:** Metrics are accurate based on quote/invoice data

- [ ] **Test 2.2.2:** Test time-series analysis for trend detection
  - **Expected:** System detects upward/downward trends in revenue

- [ ] **Test 2.2.3:** Verify Customer Lifetime Value (CLV) calculation
  - **Expected:** CLV calculated correctly for repeat clients

- [ ] **Test 2.2.4:** Test cohort analysis by client acquisition month
  - **Expected:** Shows retention and revenue by cohort

- [ ] **Test 2.2.5:** Verify statistical functions (mean, median, percentiles)
  - **Expected:** Stats calculated correctly across all quotes

- [ ] **Test 2.2.6:** Test data aggregation across quotes, invoices, contracts
  - **Expected:** Dashboard aggregates data from all sources correctly

---

## 📱 3. MOBILE & NATIVE FEATURES

### 3.1 Camera Integration

- [ ] **Test 3.1.1:** Open photo upload and select "Take Photo" option
  - **Expected:** Device camera launches (requires camera permission)

- [ ] **Test 3.1.2:** Capture photo using camera
  - **Expected:** Photo preview displays, can retake or accept

- [ ] **Test 3.1.3:** Verify EXIF data extraction from photo
  - **Expected:** Date/time, GPS coordinates extracted and displayed

- [ ] **Test 3.1.4:** Upload multiple photos using camera
  - **Expected:** All photos added to quote with metadata

### 3.2 Geolocation Services

- [ ] **Test 3.2.1:** Click "Use Current Location" button in address field
  - **Expected:** Browser requests location permission, then fills address

- [ ] **Test 3.2.2:** Verify address geocoding (address → coordinates)
  - **Expected:** Typed address converted to GPS coordinates

- [ ] **Test 3.2.3:** Verify reverse geocoding (coordinates → address)
  - **Expected:** GPS coordinates from photo converted to address

- [ ] **Test 3.2.4:** Test distance calculation between two locations
  - **Expected:** Distance displayed in km, travel time estimated

- [ ] **Test 3.2.5:** Search for nearby clients by location
  - **Expected:** Client list filtered by proximity to current location

- [ ] **Test 3.2.6:** Verify service area validation
  - **Expected:** Warning if client location outside service area

### 3.3 Push Notifications

- [ ] **Test 3.3.1:** Enable push notifications (request permission)
  - **Expected:** Browser requests permission, status saved

- [ ] **Test 3.3.2:** Schedule a notification for future delivery
  - **Expected:** Notification appears at scheduled time

- [ ] **Test 3.3.3:** Receive notification for contract renewal reminder
  - **Expected:** Notification displays with contract details

- [ ] **Test 3.3.4:** Click notification to navigate to relevant page
  - **Expected:** App opens to contract/task/quote page

- [ ] **Test 3.3.5:** View notification history
  - **Expected:** All past notifications listed with timestamps

- [ ] **Test 3.3.6:** Clear all notifications
  - **Expected:** Notification list cleared

---

## 💾 4. BACKUP & RECOVERY SYSTEM

### 4.1 Backup Operations

- [ ] **Test 4.1.1:** Open Backup Manager in Settings
  - **Expected:** Backup page displays with last backup date

- [ ] **Test 4.1.2:** Create full backup (all data)
  - **Expected:** JSON file downloads containing quotes, clients, invoices, tasks, contracts

- [ ] **Test 4.1.3:** Create selective backup (choose modules)
  - **Expected:** JSON file contains only selected data (e.g., contracts only)

- [ ] **Test 4.1.4:** Verify backup file integrity (check JSON structure)
  - **Expected:** Backup file is valid JSON, contains version and checksum

### 4.2 Restore Operations

- [ ] **Test 4.2.1:** Restore full backup
  - **Expected:** All data restored, app state matches backup

- [ ] **Test 4.2.2:** Restore selective modules (e.g., restore only clients)
  - **Expected:** Only selected data restored, other data unchanged

- [ ] **Test 4.2.3:** Test backup verification and integrity check
  - **Expected:** System validates backup before restore, shows warnings if corrupted

- [ ] **Test 4.2.4:** Test automatic backup scheduling (24-hour interval)
  - **Expected:** System creates backup automatically after 24 hours

---

## ❓ 5. HELP SYSTEM

- [ ] **Test 5.1:** Open Help System via "Help" button
  - **Expected:** Help modal opens with search bar and topics

- [ ] **Test 5.2:** Search help content (e.g., "create contract")
  - **Expected:** Relevant help articles appear in results

- [ ] **Test 5.3:** View interactive tutorial (e.g., "Getting Started")
  - **Expected:** Step-by-step guided tour launches

- [ ] **Test 5.4:** Access keyboard shortcuts reference
  - **Expected:** All shortcuts listed with descriptions

- [ ] **Test 5.5:** View FAQ section
  - **Expected:** Common questions and answers display

---

## 🌐 6. CROSS-BROWSER COMPATIBILITY

Test core features on multiple browsers:

### Chrome/Edge (Chromium)
- [ ] **Test 6.1:** Contract creation workflow works
- [ ] **Test 6.2:** Analytics dashboard renders charts correctly
- [ ] **Test 6.3:** Mobile features (camera, location) function

### Firefox
- [ ] **Test 6.4:** All v1.12.0 features work as expected

### Safari (iOS/macOS)
- [ ] **Test 6.5:** ES5 compatibility maintained (no syntax errors)
- [ ] **Test 6.6:** Service Worker works offline

---

## 🔄 7. END-TO-END WORKFLOWS

### Workflow 1: Recurring Contract with Automation

- [ ] **Test 7.1:** Create recurring monthly contract
- [ ] **Test 7.2:** Activate contract and verify task auto-generated
- [ ] **Test 7.3:** Complete service task and verify invoice auto-created
- [ ] **Test 7.4:** Verify next service date calculated correctly
- [ ] **Test 7.5:** Check MRR updated with new contract

### Workflow 2: Mobile Field Work

- [ ] **Test 7.6:** Use geolocation to find job site
- [ ] **Test 7.7:** Take photos with camera
- [ ] **Test 7.8:** Create quote on-site with photos and GPS data

---

## 🐛 KNOWN ISSUES

Document any issues found during testing:

| Issue # | Description | Severity | Module | Workaround |
|---------|-------------|----------|--------|------------|
| | | | | |
| | | | | |
| | | | | |

---

## 📝 TESTING NOTES

**General Observations:**
-

**Performance:**
-

**Usability:**
-

**Bugs Found:**
-

**Suggestions:**
-

---

## ✅ SIGN-OFF

- [ ] All critical tests passed
- [ ] All high-priority bugs documented
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tester Signature:** _________________
**Date:** _________________
**Approved By:** _________________
**Date:** _________________
