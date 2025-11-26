# Contributing to TicTacStick Quote Engine

## Quick Start (One Command)

```bash
npm install && npm test && python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3 (for local server)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone https://github.com/925PRESSUREGLASS/webapp.git
cd webapp

# Install dependencies
npm install

# Install Playwright browsers (for testing)
npx playwright install
```

### Running Locally

```bash
# Start local server
python3 -m http.server 8080

# Or use http-server
npx http-server -p 8080
```

### Running Tests

```bash
# Full test suite
npm test

# Headed mode (see browser)
npm run test:headed

# Interactive UI
npm run test:ui

# Debug mode
npm run test:debug
```

## Code Style

This project uses **ES5-compatible JavaScript** for iOS Safari 12+ support.

### Must Follow

- Use `function` declarations (no arrow functions)
- Use `var` (no `let` or `const`)
- Use string concatenation (no template literals)
- Use IIFE module pattern with `APP` namespace
- Two-space indentation
- Single quotes for strings
- Always use semicolons

### Example Module Pattern

```javascript
// my-module.js
(function() {
  'use strict';

  function myFunction(param) {
    var result = param + ' processed';
    return result;
  }

  // Export to APP namespace
  window.APP = window.APP || {};
  window.APP.myModule = {
    myFunction: myFunction
  };
})();
```

## iOS Safari Debugging

### Common Issues

1. **Service Worker hangs in tests**
   - Add `?testMode=1` to URL
   - Check `CLAUDE.md` troubleshooting section

2. **LocalStorage errors**
   - Safari has strict storage limits in private mode
   - Test with `storage.js` wrapper functions

3. **Camera/Geolocation not working**
   - Requires HTTPS in production
   - Use Capacitor native plugins for mobile

### Testing on iOS

```bash
# Sync web assets to iOS
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
```

## Pull Request Guidelines

1. Follow conventional commit prefixes: `fix:`, `feat:`, `docs:`, `chore:`
2. Update `CHANGELOG.md` for user-facing changes
3. Include test output in PR description
4. Reference related issues

## Project Structure

```
/
├── index.html          # Main entry point
├── app.js              # Core application logic
├── calc.js             # Pricing calculations
├── data.js             # Service pricing data
├── storage.js          # LocalStorage wrapper
├── ui.js               # UI components
├── apps/
│   ├── meta-api/       # TypeScript API server
│   └── meta-dashboard/ # React admin dashboard
├── tests/              # Playwright tests
└── docs/               # Documentation
```

## Getting Help

- Read `CLAUDE.md` for comprehensive project context
- Check `AGENTS.md` for contributor guidelines
- Review existing code for patterns
