# Build Baseline (Metabuild Week 1)

## Build Graph Snapshot
- **Dependency lock and audit:** `npm install --package-lock-only` to refresh `package-lock.json` without mutating `node_modules`, followed by `npm run audit:daily` for a production-scope vulnerability sweep.
- **Web surface tests:** `npm test` now fans out to Chromium, Firefox, WebKit, and a headed Chromium pass using the shared http-server bootstrap defined in `playwright.config.js`.
- **Native alignment:** `npm run cap:sync` remains the entry point for syncing Capacitor assets after any `capacitor.config.json` or icon change.

## Baseline Timings (local container)
- `npm install --package-lock-only`: **~3s** to resolve 199 packages and validate the lockfile (clean tree, no downloads required).  
- `npm test -- --list`: **~2.2s** to enumerate 1,660 Playwright tests across the cross-browser matrix (results redirected to `/tmp/testlist.log`).

## Deterministic Outputs & Artifacts
- Dependencies are pinned (no caret ranges) with explicit Node.js and npm engine minima to align local and CI installs.
- Package-lock coverage now captures all JS dependencies; rerun `npm install --package-lock-only` after any dependency edits to keep the lock deterministic.
- Playwright discovery runs across all browser targets even when headless execution is disabled, keeping the smoke matrix observable without executing the full suite.
