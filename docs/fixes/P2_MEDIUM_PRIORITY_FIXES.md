# P2: Medium Priority - Future Improvements

**Priority:** P2 - Medium Priority
**Timeline:** After P0 and P1 complete (future roadmap)
**Status:** Planning
**Dependencies:** P0 and P1 must be complete first

---

## Overview

### Focus: Long-Term Architecture & Feature Enhancements

These items are classified as **P2 Medium Priority** because they:

1. **Are not blocking current production use** - App works fine without them
2. **Require significant development effort** - Weeks or months to implement
3. **Are strategic investments** - Improve maintainability, scalability, features
4. **Can be deferred** - Nice-to-have, not must-have

**These are improvements to consider as the business grows and the product matures.**

### Timeline: After P0 and P1 Complete

**Week 1:** P0 Critical Fixes
**Week 2:** P1 High Priority Fixes
**Week 3+:** P2 Medium Priority (ongoing roadmap planning) ← YOU ARE HERE

**Note:** P2 items should be prioritized based on:
- Business value
- User demand
- Development capacity
- Strategic direction

---

## 1. Code Architecture Improvements

### 1A. ES6+ Migration with Transpilation

**Current State:**

TicTacStick is written in **ES5 JavaScript** for iOS Safari 12+ compatibility. This means:

```javascript
// Current ES5 code:
var data = {
  name: 'Test',
  value: 100
};

function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].value;
  }
  return total;
}

// Must use string concatenation
var message = 'Total: ' + total + ' items';
```

**Future State with ES6+:**

```javascript
// Modern ES6+ code:
const data = {
  name: 'Test',
  value: 100
};

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// Template literals
const message = `Total: ${total} items`;

// Destructuring
const { name, value } = data;

// Async/await
async function loadData() {
  const response = await fetch('/api/data');
  return await response.json();
}
```

**Benefits:**

- ✅ **More readable code** - Arrow functions, destructuring
- ✅ **Easier to maintain** - Modern JavaScript patterns
- ✅ **Better developer experience** - Use modern tools and libraries
- ✅ **Faster development** - Less boilerplate code
- ✅ **Access to modern libraries** - Most npm packages use ES6+

**Drawbacks:**

- ❌ **Requires build step** - Need Babel, Webpack
- ❌ **Deployment complexity** - Must transpile before deploy
- ❌ **Debugging harder** - Need source maps
- ❌ **Learning curve** - Team must learn build tools

**Implementation Approach:**

**Phase 1: Set Up Build Tools**

```bash
# Install dependencies
npm install --save-dev @babel/core @babel/preset-env webpack webpack-cli

# Configure Babel (.babelrc)
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "ios": "12"
      }
    }]
  ]
}

# Configure Webpack (webpack.config.js)
module.exports = {
  entry: './src/js/app.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
```

**Phase 2: Migrate Core Modules**

Start with low-risk modules:

1. `validation.js` → `validation.ts` (or .js with ES6)
2. `storage.js` → `storage.ts`
3. `calc.js` → `calc.ts`
4. Then move to larger modules

**Phase 3: Test & Deploy**

- Ensure transpiled code works on iOS Safari 12+
- Run full test suite
- Deploy to staging for testing
- Gradual rollout to production

**Effort:** High (2-3 months)
**Priority:** Low (ES5 works fine for now)
**Business Value:** Medium (long-term maintainability)

**Recommendation:** ⚠️ **Defer** until codebase becomes unmaintainable in ES5.

---

### 1B. Module Bundler (Webpack/Rollup)

**Current State:**

All JavaScript files loaded separately via `<script>` tags:

```html
<!-- index.html -->
<script src="bootstrap.js"></script>
<script src="storage.js" defer></script>
<script src="calc.js" defer></script>
<script src="app.js" defer></script>
<!-- ... 20+ more scripts ... -->
```

**Problems:**

- ❌ 20+ HTTP requests to load app (slow on 3G/4G)
- ❌ Manual dependency management (load order matters)
- ❌ No tree-shaking (unused code still loaded)
- ❌ Hard to share code between modules

**Future State with Bundler:**

```html
<!-- index.html -->
<script src="dist/bundle.js"></script>
<!-- Single file, all code bundled -->
```

**Benefits:**

- ✅ **Single HTTP request** - Faster load time
- ✅ **Tree-shaking** - Remove unused code (smaller bundle)
- ✅ **Code splitting** - Load heavy modules on demand
- ✅ **npm packages** - Easy to use third-party libraries
- ✅ **Better dependency management** - Automatic resolution

**Options:**

1. **Webpack** - Most popular, full-featured, complex
2. **Rollup** - Simpler, better tree-shaking, good for libraries
3. **esbuild** - Very fast, simpler config
4. **Parcel** - Zero-config, easiest to set up

**Recommendation:** Start with **esbuild** (simplest, fastest).

**Implementation:**

```bash
# Install esbuild
npm install --save-dev esbuild

# Build script (package.json)
{
  "scripts": {
    "build": "esbuild src/js/app.js --bundle --outfile=dist/bundle.js --target=safari12"
  }
}

# Build
npm run build
```

**Effort:** Medium (2-3 weeks)
**Priority:** Medium
**Business Value:** Medium (performance, DX)

**Recommendation:** ✅ **Implement** after P0/P1 complete.

---

### 1C. TypeScript Migration

**Current State:** JavaScript (ES5 or ES6)

**Future State:** TypeScript

**Benefits:**

- ✅ **Type safety** - Catch bugs at compile time
- ✅ **Better IDE support** - Autocomplete, refactoring
- ✅ **Self-documenting code** - Types serve as documentation
- ✅ **Easier refactoring** - Confidence when changing code

**Example:**

```typescript
// TypeScript
interface Quote {
  id: string;
  clientName: string;
  total: number;
  lineItems: LineItem[];
}

interface LineItem {
  type: 'window' | 'pressure';
  quantity: number;
  price: number;
}

function calculateTotal(quote: Quote): number {
  return quote.lineItems.reduce((sum, item) => sum + item.price, 0);
}

// Type error caught at compile time:
calculateTotal({ id: 123 });  // ❌ Error: id should be string
```

**Drawbacks:**

- ❌ **Learning curve** - Team must learn TypeScript
- ❌ **Build step required** - Need TypeScript compiler
- ❌ **Migration effort** - High (rewrite all code)

**Effort:** Very High (6+ months)
**Priority:** Low
**Business Value:** High (long-term)

**Recommendation:** ⏳ **Consider** after ES6 migration complete.

---

## 2. Data Layer Migration

### 2A. Cloud Backend API (Most Important P2 Item)

**Current State:** All data in LocalStorage (offline-first, no sync)

**Problems with LocalStorage:**

- ❌ **5MB limit** - Can't store unlimited data
- ❌ **Single device** - Data stuck on one iPad
- ❌ **No backup** - If device lost, data lost
- ❌ **No multi-user** - Can't have team collaboration
- ❌ **No cross-device** - Can't access on phone and iPad

**Future State:** Cloud backend with offline sync

**Architecture:**

```
┌─────────────┐
│   iOS App   │
│ (PWA/Native)│
└──────┬──────┘
       │
       │ HTTPS REST API
       │
┌──────▼──────┐         ┌──────────┐
│  Backend    │────────▶│ Database │
│  (Node.js)  │         │(Postgres)│
└─────────────┘         └──────────┘

Offline Sync:
1. User makes changes offline (saved to LocalStorage)
2. Queue sync operations
3. When online, sync changes to backend
4. Backend resolves conflicts (last-write-wins, etc.)
5. Pull down changes from other devices
```

**Benefits:**

- ✅ **Multi-device access** - Access from any device
- ✅ **Team collaboration** - Multiple users can access same data
- ✅ **Data backup** - Automatic cloud backup
- ✅ **Unlimited storage** - No 5MB limit
- ✅ **Advanced features** - Email integration, reporting, etc.

**Implementation Phases:**

**Phase 1: Backend API (2-3 months)**

```javascript
// Node.js + Express + PostgreSQL
// API Endpoints:

GET    /api/quotes          // List quotes
POST   /api/quotes          // Create quote
GET    /api/quotes/:id      // Get quote
PUT    /api/quotes/:id      // Update quote
DELETE /api/quotes/:id      // Delete quote

GET    /api/clients         // List clients
POST   /api/clients         // Create client
// ... similar for invoices, tasks, etc.
```

**Phase 2: Authentication & Authorization (1-2 months)**

```javascript
// User accounts, login, permissions
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// Role-based access control
Roles: Owner, Manager, Technician, ReadOnly
```

**Phase 3: Offline Sync Logic (2-3 months)**

```javascript
// Sync engine in frontend
class SyncManager {
  constructor() {
    this.queue = [];  // Pending operations
    this.syncing = false;
  }

  // Queue an operation for sync
  queueOperation(operation) {
    this.queue.push(operation);
    this.saveQueue();  // Persist queue to LocalStorage

    if (navigator.onLine) {
      this.sync();
    }
  }

  // Sync all pending operations
  async sync() {
    if (this.syncing || this.queue.length === 0) return;

    this.syncing = true;

    while (this.queue.length > 0) {
      const op = this.queue[0];

      try {
        await this.executeOperation(op);
        this.queue.shift();  // Remove from queue
        this.saveQueue();
      } catch (error) {
        console.error('Sync failed:', error);
        this.syncing = false;
        return;  // Stop syncing on error
      }
    }

    this.syncing = false;
  }

  async executeOperation(operation) {
    const { type, resource, id, data } = operation;

    switch (type) {
      case 'create':
        return await api.post(`/api/${resource}`, data);
      case 'update':
        return await api.put(`/api/${resource}/${id}`, data);
      case 'delete':
        return await api.delete(`/api/${resource}/${id}`);
    }
  }
}

// Listen for online/offline events
window.addEventListener('online', () => {
  syncManager.sync();
});
```

**Phase 4: Conflict Resolution (1-2 months)**

```javascript
// Handle conflicts when same record edited offline on multiple devices

Strategies:
1. Last-write-wins (simplest)
2. Server-wins (protect server data)
3. Client-wins (trust local changes)
4. Manual resolution (ask user to choose)

Example: Last-write-wins
function resolveConflict(local, remote) {
  if (local.updatedAt > remote.updatedAt) {
    return local;  // Local is newer
  } else {
    return remote;  // Remote is newer
  }
}
```

**Backend Stack Recommendation:**

```
Option 1: Node.js (Easiest for JS developers)
├── Express.js (Web framework)
├── PostgreSQL (Database)
├── Prisma (ORM)
└── JWT (Authentication)

Option 2: Firebase (No backend code)
├── Firestore (Database)
├── Firebase Auth (Authentication)
├── Firebase Functions (Serverless)
└── Firebase Hosting (PWA hosting)

Option 3: Supabase (Open-source Firebase alternative)
├── PostgreSQL (Database)
├── Supabase Auth (Authentication)
├── Auto-generated REST API
└── Real-time subscriptions
```

**Recommendation:** Use **Supabase** (fastest to implement, open-source).

**Effort:** Very High (6-12 months full project)
**Priority:** High (enables multi-device, team features)
**Business Value:** Very High (critical for growth)

**Recommendation:** ✅ **Plan immediately**, implement in phases.

---

### 2B. IndexedDB for Binary Data

**Problem:** Photos stored as base64 in LocalStorage (inefficient).

**Solution:** Use IndexedDB for binary data (photos).

```javascript
// IndexedDB API
const db = await openDB('tictacstick', 1, {
  upgrade(db) {
    db.createObjectStore('photos', { keyPath: 'id' });
  }
});

// Save photo as blob (not base64)
await db.put('photos', {
  id: photo.id,
  blob: photoBlob,  // Binary data
  quoteId: quote.id
});

// Retrieve photo
const photo = await db.get('photos', photoId);
const url = URL.createObjectURL(photo.blob);
```

**Benefits:**

- ✅ **Better performance** - Binary storage more efficient
- ✅ **Larger storage** - IndexedDB has higher quota
- ✅ **Async API** - Doesn't block UI thread

**Effort:** Low (1 week)
**Priority:** Low
**Business Value:** Low (LocalStorage works okay)

---

## 3. Feature Enhancements

### 3A. Photo Upload Improvements

**Current:** Photos stored as base64 in LocalStorage (inefficient)

**Improvements:**

1. **Image Compression**

```javascript
// Compress photos before storage
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Usage
const compressed = await compressImage(file, 1920, 1080, 0.8);
// 80% quality JPEG, max 1920x1080
```

2. **Image Editing Tools**

- Crop
- Rotate
- Annotate (draw on image)
- Before/after comparison

3. **Cloud Photo Storage**

Upload photos to cloud (AWS S3, Cloudinary) instead of LocalStorage.

**Effort:** Medium (2-3 weeks)
**Priority:** Medium
**Business Value:** Medium (better UX)

---

### 3B. Advanced Analytics

**Current:** Basic analytics (total revenue, quote count)

**Enhancements:**

1. **More Chart Types**

```javascript
// Line chart: Revenue over time
// Bar chart: Revenue by service type
// Pie chart: Service mix (windows vs pressure)
// Heatmap: Busy days/times
```

2. **Revenue Forecasting**

```javascript
// Predict next month's revenue based on historical data
function forecastRevenue(history) {
  // Simple linear regression
  const trend = calculateTrend(history);
  const nextMonth = trend.slope * (history.length + 1) + trend.intercept;
  return nextMonth;
}
```

3. **Job Profitability Analysis**

```javascript
// Which jobs are most/least profitable?
function analyzeJobProfitability(jobs) {
  return jobs.map(job => ({
    ...job,
    revenue: job.total,
    cost: calculateCost(job),  // Time * hourly cost
    profit: job.total - calculateCost(job),
    margin: (job.total - calculateCost(job)) / job.total
  }));
}

// Show:
// - Most profitable job types
// - Optimal job size
// - Best clients (highest LTV)
```

4. **Client Insights**

- Lifetime value (LTV)
- Churn risk
- Referral sources
- Repeat rate

**Effort:** Medium (3-4 weeks)
**Priority:** Low
**Business Value:** Medium (nice to have)

---

### 3C. Team Collaboration Features

**For when business grows beyond solo operator:**

1. **Multi-User Support**

```javascript
// User roles
Roles:
- Owner: Full access
- Manager: Can create/edit quotes, invoices
- Technician: Can view quotes, mark jobs complete
- ReadOnly: Can only view data

// User management
GET    /api/users
POST   /api/users/invite
DELETE /api/users/:id
```

2. **Activity Log**

```javascript
// Track all changes
Activity Log:
- "Gerard created quote Q-123 for John Smith" (2 hours ago)
- "Sarah marked invoice INV-045 as paid" (1 day ago)
- "Mike completed job J-089" (3 days ago)
```

3. **Team Chat / Notes**

```javascript
// Internal notes on quotes/jobs
{
  quoteId: 'Q-123',
  notes: [
    {
      user: 'Gerard',
      message: 'Client wants windows done first',
      timestamp: '2024-11-19 10:30'
    },
    {
      user: 'Sarah',
      message: 'Scheduled for Thursday 2pm',
      timestamp: '2024-11-19 11:00'
    }
  ]
}
```

4. **Job Assignment**

```javascript
// Assign jobs to technicians
{
  jobId: 'J-123',
  assignedTo: 'Mike',
  scheduledDate: '2024-11-21',
  status: 'assigned'
}
```

**Effort:** Very High (3-6 months)
**Priority:** Medium (only if business grows)
**Business Value:** High (if team size > 1)

---

## 4. Testing & Quality

### 4A. E2E Test Coverage

**Current:** 120 Playwright tests (mostly unit tests)

**Add:**

1. **Full User Workflows**

```javascript
test('Complete quote-to-payment workflow', async ({ page }) => {
  // 1. Create client
  await createClient(page, 'John Smith');

  // 2. Create quote
  await createQuote(page, {
    client: 'John Smith',
    service: 'Window Cleaning',
    windows: 10
  });

  // 3. Send quote to client
  await sendQuote(page);

  // 4. Convert to invoice
  await convertToInvoice(page);

  // 5. Record payment
  await recordPayment(page, 500);

  // 6. Verify invoice marked as paid
  await expect(page.locator('.invoice-status')).toHaveText('Paid');
});
```

2. **Mobile-Specific Tests**

```javascript
test('Mobile quote creation', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Test mobile UI
  await page.click('[data-testid="mobile-menu"]');
  await page.click('[data-testid="new-quote"]');

  // ... rest of test
});
```

3. **Accessibility Tests**

```javascript
const { injectAxe, checkA11y } = require('axe-playwright');

test('Quote page is accessible', async ({ page }) => {
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

**Effort:** Medium (ongoing, 1-2 weeks per sprint)
**Priority:** Medium
**Business Value:** High (prevent bugs)

---

### 4B. Visual Regression Testing

**Tool:** Percy, Chromatic, or BackstopJS

**Example:**

```javascript
// Take screenshot of quote page
test('Quote page matches snapshot', async ({ page }) => {
  await page.goto('/quote');
  await page.screenshot({ path: 'snapshots/quote-page.png' });

  // Percy compares to baseline
  await percySnapshot(page, 'Quote Page');
});
```

**Catches:**
- Unintended CSS changes
- Layout breaks
- Responsive issues

**Effort:** Low (1 week setup)
**Priority:** Low
**Business Value:** Medium

---

## 5. Documentation

### 5A. API Documentation

**Use:** JSDoc, TypeDoc, or Swagger

**Example (JSDoc):**

```javascript
/**
 * Calculate quote total
 *
 * @param {Object} quote - The quote object
 * @param {LineItem[]} quote.lineItems - Array of line items
 * @param {number} quote.baseFee - Base fee
 * @returns {number} Total quote amount in dollars
 *
 * @example
 * const total = calculateQuoteTotal({
 *   lineItems: [{ price: 100 }, { price: 200 }],
 *   baseFee: 50
 * });
 * // => 350
 */
function calculateQuoteTotal(quote) {
  // ...
}
```

**Generate HTML docs:**

```bash
npx jsdoc src/js/**/*.js -d docs/api
```

**Effort:** Low (ongoing)
**Priority:** Low
**Business Value:** Low (internal tool)

---

### 5B. Video Tutorials

**Content:**
1. Getting started (5 min)
2. Creating a quote (3 min)
3. Managing clients (3 min)
4. Invoicing (5 min)
5. Analytics (3 min)

**Tools:** Loom, Screen Studio, OBS

**Effort:** Low (1-2 days)
**Priority:** Low
**Business Value:** Medium (onboarding)

---

## Prioritization Matrix

| Feature | Effort | Impact | Priority | Timeline |
|---------|--------|--------|----------|----------|
| **Cloud Backend** | Very High | Very High | ⭐ High | Q1-Q2 2025 |
| ES6 Migration | High | Low | Low | 2026+ |
| Module Bundler | Medium | Medium | Medium | Q3 2025 |
| TypeScript | Very High | High | Low | 2026+ |
| Photo Compression | Medium | Medium | Medium | Q4 2025 |
| Advanced Analytics | Medium | Low | Low | 2026+ |
| Team Features | Very High | Medium | Medium | 2025 (if needed) |
| E2E Tests | Medium | High | Medium | Ongoing |
| Visual Regression | Low | Medium | Low | Q4 2025 |
| API Docs | Low | Low | Low | Ongoing |
| Video Tutorials | Low | Medium | Low | Q4 2025 |

**Recommendation:**

**2025 Roadmap:**

```
Q1: Plan Cloud Backend Architecture
Q2: Implement Cloud Backend (Phase 1)
Q3: Implement Cloud Backend (Phase 2), Add Module Bundler
Q4: Add Photo Compression, Visual Regression Tests

Optional (if business grows):
- Team Features (Q3-Q4 if hiring)
```

---

## Implementation Recommendations

### Immediate Focus (After P0/P1)

1. ✅ **Plan Cloud Backend** (1-2 weeks)
   - Define API endpoints
   - Choose tech stack (recommend: Supabase)
   - Design database schema
   - Plan migration strategy

2. ✅ **Add Module Bundler** (2-3 weeks)
   - Use esbuild (simplest, fastest)
   - Bundle all JS into single file
   - Improve load time

### Q1 2025

3. ✅ **Implement Cloud Backend Phase 1**
   - User authentication
   - Quote/invoice/client APIs
   - Basic sync (no offline yet)

### Q2 2025

4. ✅ **Implement Cloud Backend Phase 2**
   - Offline sync
   - Conflict resolution
   - Multi-device support

### Q3 2025

5. ⚠️ **Team Features** (if needed)
   - Only implement if hiring employees
   - Otherwise, defer to 2026

### Q4 2025

6. ✅ **Polish & Optimization**
   - Photo compression
   - Visual regression tests
   - Advanced analytics (if time permits)

### 2026+

7. ⏳ **Modernization** (if needed)
   - ES6+ migration
   - TypeScript
   - Advanced features

---

## Cost-Benefit Analysis

### Cloud Backend

**Cost:**
- Development: 6-12 months ($50k-$100k if outsourced)
- Hosting: $20-50/month (Supabase, AWS, etc.)
- Maintenance: 2-4 hours/month

**Benefit:**
- Multi-device access
- Data backup
- Team collaboration (if hiring)
- Unlimited storage
- Advanced features possible

**ROI:** ✅ **High** - Essential for business growth

### ES6+ Migration

**Cost:**
- Development: 2-3 months ($20k-$30k if outsourced)
- Build tools setup: 1 week
- Ongoing transpilation: Adds 2-5 seconds to build

**Benefit:**
- Easier development
- Access to modern libraries
- Better developer experience

**ROI:** ⚠️ **Low** - Nice to have, not critical

### Team Features

**Cost:**
- Development: 3-6 months ($40k-$80k if outsourced)
- Complexity: High (auth, permissions, audit logs)

**Benefit:**
- Can hire employees
- Scale business
- Better collaboration

**ROI:** ✅ **High IF hiring**, ❌ **Low if solo**

---

## Migration Paths

### Cloud Backend Migration

**Strategy: Dual-Mode Operation**

```
Phase 1: LocalStorage-only (current)
       ↓
Phase 2: Dual-mode (both LocalStorage and Cloud)
       ├── User can choose to enable cloud sync
       ├── Data stays in LocalStorage (offline-first)
       └── Syncs to cloud when online
       ↓
Phase 3: Cloud-first (but still works offline)
       ├── Primary data store is cloud
       ├── LocalStorage is cache
       └── Offline changes sync when online
```

**No Breaking Changes:**
- Existing LocalStorage data automatically migrated
- User opts into cloud sync (not forced)
- Can still use offline-only if preferred

---

## Next Steps

### Planning Phase (Now - Week 3)

1. **Review P2 roadmap**
   - [ ] Discuss priorities with stakeholders
   - [ ] Decide which items to pursue in 2025
   - [ ] Create detailed specs for chosen items

2. **Cloud Backend Planning**
   - [ ] Define API endpoints
   - [ ] Choose tech stack
   - [ ] Design database schema
   - [ ] Estimate cost (development + hosting)

### Q1 2025

3. **Begin Cloud Backend Development**
   - [ ] Set up infrastructure (Supabase/Firebase/Custom)
   - [ ] Implement authentication
   - [ ] Build API endpoints
   - [ ] Create sync engine

### Ongoing

4. **Incremental Improvements**
   - [ ] Add E2E tests as features develop
   - [ ] Document API as it's built
   - [ ] Optimize performance continuously

---

## Conclusion

P2 items represent the **long-term vision** for TicTacStick. While they're not immediately critical, they should be planned and prioritized based on business needs.

**Top Recommendation:**

✅ **Cloud Backend** - Highest impact, enables business growth
⚠️ **Module Bundler** - Quick win, improves performance
⏳ **ES6+ Migration** - Nice to have, defer until necessary
⏳ **Team Features** - Only if hiring employees
⏳ **Advanced Analytics** - Low priority, nice to have

**Strategic Direction:**

Focus on features that enable **business growth** (cloud backend, team features) rather than technical improvements (ES6, TypeScript) unless they become blocking issues.

---

**Last Updated:** 2024-11-19
**Status:** Planning Phase
**Next Review:** After P0 and P1 complete
