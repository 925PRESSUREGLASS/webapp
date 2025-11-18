# Manual Test Suites
## TicTacStick v1.9.0

**Purpose:** Browser-based manual testing tools for production readiness verification

---

## Overview

These manual test suites run directly in the browser console and verify core functionality without requiring test frameworks (ES5-compatible, iOS Safari friendly).

### Test Files

1. **pricing-tests.js** - Pricing calculation accuracy
2. **storage-tests.js** - LocalStorage operations
3. **performance-tests.js** - Performance benchmarking

---

## How to Use

### Step 1: Enable Test Scripts

Edit `index.html` and uncomment the test script includes:

```html
<!-- TESTING SCRIPTS (uncomment for testing) -->
<script src="tests/manual/pricing-tests.js" defer></script>
<script src="tests/manual/storage-tests.js" defer></script>
<script src="tests/manual/performance-tests.js" defer></script>
```

### Step 2: Open App in Browser

1. Open TicTacStick in Safari (iOS or Desktop)
2. Open JavaScript console:
   - **iOS Safari:** Settings → Safari → Advanced → Web Inspector
   - **Desktop Safari:** Develop → Show JavaScript Console
   - **Chrome:** View → Developer → JavaScript Console

### Step 3: Run Tests

In the console, run:

```javascript
// Run all pricing tests
PricingTests.runAll();

// Run all storage tests
StorageTests.runAll();

// Run all performance tests
PerformanceTests.runAll();

// Export results
PricingTests.exportResults();
StorageTests.listAllAppData();
PerformanceTests.exportResults();
```

---

## Test Suites

### 1. Pricing Tests (pricing-tests.js)

**What it tests:**
- Money.toCents() / fromCents() conversions
- Money.sumCents() calculations
- Money.multiplyDollars() accuracy
- Time.hoursToMinutes() / minutesToHours()
- GST calculations (10%)
- Minimum charge application
- Floating-point edge cases

**How to run:**
```javascript
PricingTests.runAll();
```

**Expected output:**
```
========================================
  PRICING CALCULATOR TEST SUITE
========================================
  Run Date: [timestamp]
========================================

--- Testing Money.toCents ---
✓ PASS: Convert $19.99 to cents
✓ PASS: Convert $0.01 to cents
✓ PASS: Convert $100 to cents
✓ PASS: Convert $0 to cents

[... more tests ...]

========================================
  TEST RESULTS
========================================
Passed: 40 / 40
Failed: 0
Success Rate: 100.0%

🎉 ALL TESTS PASSED! 🎉
Pricing calculations are accurate and reliable.
```

**Export results:**
```javascript
PricingTests.exportResults(); // Downloads CSV
```

---

### 2. Storage Tests (storage-tests.js)

**What it tests:**
- LocalStorage availability
- Save and retrieve operations
- Storage quota usage
- Data corruption handling
- Large data handling
- Concurrent access
- Key naming conventions

**How to run:**
```javascript
StorageTests.runAll();
```

**Expected output:**
```
========================================
  STORAGE TEST SUITE
========================================
  Run Date: [timestamp]
========================================

--- Testing LocalStorage Availability ---
✓ PASS: LocalStorage Available - Can read and write

--- Testing Save/Retrieve ---
✓ PASS: Save Data - Data saved to localStorage
✓ PASS: Retrieve Data - Data retrieved correctly
✓ PASS: Cleanup - Test data removed

[... more tests ...]

========================================
  STORAGE TEST RESULTS
========================================
Passed: 7 / 7
Failed: 0
Success Rate: 100.0%

🎉 ALL STORAGE TESTS PASSED! 🎉
LocalStorage is working correctly.
```

**Useful commands:**
```javascript
StorageTests.listAllAppData();      // List all app data
StorageTests.testStorageQuota();    // Check storage usage
StorageTests.clearAllAppData();     // ⚠️ Clear all data (use with caution!)
```

---

### 3. Performance Tests (performance-tests.js)

**What it tests:**
- Money calculation speed
- Time calculation speed
- LocalStorage read/write speed
- DOM manipulation performance
- Array operations speed
- JSON stringify/parse speed
- String operations speed
- Memory usage (Chrome/Edge only)

**How to run:**
```javascript
PerformanceTests.runAll();
```

**Expected output:**
```
========================================
  PERFORMANCE TEST SUITE
========================================
  Run Date: [timestamp]
  User Agent: [browser info]
========================================

--- Benchmarking: Money Calculations ---
Iterations: 1000
Average: 0.15ms
Median: 0.12ms
Min: 0.10ms
Max: 2.30ms
Std Dev: 0.18ms
✓ PASS: Performance acceptable (avg < 100ms)

[... more tests ...]

--- Memory Usage ---
Used: 12.45 MB
Total: 15.20 MB
Limit: 2048.00 MB
Usage: 0.6%
✓ Memory usage acceptable

========================================
  PERFORMANCE RESULTS
========================================
Passed: 8 / 8
Failed: 0
Success Rate: 100.0%

🎉 ALL PERFORMANCE TESTS PASSED! 🎉
App performance is excellent.
```

**Useful commands:**
```javascript
PerformanceTests.benchmark('Custom Test', function() {
    // Your code here
}, 100);

PerformanceTests.measureMemoryUsage();
PerformanceTests.exportResults();     // Download CSV
```

---

## Pre-Deployment Testing

### Complete Test Run

Run all tests before deploying:

```javascript
// 1. Pricing accuracy
var pricingResults = PricingTests.runAll();

// 2. Storage reliability
var storageResults = StorageTests.runAll();

// 3. Performance benchmarks
var perfResults = PerformanceTests.runAll();

// 4. Check results
if (pricingResults.filter(r => !r.passed).length === 0 &&
    storageResults.filter(r => !r.passed).length === 0 &&
    perfResults.benchmarks.filter(r => !r.passed).length === 0) {
    console.log('✅ ALL TESTS PASSED - READY TO DEPLOY!');
} else {
    console.error('❌ SOME TESTS FAILED - DO NOT DEPLOY');
}
```

### Acceptance Criteria

**All tests must pass before production deployment:**

- ✅ Pricing tests: 100% pass rate
- ✅ Storage tests: 100% pass rate
- ✅ Performance tests: 100% pass rate (avg <100ms)
- ✅ Memory usage: <70% of limit
- ✅ Storage usage: <75% of quota

---

## Troubleshooting

### Tests Not Loading

**Problem:** Test objects not available in console

**Solution:**
1. Ensure test scripts are uncommented in `index.html`
2. Reload the page
3. Wait for console message: `[PRICING-TESTS] Manual test suite loaded`

### Tests Failing

**Problem:** Some tests fail unexpectedly

**Solutions:**
1. Check browser console for errors
2. Clear localStorage and retry: `localStorage.clear()`
3. Test in incognito/private mode
4. Verify iOS Safari version (12+ required)

### Performance Tests Slow

**Problem:** Performance tests show slow results

**Solutions:**
1. Close other apps/tabs
2. Ensure device isn't in low-power mode
3. Test on multiple devices
4. Check if device is overheating

### Storage Tests Fail on iOS

**Problem:** Storage quota errors on iOS

**Solutions:**
1. Check Settings → Safari → Clear History and Website Data
2. Increase available storage on device
3. Export and clear old quote data

---

## Development Workflow

### Adding New Tests

1. Open relevant test file (`pricing-tests.js`, etc.)
2. Add new test function following existing pattern:

```javascript
function testNewFeature() {
    console.log('\n--- Testing New Feature ---');

    // Arrange
    var input = 123;

    // Act
    var result = newFeatureFunction(input);

    // Assert
    assertEqual(result, expectedValue, 'New feature works correctly');
}
```

3. Add to `runAll()` function:

```javascript
function runAll() {
    // ... existing tests ...
    testNewFeature();
    // ... summary ...
}
```

### Best Practices

1. **Keep tests simple** - One assertion per test
2. **Use descriptive names** - `testGSTCalculation()` not `test3()`
3. **Clean up after tests** - Remove test data from localStorage
4. **Test edge cases** - Zero values, negatives, very large numbers
5. **Document expectations** - Add comments explaining why

---

## Integration with Other Tools

### Deployment Helper

Run tests as part of deployment checklist:

```javascript
// In deployment-helper.js
DeploymentHelper.runPreDeploymentChecks();

// Then run manual tests
PricingTests.runAll();
StorageTests.runAll();
PerformanceTests.runAll();
```

### Health Check

Health check can reference test results:

```javascript
// After deployment
HealthCheck.runHealthCheck();

// Compare with pre-deployment test results
```

### Bug Tracker

Report failed tests as bugs:

```javascript
var results = PricingTests.runAll();
var failed = results.filter(function(r) { return !r.passed; });

if (failed.length > 0) {
    BugTracker.report(
        'Pricing test failures',
        failed.length + ' pricing tests failed',
        BugTracker.SEVERITY.HIGH,
        ['Run PricingTests.runAll()', 'Review failed tests']
    );
}
```

---

## CI/CD Integration (Future)

While these are manual tests for now, they can be integrated with automated CI/CD in the future:

```bash
# Playwright can execute these in browser context
npx playwright test --grep "manual-tests"
```

---

## Support

### Questions or Issues?

1. Check test file comments for details
2. Review `CLAUDE.md` for coding standards
3. Check `PROJECT_STATE.md` for architecture
4. Report bugs via `BugTracker.report()`

### Contributing

To add new test suites:

1. Follow ES5 syntax (no arrow functions, const, let, etc.)
2. Use IIFE module pattern
3. Attach to `window` object
4. Log initialization message
5. Include export functionality
6. Document in this README

---

## Version History

- **v1.9.0** - Initial manual test suite creation
  - Pricing tests (40+ assertions)
  - Storage tests (7 test scenarios)
  - Performance tests (8 benchmarks)

---

## License

Part of TicTacStick Quote Engine
© 2024 925 Pressure Glass
MIT License

---

**Remember:** Always run tests before deploying to production! 🚀
