# Meta-Platform Context (Codex-ready)

## Vision
- Single developer portal (meta-dashboard) that exposes every project: meta-platform itself, TicTacStick PWA, quoting tools, and future apps.
- Tracks projects → features → assets → versions → docs, with a reusable asset library (code, templates, prompts, checklists).
- Serves as the canonical context hub for AI agents working across the ecosystem.

## Core Entities
- Project: name, description, status (`planning | active | paused | archived`), tech stack, repo/deploy links.
- Feature: belongs to a project; workflow `idea → clarification → scoping → specification → implementation → validation → release`; acceptance criteria, priority, dependencies.
- Asset: types `snippet | component | template | static | doc | prompt`; status `draft | active | deprecated`; linked to projects/features.
- AssetVersion: semver, content/changelog, `isCurrent`.
- Docs/metadata: markdown specs, tags/keywords, (later) embeddings for semantic search.

## Phases
### Phase 1 – Metabuild foundation
- Repo layout: `apps/meta-api` (Fastify), `apps/meta-dashboard` (React+TS/Vite), shared domain under `apps/domain`, docs under `docs/`.
- Meta-API skeleton: `/health`; domain types (Project, Feature, Asset); CORS for dashboard.
- Meta-dashboard skeleton: Projects view plus placeholders for features/assets; consumes API (or sample data); app registry section lists PWA/meta services.
- Docs: capture stack decisions, folder layout, phase checklists, and “all projects must be accessible from the meta dashboard.”

### Phase 2 – Data & CRUD
- Database: PostgreSQL + Prisma models for Project, Feature, Asset, AssetVersion (+ join table later for Project↔Asset).
- CRUD APIs: list/get/create/update/delete for Project; Feature tied to Project; Asset + AssetVersion basics.
- Dashboard: Projects page backed by API with create/edit; simple feature list per project; assets list later.
- Tooling: validation/error responses, seed script, docs for schema, endpoints, migrations, and dev stack.

## Asset Model (examples)
- Code assets: utilities, UI components, templates/scaffolds, config/CLI wrappers.
- Non-code assets: prompt templates, checklists (Metabuild, Phase 2, PR templates), feature spec templates, diagrams/guides.
- Each asset lives in DB, has versions, links to projects/features, and is discoverable (later via embeddings).

## Documentation & AI Integration
- Docs live in the meta-platform: every project/feature/asset has specs/notes/decisions.
- AI agents use these docs as canonical context; prompt templates/checklists become first-class assets.
- Update docs when code changes (prefer editing this file and `docs/metabuild-foundation.md`).

## Codex IDE (5.1 Max) Workflow
### Step 0 – Project brain
- Keep this file as ground truth; include links in instructions; note the “all projects visible in meta dashboard” constraint.

### Step 1 – Codex project instructions
- Provide a concise prompt with: meta vision, stacks, constraints, phase checklists, and the rule: “When editing code, update `docs/meta-context.md` and `docs/metabuild-foundation.md` to keep repo in sync.”

### Step 2 – 4-worker pattern
- Open 4 Codex tabs:
  - Worker A: Backend foundation (Fastify, `/health`, domain types).
  - Worker B: Frontend foundation (dashboard shell, Projects/Features/Assets pages with sample data).
  - Worker C: DB + Prisma models/migration.
  - Worker D: Project CRUD API + wire Projects page to API.
- Each worker: scan repo, propose a plan, execute incrementally. After each chunk, merge changes, run builds/tests, commit with clear messages.

### Step 3 – Refactor to target structure (if needed)
- Use a “Refactor Planner” session to propose safe moves to the target layout.
- Apply moves in small steps; update imports/scripts; run tests/builds after each step.

### Step 4 – Deliver Phase 1
- Backend: Fastify server with `/health`, logging, error handling.
- Frontend: React/Vite TS app with routes `/projects`, `/features`, `/assets`; static data to start.
- Shared domain types aligned between API/UI.
- Docs: update foundation and this context file.

### Step 5 – Deliver Phase 2
- Worker C: add Prisma/Postgres models, scripts, migration how-to.
- Worker D: add CRUD endpoints; wire Projects page to API with create/edit; repeat for Features/Assets afterward.

### Step 6 – Turn patterns into assets
- Save worker prompts, checklists, spec templates as Asset records in the platform for reuse.

### Step 7 – Register all projects
- Add a “Register project” flow: name/description/stack/repo/deploy/notes.
- Seed entries for meta-platform, TicTacStick PWA, quoting tools, future apps.
- Ensure dashboard lists everything in one place.

## Current State (checkpoint)
- Meta-API: Fastify dev server with `/health`, `/projects` (+ POST/PUT/DELETE), `/projects/:id`, `/projects/summary`, `/apps` (+ summary, get by id), `/assets` (+ summary, get by id), `/features` (+ summary, get by id), plus feature create/update/delete (`POST /projects/:id/features`, `PUT /projects/:projectId/features/:featureId`, `DELETE /features/:id`); in-memory stores seeded from `apps/domain`.
- Meta-dashboard: React/Vite consuming API (configurable via `VITE_META_API_URL`); shows projects summary, projects list with status/feature/asset counts, features, apps (PWA + MetaBuild services), and asset library cards with tags/versions; includes manual refresh, API health badge, base URL display, last refresh time, and client-side filters for projects/apps/assets/features; supports create/edit/delete for projects and create/edit/delete for features (against in-memory API).
- Shared data includes PWA entry (currently `http://localhost:8081` for local dev).
- Docs: `docs/metabuild-foundation.md` and this file capture decisions and phases.
