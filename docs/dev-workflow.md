# Dev Workflow & Codex/MCP Setup

## Daily Flow
- Env: set `DATABASE_URL`, optional `API_KEY`/`ALLOWED_ORIGIN`; dashboard `VITE_META_API_URL`, optional `VITE_META_API_KEY`.
- Optional rate limiting: set `RATE_LIMIT_PER_MIN` (per IP). Leave empty/omit to disable.
- Dev servers: `npm run dev --prefix apps/meta-api`, `npm run dev --prefix apps/meta-dashboard`.
- Validate: `npm run build:api`, `npm run build:dashboard`, `API_KEY=... npm run smoke`.
- Migrations: `npm run prisma:migrate --prefix apps/meta-api`, `npm run prisma:seed --prefix apps/meta-api`.

## Task Template (use in PR/issue)
- Context: what/why.
- Definition of Done: behaviors, tests/builds to pass.
- Steps: numbered small steps.
- Validation: which commands ran (builds, smoke).
- Log tracing: note request IDs from API logs if debugging.

## MCP Setup (recommended)
- Git MCP: status/diff/blame, branch info (read-only).
- FS MCP: read/write within repo (docs, app files, prisma).
- Prisma MCP: inspect `prisma/schema.prisma`, migrations; run generate/migrate if allowed.
- Node/NPM MCP: run scripts (`build:api`, `build:dashboard`, `smoke`, `prisma:generate`).
- Optional Postgres MCP: read-only queries after seeding.
- Optional HTTP MCP: hit local API (`/health`, `/projects`, `/businesses`, `/packages`).
- Constraints: keep TicTacStick ES5/vanilla; no large refactors without ask; use zod validation on API changes; keep docs in sync.

## Codex Project Instructions (short)
- Repo layout: `apps/meta-api` (Fastify+Prisma), `apps/meta-dashboard` (React+TS), docs under `docs/`.
- Auth/CORS: API may require `API_KEY`; dashboard sends `x-api-key` via `VITE_META_API_KEY`.
- Checklists/docs to consult: `docs/metabuild-foundation.md`, `docs/data-crud-phase.md`, `docs/PRODUCTION-READINESS-CHECKLIST.md`, this file.
- Commands to run: `npm run build:api`, `npm run build:dashboard`, `npm run smoke` (with API running and `API_KEY` set), migrations/seeds as needed.
- Safety: no ES6 in TicTacStick files; avoid refactors there.

## CI Notes
- CI runs builds + smoke (+ type check). Smoke expects API running; start API with temp `API_KEY`/`DATABASE_URL` in CI before smoke.
- Turbo cache enabled; inspect `.github/workflows/ci.yml` for steps.
- CI DB: Postgres service uses `postgresql://postgres:postgres@localhost:5432/metabuild_ci`; migrations run before smoke.

## Backlog to Track Here
- Rate limiting/auth hardening (optional).
- Metrics/Sentry stubs (no secrets).
- CI DB/mock for smoke stability.
