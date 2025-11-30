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
- **Integrated into server.ts** - replaced inline code with module calls
- **server.ts reduced from 2,223 to 2,099 lines** (-124 lines)

---

## In Progress 🚧

### server.ts Refactoring
**File:** `apps/meta-api/src/server.ts` (2,099 lines, down from 2,223)

The main API file still contains ~45 inline route handlers. Should continue splitting into modular route files.

#### Route Modules Status

| File | Routes | Status |
|------|--------|--------|
| `routes/shared.ts` | Schemas, helpers | ✅ Created |
| `routes/health.ts` | `/health` | ✅ Integrated |
| `routes/public.ts` | `/api/public/*` | ✅ Integrated |
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

### Type Consistency Audit ✅
- Created `apps/meta-api/src/types/jwt.ts` with canonical `JwtPayload` interface
- Fixed `ghl.ts`: `userId` → `id` bug (was using wrong field name)
- Updated `auth.ts`, `sync.ts`, `ghl.ts` to import shared type
- All route files now use consistent JWT payload definition

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
| 2 | ~~Type consistency audit~~ ✅ | Done |
| 2 | ~~Integrate health/public routes into server.ts~~ ✅ | Done |
| 2-3 | Extract `routes/pricebook.ts` | 4h |
| 3 | Extract remaining route files | 6h |
| 4 | Bundle optimization | 3h |

---

*Created: 2024-12-01*
*Last Updated: 2024-12-02*
