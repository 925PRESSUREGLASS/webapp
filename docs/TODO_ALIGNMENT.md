# TODO Alignment Report

**Generated**: November 30, 2025  
**Branch**: main  
**Status**: Phase 2B Complete, Phase 2C Next

---

## Summary

This document tracks all TODOs discovered in the codebase, categorized by area and phase, and aligned with the MetaBuild roadmap.

---

## Phase 0 - Cleanup & Analysis (COMPLETE ✅)

These items were low-risk tidying tasks, now resolved:

| Area | Item | File | Status |
|------|------|------|--------|
| DOCS_META | Document build timings | BUILD_TIMING.md | ✅ Done |
| DOCS_META | Create CONTRIBUTING.md | CONTRIBUTING.md | ✅ Done |
| DOCS_META | Create RUNBOOK.md | RUNBOOK.md | ✅ Done |
| INFRA | Pin dependency versions | package.json | ✅ Done |
| INFRA | Add npm audit CI | .github/workflows/ci.yml | ✅ Done |

---

## Phase 1 - Foundation (COMPLETE ✅)

MetaBuild MVP backbone work:

| Area | Item | File | Status |
|------|------|------|--------|
| METABUILD_BACKEND | Prisma schema setup | prisma/schema.prisma | ✅ Done |
| METABUILD_BACKEND | Meta-API server | apps/meta-api/ | ✅ Done |
| METABUILD_BACKEND | Email service | apps/meta-api/src/services/email.service.ts | ✅ Done |
| METABUILD_DASHBOARD | React dashboard | apps/meta-dashboard/ | ✅ Done |
| WEBAPP_CORE | Business settings UI | business-settings.js | ✅ Done |
| WEBAPP_CORE | Contract wizard edit mode | contract-wizard.js | ✅ Done |
| WEBAPP_TESTS | Email integration tests | tests/email-integration.spec.js | ✅ Done |
| INFRA | Browser test matrix | .github/workflows/ci.yml | ✅ Done |
| INFRA | Lighthouse CI | lighthouserc.json | ✅ Done |
| INFRA | Security scanning | .github/workflows/security.yml | ✅ Done |

---

## Phase 2 - Infrastructure & Expansion (IN PROGRESS 🔄)

### 2A: Production Infrastructure ✅ COMPLETE

See [ADR-002: Infrastructure Stack](./adr/002-infrastructure-stack.md) for decision details.

**Stack Decision**: Render Postgres + Render API + Vercel Dashboard

**Live Endpoints:**
- Meta-API: `https://meta-api-78ow.onrender.com`
- Quote Engine: `https://webap5p.vercel.app`

| Priority | Item | Provider | Status |
|----------|------|----------|--------|
| **HIGH** | Create Render Postgres instance | Render | ✅ Done |
| **HIGH** | Copy DATABASE_URL (internal) | Render | ✅ Done |
| **HIGH** | Update Prisma datasource | prisma/schema.prisma | ✅ Done |
| **HIGH** | Run production migration | Render | ✅ Done |
| **HIGH** | Deploy Meta-API to Render | Render | ✅ Done |
| **HIGH** | Configure API environment vars | Render | ✅ Done |
| **HIGH** | Deploy Quote Engine to Vercel | Vercel | ✅ Done |
| MEDIUM | Configure CORS for all frontends | meta-api | ✅ Done |
| MEDIUM | Set up monitoring | Render | ✅ Done (health endpoint) |

### 2B: Cloud Sync & Multi-Device ✅ COMPLETE

| Priority | Item | File | Status |
|----------|------|------|--------|
| HIGH | PWA ↔ meta-api connection | sync.service.ts, sync.ts routes | ✅ Done (Task 10) |
| HIGH | User authentication system | auth.service.ts, auth.ts routes | ✅ Done (Tasks 8-9) |
| MEDIUM | Multi-device data sync | sync.ts store (frontend) | ✅ Done (Task 10) |
| MEDIUM | Cloud backup integration | backup-manager.js | ⬜ Pending (Phase 2E) |

**Completed Commits:**
- `b119f51` - JWT authentication backend (Task 8)
- `d2f4891` - Frontend auth UI (Task 9)  
- `0be206b` - Data sync infrastructure (Task 10)

### 2C: CRM Integration (GHL)

| Priority | Item | File | Status |
|----------|------|------|--------|
| HIGH | GHL opportunity sync activation | ghl-sync.js | ⬜ Pending |
| HIGH | GHL task sync activation | ghl-tasks.js | ⬜ Pending |
| MEDIUM | Webhook handlers for GHL | apps/meta-api/ | ⬜ Pending |
| MEDIUM | Two-way contact sync | ghl-sync.js | ⬜ Pending |

### 2D: Push Notifications

| Priority | Item | File | Status |
|----------|------|------|--------|
| MEDIUM | Push notification token backend | push-notifications.js | ⬜ Pending |
| MEDIUM | Notification service in API | apps/meta-api/ | ⬜ Pending |
| LOW | Subscription management UI | settings | ⬜ Pending |

### 2E: Dashboard & Other

| Priority | Item | File | Status |
|----------|------|------|--------|
| MEDIUM | Projects list page | apps/meta-dashboard/ | ⬜ Pending |
| MEDIUM | Asset registry UI | apps/meta-dashboard/ | ⬜ Pending |
| MEDIUM | Photo attachment cloud upload | camera.js | ⬜ Pending |
| LOW | Offline queue sync to cloud | offline-sync.js | ⬜ Pending |
| LOW | Visual regression baseline | tests/visual-regression.spec.js | ⬜ Pending |

---

## Phase Later - Future Enhancements

Nice-to-have improvements for future iterations:

| Area | Item | Notes |
|------|------|-------|
| WEBAPP_CORE | Voice input for notes | Accessibility enhancement |
| WEBAPP_CORE | Recurring quote templates | Customer requested |
| METABUILD_BACKEND | GraphQL API layer | Alternative to REST |
| METABUILD_DASHBOARD | Mobile-responsive dashboard | Currently desktop-focused |
| INFRA | Kubernetes deployment | Scalability |
| INFRA | Multi-region deployment | Latency optimization |
| DOCS_META | Video tutorials | Onboarding improvement |

---

## Infrastructure Stack Decision

**Decided**: November 27, 2025 (see ADR-002)

| Layer | Provider | Rationale |
|-------|----------|-----------|
| Database | **Render Postgres** | Same network as API, lowest latency (~1-5ms) |
| API | **Render** | Long-running Node, no serverless issues |
| Dashboard | **Vercel** | Great React DX, preview deploys |
| Webapp | **Cloudflare Pages** | Keep existing, independent |
| ORM | **Prisma** | Already integrated, type-safe |

**Estimated Cost**: $14/month (after 90-day free trial)

**Why Render Postgres over Supabase/Neon**:
- Same network = lowest latency (~1-5ms vs ~20-50ms)
- Single vendor = simpler ops
- No cold starts
- Perfect Prisma fit (no unused features)

---

## Next Actions (Recommended)

### Completed ✅

1. ~~Create Render Postgres instance~~ — ✅ Done
2. ~~Copy internal DATABASE_URL~~ — ✅ Done
3. ~~Update Prisma datasource~~ — ✅ Done
4. ~~Deploy Meta-API to Render~~ — ✅ Done
5. ~~Deploy Quote Engine to Vercel~~ — ✅ Done
6. ~~Configure environment sync~~ — ✅ Done
7. ~~PWA ↔ meta-api connection~~ — ✅ Done (Task 10)
8. ~~User authentication~~ — ✅ Done (Tasks 8-9)

### Next Up (Task 11+)

9. **Wire sync store into quote-engine pages** — Connect sync store to actual page operations
10. **Add sync status indicator to UI** — Show sync state (pending/syncing/synced)
11. **GHL Integration** — Activate existing sync modules (Phase 2C)
12. **Push Notifications** — Backend and UI (Phase 2D)

---

## How to Use This Document

1. **Before starting work**: Check this document for current priorities
2. **When finding TODOs**: Add them here with proper AREA:PHASE tags
3. **When completing work**: Mark items as ✅ Done with date
4. **Weekly sync**: Review and update priorities based on progress

---

## Related Documents

- [METABUILD_NEXT_STEPS.md](../METABUILD_NEXT_STEPS.md) - Roadmap phases
- [docs/adr/002-infrastructure-stack.md](./adr/002-infrastructure-stack.md) - Infrastructure ADR
- [RUNBOOK.md](../RUNBOOK.md) - Operations guide
- [CLAUDE.md](../CLAUDE.md) - AI agent context
