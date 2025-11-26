# ADR-001: ES5 Compatibility for iOS Safari

**Status:** Accepted  
**Date:** 2025-11-26  
**Deciders:** 925 Pressure Glass Development Team  
**Technical Story:** Initial architecture decision

## Context

TicTacStick Quote Engine is a Progressive Web App (PWA) used by field technicians on various mobile devices. A significant portion of users access the application on older iOS devices running Safari 12+.

Modern JavaScript features (ES6+) such as:
- Arrow functions
- `let`/`const` declarations
- Template literals
- Classes
- Destructuring

...are not fully supported in older Safari versions and can cause runtime errors.

## Decision

We will write all JavaScript in ES5-compatible syntax:

- Use `function` declarations instead of arrow functions
- Use `var` instead of `let`/`const`
- Use string concatenation instead of template literals
- Use IIFE module pattern instead of ES6 modules
- Use prototype-based inheritance instead of classes

All modules will be written as IIFEs that attach to the global `APP` namespace:

```javascript
(function() {
  'use strict';
  
  function myFunction() {
    var result = 'value';
    return result;
  }
  
  window.APP = window.APP || {};
  window.APP.myModule = {
    myFunction: myFunction
  };
})();
```

## Consequences

### Positive

- **Full iOS Safari 12+ support** - No transpilation needed
- **No build step required** - Files load directly in browser
- **Simpler debugging** - Source code matches running code
- **Faster development** - No webpack/babel configuration
- **Reliable mobile experience** - Works on older devices

### Negative

- **More verbose code** - ES5 requires more boilerplate
- **No modern syntax** - Developers must remember ES5 patterns
- **Manual module management** - Script load order matters
- **No tree shaking** - All code is loaded regardless of usage

### Neutral

- TypeScript is used for backend (`apps/meta-api`) where Node.js supports modern syntax
- React is used for admin dashboard (`apps/meta-dashboard`) which has a build step

## Alternatives Considered

### Alternative 1: Babel Transpilation

Use Babel to transpile ES6+ to ES5 during build.

**Rejected because:**
- Adds build complexity
- Debugging is harder with source maps
- Increases development friction for quick fixes

### Alternative 2: Polyfills Only

Use ES6+ with polyfills for missing features.

**Rejected because:**
- Polyfills don't cover all syntax differences
- Arrow functions can't be polyfilled
- `const`/`let` scoping can't be polyfilled

### Alternative 3: Drop iOS Safari 12 Support

Only support modern browsers with ES6+ support.

**Rejected because:**
- Significant user base on older devices
- Field technicians often use company-provided older devices
- Business requirement to support existing hardware

## References

- [Can I Use: ES6](https://caniuse.com/es6)
- [Safari Version History](https://en.wikipedia.org/wiki/Safari_version_history)
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Code style guidelines
- [AGENTS.md](../../AGENTS.md) - Contributor rules
