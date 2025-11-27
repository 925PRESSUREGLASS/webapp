# ADR-002: Infrastructure Stack Selection

**Status**: Proposed  
**Date**: November 27, 2025  
**Decision Makers**: Gerard Varone  
**Context**: MetaBuild platform infrastructure selection

---

## Context

The MetaBuild platform needs a production infrastructure stack for:
- **Meta-API**: Backend service (Node.js/TypeScript + Prisma)
- **Meta-Dashboard**: Admin UI (React/Vite or Next.js)
- **Database**: PostgreSQL for relational data
- **Webapp (PWA)**: Existing ES5 vanilla JS app (static hosting)

We evaluated multiple options considering:
- Developer experience and maintenance overhead
- Cost at low-to-medium scale
- Prisma ORM compatibility
- Multi-tool architecture (API used by webapp, dashboard, AI agents, CLIs)

---

## Decision

### Recommended Stack

| Layer | Provider | Rationale |
|-------|----------|-----------|
| **Database** | Supabase Postgres | Managed Postgres with optional auth/storage for future |
| **API** | Render | Long-running Node process, avoids serverless Prisma issues |
| **Dashboard** | Vercel or Render Static | React SPA calling Render API |
| **Webapp (PWA)** | Cloudflare Pages | Keep existing static hosting, independent |
| **ORM** | Prisma | Already integrated, type-safe, great migrations |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MetaBuild Platform                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Webapp     │     │  Dashboard   │     │  AI Agents   │
│  (ES5 PWA)   │     │   (React)    │     │  (Claude)    │
│              │     │              │     │              │
│ Cloudflare   │     │   Vercel     │     │   Local      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │   HTTPS/REST       │   HTTPS/REST       │   HTTPS/REST
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │    Meta-API      │
                 │  (Node.js/TS)    │
                 │                  │
                 │     Render       │
                 └────────┬─────────┘
                          │
                          │ Prisma
                          │
                          ▼
                 ┌──────────────────┐
                 │    PostgreSQL    │
                 │                  │
                 │    Supabase      │
                 └──────────────────┘
```

---

## Alternatives Considered

### Option A: All-in Supabase
- **Pros**: Auth, storage, edge functions included
- **Cons**: Fighting "Supabase way" for custom logic, less control
- **Verdict**: Too opinionated for MetaBuild's orchestration needs

### Option B: Render API + Render Postgres
- **Pros**: Single vendor, low latency, simpler
- **Cons**: No Supabase goodies (auth UI, storage, RLS dashboard)
- **Verdict**: Good fallback if Supabase costs become an issue

### Option C: Neon Postgres
- **Pros**: Branching for dev/preview, serverless-friendly
- **Cons**: Another vendor to manage, no auth/storage
- **Verdict**: Consider for future if DB branching becomes valuable

### Option D: Full Next.js on Vercel
- **Pros**: Excellent DX, single deployment
- **Cons**: Serverless + Prisma connection issues, less separation
- **Verdict**: Doesn't fit "central API for multiple tools" model

---

## Consequences

### Positive
- Long-running API avoids serverless cold starts and connection pooling issues
- Clear separation: API is the single source of truth
- Webapp remains independent and unchanged
- Prisma works optimally with persistent connections
- Can leverage Supabase auth/storage later if needed

### Negative
- Multiple dashboards to manage (Supabase, Render, Vercel)
- Environment config must stay in sync across services
- Network latency between Render (API) and Supabase (DB) if different regions

### Mitigations
- Use same region for all services (e.g., US East)
- Centralize env config in `.env` files with CI/CD sync
- Document all service URLs in `RUNBOOK.md`

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create Supabase project in US East region
- [ ] Configure connection pooling (PgBouncer)
- [ ] Update `prisma/schema.prisma` with production datasource
- [ ] Run initial migration: `npx prisma migrate deploy`
- [ ] Set up database backups (Supabase handles automatically)

### Phase 2: API Deployment
- [ ] Create Render Web Service for `apps/meta-api`
- [ ] Configure environment variables (DATABASE_URL, SMTP, etc.)
- [ ] Set up health check endpoint (`/health`)
- [ ] Configure auto-deploy from `main` branch
- [ ] Add custom domain (api.metabuild.io or similar)

### Phase 3: Dashboard Deployment
- [ ] Deploy `apps/meta-dashboard` to Vercel
- [ ] Configure `VITE_API_URL` to point to Render API
- [ ] Set up preview deployments for PRs
- [ ] Add custom domain (dashboard.metabuild.io)

### Phase 4: Integration
- [ ] Update webapp to optionally call Meta-API
- [ ] Configure CORS on Meta-API for all frontends
- [ ] Set up monitoring/alerting (Render metrics, Supabase dashboard)
- [ ] Document all URLs in `RUNBOOK.md`

---

## Environment Variables

### Meta-API (Render)
```bash
# Database
DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/postgres"

# Email (from email integration)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="MetaBuild <noreply@metabuild.io>"

# Security
JWT_SECRET="your-jwt-secret"
API_KEY="your-api-key"

# Optional: Supabase (if using their auth)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### Meta-Dashboard (Vercel)
```bash
VITE_API_URL="https://api.metabuild.io"
VITE_SUPABASE_URL="https://xxx.supabase.co"  # Optional
VITE_SUPABASE_ANON_KEY="your-anon-key"       # Optional
```

---

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Supabase | Free/Pro | $0-25 |
| Render | Starter | $7-15 |
| Vercel | Hobby/Pro | $0-20 |
| Cloudflare | Free | $0 |
| **Total** | | **$7-60/month** |

---

## References

- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/deployment/serverless)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Render Deploy Guide](https://render.com/docs/deploy-node-express-app)
- [ADR-001: ES5 Compatibility](./001-es5-compatibility.md)
