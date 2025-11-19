# Feature Development Workflow
**Version:** 1.0.0
**Last Updated:** 2025-11-18

Multi-agent orchestrated workflow for systematic feature development with integrated testing and documentation.

---

## Overview

This workflow coordinates agents through the complete feature development lifecycle, from planning through deployment.

**Workflow Duration:** 4-20 hours (depending on feature complexity)
**Agents Involved:** 4-5 (general-purpose, code-reviewer, test-runner, refactoring-architect, documentation-writer, deployment-specialist)
**Success Rate Target:** > 90%

---

## Workflow Stages

```
Feature Request
    ↓
[1] Planning & Design (@general-purpose)
    ↓
[2] Implementation (@code-reviewer or @refactoring-architect)
    ↓
[3] Testing (@test-runner)
    ↓
[4] Code Review (@code-reviewer)
    ↓
[5] Documentation (@documentation-writer)
    ↓
[6] Deployment (@deployment-specialist)
    ↓
Feature Complete & Live
```

---

## Stage 1: Planning & Design

**Agent:** `@general-purpose` (Plan mode)
**Duration:** 1-3 hours
**Tools:** Read, Grep, Glob

### Inputs
- Feature request description
- Business requirements
- User stories
- Acceptance criteria

### Tasks
1. **Analyze requirements**
   - Understand user needs
   - Define scope boundaries
   - Identify technical constraints
2. **Review existing codebase**
   ```bash
   # Find similar features
   grep -rn "similarFeature" *.js

   # Check for reusable patterns
   grep -rn "function.*Pattern" *.js
   ```
3. **Design approach**
   - Module architecture
   - Data structures
   - API design
   - UI/UX considerations
4. **Identify dependencies**
   - Required modules
   - External libraries
   - Load order requirements
5. **Create implementation plan**
   - Break into subtasks
   - Estimate complexity
   - Assign to appropriate agents
6. **Write to memory.json and tasks.json**

### Outputs
```json
{
  "feature": {
    "id": "FEAT-XXX",
    "title": "Feature name",
    "description": "What it does",
    "modules": ["new-module.js", "modified-module.js"],
    "estimatedHours": 12,
    "dependencies": ["existing-module.js"],
    "tasks": [
      {"id": "TASK-001", "description": "Create data model"},
      {"id": "TASK-002", "description": "Implement UI"},
      {"id": "TASK-003", "description": "Add tests"}
    ]
  }
}
```

### Handoff Criteria
- ✅ Requirements understood
- ✅ Design documented
- ✅ Tasks defined
- ✅ Dependencies identified
- ✅ Plan written to memory.json and tasks.json

**→ Handoff to:** `@code-reviewer` or `@refactoring-architect`

---

## Stage 2: Implementation

**Agent:** `@code-reviewer` (simple features) or `@refactoring-architect` (complex features)
**Duration:** 3-12 hours
**Tools:** Read, Edit, Grep, Glob

### Inputs
- Feature plan from Stage 1
- Design specifications
- Task list

### Implementation Phases

#### Phase A: Core Logic
1. **Create module structure** (IIFE pattern)
   ```javascript
   // new-feature.js
   (function() {
     'use strict';

     // Private state
     var state = {
       initialized: false,
       data: null
     };

     // Initialization
     function init() {
       console.log('[NEW-FEATURE] Initializing...');
       // Setup code
       state.initialized = true;
     }

     // Public API
     function publicMethod(param) {
       if (!state.initialized) {
         console.warn('[NEW-FEATURE] Not initialized');
         return null;
       }
       // Implementation
     }

     // Register module
     if (window.APP) {
       window.APP.registerModule('newFeature', {
         init: init,
         publicMethod: publicMethod
       });
     }

     // Global API
     window.NewFeature = {
       init: init,
       publicMethod: publicMethod
     };

     // Auto-init
     if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', init);
     } else {
       init();
     }
   })();
   ```

2. **Implement business logic**
   - Core functionality
   - Data validation
   - Error handling
   - ES5 compliance

3. **Add to index.html**
   ```html
   <!-- New Feature Module -->
   <script src="new-feature.js" defer></script>
   ```

#### Phase B: UI Integration
1. **Add HTML markup** (if needed)
2. **Wire event handlers**
3. **Update navigation** (if new page)
4. **Add CSS styling**

#### Phase C: Data Persistence
1. **Define LocalStorage schema**
   ```javascript
   var STORAGE_KEY = 'tts_new_feature_data';

   function saveData(data) {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
       return true;
     } catch (e) {
       console.error('[NEW-FEATURE] Save failed:', e);
       return false;
     }
   }

   function loadData() {
     try {
       var json = localStorage.getItem(STORAGE_KEY);
       return json ? JSON.parse(json) : null;
     } catch (e) {
       console.error('[NEW-FEATURE] Load failed:', e);
       return null;
     }
   }
   ```

#### Phase D: Integration
1. **Connect to existing modules**
2. **Update dependent modules**
3. **Test integration points**

### Quality Checks
- [ ] ES5 compliance (no const/let/arrows)
- [ ] Input validation using validation.js
- [ ] XSS prevention using security.js
- [ ] Error handling with try-catch
- [ ] Console logging for debugging
- [ ] Module registration with APP
- [ ] Global API exposure

### Outputs
- New/modified JavaScript files
- Updated HTML
- CSS changes
- Updated memory.json with implementation details

### Handoff Criteria
- ✅ Core logic implemented
- ✅ UI integrated (if applicable)
- ✅ Data persistence working
- ✅ ES5 compliant
- ✅ Manual testing passed
- ✅ Implementation written to memory.json

**→ Handoff to:** `@test-runner`

---

## Stage 3: Testing

**Agent:** `@test-runner`
**Duration:** 2-4 hours
**Tools:** Read, Edit, Bash

### Tasks
1. **Create test file**
   ```javascript
   // tests/new-feature.spec.js
   const { test, expect } = require('@playwright/test');

   test.describe('NewFeature', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('http://localhost:8080');
       await page.waitForSelector('.app');
       await page.waitForFunction(() => window.NewFeature);
     });

     test('should initialize correctly', async ({ page }) => {
       const initialized = await page.evaluate(() => {
         return window.NewFeature && typeof window.NewFeature.init === 'function';
       });
       expect(initialized).toBe(true);
     });

     test('should handle user interaction', async ({ page }) => {
       // Test user flows
     });

     test('should validate input', async ({ page }) => {
       // Test validation
     });

     test('should persist data', async ({ page }) => {
       // Test LocalStorage
     });
   });
   ```

2. **Run tests**
   ```bash
   npm test -- tests/new-feature.spec.js
   ```

3. **Ensure full coverage**
   - Happy path tests
   - Error handling tests
   - Edge case tests
   - Integration tests

4. **Run full test suite**
   ```bash
   npm test
   # Ensure no regressions
   ```

5. **Update memory.json** with test results

### Outputs
```json
{
  "testing": {
    "featureId": "FEAT-XXX",
    "testFile": "tests/new-feature.spec.js",
    "testsCreated": 8,
    "testsPass": 8,
    "coverage": "95%",
    "regressions": 0
  }
}
```

### Handoff Criteria
- ✅ All feature tests passing
- ✅ No regressions in existing tests
- ✅ Edge cases covered
- ✅ Test results in memory.json

**→ Handoff to:** `@code-reviewer`

---

## Stage 4: Code Review

**Agent:** `@code-reviewer`
**Duration:** 1-2 hours
**Tools:** Read, Grep, Bash

### Tasks
1. **Review code quality**
   - ES5 compliance
   - Naming conventions
   - Code organization
   - Comment quality

2. **Check security**
   - Input sanitization
   - XSS prevention
   - Data validation
   - Error handling

3. **Verify best practices**
   - Module pattern usage
   - Error handling
   - Documentation
   - Performance considerations

4. **Run security tests**
   ```bash
   npm test -- tests/security.spec.js
   ```

5. **Suggest improvements** (if needed)

6. **Approve or request changes**

### Outputs
- Code review notes in memory.json
- List of issues (if any)
- Approval status

### Handoff Criteria
- ✅ Code review complete
- ✅ No security issues
- ✅ Best practices followed
- ✅ Approval granted

**→ Handoff to:** `@documentation-writer`

---

## Stage 5: Documentation

**Agent:** `@documentation-writer`
**Duration:** 1-2 hours
**Tools:** Read, Edit

### Tasks
1. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Added
   - FEAT-XXX: New feature description
     - Key capability 1
     - Key capability 2
   ```

2. **Update CLAUDE.md**
   - Add to Module Reference
   - Document new patterns
   - Update Common Tasks section
   - Add to File Location Quick Reference

3. **Create feature documentation**
   ```markdown
   # New Feature Guide

   ## Overview
   What the feature does

   ## Usage
   How to use it

   ## API Reference
   Public functions

   ## Examples
   Code examples
   ```

4. **Generate session summary**

5. **Update memory.json**
   - Add to `context.recentChanges`
   - Update `knowledge.moduleLoadOrder` if needed
   - Update `knowledge.fileLocations`

### Outputs
- Updated CHANGELOG.md
- Updated CLAUDE.md
- Feature documentation
- Session summary
- Updated memory.json

### Handoff Criteria
- ✅ All documentation complete
- ✅ CLAUDE.md updated
- ✅ CHANGELOG.md updated
- ✅ Session summary generated

**→ Handoff to:** `@deployment-specialist`

---

## Stage 6: Deployment

**Agent:** `@deployment-specialist`
**Duration:** 30-60 minutes
**Tools:** Bash, Read

### Tasks
1. **Pre-deployment checks**
   ```bash
   # Run deployment helper
   npm test
   # Check for debug code
   # Verify version numbers
   ```

2. **Stage deployment**
   - Test in staging environment (if available)
   - Verify feature works in production-like setting

3. **Deploy to production**
   ```bash
   git add .
   git commit -m "feat: add FEAT-XXX - feature name"
   git push origin main
   ```

4. **Post-deployment validation**
   - Verify URL loads
   - Test feature in production
   - Monitor for errors

5. **Generate deployment report**

### Outputs
- Deployment report
- Production validation results
- Updated memory.json

### Handoff Criteria
- ✅ Feature deployed
- ✅ Production validation passed
- ✅ No errors detected
- ✅ Deployment report generated

**→ Workflow Complete**

---

## Task Tracking

Features are tracked in `.claude/tasks.json`:

```json
{
  "tasks": [
    {
      "id": "FEAT-XXX",
      "title": "Add new feature",
      "status": "in-progress",
      "priority": "high",
      "assignedAgent": "code-reviewer",
      "createdDate": "2025-11-18",
      "estimatedHours": 12,
      "actualHours": 0,
      "subtasks": [
        {"id": "TASK-001", "description": "Design", "status": "completed"},
        {"id": "TASK-002", "description": "Implementation", "status": "in-progress"},
        {"id": "TASK-003", "description": "Testing", "status": "pending"}
      ],
      "tags": ["feature", "enhancement"],
      "blockedBy": [],
      "notes": "Additional context"
    }
  ]
}
```

---

## Success Criteria

Feature development is successful when:
- ✅ Feature fully functional
- ✅ All tests passing
- ✅ Code reviewed and approved
- ✅ Documentation complete
- ✅ Deployed to production
- ✅ No regressions introduced
- ✅ ES5 compliant
- ✅ Performance acceptable

---

## Example: Complete Feature Flow

**Feature:** Add contract renewal automation

**Stage 1: Planning** (2h)
- Design: Automatic renewal reminders 30/7/1 days before expiration
- Modules: Add to contract-automation.js
- UI: Add renewal section to contracts page
→ Plan documented, handoff to @refactoring-architect

**Stage 2: Implementation** (6h)
- Add `checkRenewals()` function to contract-automation.js
- Add renewal UI to contracts page
- Wire event handlers
→ Implementation complete, handoff to @test-runner

**Stage 3: Testing** (3h)
- Create tests/contract-renewal.spec.js
- 10 tests created, all passing
- No regressions
→ Tests complete, handoff to @code-reviewer

**Stage 4: Code Review** (1h)
- Security check: ✅
- ES5 compliance: ✅
- Best practices: ✅
- Approved
→ Review complete, handoff to @documentation-writer

**Stage 5: Documentation** (1.5h)
- Updated CHANGELOG.md
- Updated CLAUDE.md
- Created CONTRACT_RENEWAL_GUIDE.md
→ Documentation complete, handoff to @deployment-specialist

**Stage 6: Deployment** (30min)
- Pre-deployment: ✅ All checks pass
- Deployed to production
- Validation: ✅ Feature working
→ Feature complete

**Total Time:** 14 hours
**Result:** Feature deployed and working ✅

---

**Remember:** Great features are well-planned, well-tested, well-documented, and well-deployed. This workflow ensures all four.
