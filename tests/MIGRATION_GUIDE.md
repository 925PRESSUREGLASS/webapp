# Test Fixtures Migration Guide

This guide will help you migrate your existing Playwright tests to use the new fixture infrastructure.

## Overview

The new fixture system provides:

- **Automatic APP initialization** - No more manual `waitForFunction()` calls
- **Data factories** - Create valid test objects with sensible defaults
- **Helper functions** - Common operations abstracted away
- **Custom matchers** - Domain-specific assertions
- **Pre-defined scenarios** - Reusable test data

## Quick Start

### Before (Old Way)

```javascript
const { test, expect } = require('@playwright/test');

test('creates quote with windows', async ({ page }) => {
  // Manual APP initialization
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.APP !== undefined);
  await page.waitForFunction(() => window.APP.initialized === true);

  // Manual test data creation
  await page.evaluate(() => {
    window.APP.modules.app.state = {
      jobSettings: {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        // ... many more fields
      },
      windowLines: [{
        id: 'win_test_1',
        type: 'standard_sliding',
        count: 8,
        // ... many more fields
      }]
    };
  });

  // Manual calculation
  const result = await page.evaluate(() => {
    return window.APP.modules.calc.calculateTotals(window.APP.modules.app.state);
  });

  // Manual assertions
  expect(result.total).toBeGreaterThan(0);
  expect(result.gst).toBeCloseTo(result.subtotal * 0.10, 2);
});
```

### After (New Way)

```javascript
const { test, expect } = require('./fixtures/test-base');
require('./fixtures/matchers');
const { createQuote, createWindowLine } = require('./fixtures/factories');

test('creates quote with windows', async ({ appReady, helpers }) => {
  // APP initialization is automatic via fixture

  // Use factory to create test data
  const quote = createQuote({
    windows: [
      createWindowLine({ count: 8 })
    ]
  });

  // Use helper for calculation
  const result = await helpers.calculateQuote(quote);

  // Use custom matchers
  expect(result).toHaveValidGST();
  expect(result).toHavePositiveTotals();
});
```

**Result: 30+ lines → 10 lines, much clearer intent!**

---

## Migration Steps

### Step 1: Update Imports

**Before:**
```javascript
const { test, expect } = require('@playwright/test');
```

**After:**
```javascript
const { test, expect } = require('./fixtures/test-base');
require('./fixtures/matchers'); // If using custom matchers
const { createQuote, createWindowLine, createPressureLine } = require('./fixtures/factories');
```

### Step 2: Update Test Signature

**Before:**
```javascript
test('my test', async ({ page }) => {
  // ...
});
```

**After:**
```javascript
test('my test', async ({ appReady, helpers }) => {
  // appReady is the page with APP initialized
  // helpers provides common operations
});
```

### Step 3: Remove Manual APP Initialization

**Before:**
```javascript
await page.goto('http://localhost:8080');
await page.waitForFunction(() => window.APP !== undefined);
await page.waitForFunction(() => window.APP.initialized === true);
```

**After:**
```javascript
// Nothing! The appReady fixture handles this automatically
```

### Step 4: Replace Inline Data with Factories

**Before:**
```javascript
await page.evaluate(() => {
  window.APP.modules.app.state = {
    jobSettings: {
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      clientPhone: '+61412345678',
      propertyAddress: '123 Test St',
      jobType: 'residential',
      urgency: 'standard',
      season: 'regular'
    },
    windowLines: [{
      id: 'win_1',
      type: 'standard_sliding',
      count: 8,
      width: 120,
      height: 150,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1,
      hasScreens: false,
      hasGrids: false
    }],
    pressureLines: [],
    appliedModifiers: {
      seasonalMultiplier: 1.0,
      customerTypeDiscount: 0.0,
      rushPremiumPercent: 0
    }
  };
});
```

**After:**
```javascript
const quote = createQuote({
  windows: [
    createWindowLine({ count: 8 })
  ]
});
```

### Step 5: Replace page.evaluate() with Helpers

**Before:**
```javascript
const result = await page.evaluate(() => {
  return window.APP.modules.calc.calculateTotals(window.APP.modules.app.state);
});
```

**After:**
```javascript
const result = await helpers.calculateQuote(quote);
```

### Step 6: Use Custom Matchers

**Before:**
```javascript
expect(result.total).toBeGreaterThan(0);
expect(result.gst).toBeCloseTo(result.subtotal * 0.10, 2);
expect(result.subtotal + result.gst).toBeCloseTo(result.total, 2);
```

**After:**
```javascript
expect(result).toHaveValidGST();
expect(result).toHavePositiveTotals();
```

---

## Common Patterns

### Pattern 1: Using Pre-defined Scenarios

Instead of creating test data from scratch, use pre-defined scenarios:

```javascript
const { STANDARD_4X2_HOUSE, HIGH_REACH_JOB, MINIMUM_CHARGE_JOB } = require('./fixtures/test-data');

test('standard house', async ({ appReady, helpers }) => {
  const result = await helpers.calculateQuote(STANDARD_4X2_HOUSE());
  expect(result).toHaveValidGST();
});
```

**Note:** Pre-defined scenarios are functions, so call them with `()`.

### Pattern 2: Customizing Factory Data

Override only the fields you care about:

```javascript
const quote = createQuote({
  jobSettings: {
    clientName: 'Custom Name' // Override just this field
  },
  windows: [
    createWindowLine({ count: 10, type: 'awning_casement' })
  ]
});
```

### Pattern 3: Invoice Workflow

**Before:**
```javascript
const invoice = {
  invoiceId: 'INV-001',
  clientName: 'Test',
  status: 'draft',
  subtotal: 500,
  gst: 50,
  total: 550,
  amountPaid: 0,
  amountDue: 550,
  lineItems: [
    { description: 'Service', quantity: 5, unitPrice: 100, lineTotal: 500 }
  ],
  payments: []
};
```

**After:**
```javascript
const invoice = createInvoice({
  lineItems: [
    createLineItem({ description: 'Service', quantity: 5, unitPrice: 100 })
  ]
});
// Totals calculated automatically!
```

### Pattern 4: Quote History

**Before:**
```javascript
await page.evaluate((name) => {
  return window.APP.modules.app.saveQuoteToHistory(name);
}, 'Test Quote');

const history = await page.evaluate(() => {
  return window.APP.modules.storage.get('quote-history') || [];
});
```

**After:**
```javascript
await helpers.saveQuote('Test Quote');
const history = await helpers.getQuoteHistory();
```

---

## Migration Checklist

For each test file:

- [ ] Update imports to use `test-base.js`
- [ ] Import required factories
- [ ] Import matchers if using custom assertions
- [ ] Change `{ page }` to `{ appReady, helpers }`
- [ ] Remove manual APP initialization code
- [ ] Replace inline test data with factories
- [ ] Replace `page.evaluate()` calls with helpers
- [ ] Use custom matchers where appropriate
- [ ] Consider using pre-defined scenarios
- [ ] Remove redundant code
- [ ] Run test to verify it still passes

---

## Complete Migration Example

### Before: 60 lines, hard to maintain

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Quote Calculations', () => {
  test('calculates residential quote correctly', async ({ page }) => {
    // Initialize APP
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.APP !== undefined, { timeout: 5000 });
    await page.waitForFunction(() => window.APP.initialized === true, { timeout: 5000 });
    await page.waitForFunction(() => {
      const required = ['storage', 'app', 'calc', 'ui', 'invoice'];
      return required.every(mod => window.APP.modules[mod]);
    });

    // Create test data
    await page.evaluate(() => {
      window.APP.modules.app.state = {
        jobSettings: {
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          clientPhone: '+61412345678',
          propertyAddress: '123 Test St, Perth WA 6000',
          jobType: 'residential',
          urgency: 'standard',
          season: 'regular'
        },
        windowLines: [{
          id: 'win_test_1',
          type: 'standard_sliding',
          count: 8,
          width: 120,
          height: 150,
          paneConfig: 'both',
          condition: 'standard',
          accessType: 'ground',
          storey: 1,
          hasScreens: false,
          hasGrids: false,
          notes: ''
        }],
        pressureLines: [{
          id: 'prs_test_1',
          surfaceType: 'driveway_concrete',
          materialType: 'concrete',
          area: 45.5,
          condition: 'standard',
          stainingType: [],
          slope: 'level',
          drainageQuality: 'good',
          waterAccess: 'onsite',
          hoseRunDistance: 15,
          notes: ''
        }],
        appliedModifiers: {
          seasonalMultiplier: 1.0,
          customerTypeDiscount: 0.0,
          rushPremiumPercent: 0
        }
      };
    });

    // Run calculation
    const result = await page.evaluate(() => {
      return window.APP.modules.calc.calculateTotals(window.APP.modules.app.state);
    });

    // Assertions
    expect(result.total).toBeGreaterThan(0);
    expect(result.gst).toBeCloseTo(result.subtotal * 0.10, 2);
    expect(result.subtotal + result.gst).toBeCloseTo(result.total, 2);
    expect(result.windowTotal).toBeGreaterThan(0);
    expect(result.pressureTotal).toBeGreaterThan(0);
  });
});
```

### After: 20 lines, clear and maintainable

```javascript
const { test, expect } = require('./fixtures/test-base');
require('./fixtures/matchers');
const { createQuote, createWindowLine, createPressureLine } = require('./fixtures/factories');

test.describe('Quote Calculations', () => {
  test('calculates residential quote correctly', async ({ appReady, helpers }) => {
    const quote = createQuote({
      windows: [
        createWindowLine({ count: 8 })
      ],
      pressure: [
        createPressureLine({ area: 45.5 })
      ]
    });

    const result = await helpers.calculateQuote(quote);

    expect(result).toHaveValidGST();
    expect(result).toHavePositiveTotals();
    expect(result.windowTotal).toBeGreaterThan(0);
    expect(result.pressureTotal).toBeGreaterThan(0);
  });
});
```

---

## Best Practices

### 1. Use Pre-defined Scenarios When Possible

```javascript
// Good: Uses pre-defined scenario
const result = await helpers.calculateQuote(STANDARD_4X2_HOUSE());

// Less ideal: Creates custom data for common scenario
const quote = createQuote({ windows: [...], pressure: [...] });
```

### 2. Only Override What You Need

```javascript
// Good: Override only relevant fields
const quote = createQuote({
  windows: [createWindowLine({ count: 10 })]
});

// Bad: Specifying all defaults manually
const quote = createQuote({
  jobSettings: { clientName: 'Test', email: 'test@test.com', phone: '...', ... },
  windows: [createWindowLine({ id: '...', type: '...', count: 10, ... })]
});
```

### 3. Use Custom Matchers for Domain Logic

```javascript
// Good: Uses custom matcher
expect(result).toHaveValidGST();

// Less ideal: Manual assertion
expect(result.gst).toBeCloseTo(result.subtotal * 0.10, 2);
```

### 4. Group Related Imports

```javascript
// Good organization
const { test, expect } = require('./fixtures/test-base');
require('./fixtures/matchers');
const { createQuote, createWindowLine } = require('./fixtures/factories');
const { STANDARD_4X2_HOUSE } = require('./fixtures/test-data');
```

---

## Troubleshooting

### Issue: Test fails with "APP is not defined"

**Solution:** Make sure you're using `{ appReady, helpers }` not `{ page }`:

```javascript
// Wrong
test('my test', async ({ page }) => { ... });

// Correct
test('my test', async ({ appReady, helpers }) => { ... });
```

### Issue: Custom matchers not working

**Solution:** Import the matchers file:

```javascript
require('./fixtures/matchers');
```

### Issue: Test data has missing fields

**Solution:** Check that factories are generating all required fields. You can inspect:

```javascript
const quote = createQuote({ windows: [createWindowLine()] });
console.log(JSON.stringify(quote, null, 2));
```

### Issue: Need to use page directly for UI interactions

**Solution:** You can still access the page through `appReady`:

```javascript
test('UI interaction', async ({ appReady, helpers }) => {
  await appReady.click('#my-button');
  await appReady.fill('#input', 'value');
});
```

### Issue: Tests running slowly

**Solution:** The `cleanState` fixture clears storage before each test. If you need faster tests, you can skip it by not using auto fixtures, but this may cause test pollution.

---

## Advanced Usage

### Creating New Factories

If you need a factory for a new domain object:

```javascript
// In factories.js
function createMyObject(overrides = {}) {
  const defaults = {
    field1: 'default',
    field2: 42,
    // ...
  };

  return { ...defaults, ...overrides };
}

module.exports = {
  // ... existing exports
  createMyObject
};
```

### Creating New Matchers

```javascript
// In matchers.js
expect.extend({
  toMatchMyCondition(received, expected) {
    const pass = /* your logic */;

    return {
      pass,
      message: () => pass
        ? 'Success message'
        : 'Failure message'
    };
  }
});
```

### Creating New Helpers

```javascript
// In helpers.js, inside createHelpers function
return {
  // ... existing helpers
  myNewHelper: async (args) => {
    return await page.evaluate((a) => {
      // Your logic
    }, args);
  }
};
```

---

## Next Steps

1. Start with a simple test file (e.g., one that only does calculations)
2. Migrate it using this guide
3. Run the test to verify it works
4. Continue with more complex tests
5. As you find common patterns, add them to test-data.js

**Remember:** The goal is to make tests:
- Faster to write
- Easier to read
- Simpler to maintain
- More reliable

If a fixture doesn't help with these goals, you don't have to use it!

---

## Questions?

See the example tests in `tests/examples/` for more patterns and usage examples.
