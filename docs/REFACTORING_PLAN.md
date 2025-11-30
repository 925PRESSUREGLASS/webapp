# Refactoring Plan - TicTacStick 2.0

## Completed ✅

### Documentation Consolidation (Done)
- Moved 84 root markdown files into organized `docs/` structure
- Root now contains only: `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`
- Folders: `docs/architecture/`, `docs/deployment/`, `docs/guides/`, `docs/testing/`, `docs/sessions/`, `docs/archive/`

### Debug Code Cleanup (Done)
- Removed `console.error('[SYNC] JWT verify failed:', err)` from `sync.ts`
- Verified no other temporary debug logging in routes

### Route Module Extraction - Phase 1 (Done)
- Created `routes/shared.ts` - Common Zod schemas and `validateOrReply` helper
- Created `routes/health.ts` - `/health` endpoint with Prisma/memory fallback
- Created `routes/public.ts` - `/api/public/*` pricing endpoints (no auth)
- **Next step:** Integrate into `server.ts` and remove duplicated code

---

## In Progress 🚧

### server.ts Refactoring
**File:** `apps/meta-api/src/server.ts` (2,220 lines)

The main API file contains ~50 inline route handlers. Should be split into modular route files.

#### Route Modules Status

| File | Routes | Status |
|------|--------|--------|
| `routes/shared.ts` | Schemas, helpers | ✅ Created |
| `routes/health.ts` | `/health` | ✅ Created |
| `routes/public.ts` | `/api/public/*` | ✅ Created |
| `routes/ai.ts` | `/ai/*` | 📋 Pending |
| `routes/projects.ts` | `/projects/*`, `/features/*` | 📋 Pending |
| `routes/businesses.ts` | `/businesses/*` | 📋 Pending |
| `routes/pricebook.ts` | Service lines, types, modifiers, packages, market areas | 📋 Pending |
| `routes/assets.ts` | `/assets/*` | 📋 Pending |
| `routes/apps.ts` | `/apps/*` | 📋 Pending |

#### Complexity Notes
- Uses local `*Store` variables for in-memory fallback when Prisma unavailable
- Shares `validateOrReply()` helper and Zod schemas
- Rate limiting state is local to `buildServer()`

#### Migration Strategy
1. Create `routes/shared.ts` for common schemas and helpers
2. Extract routes one group at a time
3. Keep fallback store logic with routes
4. Add integration tests before/after each extraction
5. Update imports in `server.ts`

---

## Pending 📋

### v1 PWA Cleanup
- `v1/sw-optimized.js` exists but `sw.js` is used in production
- Review if optimized version should replace current SW
- Multiple `*-enhanced.js` files may have superseded originals

### Test Artifact Cleanup
- `test-results/` (90MB) and `v1/test-results/` (218MB) are local artifacts
- Already in `.gitignore` - consider periodic cleanup script

### Type Consistency Audit
- Verify JWT payload types match across:
  - `apps/meta-api/src/types/index.ts`
  - `apps/quote-engine/src/stores/`
  - `packages/domain/`

### Bundle Analysis
- Run Vite bundle analyzer on `apps/quote-engine`
- Check for unused Quasar components

---

## Timeline

| Week | Focus | Effort |
|------|-------|--------|
| 1 | ~~Documentation consolidation~~ ✅ | Done |
| 1 | ~~Debug code cleanup~~ ✅ | Done |
| 2 | ~~Extract `routes/shared.ts`, `routes/health.ts`, `routes/public.ts`~~ ✅ | Done |
| 2 | Integrate new routes into `server.ts` | 1h |
| 2-3 | Extract `routes/pricebook.ts` | 4h |
| 3 | Extract remaining route files | 6h |
| 4 | Type consistency audit | 2h |
| 4 | Bundle optimization | 3h |

---

*Created: 2024-12-01*
*Last Updated: 2024-12-01*
