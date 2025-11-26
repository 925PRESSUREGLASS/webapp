<!-- PR template for TicTacStick Quote Engine -->

# Summary

Describe the change in one or two sentences. Reference related issues or docs (e.g., `CLAUDE.md`).

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] CI/Build configuration

## Checklist

- [ ] PR title follows conventional commits (e.g., `docs:`, `fix:`, `feat:`)
- [ ] Includes scope and brief testing notes
- [ ] Links to any updated documentation (CHANGELOG, CLAUDE.md)
- [ ] For UI/behavior changes: include screenshots or test-results artifacts
- [ ] For native or PWA changes: note if `npm run cap:sync` is required

## Files Changed

List the key files changed by this PR and why (one-line each):

-

## Testing

### Automated Tests
- [ ] All existing tests pass (`npm test`)
- [ ] New tests added (if applicable)

### Manual Testing
- [ ] Tested in Chrome/Chromium
- [ ] Tested in Safari/WebKit (required for iOS compatibility)
- [ ] Tested on mobile viewport

### How to Test Locally

1. Serve the repo: `python3 -m http.server 8080`
2. Open the app in a browser and smoke-test features affected
3. Run tests: `npm test`

## Deployment Checklist

### Service Worker / PWA Changes
- [ ] No SW changes in this PR
- [ ] SW version incremented (if changed)
- [ ] Tested offline functionality

### Native Plugin Changes (Capacitor)
- [ ] No native plugin changes in this PR
- [ ] `npm run cap:sync` executed
- [ ] Tested on iOS/Android

### Configuration
- [ ] No hardcoded secrets or API keys
- [ ] Config files validated

## Notes for Reviewers

Keep suggestions focused on: ES5/IIFE module usage, script ordering, LocalStorage data shapes, and Playwright test implications. If you change module APIs, update `CLAUDE.md`.
