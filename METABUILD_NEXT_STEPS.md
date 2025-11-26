# Metabuild: Next Steps

**Last Updated:** 2025-11-26

## Objective

Establish a repeatable, observable build spine that keeps browser, native, and PDF surfaces aligned while lowering friction for releases and contributors.

---

## ✅ Immediate Priorities (Week 1) - COMPLETE

- [x] **Baseline the pipeline:** `BUILD_TIMING.md` documents npm scripts, Playwright harness, Capacitor sync timings
- [x] **Stabilize dependencies:** Pinned prisma, turbo, @prisma/client versions; daily npm audit in CI
- [x] **Harden deterministic outputs:** `cap:verify` script checksums native assets
- [x] **Smoke-test matrix:** Playwright browser matrix (chromium, firefox, webkit) in CI

## ✅ Near-Term Delivery (Week 2-3) - COMPLETE

- [x] **Parallelize and cache:** Playwright browser caching added to CI
- [x] **Capacitor alignment:** `npm run cap:verify` checksums capacitor.config.json, icons, native assets
- [x] **Artifact discipline:** 14-day retention on Playwright traces, screenshots, HTML reports
- [x] **Config safety rails:** `npm run validate:config` checks for exposed secrets; runs in CI

## ✅ Team Workflow Upgrades (Week 4) - COMPLETE

- [x] **Change windows and freeze rules:** `RELEASE_FREEZE.md` checklist created
- [x] **Reviewer prompts:** PR template with deployment checklist, manual testing, SW/native sections
- [x] **Local dev ergonomics:** `CONTRIBUTING.md` with one-command bootstrap and iOS Safari debugging

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| CI wall-clock time | Reduced 25% with caching | ⏳ Measuring |
| Unpinned deps on release | Zero | ✅ Complete |
| Cross-browser daily green | 7 consecutive days | ⏳ Monitoring |
| PR artifacts & checklists | 100% compliance | ✅ Template ready |

---

## 📋 Week 5+ Roadmap

### Performance Optimization

- [x] Add Turborepo remote caching - `turbo.json` configured
- [ ] Measure and reduce test suite time (target: <15 min)

### Quality Gates

- [x] Add Lighthouse CI for PWA scores - `lighthouserc.json`
- [x] Add bundle size tracking - CI job added
- [ ] Add visual regression testing

### Documentation

- [ ] API documentation generation
- [x] Architecture decision records (ADRs) - `docs/adr/`
- [x] Runbook for common operations - `RUNBOOK.md`

### Security

- [x] Dependabot alerts enabled - `.github/dependabot.yml`
- [x] SAST scanning in CI - `.github/workflows/security.yml`
- [x] Security policy - `SECURITY.md` (already existed)


