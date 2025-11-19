# Bug Fix Workflow
**Version:** 1.0.0
**Last Updated:** 2025-11-18

Multi-agent orchestrated workflow for systematic bug fixing with automated documentation.

---

## Overview

This workflow coordinates multiple specialized agents to fix bugs efficiently while maintaining code quality, test coverage, and comprehensive documentation.

**Workflow Duration:** 30-90 minutes (depending on bug complexity)
**Agents Involved:** 3-4 (code-reviewer, test-runner, refactoring-architect, documentation-writer)
**Success Rate Target:** > 95%

---

## Workflow Stages

```
Bug Reported
    ↓
[1] Analysis (@code-reviewer)
    ↓
[2] Test Creation (@test-runner)
    ↓
[3] Implementation (@code-reviewer or @refactoring-architect)
    ↓
[4] Validation (@test-runner)
    ↓
[5] Documentation (@documentation-writer)
    ↓
Bug Fixed & Documented
```

---

## Stage 1: Bug Analysis

**Agent:** `@code-reviewer`
**Duration:** 10-15 minutes
**Tools:** Read, Grep, Glob, Bash

### Inputs
- Bug report (from GitHub issue, user report, or discovery)
- Steps to reproduce
- Expected vs actual behavior
- Affected version

### Tasks
1. **Read bug report** from issue tracker or `.claude/memory.json`
2. **Identify affected files**
   ```bash
   # Search for relevant code
   grep -rn "functionName" *.js
   grep -rn "className" *.js
   ```
3. **Analyze root cause**
   - Read affected files
   - Trace execution flow
   - Identify faulty logic
   - Check for similar issues elsewhere
4. **Assess severity and impact**
   - Critical: Breaks core functionality
   - High: Significant feature impairment
   - Medium: Minor feature issue
   - Low: Cosmetic or edge case
5. **Document findings** in `.claude/memory.json`

### Outputs
```json
{
  "analysis": {
    "bugId": "BUG-XXX",
    "severity": "high",
    "affectedFiles": ["file1.js", "file2.js"],
    "rootCause": "Description of the underlying issue",
    "proposedFix": "High-level approach to fix",
    "estimatedTime": 30
  }
}
```

### Handoff Criteria
- ✅ Root cause identified
- ✅ Affected files listed
- ✅ Fix approach proposed
- ✅ Findings written to memory.json

**→ Handoff to:** `@test-runner`

---

## Stage 2: Test Creation

**Agent:** `@test-runner`
**Duration:** 10-20 minutes
**Tools:** Read, Edit, Bash

### Inputs
- Bug analysis from Stage 1 (via memory.json or communication.json)
- Bug reproduction steps
- Expected behavior

### Tasks
1. **Read analysis** from `.claude/memory.json`
2. **Create failing test** that reproduces the bug
   ```javascript
   // In tests/bug-fixes.spec.js or relevant test file
   test('BUG-XXX: should handle edge case correctly', async ({ page }) => {
     // Setup
     await page.goto('http://localhost:8080');

     // Reproduce bug
     await page.fill('#input', 'problematic value');
     await page.click('#submit');

     // Assert expected behavior (this should fail initially)
     const result = await page.textContent('#result');
     expect(result).toBe('expected value');
   });
   ```
3. **Verify test fails** (confirms bug exists)
   ```bash
   npm test -- tests/bug-fixes.spec.js
   # Expected: Test fails, confirming bug
   ```
4. **Document test** in memory.json

### Outputs
```json
{
  "test": {
    "bugId": "BUG-XXX",
    "testFile": "tests/bug-fixes.spec.js",
    "testName": "should handle edge case correctly",
    "status": "failing",
    "errorMessage": "Expected 'expected value' but got 'wrong value'"
  }
}
```

### Handoff Criteria
- ✅ Test created and failing
- ✅ Test reproduces bug reliably
- ✅ Test documents expected behavior
- ✅ Test written to memory.json

**→ Handoff to:** `@code-reviewer` or `@refactoring-architect` (based on fix complexity)

---

## Stage 3: Bug Fix Implementation

**Agent:** `@code-reviewer` (simple fixes) or `@refactoring-architect` (requires refactoring)
**Duration:** 15-40 minutes
**Tools:** Read, Edit, Grep

### Inputs
- Bug analysis from Stage 1
- Failing test from Stage 2
- Code to modify

### Tasks
1. **Read test and analysis** from memory.json
2. **Implement fix** following ES5 constraints
   ```javascript
   // Example fix in affected file
   function problematicFunction(input) {
     // OLD CODE (buggy):
     // return input.value;

     // NEW CODE (fixed):
     // Add null check and validation
     if (!input || typeof input.value === 'undefined') {
       console.warn('[MODULE] Invalid input');
       return null;
     }
     return input.value;
   }
   ```
3. **Verify ES5 compliance**
   ```bash
   grep -n "const\|let\|=>" modified-file.js
   # Expected: No matches
   ```
4. **Run test to verify fix**
   ```bash
   npm test -- tests/bug-fixes.spec.js
   # Expected: Test passes
   ```
5. **Check for regressions**
   ```bash
   npm test
   # Expected: All tests pass
   ```
6. **Update memory.json** with fix details

### Outputs
```json
{
  "fix": {
    "bugId": "BUG-XXX",
    "fixedFiles": ["file1.js"],
    "linesChanged": 5,
    "approach": "Added null check and input validation",
    "testsPassing": true,
    "regressions": 0
  }
}
```

### Handoff Criteria
- ✅ Fix implemented
- ✅ Test now passing
- ✅ No regressions introduced
- ✅ ES5 compliant
- ✅ Fix written to memory.json

**→ Handoff to:** `@test-runner` for final validation

---

## Stage 4: Validation & Regression Testing

**Agent:** `@test-runner`
**Duration:** 5-10 minutes
**Tools:** Bash, Read

### Inputs
- Fixed code from Stage 3
- All test suites

### Tasks
1. **Run full test suite**
   ```bash
   npm test
   ```
2. **Verify no regressions**
   - All existing tests pass
   - New test passes
   - No new failures introduced
3. **Test on iOS Safari** (if applicable)
   - Manual test on actual device or simulator
   - Verify ES5 compatibility
4. **Performance check**
   - Ensure fix doesn't degrade performance
   - Check memory usage if relevant
5. **Update memory.json** with validation results

### Outputs
```json
{
  "validation": {
    "bugId": "BUG-XXX",
    "allTestsPassing": true,
    "totalTests": 87,
    "passed": 87,
    "failed": 0,
    "iosSafariTested": true,
    "performanceImpact": "none"
  }
}
```

### Handoff Criteria
- ✅ All tests passing
- ✅ No regressions found
- ✅ iOS Safari compatibility confirmed (if testable)
- ✅ Validation written to memory.json

**→ Handoff to:** `@documentation-writer`

---

## Stage 5: Documentation

**Agent:** `@documentation-writer`
**Duration:** 10-15 minutes
**Tools:** Read, Edit, Bash

### Inputs
- All previous stage outputs from memory.json
- Git history for this bug fix

### Tasks
1. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Fixed
   - BUG-XXX: Description of what was broken and how it's fixed
   ```
2. **Create/Update bug report** in `docs/bug-reports/`
   ```markdown
   # BUG-XXX: Brief Title
   **Status:** ✅ Fixed
   **Severity:** High
   **Discovered:** 2025-11-18
   **Fixed:** 2025-11-18

   ## Description
   [What was broken]

   ## Root Cause
   [Why it was happening]

   ## Fix
   [What was changed]

   ## Testing
   [How to verify fix]
   ```
3. **Generate session summary** (if significant bug)
4. **Update memory.json** with final status
   - Move from `activeIssues` to completed
   - Add to `context.recentChanges`
5. **Create git commit message**
   ```
   fix: resolve BUG-XXX - brief description

   - Root cause: explanation
   - Fix: what was changed
   - Tests: test added/updated
   - Closes #XXX (if GitHub issue)

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

### Outputs
- Updated CHANGELOG.md
- Bug report document
- Updated memory.json
- Commit message ready

### Handoff Criteria
- ✅ CHANGELOG.md updated
- ✅ Bug report created/updated
- ✅ memory.json updated
- ✅ Session summary generated (if needed)
- ✅ Ready for commit

**→ Workflow Complete**

---

## Communication Protocol

Agents communicate via `.claude/communication.json`:

**Example Message:**
```json
{
  "id": "MSG-001",
  "timestamp": "2025-11-18T22:30:00Z",
  "from": "code-reviewer",
  "to": "test-runner",
  "type": "handoff",
  "subject": "BUG-XXX analysis complete, ready for test creation",
  "body": {
    "bugId": "BUG-XXX",
    "severity": "high",
    "affectedFiles": ["invoice.js"],
    "rootCause": "Missing null check on payment amount",
    "proposedFix": "Add validation before processing payment"
  },
  "status": "unread"
}
```

---

## Success Criteria

Workflow is successful when:
- ✅ Bug no longer reproducible
- ✅ Test exists and passes
- ✅ No regressions introduced
- ✅ Documentation complete
- ✅ ES5 compliance maintained
- ✅ iOS Safari compatible
- ✅ Committed with clear message

---

## Example: Complete Bug Fix Flow

**Bug Report:** Invoice allows negative payment amounts

**Stage 1: Analysis (@code-reviewer)**
```
- Read invoice.js
- Found: recordPayment() lacks validation
- Root cause: Missing check for amount < 0
- Fix: Add validation at function entry
→ Write to memory.json, handoff to @test-runner
```

**Stage 2: Test Creation (@test-runner)**
```
- Create test in tests/invoice-functional.spec.js
- Test: "should reject negative payment amounts"
- Run test → FAILS (bug confirmed)
→ Write to memory.json, handoff to @code-reviewer
```

**Stage 3: Implementation (@code-reviewer)**
```
- Edit invoice.js, add validation:
  if (amount < 0) {
    return {success: false, error: 'Invalid amount'};
  }
- Run test → PASSES
- Run full suite → ALL PASS
→ Write to memory.json, handoff to @test-runner
```

**Stage 4: Validation (@test-runner)**
```
- Run npm test → 87/87 passing
- Check ES5 compliance → ✅ Clean
→ Write to memory.json, handoff to @documentation-writer
```

**Stage 5: Documentation (@documentation-writer)**
```
- Update CHANGELOG.md: "Fixed: negative payment validation"
- Create docs/bug-reports/BUG-004-negative-payments.md
- Update memory.json: move to completed issues
- Ready for commit
→ Workflow complete
```

**Total Time:** 45 minutes
**Result:** Bug fixed, tested, documented ✅

---

## Troubleshooting

**Issue:** Test can't reproduce bug
**Solution:** Work with code-reviewer to clarify reproduction steps

**Issue:** Fix breaks other tests
**Solution:** Refactoring-architect helps redesign fix approach

**Issue:** Bug too complex for single agent
**Solution:** Escalate to general-purpose for coordination

---

**Remember:** Good bug fixes are systematic, well-tested, and thoroughly documented. This workflow ensures all three.
