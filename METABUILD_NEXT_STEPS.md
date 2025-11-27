# Metabuild: Next Steps

**Last Updated:** 2025-11-27

## Objective

Establish a repeatable, observable build spine that keeps browser, native, and PDF surfaces aligned while lowering friction for releases and contributors.

---

## Current Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0-1 (Foundation) | ✅ Complete | 100% |
| Phase 2 (Infrastructure) | 🔄 In Progress | 5% |
| Phase 3 (Scale) | ⬜ Not Started | 0% |

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

## 🔄 Phase 2: Infrastructure & Expansion (IN PROGRESS)

See [ADR-002: Infrastructure Stack](docs/adr/002-infrastructure-stack.md) for full details.

### 2A: Production Infrastructure (HIGH PRIORITY)

| Item | Provider | Status |
|------|----------|--------|
| Create Render Postgres | Render | ⬜ Pending |
| Deploy Meta-API | Render | ⬜ Pending |
| Deploy Dashboard | Vercel | ⬜ Pending |
| Configure CORS & environment | All | ⬜ Pending |

**Decided Stack (ADR-002):**
- **Database**: Render Postgres (same network = ~1-5ms latency)
- **API**: Render (long-running Node, no serverless issues)
- **Dashboard**: Vercel (great React DX)
- **Webapp**: Cloudflare Pages (keep existing)

**Estimated Cost**: $14/month (after 90-day free trial)

### 2B: Cloud Sync & CRM

- [ ] PWA ↔ meta-api connection
- [ ] User authentication system
- [ ] GHL opportunity sync activation
- [ ] GHL task sync activation
- [ ] Multi-device data sync

### 2C: Push Notifications

- [ ] Token backend in meta-api
- [ ] Notification service
- [ ] Subscription management

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| CI wall-clock time | Reduced 25% with caching | ✅ Achieved |
| Unpinned deps on release | Zero | ✅ Complete |
| Cross-browser daily green | 7 consecutive days | ✅ Stable |
| PR artifacts & checklists | 100% compliance | ✅ Template ready |
| Production infrastructure | Deployed | ⬜ Phase 2 |

---

## ✅ Completed Work (Week 5+)

### Performance Optimization

- [x] Add Turborepo remote caching - `turbo.json` configured
- [x] Reduce test suite time with sharding - `ci.yml` (3 browsers × 4 shards = 12 parallel runners)

### Quality Gates

- [x] Add Lighthouse CI for PWA scores - `lighthouserc.json`
- [x] Add bundle size tracking - CI job added
- [x] Add visual regression testing - `tests/visual-regression.spec.js`

### Documentation

- [x] API documentation generation - `apps/meta-api/API.md`
- [x] Architecture decision records (ADRs) - `docs/adr/`
- [x] Runbook for common operations - `RUNBOOK.md`
- [x] TODO alignment report - `docs/TODO_ALIGNMENT.md`

### Security

- [x] Dependabot alerts enabled - `.github/dependabot.yml`
- [x] SAST scanning in CI - `.github/workflows/security.yml`
- [x] Security policy - `SECURITY.md` (already existed)

### Features

- [x] Email integration (backend + frontend) - `apps/meta-api/src/services/email.service.ts`
- [x] Email integration tests - `tests/email-integration.spec.js`
- [x] Business settings UI - `business-settings.js`
- [x] Contract wizard edit mode - `contract-wizard.js`

---

## 📋 Next Actions

### This Week
1. Create Render Postgres instance — Oregon region
2. Copy internal DATABASE_URL — For lowest latency
3. Deploy Meta-API to Render — Connect to Postgres

### Next 2 Weeks
4. Deploy Dashboard to Vercel
5. Configure CORS for all frontends
6. Run Prisma migrations on production

### This Month
7. PWA ↔ meta-api connection
8. User authentication (JWT)
9. GHL integration activation

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [docs/adr/002-infrastructure-stack.md](docs/adr/002-infrastructure-stack.md) | Infrastructure decisions |
| [docs/TODO_ALIGNMENT.md](docs/TODO_ALIGNMENT.md) | Task tracking |
| [RUNBOOK.md](RUNBOOK.md) | Operations guide |
| [CLAUDE.md](CLAUDE.md) | AI agent context |


