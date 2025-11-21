<!-- .github/copilot-instructions.md - concise project-specific instructions for AI coding agents -->
# TicTacStick — Copilot instructions (short)

This file gives focused, actionable rules for AI coding agents working in this repository. For deep context use `CLAUDE.md` (primary AI guide) and `AGENTS.md` (contributor rules).

- Project type: single-page PWA written in vanilla JavaScript (ES5-compatible). No build step required; files load directly from `index.html`.
- File layout: source files sit at the repository root beside `index.html` (e.g., `app.js`, `calc.js`, `data.js`, `storage.js`, `ui.js`). Keep changes in the same flat layout unless adding well-justified new modules under `src/`.
- Coding style: follow ES5/IIFE module pattern that writes to the shared `APP` namespace. Use `function` and `var` (no arrow functions, no let/const), two-space indentation, single quotes, and semicolons. See `AGENTS.md` and examples in `app.js`.
- Script load order matters: many modules rely on global state initialized by `app.js` and `data.js`. When editing or adding modules, update `index.html` load order and confirm no runtime errors in the browser console.
- Persistence: LocalStorage is the canonical persistence layer; review `storage.js` before changing data shapes. Backups use `backup-manager.js`.
- Native wrappers: Capacitor is used for native features. After changing plugins, re-run Cap sync commands (`npm run cap:sync`, `npm run cap:copy`) and mention them in PR notes.
- Tests: Playwright is the test runner. Use `npm test` for headless runs and `npm run test:headed` / `npm run test:ui` for debugging. Be aware of a known Service Worker hang in Playwright tests — consult `docs/fixes/P0_IMMEDIATE_FIXES.md` and `CLAUDE.md` troubleshooting before changing SW registration.
- Debugging: Serve the repo with a static server (e.g., `python3 -m http.server 8080`) and test in real browsers. Many runtime issues only reproduce in-situ (Service Worker, Camera, Permissions).
- PRs and commits: follow existing conventional commit prefixes (`fix:`, `feat:`, `docs:`). Include test output, test-results artifacts, and CHANGELOG updates for user-facing changes. See `AGENTS.md` for full PR checklist.
- Small, safe fixes: prefer edits that preserve ES5 style and global contracts; refactors that change module APIs must include migration notes in `CLAUDE.md` and tests demonstrating backward compatibility.
- Examples and quick references:
  - Module pattern: see `app.js` and `calc.js` for canonical IIFE + namespace usage.
  - Persistence: `storage.js` is the LocalStorage wrapper to use for data shape changes.
  - Tests: `playwright.config.js` and `tests/` contain test examples and naming conventions (`*.spec.js`).

When in doubt, add a short note to `CLAUDE.md` and reference it in your PR so the next agent can pick up context.

If you want me to expand any section (e.g., script ordering checklist, example IIFE scaffold, or test run commands), tell me which part to enlarge.
