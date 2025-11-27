# TODO Alignment Report

**Generated**: November 27, 2025  
**Branch**: main  
**Status**: Aligned with current MetaBuild plan

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

### 2A: Production Infrastructure (HIGH PRIORITY)

See [ADR-002: Infrastructure Stack](./adr/002-infrastructure-stack.md) for decision details.

**Stack Decision**: Render Postgres + Render API + Vercel Dashboard

| Priority | Item | Provider | Status |
|----------|------|----------|--------|
| **HIGH** | Create Render Postgres instance | Render | ⬜ Pending |
| **HIGH** | Copy DATABASE_URL (internal) | Render | ⬜ Pending |
| **HIGH** | Update Prisma datasource | prisma/schema.prisma | ⬜ Pending |
| **HIGH** | Run production migration | Render | ⬜ Pending |
| **HIGH** | Deploy Meta-API to Render | Render | ⬜ Pending |
| **HIGH** | Configure API environment vars | Render | ⬜ Pending |
| **HIGH** | Deploy Dashboard to Vercel | Vercel | ⬜ Pending |
| MEDIUM | Configure CORS for all frontends | meta-api | ⬜ Pending |
| MEDIUM | Set up monitoring | Render | ⬜ Pending |

### 2B: Cloud Sync & Multi-Device

| Priority | Item | File | Status |
|----------|------|------|--------|
| HIGH | PWA ↔ meta-api connection | webapp | ⬜ Pending |
| HIGH | User authentication system | apps/meta-api/ | ⬜ Pending |
| MEDIUM | Multi-device data sync | apps/meta-api/ | ⬜ Pending |
| MEDIUM | Cloud backup integration | backup-manager.js | ⬜ Pending |

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

### Immediate (This Week)

1. **Create Render Postgres instance** — Oregon region
2. **Copy internal DATABASE_URL** — For lowest latency
3. **Update Prisma datasource** — Point to Render Postgres

### Short-term (Next 2 Weeks)

4. **Deploy Meta-API to Render** — Production API with health check
5. **Deploy Dashboard to Vercel** — Production dashboard
6. **Configure environment sync** — All services pointing to each other

### Medium-term (Next Month)

7. **PWA ↔ meta-api connection** — First sync from webapp to cloud
8. **User authentication** — Basic auth in meta-api
9. **GHL Integration** — Activate existing sync modules

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
