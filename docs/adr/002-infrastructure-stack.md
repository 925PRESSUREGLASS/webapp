# ADR-002: Infrastructure Stack Selection

**Status**: Accepted  
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
| **Database** | Render Postgres | Same network as API = lowest latency (~1-5ms), single vendor |
| **API** | Render | Long-running Node process, avoids serverless Prisma issues |
| **Dashboard** | Vercel | React SPA calling Render API, great DX |
| **Webapp (PWA)** | Cloudflare Pages | Keep existing static hosting, independent |
| **ORM** | Prisma | Already integrated, type-safe, great migrations |

### Why Render Postgres over Supabase/Neon?

| Factor | Render Postgres | Supabase | Neon |
|--------|-----------------|----------|------|
| **Latency** | ~1-5ms (same network) | ~20-50ms | ~20-30ms |
| **Cold Starts** | None | None | ~500ms |
| **Vendor Count** | 1 (Render) | 2 | 2 |
| **Prisma Fit** | Perfect | Overkill (has own APIs) | Perfect |
| **Complexity** | Simplest | Medium | Medium |

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
                          │ Prisma (~1-5ms)
                          │ (same network)
                          ▼
                 ┌──────────────────┐
                 │    PostgreSQL    │
                 │                  │
                 │  Render Postgres │
                 └──────────────────┘
```

---

## Alternatives Considered

### Option A: Supabase Postgres
- **Pros**: Auth, storage, edge functions included, great dashboard
- **Cons**: 
  - Extra network hop (~20-50ms latency)
  - Paying for features we don't use (using Prisma, not Supabase APIs)
  - Two vendors to manage
- **Verdict**: Overkill since we're using Prisma as the ORM

### Option B: Neon Postgres
- **Pros**: DB branching for PRs, serverless-friendly, generous free tier
- **Cons**:
  - ~500ms cold starts on idle
  - Extra network hop (~20-30ms)
  - Another vendor to manage
- **Verdict**: Consider if we need DB branching later

### Option C: Full Next.js on Vercel
- **Pros**: Excellent DX, single deployment
- **Cons**: Serverless + Prisma connection issues, less separation
- **Verdict**: Doesn't fit "central API for multiple tools" model

---

## Consequences

### Positive
- **Lowest latency**: API and DB on same network (~1-5ms)
- **No cold starts**: Render Postgres is always running
- **Single vendor**: One dashboard, one billing, simpler ops
- **Prisma works perfectly**: Long-running connections, no pooling tricks
- **Simple setup**: Just DATABASE_URL, done

### Negative
- No built-in auth (will implement with JWT + Prisma)
- No built-in file storage (can add Cloudflare R2 later if needed)
- 90-day free trial, then $7/mo

### Mitigations
- Auth: Implement JWT-based auth in meta-api (standard pattern)
- Storage: Use Cloudflare R2 if file uploads needed ($0.015/GB)
- Cost: $7/mo is minimal for production Postgres

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create Render Postgres instance (Oregon region)
- [ ] Copy DATABASE_URL (internal URL for lowest latency)
- [ ] Update `prisma/schema.prisma` with production datasource
- [ ] Run initial migration: `npx prisma migrate deploy`
- [ ] Verify connection from local: `npx prisma db pull`

### Phase 2: API Deployment
- [ ] Create Render Web Service for `apps/meta-api`
- [ ] Add DATABASE_URL environment variable (use internal URL)
- [ ] Add SMTP and other env vars
- [ ] Set up health check endpoint (`/health`)
- [ ] Configure auto-deploy from `main` branch

### Phase 3: Dashboard Deployment
- [ ] Deploy `apps/meta-dashboard` to Vercel
- [ ] Configure `VITE_API_URL` to point to Render API
- [ ] Set up preview deployments for PRs

### Phase 4: Integration
- [ ] Update webapp to optionally call Meta-API
- [ ] Configure CORS on Meta-API for all frontends
- [ ] Set up monitoring (Render metrics dashboard)
- [ ] Document all URLs in `RUNBOOK.md`

---

## Environment Variables

### Meta-API (Render)
```bash
# Database (use Render internal URL for lowest latency)
DATABASE_URL="postgres://user:pass@dpg-xxx.oregon-postgres.render.com/metabuild"

# Email (from email integration)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="MetaBuild <noreply@metabuild.io>"

# Security
JWT_SECRET="your-jwt-secret"
API_KEY="your-api-key"

# App
NODE_ENV="production"
PORT="10000"
```

### Meta-Dashboard (Vercel)
```bash
VITE_API_URL="https://meta-api.onrender.com"
```

---

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Render Postgres | Starter | $7 |
| Render Web Service | Starter | $7 |
| Vercel | Hobby | $0 |
| Cloudflare Pages | Free | $0 |
| **Total** | | **$14/month** |

After 90-day free trial on Render.

---

## Render Setup Commands

```bash
# After creating Render Postgres, get the internal URL
# It looks like: postgres://user:pass@dpg-xxx.oregon-postgres.render.com/dbname

# Update .env with the DATABASE_URL
echo 'DATABASE_URL="your-render-postgres-url"' >> apps/meta-api/.env

# Test connection
cd apps/meta-api
npx prisma db pull

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## References

- [Render Postgres Docs](https://render.com/docs/databases)
- [Prisma with Render](https://render.com/docs/deploy-prisma)
- [Render Environment Groups](https://render.com/docs/environment-groups)
- [ADR-001: ES5 Compatibility](./001-es5-compatibility.md)
