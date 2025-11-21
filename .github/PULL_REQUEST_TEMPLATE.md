<!-- Short PR template for changes from AI agents -->

# Summary

Describe the change in one or two sentences. Reference related issues or docs (e.g., `CLAUDE.md`).

## Checklist

- [ ] PR title follows conventional commits (e.g., `docs:`, `fix:`)
- [ ] Includes scope and brief testing notes
- [ ] Links to any updated documentation (CHANGELOG, CLAUDE.md)
- [ ] For UI/behavior changes: include screenshots or test-results artifacts in `test-results/`
- [ ] For native or PWA changes: note if `npm run cap:sync` is required

## Files changed

List the key files changed by this PR and why (one-line each):

- `.github/copilot-instructions.md` — concise agent guidance added

## How to test locally

1. Serve the repo: `python3 -m http.server 8080`
2. Open the app in a browser and smoke-test features affected by the change (instructions in CLAUDE.md)
3. Run tests if relevant: `npm test`

## Notes for reviewers

Keep suggestions focused on repository-specific patterns: ES5/IIFE module usage, script ordering, LocalStorage data shapes, and Playwright test implications. If you change module APIs, update `CLAUDE.md` and add a migration note.
