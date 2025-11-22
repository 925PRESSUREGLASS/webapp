# MetaBuild Foundation

## Decisions
- Introduced an `apps/` workspace with separate `meta-api` and `meta-dashboard` projects to keep backend and frontend concerns isolated while sharing core domain types under `apps/domain/types.ts`.
- Chose Fastify for the `meta-api` skeleton to align with lightweight, plugin-friendly HTTP handling and to expose an immediate `/health` heartbeat.
- Set up a React + TypeScript shell for `meta-dashboard` so UI iterations can start with typed project, feature, and asset data structures.

## Next Steps
- Add linting, formatting, and CI hooks for the new app folders to keep TypeScript and React code quality consistent.
- Expand the API beyond `/health` to persist and serve project, feature, and asset data, then mirror those responses in the dashboard UI. (Started: `/projects`, `/projects/:id`, and `/projects/summary` now return shared sample data with CORS headers for the dashboard. `/apps`, `/apps/:id`, and `/apps/summary` now expose the PWA and MetaBuild services. `/assets`, `/assets/:id`, and `/assets/summary` cover library entries.)
- Wire a shared build pipeline (e.g., pnpm workspaces or npm workspaces) so dashboard and API dependencies install and run together.
- Introduce basic styling and navigation for the dashboard, including status indicators for each project and feature. (Started: dashboard now pulls API data, shows status badges, renders summary stats, includes Apps/Assets/Features sections, filters, manual refresh, API health badge; API base configurable via `VITE_META_API_URL`.)
- CRUD: projects now support POST/PUT/DELETE; features support POST/PUT/DELETE (in-memory) to unblock dashboard forms. Move to persistent storage (Prisma/Postgres) next.
