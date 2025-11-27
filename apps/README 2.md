# MetaBuild Apps Workspace

This directory houses the MetaBuild support apps that run alongside the main web app.

## Projects

- `meta-api` — Fastify service that exposes MetaBuild project data and health endpoints.
- `meta-dashboard` — React + Vite dashboard that consumes `meta-api` and renders project/feature/asset/app status.
- `domain` — Shared TypeScript types and sample data consumed by both projects (includes the main PWA entry).

## Quick start

1. Install dependencies for each app:
   - `npm install --prefix apps/meta-api`
   - `npm install --prefix apps/meta-dashboard`
2. Start the API (port 4000):
   - Requires Postgres + `DATABASE_URL`. Example (local):
     - `export DATABASE_URL=postgresql://gerardvarone@localhost:5432/metabuild`
     - `npm run dev --prefix apps/meta-api`
3. In a new shell, start the dashboard (defaults to port 5173):
   - `npm run dev --prefix apps/meta-dashboard`
4. Open the dashboard URL from the Vite dev server output. The UI will try the live API first and fall back to local sample data if the API is not running.
   - To point the dashboard at another API host (e.g., deployed), set `VITE_META_API_URL` before building/running the dashboard (see `apps/meta-dashboard/.env.example`).

## Endpoints (meta-api)

- `GET /health` — Returns `{ status: 'ok', projectsTracked: <count> }`.
- `GET /projects` — Returns `{ data: Project[], updatedAt }` using shared sample data.
- `GET /projects/summary` — Returns counts for projects, features, assets, and status mix.
- `GET /projects/:id` — Returns a single project or `404` if not found.
- `GET /apps` — Returns `{ data: AppService[], updatedAt }` including the PWA and MetaBuild services.
- `GET /apps/summary` — Returns counts for apps by status and kind.
- `GET /apps/:id` — Returns a single app or `404` if not found.
- `GET /assets` — Returns `{ data: AssetLibraryItem[], updatedAt }` covering prompts, checklists, links.
- `GET /assets/summary` — Returns counts for assets by status and type.
- `GET /assets/:id` — Returns a single asset or `404` if not found.
- `POST /projects` — Create a project (in-memory store).
- `PUT /projects/:id` — Update a project.
- `DELETE /projects/:id` — Delete a project (also removes its features).
- `POST /projects/:id/features` — Create a feature under a project.
- `PUT /projects/:projectId/features/:featureId` — Update a feature.
- `DELETE /features/:id` — Delete a feature.
- Assets: `POST /assets`, `PUT /assets/:id`, `DELETE /assets/:id` (uses Prisma when `DATABASE_URL` is set).

## Environment

- Dashboard: `VITE_META_API_URL` (see `apps/meta-dashboard/.env.example`)
- API: `DATABASE_URL` for Postgres/Prisma (see `apps/meta-api/.env.example`); optional `PRISMA_ACCELERATE_URL` for Accelerate/Data Proxy.

## Notes

- CORS headers are enabled for GET/OPTIONS to simplify local dashboard fetches.
- Shared sample data lives in `apps/domain/sampleData.ts` to keep the API and dashboard aligned. The PWA entry defaults to `http://localhost:8080` (serve the main web app with `python3 -m http.server 8080`).
