# Build Timing Baseline

**Created:** 2025-11-26  
**Purpose:** Track build/test timings to measure optimization impact

---

## Current Baseline (Pre-Optimization)

### Test Execution

| Command | Duration | Notes |
|---------|----------|-------|
| `npm test` (full suite) | **37m 36s** | 606 tests, Chromium headed |
| `npm test` (headless) | ~25-30m | Estimated, single worker |

### Build Commands

| Command | Duration | Output |
|---------|----------|--------|
| `npm run build:api` | **0.98s** | TypeScript compilation |
| `npm run build:dashboard` | **0.87s** | Vite build, 152 modules, 361KB bundle |
| `npm run build:all` | ~2.5s | Turbo parallel build |

### Capacitor Sync

| Command | Duration | Notes |
|---------|----------|-------|
| `npm run cap:sync` | **0.56s** | Requires iOS/Android platform setup |
| `npm run cap:copy` | ~0.3s | Web assets only |

### npm Install

| Command | Duration | Notes |
|---------|----------|-------|
| `npm ci` (cold) | ~45-60s | Clean install, no cache |
| `npm ci` (warm) | ~15-20s | With npm cache |

---

## CI Pipeline Timings

Based on `.github/workflows/ci.yml`:

| Stage | Estimated Duration |
|-------|-------------------|
| Checkout | ~5s |
| Setup Node (cached) | ~10s |
| npm ci | ~30-60s |
| Prisma generate | ~5s |
| Prisma migrate | ~3s |
| build:api | ~2s |
| build:dashboard | ~2s |
| Start API + sleep | ~10s |
| Smoke tests | ~5s |
| **Total** | **~2-3 minutes** |

---

## Optimization Targets

### Week 1-2 Goals
- [ ] Reduce full test suite to < 20 minutes with parallelization
- [ ] Add browser caching to save ~30s per CI run
- [ ] Add npm cache to save ~30s per CI run

### Success Metrics
- CI wall-clock time reduced by 25%
- Test execution with 3+ workers: < 15 minutes
- Cold npm ci: < 45 seconds

---

## Measurement Commands

```bash
# Full test suite timing
time npm test -- --reporter=list

# Parallel test timing (when enabled)
time npm test -- --workers=4

# Build timing
time npm run build:api
time npm run build:dashboard
time npm run build:all

# npm install timing
rm -rf node_modules && time npm ci
```

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2025-11-26 | Initial baseline | N/A |
