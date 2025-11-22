# Metabuild Foundation

This branch bootstraps the meta-platform workspace with a minimal but structured foundation for future development.

## What this branch sets up
- Workspace layout under `apps/` for the meta dashboard (frontend) and meta API (backend).
- Root tooling with shared scripts for dev, build, and lint workflows.
- TypeScript base config for both apps.
- Initial domain type contracts for projects, features, and assets.
- Placeholder React dashboard page to validate the frontend wiring.
- Fastify API server with a health endpoint to validate backend wiring.

## Decisions
- Stack: React + TypeScript + Vite for the dashboard; Fastify + TypeScript for the API; Postgres/Prisma planned for persistence.
- Command runner: npm workspaces with `concurrently` for combined dev workflow.
- Legacy TicTacStick/quoting app stays vanilla JS and will be registered later as a project inside the meta-platform.

## TODOs for next branches
- Connect a real database layer (Prisma + Postgres) to the meta API.
- Implement CRUD for Projects (then Features and Assets).
- Hook the dashboard to the API endpoints and add basic data fetching.
- Add shared UI components and a design system seed for the dashboard.
- Add linting/formatting rules (ESLint/Prettier) and CI hooks.
