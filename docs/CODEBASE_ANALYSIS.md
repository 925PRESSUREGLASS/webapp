# Codebase Analysis

## 1. Product & Feature Overview
- The Tic-Tac-Stick Quote Engine is a professional quoting tool for 925 Pressure Glass that covers window cleaning, pressure cleaning, task management, CRM, analytics, invoicing, and PDF export workflows from a single-page PWA. 【F:README.md†L1-L57】
- Documentation emphasizes pure vanilla JavaScript, client-side execution, and LocalStorage persistence, which means most functionality is implemented directly in the browser without build tooling. 【F:README.md†L52-L77】
- The repository ships extensive fix documentation (docs/fixes) and operational guides, signaling that process compliance and manual QA are integral to the project lifecycle. 【F:README.md†L58-L70】

## 2. Entry Point & UI Composition
- `index.html` defines the entire UI layout: it loads a hardened Content Security Policy, the manifest, Apple web-app metadata, and more than 20 CSS files that compartmentalize feature styling (core app, invoices, analytics, job tracking, etc.). 【F:index.html†L1-L68】
- The header provides navigation buttons into wizard mode, GoHighLevel integrations, customer/job/contract views, analytics dashboards, help, settings, keyboard shortcuts, and the internal test runner, so the shell is already wired for all major subsystems. 【F:index.html†L70-L116】
- The "Job Settings" section exposes pricing levers (base fee, hourly rate, minimum job, high reach modifier, multipliers) with descriptive help text, which ties directly into the calculation pipeline described below. 【F:index.html†L151-L198】

## 3. State Management & Quoting Workflow (`app.js`)
- `app.js` bootstraps an ES5-compatible IIFE that maintains `state` for window and pressure lines plus default counters for auto-generated client/quote names. 【F:app.js†L1-L55】
- A suite of DOM helper functions and autosave utilities synchronize the form with LocalStorage; `loadInitialState()` restores persisted data while `scheduleAutosave()` throttles writes to every 600 ms. 【F:app.js†L57-L143】
- `buildStateFromUI()` reads configuration inputs, applies safeguards (non-negative values, minimum multipliers), and can auto-fill sensible defaults when `useDefaults` is true, ensuring the rest of the modules always receive normalized data. 【F:app.js†L145-L200】

## 4. Pricing Data & Calculation Engine (`data.js`, `calc.js`)
- `data.js` centralizes the catalog of window types, modifiers (tint, soil, access), and pressure-cleaning surfaces, then builds lookup maps and helper functions that optionally merge in extended datasets via global arrays. 【F:data.js†L1-L200】
- `calc.js` defines `Money`, `Time`, and domain-specific helpers (`WindowCalc`) that convert between dollars/minutes using integer math, enforce GST rules, and keep rounding deterministic—critical for mobile Safari compatibility. 【F:calc.js†L1-L83】
- Tests reference the same contract by comparing UI totals against the Money helpers (e.g., GST must equal 10 % of subtotal), so the calculation layer is both unit-tested and integration-tested via Playwright. 【F:tests/calculations.spec.js†L1-L150】

## 5. Persistence & Presets (`storage.js`)
- `AppStorage` wraps LocalStorage with defensive parsing plus quota-aware error messages; it stores autosave state, user presets, and saved quotes behind dedicated keys. 【F:storage.js†L1-L92】
- Helper methods (`saveState`, `loadState`, `clearState`, `load/savePresets`, `load/saveSavedQuotes`) are exposed as a plain object, making it easy for other modules to depend on persistence without duplicating error handling. 【F:storage.js†L94-L103】

## 6. PWA, Offline, & Security Hardening
- The manifest advertises standalone display, multi-size icons (including maskable variants), and shortcuts so the quote engine can be installed like a native app on Android/iOS. 【F:manifest.json†L1-L77】
- `sw.js` enumerates an explicit cache allowlist that spans HTML, CSS, JS, imagery, and configuration assets, and it validates fetches against same-origin/regex filters before caching—highlighting a deliberate security stance against cache poisoning. 【F:sw.js†L1-L200】
- `index.html` supplements this with a restrictive CSP (self-only origins plus specific SaaS endpoints) and Apple-specific meta tags for PWA polish. 【F:index.html†L4-L36】

## 7. Testing & Tooling
- `package.json` exposes Playwright scripts (`test`, `test:headed`, `test:ui`, `test:debug`) and Capacitor sync/open helpers for mobile packaging, underscoring that automated browser tests and native wrappers are both first-class. 【F:package.json†L1-L32】
- README's testing section reiterates how to run the suites and lists coverage goals (calculations, UI flows, wizard dialogs, responsive layouts). 【F:README.md†L85-L129】
- `tests/calculations.spec.js` demonstrates the pattern: reset LocalStorage, wait for `APP.waitForInit`, manipulate lines via the global APP API, and assert totals/high reach/GST/pressure costs, which doubles as living documentation for expected behavior. 【F:tests/calculations.spec.js†L8-L150】

## 8. Directory Highlights & Next Steps
- The README's file-structure table is accurate: `calc.js`, `data.js`, `storage.js`, `ui.js`, `wizard.js`, `shortcuts.js`, `manifest.json`, `sw.js`, and Playwright tests exist at the top level, so onboarding engineers can follow it verbatim. 【F:README.md†L158-L187】
- Beyond the core files, the repo contains numerous specialty modules (analytics, contracts, help system, task dashboards, native helpers). When exploring, use the header buttons in `index.html` as a map—the UI already links to each feature module. 【F:index.html†L82-L116】
- Documentation such as KEYBOARD_SHORTCUTS.md, multiple deployment guides, and fix trackers provide process context; reviewing them alongside this analysis will help prioritize future enhancements.

## 9. Extended Domain Modules & Observability
- The contract suite (`contract-manager.js`, `contract-wizard.js`, `contract-automation.js`, `contract-forecasting.js`) layers recurring-service CRUD, automation, and forecasting on top of the quoting core, and it follows the standard ES5/IIFE module template captured in CLAUDE.md. These files formalize statuses, renewal rules, and frequency-driven discounts so the app can grow into subscription revenue without changing the calculator primitives. 【F:CLAUDE.md†L29-L87】【F:CLAUDE.md†L929-L1014】
- Analytics tooling spans `analytics-engine.js`, `analytics-dashboard.js`, and `analytics-config.js`, which bundle aggregation logic, dashboard wiring, and KPI thresholds; together they demonstrate how heavy data processing is still organized client-side but split into compute, config, and UI layers for maintainability. 【F:CLAUDE.md†L88-L142】
- Operational safety nets exist in `production-readiness.js` (holistic release checklist), `health-check.js` (post-deploy monitoring), and `bug-tracker.js` (structured user reports). The readiness checker actively inspects test results, module availability, storage integrity, performance, compatibility, and security before marking a build deployable. 【F:production-readiness.js†L1-L52】
- Native-adjacent helpers (`camera-helper.js`, `geolocation-helper.js`, `native-features.js`, `push-notifications.js`) illustrate how the project leans on Capacitor while retaining PWA compatibility, making it feasible to wrap the SPA for app stores without diverging code paths. 【F:CLAUDE.md†L143-L210】

## 10. Improvement Opportunities
- **Codify Domain Boundaries:** Extract pure data/state manipulation utilities (e.g., portions of `contract-manager.js` and `analytics-engine.js`) into shared helpers consumed by both UI and automation layers. This aligns with the documented module pattern and reduces duplication when future AI agents generate features. 【F:CLAUDE.md†L929-L1014】
- **Expand Automated Diagnostics:** `production-readiness.js` already surfaces readiness gaps; extend it to execute representative calculations by calling `WindowCalc` and `Money` from `calc.js` so release checks catch arithmetic regressions without relying solely on Playwright runs. 【F:production-readiness.js†L1-L52】【F:calc.js†L1-L83】
- **Tighten Error Telemetry:** `bug-tracker.js` persists structured reports, but pairing it with `health-check.js` to auto-attach recent health metrics and `storage.js` quota status would accelerate triage, especially when asynchronous AI-driven fixes are proposed. 【F:bug-tracker.js†L1-L50】【F:health-check.js†L1-L60】
- **Scenario Playbooks:** Convert the existing deployment/test checklists into runnable scripts (e.g., shell helpers that wrap Playwright plus `production-readiness.js`) so AI copilots can invoke end-to-end validation with a single command rather than following prose instructions. 【F:DEPLOYMENT_CHECKLIST.md†L1-L80】【F:test-checklist.js†L1-L40】

## 11. VS Code Workflow for Codex & Claude
- **Shared Context Packs:** CLAUDE.md already aggregates module contracts and workflows; keep a pared-down "prompt kit" (top-level summary + current task) in VS Code workspaces so both Codex and Claude terminals receive identical context before coding, reducing divergent suggestions. 【F:CLAUDE.md†L1-L40】【F:CLAUDE.md†L929-L1014】
- **Claude Terminal Loop:** The `setup-claude-terminal.sh` script provisions Anthropic CLI shortcuts (`claude`, `cc`, `ccfix`, `cct`) for quick lint/test conversations. Wire those commands into VS Code tasks so a single hotkey can send staged diffs for review or trigger Claude-powered fixes/tests without leaving the editor. 【F:setup-claude-terminal.sh†L1-L48】
- **Codex Pairing Pattern:** Use VS Code's inline ChatGPT/Codex to draft or refactor modules, then immediately hand the diff to Claude's `ccfix` for targeted scrutiny—mirroring a "write with Codex, review with Claude" baton pass. Align both agents around the ES5/IIFE scaffolding described in CLAUDE.md to avoid stylistic churn. 【F:CLAUDE.md†L929-L1014】
- **AI-Assisted Code Review Checklist:** During pull-request prep, ask Codex to generate a quick Playwright/state-impact summary while Claude cross-checks deployment readiness via the scripts above. Capturing their findings in `docs/` keeps institutional knowledge fresh and gives future agents reference prompts. 【F:package.json†L1-L32】【F:production-readiness.js†L1-L52】
