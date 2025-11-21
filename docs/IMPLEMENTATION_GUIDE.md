# TicTacStick WebApp Overhaul - Implementation Guide
## Detailed Technical Instructions for 12-Week Transformation

**Version:** 1.0  
**Last Updated:** November 21, 2025  
**Target Audience:** Developers, Technical Leads, QA Engineers  
**Prerequisite Reading:** [OVERHAUL_ROADMAP.md](../OVERHAUL_ROADMAP.md)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Phase 1: Foundation & Stability](#phase-1-foundation--stability)
3. [Phase 2: Core Feature Enhancement](#phase-2-core-feature-enhancement)
4. [Phase 3: Analytics & Business Intelligence](#phase-3-analytics--business-intelligence)
5. [Phase 4: GoHighLevel Integration](#phase-4-gohighlevel-integration)
6. [Phase 5: UI/UX Overhaul](#phase-5-uiux-overhaul)
7. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)
8. [Reference Architecture](#reference-architecture)
9. [Code Examples](#code-examples)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

#### Required Tools
```bash
# Node.js and npm
node -v  # Should be v18+
npm -v   # Should be v9+

# Git
git --version  # v2.30+

# Optional but recommended
python3 -m http.server --version  # For local testing
```

#### Development Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/925PRESSUREGLASS/webapp.git
cd webapp

# 2. Install dependencies
npm install

# 3. Verify setup
npm test  # Run test suite

# 4. Start development server
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

#### Environment Configuration

Create a `.env.local` file for local development (NEVER commit this):
```bash
# .env.local (DO NOT COMMIT)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_location_id
```

### Project Structure Overview

```
webapp/
├── index.html              # Main application entry point
├── app.js                  # Core application logic & state management
├── calc.js                 # Calculation engine
├── storage.js              # LocalStorage abstraction
├── ui.js                   # UI manipulation
│
├── invoice.js              # Invoicing system
├── client-database.js      # CRM functionality
├── analytics.js            # Analytics engine
├── ghl-*.js               # GoHighLevel integration modules
│
├── css/                    # Stylesheets
│   ├── design-system.css   # Design tokens & variables
│   └── ...
│
├── tests/                  # Playwright test suite
│   ├── quote-validation.spec.js
│   ├── invoice.spec.js
│   └── ...
│
├── docs/                   # Documentation
│   ├── IMPLEMENTATION_GUIDE.md  # This file
│   ├── DATABASE_SCHEMA.md
│   └── ...
│
├── .github/
│   └── workflows/          # CI/CD automation
│       ├── code-quality.yml
│       └── phase-automation.yml
│
└── package.json            # Project dependencies
```

### Development Workflow

#### Branch Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch for features
webappover    # Overhaul development branch

# Feature branches
feature/phase-1-testing
feature/phase-2-mobile-ux
feature/phase-3-analytics
```

#### Commit Convention
```bash
# Format: <type>: <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style (formatting, semicolons, etc)
refactor: # Code refactoring
test:     # Adding/updating tests
chore:    # Maintenance tasks

# Examples
git commit -m "feat: add advanced pricing calculator"
git commit -m "fix: resolve iOS Safari calculation bug"
git commit -m "docs: update implementation guide for Phase 2"
git commit -m "test: add invoice generation test cases"
```

---

## Phase 1: Foundation & Stability

**Duration:** Weeks 1-2 (November 21 - December 4, 2025)  
**Goal:** Achieve 80%+ test coverage, comprehensive error handling, security hardening

### Week 1: Testing & Error Handling

#### 1.1 Test Infrastructure Enhancement

**Objective:** Fix failing tests and achieve 80%+ pass rate

**Current State Analysis:**
```bash
# Run current tests to see failure patterns
npm test

# Analyze test output
# - 47 failing invoice tests
# - 35 flaky tests
# - Current pass rate: 54%
```

**Task 1: Fix Failing Invoice Tests**

Location: `tests/invoice.spec.js`

```javascript
// Example fix for invoice calculation test
test('should calculate GST correctly', function() {
  // BEFORE (failing due to precision issues)
  var subtotal = 1000.50;
  var gst = subtotal * 0.1;  // JavaScript floating point issue
  expect(gst).toBe(100.05);  // Fails due to 100.04999999999

  // AFTER (using integer arithmetic from calc.js)
  var subtotal = 100050;  // Store as cents
  var gst = APP.Calc.calculateGST(subtotal);
  expect(gst).toBe(10005);  // Precise integer arithmetic
  
  // Display value
  var gstDisplay = (gst / 100).toFixed(2);
  expect(gstDisplay).toBe('100.05');
});
```

**Task 2: Stabilize Flaky Tests**

Common causes of flaky tests:
1. **Timing Issues** - Add proper wait conditions
2. **State Leakage** - Reset state between tests
3. **Async Operations** - Ensure promises resolve

```javascript
// Example: Fix flaky autosave test
test('should autosave quote after changes', async function({ page }) {
  // BEFORE (flaky)
  await page.fill('#client-name', 'Test Client');
  await page.waitForTimeout(1000);  // Bad: arbitrary wait
  
  // AFTER (stable)
  await page.fill('#client-name', 'Test Client');
  
  // Wait for autosave indicator
  await page.waitForSelector('.autosave-indicator.saved', {
    state: 'visible',
    timeout: 5000
  });
  
  // Verify data persisted
  var savedData = await page.evaluate(function() {
    return localStorage.getItem('tictacstick_autosave_state_v1');
  });
  expect(JSON.parse(savedData).clientName).toBe('Test Client');
});
```

**Task 3: Add Test Fixtures**

Create reusable test data:

```javascript
// tests/fixtures/quote-data.js
var APP = APP || {};
APP.TestFixtures = {
  sampleQuote: {
    clientName: 'ABC Corporation',
    clientLocation: '123 Main St, Sydney NSW',
    quoteTitle: 'Office Window Cleaning',
    jobType: 'windows',
    windowLines: [
      {
        type: 'standard',
        count: 10,
        price: 15.00,
        highReach: false
      }
    ],
    pressureLines: [],
    subtotal: 15000,  // Cents
    gst: 1500,
    total: 16500
  },
  
  sampleInvoice: {
    invoiceNumber: 'INV-TEST-001',
    quoteId: 'Q-2025-TEST-001',
    clientName: 'ABC Corporation',
    total: 16500,
    amountPaid: 0,
    balance: 16500,
    status: 'sent',
    invoiceDate: Date.now(),
    dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000),  // 30 days
    payments: []
  },
  
  createSampleQuote: function(overrides) {
    return Object.assign({}, this.sampleQuote, overrides || {});
  }
};

// Usage in tests
var testQuote = APP.TestFixtures.createSampleQuote({
  clientName: 'Custom Client'
});
```

#### 1.2 Error Handling System

**Objective:** Replace console.log with centralized DEBUG module, add comprehensive error handling

**Task 1: Create Centralized DEBUG Module**

```javascript
// debug-enhanced.js
var APP = APP || {};

APP.DEBUG = (function() {
  var config = {
    enabled: true,  // Enable in development
    logLevel: 'info',  // debug, info, warn, error
    persist: true,  // Save to localStorage
    maxLogs: 1000
  };
  
  var levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  var logs = [];
  
  function log(level, module, message, data) {
    if (!config.enabled) return;
    if (levels[level] < levels[config.logLevel]) return;
    
    var logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      module: module,
      message: message,
      data: data,
      url: window.location.href
    };
    
    // Add to memory
    logs.push(logEntry);
    if (logs.length > config.maxLogs) {
      logs.shift();
    }
    
    // Persist to localStorage
    if (config.persist) {
      try {
        localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
      } catch (e) {
        // Storage quota exceeded
      }
    }
    
    // Console output with color
    var styles = {
      debug: 'color: #888',
      info: 'color: #2563eb',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #dc2626; font-weight: bold'
    };
    
    console.log(
      '%c[' + level.toUpperCase() + '] ' + module + ': ' + message,
      styles[level],
      data || ''
    );
  }
  
  return {
    debug: function(module, message, data) {
      log('debug', module, message, data);
    },
    
    info: function(module, message, data) {
      log('info', module, message, data);
    },
    
    warn: function(module, message, data) {
      log('warn', module, message, data);
    },
    
    error: function(module, message, data) {
      log('error', module, message, data);
      
      // Also log to error tracking service (Phase 6)
      if (window.Sentry) {
        Sentry.captureMessage(module + ': ' + message, {
          level: 'error',
          extra: data
        });
      }
    },
    
    getLogs: function() {
      return logs;
    },
    
    exportLogs: function() {
      var blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json'
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'debug-logs-' + Date.now() + '.json';
      a.click();
    },
    
    clearLogs: function() {
      logs = [];
      localStorage.removeItem('debug_logs');
    }
  };
})();

// Usage examples
APP.DEBUG.info('Calculator', 'Calculating quote total', { subtotal: 1000 });
APP.DEBUG.warn('Storage', 'LocalStorage nearly full', { usage: '85%' });
APP.DEBUG.error('Invoice', 'Failed to save invoice', { error: e.message });
```

**Task 2: Add Input Validation**

```javascript
// validation-enhanced.js
var APP = APP || {};

APP.Validation = (function() {
  // Validation rules
  var rules = {
    required: function(value) {
      return value !== null && value !== undefined && value !== '';
    },
    
    number: function(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    positiveNumber: function(value) {
      var num = parseFloat(value);
      return !isNaN(num) && isFinite(num) && num > 0;
    },
    
    email: function(value) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value);
    },
    
    phone: function(value) {
      // Australian phone format
      var re = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
      return re.test(value.replace(/\s/g, ''));
    },
    
    abn: function(value) {
      // Australian Business Number validation
      var abn = value.replace(/\s/g, '');
      if (abn.length !== 11) return false;
      
      var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
      var sum = 0;
      for (var i = 0; i < 11; i++) {
        var digit = parseInt(abn.charAt(i));
        if (i === 0) digit -= 1;
        sum += digit * weights[i];
      }
      return sum % 89 === 0;
    }
  };
  
  // Validate single field
  function validateField(value, validations) {
    var errors = [];
    
    for (var i = 0; i < validations.length; i++) {
      var validation = validations[i];
      var ruleName = validation.rule;
      var rule = rules[ruleName];
      
      if (!rule) {
        APP.DEBUG.warn('Validation', 'Unknown rule: ' + ruleName);
        continue;
      }
      
      if (!rule(value)) {
        errors.push(validation.message || 'Validation failed');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  // Validate entire form
  function validateForm(formData, schema) {
    var results = {};
    var isValid = true;
    
    for (var fieldName in schema) {
      if (schema.hasOwnProperty(fieldName)) {
        var fieldValue = formData[fieldName];
        var fieldValidations = schema[fieldName];
        var result = validateField(fieldValue, fieldValidations);
        
        results[fieldName] = result;
        if (!result.valid) {
          isValid = false;
        }
      }
    }
    
    return {
      valid: isValid,
      fields: results
    };
  }
  
  return {
    validateField: validateField,
    validateForm: validateForm,
    rules: rules  // Expose for custom rules
  };
})();

// Usage example
var quoteSchema = {
  clientName: [
    { rule: 'required', message: 'Client name is required' }
  ],
  clientEmail: [
    { rule: 'required', message: 'Email is required' },
    { rule: 'email', message: 'Invalid email format' }
  ],
  clientPhone: [
    { rule: 'phone', message: 'Invalid phone number' }
  ],
  total: [
    { rule: 'required', message: 'Total is required' },
    { rule: 'positiveNumber', message: 'Total must be positive' }
  ]
};

var formData = {
  clientName: 'ABC Corp',
  clientEmail: 'contact@abc.com',
  clientPhone: '0412345678',
  total: 1500
};

var validation = APP.Validation.validateForm(formData, quoteSchema);
if (!validation.valid) {
  APP.DEBUG.error('Form', 'Validation failed', validation.fields);
}
```

**Task 3: Storage Quota Error Handling**

```javascript
// storage-enhanced.js
var APP = APP || {};

APP.Storage = (function() {
  var QUOTA_WARNING_THRESHOLD = 0.75;  // 75%
  var QUOTA_ERROR_THRESHOLD = 0.90;    // 90%
  
  function checkQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, available: 5242880, percent: 0 };  // 5MB default
    }
    
    return navigator.storage.estimate().then(function(estimate) {
      var usage = estimate.usage || 0;
      var quota = estimate.quota || 5242880;
      var percent = usage / quota;
      
      return {
        usage: usage,
        quota: quota,
        percent: percent,
        usageMB: (usage / 1048576).toFixed(2),
        quotaMB: (quota / 1048576).toFixed(2)
      };
    });
  }
  
  function set(key, value) {
    try {
      var serialized = JSON.stringify(value);
      
      // Check if we have space
      checkQuota().then(function(quota) {
        if (quota.percent > QUOTA_ERROR_THRESHOLD) {
          APP.DEBUG.error('Storage', 'Storage quota exceeded', quota);
          APP.UI.showToast('Storage nearly full. Please cleanup old data.', 'error');
          return false;
        }
        
        if (quota.percent > QUOTA_WARNING_THRESHOLD) {
          APP.DEBUG.warn('Storage', 'Storage quota warning', quota);
          APP.UI.showToast('Storage is ' + Math.round(quota.percent * 100) + '% full', 'warning');
        }
      });
      
      localStorage.setItem(key, serialized);
      APP.DEBUG.debug('Storage', 'Saved: ' + key, { size: serialized.length });
      return true;
      
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        APP.DEBUG.error('Storage', 'Quota exceeded', { key: key, error: e });
        
        // Attempt cleanup
        cleanupOldData();
        
        // Try again
        try {
          localStorage.setItem(key, serialized);
          return true;
        } catch (e2) {
          APP.UI.showToast('Unable to save data. Storage full.', 'error');
          return false;
        }
      } else {
        APP.DEBUG.error('Storage', 'Save failed', { key: key, error: e });
        return false;
      }
    }
  }
  
  function get(key, defaultValue) {
    try {
      var item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (e) {
      APP.DEBUG.error('Storage', 'Get failed', { key: key, error: e });
      return defaultValue;
    }
  }
  
  function cleanupOldData() {
    APP.DEBUG.info('Storage', 'Starting cleanup');
    
    // Keep only last 50 quotes
    var quoteHistory = get('quote-history', []);
    if (quoteHistory.length > 50) {
      var kept = quoteHistory.slice(-50);
      set('quote-history', kept);
      APP.DEBUG.info('Storage', 'Cleaned quote history', {
        before: quoteHistory.length,
        after: kept.length
      });
    }
    
    // Similar cleanup for invoices, clients, etc.
  }
  
  return {
    set: set,
    get: get,
    checkQuota: checkQuota,
    cleanupOldData: cleanupOldData
  };
})();
```

#### 1.3 Security Hardening

**Task 1: Input Sanitization**

```javascript
// security-enhanced.js
var APP = APP || {};

APP.Security = (function() {
  // HTML escape
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  }
  
  // Sanitize object (recursive)
  function sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj !== null && typeof obj === 'object') {
      var sanitized = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
  
  // CSP violation reporting
  function reportCSPViolation(violation) {
    APP.DEBUG.error('Security', 'CSP violation', {
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      originalPolicy: violation.originalPolicy
    });
    
    // Send to monitoring service
    if (window.Sentry) {
      Sentry.captureMessage('CSP Violation', {
        level: 'warning',
        extra: violation
      });
    }
  }
  
  // Setup CSP reporting
  document.addEventListener('securitypolicyviolation', reportCSPViolation);
  
  return {
    escapeHtml: escapeHtml,
    sanitizeObject: sanitizeObject
  };
})();

// Usage
var userInput = "<script>alert('xss')</script>";
var safe = APP.Security.escapeHtml(userInput);
// Result: &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;
```

### Week 2: Performance & Code Quality

#### 2.1 Performance Optimization

**Task 1: Input Debouncing (Already Exists - Verify)**

```javascript
// Verify input-debounce-enhanced.js is working
// Test: Type rapidly in client name field
// Expected: Calculation only runs after typing stops
```

**Task 2: Lazy Loading**

```javascript
// lazy-loader-optimized.js
var APP = APP || {};

APP.LazyLoader = (function() {
  var loadedModules = {};
  var loadingModules = {};
  
  function loadModule(moduleName, scriptPath) {
    // Already loaded
    if (loadedModules[moduleName]) {
      APP.DEBUG.debug('LazyLoader', 'Module already loaded: ' + moduleName);
      return Promise.resolve();
    }
    
    // Currently loading
    if (loadingModules[moduleName]) {
      return loadingModules[moduleName];
    }
    
    // Start loading
    APP.DEBUG.info('LazyLoader', 'Loading module: ' + moduleName);
    
    var promise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = scriptPath;
      script.defer = true;
      
      script.onload = function() {
        loadedModules[moduleName] = true;
        delete loadingModules[moduleName];
        APP.DEBUG.info('LazyLoader', 'Module loaded: ' + moduleName);
        resolve();
      };
      
      script.onerror = function(error) {
        delete loadingModules[moduleName];
        APP.DEBUG.error('LazyLoader', 'Module load failed: ' + moduleName, error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
    
    loadingModules[moduleName] = promise;
    return promise;
  }
  
  // Load module when element becomes visible
  function loadOnVisible(moduleName, scriptPath, triggerSelector) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadModule(moduleName, scriptPath);
          observer.disconnect();
        }
      });
    });
    
    var element = document.querySelector(triggerSelector);
    if (element) {
      observer.observe(element);
    }
  }
  
  return {
    load: loadModule,
    loadOnVisible: loadOnVisible
  };
})();

// Usage
document.addEventListener('DOMContentLoaded', function() {
  // Load analytics when analytics tab is visible
  APP.LazyLoader.loadOnVisible('analytics', 'analytics.js', '#analytics-tab');
  
  // Load charts when needed
  document.querySelector('#show-charts-btn').addEventListener('click', function() {
    APP.LazyLoader.load('charts', 'charts.js').then(function() {
      APP.Charts.initialize();
    });
  });
});
```

---

## Phase 2: Core Feature Enhancement

**Duration:** Weeks 3-4 (December 5-18, 2025)

### Week 3: Advanced Calculations & Pricing

#### 3.1 Pricing Intelligence System

**Database Schema for Price History:**

```javascript
// price-history-schema.js
/*
LocalStorage Key: 'price-history'
Structure: Array of price records
*/
var priceHistorySchema = {
  id: 'string',               // UUID
  date: 'number',             // Timestamp
  serviceType: 'string',      // 'window', 'pressure', etc.
  surfaceType: 'string',      // Specific surface
  pricePerUnit: 'number',     // Price in cents
  quantity: 'number',         // Units quoted
  totalValue: 'number',       // Total in cents
  clientType: 'string',       // 'residential', 'commercial'
  location: 'string',         // Suburb/area
  won: 'boolean',             // Quote won/lost
  competitorPrice: 'number',  // If known, in cents
  notes: 'string'
};

// Example record
var priceRecord = {
  id: 'uuid-123',
  date: 1700000000000,
  serviceType: 'window',
  surfaceType: 'standard-window',
  pricePerUnit: 1500,  // $15.00
  quantity: 20,
  totalValue: 30000,   // $300.00
  clientType: 'commercial',
  location: 'Sydney CBD',
  won: true,
  competitorPrice: null,
  notes: 'Office building, regular client'
};
```

**Implementation:**

```javascript
// pricing-intelligence-enhanced.js
var APP = APP || {};

APP.PricingIntelligence = (function() {
  
  // Track price for future analysis
  function trackPrice(quote) {
    var priceHistory = APP.Storage.get('price-history', []);
    
    // Extract window prices
    (quote.windowLines || []).forEach(function(line) {
      priceHistory.push({
        id: generateUUID(),
        date: Date.now(),
        serviceType: 'window',
        surfaceType: line.type,
        pricePerUnit: Math.round(line.price * 100),
        quantity: line.count,
        totalValue: Math.round(line.price * line.count * 100),
        clientType: determineClientType(quote.clientName),
        location: extractLocation(quote.clientLocation),
        won: null,  // Will be updated when quote status changes
        competitorPrice: null,
        notes: quote.notes || ''
      });
    });
    
    // Extract pressure cleaning prices
    (quote.pressureLines || []).forEach(function(line) {
      priceHistory.push({
        id: generateUUID(),
        date: Date.now(),
        serviceType: 'pressure',
        surfaceType: line.surface,
        pricePerUnit: Math.round(line.rate * 100),
        quantity: line.area,
        totalValue: Math.round(line.total * 100),
        clientType: determineClientType(quote.clientName),
        location: extractLocation(quote.clientLocation),
        won: null,
        competitorPrice: null,
        notes: quote.notes || ''
      });
    });
    
    APP.Storage.set('price-history', priceHistory);
  }
  
  // Get price suggestions based on history
  function suggestPrice(serviceType, surfaceType, quantity, location) {
    var priceHistory = APP.Storage.get('price-history', []);
    
    // Filter relevant records
    var relevant = priceHistory.filter(function(record) {
      return record.serviceType === serviceType &&
             record.surfaceType === surfaceType &&
             record.won === true;  // Only successful quotes
    });
    
    if (relevant.length === 0) {
      return null;  // No historical data
    }
    
    // Calculate average, median, min, max
    var prices = relevant.map(function(r) { return r.pricePerUnit; });
    prices.sort(function(a, b) { return a - b; });
    
    var avg = prices.reduce(function(sum, p) { return sum + p; }, 0) / prices.length;
    var median = prices[Math.floor(prices.length / 2)];
    var min = prices[0];
    var max = prices[prices.length - 1];
    
    // Adjust for location (if sufficient data)
    var locationFactor = calculateLocationFactor(location, relevant);
    
    return {
      suggested: Math.round(median * locationFactor),
      range: {
        min: min,
        max: max,
        avg: Math.round(avg)
      },
      confidence: calculateConfidence(relevant.length),
      sampleSize: relevant.length
    };
  }
  
  function calculateLocationFactor(location, records) {
    var locationRecords = records.filter(function(r) {
      return r.location === location;
    });
    
    if (locationRecords.length < 3) {
      return 1.0;  // Not enough data
    }
    
    var locationAvg = locationRecords.reduce(function(sum, r) {
      return sum + r.pricePerUnit;
    }, 0) / locationRecords.length;
    
    var overallAvg = records.reduce(function(sum, r) {
      return sum + r.pricePerUnit;
    }, 0) / records.length;
    
    return locationAvg / overallAvg;
  }
  
  function calculateConfidence(sampleSize) {
    if (sampleSize >= 20) return 'high';
    if (sampleSize >= 10) return 'medium';
    if (sampleSize >= 5) return 'low';
    return 'very-low';
  }
  
  // Helper functions
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function determineClientType(clientName) {
    // Simple heuristic - enhance as needed
    var commercial = ['pty', 'ltd', 'inc', 'corp', 'company', 'office'];
    var name = clientName.toLowerCase();
    
    for (var i = 0; i < commercial.length; i++) {
      if (name.indexOf(commercial[i]) !== -1) {
        return 'commercial';
      }
    }
    return 'residential';
  }
  
  function extractLocation(address) {
    // Extract suburb from address
    // Simple implementation - enhance with geocoding API if needed
    var parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return 'Unknown';
  }
  
  return {
    trackPrice: trackPrice,
    suggestPrice: suggestPrice
  };
})();

// Usage
var suggestion = APP.PricingIntelligence.suggestPrice(
  'window',
  'standard-window',
  10,
  'Sydney CBD'
);

if (suggestion) {
  console.log('Suggested price: $' + (suggestion.suggested / 100).toFixed(2));
  console.log('Range: $' + (suggestion.range.min / 100).toFixed(2) + 
              ' - $' + (suggestion.range.max / 100).toFixed(2));
  console.log('Confidence: ' + suggestion.confidence);
}
```

### Week 4: Mobile UX & Offline Excellence

#### 4.1 Enhanced Service Worker

```javascript
// sw-phase2.js
var CACHE_VERSION = 'v2.0.0';
var CACHE_NAME = 'tictacstick-' + CACHE_VERSION;

var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/calc.js',
  '/storage.js',
  '/ui.js',
  '/app.css',
  '/manifest.json'
];

var LAZY_CACHE = [
  '/analytics.js',
  '/charts.js',
  '/invoice.js'
];

// Install - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate - cleanup old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch - network first, then cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Clone response for cache
        var responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(function() {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Background Sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-quotes') {
    event.waitUntil(syncQuotes());
  }
});

function syncQuotes() {
  // Get pending quotes from IndexedDB
  // Send to server
  // Mark as synced
  return Promise.resolve();
}
```

---

## Phase 3: Analytics & Business Intelligence

**Duration:** Weeks 5-6 (December 19, 2025 - January 1, 2026)

### Week 5: Analytics Dashboard

#### 5.1 Dashboard Component

```javascript
// analytics-dashboard-phase3.js
var APP = APP || {};

APP.AnalyticsDashboard = (function() {
  
  function initialize() {
    renderDashboard();
    setupEventListeners();
    startAutoRefresh();
  }
  
  function renderDashboard() {
    var quotes = APP.Storage.get('quote-history', []);
    var invoices = APP.Storage.get('invoice-database', []);
    
    var metrics = calculateMetrics(quotes, invoices);
    
    var html = '<div class="dashboard-container">' +
      '<div class="metrics-grid">' +
        renderMetricCard('Total Revenue', formatCurrency(metrics.totalRevenue), 'up', '12%') +
        renderMetricCard('Quotes This Month', metrics.quotesThisMonth, 'up', '8%') +
        renderMetricCard('Win Rate', metrics.winRate + '%', 'down', '2%') +
        renderMetricCard('Avg Quote Value', formatCurrency(metrics.avgQuoteValue), 'up', '5%') +
      '</div>' +
      '<div class="charts-grid">' +
        '<div class="chart-container">' +
          '<canvas id="revenue-chart"></canvas>' +
        '</div>' +
        '<div class="chart-container">' +
          '<canvas id="conversion-chart"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';
    
    document.querySelector('#dashboard').innerHTML = html;
    
    // Render charts
    renderRevenueChart(metrics.revenueByMonth);
    renderConversionChart(metrics.conversionFunnel);
  }
  
  function calculateMetrics(quotes, invoices) {
    var now = new Date();
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();
    
    // Filter this month's quotes
    var quotesThisMonth = quotes.filter(function(q) {
      var date = new Date(q.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    // Calculate total revenue
    var totalRevenue = invoices.reduce(function(sum, inv) {
      return sum + (inv.amountPaid || 0);
    }, 0);
    
    // Calculate win rate
    var sentQuotes = quotes.filter(function(q) { return q.quoteStatus === 'sent'; });
    var wonQuotes = quotes.filter(function(q) { return q.quoteStatus === 'won'; });
    var winRate = sentQuotes.length > 0 
      ? Math.round((wonQuotes.length / sentQuotes.length) * 100)
      : 0;
    
    // Average quote value
    var avgQuoteValue = quotes.length > 0
      ? quotes.reduce(function(sum, q) { return sum + q.total; }, 0) / quotes.length
      : 0;
    
    return {
      totalRevenue: totalRevenue,
      quotesThisMonth: quotesThisMonth.length,
      winRate: winRate,
      avgQuoteValue: avgQuoteValue,
      revenueByMonth: calculateRevenueByMonth(invoices),
      conversionFunnel: calculateConversionFunnel(quotes)
    };
  }
  
  function renderMetricCard(title, value, trend, change) {
    var trendIcon = trend === 'up' ? '↑' : '↓';
    var trendClass = trend === 'up' ? 'trend-up' : 'trend-down';
    
    return '<div class="metric-card">' +
      '<h3>' + title + '</h3>' +
      '<div class="metric-value">' + value + '</div>' +
      '<div class="metric-trend ' + trendClass + '">' +
        '<span class="trend-icon">' + trendIcon + '</span>' +
        '<span class="trend-value">' + change + '</span>' +
      '</div>' +
    '</div>';
  }
  
  return {
    initialize: initialize
  };
})();
```

---

## Phase 4: GoHighLevel Integration

**Duration:** Weeks 7-8 (January 2-15, 2026)

### Week 7: GHL Sync Engine

#### 7.1 Sync Infrastructure

**API Integration:**

```javascript
// ghl-sync-engine.js
var APP = APP || {};

APP.GHLSync = (function() {
  var config = {
    apiUrl: 'https://rest.gohighlevel.com/v1',
    apiKey: null,  // Set from config
    locationId: null
  };
  
  var syncQueue = [];
  var syncing = false;
  
  function initialize(apiKey, locationId) {
    config.apiKey = apiKey;
    config.locationId = locationId;
    
    APP.DEBUG.info('GHLSync', 'Initialized', { locationId: locationId });
    
    // Setup event listeners
    setupEventListeners();
    
    // Start sync interval
    setInterval(processSyncQueue, 30000);  // Every 30 seconds
  }
  
  function setupEventListeners() {
    // Sync when quote is saved
    document.addEventListener('quote-saved', function(e) {
      queueQuoteSync(e.detail.quote);
    });
    
    // Sync when invoice is created
    document.addEventListener('invoice-created', function(e) {
      queueInvoiceSync(e.detail.invoice);
    });
  }
  
  function queueQuoteSync(quote) {
    syncQueue.push({
      type: 'quote',
      action: 'create-opportunity',
      data: quote,
      timestamp: Date.now()
    });
    
    APP.DEBUG.info('GHLSync', 'Queued quote sync', { quoteId: quote.id });
  }
  
  function processSyncQueue() {
    if (syncing || syncQueue.length === 0) {
      return;
    }
    
    syncing = true;
    var item = syncQueue.shift();
    
    APP.DEBUG.info('GHLSync', 'Processing sync', item);
    
    if (item.type === 'quote') {
      syncQuoteToOpportunity(item.data)
        .then(function() {
          APP.DEBUG.info('GHLSync', 'Quote synced successfully');
        })
        .catch(function(error) {
          APP.DEBUG.error('GHLSync', 'Quote sync failed', error);
          // Re-queue with retry count
          if (!item.retries) item.retries = 0;
          if (item.retries < 3) {
            item.retries++;
            syncQueue.push(item);
          }
        })
        .finally(function() {
          syncing = false;
        });
    }
  }
  
  function syncQuoteToOpportunity(quote) {
    // 1. Create/update contact
    return createOrUpdateContact(quote)
      .then(function(contact) {
        // 2. Create/update opportunity
        return createOrUpdateOpportunity(quote, contact.id);
      });
  }
  
  function createOrUpdateContact(quote) {
    var contactData = {
      firstName: quote.clientName.split(' ')[0],
      lastName: quote.clientName.split(' ').slice(1).join(' ') || '',
      email: quote.clientEmail,
      phone: quote.clientPhone,
      address1: quote.clientLocation,
      tags: ['webapp-quote'],
      customFields: {
        quoteId: quote.id,
        quoteTotal: quote.total / 100
      }
    };
    
    return apiRequest('POST', '/contacts/', contactData);
  }
  
  function createOrUpdateOpportunity(quote, contactId) {
    var opportunityData = {
      name: quote.quoteTitle || 'Quote ' + quote.id,
      contactId: contactId,
      monetaryValue: quote.total / 100,
      status: mapQuoteStatusToGHL(quote.quoteStatus),
      pipelineId: config.locationId,
      customFields: {
        quoteId: quote.id,
        serviceType: quote.jobType
      }
    };
    
    return apiRequest('POST', '/opportunities/', opportunityData);
  }
  
  function mapQuoteStatusToGHL(quoteStatus) {
    var statusMap = {
      'draft': 'open',
      'sent': 'contacted',
      'won': 'won',
      'lost': 'lost',
      'completed': 'won'
    };
    return statusMap[quoteStatus] || 'open';
  }
  
  function apiRequest(method, endpoint, data) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, config.apiUrl + endpoint);
      xhr.setRequestHeader('Authorization', 'Bearer ' + config.apiKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('API request failed: ' + xhr.status));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(JSON.stringify(data));
    });
  }
  
  return {
    initialize: initialize,
    queueQuoteSync: queueQuoteSync
  };
})();
```

---

## Phase 5: UI/UX Overhaul

**Duration:** Weeks 9-10 (January 16-29, 2026)

### Week 9: Design System

#### 9.1 Design Tokens

```css
/* css/design-tokens.css */
:root {
  /* Color Palette - Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  
  /* Color Palette - Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Typography */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
  
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  
  /* Border Radius */
  --radius-sm: 0.125rem;  /* 2px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-Index Scale */
  --z-base: 1;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

---

## Reference Architecture

### Database Schema (LocalStorage)

**Complete schema documentation in `docs/localstorage-schema.md`**

Key collections:
- `tictacstick_autosave_state_v1` - Current quote state
- `tictacstick_saved_quotes_v1` - Named saved quotes
- `quote-history` - Historical quotes with status
- `client-database` - Customer registry
- `invoice-database` - Generated invoices
- `price-history` - Pricing intelligence data

### API Endpoints (Future Phase 3+ with Supabase)

```
POST   /api/quotes              Create quote
GET    /api/quotes/:id          Get quote
PUT    /api/quotes/:id          Update quote
DELETE /api/quotes/:id          Delete quote

POST   /api/invoices            Create invoice
GET    /api/invoices/:id        Get invoice
PUT    /api/invoices/:id/pay    Record payment

GET    /api/analytics/dashboard Dashboard metrics
GET    /api/analytics/revenue   Revenue data
```

---

## Troubleshooting

### Common Issues

**Issue: Tests failing with "page is not defined"**
```javascript
// Solution: Ensure Playwright fixture is properly imported
test('my test', async ({ page }) => {
  // page is now available
});
```

**Issue: LocalStorage quota exceeded**
```javascript
// Solution: Run cleanup
APP.StorageQuotaManager.cleanupOldData(90);  // Keep last 90 days
```

**Issue: iOS Safari arrow function error**
```javascript
// ❌ Wrong
const myFunc = () => { };

// ✅ Correct
var myFunc = function() { };
```

---

## Appendix

### A. Code Style Guide

See [AGENTS.md](../AGENTS.md) for complete coding standards.

### B. Testing Checklist

See [MANUAL_TESTING_GUIDE_v1.13.0.md](../MANUAL_TESTING_GUIDE_v1.13.0.md)

### C. Deployment Checklist

See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)

---

**Document Status:** Living document - updated throughout 12-week project  
**Feedback:** Open issues on GitHub for clarifications or improvements  
**Next Review:** Weekly during phase progress meetings
