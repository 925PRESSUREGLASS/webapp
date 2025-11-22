# MetaBuild TODO (next steps)

## Backend (meta-api)
- Add Prisma/Postgres schema for Project, Feature, Asset, AssetVersion; seed with current sample data.
- Implement CRUD endpoints for projects (list/get/create/update/delete), features (project-scoped), assets/versions; return consistent DTOs.
- Add validation/error responses and logging around CRUD; keep `/health` reflecting DB connectivity.
- Wire Prisma client (optional fallback to in-memory when `DATABASE_URL` is absent). Add `prisma generate`, `prisma migrate dev`, `prisma db seed`, and `prisma db push` scripts plus a smoke script to hit `/health`, `/projects`, `/features`, `/assets` when the API is running locally.

## Frontend (meta-dashboard)
- Wire Projects view to real CRUD API; add create/edit modal for projects.
- Add feature list per project with create/edit; later surface asset versions.
- Keep filters/refresh/health indicators; add form validation and inline status.

## Dev Experience
- Add .env.example for meta-api (DATABASE_URL) and document migrations.
- Add scripts: `dev:api`, `dev:dashboard`, `build:api`, `build:dashboard`, optional lint tasks.
- Update docs/meta-context.md and docs/metabuild-foundation.md after CRUD lands.

## Deployment
- Vercel preview plan: static dashboard build + API base env; consider serverless functions for API.
- CI: install + build both apps; optional lint; publish dashboard artifact.
