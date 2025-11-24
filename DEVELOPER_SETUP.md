# TicTacStick Developer Setup Guide

**Last Updated:** 2025-11-24  
**Version:** 1.13.0  
**Purpose:** Complete setup instructions for developers working on this repository

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running the Application](#running-the-application)
4. [Testing](#testing)
5. [Build Philosophy](#build-philosophy)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v16+ (for development tools and testing only)
- **npm**: v7+ (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, or Safari for testing

### Operating Systems

- ✅ macOS (recommended for iOS Safari testing)
- ✅ Linux (Ubuntu, Debian, Fedora)
- ✅ Windows 10/11 (with WSL recommended)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/925PRESSUREGLASS/webapp.git
cd webapp
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Playwright**: End-to-end testing framework
- **http-server**: Local static file server
- **Capacitor**: Native app wrapper (iOS/Android)

**Note**: Dependencies are **only for development**. The production app requires **no build tools** and runs directly in the browser.

### 3. Install Playwright Browsers

```bash
npx playwright install chromium
```

For full browser testing:
```bash
npx playwright install  # Installs Chrome, Firefox, WebKit
```

---

## Running the Application

### Option 1: Static HTTP Server (Recommended)

```bash
# Start server on port 8080
python3 -m http.server 8080

# Or use http-server (Node.js)
npx http-server -p 8080 -c-1
```

Then open: **http://localhost:8080**

### Option 2: Direct File Access

Simply open `index.html` in your browser.

**⚠️ Limitations**: Service Worker won't work with `file://` protocol. Some features require HTTP/HTTPS.

### Option 3: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## Testing

### Quick Test Commands

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npm test -- tests/bootstrap.spec.js

# Run tests matching pattern
npm test -- --grep "APP object"

# Debug mode
npm run test:debug
```

### Test Infrastructure

**Test Framework**: Playwright  
**Test Location**: `tests/` directory  
**Fixtures**: `tests/fixtures/` for shared test utilities

**Key Test Files:**
- `bootstrap.spec.js` - APP initialization tests
- `calculations.spec.js` - Quote calculation tests
- `storage.spec.js` - LocalStorage persistence tests
- `wizards.spec.js` - UI wizard dialog tests
- `check-errors.spec.js` - Console error validation

### Test Configuration

See `playwright.config.js` for:
- Test timeout settings
- Browser configuration
- Service Worker blocking
- Parallel execution settings

### Running Tests Reliably

Tests use a **fresh browser context** for each test to prevent state leakage:

1. **First Run**: May fail due to timing (normal)
2. **Retry**: Should pass
3. **Overall**: Tests are reliable with retry logic

**Known Issue**: Some tests fail on first run but pass on retry. This is documented in `docs/fixes/P0_IMMEDIATE_FIXES.md`.

---

## Build Philosophy

### ⚠️ No Build System

This is a **vanilla JavaScript** project with **NO build tools**:

- ❌ No webpack, Babel, Vite, Rollup, Parcel
- ❌ No transpilation or bundling
- ❌ No npm packages in production code
- ✅ Direct browser execution
- ✅ ES5-compatible JavaScript
- ✅ Manual dependency management

### Why No Build?

1. **iOS Safari Compatibility**: Target iOS Safari 12+ (requires ES5)
2. **Simplicity**: Deploy by copying files to static host
3. **Offline-First**: Service Worker caches all assets
4. **Field Reliability**: No complex build failures in production

### What "Build" Means Here

In this repository, "build" refers to:

1. **Test Infrastructure**: Playwright test suite setup
2. **Development Tools**: http-server, linters, formatters
3. **Native Wrappers**: Capacitor for iOS/Android packaging

---

## Common Tasks

### Adding a New Module

1. Create `my-module.js` in repository root:

```javascript
// my-module.js - ES5 compatible!
(function() {
  'use strict';

  function myFunction() {
    // Your code here
    return 'Hello';
  }

  // Register with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('myModule', {
      myFunction: myFunction
    });
  }
})();
```

2. Add to `index.html` in correct load order:

```html
<script src="bootstrap.js"></script>  <!-- Must load first -->
<script src="my-module.js"></script>  <!-- After bootstrap -->
```

3. Add tests in `tests/my-module.spec.js`:

```javascript
const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp, waitForAppReady } = require('./fixtures/app-url');

test('my module works', async ({ page }) => {
  await gotoApp(page);
  await waitForAppReady(page);
  
  const result = await page.evaluate(() => {
    return window.APP.modules.myModule.myFunction();
  });
  
  expect(result).toBe('Hello');
});
```

### Running Native App (Capacitor)

```bash
# Sync web code to native projects
npm run cap:sync

# Open in Xcode (iOS)
npm run cap:open:ios

# Open in Android Studio
npm run cap:open:android

# Copy assets only
npm run cap:copy
```

### Code Style

- **JavaScript**: ES5 only (no `const`, `let`, arrow functions, template literals)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Functions**: Use `function` keyword
- **Variables**: Use `var`

**Example:**

```javascript
// ✅ Good (ES5)
var name = 'John';
var greeting = 'Hello, ' + name;

function sayHello() {
  return greeting;
}

// ❌ Bad (ES6+)
const name = 'John';
const greeting = `Hello, ${name}`;

const sayHello = () => greeting;
```

---

## Troubleshooting

### Tests Failing

**Problem**: Tests fail with "APP is not defined" or "module not found"

**Solution**:
```bash
# 1. Clear test artifacts
rm -rf test-results/
rm -rf playwright-report/

# 2. Reinstall dependencies
rm -rf node_modules/
npm install

# 3. Reinstall browsers
npx playwright install chromium

# 4. Run tests
npm test
```

### Service Worker Issues

**Problem**: Service Worker causing test failures

**Solution**: Tests automatically block Service Worker registration via `playwright.config.js`:

```javascript
use: {
  serviceWorkers: 'block'  // Already configured
}
```

If SW still causes issues, check console for registration attempts.

### Port Already in Use

**Problem**: "Port 3000 already in use"

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
npx http-server -p 8080
```

### Browser Not Installing

**Problem**: Playwright browser installation fails

**Solution**:
```bash
# Install with dependencies
npx playwright install --with-deps chromium

# Or install system dependencies manually
npx playwright install-deps
```

### Module Load Order Issues

**Problem**: "Cannot read property X of undefined" in console

**Solution**: Check `index.html` script load order:

1. `bootstrap.js` must load **first**
2. Core modules (`data.js`, `storage.js`, `calc.js`) load early
3. Feature modules load after core
4. Check for missing module dependencies

---

## Additional Resources

- **Main Documentation**: `README.md`
- **AI Agent Guide**: `CLAUDE.md`
- **Contributor Guidelines**: `AGENTS.md`
- **Changelog**: `CHANGELOG.md`
- **Fix Documentation**: `docs/fixes/`
- **Manual Testing**: `MANUAL_TESTING_GUIDE_v1.13.0.md`

---

## Getting Help

1. **Check Documentation**: Start with README.md and CLAUDE.md
2. **Review Tests**: Look at `tests/examples/` for patterns
3. **Check Fixes**: See `docs/fixes/P0_IMMEDIATE_FIXES.md` for known issues
4. **Console Logs**: Enable verbose logging in browser DevTools

---

## Quick Reference

```bash
# Development
npm install                      # Install dependencies
npx http-server -p 8080         # Start dev server
open http://localhost:8080      # Open in browser

# Testing
npm test                        # Run all tests
npm test -- tests/FILE.spec.js  # Run specific test
npm run test:ui                 # Interactive test UI
npm run test:headed             # See browser during tests

# Native Apps
npm run cap:sync                # Sync to iOS/Android
npm run cap:open:ios            # Open Xcode
npm run cap:open:android        # Open Android Studio

# Cleanup
rm -rf test-results/            # Clear test artifacts
rm -rf node_modules/            # Clear dependencies
npm install                     # Reinstall
```

---

**Last Updated**: 2025-11-24  
**Maintained By**: Development Team  
**Questions**: See `AGENTS.md` or `CLAUDE.md`
