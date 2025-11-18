# TicTacStick v1.9 - LocalStorage Schema Documentation

**Document Version:** 1.0
**Date:** November 18, 2025
**Author:** Technical Documentation
**Purpose:** Complete LocalStorage data structure reference for migration and development

---

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Storage Keys Reference](#storage-keys-reference)
4. [Data Structures](#data-structures)
5. [Storage Patterns](#storage-patterns)
6. [Quota Management](#quota-management)
7. [Data Migration](#data-migration)
8. [Security Considerations](#security-considerations)
9. [Testing & Validation](#testing--validation)
10. [Cloud Migration Mapping](#cloud-migration-mapping)

---

## Overview

### LocalStorage as Single Source of Truth

TicTacStick uses browser LocalStorage as its **primary and only** data persistence layer. This design decision enables:

- **Complete offline functionality** - Zero server dependency
- **Instant data access** - Synchronous API, no network latency
- **Zero infrastructure costs** - No database or backend required
- **Privacy-first** - All data stays on device
- **Simple architecture** - Direct file-to-browser deployment

### Storage Characteristics

| Aspect | Value | Notes |
|--------|-------|-------|
| **Storage Limit** | ~5-10MB | Browser-dependent; Safari typically 5MB |
| **API Type** | Synchronous | Blocking operations |
| **Data Format** | UTF-16 strings only | All data JSON-serialized |
| **Persistence** | Permanent | Survives browser restarts |
| **Scope** | Origin-based | Per domain + protocol + port |
| **Quota Errors** | QuotaExceededError | Thrown when limit reached |

### Current Storage Usage Estimate

```javascript
// Typical storage usage breakdown:
//
// quote-history (100 entries):     ~200KB
// invoice-database (50 invoices):  ~150KB
// client-database (100 clients):   ~50KB
// tictacstick_autosave_state_v1:   ~20KB
// tictacstick_saved_quotes_v1:     ~100KB
// Other keys:                      ~30KB
//
// TOTAL TYPICAL:                   ~550KB (11% of 5MB quota)
// MAXIMUM EXPECTED:                ~2MB (40% of 5MB quota)
```

---

## Storage Architecture

### Key Naming Convention

All storage keys follow predictable patterns:

```
Pattern 1: tictacstick_<module>_<type>_v<version>
Examples:
  - tictacstick_autosave_state_v1
  - tictacstick_presets_v1
  - tictacstick_saved_quotes_v1

Pattern 2: <module>-<type>
Examples:
  - invoice-database
  - invoice-settings
  - client-database
  - quote-history

Pattern 3: quote-engine-<feature>
Examples:
  - quote-engine-theme
  - quote-engine-custom-theme
  - quote-engine-custom-logo

Pattern 4: tictacstick-<feature>-<scope>
Examples:
  - tictacstick-debug-enabled
  - tictacstick-debug-enabled-modules
  - tictacstick_device_id
```

### Storage Module Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
│  (app.js, invoice.js, client-database.js, etc.)    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│             Storage Abstraction Layer                │
│              (storage.js, AppStorage)                │
│  - JSON serialization/deserialization               │
│  - Error handling                                    │
│  - Safe parsing with fallbacks                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           Optional Encryption Layer                  │
│         (security.js, SecureStorage)                │
│  - AES encryption (disabled by default)             │
│  - Backward compatibility                           │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Browser LocalStorage API                │
│     localStorage.setItem / getItem / removeItem     │
└─────────────────────────────────────────────────────┘
```

---

## Storage Keys Reference

### Primary Storage Keys (12 total)

#### 1. `tictacstick_autosave_state_v1`

**Purpose:** Current quote state (auto-saved every 600ms)
**Module:** `storage.js` (`AppStorage`)
**Size:** ~10-30KB per quote
**Persistence:** Permanent until cleared

**Contains:**
- Quote metadata (title, client, location, job type)
- Job settings (rates, fees, modifiers)
- Window line items array
- Pressure cleaning line items array
- Notes (internal and client-facing)
- Photos metadata (not photo data itself)

**Update Frequency:** Every 600ms after user input (debounced)

**Data Structure:** See [Quote State Object](#1-quote-state-object)

---

#### 2. `tictacstick_presets_v1`

**Purpose:** Saved job settings presets
**Module:** `storage.js` (`AppStorage`)
**Size:** ~5-10KB
**Persistence:** Permanent

**Contains:** Array of preset configurations

**Data Structure:**
```javascript
[
  {
    name: "Residential Standard",
    baseFee: 120,
    hourlyRate: 95,
    minimumJob: 180,
    highReachModifierPercent: 60,
    insideMultiplier: 1.0,
    outsideMultiplier: 1.0,
    pressureHourlyRate: 120,
    setupBufferMinutes: 15,
    createdAt: 1700000000000
  },
  {
    name: "Commercial High Rise",
    baseFee: 200,
    hourlyRate: 120,
    minimumJob: 400,
    highReachModifierPercent: 80,
    // ... more settings
  }
]
```

---

#### 3. `tictacstick_saved_quotes_v1`

**Purpose:** Saved quote templates for reuse
**Module:** `storage.js` (`AppStorage`)
**Size:** ~50-200KB (depending on number of saved quotes)
**Persistence:** Permanent

**Contains:** Array of complete quote objects

**Data Structure:** Array of [Quote State Objects](#1-quote-state-object) with additional metadata:

```javascript
[
  {
    // Full quote state (same as autosave)
    ...quoteState,

    // Additional metadata
    savedAt: 1700000000000,
    savedName: "3BR House - Standard Package",
    savedDescription: "Typical 3-bedroom house with driveway"
  }
]
```

---

#### 4. `invoice-database`

**Purpose:** All invoice records
**Module:** `invoice.js` (`InvoiceSystem`)
**Size:** ~3-5KB per invoice
**Encryption:** Optional (disabled by default)
**Persistence:** Permanent

**Contains:** Array of invoice objects

**Data Structure:** See [Invoice Object](#2-invoice-object)

---

#### 5. `invoice-settings`

**Purpose:** Invoice configuration and preferences
**Module:** `invoice.js` (`InvoiceSystem`)
**Size:** ~1KB
**Encryption:** Optional (disabled by default)
**Persistence:** Permanent

**Data Structure:**
```javascript
{
  nextInvoiceNumber: 1001,
  invoicePrefix: "INV-",
  paymentTermsDays: 7,

  // Bank details
  bankName: "Commonwealth Bank",
  accountName: "925 Pressure Glass",
  bsb: "123-456",
  accountNumber: "12345678",

  // Business details
  abn: "12 345 678 901",

  // Display preferences
  includeGST: true,

  // Timestamps
  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

---

#### 6. `client-database`

**Purpose:** Client contact records and history
**Module:** `client-database.js` (`ClientDatabase`)
**Size:** ~0.5KB per client
**Persistence:** Permanent

**Contains:** Array of client objects

**Data Structure:** See [Client Object](#3-client-object)

---

#### 7. `quote-history`

**Purpose:** Analytics data and quote history
**Module:** `analytics.js` (`QuoteAnalytics`)
**Size:** ~2KB per entry
**Max Entries:** 100 (enforced)
**Persistence:** Permanent (auto-pruned)

**Contains:** Array of quote snapshots for analytics

**Data Structure:** See [Analytics Entry Object](#4-analytics-entry-object)

---

#### 8. `quote-engine-theme`

**Purpose:** Theme preference (light/dark)
**Module:** `theme.js` (`Theme`)
**Size:** ~10 bytes
**Persistence:** Permanent

**Data Structure:**
```javascript
"light" | "dark"
```

---

#### 9. `quote-engine-custom-theme`

**Purpose:** Custom theme configuration
**Module:** `theme-customizer.js` (`ThemeCustomizer`)
**Size:** ~2KB
**Persistence:** Permanent

**Data Structure:**
```javascript
{
  name: "Ocean Blue",
  primaryColor: "#0ea5e9",
  secondaryColor: "#0284c7",
  accentColor: "#06b6d4",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  borderColor: "#cbd5e1",

  // Font customization
  fontFamily: "system-ui, sans-serif",
  fontSize: "16px",

  // Spacing
  borderRadius: "8px",

  // Custom CSS variables
  customVars: {
    "--custom-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },

  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

---

#### 10. `quote-engine-custom-logo`

**Purpose:** Custom company logo (base64 encoded)
**Module:** `theme-customizer.js` (`ThemeCustomizer`)
**Size:** ~10-50KB (depending on image)
**Persistence:** Permanent

**Data Structure:**
```javascript
{
  dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANS...",
  fileName: "925-pressure-glass-logo.png",
  mimeType: "image/png",
  size: 45678,
  uploadedAt: 1700000000000
}
```

**Size Limits:**
- Recommended max: 100KB
- Absolute max: 200KB (to preserve quota)

---

#### 11. `tictacstick-debug-enabled`

**Purpose:** Debug mode flag
**Module:** `debug.js` (`DEBUG_CONFIG`)
**Size:** ~10 bytes
**Persistence:** Permanent

**Data Structure:**
```javascript
"true" | "false"
```

---

#### 12. `tictacstick_device_id`

**Purpose:** Unique device identifier for analytics
**Module:** `migration/migration-uuid-utils.js`
**Size:** ~40 bytes
**Persistence:** Permanent

**Data Structure:**
```javascript
"uuid-v4-string-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
```

Example: `"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"`

---

### Secondary/Optional Storage Keys

#### `tictacstick-debug-enabled-modules`

**Purpose:** Per-module debug settings
**Module:** `debug.js`
**Size:** ~1KB

**Data Structure:**
```javascript
{
  "invoice": true,
  "analytics": false,
  "storage": true,
  // ... other modules
}
```

#### `lastBackupDate`

**Purpose:** Track when user last exported backup
**Module:** `import-export.js`
**Size:** ~20 bytes

**Data Structure:**
```javascript
"2025-11-18T14:30:00.000Z"  // ISO timestamp
```

---

## Data Structures

### 1. Quote State Object

**Key:** `tictacstick_autosave_state_v1`

Complete structure with all fields:

```javascript
{
  // Metadata
  quoteTitle: "Zoe Williams – Balcony Glass & External Doors",
  clientName: "Zoe Williams",
  clientLocation: "South Perth",
  jobType: "residential",  // "residential" | "commercial" | "pressure" | "mixed"

  // Job Settings
  baseFee: 120,                    // Base callout fee ($)
  hourlyRate: 95,                  // Window cleaning hourly rate ($/hr)
  minimumJob: 180,                 // Minimum job charge ($)
  highReachModifierPercent: 60,    // High reach premium (%)
  insideMultiplier: 1.0,           // Inside pane time multiplier
  outsideMultiplier: 1.0,          // Outside pane time multiplier
  pressureHourlyRate: 120,         // Pressure cleaning rate ($/hr)
  setupBufferMinutes: 15,          // Travel/setup buffer (minutes)

  // Window Line Items
  windowLines: [
    {
      id: "L1",                    // Unique line ID
      type: "standard",            // Window type (from data.js WINDOW_TYPES)
      quantity: 10,                // Number of windows
      insidePanes: 10,             // Panes to clean inside
      outsidePanes: 10,            // Panes to clean outside
      highReach: false,            // High reach required?
      notes: "Ground floor only",  // Line item notes

      // Calculated fields (stored for display)
      timeMinutes: 50,             // Total time estimate
      cost: 79.17,                 // Labour cost (ex GST)
      highReachCost: 0             // High reach premium
    },
    {
      id: "L2",
      type: "sliding",
      quantity: 4,
      insidePanes: 8,
      outsidePanes: 8,
      highReach: true,
      notes: "Second floor balcony",
      timeMinutes: 40,
      cost: 63.33,
      highReachCost: 38.00
    }
    // ... more window lines
  ],

  // Pressure Cleaning Line Items
  pressureLines: [
    {
      id: "P1",                    // Unique line ID
      surface: "concrete",         // Surface type (from data.js SURFACE_TYPES)
      area: 50,                    // Area in square meters
      unit: "sqm",                 // Unit of measurement
      condition: "standard",       // "light" | "standard" | "heavy"
      notes: "Driveway",           // Line item notes

      // Calculated fields
      timeMinutes: 30,             // Time estimate
      cost: 60.00                  // Labour cost (ex GST)
    },
    {
      id: "P2",
      surface: "pavers",
      area: 25,
      unit: "sqm",
      condition: "heavy",
      notes: "Patio - moss removal",
      timeMinutes: 25,
      cost: 50.00
    }
    // ... more pressure lines
  ],

  // Notes
  internalNotes: "Ladder access via side gate. Customer prefers morning appointments.",
  clientNotes: "Quote valid for 14 days. Excludes flyscreen removal.",

  // Photos (metadata only - actual images stored as data URLs in array)
  photos: [
    {
      id: "photo_1700000000000",
      dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  // Base64 image data
      fileName: "balcony-view.jpg",
      mimeType: "image/jpeg",
      size: 124567,                    // Bytes (after compression)
      timestamp: 1700000000000,
      caption: "Balcony glass panels"
    },
    {
      id: "photo_1700000001000",
      dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      fileName: "driveway.jpg",
      mimeType: "image/jpeg",
      size: 98432,
      timestamp: 1700000001000,
      caption: "Driveway concrete"
    }
  ],

  // Timestamps (optional - added by some functions)
  createdAt: 1700000000000,        // Unix timestamp
  updatedAt: 1700000001000,        // Unix timestamp

  // Version (for future migrations)
  version: "1.9.0"
}
```

**Field Constraints:**

| Field | Type | Min | Max | Default |
|-------|------|-----|-----|---------|
| `baseFee` | number | 0 | 10000 | 120 |
| `hourlyRate` | number | 0 | 500 | 95 |
| `minimumJob` | number | 0 | 10000 | 180 |
| `highReachModifierPercent` | number | 0 | 200 | 60 |
| `insideMultiplier` | number | 0.1 | 5.0 | 1.0 |
| `outsideMultiplier` | number | 0.1 | 5.0 | 1.0 |
| `pressureHourlyRate` | number | 0 | 500 | 120 |
| `setupBufferMinutes` | number | 0 | 120 | 15 |

---

### 2. Invoice Object

**Key:** `invoice-database` (array element)

```javascript
{
  // Identification
  id: "invoice_1700000000000_abc123",     // Unique ID
  invoiceNumber: "INV-1001",              // Display number

  // References
  quoteId: null,                          // Optional quote reference
  clientId: "client_1699000000000_xyz",   // Client reference

  // Client Details (denormalized for display)
  clientName: "Zoe Williams",
  clientEmail: "zoe@example.com",
  clientPhone: "0412345678",
  clientAddress: "123 Main St, South Perth WA 6151",

  // Status
  status: "sent",  // "draft" | "sent" | "paid" | "overdue" | "cancelled"

  // Dates
  date: "2025-11-18",                     // Invoice date (YYYY-MM-DD)
  dueDate: "2025-11-25",                  // Payment due date
  issuedAt: 1700000000000,                // Unix timestamp
  sentAt: 1700000001000,                  // When sent to client
  paidAt: null,                           // When marked paid

  // Financial
  lineItems: [
    {
      id: "line_1",
      description: "Window Cleaning - Ground Floor (10 standard windows)",
      quantity: 10,
      unit: "windows",
      unitPrice: 7.92,                    // Ex GST
      subtotal: 79.20,                    // Ex GST
      gst: 7.92,
      total: 87.12                        // Inc GST
    },
    {
      id: "line_2",
      description: "Pressure Cleaning - Driveway (50 sqm concrete)",
      quantity: 50,
      unit: "sqm",
      unitPrice: 1.20,
      subtotal: 60.00,
      gst: 6.00,
      total: 66.00
    }
  ],

  subtotal: 139.20,                       // Total ex GST
  gst: 13.92,                             // GST amount (10%)
  total: 153.12,                          // Total inc GST

  // Payment Details
  payments: [
    {
      id: "payment_1700000002000",
      date: "2025-11-20",
      amount: 153.12,
      method: "bank_transfer",            // "bank_transfer" | "cash" | "card" | "other"
      reference: "Transfer 20/11/2025",
      notes: "Full payment received",
      recordedAt: 1700000002000
    }
  ],

  amountPaid: 153.12,
  amountDue: 0,

  // Bank Details (from settings at time of creation)
  bankDetails: {
    bankName: "Commonwealth Bank",
    accountName: "925 Pressure Glass",
    bsb: "123-456",
    accountNumber: "12345678",
    abn: "12 345 678 901"
  },

  // Terms & Notes
  paymentTerms: "Payment due within 7 days of invoice date",
  notes: "Thank you for your business!",
  internalNotes: "Customer requested morning service",

  // Metadata
  createdBy: "Gerard Varone",             // Optional
  createdAt: 1700000000000,
  updatedAt: 1700000002000,
  version: "1.9.0"
}
```

**Status State Machine:**

```
draft → sent → paid
  ↓      ↓
cancelled  overdue
```

**Status Definitions:**

| Status | Description | Can Edit? | Can Delete? |
|--------|-------------|-----------|-------------|
| `draft` | Not yet sent | ✅ Yes | ✅ Yes |
| `sent` | Sent to client | ✅ Yes | ⚠️ With confirmation |
| `paid` | Payment received | ❌ No | ❌ No |
| `overdue` | Past due date | ✅ Yes | ⚠️ With confirmation |
| `cancelled` | Cancelled | ❌ No | ⚠️ Archive only |

---

### 3. Client Object

**Key:** `client-database` (array element)

```javascript
{
  // Identification
  id: "client_1700000000000_xyz789",      // Unique ID

  // Contact Information
  name: "Zoe Williams",                   // Full name (required)
  email: "zoe@example.com",               // Email address
  phone: "0412345678",                    // Phone number

  // Address
  address: "123 Main Street",             // Street address
  location: "South Perth WA 6151",        // Suburb/area

  // Additional Details
  notes: "Prefers morning appointments. Side gate access for ladder.",

  // Metadata
  createdAt: 1700000000000,               // Unix timestamp
  updatedAt: 1700000001000,               // Unix timestamp

  // Statistics (not stored, calculated on demand)
  // quoteCount: 5,
  // totalRevenue: 876.50,
  // lastQuoteDate: "2025-11-18"
}
```

**Client-Invoice Relationship:**

Clients are **referenced** by invoices via `clientId`, but the relationship is **not strictly enforced**. An invoice can exist without a matching client record (for one-off customers).

**Client Search Fields:**
- `name` (primary)
- `email`
- `phone`
- `location`
- `notes`

---

### 4. Analytics Entry Object

**Key:** `quote-history` (array element)

```javascript
{
  // Identification
  id: "quote_1700000000000",
  timestamp: 1700000000000,               // Unix timestamp
  date: "2025-11-18T14:30:00.000Z",      // ISO format

  // Quote Metadata
  quoteTitle: "3BR House - Full Service",
  clientName: "John Smith",
  clientLocation: "Nedlands",
  jobType: "mixed",                       // Service type

  // Financial Summary
  total: 450.00,                          // Total inc GST
  subtotal: 409.09,                       // Total ex GST
  gst: 40.91,                             // GST component

  // Time Summary
  timeEstimate: 3.5,                      // Hours

  // Line Item Counts
  windowLineCount: 3,
  pressureLineCount: 2,

  // Analytics Tracking
  status: "draft",                        // Quote status
  statusHistory: [
    {
      status: "draft",
      date: "2025-11-18T14:30:00.000Z"
    },
    {
      status: "sent",
      date: "2025-11-18T15:00:00.000Z"
    },
    {
      status: "accepted",
      date: "2025-11-19T09:15:00.000Z"
    }
  ],

  // Service Breakdown
  serviceTypes: ["window-cleaning", "pressure-washing"],
  primaryService: "window-cleaning",

  // Revenue Attribution
  windowRevenue: 280.00,                  // Window cleaning portion
  pressureRevenue: 170.00,                // Pressure cleaning portion

  // Performance Metrics
  conversionRate: null,                   // % of sent quotes that convert (calculated)
  averageJobValue: null,                  // Average quote value (calculated)

  // Metadata
  savedAt: 1700000000000,
  version: "1.9.0"
}
```

**Analytics Calculations:**

```javascript
// Example: Calculate conversion rate
var sentQuotes = history.filter(q => q.status === 'sent');
var acceptedQuotes = history.filter(q => q.status === 'accepted');
var conversionRate = (acceptedQuotes.length / sentQuotes.length) * 100;

// Example: Calculate average job value
var totalRevenue = history.reduce((sum, q) => sum + q.total, 0);
var averageJobValue = totalRevenue / history.length;
```

**History Pruning:**

When `quote-history` exceeds 100 entries, oldest entries are removed:

```javascript
if (history.length > MAX_HISTORY) {
  history = history.slice(-MAX_HISTORY); // Keep last 100
}
```

---

## Storage Patterns

### 1. JSON Serialization Pattern

All data is stored as JSON strings:

```javascript
// SAVE
function saveData(key, data) {
  try {
    var json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

// LOAD
function loadData(key, fallback) {
  try {
    var json = localStorage.getItem(key);
    if (!json) return fallback;
    return JSON.parse(json);
  } catch (e) {
    console.error('Load failed:', e);
    return fallback;
  }
}
```

### 2. Safe Parse Pattern

All JSON parsing uses safe fallbacks:

```javascript
// From storage.js
function safeParse(json, fallback) {
  try {
    var val = JSON.parse(json);
    return val == null ? fallback : val;
  } catch (e) {
    return fallback;
  }
}

// Usage
var quotes = safeParse(localStorage.getItem('saved-quotes'), []);
```

### 3. Auto-Save with Debounce

State changes trigger debounced auto-save:

```javascript
// From app.js
var autosaveTimer = null;
var AUTOSAVE_DELAY_MS = 600;  // 600ms debounce

function scheduleAutosave(force) {
  if (!autosaveEnabled && !force) return;

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(autosave, AUTOSAVE_DELAY_MS);
}

// Triggered on any input change
input.addEventListener('input', function() {
  scheduleAutosave();
});
```

**Debounce Benefits:**
- Reduces write frequency (improves performance)
- Prevents partial saves during rapid typing
- Balances responsiveness with efficiency

### 4. Quota Error Handling

All storage operations catch `QuotaExceededError`:

```javascript
// From storage.js
function saveState(state) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[STORAGE] Failed to save state:', e);

    if (e.name === 'QuotaExceededError') {
      if (window.showToast) {
        window.showToast('Storage full! Please export and delete old data.', 'error');
      }
    }
  }
}
```

**Quota Error Recovery:**
1. Show user-facing error message
2. Suggest exporting data
3. Suggest deleting old quotes/invoices
4. Prevent data loss (don't overwrite existing data)

### 5. Optional Encryption Pattern

Invoice data supports optional encryption (disabled by default):

```javascript
// From invoice.js
var ENABLE_ENCRYPTION = false;  // Toggle encryption

// Save with optional encryption
function saveInvoices() {
  try {
    if (ENABLE_ENCRYPTION && window.Security && window.Security.SecureStorage) {
      window.Security.SecureStorage.setItem(INVOICES_KEY, invoices);
    } else {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    }
    return true;
  } catch (e) {
    console.error('Failed to save invoices:', e);
    return false;
  }
}

// Load with backward compatibility
function loadInvoices() {
  if (ENABLE_ENCRYPTION && window.Security && window.Security.SecureStorage) {
    invoices = window.Security.SecureStorage.getItem(INVOICES_KEY, null);

    // Migrate from unencrypted if needed
    if (invoices === null) {
      var unencrypted = localStorage.getItem(INVOICES_KEY);
      if (unencrypted) {
        invoices = JSON.parse(unencrypted);
        window.Security.SecureStorage.setItem(INVOICES_KEY, invoices);
        console.log('Migrated to encrypted storage');
      }
    }
  } else {
    invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  }
  return invoices;
}
```

### 6. Array Limit Enforcement

Analytics history enforces 100-entry limit:

```javascript
// From analytics.js
var MAX_HISTORY = 100;

function saveQuoteToHistory() {
  var history = loadHistory();

  // Add new entry
  history.push(newEntry);

  // Enforce limit
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);  // Keep last 100
  }

  // Save
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
```

---

## Quota Management

### Storage Size Calculation

```javascript
// From error-handler.js
function getStorageUsage() {
  var used = 0;
  var quota = 5 * 1024 * 1024; // 5MB estimate

  for (var key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      // Count key length + value length (UTF-16, so 2 bytes per char)
      used += (localStorage[key].length + key.length) * 2;
    }
  }

  return {
    used: used,
    quota: quota,
    available: quota - used,
    percentUsed: (used / quota) * 100
  };
}
```

### Quota Monitoring

Display storage usage to user:

```javascript
var usage = getStorageUsage();

console.log('Storage Usage:');
console.log('  Used: ' + (usage.used / 1024).toFixed(2) + ' KB');
console.log('  Available: ' + (usage.available / 1024).toFixed(2) + ' KB');
console.log('  Percent: ' + usage.percentUsed.toFixed(1) + '%');

if (usage.percentUsed > 80) {
  showToast('Storage almost full! Consider exporting and clearing old data.', 'warning');
}
```

### Data Cleanup Strategies

**1. Manual Export & Delete**

Users export data via CSV/JSON, then manually delete old quotes/invoices.

**2. Automatic Pruning (Future)**

```javascript
// Future: Auto-delete quotes older than 1 year
function pruneOldQuotes() {
  var oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
  var quotes = loadSavedQuotes();

  var recentQuotes = quotes.filter(function(q) {
    return q.createdAt > oneYearAgo;
  });

  if (recentQuotes.length < quotes.length) {
    saveSavedQuotes(recentQuotes);
    var deleted = quotes.length - recentQuotes.length;
    showToast('Deleted ' + deleted + ' old quotes to free space', 'info');
  }
}
```

**3. Photo Compression**

Photos are automatically compressed before storage:

```javascript
// From image-compression.js
function compressPhoto(dataUrl, maxSizeKB) {
  // Compress image to target size
  // Returns compressed data URL
}
```

**Photo Storage Guidelines:**
- Max recommended photo size: 200KB per photo
- Max photos per quote: 10
- Total photo quota budget: ~2MB

---

## Data Migration

### Version Tracking

Store version with data for future migrations:

```javascript
{
  version: "1.9.0",
  // ... data
}
```

### Migration Strategy

**Future migrations will follow this pattern:**

```javascript
// Example: Migrate from v1.8 to v1.9
function migrateQuoteState(state) {
  if (!state.version || state.version < "1.9.0") {
    // Add new field with default value
    state.newField = defaultValue;

    // Transform existing field
    state.renamedField = state.oldField;
    delete state.oldField;

    // Update version
    state.version = "1.9.0";
  }
  return state;
}

// Apply on load
function loadState() {
  var state = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
  state = migrateQuoteState(state);  // Migrate if needed
  return state;
}
```

### Backward Compatibility

**Principle:** Never break existing data. Always support old formats.

```javascript
// Example: Support old and new field names
var clientName = state.clientName || state.customer_name || '';
```

### Data Export for Migration

Export all LocalStorage data for cloud migration:

```javascript
function exportAllData() {
  var allData = {};

  for (var key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      allData[key] = localStorage.getItem(key);
    }
  }

  var blob = new Blob([JSON.stringify(allData, null, 2)], {
    type: 'application/json'
  });

  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'tictacstick-data-export-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Security Considerations

### 1. No Sensitive Data in LocalStorage

**NEVER store:**
- Passwords
- Credit card numbers
- API keys/tokens
- Personally identifiable information (PII) beyond business necessity

**Current storage:**
- Client contact info (name, email, phone) - **acceptable for business CRM**
- Bank details (BSB, account number) - **public info, acceptable**
- Invoice/quote data - **acceptable for business records**

### 2. Optional Encryption

Invoice data supports AES encryption (disabled by default):

```javascript
// security.js - SecureStorage module
var SecureStorage = {
  setKey: function(key) {
    this.encryptionKey = key;
  },

  setItem: function(key, value) {
    var json = JSON.stringify(value);
    var encrypted = this.encrypt(json, this.encryptionKey);
    localStorage.setItem(key, encrypted);
  },

  getItem: function(key, fallback) {
    var encrypted = localStorage.getItem(key);
    if (!encrypted) return fallback;
    var json = this.decrypt(encrypted, this.encryptionKey);
    return JSON.parse(json);
  }
};
```

**Encryption Status:**
- **Disabled by default** for backward compatibility
- Enable by setting `ENABLE_ENCRYPTION = true` in `invoice.js`
- Uses symmetric AES encryption
- Key hardcoded (not user-configurable yet)

### 3. XSS Prevention

All user input is sanitized before display:

```javascript
// From security.js
window.Security.escapeHTML = function(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Usage
element.textContent = userInput;  // Safe (uses textContent)
element.innerHTML = Security.escapeHTML(userInput);  // Safe (escaped)
```

### 4. LocalStorage Isolation

LocalStorage is **origin-based** (protocol + domain + port):

```
https://quote-engine.example.com:443  ← Separate storage
https://quote-engine.example.com:8080 ← Separate storage
http://quote-engine.example.com       ← Separate storage
```

Data is **never shared** across origins.

### 5. No Client-Side Validation Bypass

All validation is **duplicated** on server (future cloud version):

```javascript
// Client-side validation (current)
if (!invoiceData.clientName) {
  showError('Client name required');
  return false;
}

// Server-side validation (future)
// MUST re-validate all fields server-side
// Never trust client data
```

---

## Testing & Validation

### Storage Test Suite

Test file: `tests/storage.spec.js`

**Key tests:**

1. **Save/Load Quote State**
```javascript
test('should save and load quote state', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Fill in quote data
  await page.fill('#quoteTitleInput', 'Test Quote');
  await page.fill('#clientNameInput', 'John Smith');

  // Wait for autosave
  await page.waitForTimeout(1000);

  // Reload page
  await page.reload();

  // Verify data persisted
  const title = await page.inputValue('#quoteTitleInput');
  const client = await page.inputValue('#clientNameInput');

  expect(title).toBe('Test Quote');
  expect(client).toBe('John Smith');
});
```

2. **Quota Exceeded Handling**
```javascript
test('should handle quota exceeded gracefully', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Fill storage to quota
  await page.evaluate(() => {
    var largeData = new Array(6 * 1024 * 1024).join('x');  // 6MB
    try {
      localStorage.setItem('test-large', largeData);
    } catch (e) {
      // Expected to fail
    }
  });

  // Verify error shown
  const toast = await page.textContent('.toast-error');
  expect(toast).toContain('Storage full');
});
```

3. **Data Migration**
```javascript
test('should migrate old data format', async ({ page }) => {
  // Set old format data
  await page.evaluate(() => {
    localStorage.setItem('tictacstick_autosave_state_v1', JSON.stringify({
      customer_name: 'Old Format',  // Old field name
      version: '1.0.0'
    }));
  });

  await page.goto('http://localhost:8080');

  // Verify migrated
  const state = await page.evaluate(() => {
    return window.APP.getState();
  });

  expect(state.clientName).toBe('Old Format');  // New field name
  expect(state.version).toBe('1.9.0');
});
```

### Manual Storage Inspection

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Local Storage" in sidebar
4. View all keys/values

**Export all data (console command):**
```javascript
// Copy all LocalStorage data to clipboard
copy(JSON.stringify(localStorage, null, 2));
```

### Storage Validation Rules

**Invoice validation:**

```javascript
// From validation.js
function validateInvoice(invoice) {
  var errors = [];

  // Required fields
  if (!invoice.clientName || invoice.clientName.trim() === '') {
    errors.push('Client name is required');
  }

  // Numeric validation
  if (invoice.total <= 0) {
    errors.push('Total must be greater than zero');
  }

  // GST validation (must be exactly 10% of subtotal)
  var expectedGst = Math.round(invoice.subtotal * 0.1 * 100) / 100;
  if (Math.abs(invoice.gst - expectedGst) > 0.01) {
    errors.push('GST must equal 10% of subtotal');
  }

  // Date validation
  var dueDate = new Date(invoice.dueDate);
  var issueDate = new Date(invoice.date);
  if (dueDate <= issueDate) {
    errors.push('Due date must be after issue date');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

---

## Cloud Migration Mapping

### LocalStorage → Cloud Database Schema

**Table 1: `quotes`**

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Metadata
  quote_title TEXT NOT NULL,
  client_name TEXT,
  client_location TEXT,
  job_type TEXT,

  -- Job Settings
  base_fee NUMERIC(10, 2) DEFAULT 120.00,
  hourly_rate NUMERIC(10, 2) DEFAULT 95.00,
  minimum_job NUMERIC(10, 2) DEFAULT 180.00,
  high_reach_modifier_percent NUMERIC(5, 2) DEFAULT 60.00,
  inside_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  outside_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  pressure_hourly_rate NUMERIC(10, 2) DEFAULT 120.00,
  setup_buffer_minutes INTEGER DEFAULT 15,

  -- Line Items (JSONB for flexibility)
  window_lines JSONB DEFAULT '[]',
  pressure_lines JSONB DEFAULT '[]',

  -- Notes
  internal_notes TEXT,
  client_notes TEXT,

  -- Photos (array of URLs - stored in S3/R2)
  photo_urls TEXT[],

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Version
  version TEXT DEFAULT '1.9.0'
);
```

**Table 2: `invoices`**

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Identification
  invoice_number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id),

  -- Client Details (denormalized)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  -- Dates
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,

  -- Financial (all amounts in cents to avoid floating point errors)
  subtotal_cents INTEGER NOT NULL,
  gst_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER DEFAULT 0,
  amount_due_cents INTEGER GENERATED ALWAYS AS (total_cents - amount_paid_cents) STORED,

  -- Line Items (JSONB)
  line_items JSONB NOT NULL,

  -- Bank Details (JSONB)
  bank_details JSONB,

  -- Terms & Notes
  payment_terms TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version TEXT DEFAULT '1.9.0'
);
```

**Table 3: `clients`**

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Contact
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Address
  address TEXT,
  location TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table 4: `analytics_snapshots`**

```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  quote_id UUID REFERENCES quotes(id),

  -- Snapshot data (JSONB for flexibility)
  data JSONB NOT NULL,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration Script Template

```javascript
// migrate-localstorage-to-cloud.js

async function migrateAllData() {
  // 1. Export all LocalStorage data
  var localStorage Data = exportAllData();

  // 2. Parse and transform
  var quotes = JSON.parse(localStorageData['tictacstick_saved_quotes_v1'] || '[]');
  var invoices = JSON.parse(localStorageData['invoice-database'] || '[]');
  var clients = JSON.parse(localStorageData['client-database'] || '[]');
  var analytics = JSON.parse(localStorageData['quote-history'] || '[]');

  // 3. Upload to cloud API
  for (var i = 0; i < quotes.length; i++) {
    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformQuote(quotes[i]))
    });
  }

  for (var i = 0; i < invoices.length; i++) {
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformInvoice(invoices[i]))
    });
  }

  // ... repeat for clients and analytics

  console.log('Migration complete!');
}

function transformQuote(localQuote) {
  return {
    quote_title: localQuote.quoteTitle,
    client_name: localQuote.clientName,
    client_location: localQuote.clientLocation,
    job_type: localQuote.jobType,
    base_fee: localQuote.baseFee,
    hourly_rate: localQuote.hourlyRate,
    minimum_job: localQuote.minimumJob,
    high_reach_modifier_percent: localQuote.highReachModifierPercent,
    inside_multiplier: localQuote.insideMultiplier,
    outside_multiplier: localQuote.outsideMultiplier,
    pressure_hourly_rate: localQuote.pressureHourlyRate,
    setup_buffer_minutes: localQuote.setupBufferMinutes,
    window_lines: localQuote.windowLines,
    pressure_lines: localQuote.pressureLines,
    internal_notes: localQuote.internalNotes,
    client_notes: localQuote.clientNotes,
    created_at: new Date(localQuote.createdAt).toISOString(),
    updated_at: new Date(localQuote.updatedAt).toISOString(),
    version: localQuote.version
  };
}
```

---

## Appendix

### Storage Key Quick Reference

| Key | Module | Size | Purpose |
|-----|--------|------|---------|
| `tictacstick_autosave_state_v1` | storage.js | ~20KB | Current quote auto-save |
| `tictacstick_presets_v1` | storage.js | ~5KB | Job settings presets |
| `tictacstick_saved_quotes_v1` | storage.js | ~100KB | Saved quote templates |
| `invoice-database` | invoice.js | ~150KB | Invoice records |
| `invoice-settings` | invoice.js | ~1KB | Invoice configuration |
| `client-database` | client-database.js | ~50KB | Client contact records |
| `quote-history` | analytics.js | ~200KB | Analytics data (100 entries) |
| `quote-engine-theme` | theme.js | ~10B | Theme preference |
| `quote-engine-custom-theme` | theme-customizer.js | ~2KB | Custom theme config |
| `quote-engine-custom-logo` | theme-customizer.js | ~50KB | Company logo |
| `tictacstick-debug-enabled` | debug.js | ~10B | Debug mode flag |
| `tictacstick_device_id` | migration utils | ~40B | Device identifier |

**Total Typical Usage:** ~550KB (11% of 5MB quota)

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-18 | Initial LocalStorage schema documentation |

---

---

## Backup & Restore

### Backup Strategy

```javascript
/**
 * Complete backup system
 */
APP.Storage.Backup = (function() {
    return {
        /**
         * Create full backup of all data
         */
        createFullBackup: function() {
            var backup = {
                version: APP.VERSION,
                timestamp: new Date().toISOString(),
                type: 'full',
                data: {}
            };

            // Get all TicTacStick keys
            var keys = APP.Storage.getKeys();

            keys.forEach(function(key) {
                backup.data[key] = APP.Storage.load(key);
            });

            // Add metadata
            backup.metadata = {
                totalKeys: keys.length,
                totalSize: APP.Storage.QuotaMonitor.getTotalSize(),
                breakdown: APP.Storage.QuotaMonitor.getBreakdown(),
                quotesCount: (backup.data.tts_quotes || []).length,
                clientsCount: (backup.data.tts_clients || []).length,
                invoicesCount: (backup.data.tts_invoices || []).length
            };

            return backup;
        },

        /**
         * Create incremental backup (only changed data)
         */
        createIncrementalBackup: function(since) {
            var backup = {
                version: APP.VERSION,
                timestamp: new Date().toISOString(),
                type: 'incremental',
                since: since,
                data: {}
            };

            // Get quotes modified since timestamp
            var quotes = APP.Storage.load('tts_quotes') || [];
            backup.data.tts_quotes = quotes.filter(function(q) {
                return new Date(q.updatedAt) > new Date(since);
            });

            // Get clients modified since timestamp
            var clients = APP.Storage.load('tts_clients') || [];
            backup.data.tts_clients = clients.filter(function(c) {
                return new Date(c.updatedAt) > new Date(since);
            });

            // Get invoices modified since timestamp
            var invoices = APP.Storage.load('tts_invoices') || [];
            backup.data.tts_invoices = invoices.filter(function(i) {
                return new Date(i.updatedAt) > new Date(since);
            });

            return backup;
        },

        /**
         * Export backup to JSON file
         */
        exportBackup: function(backup) {
            var json = JSON.stringify(backup, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var filename = 'tictacstick-backup-' +
                           new Date().toISOString().split('T')[0] +
                           '.json';

            return {
                blob: blob,
                filename: filename,
                size: blob.size
            };
        },

        /**
         * Download backup file
         */
        downloadBackup: function(backup) {
            var exported = this.exportBackup(backup);

            // Create download link
            var url = URL.createObjectURL(exported.blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = exported.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return exported.filename;
        },

        /**
         * Compress backup using simple compression
         */
        compressBackup: function(backup) {
            // Simple compression: remove whitespace from JSON
            var json = JSON.stringify(backup);

            // Additional compression could be added here
            // (e.g., LZString if library available)

            return {
                compressed: json,
                originalSize: JSON.stringify(backup, null, 2).length,
                compressedSize: json.length,
                ratio: (json.length / JSON.stringify(backup, null, 2).length).toFixed(2)
            };
        },

        /**
         * Restore from backup
         */
        restoreFromBackup: function(backupData, options) {
            options = options || {
                merge: false,      // Merge with existing or replace?
                skipValidation: false,
                dryRun: false
            };

            var results = {
                success: false,
                restored: {},
                errors: [],
                warnings: []
            };

            try {
                // Parse if string
                var backup = typeof backupData === 'string' ?
                            JSON.parse(backupData) : backupData;

                // Validate backup structure
                if (!backup.version || !backup.data) {
                    throw new Error('Invalid backup format');
                }

                // Check version compatibility
                if (backup.version !== APP.VERSION) {
                    results.warnings.push('Backup version mismatch: ' +
                                         backup.version + ' vs ' + APP.VERSION);
                }

                // Restore each key
                for (var key in backup.data) {
                    if (backup.data.hasOwnProperty(key)) {
                        try {
                            var data = backup.data[key];

                            // Validate data if not skipped
                            if (!options.skipValidation) {
                                if (key === 'tts_quotes') {
                                    data.forEach(function(quote) {
                                        var validation = APP.Storage.validateQuote(quote);
                                        if (!validation.valid) {
                                            results.warnings.push('Invalid quote: ' + quote.id);
                                        }
                                    });
                                }
                            }

                            // Merge or replace
                            if (options.merge && Array.isArray(data)) {
                                var existing = APP.Storage.load(key) || [];
                                data = APP.Storage.mergeArrays(existing, data, 'id');
                            }

                            // Dry run: don't actually save
                            if (!options.dryRun) {
                                APP.Storage.save(key, data);
                            }

                            results.restored[key] = data.length || 1;

                        } catch (e) {
                            results.errors.push('Failed to restore ' + key + ': ' + e.message);
                        }
                    }
                }

                results.success = results.errors.length === 0;

            } catch (e) {
                results.errors.push('Backup restore failed: ' + e.message);
            }

            return results;
        },

        /**
         * Schedule automatic backups
         */
        scheduleAutoBackup: function(frequency) {
            // frequency: daily, weekly, monthly
            var settings = APP.Storage.load('tts_settings') || {};

            settings.backup = {
                enabled: true,
                frequency: frequency,
                lastBackup: new Date().toISOString()
            };

            APP.Storage.save('tts_settings', settings);

            // Set up interval
            var interval;
            switch(frequency) {
                case 'daily':
                    interval = 24 * 60 * 60 * 1000; // 24 hours
                    break;
                case 'weekly':
                    interval = 7 * 24 * 60 * 60 * 1000; // 7 days
                    break;
                case 'monthly':
                    interval = 30 * 24 * 60 * 60 * 1000; // 30 days
                    break;
                default:
                    interval = 7 * 24 * 60 * 60 * 1000; // Default weekly
            }

            setInterval(function() {
                var backup = APP.Storage.Backup.createFullBackup();
                APP.Storage.Backup.downloadBackup(backup);
            }, interval);
        }
    };
})();
```

### Backup File Format

```javascript
/**
 * Standard backup file structure
 */
var BackupFileFormat = {
    // Metadata
    version: '1.7.0',                   // App version
    timestamp: '2025-11-18T14:30:00.000Z', // Backup creation time
    type: 'full',                       // full|incremental
    since: null,                        // For incremental backups

    // Data
    data: {
        tts_quotes: [],                 // All quotes
        tts_clients: [],                // All clients
        tts_invoices: [],               // All invoices
        tts_settings: {},               // Settings
        tts_pricing_config: {},         // Pricing config
        tts_app_state: {},              // App state
        // ... other keys
    },

    // Metadata about backup
    metadata: {
        totalKeys: 10,
        totalSize: 1234567,             // Bytes
        breakdown: {                     // Size breakdown
            quotes: 500000,
            clients: 200000,
            invoices: 300000,
            other: 234567
        },
        quotesCount: 89,
        clientsCount: 45,
        invoicesCount: 67
    },

    // Checksum for integrity
    checksum: 'abc123def456'
};
```

### Cloud Backup (Future Feature)

```javascript
/**
 * Cloud backup integration (placeholder for future implementation)
 */
APP.Storage.CloudBackup = (function() {
    return {
        /**
         * Upload backup to cloud storage
         */
        uploadToCloud: function(backup, provider) {
            // Future implementation
            // Providers: google_drive, dropbox, s3, supabase
            console.log('Cloud backup not yet implemented');

            return {
                success: false,
                message: 'Cloud backup coming in future version',
                provider: provider
            };
        },

        /**
         * Download backup from cloud
         */
        downloadFromCloud: function(backupId, provider) {
            // Future implementation
            console.log('Cloud restore not yet implemented');

            return null;
        },

        /**
         * List available cloud backups
         */
        listCloudBackups: function(provider) {
            // Future implementation
            return [];
        }
    };
})();
```

---

## Performance Optimization

### Lazy Loading

```javascript
/**
 * Lazy load large datasets
 */
APP.Storage.LazyLoader = (function() {
    var cache = {};

    return {
        /**
         * Load data with caching
         */
        load: function(key, force) {
            // Return from cache if available
            if (!force && cache[key]) {
                return cache[key];
            }

            // Load from storage
            var data = APP.Storage.load(key);

            // Cache for future use
            cache[key] = data;

            return data;
        },

        /**
         * Load specific item from array by ID
         */
        loadItem: function(key, id) {
            var data = this.load(key);

            if (!Array.isArray(data)) {
                return null;
            }

            return data.find(function(item) {
                return item.id === id;
            });
        },

        /**
         * Load paginated data
         */
        loadPage: function(key, page, pageSize) {
            var data = this.load(key);

            if (!Array.isArray(data)) {
                return [];
            }

            var start = (page - 1) * pageSize;
            var end = start + pageSize;

            return data.slice(start, end);
        },

        /**
         * Clear cache
         */
        clearCache: function(key) {
            if (key) {
                delete cache[key];
            } else {
                cache = {};
            }
        },

        /**
         * Preload data in background
         */
        preload: function(keys) {
            keys.forEach(function(key) {
                setTimeout(function() {
                    APP.Storage.LazyLoader.load(key);
                }, 0);
            });
        }
    };
})();
```

### Indexing

```javascript
/**
 * Create indexes for faster lookups
 */
APP.Storage.Index = (function() {
    var indexes = {};

    return {
        /**
         * Create index on field
         */
        createIndex: function(key, field) {
            var data = APP.Storage.load(key);

            if (!Array.isArray(data)) {
                return;
            }

            var indexKey = key + '_' + field;
            indexes[indexKey] = {};

            data.forEach(function(item, index) {
                var value = item[field];
                if (value !== undefined) {
                    if (!indexes[indexKey][value]) {
                        indexes[indexKey][value] = [];
                    }
                    indexes[indexKey][value].push(index);
                }
            });
        },

        /**
         * Lookup by indexed field
         */
        lookup: function(key, field, value) {
            var indexKey = key + '_' + field;

            if (!indexes[indexKey]) {
                this.createIndex(key, field);
            }

            var indices = indexes[indexKey][value] || [];
            var data = APP.Storage.load(key);

            return indices.map(function(i) {
                return data[i];
            });
        },

        /**
         * Rebuild all indexes
         */
        rebuildIndexes: function() {
            // Rebuild quote indexes
            this.createIndex('tts_quotes', 'status');
            this.createIndex('tts_quotes', 'clientId');
            this.createIndex('tts_quotes', 'serviceType');

            // Rebuild client indexes
            this.createIndex('tts_clients', 'status');
            this.createIndex('tts_clients', 'propertyType');

            // Rebuild invoice indexes
            this.createIndex('tts_invoices', 'status');
            this.createIndex('tts_invoices', 'clientId');
        },

        /**
         * Clear indexes
         */
        clearIndexes: function() {
            indexes = {};
        }
    };
})();
```

### Debounced Saves

```javascript
/**
 * Debounce frequent saves to reduce I/O
 */
APP.Storage.DebouncedSave = (function() {
    var timeouts = {};
    var DEBOUNCE_DELAY = 1000; // 1 second

    return {
        /**
         * Queue a save operation
         */
        save: function(key, data, delay) {
            delay = delay || DEBOUNCE_DELAY;

            // Clear existing timeout
            if (timeouts[key]) {
                clearTimeout(timeouts[key]);
            }

            // Set new timeout
            timeouts[key] = setTimeout(function() {
                APP.Storage.save(key, data);
                delete timeouts[key];
            }, delay);
        },

        /**
         * Force immediate save (flush)
         */
        flush: function(key) {
            if (timeouts[key]) {
                clearTimeout(timeouts[key]);
                delete timeouts[key];
            }
            // Actual save happens in the timeout callback
        },

        /**
         * Flush all pending saves
         */
        flushAll: function() {
            for (var key in timeouts) {
                if (timeouts.hasOwnProperty(key)) {
                    this.flush(key);
                }
            }
        }
    };
})();
```

### Batch Operations

```javascript
/**
 * Batch multiple operations for better performance
 */
APP.Storage.Batch = (function() {
    return {
        /**
         * Save multiple keys at once
         */
        saveMultiple: function(operations) {
            var results = {
                success: [],
                failed: []
            };

            operations.forEach(function(op) {
                try {
                    APP.Storage.save(op.key, op.data);
                    results.success.push(op.key);
                } catch (e) {
                    results.failed.push({
                        key: op.key,
                        error: e.message
                    });
                }
            });

            return results;
        },

        /**
         * Load multiple keys at once
         */
        loadMultiple: function(keys) {
            var results = {};

            keys.forEach(function(key) {
                results[key] = APP.Storage.load(key);
            });

            return results;
        },

        /**
         * Delete multiple keys at once
         */
        deleteMultiple: function(keys) {
            var results = {
                success: [],
                failed: []
            };

            keys.forEach(function(key) {
                try {
                    APP.Storage.remove(key);
                    results.success.push(key);
                } catch (e) {
                    results.failed.push({
                        key: key,
                        error: e.message
                    });
                }
            });

            return results;
        },

        /**
         * Update multiple items in array
         */
        updateMultipleItems: function(key, updates) {
            var data = APP.Storage.load(key);

            if (!Array.isArray(data)) {
                return false;
            }

            updates.forEach(function(update) {
                var index = data.findIndex(function(item) {
                    return item.id === update.id;
                });

                if (index !== -1) {
                    data[index] = Object.assign({}, data[index], update.changes);
                }
            });

            return APP.Storage.save(key, data);
        }
    };
})();
```

---

**END OF ASSET #2: LocalStorage Schema Documentation (Parts 1 & 2 Complete)**
