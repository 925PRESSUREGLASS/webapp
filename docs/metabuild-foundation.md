# MetaBuild Foundation

## Decisions
- `apps/` workspace with separate `meta-api` (Fastify + Prisma) and `meta-dashboard` (React + TS). Shared domain types in `apps/domain/types.ts`.
- Fastify chosen for lightweight API; `/health` reports DB mode. Added CORS for dashboard.
- React+TS dashboard shell with status badges, summary tiles, filters, manual refresh, API health indicator.
- Database: PostgreSQL + Prisma. Prisma schema includes Project, Feature, Asset, AssetVersion, ProjectAsset, FeatureAsset plus Business/ServiceLine/ServiceType/Modifier/MarketArea/PriceBook/Package for the service catalog. AssetStatus/AssetType/BusinessStatus are enums.
- Seeds: `apps/meta-api/src/seed.ts` loads sample MetaBuild project/feature/assets and service catalog for 925 Pressure Glass & Jim’s Cottesloe. Run with `DATABASE_URL=... npm run prisma:seed --prefix apps/meta-api`.
- Env validation: `apps/meta-api/src/config/env.ts` (zod) ensures `DATABASE_URL` is present; optional `API_KEY`/`ALLOWED_ORIGIN` for auth/CORS; API routes validate payloads with zod schemas (projects/features/assets/catalog) and return 400 with details on invalid input. Dashboard can send `VITE_META_API_KEY` as `x-api-key`.
  - Env examples: `apps/meta-api/.env.example` (DATABASE_URL, API_KEY, ALLOWED_ORIGIN, RATE_LIMIT_PER_MIN) and `apps/meta-dashboard/.env.example` (VITE_META_API_URL, VITE_META_API_KEY).
- Dev workflow + MCP setup lives in `docs/dev-workflow.md` (task template, commands, recommended MCPs: git, fs, prisma, node/npm, optional Postgres/HTTP).
  - CI Postgres service: `postgresql://postgres:postgres@localhost:5432/metabuild_ci` (migrations run before smoke).
- Frontend data layer: TanStack Query wraps the app; projects/features/assets load via `useQuery`, CRUD uses `useMutation` with query invalidation. React Hook Form + zod wired for create + edit forms (projects/features/assets). Manual refresh refetches queries + catalog in one click. Catalog UI now supports package item add/remove and inline modifier edit.

## Current API Surface
- Health: `GET /health`
- Projects: `GET /projects`, `GET /projects/summary`, `POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id`
- Features: `GET /features`, `POST /projects/:id/features`, `PUT /projects/:projectId/features/:featureId`, `DELETE /features/:id`, `GET /features/summary`
- Assets: `GET /assets`, `GET /assets/summary`, `POST /assets`, `PUT /assets/:id`, `DELETE /assets/:id`
- Service catalog: `GET /businesses`, `GET/POST/PUT/DELETE /service-lines`, `GET/POST/PUT/DELETE /service-types`, `GET/POST/PUT/DELETE /market-areas`, `GET/POST/PUT/DELETE /packages`, `POST /packages/:id/items`, `DELETE /packages/:packageId/items/:itemId`, `GET /pricebook/current?businessId=...`, `GET/POST/DELETE /modifiers`
- Smoke script: `node apps/meta-api/scripts/smoke.js` (requires API running on :4000).

## Dev Commands
- API dev: `npm run dev --prefix apps/meta-api`
- Dashboard dev: `npm run dev --prefix apps/meta-dashboard`
- Both: `npm run dev`
- Build API: `npm run build --prefix apps/meta-api`
- Build dashboard: `npm run build --prefix apps/meta-dashboard`
- Root helpers: `npm run build:api`, `npm run build:dashboard`, `npm run build:all` (turbo)
- Prisma: `npm run prisma:migrate --prefix apps/meta-api`, `npm run prisma:generate --prefix apps/meta-api`, `npm run prisma:seed --prefix apps/meta-api`

## Outstanding Work
- Linting/CI, workspace tooling (Nx/Turbo) and keep `docs/meta-context.md` + `docs/data-crud-phase.md` synced.
