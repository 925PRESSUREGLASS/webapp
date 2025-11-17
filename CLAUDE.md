# CLAUDE.md - AI Assistant Guide for TicTacStick Quote Engine

**Last Updated:** 2025-11-17
**Version:** 1.7.0
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

**Phase 2B:** Invoice System Verification
- Status: Testing and validation in progress
- Recent: Fixed 3 critical invoice bugs (v1.6)
- Next: User acceptance testing and production deployment

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
│
├── Core JavaScript (~20,600 lines total)
├── bootstrap.js            # APP namespace initialization (MUST LOAD FIRST)
├── debug.js               # Debug system (load before others)
├── security.js            # XSS prevention, sanitization (load early)
├── validation.js          # Input validation system (load before invoice)
├── data.js                # Pricing data and lookup tables
├── storage.js             # LocalStorage wrapper
├── calc.js                # Precision calculation engine
├── app.js                 # Core application state (45K)
├── ui.js                  # DOM manipulation and UI updates
├── wizard.js              # Modal wizard dialogs
├── loading.js             # Loading states
├── accessibility.js       # ARIA, keyboard nav
├── error-handler.js       # Global error handling
│
├── Feature Modules
├── invoice.js             # Invoice system (67K - largest file)
├── client-database.js     # CRM functionality
├── quote-workflow.js      # Quote status tracking
├── analytics.js           # Business intelligence
├── charts.js              # Chart.js integration
├── photos.js              # Photo attachments
├── photo-modal.js         # Full-screen photo viewer
├── image-compression.js   # Photo compression
├── templates.js           # Quote templates
├── export.js              # PDF generation
├── import-export.js       # Backup/restore
├── theme.js               # Dark/Light theme
├── shortcuts.js           # Keyboard shortcuts
│
├── Performance & PWA
├── performance-monitor.js # Performance tracking
├── performance-utils.js   # Optimization utilities
├── lazy-loader.js         # Lazy loading (in development)
├── sw.js                  # Service Worker
├── sw-optimized.js        # Advanced caching (not in use)
│
├── CSS Files (~12 total)
├── app.css                # Main styles
├── invoice.css            # Invoice UI (25K - largest CSS)
├── validation.css         # Validation error styles
├── theme-light.css        # Light theme overrides
├── print.css              # PDF export styles
├── toast.css              # Toast notifications
├── [other CSS files]
│
├── tests/                 # Playwright test suite
│   ├── bootstrap.spec.js  # Module registration tests
│   ├── calculations.spec.js
│   ├── invoice-functional.spec.js
│   ├── invoice-interface.spec.js
│   ├── security.spec.js
│   ├── ui-interactions.spec.js
│   ├── wizards.spec.js
│   ├── check-errors.spec.js
│   ├── init-test.spec.js
│   ├── examples/          # Example tests
│   └── fixtures/          # Test fixtures
│
└── docs/                  # Documentation
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

<!-- 2. EARLY: Debug and Security (no defer) -->
<script src="debug.js"></script>
<script src="security.js"></script>
<script src="validation.js"></script>

<!-- 3. Core modules (with defer) -->
<script src="data.js" defer></script>
<script src="storage.js" defer></script>
<script src="calc.js" defer></script>
<script src="app.js" defer></script>

<!-- 4. UI and feature modules (with defer) -->
<script src="ui.js" defer></script>
<script src="wizard.js" defer></script>
<!-- ... other modules ... -->
<script src="invoice.js" defer></script>
```

**Why This Order?**
- `bootstrap.js` creates `window.APP` namespace - MUST be first
- `debug.js` and `security.js` have no dependencies - load early
- `validation.js` must load before `invoice.js`
- `app.js` depends on `calc.js`, `data.js`, `storage.js`
- Feature modules depend on core modules

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

#### theme.js (3.9K)

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
| Add new window type | `data.js` |
| Modify calculation logic | `calc.js` |
| Change state management | `app.js` |
| Update UI rendering | `ui.js` |
| Modify invoice system | `invoice.js` |
| Add validation rules | `validation.js` |
| Change security policies | `security.js` |
| Update PWA config | `manifest.json` |
| Modify offline caching | `sw.js` |
| Change test config | `playwright.config.js` |
| Update styles | `app.css`, `invoice.css`, etc. |
| Add keyboard shortcuts | `shortcuts.js` |

---

## Appendix

### Version History

- **v1.7.0** (Current) - Comprehensive documentation, CLAUDE.md created
- **v1.6.0** - Critical invoice bug fixes, validation integration
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

**Planning Documents:**
- `IMPROVEMENT_PLAN_V2.0.md` - Future roadmap
- `PRIORITY_MATRIX.md` - Feature prioritization
- `PHASE_1_COMPLETE.md` - Phase 1 summary
- `docs/MIGRATION_STRATEGY.md` - Cloud migration plan

### License

MIT License - 925 Pressure Glass

### Maintainer

**Gerard Varone** - 925 Pressure Glass
**Location:** Perth, Western Australia
**Project Phase:** Phase 2B - Invoice System Verification

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
