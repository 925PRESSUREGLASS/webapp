# Atomic Improvement Plan

**Created:** November 29, 2025  
**Status:** Ready for Implementation

---

## Overview

This document breaks down all planned improvements into atomic, independently-committable steps.

---

## 🔧 TASK 1: Fix Line Item Total Not Carrying Over from Quote to Job

### Problem Analysis
When converting a quote to a job, the `convertQuoteToJob` function passes `quote.total` but:
1. `createJob` uses `line.calculatedCost` from line items (may not be populated)
2. The passed `total` parameter is never used in `createJob`
3. Result: Jobs may have $0 pricing even when quote had valid totals

### Atomic Steps

#### Step 1.1: Add `breakdown` parameter to `CreateJobParams` interface
- **File:** `apps/quote-engine/src/stores/jobs.ts`
- **Change:** Add optional `breakdown` field to `CreateJobParams` type
- **Test:** TypeScript compilation
- **Commit:** `fix(jobs): add breakdown field to CreateJobParams interface`

#### Step 1.2: Add `breakdown` parameter to `QuoteToJobParams` interface
- **File:** `apps/quote-engine/src/stores/jobs.ts`
- **Change:** Add optional `breakdown` field to `QuoteToJobParams` type
- **Test:** TypeScript compilation
- **Commit:** (combine with 1.1)

#### Step 1.3: Update `createJob` to use breakdown when provided
- **File:** `apps/quote-engine/src/stores/jobs.ts`
- **Change:** In `createJob`, check if `data.breakdown` exists and use it to set `pricing.estimatedSubtotal`, `pricing.estimatedGst`, `pricing.estimatedTotal`
- **Test:** Unit test or manual test
- **Commit:** `fix(jobs): use breakdown totals when provided in createJob`

#### Step 1.4: Update `convertQuoteToJob` to pass breakdown
- **File:** `apps/quote-engine/src/stores/jobs.ts`
- **Change:** Pass `breakdown` from params to `createJob`
- **Test:** TypeScript compilation
- **Commit:** (combine with 1.3)

#### Step 1.5: Update `scheduleJob` in SavedQuotesPage to pass breakdown
- **File:** `apps/quote-engine/src/pages/SavedQuotesPage.vue`
- **Change:** Add `breakdown` object with `subtotal`, `gst`, `total` from quote
- **Test:** Manual test - create quote, schedule job, verify totals match
- **Commit:** `fix(quotes): pass breakdown when converting quote to job`

#### Step 1.6: Add unit test for quote-to-job conversion with totals
- **File:** `apps/quote-engine/src/stores/__tests__/jobs.test.ts` (new)
- **Change:** Create test that verifies totals carry over correctly
- **Test:** Run vitest
- **Commit:** `test(jobs): add unit test for quote-to-job total preservation`

---

## 🧪 TASK 2: Add E2E Tests for Job Tracker

### Atomic Steps

#### Step 2.1: Create E2E test file structure
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts` (new)
- **Change:** Create file with imports and describe blocks
- **Test:** Playwright dry run
- **Commit:** `test(e2e): add job tracker E2E test file`

#### Step 2.2: Add navigation test
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts`
- **Change:** Test that /jobs route loads and displays job list
- **Test:** `npm run test:e2e`
- **Commit:** (combine with 2.1)

#### Step 2.3: Add job list display test
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts`
- **Change:** Test job cards, status badges, action buttons
- **Test:** `npm run test:e2e`
- **Commit:** (combine with 2.1)

#### Step 2.4: Add quote-to-job conversion test
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts`
- **Change:** Full flow: create quote → save → schedule job → verify job created
- **Test:** `npm run test:e2e`
- **Commit:** `test(e2e): add quote-to-job conversion E2E test`

#### Step 2.5: Add job status change test
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts`
- **Change:** Test start/pause/resume/complete workflow
- **Test:** `npm run test:e2e`
- **Commit:** `test(e2e): add job status workflow E2E test`

#### Step 2.6: Add job completion wizard test
- **File:** `apps/quote-engine/tests/e2e/job-tracker.spec.ts`
- **Change:** Test signature, photos, completion flow
- **Test:** `npm run test:e2e`
- **Commit:** `test(e2e): add job completion wizard E2E test`

---

## 📅 TASK 3: Phase B Calendar Integration

### Week 1: Core Calendar

#### Step 3.1: Create calendar types
- **File:** `apps/quote-engine/src/types/calendar.ts` (new)
- **Change:** Define `CalendarEvent`, `CalendarView`, `TimeSlot` interfaces
- **Test:** TypeScript compilation
- **Commit:** `feat(calendar): add calendar type definitions`

#### Step 3.2: Create calendar store
- **File:** `apps/quote-engine/src/stores/calendar.ts` (new)
- **Change:** Pinia store with events, view state, CRUD operations
- **Test:** TypeScript compilation
- **Commit:** `feat(calendar): add calendar store`

#### Step 3.3: Create CalendarPage component structure
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue` (new)
- **Change:** Basic page with header, view toggles, empty calendar grid
- **Test:** Dev server visual check
- **Commit:** `feat(calendar): add CalendarPage component`

#### Step 3.4: Add calendar route
- **File:** `apps/quote-engine/src/router/routes.ts`
- **Change:** Add `/calendar` route pointing to CalendarPage
- **Test:** Navigate to /calendar
- **Commit:** `feat(calendar): add calendar route`

#### Step 3.5: Add calendar to navigation
- **File:** `apps/quote-engine/src/layouts/MainLayout.vue`
- **Change:** Add "Calendar" link to drawer menu
- **Test:** Click nav link, verify navigation
- **Commit:** `feat(calendar): add calendar to navigation drawer`

#### Step 3.6: Implement month view grid
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Render month calendar grid with day cells
- **Test:** Visual verification
- **Commit:** `feat(calendar): implement month view grid`

#### Step 3.7: Display jobs on calendar
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Fetch jobs from job store, render on appropriate dates
- **Test:** Create job, verify appears on calendar
- **Commit:** `feat(calendar): display scheduled jobs on calendar`

### Week 2: Week View & Interactions

#### Step 3.8: Implement week view
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Add week view with time slots (7am-7pm)
- **Test:** Toggle to week view, verify display
- **Commit:** `feat(calendar): implement week view with time slots`

#### Step 3.9: Implement day view
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Add detailed day view with hourly breakdown
- **Test:** Toggle to day view, verify display
- **Commit:** `feat(calendar): implement day view`

#### Step 3.10: Add click-to-view-job
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Click job event → navigate to job details
- **Test:** Click job on calendar, verify navigation
- **Commit:** `feat(calendar): add job click navigation`

### Week 3: Job Scheduling

#### Step 3.11: Create ScheduleJobModal component
- **File:** `apps/quote-engine/src/components/Jobs/ScheduleJobModal.vue` (new)
- **Change:** Modal with date picker, time picker, duration
- **Test:** Visual verification
- **Commit:** `feat(calendar): add ScheduleJobModal component`

#### Step 3.12: Add reschedule functionality
- **File:** `apps/quote-engine/src/stores/jobs.ts`
- **Change:** Add `rescheduleJob(jobId, newDate, newTime)` function
- **Test:** Unit test
- **Commit:** `feat(jobs): add reschedule job function`

#### Step 3.13: Implement drag-and-drop (optional)
- **File:** `apps/quote-engine/src/pages/CalendarPage.vue`
- **Change:** Drag job to new date/time slot
- **Test:** Drag job, verify reschedule
- **Commit:** `feat(calendar): add drag-and-drop job rescheduling`

### Week 4: Polish

#### Step 3.14: Add conflict detection
- **File:** `apps/quote-engine/src/stores/calendar.ts`
- **Change:** Detect overlapping job schedules
- **Test:** Schedule overlapping jobs, verify warning
- **Commit:** `feat(calendar): add schedule conflict detection`

#### Step 3.15: Add calendar settings
- **File:** `apps/quote-engine/src/stores/calendar.ts`
- **Change:** Working hours, default view, first day of week
- **Test:** Change settings, verify calendar updates
- **Commit:** `feat(calendar): add calendar settings`

---

## 📄 TASK 4: PDF Export for Jobs

### Atomic Steps

#### Step 4.1: Research PDF library options
- **Action:** Evaluate jsPDF, pdfmake, or html2pdf
- **Output:** Decision documented
- **Commit:** N/A (research only)

#### Step 4.2: Create job receipt template
- **File:** `apps/quote-engine/src/templates/job-receipt.ts` (new)
- **Change:** Define HTML template for job receipt
- **Test:** Preview in browser
- **Commit:** `feat(jobs): add job receipt template`

#### Step 4.3: Add PDF generation utility
- **File:** `apps/quote-engine/src/utils/pdf-generator.ts` (new)
- **Change:** Function to convert job to PDF using chosen library
- **Test:** Generate test PDF
- **Commit:** `feat(jobs): add PDF generation utility`

#### Step 4.4: Add "Export PDF" button to ActiveJobPage
- **File:** `apps/quote-engine/src/pages/ActiveJobPage.vue`
- **Change:** Add button for completed jobs to export receipt
- **Test:** Complete job, click export, verify PDF downloads
- **Commit:** `feat(jobs): add PDF export button for completed jobs`

#### Step 4.5: Include signature and photos in PDF
- **File:** `apps/quote-engine/src/utils/pdf-generator.ts`
- **Change:** Embed signature image and job photos
- **Test:** Complete job with signature, verify in PDF
- **Commit:** `feat(jobs): include signature and photos in job PDF`

---

## Implementation Order

**Recommended sequence:**

1. **Task 1 (Fix Totals)** - Critical bug fix, do first
   - Steps 1.1-1.5 (30 min)
   - Step 1.6 (15 min)

2. **Task 2 (E2E Tests)** - Validates existing functionality
   - Steps 2.1-2.3 (30 min)
   - Steps 2.4-2.6 (45 min)

3. **Task 3 Week 1 (Calendar Core)** - New feature, highest value
   - Steps 3.1-3.5 (1 hour)
   - Steps 3.6-3.7 (1 hour)

4. **Task 4 (PDF Export)** - Can be done in parallel
   - Steps 4.1-4.3 (1 hour)
   - Steps 4.4-4.5 (30 min)

5. **Task 3 Weeks 2-4** - Calendar enhancements
   - As time permits

---

## Verification Checklist

After each commit:
- [ ] TypeScript compiles without errors in changed files
- [ ] Existing tests pass (`npm test -- --run`)
- [ ] Manual smoke test of affected feature
- [ ] Commit message follows conventional format

---

## Notes

- Each step should be a single focused change
- Steps can be combined into one commit where noted
- Test after each step before proceeding
- If a step fails, debug before continuing
