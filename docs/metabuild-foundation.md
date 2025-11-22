# MetaBuild Foundation

## Decisions
- Introduced an `apps/` workspace with separate `meta-api` and `meta-dashboard` projects to keep backend and frontend concerns isolated while sharing core domain types under `apps/domain/types.ts`.
- Chose Fastify for the `meta-api` skeleton to align with lightweight, plugin-friendly HTTP handling and to expose an immediate `/health` heartbeat.
- Set up a React + TypeScript shell for `meta-dashboard` so UI iterations can start with typed project, feature, and asset data structures.

## Next Steps
- Add linting, formatting, and CI hooks for the new app folders to keep TypeScript and React code quality consistent.
- Expand the API beyond `/health` to persist and serve project, feature, and asset data, then mirror those responses in the dashboard UI.
- Wire a shared build pipeline (e.g., pnpm workspaces or npm workspaces) so dashboard and API dependencies install and run together.
- Introduce basic styling and navigation for the dashboard, including status indicators for each project and feature.
