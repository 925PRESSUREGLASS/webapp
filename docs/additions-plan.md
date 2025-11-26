# Addition / Refactor Plan Checklist

## A. Monorepo & DX
Goal: simplify running meta-api, meta-dashboard, Prisma, shared libs.
- Check for Nx/Turborepo; if absent, propose minimal setup (nx.json/turbo.json).
- Root package.json scripts: dev:api, dev:dashboard, dev (both).
- Wire apps/meta-api and apps/meta-dashboard into chosen tool.
Instruction to Codex: Inspect for Nx/Turbo; if missing, propose minimal setup and files to add.

## B. Frontend: React Dashboard DX
Goal: clean data fetching and forms.
1) TanStack Query (HIGH)
   - Install in apps/meta-dashboard; wrap root with QueryClientProvider.
   - Demonstrate useQuery for project list (API or mock). Note future CRUD refactors.
2) React Hook Form + zod (MEDIUM)
   - Install RHF + resolvers + zod.
   - Add project create/edit form using shared zod schema (usable on backend later).
3) UI kit (OPTIONAL)
   - Pick shadcn+Tailwind or Mantine/Chakra.
   - Convert Projects page to new components without massive restyle.
Instruction to Codex: Add TanStack Query + useQuery demo; set up RHF+zod for Project form with shared schema; propose minimal UI lib and convert Projects page.

## C. Backend: Prisma + Env + Validation
Goal: typed API over Postgres with Prisma as center.
1) Prisma schema (HIGH)
   - Ensure prisma/schema.prisma has Project, Feature, Asset, AssetVersion, ProjectAsset, FeatureAsset; add enums (ProjectStatus, FeatureStage, AssetType, AssetStatus).
   - Keep backward-compatible where possible.
   Instruction: Show current models, propose updated schema.
2) Prisma integration (HIGH)
   - Shared Prisma client (apps/meta-api/src/lib/prisma.ts).
   - Implement typed Project CRUD (list/create/update/delete).
3) Env validation with zod (MEDIUM)
   - apps/meta-api/src/config/env.ts validates DATABASE_URL (and future keys), fail fast with clear error.
   Instruction: Add zod env validation, export typed config.

## D. Docs & Seed Data
Goal: code + docs in sync; usable demo data.
1) Docs updates (HIGH)
   - Ensure docs/metabuild-foundation.md, docs/data-crud-phase.md, docs/meta-context.md reflect: repo structure, tech stack, Phase 1 tasks, Prisma models, API routes, how to run migrations/seeds, requirement: all projects accessible in dashboard.
   Instruction: Read current docs, propose updates/new sections for schema/endpoints/pages.
2) Prisma seed script (MEDIUM)
   - prisma/seed.ts inserts demo Projects/Features (Meta Platform, TicTacStick) and wire prisma:seed in package.json.
   Instruction: Create seed script + package.json script + doc note.

## E. Optional/Future
- Sentry placeholders for API/dashboard (no tokens).
- Playwright E2E for dashboard visit, list projects, create project (once CRUD is live).
- OpenAI/Anthropic SDK wrapper for future summaries/docs/prompt assets.
Instruction (later): Propose minimal Sentry integration; add TODOs only.

## How to drive Codex in VS Code
Example 1 (Frontend): “Add TanStack Query in apps/meta-dashboard; wrap root; convert Projects list to use useQuery; show file changes.”
Example 2 (Backend): “Update prisma/schema.prisma for Project/Feature/Asset/AssetVersion; add Prisma client; add Project CRUD router; show files and note breaking changes.”
Example 3 (Docs): “Compare repo state with docs/metabuild-foundation.md and docs/data-crud-phase.md; suggest updates to reflect Prisma models and Project CRUD.”
