# Meta Platform Context

## Scope
- Meta-platform developer portal with `meta-api` (Fastify + Prisma + Postgres) and `meta-dashboard` (React + TS).
- Child apps (TicTacStick PWA/quoting tools) remain vanilla JS; no framework migration unless explicitly requested.

## Current State
- Data: Prisma schema covers Project/Feature/Asset/AssetVersion + catalog (Business, ServiceLine, ServiceType, Modifier, MarketArea, PriceBook, Package).
- API endpoints: health, projects, features, assets, catalog (businesses/lines/types/areas/packages/modifiers/pricebook). CORS enabled.
- DB: Postgres with seeds (`npm run prisma:seed --prefix apps/meta-api`) for MetaBuild samples and service catalog (925 Pressure Glass, Jim’s Cottesloe).
- Env: `apps/meta-api/src/config/env.ts` (zod) validates `DATABASE_URL`.
- Frontend: TanStack Query + mutations; create forms for projects/features/assets use zod + React Hook Form; edit forms still controlled. Query invalidations reduce reload-token usage.
- Docs: `docs/metabuild-foundation.md` and `docs/additions-plan.md` record decisions and backlog.

## Key Commands
- Dev API: `npm run dev --prefix apps/meta-api`
- Dev dashboard: `npm run dev --prefix apps/meta-dashboard`
- Both: `npm run dev`
- Prisma: `npm run prisma:migrate --prefix apps/meta-api`, `npm run prisma:seed --prefix apps/meta-api`

## Outstanding Work
- Convert edit forms to React Hook Form + zod; drop reload-token pattern in favor of query invalidations only.
- Catalog UI: modifier CRUD, package-item UI, edit flows.
- Prisma enums for statuses/types and tighter API validation.
- Monorepo tooling (Nx/Turbo) and lint/CI wiring.
- Refresh `docs/data-crud-phase.md` (to create) with schema + endpoints, and keep this file in sync.
