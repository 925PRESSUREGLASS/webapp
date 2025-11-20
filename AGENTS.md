# Repository Guidelines

## Project Structure & Module Organization
Source files sit flat beside `index.html`. `app.js` coordinates state and UI plumbing, while `calc.js`, `data.js`, and `storage.js` cover pricing math, lookup tables, and persistence. Shared styles live in `app.css`, `toast.css`, `print.css`, and `css/`. Process docs sit in `docs/` plus the top-level `*_GUIDE.md` references. Automated specs are under `tests/` with artifacts in `test-results/`, and deployment helpers stay inside `cloudflare/` and `migration/`.

## Build, Test, and Development Commands
Run `npm install` once per workstation, then use `npm test` for the default headless Playwright flow. `npm run test:headed`, `npm run test:ui`, and `npm run test:debug` expose visual or interactive runs when triaging failures. Serve the app statically with `python3 -m http.server 8080` before exercising browser APIs. Re-run `npm run cap:sync` (and `npm run cap:copy` for devices) whenever native plugins, icons, or `capacitor.config.json` change.

## Coding Style & Naming Conventions
Maintain ES5-only syntax for iOS Safari: `function` declarations, `var`, string concatenation, and no template literals or arrow functions. Indent with two spaces, favor single quotes, and terminate statements with semicolons to match `app.js`. Modules remain immediately invoked wrappers that write to the shared `APP` namespace. CSS classes stay lower-hyphen (`quote-workflow__footer`), JavaScript identifiers remain camelCase, and filenames use kebab-case (`quote-validation.js`).

## Testing Guidelines
Specs follow the `*.spec.js` naming inside `tests/` (e.g., `quote-validation.spec.js`, `wizards.spec.js`). Cover each major workflow—quote creation, invoicing, analytics, autosave, and Cap sync—and drop Playwright traces or screenshots into `test-results/` when diagnosing issues. Pair automated coverage with the checklist from `MANUAL_TESTING_GUIDE_v1.13.0.md`, especially for pricing or storage changes. If a regression intersects a documented gap, call it out in your PR with a pointer to `docs/fixes/P0_IMMEDIATE_FIXES.md`.

## Commit & Pull Request Guidelines
Follow the existing conventional style shown in `git log` (`docs:`, `fix:`, `chore:`, etc.) and keep subjects concise. Each PR should summarize scope, note deployment or Cap sync implications, attach test output, and update `CHANGELOG.md` when behavior shifts. Link GitHub issues or internal tickets, reference any supporting docs (deployment checklists, testing reports), and include screenshots for UI adjustments so downstream reviewers can validate quickly.

## Security & Configuration Notes
Do not commit secrets—`config.js` and `config-production.js` must stay sanitized. Keep PWA assets (`manifest.json`, `sw.js`, icons) and Cloudflare rules moving in lockstep so cache manifests stay valid. After tweaking service workers, CSP headers, or native plugins, re-run `npm test` plus `npm run cap:sync` to ensure security policies and offline caches remain aligned across platforms.
