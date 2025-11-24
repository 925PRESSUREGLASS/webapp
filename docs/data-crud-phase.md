# Data & CRUD Phase Notes

## Schema (Prisma)
- Project: id, name, description, status, features[], assets[]
- Feature: id, name, summary, status, projectId, assets[]
- Asset: id, title, description, type (enum), status (enum), link?, tags[], versions[], projects[], features[]
- AssetVersion: id, version, changelog?, isCurrent, assetId
- Join tables: ProjectAsset, FeatureAsset
- Service catalog: Business (status enum), ServiceLine, ServiceType, Modifier, MarketArea, PriceBookVersion/Rate, Package/PackageItem

## API Endpoints (meta-api)
- Health: `GET /health`
- Projects: `GET /projects`, `GET /projects/summary`, `POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id`
- Features: `GET /features`, `POST /projects/:id/features`, `PUT /projects/:projectId/features/:featureId`, `DELETE /features/:id`, `GET /features/summary`
- Assets: `GET /assets`, `GET /assets/summary`, `POST /assets`, `PUT /assets/:id`, `DELETE /assets/:id`
- Catalog: `GET /businesses`, `GET/POST/PUT/DELETE /service-lines`, `GET/POST/PUT/DELETE /service-types`, `GET/POST/PUT/DELETE /market-areas`, `GET/POST/PUT/DELETE /packages`, `POST /packages/:id/items`, `DELETE /packages/:packageId/items/:itemId`, `GET /pricebook/current?businessId=...`, `GET/POST/PUT/DELETE /modifiers`

## Seeds
- `apps/meta-api/src/seed.ts` seeds MetaBuild samples plus service catalog (925 Pressure Glass, Jim’s Cottesloe).
- Run: `DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/metabuild npm run prisma:seed --prefix apps/meta-api`

## Frontend (meta-dashboard)
- TanStack Query for projects/features/assets with mutations + query invalidation.
- Create + edit forms (projects/features/assets) use zod + React Hook Form; catalog forms use controlled inputs and mutations.
- Manual refresh refetches queries and catalog; API base via `VITE_META_API_URL`. If API auth is enabled, set `VITE_META_API_KEY` to send `x-api-key`. Catalog UI includes package item add/remove and modifier inline edit.

## Commands
- Dev API: `npm run dev --prefix apps/meta-api`
- Dev dashboard: `npm run dev --prefix apps/meta-dashboard`
- Both: `npm run dev`
- Prisma: `npm run prisma:migrate --prefix apps/meta-api`, `npm run prisma:seed --prefix apps/meta-api`

## Outstanding
- Monorepo tooling (Nx/Turbo), lint/CI wiring.
