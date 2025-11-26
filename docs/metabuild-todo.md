# MetaBuild TODO (next steps)

## Backend (meta-api)
- ✅ Prisma/Postgres schema for Project, Feature, Asset, AssetVersion with seeds.
- ✅ Added Business, ServiceLine, ServiceType, Modifier, MarketArea, PriceBookVersion/Rate, Package models and migrations.
- ✅ CRUD/list endpoints for projects/features/assets plus new endpoints (create/update/delete/list) for businesses, service lines, service types, market areas, packages, and current price book; `/health` reflects DB connectivity.
- TODO: Validation/error logging across all endpoints; tighten DTOs; add modifier CRUD and package items management.

## Frontend (meta-dashboard)
- ✅ Projects/features/assets wired to API with CRUD and filters.
- ✅ Service catalog section with business switcher, quick create for lines/types, service lines/types table, market areas, packages, and current price book view.
- TODO: Add inline toasts, disable during async across all forms, and add edit/delete flows for catalog entries in UI.
  - Progress: toasts added and delete flows for lines/types/areas/packages; remaining: modifier CRUD UI, package items UI, and edit flows for catalog entries.

## Data/Seeds
- ✅ Seed script populates projects/features/assets plus 925 Pressure Glass and Jim’s Cottesloe service catalog (window, pressure, softwash, add-ons) with price books and packages.
- TODO: Expand seeds with more surface types, modifiers per category, and additional market areas.
- Run seeds locally with `DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/metabuild npm run prisma:seed --prefix apps/meta-api`.

## Dev Experience
- ✅ .env examples for meta-api with `DATABASE_URL`.
- ✅ Scripts: prisma generate/migrate/deploy/reset/push/seed + smoke test.
- ✅ Top-level `dev:api`/`dev:dashboard`/`dev` scripts wired to app prefixes.
- TODO: Document catalog endpoints in meta-context and add env validation notes (DATABASE_URL zod check).
  - Catalog endpoints: `/businesses`, `/service-lines`, `/service-types`, `/market-areas`, `/packages`, `/pricebook/current?businessId=...`.

## Deployment
- Vercel preview plan: static dashboard build + API base env; consider serverless functions for API.
- CI: install + build both apps; optional lint; publish dashboard artifact. Track Postgres env setup for preview branches.
