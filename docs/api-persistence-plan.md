# Meta-API Persistence Plan (Prisma/Postgres)

## Goal
Replace in-memory stores with Prisma/Postgres while preserving the current REST shape and keeping an optional in-memory fallback when `DATABASE_URL` is absent.

## Steps
1. **Dependencies & Scripts**
   - Add Prisma deps to `apps/meta-api`: `prisma`, `@prisma/client`.
   - Add scripts: `prisma:generate`, `prisma:migrate`, `prisma:seed` (seed optional).
2. **Schema Alignment**
   - Use `prisma/schema.prisma` (Project, Feature, Asset, AssetVersion, join tables).
   - Ensure enums or string status fields match current values (`draft|in-progress|complete`, `draft|active|deprecated`).
3. **Database Config**
   - Use `DATABASE_URL` from `.env`; document in `apps/meta-api/.env.example`.
   - Optional: fallback to in-memory if no `DATABASE_URL` (for quick local demo).
   - For Accelerate/Data Proxy, use `PRISMA_ACCELERATE_URL` and generate with `--no-engine` if serverless/edge.
4. **Data Access Layer**
   - Create `apps/meta-api/src/db/client.ts` to initialize PrismaClient and handle missing env gracefully.
   - Create repositories/services: `projectService`, `featureService`, `assetService`.
5. **Route Wiring**
   - Swap project/feature/asset routes to call services:
     - Projects: list/get/create/update/delete.
     - Features: list/get, create under project, update, delete.
     - Assets: list/get/create/update/delete.
     - Summaries: counts derived from DB (fallback to in-memory if configured).
6. **Seeding**
   - Seed from `apps/domain/sampleData.ts` into DB (projects, features, assets, versions).
7. **Health & Error Handling**
   - `/health` should reflect DB connectivity (ok/error).
   - Uniform error responses (400/404/409) preserved.
8. **Docs**
   - Update `apps/README.md` and `docs/meta-context.md` with DB setup, scripts, and fallback behavior.
   - Note that dashboard uses the same REST endpoints—no changes needed once API persists data.
