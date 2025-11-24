# Dev Workflow Changelog (meta)
- Added `docs/dev-workflow.md` with daily flow, task template, MCP setup (git, fs, prisma, node/npm, optional Postgres/HTTP), Codex instructions, CI notes, and backlog.
- Linked workflow/MCP guidance from `docs/metabuild-foundation.md`.
- Added optional rate limit env (`RATE_LIMIT_PER_MIN`) to API env example.
- CI updated to run migrations against Postgres service and start API before smoke; stops API after.
- API logging enhanced with request IDs and per-request logging; rate limit hook optional.
- Docs updated: `dev-workflow` mentions rate limit and CI DB; `metabuild-foundation` notes CI DB and envs; production checklist reminds to set rate limit for prod.
- UI updated: sidebar navigation, projects/features tables, business collapsibles with catalog summaries, roadmap placeholder.
