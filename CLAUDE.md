# CLAUDE.md - AI Assistant Guide for TicTacStick Quote Engine

**Last Updated:** 2025-11-18
**Version:** 1.8.0
**Project:** TicTacStick Quote Engine for 925 Pressure Glass

---

## Table of Contents

1. [Critical Information](#critical-information)
2. [Project Overview](#project-overview)
3. [Codebase Architecture](#codebase-architecture)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Testing](#testing)
7. [Common Tasks](#common-tasks)
8. [Security & Validation](#security--validation)
9. [Module Reference](#module-reference)
10. [Troubleshooting](#troubleshooting)

---

## What's New in v1.8.0

### Enhanced Print Layouts System (November 2025)

This release adds comprehensive professional printing capabilities:

**New Modules (12 files):**
- `invoice-print.css` - Professional invoice print layout
- `photo-print-layout.css` - Photo grid layouts (2×2, 3×3, 4×4, before/after)
- `letterhead.css` - Branded letterhead system with logo support
- `window-types-extended.js` - Australian-specific window types (louvre, awning, hopper, bay/bow)
- `conditions-modifiers.js` - Job condition pricing adjustments (weather, difficulty, urgency)
- `pressure-surfaces-extended.js` - Extended surface types (sandstone, timber, roof tiles)
- `lazy-loader.js` + `lazy-loader-init.js` - On-demand module loading
- `quick-add-ui.js` - Mobile-optimized quick add interface
- `custom-window-calculator.js` - Custom dimension calculator
- `travel-calculator.js` - Travel time/cost calculation
- `profitability-analyzer.js` - Job profitability analysis
- `job-presets.js` - Job preset management
- `quote-migration.js` - Data migration utilities

**New CSS Files (4):**
- `mobile.css` - Mobile responsive design (540 lines)
- `invoice-print.css` - Invoice print layout (399 lines)
- `photo-print-layout.css` - Photo grids (372 lines)
- `letterhead.css` - Professional letterhead (426 lines)

**New Test Suites (8):**
- `analytics.spec.js`, `client-database.spec.js`, `data-validation.spec.js`
- `debug-modules.spec.js`, `export.spec.js`, `storage.spec.js`
- `templates.spec.js`, `theme.spec.js`

**New Documentation:**
- `PRINT_GUIDE.md` - Comprehensive 900-line printing guide

**Key Features:**
- 📄 Professional invoice printing with letterhead
- 📸 Photo documentation with multiple grid layouts
- 🎨 Custom branding with logo upload
- 📱 Mobile-optimized UI components
- 📊 Business intelligence (travel, profitability)
- ⚡ Performance optimization with lazy loading
- 🪟 Extended Australian window types
- 🏢 Job presets for common configurations

**Total:** ~3,500 lines of new code + documentation

---

## Critical Information

### Read This First

**CRITICAL CONSTRAINTS** - Violating these will break the application:

#### 1. ES5 JavaScript Only - NO ES6+

**MUST NOT USE:**
- ❌ `const` or `let` (use `var`)
- ❌ Arrow functions `() => {}` (use `function() {}`)
- ❌ Template literals `` `${var}` `` (use `'string' + var`)
- ❌ Destructuring `{a, b} = obj` (use `var a = obj.a`)
- ❌ Spread operator `...arr` (use `.concat()` or loops)
- ❌ Default parameters `function(a = 5)` (use `a = a || 5`)
- ❌ Promises `async/await` (use callbacks)
- ❌ Classes (use IIFE pattern)

**WHY:** iOS Safari 12+ compatibility for field use on older iPads.

#### 2. No Build Tools

- NO webpack, babel, vite, rollup, parcel, or any transpilation
- Direct browser execution only
- Manual dependency management
- Script load order in `index.html` matters

#### 3. Offline-First Architecture

- Must work without internet indefinitely
- All data in LocalStorage (no backend in Phase 2)
- Service Worker must cache all assets
- No external dependencies except Chart.js CDN (optional)

#### 4. Money Calculations Must Use Integer Arithmetic

```javascript
// CORRECT - Use calc.js Money utilities
var cents = Money.toCents(19.99);  // 1999
var total = Money.sumCents(cents1, cents2);
var dollars = Money.fromCents(total);

// WRONG - Never use floating-point math directly
var total = 0.1 + 0.2;  // 0.30000000000000004 ❌
```

---

## Project Overview

### What Is This?

TicTacStick is a **Progressive Web App (PWA)** quote engine for 925 Pressure Glass, a window and pressure cleaning business in Perth, Western Australia. It runs entirely client-side with zero backend dependency.

**Key Features:**
- Window cleaning quotes (6 window types)
- Pressure cleaning quotes (5 surface types)
- Invoice generation and tracking
- Client database (CRM)
- Quote analytics and history
- Photo attachments
- PDF/CSV export
- Dark/Light themes
- Keyboard shortcuts
- Full offline capability

### Business Context

**Operator:** Gerard Varone (solo operator)
**Primary Use Case:** On-site iPad quotes at job locations
**Critical Requirement:** Must work offline (many job sites have no internet)

**Workflow:**
1. Drive to job site (often no internet)
2. Walk property with client
3. Create quote on iPad
4. Email/SMS quote immediately
5. Convert accepted quotes to invoices
6. Track client history and revenue

### Current Phase

**Phase 3:** Feature Enhancement & Production Optimization
- Status: Active development with production deployments
- Recent: Enhanced print layouts system (v1.8.0), theme customization, mobile UI
- Focus: Business intelligence, mobile optimization, advanced features
- Next: User testing of new features, performance optimization

---

## Codebase Architecture

### Directory Structure

```
webapp/
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── package.json            # Node dependencies (tests only)
├── playwright.config.js    # Test configuration
├── .mcp.json              # Claude Code integration
├── CHANGELOG.md            # Version history and changes
│
├── Core JavaScript (~19,000 lines total)
├── bootstrap.js            # APP namespace initialization (MUST LOAD FIRST)
├── debug.js               # Debug system (load before others) - 445 lines
├── security.js            # XSS prevention, sanitization (load early) - 808 lines
├── validation.js          # Input validation system (load before invoice) - 1,323 lines
├── lazy-loader.js         # Lazy loading system - 743 lines
├── lazy-loader-init.js    # Lazy loader initialization - 164 lines
├── storage.js             # LocalStorage wrapper - 90 lines
├── calc.js                # Precision calculation engine - 365 lines
├── app.js                 # Core application state - 1,533 lines
├── ui.js                  # DOM manipulation and UI updates - 140 lines
├── wizard.js              # Modal wizard dialogs - 563 lines
├── loading.js             # Loading states - 124 lines
├── accessibility.js       # ARIA, keyboard nav - 365 lines
├── error-handler.js       # Global error handling - 239 lines
│
├── Data & Configuration Modules
├── data.js                # Base pricing data and lookup tables - 192 lines
├── window-types-extended.js    # Enhanced Australian window types - 405 lines
├── conditions-modifiers.js     # Job condition modifiers - 307 lines
├── pressure-surfaces-extended.js # Extended pressure surface types - 300 lines
├── quote-migration.js     # Quote data migration utilities - 262 lines
│
├── Feature Modules
├── invoice.js             # Invoice system (largest file) - 1,965 lines
├── client-database.js     # CRM functionality - 546 lines
├── quote-workflow.js      # Quote status tracking - 318 lines
├── analytics.js           # Business intelligence - 419 lines
├── charts.js              # Chart.js integration - 337 lines
├── photos.js              # Photo attachments - 267 lines
├── photo-modal.js         # Full-screen photo viewer - 156 lines
├── image-compression.js   # Photo compression - 714 lines
├── templates.js           # Quote templates - 480 lines
├── export.js              # PDF generation - 347 lines
├── import-export.js       # Backup/restore - 423 lines
├── theme.js               # Dark/Light theme - 133 lines
├── theme-customizer.js    # Theme customization UI - 663 lines
├── shortcuts.js           # Keyboard shortcuts - 501 lines
│
├── Mobile & UI Enhancement Modules
├── quick-add-ui.js        # Quick add UI for mobile - 351 lines
├── custom-window-calculator.js # Custom window calculator - 314 lines
│
├── Business Intelligence Modules
├── travel-calculator.js   # Travel time & cost calculator - 331 lines
├── profitability-analyzer.js # Job profitability analysis - 324 lines
│
├── Job Management Modules
├── job-presets.js         # Job presets and templates - 428 lines
│
├── Performance & PWA
├── performance-monitor.js # Performance tracking - 444 lines
├── performance-utils.js   # Optimization utilities - 439 lines
├── sw.js                  # Service Worker - 223 lines
├── sw-optimized.js        # Advanced caching (not in use) - 553 lines
│
├── CSS Files (~19 total)
├── app.css                # Main styles - 391 lines
├── invoice.css            # Invoice UI - 856 lines
├── validation.css         # Validation error styles - 353 lines
├── theme-light.css        # Light theme overrides - 218 lines
├── theme-customizer.css   # Theme customizer UI - 262 lines
├── mobile.css             # Mobile responsive styles - 540 lines
├── print.css              # General print styles - 214 lines
├── invoice-print.css      # Invoice print layout - 399 lines
├── photo-print-layout.css # Photo grid print layouts - 372 lines
├── letterhead.css         # Professional letterhead - 426 lines
├── toast.css              # Toast notifications - 37 lines
├── loading.css            # Loading states - 93 lines
├── photo-modal.css        # Photo modal viewer - 153 lines
├── photos.css             # Photo gallery - 99 lines
├── client-database.css    # CRM styles - 234 lines
├── quote-workflow.css     # Workflow styles - 184 lines
├── import-export.css      # Import/export UI - 167 lines
├── analytics.css          # Analytics dashboard - 138 lines
├── shortcuts.css          # Keyboard shortcuts UI - 135 lines
│
├── tests/                 # Playwright test suite (20 test files)
│   ├── bootstrap.spec.js  # Module registration tests
│   ├── calculations.spec.js # Calculation accuracy tests
│   ├── invoice-functional.spec.js # Invoice CRUD tests
│   ├── invoice-interface.spec.js  # Invoice UI tests
│   ├── security.spec.js   # XSS & security tests
│   ├── ui-interactions.spec.js # UI interaction tests
│   ├── wizards.spec.js    # Wizard dialog tests
│   ├── check-errors.spec.js # Error checking tests
│   ├── init-test.spec.js  # Initialization tests
│   ├── analytics.spec.js  # Analytics tests (NEW v1.8)
│   ├── client-database.spec.js # CRM tests (NEW v1.8)
│   ├── data-validation.spec.js # Data validation tests (NEW v1.8)
│   ├── debug-modules.spec.js # Debug system tests (NEW v1.8)
│   ├── export.spec.js     # Export functionality tests (NEW v1.8)
│   ├── storage.spec.js    # Storage tests (NEW v1.8)
│   ├── templates.spec.js  # Template system tests (NEW v1.8)
│   ├── theme.spec.js      # Theme tests (NEW v1.8)
│   ├── examples/          # Example tests
│   └── fixtures/          # Test fixtures
│
└── docs/                  # Documentation
    ├── PRINT_GUIDE.md     # Comprehensive print documentation (NEW v1.8)
    ├── THEME_CUSTOMIZATION_GUIDE.md # Theme customization (v1.7)
    ├── BUG_FIX_IMPLEMENTATION_PLAN.md
    ├── MIGRATION_STRATEGY.md
    ├── INVOICE_TESTING_CHECKLIST.md
    └── bug-reports/       # Bug tracking
```

### Script Load Order (CRITICAL)

From `index.html`, scripts MUST load in this order:

```html
<!-- 1. FIRST: Bootstrap creates APP namespace -->
<script src="bootstrap.js"></script>

<!-- 2. EARLY: Debug, Security, Validation (no defer - must be available immediately) -->
<script src="debug.js"></script>
<script src="security.js"></script>
<script src="validation.js"></script>

<!-- 3. Lazy Loader System -->
<script src="lazy-loader.js"></script>
<script src="lazy-loader-init.js" defer></script>

<!-- 4. Data & Configuration Modules (extended types must load before data.js) -->
<script src="window-types-extended.js" defer></script>
<script src="conditions-modifiers.js" defer></script>
<script src="pressure-surfaces-extended.js" defer></script>
<script src="data.js" defer></script>
<script src="quote-migration.js" defer></script>

<!-- 5. Core modules (with defer) -->
<script src="storage.js" defer></script>
<script src="calc.js" defer></script>
<script src="app.js" defer></script>

<!-- 6. Mobile & Business Intelligence Modules -->
<script src="quick-add-ui.js" defer></script>
<script src="custom-window-calculator.js" defer></script>
<script src="travel-calculator.js" defer></script>
<script src="profitability-analyzer.js" defer></script>

<!-- 7. Job Management -->
<script src="job-presets.js" defer></script>

<!-- 8. UI and feature modules (with defer) -->
<script src="ui.js" defer></script>
<script src="wizard.js" defer></script>
<script src="loading.js" defer></script>
<script src="accessibility.js" defer></script>
<script src="client-database.js" defer></script>
<script src="quote-workflow.js" defer></script>
<script src="import-export.js" defer></script>
<script src="invoice.js" defer></script>
<script src="theme.js" defer></script>
<script src="theme-customizer.js" defer></script>
<script src="shortcuts.js" defer></script>
<script src="error-handler.js" defer></script>
<script src="export.js" defer></script>
<script src="templates.js" defer></script>
<script src="photos.js" defer></script>

<!-- 9. Lazy-loaded modules (loaded on demand via LazyLoader) -->
<!-- analytics.js, charts.js, photo-modal.js are loaded when needed -->
```

**Why This Order?**
- `bootstrap.js` creates `window.APP` namespace - MUST be first
- `debug.js`, `security.js`, `validation.js` have no dependencies - load early (no defer)
- `lazy-loader.js` loads early to enable on-demand module loading
- Extended type modules must load before `data.js` to register custom types
- `quote-migration.js` handles data format updates
- `app.js` depends on `calc.js`, `data.js`, `storage.js`
- Business intelligence and mobile modules load before UI
- Feature modules depend on core modules
- Some modules (analytics, charts, photo-modal) are lazy-loaded on demand

---

## Development Workflows

### Module Pattern (ES5 IIFE)

ALL JavaScript files follow this pattern:

```javascript
// module-name.js - Brief description
// Dependencies: List any required modules
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Private variables
  var privateVar = 'value';
  var config = {
    setting: 123
  };

  // Private functions
  function privateHelper() {
    console.log('Private function');
  }

  // Public functions
  function publicMethod(arg) {
    var result = privateHelper();
    return result;
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('moduleName', {
      publicMethod: publicMethod
    });
  }

  // Global API (if needed)
  window.ModuleName = {
    publicMethod: publicMethod,
    anotherMethod: function(arg) {
      return arg;
    }
  };

  console.log('[MODULE-NAME] Initialized');
})();
```

### Adding a New Module

**Step-by-step:**

1. **Create the file** (e.g., `new-feature.js`)

```javascript
(function() {
  'use strict';

  function init() {
    console.log('[NEW-FEATURE] Initializing...');
    // Setup code here
  }

  function doSomething() {
    // Feature logic
  }

  // Register with APP
  if (window.APP) {
    window.APP.registerModule('newFeature', {
      init: init,
      doSomething: doSomething
    });
  }

  // Also expose globally if needed
  window.NewFeature = {
    doSomething: doSomething
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

2. **Add to `index.html`** in the correct position:

```html
<!-- Add after dependencies, before dependent modules -->
<script src="new-feature.js" defer></script>
```

3. **Add CSS if needed:**

```html
<link rel="stylesheet" href="new-feature.css" />
```

4. **Write tests** in `tests/`:

```javascript
// tests/new-feature.spec.js
const { test, expect } = require('@playwright/test');

test.describe('NewFeature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('.app');
  });

  test('should initialize correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      return window.NewFeature && typeof window.NewFeature.doSomething === 'function';
    });
    expect(result).toBe(true);
  });
});
```

5. **Update documentation:**
   - Add to this CLAUDE.md
   - Update PROJECT_STATE.md
   - Update README.md if user-facing

### Git Workflow

**Branch Naming:**
- Feature branches: `claude/feature-name-sessionid`
- Bug fixes: `claude/fix-bug-name-sessionid`
- Always include Claude session ID at end

**Commit Message Format:**

```bash
# Good commit messages
git commit -m "feat: add client search functionality to CRM"
git commit -m "fix: prevent duplicate invoice numbers (BUG-002)"
git commit -m "docs: update CLAUDE.md with validation guide"
git commit -m "test: add invoice validation test cases"
git commit -m "refactor: extract calculation logic to calc.js"

# Prefix types:
# feat: New feature
# fix: Bug fix
# docs: Documentation only
# test: Adding or updating tests
# refactor: Code change that neither fixes a bug nor adds a feature
# perf: Performance improvement
# style: Formatting, missing semicolons, etc.
# chore: Updating build tasks, package.json, etc.
```

**Before Committing:**

```bash
# 1. Run tests
npm test

# 2. Check for ES6 violations
grep -r "const " *.js
grep -r "let " *.js
grep -r "=>" *.js
grep -r "\`" *.js

# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "feat: add new feature"

# 5. Push to feature branch
git push -u origin branch-name
```

### Testing Workflow

**Run Tests:**

```bash
# All tests
npm test

# With browser UI (interactive)
npm run test:ui

# With browser visible (debug)
npm run test:headed

# Debug specific test
npm run test:debug -- tests/calculations.spec.js
```

**Test Structure:**

All tests use Playwright. Key test files:
- `bootstrap.spec.js` - Module registration
- `calculations.spec.js` - Pricing accuracy
- `invoice-functional.spec.js` - Invoice CRUD operations
- `invoice-interface.spec.js` - Invoice UI interactions
- `security.spec.js` - XSS prevention, sanitization
- `ui-interactions.spec.js` - Form interactions
- `wizards.spec.js` - Modal dialogs

**Writing New Tests:**

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app to be ready
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('#inputField', 'test value');

    // Act
    await page.click('#submitButton');

    // Assert
    const result = await page.textContent('#result');
    expect(result).toBe('expected value');
  });
});
```

---

## Code Conventions

### ES5 Patterns

#### Variables

```javascript
// CORRECT
var count = 0;
var items = [];
var config = { enabled: true };

// WRONG
const count = 0;  // ❌ NO const
let items = [];   // ❌ NO let
```

#### Functions

```javascript
// CORRECT
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// WRONG
const calculateTotal = (items) => {  // ❌ NO arrow functions
  let total = 0;  // ❌ NO let
  items.forEach(item => total += item.price);  // ❌ NO arrow functions
  return total;
};
```

#### String Concatenation

```javascript
// CORRECT
var message = 'Hello, ' + userName + '! Total: $' + total;

// WRONG
var message = `Hello, ${userName}! Total: $${total}`;  // ❌ NO template literals
```

#### Default Parameters

```javascript
// CORRECT
function greet(name) {
  name = name || 'Guest';
  return 'Hello, ' + name;
}

// WRONG
function greet(name = 'Guest') {  // ❌ NO default parameters
  return `Hello, ${name}`;
}
```

#### Array Methods

```javascript
// CORRECT
var doubled = [];
for (var i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

// ACCEPTABLE (map/filter/reduce are ES5)
var doubled = numbers.map(function(n) {
  return n * 2;
});

// WRONG
var doubled = numbers.map(n => n * 2);  // ❌ NO arrow functions
```

### Naming Conventions

```javascript
// Variables and functions: camelCase
var userName = 'John';
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
var MAX_ITEMS = 100;
var DEFAULT_RATE = 95;

// Private functions: underscore prefix (convention only)
function _privateHelper() {}

// DOM IDs: camelCase
<input id="baseFeeInput" />

// CSS classes: kebab-case
<div class="quote-summary"></div>

// File names: kebab-case
client-database.js
quote-workflow.js
```

### Comments

```javascript
// Single-line comments for brief notes
var total = 0;  // Running total

/**
 * Multi-line comments for function documentation
 * @param {number} amount - The amount in dollars
 * @param {boolean} includeGst - Whether to include GST
 * @returns {number} Final amount with GST if applicable
 */
function calculateGst(amount, includeGst) {
  if (!includeGst) return amount;
  return amount * 1.1;
}

// Section separators for major code blocks
// ============================================
// EVENT HANDLERS
// ============================================
```

### Error Handling

```javascript
// Try-catch for potentially failing operations
function saveToStorage(key, data) {
  try {
    var json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    console.error('[STORAGE] Save failed:', e);
    // Show user-friendly message
    if (window.showToast) {
      window.showToast('Failed to save data', 'error');
    }
    return false;
  }
}

// Input validation before processing
function calculatePrice(quantity, rate) {
  // Guard clauses
  if (typeof quantity !== 'number' || quantity < 0) {
    console.warn('[CALC] Invalid quantity:', quantity);
    return 0;
  }
  if (typeof rate !== 'number' || rate < 0) {
    console.warn('[CALC] Invalid rate:', rate);
    return 0;
  }

  return quantity * rate;
}
```

### LocalStorage Operations

```javascript
// ALWAYS use try-catch with localStorage
function loadState() {
  try {
    var json = localStorage.getItem('my-key');
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('[APP] Failed to load state:', e);
    return null;
  }
}

// Check for quota errors
function saveState(data) {
  try {
    localStorage.setItem('my-key', JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('[APP] LocalStorage quota exceeded');
      // Prompt user to clear old data
      if (window.showToast) {
        window.showToast('Storage full! Please export and delete old data.', 'error');
      }
    } else {
      console.error('[APP] Storage error:', e);
    }
    return false;
  }
}
```

---

## Testing

### Test Configuration

Tests use Playwright v1.56.1 configured in `playwright.config.js`:

```javascript
module.exports = {
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

### Running a Local Server for Tests

```bash
# Python 3
python3 -m http.server 8080

# Node http-server
npx http-server -p 8080

# Then run tests in another terminal
npm test
```

### Test Examples

**Testing Calculations:**

```javascript
test('should calculate window cleaning correctly', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Set hourly rate
  await page.fill('#hourlyRateInput', '100');

  // Add window line
  await page.click('#addWindowLineBtn');

  // Fill in details
  await page.selectOption('.window-type-select', 'standard');
  await page.fill('.window-quantity-input', '10');

  // Check calculation
  const total = await page.textContent('#totalIncGstDisplay');
  expect(total).toContain('$');
});
```

**Testing Module Registration:**

```javascript
test('APP.registerModule should work', async ({ page }) => {
  await page.goto('http://localhost:8080');

  const result = await page.evaluate(() => {
    window.APP.registerModule('testModule', { test: true });
    return window.APP.getModule('testModule');
  });

  expect(result).toEqual({ test: true });
});
```

### Test Coverage Areas

1. **Bootstrap Tests** (`bootstrap.spec.js`)
   - Module registration
   - APP namespace creation
   - Initialization sequence

2. **Calculation Tests** (`calculations.spec.js`)
   - Window pricing accuracy
   - Pressure cleaning pricing
   - GST calculations
   - Minimum job enforcement
   - High reach premiums

3. **Invoice Tests** (`invoice-functional.spec.js`, `invoice-interface.spec.js`)
   - Invoice creation from quotes
   - Payment recording
   - Status changes
   - Invoice editing
   - PDF generation
   - Duplicate number prevention
   - GST validation

4. **Security Tests** (`security.spec.js`)
   - XSS prevention
   - HTML sanitization
   - Input validation
   - CSP enforcement

5. **UI Tests** (`ui-interactions.spec.js`)
   - Form interactions
   - Button clicks
   - Modal dialogs
   - Accordion panels

6. **Wizard Tests** (`wizards.spec.js`)
   - Window wizard
   - Pressure wizard
   - Line item creation

---

## Common Tasks

### How to Add a New Window Type

1. **Add to data.js:**

```javascript
var WINDOW_TYPES = {
  existing: { /* ... */ },
  newType: {
    name: 'New Window Type',
    time: {
      in: 3,   // minutes per pane inside
      out: 4   // minutes per pane outside
    }
  }
};
```

2. **Update wizard.js** to include in dropdown
3. **Update calc.js** if special pricing logic needed
4. **Write tests** in `calculations.spec.js`

### How to Add a New Report/Export Format

1. **Create export function:**

```javascript
// In export.js or new file
function exportToXML() {
  var state = window.APP.getState();
  var xml = '<?xml version="1.0"?>\n<quote>\n';
  xml += '  <title>' + state.quoteTitle + '</title>\n';
  // ... build XML
  xml += '</quote>';

  // Download
  var blob = new Blob([xml], { type: 'application/xml' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'quote-' + Date.now() + '.xml';
  a.click();
  URL.revokeObjectURL(url);
}
```

2. **Add button to UI:**

```html
<button id="exportXmlBtn" class="btn">Export to XML</button>
```

3. **Wire up event handler:**

```javascript
// In app.js or export.js
document.getElementById('exportXmlBtn').addEventListener('click', function() {
  exportToXML();
});
```

### How to Add a New Validation Rule

1. **Add to validation.js:**

```javascript
// Add to ValidationRules object
phoneNumber: {
  code: 'ERR_PHONE_INVALID',
  message: 'Phone number must be 10 digits',
  validate: function(value) {
    if (!value) return true;  // Optional field
    return /^\d{10}$/.test(value.replace(/\s/g, ''));
  }
}
```

2. **Use in forms:**

```javascript
function validateForm() {
  var phone = document.getElementById('phoneInput').value;
  var result = window.InvoiceValidation.validateField('phoneNumber', phone);

  if (!result.valid) {
    window.showToast(result.message, 'error');
    return false;
  }
  return true;
}
```

### How to Add a New LocalStorage Key

1. **Define in storage.js:**

```javascript
var STORAGE_KEYS = {
  EXISTING_KEY: 'existing-key',
  NEW_KEY: 'new-feature-data'  // Add here
};
```

2. **Create accessor functions:**

```javascript
function saveNewFeatureData(data) {
  return Storage.set(STORAGE_KEYS.NEW_KEY, data);
}

function loadNewFeatureData() {
  return Storage.get(STORAGE_KEYS.NEW_KEY);
}
```

3. **Document schema:**

Update `PROJECT_STATE.md` LocalStorage Schema section with:
- Key name
- Data structure
- Purpose
- When it's updated

### How to Use the Printing System (v1.8.0)

The app now includes professional print layouts for invoices, photos, and documents.

#### Print an Invoice

1. **Open invoice in invoice system**
2. **Click "Print Invoice" or press Ctrl+P**
3. **Select print options:**
   - Standard invoice layout (clean, business-ready)
   - With letterhead (professional branding)
   - With company logo (uses theme customizer logo)

**Browser Print Settings:**
- Chrome: File → Print or Ctrl+P
- Firefox: File → Print or Ctrl+P
- Safari: File → Print or Cmd+P
- Paper: A4 or Letter
- Margins: Default or Minimum (for letterhead)
- Background graphics: Enabled (for colors/logos)

#### Print Photos (Job Documentation)

1. **Add photos to quote**
2. **Click photo to open photo viewer**
3. **Select print layout:**
   - **2×2 Grid** - 4 photos/page (large, for comparisons)
   - **3×3 Grid** - 9 photos/page (standard documentation)
   - **4×4 Grid** - 16 photos/page (overview/contact sheet)
   - **Before/After** - Side-by-side with color labels
   - **Full Page** - Single photo (feature photo)
   - **Panorama** - Full-width layout

4. **Press Ctrl+P to print**

**Photo Print Features:**
- Automatic captions (title, timestamp, location)
- Page break optimization (keeps photos together)
- High-quality rendering settings
- Window measurement overlays
- Room/location labels with color badges

#### Customize Letterhead

1. **Open Theme Customizer** (Settings → Theme)
2. **Upload company logo**
3. **Set company name and tagline**
4. **Choose letterhead style:**
   - Standard: Full header and footer
   - Minimal: Thin header/footer (saves paper)
   - Formal: Extra spacing and borders
   - Modern: Gradient accents

5. **Select letterhead color:** Blue, Green, or Gray
6. **Add optional elements:**
   - Draft watermark
   - Confidential banner
   - Signature block
   - QR code for verification
   - ABN/company registration

**See:** `PRINT_GUIDE.md` for comprehensive printing documentation

### How to Add Custom Window Types (Extended)

With the new `window-types-extended.js` module, you can add Australian-specific window types:

1. **Edit window-types-extended.js:**

```javascript
// Add to EXTENDED_WINDOW_TYPES object
louvre: {
  name: 'Louvre Windows',
  description: 'Adjustable slat windows',
  time: {
    in: 4,   // minutes per pane inside
    out: 5   // minutes per pane outside
  },
  difficulty: 'medium',
  highReachMultiplier: 1.4
}
```

2. **The type will automatically register with the system**
3. **Update wizard.js** to include in dropdown if needed
4. **Write tests** in `data-validation.spec.js`

### How to Add Job Condition Modifiers

1. **Edit conditions-modifiers.js:**

```javascript
// Add to CONDITION_MODIFIERS object
extremeHeat: {
  name: 'Extreme Heat (35°C+)',
  description: 'Hot weather premium',
  multiplier: 1.15,  // 15% increase
  category: 'weather',
  enabled: true
}
```

2. **Apply modifier in quote:**

```javascript
var basePrice = 500;
var adjustedPrice = ConditionsModifiers.applyModifier(basePrice, 'extremeHeat');
// Result: $575
```

### How to Configure Lazy Loading

The lazy loader defers loading heavy modules until needed:

1. **Register a module for lazy loading** in `lazy-loader-init.js`:

```javascript
LazyLoader.register('myModule', {
  script: 'my-module.js',
  dependencies: ['jquery'],  // Optional
  preload: false  // Don't load until requested
});
```

2. **Load when needed:**

```javascript
LazyLoader.load('myModule').then(function() {
  // Module is now loaded
  window.MyModule.doSomething();
});
```

3. **Check if loaded:**

```javascript
if (LazyLoader.isLoaded('analytics')) {
  // Use analytics
}
```

**Currently Lazy-Loaded:**
- `analytics.js` - Loads when analytics panel opened
- `charts.js` - Loads when charts needed
- `photo-modal.js` - Loads when photo viewed full-screen

### How to Add Business Intelligence Features

#### Add Travel Cost Calculation

```javascript
// In travel-calculator.js
TravelCalculator.calculateDistance('123 Main St, Perth WA');
// Returns: { distance: 15.2, time: 22, cost: 12.50 }

// Add to quote
TravelCalculator.addTravelToQuote(location);
```

#### Analyze Job Profitability

```javascript
// In profitability-analyzer.js
var analysis = ProfitabilityAnalyzer.analyzeJob({
  revenue: 450,
  costs: 120,
  timeHours: 3.5
});

console.log(analysis.margin);  // 73.3%
console.log(analysis.hourlyRate);  // $128.57/hr
console.log(analysis.breakEven);  // $120
```

### How to Create Job Presets

1. **Create a preset from current quote:**

```javascript
JobPresets.createPreset('3BR House Standard', {
  baseFee: 120,
  hourlyRate: 95,
  windowLines: [
    { type: 'standard', quantity: 12 },
    { type: 'sliding', quantity: 4 }
  ],
  pressureLines: [
    { surface: 'concrete', area: 50 }
  ]
});
```

2. **Load preset later:**

```javascript
JobPresets.loadPreset('3BR House Standard');
// Automatically fills quote with saved configuration
```

3. **Organize by category:**

```javascript
var residential = JobPresets.getPresetsByCategory('residential');
var commercial = JobPresets.getPresetsByCategory('commercial');
```

### How to Debug Issues

1. **Enable debug mode:**

```javascript
// In browser console
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();
```

2. **Check module registration:**

```javascript
// In console
window.APP.modules  // List all registered modules
window.APP.getState()  // Current application state
```

3. **Check LocalStorage:**

```javascript
// View all data
Object.keys(localStorage).forEach(function(key) {
  console.log(key, localStorage.getItem(key));
});
```

4. **Monitor calculations:**

```javascript
// In calc.js, add logging
console.log('[CALC] Input:', input);
console.log('[CALC] Result:', result);
```

---

## Security & Validation

### XSS Prevention

**ALWAYS sanitize user input before display:**

```javascript
// CORRECT - Use security.js utilities
var sanitized = window.Security.escapeHTML(userInput);
element.innerHTML = sanitized;

// OR better yet
window.Security.setTextSafely(element, userInput);

// WRONG - Direct innerHTML with user input
element.innerHTML = userInput;  // ❌ XSS VULNERABILITY
```

**Security Module (`security.js`) provides:**

```javascript
// HTML entity escape
window.Security.escapeHTML(str);

// Sanitize with line breaks preserved
window.Security.sanitizeWithLineBreaks(str);

// Safe text insertion
window.Security.setTextSafely(element, text);

// Safe attribute setting
window.Security.setAttributeSafely(element, attr, value);
```

### Input Validation

**Validation Module (`validation.js`) provides:**

```javascript
// Number validation
var validated = window.Security.validateNumber(input, {
  min: 0,
  max: 10000,
  decimals: 2,
  allowNegative: false,
  fallback: 0,
  fieldName: 'Hourly Rate'
});

// Currency validation (money amounts)
var amount = window.Security.validateCurrency(value, 'Payment Amount');

// Email validation
var email = window.Security.validateEmail(emailInput);

// Phone validation (Australian format)
var phone = window.Security.validatePhone(phoneInput);

// BSB validation (Australian bank code)
var bsb = window.Security.validateBSB(bsbInput);

// ABN validation (Australian Business Number)
var abn = window.Security.validateABN(abnInput);
```

**Invoice Validation (`validation.js`):**

```javascript
// Validate invoice before creation
var result = window.InvoiceValidation.validateInvoiceCreation(invoiceData);
if (!result.valid) {
  window.showToast(result.message, 'error');
  return;
}

// Validate payment before recording
var result = window.InvoiceValidation.validatePaymentRecording(paymentData);
if (!result.valid) {
  window.showToast(result.message, 'error');
  return;
}
```

### Content Security Policy

The app enforces strict CSP via `<meta>` tag in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  object-src 'none';
">
```

**Implications:**
- No external scripts except whitelisted CDNs
- No `eval()` or `Function()` constructor
- No inline event handlers (`onclick="..."`)
- Images can be data: URIs (for photos)

### Recent Security Fixes (v1.6)

1. **Paid Invoice Protection**
   - Invoices with status "paid" cannot be edited
   - Prevents data corruption and audit trail issues
   - Location: `invoice.js:1445-1452`

2. **Duplicate Invoice Number Prevention**
   - Settings form validates invoice numbers cannot be decreased
   - Prevents tax compliance violations
   - Location: `invoice.js:728-736`

3. **GST Validation**
   - GST must equal exactly 10% of subtotal
   - Enforced in invoice editing
   - Location: `invoice.js:1625-1634`

---

## Module Reference

### Core Modules

#### bootstrap.js (4.1K)

**Purpose:** Creates `window.APP` namespace, module registration system

**Key Functions:**
- `APP.registerModule(name, module)` - Register a module
- `APP.getModule(name)` - Retrieve a module
- `APP.init()` - Initialize application
- `APP.waitForInit(timeout)` - Wait for initialization (test-friendly)

**Load Order:** MUST load first (no defer)

#### app.js (45K)

**Purpose:** Core application state management, autosave, line item management

**Key Functions:**
- `addWindowLine(data)` - Add window line item
- `addPressureLine(data)` - Add pressure line item
- `removeWindowLine(id)` - Remove window line
- `removePressureLine(id)` - Remove pressure line
- `recalculate()` - Recalculate totals
- `getState()` - Get current state
- `setState(state)` - Set state
- `saveState()` - Save to LocalStorage
- `loadState()` - Load from LocalStorage

**State Structure:**
```javascript
{
  quoteTitle: '',
  clientName: '',
  clientLocation: '',
  jobType: '',
  baseFee: 120,
  hourlyRate: 95,
  minimumJob: 180,
  highReachModifier: 60,
  windowLines: [],
  pressureLines: [],
  internalNotes: '',
  clientNotes: '',
  photos: []
}
```

#### calc.js (9.6K)

**Purpose:** Precision calculation engine using integer arithmetic

**Key Utilities:**

```javascript
// Money (all calculations in cents)
Money.toCents(dollars)        // 19.99 → 1999
Money.fromCents(cents)        // 1999 → 19.99
Money.sumCents(...cents)      // Sum in cents
Money.multiply(cents, factor) // Multiply in cents

// Time (all calculations in minutes)
Time.hoursToMinutes(hours)    // 1.5 → 90
Time.minutesToHours(minutes)  // 90 → 1.5

// Percentages
Percentage.apply(amount, pct) // Apply percentage
Percentage.calculate(part, whole) // Calculate percentage
```

**Why Integer Arithmetic?**
Prevents floating-point errors: `0.1 + 0.2 = 0.30000000000000004`

#### storage.js (1.8K)

**Purpose:** LocalStorage wrapper with error handling

**Key Functions:**
```javascript
Storage.set(key, value)  // Save (auto-stringifies)
Storage.get(key)         // Load (auto-parses)
Storage.remove(key)      // Delete
Storage.clear()          // Clear all
Storage.getQuota()       // Check quota usage
```

**LocalStorage Keys:**
- `tictacstick_autosave_state_v1` - Current quote
- `tictacstick_presets_v1` - Job presets
- `tictacstick_saved_quotes_v1` - Saved quotes
- `client-database` - Client records
- `invoice-database` - Invoices
- `invoice-settings` - Invoice config
- `quote-history` - Analytics data
- `debug-enabled` - Debug mode flag
- `lastBackupDate` - Backup timestamp

#### security.js (23K)

**Purpose:** XSS prevention, input sanitization, validation utilities

**Key Functions:**
```javascript
Security.escapeHTML(str)
Security.sanitizeWithLineBreaks(str)
Security.setTextSafely(element, text)
Security.validateNumber(value, options)
Security.validateCurrency(value, fieldName)
Security.validateEmail(email)
Security.validatePhone(phone)
Security.validateBSB(bsb)
Security.validateABN(abn)
```

#### validation.js (40K)

**Purpose:** Production-grade input validation for invoices

**Key Functions:**
```javascript
InvoiceValidation.validateInvoiceCreation(data)
InvoiceValidation.validatePaymentRecording(data)
InvoiceValidation.validateField(fieldName, value)
InvoiceValidation.showError(message)
InvoiceValidation.clearErrors()
```

**Error Codes:** 50+ error codes covering all invoice operations

### Feature Modules

#### invoice.js (67K)

**Purpose:** Complete invoicing system

**Key Features:**
- Invoice creation from quotes
- Status tracking (draft, sent, paid, overdue, cancelled)
- Payment recording and history
- PDF generation
- Bank account details management
- Duplicate invoice number prevention
- GST validation

**Key Functions:**
```javascript
InvoiceSystem.convertQuoteToInvoice(quoteState)
InvoiceSystem.saveInvoice(invoice)
InvoiceSystem.loadInvoice(id)
InvoiceSystem.recordPayment(invoiceId, payment)
InvoiceSystem.generateInvoicePDF(invoice)
InvoiceSystem.updateInvoiceStatus(id, status)
```

#### client-database.js (17K)

**Purpose:** CRM functionality

**Key Features:**
- Client registry with contact info
- Job history tracking
- Quick client lookup and autofill

**Key Functions:**
```javascript
ClientDatabase.addClient(client)
ClientDatabase.updateClient(id, client)
ClientDatabase.deleteClient(id)
ClientDatabase.searchClients(query)
ClientDatabase.getClientHistory(clientId)
```

#### analytics.js (13K)

**Purpose:** Business intelligence and reporting

**Key Features:**
- Quote history (last 100 quotes)
- Revenue tracking
- Time estimates
- Top clients analysis
- CSV export

**Key Functions:**
```javascript
QuoteAnalytics.saveToHistory(quote)
QuoteAnalytics.getStatistics()
QuoteAnalytics.renderDashboard(period)
QuoteAnalytics.exportHistory()
```

#### templates.js (14K)

**Purpose:** Quote template system

**Built-in Templates:**
1. Standard House Package
2. Apartment Balcony Special
3. Commercial Storefront
4. Driveway & Paths Package
5. Full Service Package

**Key Functions:**
```javascript
QuoteTemplates.loadTemplate(id)
QuoteTemplates.saveCustomTemplate(name, state)
QuoteTemplates.deleteTemplate(id)
```

### UI Modules

#### ui.js (4.1K)

**Purpose:** DOM manipulation and UI updates

**Key Functions:**
```javascript
UI.updateSummary(breakdown)
UI.showModal(content)
UI.hideModal()
UI.showToast(message, type)
```

#### wizard.js (13K)

**Purpose:** Modal wizard dialogs for guided input

**Key Features:**
- Window wizard (guided window line creation)
- Pressure wizard (guided pressure line creation)
- Multi-step forms
- Validation

**Key Functions:**
```javascript
Wizard.openWindowWizard()
Wizard.openPressureWizard()
Wizard.close()
```

#### theme.js (133 lines)

**Purpose:** Dark/Light theme toggle

**Key Features:**
- System preference detection
- Theme persistence
- Smooth transitions

**Key Functions:**
```javascript
Theme.toggle()
Theme.set(mode)  // 'light' or 'dark'
Theme.getCurrent()
```

#### theme-customizer.js (663 lines) **NEW v1.7.0**

**Purpose:** Advanced theme customization UI

**Key Features:**
- Custom color scheme creation
- Logo upload and management
- Font customization
- Brand color selection
- Theme presets
- Export/import custom themes
- Real-time preview

**Key Functions:**
```javascript
ThemeCustomizer.open()
ThemeCustomizer.applyCustomTheme(theme)
ThemeCustomizer.saveCustomTheme(name, theme)
ThemeCustomizer.loadCustomTheme(id)
ThemeCustomizer.exportTheme()
ThemeCustomizer.importTheme(data)
```

### Data & Configuration Modules

#### data.js (192 lines)

**Purpose:** Base pricing data and lookup tables

**Key Data:**
- Window types (standard, sliding, etc.)
- Pressure cleaning surfaces (concrete, pavers, etc.)
- Base rates and multipliers

#### window-types-extended.js (405 lines) **NEW v1.8.0**

**Purpose:** Enhanced Australian window types with detailed configurations

**Key Features:**
- Louvre windows (adjustable slats)
- Awning windows (top-hinged)
- Hopper windows (bottom-hinged)
- Bay/bow windows (curved/angled)
- Garden windows (greenhouse-style)
- Skylight windows (roof-mounted)
- Custom time factors per type
- High-reach considerations

**Key Functions:**
```javascript
WindowTypesExtended.getType(typeId)
WindowTypesExtended.calculateTime(type, quantity)
WindowTypesExtended.getAllTypes()
```

#### conditions-modifiers.js (307 lines) **NEW v1.8.0**

**Purpose:** Job condition modifiers and pricing adjustments

**Key Features:**
- Weather conditions (rain, extreme heat)
- Site difficulty (high-rise, tight access)
- Time of day (after hours, weekend)
- Urgency (same day, emergency)
- Property condition (first clean, heavy buildup)
- Safety requirements (harness work, confined space)

**Key Functions:**
```javascript
ConditionsModifiers.applyModifier(basePrice, modifierType)
ConditionsModifiers.getModifierList()
ConditionsModifiers.calculateAdjustedPrice(basePrice, conditions)
```

#### pressure-surfaces-extended.js (300 lines) **NEW v1.8.0**

**Purpose:** Extended pressure cleaning surface types

**Key Features:**
- Additional surface types (sandstone, timber decking, roof tiles)
- Surface-specific time calculations
- Difficulty ratings
- Equipment recommendations
- Chemical requirements

**Key Functions:**
```javascript
PressureSurfacesExtended.getSurface(surfaceId)
PressureSurfacesExtended.calculateTime(surface, area)
PressureSurfacesExtended.getAllSurfaces()
```

#### quote-migration.js (262 lines) **NEW v1.8.0**

**Purpose:** Quote data migration and version compatibility

**Key Features:**
- Migrate old quote formats to new structure
- Handle breaking changes gracefully
- Preserve user data during updates
- Backward compatibility checks

**Key Functions:**
```javascript
QuoteMigration.migrate(quoteData)
QuoteMigration.checkVersion(data)
QuoteMigration.upgradeToLatest(data)
```

### Performance & Loading Modules

#### lazy-loader.js (743 lines) **NEW v1.8.0**

**Purpose:** On-demand module loading system for performance optimization

**Key Features:**
- Defer loading of heavy modules (analytics, charts)
- Load modules only when needed
- Progress tracking
- Dependency management
- Error handling and fallbacks
- Preload hints for anticipated features

**Key Functions:**
```javascript
LazyLoader.load(moduleName)
LazyLoader.loadMultiple([modules])
LazyLoader.preload(moduleName)
LazyLoader.isLoaded(moduleName)
```

**Lazy-Loaded Modules:**
- `analytics.js` - Loaded when analytics panel opened
- `charts.js` - Loaded when charts needed
- `photo-modal.js` - Loaded when photo viewed full-screen

#### lazy-loader-init.js (164 lines) **NEW v1.8.0**

**Purpose:** Initialize lazy loader and set up event handlers

**Key Features:**
- Register lazy-loadable modules
- Set up UI event triggers
- Handle module load failures
- Display loading states

### Mobile & UI Enhancement Modules

#### quick-add-ui.js (351 lines) **NEW v1.8.0**

**Purpose:** Mobile-optimized quick add interface

**Key Features:**
- Streamlined UI for touch devices
- Quick window/pressure line addition
- Preset buttons for common items
- Gesture support
- Compact layout for small screens

**Key Functions:**
```javascript
QuickAddUI.show()
QuickAddUI.hide()
QuickAddUI.addQuickWindow(preset)
QuickAddUI.addQuickPressure(preset)
```

#### custom-window-calculator.js (314 lines) **NEW v1.8.0**

**Purpose:** Custom window dimension calculator

**Key Features:**
- Calculate price based on exact measurements
- Support for unusual window shapes
- Area calculation (width × height)
- Custom pricing per square meter
- Visual measurement guide

**Key Functions:**
```javascript
CustomWindowCalculator.open()
CustomWindowCalculator.calculate(width, height)
CustomWindowCalculator.addCustomWindow(dimensions)
```

### Business Intelligence Modules

#### travel-calculator.js (331 lines) **NEW v1.8.0**

**Purpose:** Calculate travel time and costs for job pricing

**Key Features:**
- Distance calculation from base location
- Travel time estimation
- Fuel cost calculation
- Travel zone pricing (CBD, suburbs, rural)
- Integration with quote pricing
- Saved locations

**Key Functions:**
```javascript
TravelCalculator.calculateDistance(destination)
TravelCalculator.calculateTravelCost(distance)
TravelCalculator.addTravelToQuote(location)
TravelCalculator.saveLocation(name, location)
```

#### profitability-analyzer.js (324 lines) **NEW v1.8.0**

**Purpose:** Analyze job profitability and margins

**Key Features:**
- Break-even analysis
- Profit margin calculation
- Cost vs. revenue comparison
- Time efficiency metrics
- Hourly rate optimization suggestions
- Job type profitability reports

**Key Functions:**
```javascript
ProfitabilityAnalyzer.analyzeJob(jobData)
ProfitabilityAnalyzer.calculateMargin(quote)
ProfitabilityAnalyzer.suggestPricing(jobType)
ProfitabilityAnalyzer.generateReport()
```

### Job Management Modules

#### job-presets.js (428 lines) **NEW v1.8.0**

**Purpose:** Job preset management and quick templates

**Key Features:**
- Save common job configurations
- Quick load presets (e.g., "3BR House Standard")
- Preset categories (residential, commercial)
- Default settings per job type
- Preset sharing and export

**Key Functions:**
```javascript
JobPresets.createPreset(name, config)
JobPresets.loadPreset(id)
JobPresets.deletePreset(id)
JobPresets.getPresetsByCategory(category)
JobPresets.exportPresets()
JobPresets.importPresets(data)
```

---

## Troubleshooting

### Common Issues

#### Issue: "APP is not defined"

**Cause:** `bootstrap.js` not loaded or loaded with `defer`

**Solution:**
```html
<!-- CORRECT: No defer on bootstrap.js -->
<script src="bootstrap.js"></script>

<!-- WRONG -->
<script src="bootstrap.js" defer></script>
```

#### Issue: Module not registering

**Cause:** Module loads before `bootstrap.js`

**Solution:** Check script order in `index.html`. `bootstrap.js` must be first.

#### Issue: Tests timing out

**Cause:** App not initialized before test runs

**Solution:**
```javascript
// Wait for initialization
await page.waitForFunction(() => window.APP && window.APP.initialized);
```

#### Issue: LocalStorage quota exceeded

**Symptoms:** `QuotaExceededError` in console, autosave fails

**Solutions:**
1. Export backup via "Export History" button
2. Clear old quotes from history
3. Delete unnecessary saved quotes
4. Compress or remove old photos

**Prevention:**
- Photo compression automatically reduces size
- History limited to 100 most recent quotes
- Backup reminders every 30 days

#### Issue: Calculations incorrect (floating-point errors)

**Cause:** Direct floating-point math instead of integer arithmetic

**Wrong:**
```javascript
var total = 0.1 + 0.2;  // 0.30000000000000004
```

**Correct:**
```javascript
var cents1 = Money.toCents(0.1);  // 10
var cents2 = Money.toCents(0.2);  // 20
var totalCents = Money.sumCents(cents1, cents2);  // 30
var total = Money.fromCents(totalCents);  // 0.30
```

#### Issue: XSS vulnerability introduced

**Symptoms:** Security tests failing, `<script>` tags executing

**Cause:** Using `innerHTML` with unsanitized user input

**Wrong:**
```javascript
element.innerHTML = userInput;  // ❌
```

**Correct:**
```javascript
window.Security.setTextSafely(element, userInput);  // ✅
```

#### Issue: ES6 code breaks iOS Safari

**Symptoms:** App works in Chrome but fails on iPad

**Cause:** ES6+ syntax used

**Common violations:**
```javascript
// Find these and fix
grep -r "const " *.js
grep -r "let " *.js
grep -r "=>" *.js
grep -r "\`" *.js
```

**Fix:** Rewrite in ES5 (see [Code Conventions](#code-conventions))

### Debugging Tools

#### Enable Debug Mode

```javascript
// In browser console
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();
```

**Provides:**
- Verbose logging
- State change tracking
- Performance metrics

#### Inspect Application State

```javascript
// Get current state
window.APP.getState()

// View all modules
window.APP.modules

// Check specific module
window.APP.getModule('invoice')

// Check LocalStorage
Object.keys(localStorage)
```

#### Monitor Performance

```javascript
// Check performance metrics
window.PerformanceMonitor.getMetrics()

// Track specific operation
window.PerformanceMonitor.mark('operationStart');
// ... do operation ...
window.PerformanceMonitor.measure('operation', 'operationStart');
```

### Getting Help

**Documentation Files:**
- `README.md` - Project overview
- `PROJECT_STATE.md` - Comprehensive state summary
- `QUICK_START.md` - Quick reference
- `ERROR_CATALOG.md` - Error reference
- `DEBUG_SYSTEM_GUIDE.md` - Debug system
- `SECURITY.md` - Security implementation
- `VALIDATION_INTEGRATION_GUIDE.md` - Validation guide
- `TEST_REPORT.md` - Test documentation
- `docs/INVOICE_TESTING_CHECKLIST.md` - Invoice testing

**Test Examples:**
- `tests/examples/` - Example test patterns

**Issue Tracking:**
- `docs/bug-reports/` - Known bugs and fixes

---

## Quick Reference

### Most Common Operations

**Add a window line:**
```javascript
window.APP.addWindowLine({
  type: 'standard',
  quantity: 10,
  insidePanes: 10,
  outsidePanes: 10,
  highReach: false
});
```

**Add a pressure line:**
```javascript
window.APP.addPressureLine({
  surface: 'concrete',
  area: 50,
  unit: 'sqm'
});
```

**Recalculate totals:**
```javascript
window.APP.recalculate();
```

**Save current state:**
```javascript
window.APP.saveState();
```

**Create invoice from current quote:**
```javascript
var state = window.APP.getState();
var invoice = window.InvoiceSystem.convertQuoteToInvoice(state);
window.InvoiceSystem.saveInvoice(invoice);
```

**Show toast notification:**
```javascript
window.showToast('Operation successful!', 'success');
window.showToast('Something went wrong', 'error');
window.showToast('Please note...', 'info');
```

**Sanitize user input:**
```javascript
var safe = window.Security.escapeHTML(userInput);
```

**Validate a number:**
```javascript
var value = window.Security.validateNumber(input, {
  min: 0,
  max: 10000,
  decimals: 2,
  fieldName: 'Price'
});
```

### File Location Quick Reference

| Task | File |
|------|------|
| Add new window type | `data.js`, `window-types-extended.js` |
| Add job condition modifiers | `conditions-modifiers.js` |
| Add pressure surface types | `pressure-surfaces-extended.js` |
| Modify calculation logic | `calc.js` |
| Change state management | `app.js` |
| Update UI rendering | `ui.js` |
| Modify invoice system | `invoice.js` |
| Add validation rules | `validation.js` |
| Change security policies | `security.js` |
| Update PWA config | `manifest.json` |
| Modify offline caching | `sw.js` |
| Change test config | `playwright.config.js` |
| Update styles | `app.css`, `invoice.css`, `mobile.css`, etc. |
| Add keyboard shortcuts | `shortcuts.js` |
| Customize theme/branding | `theme-customizer.js` |
| Add business intelligence | `travel-calculator.js`, `profitability-analyzer.js` |
| Modify print layouts | `print.css`, `invoice-print.css`, `letterhead.css`, `photo-print-layout.css` |
| Add mobile features | `quick-add-ui.js`, `custom-window-calculator.js` |
| Configure lazy loading | `lazy-loader.js`, `lazy-loader-init.js` |
| Add job presets | `job-presets.js` |
| Migrate quote data | `quote-migration.js` |

---

## Appendix

### Version History

- **v1.8.0** (Current - 2025-11-18) - Enhanced print layouts system
  - Professional invoice printing (`invoice-print.css`)
  - Photo grid layouts for job documentation (`photo-print-layout.css`)
  - Professional letterhead system (`letterhead.css`)
  - Comprehensive print documentation (`PRINT_GUIDE.md`)
  - Extended window types, conditions, and surface types
  - Lazy loading system for performance optimization
  - Mobile UI enhancements (quick add, custom calculator)
  - Business intelligence modules (travel, profitability)
  - Job presets management
  - Quote migration system
  - 8 new test suites

- **v1.7.0** (2025-11-17) - Theme customization and comprehensive documentation
  - Theme customizer with custom branding
  - Logo upload and management
  - Custom color schemes
  - Comprehensive CLAUDE.md created
  - Mobile responsive design improvements

- **v1.6.0** - Critical invoice bug fixes, validation integration
  - Fixed paid invoice editing
  - Duplicate invoice number prevention
  - GST validation enforcement

- **v1.5.0** - Security hardening, error handling audit
- **v1.4.0** - Dark/Light theme, analytics, photos
- **v1.3.0** - CSV export, templates, validation
- **v1.2.0** - Keyboard shortcuts, print styles, PWA icons
- **v1.1.0** - PWA support, Service Worker, test suite
- **v1.0.0** - Initial release

### Related Documentation

**User Documentation:**
- `README.md` - User guide and features
- `QUICK_START.md` - Quick start guide
- `KEYBOARD_SHORTCUTS.md` - Keyboard shortcuts

**Developer Documentation:**
- `PROJECT_STATE.md` - Comprehensive project state
- `SECURITY.md` - Security implementation
- `VALIDATION_INTEGRATION_GUIDE.md` - Validation guide
- `TEST_REPORT.md` - Test documentation
- `DEBUG_SYSTEM_GUIDE.md` - Debug system
- `PRINT_GUIDE.md` - Printing documentation (v1.8.0)
- `THEME_CUSTOMIZATION_GUIDE.md` - Theme customization (v1.7.0)

**Planning Documents:**
- `IMPROVEMENT_PLAN_V2.0.md` - Future roadmap
- `PRIORITY_MATRIX.md` - Feature prioritization
- `PHASE_1_COMPLETE.md` - Phase 1 summary
- `docs/MIGRATION_STRATEGY.md` - Cloud migration plan
- `CHANGELOG.md` - Complete version history

### License

MIT License - 925 Pressure Glass

### Maintainer

**Gerard Varone** - 925 Pressure Glass
**Location:** Perth, Western Australia
**Project Phase:** Phase 3 - Feature Enhancement & Production Optimization

---

**For AI Assistants:**

This document is your primary reference for understanding and contributing to the TicTacStick Quote Engine codebase. Always:

1. ✅ **Read this file first** before making changes
2. ✅ **Follow ES5 constraints** strictly
3. ✅ **Test your changes** with `npm test`
4. ✅ **Use integer arithmetic** for money calculations
5. ✅ **Sanitize all user input** before display
6. ✅ **Document your changes** in relevant files
7. ✅ **Update this file** if you add new conventions

**Critical reminders:**
- NO ES6+ syntax (const, let, arrow functions, template literals)
- NO build tools or transpilation
- MUST work offline indefinitely
- MUST use integer arithmetic for money
- MUST sanitize user input for XSS prevention
- MUST maintain iOS Safari 12+ compatibility

Good luck! 🚀
