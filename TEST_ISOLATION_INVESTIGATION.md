# Test Isolation Investigation - Session 2

**Date:** November 22, 2025  
**Issue:** Tests pass individually (100%) but fail in sequence (~50%)  
**Status:** Isolated browser contexts implemented - NO IMPROVEMENT

## Hypothesis Testing

### Hypothesis 1: State Persistence Between Tests
**Theory:** Browser context state leaks between tests  
**Test:** Implement fresh browser context per test  
**Result:** ❌ FAILED - Pass rate unchanged  
**Conclusion:** State persistence is NOT the root cause

### Hypothesis 2: localStorage Pollution
**Theory:** localStorage data persists between tests  
**Test:** Clear localStorage in beforeEach + isolated contexts  
**Result:** ❌ FAILED - Pass rate unchanged  
**Conclusion:** localStorage pollution is NOT the root cause

### Hypothesis 3: Autosave Interference
**Theory:** Autosave timer saves data between tests  
**Test:** Disable autosave in test mode  
**Result:** ❌ FAILED - Pass rate unchanged  
**Conclusion:** Autosave is NOT the root cause

## Current Evidence

### What We Know
1. ✅ Tests pass 100% when run individually
2. ✅ Tests pass ~50% when run in sequence
3. ✅ Isolated contexts don't help
4. ✅ localStorage clearing doesn't help
5. ✅ Autosave disabled doesn't help

### What This Tells Us
The issue is NOT:
- Between-test state leakage
- Browser context sharing
- localStorage pollution
- Autosave interference

The issue MUST BE:
- Something about test execution order
- Something within the test suite itself
- Something about how tests interact with the app

## Detailed Test Analysis

### Storage Module Tests
**Total:** 19 tests  
**Passing:** 10  
**Failing:** 9

**Pattern of Failures:**
All failing tests expect "empty" or "null" results:
- `should return null for non-existent state`
- `should return empty array for non-existent presets`
- `should return empty array for non-existent quotes`
- `should handle corrupted state gracefully` (expects null)
- `should handle corrupted presets gracefully` (expects [])
- `should not crash on quota exceeded`
- `should preserve complex nested objects`
- `should handle empty/null values`
- `should use correct key for presets`

### Critical Insight
**All failing tests are "negative" tests** - they test for absence of data or error conditions.  
**All passing tests are "positive" tests** - they test for presence of expected data.

This suggests: **Data is persisting when it shouldn't be**

But we've ruled out:
- State persistence between tests ✅
- localStorage pollution ✅

So where is the data coming from?

## New Theory

### Theory: Test Order Dependencies

**Observation:** Negative tests fail when run after positive tests  
**Hypothesis:** Tests are ordered sequentially and share execution context

**Test Pattern:**
1. Test 1: "should save and load state" - PASSES (saves data)
2. Test 2: "should return null for non-existent state" - FAILS (finds data!)

Even with isolated contexts and localStorage.clear(), test 2 finds data.

### Possible Explanations

1. **beforeEach Timing Issue**
   - beforeEach clears localStorage
   - BUT app already initialized and loaded state before clear
   - App has in-memory state that doesn't get reset

2. **Module-Level State**
   - JavaScript modules are loaded once
   - Module-level variables persist across page reloads
   - Even with new context, modules might share state

3. **Service Worker**
   - Despite blocking SW registration
   - SW might cache responses or state
   - Cache might persist across contexts

## Next Investigation Steps

### Step 1: Test In-Memory State Theory
Try adding `location.reload()` AFTER clearing localStorage in beforeEach to force fresh load

### Step 2: Test Module State Theory
Check if JavaScript modules have static/global state that persists

### Step 3: Test Execution Order Theory
Try running tests in reverse order to see if results change

### Step 4: Examine beforeEach Timing
Add logging to see exact timing of:
- beforeEach start
- localStorage.clear()
- App initialization
- Test execution

## Recommendations

Based on evidence, the issue is likely:
1. **In-memory state in app.js** that doesn't reset between tests
2. **beforeEach timing** - clearing storage after app loads state
3. **Module-level state** that persists despite isolated contexts

**Best Solution:** Add explicit reset mechanism to app modules or reload page AFTER clearing storage in beforeEach.
