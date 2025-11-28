# TicTacStick Quote Engine - Next Improvements Plan

**Created:** 2025-11-28
**Status:** Planning
**Priority Order:** Job Tracker → Calendar → PDF Export → Email Integration

---

## Executive Summary

This document outlines the next set of improvements for the TicTacStick Quote Engine (Quasar v2). The primary focus is implementing a comprehensive **Job Tracker** system that enables field workers to manage active jobs, track time, add photos, check off items, adjust pricing, and capture client signatures.

---

## Phase A: Job Tracker System (Priority 1)

### A.1 Overview

Transform accepted quotes into actionable jobs with full field tracking capabilities.

**User Story:** As a window cleaner, I want to convert accepted quotes to jobs, track my work progress, add before/after photos, adjust pricing on-site, and get client sign-off when complete.

### A.2 Data Model

```typescript
// packages/calculation-engine/src/index.ts (additions)

interface Job {
  id: string;
  jobNumber: string;
  
  // Source
  quoteId: string;
  invoiceId?: string;
  
  // Client Info (denormalized for offline access)
  client: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  
  // Status Flow: scheduled → in-progress → completed → invoiced
  status: 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'invoiced' | 'cancelled';
  
  // Schedule
  schedule: {
    scheduledDate: string; // ISO date
    scheduledTime?: string; // HH:mm
    estimatedDuration: number; // minutes
    actualStartTime?: string;
    actualEndTime?: string;
    actualDuration?: number; // minutes
  };
  
  // Work Items (from quote lines)
  items: JobItem[];
  
  // Pricing
  pricing: {
    estimatedSubtotal: number;
    estimatedGst: number;
    estimatedTotal: number;
    actualSubtotal: number;
    actualGst: number;
    actualTotal: number;
    adjustmentReason?: string;
  };
  
  // Photos
  photos: JobPhoto[];
  
  // Notes & Issues
  notes: JobNote[];
  issues: JobIssue[];
  
  // Completion
  completion?: {
    completedAt: string;
    clientSignature?: string; // base64 data URL
    clientName?: string;
    rating?: 1 | 2 | 3 | 4 | 5;
    feedback?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface JobItem {
  id: string;
  type: 'window' | 'pressure';
  description: string;
  
  // Original from quote
  estimatedPrice: number;
  estimatedTime: number; // minutes
  
  // Actual (editable)
  actualPrice: number;
  actualTime?: number;
  
  // Checklist
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: string;
  
  // Notes per item
  notes?: string;
  
  // For window items
  windowDetails?: {
    windowType: string;
    panes: number;
    inside: boolean;
    outside: boolean;
    insideComplete: boolean;
    outsideComplete: boolean;
  };
  
  // For pressure items  
  pressureDetails?: {
    surfaceType: string;
    areaSqm: number;
    percentComplete: number;
  };
}

interface JobPhoto {
  id: string;
  type: 'before' | 'during' | 'after' | 'issue';
  itemId?: string; // Link to specific work item
  uri: string; // base64 or file URI
  thumbnail?: string;
  caption?: string;
  takenAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface JobNote {
  id: string;
  text: string;
  createdAt: string;
  itemId?: string; // Optional link to work item
}

interface JobIssue {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  photoIds: string[];
  resolved: boolean;
  resolution?: string;
  createdAt: string;
}
```

### A.3 Store Implementation

**File:** `apps/quote-engine/src/stores/jobs.ts`

```typescript
// Key functions to implement:

// CRUD
createJobFromQuote(quoteId: string, scheduledDate: string): Job
getJob(id: string): Job | null
updateJob(id: string, updates: Partial<Job>): void
deleteJob(id: string): void
listJobs(filters?: JobFilters): Job[]

// Status Management
startJob(id: string): void
pauseJob(id: string): void
resumeJob(id: string): void
completeJob(id: string): void
cancelJob(id: string, reason: string): void

// Item Management
updateItemStatus(jobId: string, itemId: string, status: JobItemStatus): void
updateItemPrice(jobId: string, itemId: string, price: number, reason?: string): void
addItemNote(jobId: string, itemId: string, note: string): void

// Photos
addPhoto(jobId: string, photo: Omit<JobPhoto, 'id'>): void
removePhoto(jobId: string, photoId: string): void

// Notes & Issues
addNote(jobId: string, text: string, itemId?: string): void
addIssue(jobId: string, issue: Omit<JobIssue, 'id' | 'createdAt'>): void
resolveIssue(jobId: string, issueId: string, resolution: string): void

// Completion
captureSignature(jobId: string, signatureData: string, clientName: string): void
completeWithSignature(jobId: string, completion: JobCompletion): void

// Metrics
getJobMetrics(dateRange?: DateRange): JobMetrics
getTodaysJobs(): Job[]
getUpcomingJobs(days: number): Job[]

// Invoice Integration
createInvoiceFromJob(jobId: string): string // returns invoiceId
```

### A.4 UI Components

#### A.4.1 Jobs List Page
**File:** `apps/quote-engine/src/pages/JobsPage.vue`

- Today's jobs section (prominent)
- Upcoming jobs list
- Status filters (All, Scheduled, In Progress, Completed)
- Search by client name/address
- Quick actions: Start, View, Edit

#### A.4.2 Active Job Page
**File:** `apps/quote-engine/src/pages/ActiveJobPage.vue`

- Job header: Client info, job number, timer
- Work items checklist with swipe gestures
- Photo capture buttons (Before/After/Issue)
- Price adjustment modal
- Notes input
- Complete job flow

#### A.4.3 Job Completion Flow
**File:** `apps/quote-engine/src/components/Jobs/JobCompletionWizard.vue`

Steps:
1. Review completed items
2. Confirm final pricing
3. Capture signature (canvas component)
4. Optional: Request rating/feedback
5. Generate invoice (optional)

#### A.4.4 Supporting Components

```
src/components/Jobs/
├── JobCard.vue              # Job summary card for lists
├── JobItemRow.vue           # Checkable work item row
├── JobTimer.vue             # Active timer with pause/resume
├── PhotoCapture.vue         # Camera integration
├── PhotoGallery.vue         # Before/After photo grid
├── SignatureCanvas.vue      # Client signature capture
├── PriceAdjustDialog.vue    # Adjust item price with reason
├── IssueReportDialog.vue    # Report issues with photos
└── JobSummary.vue           # Job completion summary
```

### A.5 Routes

```typescript
// Add to routes.ts
{
  path: 'jobs',
  name: 'jobs',
  component: () => import('../pages/JobsPage.vue'),
},
{
  path: 'jobs/:id',
  name: 'activeJob',
  component: () => import('../pages/ActiveJobPage.vue'),
},
{
  path: 'jobs/:id/complete',
  name: 'completeJob',
  component: () => import('../pages/JobCompletionPage.vue'),
},
```

### A.6 Implementation Order

1. **Week 1: Core Data & Store**
   - Add Job types to calculation-engine
   - Create jobs.ts store with CRUD
   - Add job storage to useStorage composable
   - Unit tests for store

2. **Week 2: Jobs List UI**
   - JobsPage with list/filters
   - JobCard component
   - Navigation integration
   - "Create Job from Quote" flow

3. **Week 3: Active Job UI**
   - ActiveJobPage layout
   - JobItemRow with checkbox
   - JobTimer component
   - Price adjustment modal

4. **Week 4: Photos & Completion**
   - PhotoCapture component
   - PhotoGallery component  
   - SignatureCanvas component
   - JobCompletionWizard

5. **Week 5: Polish & Integration**
   - Invoice generation from job
   - Analytics integration
   - Offline support verification
   - E2E tests

---

## Phase B: Calendar Integration (Priority 2)

### B.1 Overview

Visual calendar for scheduling jobs and viewing workload.

### B.2 Features

- Monthly/Weekly/Daily views
- Drag-and-drop job scheduling
- Conflict detection
- Time slot blocking
- Integration with quote-to-job flow

### B.3 Implementation

```
src/pages/CalendarPage.vue
src/components/Calendar/
├── CalendarView.vue
├── DayView.vue
├── WeekView.vue
├── MonthView.vue
├── TimeSlot.vue
└── JobEvent.vue
```

**Library:** Consider using FullCalendar.js or build custom Vue component

---

## Phase C: PDF Export Enhancement (Priority 3)

### C.1 Overview

Generate professional PDF quotes and invoices.

### C.2 Features

- Quote PDF with branding
- Invoice PDF with payment details
- Job summary PDF (before/after photos)
- Batch PDF export

### C.3 Implementation

```
src/composables/usePdfExport.ts
src/templates/
├── quote-pdf.ts
├── invoice-pdf.ts
└── job-summary-pdf.ts
```

**Library:** jsPDF or @react-pdf/renderer (via worker)

---

## Phase D: Email Integration (Priority 4)

### D.1 Overview

Send quotes, invoices, and job summaries via email.

### D.2 Features

- Send quote to client
- Send invoice with PDF attachment
- Job completion notification
- Email templates

### D.3 Implementation

Uses existing meta-api email endpoints:
- POST /email/send-quote
- POST /email/send-invoice

Add client-side integration in quote-engine.

---

## Technical Considerations

### Offline Support

All job data must work offline:
- IndexedDB for job storage (via useStorage)
- Photo storage as base64 (with compression)
- Queue changes for sync when online
- Conflict resolution for concurrent edits

### Photo Management

- Compress photos before storage (< 500KB each)
- Generate thumbnails for lists
- Consider external storage for production (S3/Cloudflare R2)
- Clean up old photos periodically

### Performance

- Lazy load job photos
- Paginate job lists
- Virtual scrolling for long item lists
- Background sync for analytics

### Mobile UX

- Large touch targets (44px minimum)
- Swipe gestures for item completion
- Camera integration via Capacitor
- Signature canvas optimized for touch
- Landscape support for signature

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Job creation time | < 30 seconds |
| Item check-off | < 2 seconds each |
| Photo capture | < 5 seconds |
| Signature capture | < 30 seconds |
| Complete job flow | < 2 minutes |
| Offline reliability | 100% |

---

## Next Steps

1. ✅ Review and approve this plan
2. Create Job types in calculation-engine
3. Create jobs.ts store
4. Build JobsPage.vue
5. Iterate on ActiveJobPage

---

## Appendix: Existing v1 Code Reference

The legacy webapp has job tracking in v1/:
- `job-manager.js` - Core job logic (~863 lines)
- `job-tracking-ui.js` - UI controller (~1110 lines)
- `job-presets.js` - Default configurations
- `job-tracking-global.js` - Initialization

These can be used as reference but should be rewritten in TypeScript/Vue 3 composition API style for the quote-engine app.
