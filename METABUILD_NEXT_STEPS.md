# Metabuild: Next Steps

## Objective
Establish a repeatable, observable build spine that keeps browser, native, and PDF surfaces aligned while lowering friction for releases and contributors.

## Immediate Priorities (Week 1)
- **Baseline the pipeline:** Document the current build graph (npm scripts, Playwright harness, Capacitor sync) and record timing for each stage to create before/after comparisons.
- **Stabilize dependencies:** Lock npm and Playwright versions, verify `package-lock.json` coverage, and add a daily audit run to catch drift before release branches cut.
- **Harden deterministic outputs:** Ensure static asset hashing (icons, manifests, service worker) happens in a single place and confirm reproducible bundles across local and CI builds.
- **Smoke-test matrix:** Stand up a minimal daily matrix covering iOS Safari, Chromium, and Firefox using the existing headless Playwright flow plus one headed sanity run for visual regressions.

## Near-Term Delivery (Week 2-3)
- **Parallelize and cache:** Split lint/unit/e2e into separate jobs with shared npm cache keys and Playwright browser download reuse; measure cold vs. warm timings.
- **Capacitor alignment:** Add a `npm run cap:verify` helper that runs `npm run cap:sync` followed by checksum comparison for `capacitor.config.json`, icons, and native assets.
- **Artifact discipline:** Configure CI to always publish Playwright traces, screenshots, and HTML reports to `test-results/` and prune after 14 days to keep storage bounded.
- **Config safety rails:** Validate `config.js` and `config-production.js` for secrets or environment mismatches during CI; fail fast if unsafe keys are detected.

## Team Workflow Upgrades (Week 4)
- **Change windows and freeze rules:** Define branch protection plus a release freeze checklist for PWA assets and Cloudflare rules to prevent cache divergence.
- **Reviewer prompts:** Add PR templates that require links to deployment checklists, manual testing steps, and any service worker or native plugin changes.
- **Local dev ergonomics:** Provide a one-command bootstrap (`npm install && npm test && python3 -m http.server 8080`) with guidance for common iOS Safari debugging cases.

## Success Metrics
- CI wall-clock time reduced by 25% with caching and parallelization.
- Zero unpinned dependency updates on release branches.
- Daily green runs across the cross-browser smoke matrix for seven consecutive days.
- All PRs include published Playwright artifacts and referenced deployment/manual test checklists.
