# Render Deployment Guide

## Quick Start (Blueprint Deploy)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **New → Blueprint**: Click "New" → "Blueprint"
3. **Connect Repository**: Select your GitHub repo (`webap5p`)
4. **Auto-detect**: Render reads `render.yaml` and creates:
   - PostgreSQL database (`tictacstick-db`)
   - Web service (`meta-api`)
5. **Deploy**: Click "Apply" and wait ~5 minutes

## What Gets Created

| Resource | Type | Region | Cost |
|----------|------|--------|------|
| tictacstick-db | PostgreSQL | Oregon | Free 90 days → $7/mo |
| meta-api | Web Service | Oregon | Free (750 hrs/mo) |

## Environment Variables

Set these in Render dashboard after deploy:

### Auto-configured (from render.yaml)
- `NODE_ENV` = production
- `DATABASE_URL` = (auto-linked to tictacstick-db)
- `API_KEY` = (auto-generated)
- `ALLOWED_ORIGIN` = https://tictacstick.pages.dev,https://meta-dashboard.vercel.app
- `RATE_LIMIT_PER_MIN` = 60

### Manual Configuration (Dashboard → Environment)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=925 Pressure Glass <your-email@gmail.com>
```

## Verify Deployment

After deploy completes:

```bash
# Health check
curl https://meta-api.onrender.com/health

# Expected response:
# {"status":"ok","dbMode":"prisma",...}
```

## Update Dashboard API URL

After first deploy, update `apps/meta-dashboard/.env.production`:
```
VITE_API_URL=https://meta-api.onrender.com
```

And redeploy dashboard to Vercel.

## Database Access

### Connection String
Get from Render dashboard → tictacstick-db → Connection

### Prisma Studio (local)
```bash
# Set DATABASE_URL locally first
export DATABASE_URL="postgresql://user:pass@oregon-postgres.render.com:5432/tictacstick"
npx prisma studio
```

### Run Migrations
Migrations run automatically on deploy. To run manually:
```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

## Troubleshooting

### Deploy Fails: "Cannot find module"
- Check `buildCommand` ran successfully in logs
- Ensure `prisma generate` completed

### Health Check Fails
- Check logs for startup errors
- Verify `PORT` env var is being read (Render sets this)

### Database Connection Failed
- Verify `DATABASE_URL` is linked in Render dashboard
- Check database is in same region (Oregon)

### CORS Errors
- Add your domain to `ALLOWED_ORIGIN` env var
- Format: `https://domain1.com,https://domain2.com`

## Cost Breakdown

| Item | Trial | After Trial |
|------|-------|-------------|
| PostgreSQL (Starter) | Free 90 days | $7/month |
| Web Service (Starter) | Free 750 hrs | Free (750 hrs) |
| **Total** | **$0** | **$7/month** |

## Next Steps After Deploy

1. ✅ Verify `/health` returns `{"status":"ok"}`
2. ✅ Update dashboard `VITE_API_URL`
3. ✅ Configure SMTP env vars
4. ✅ Run initial data seed (if needed)
5. ✅ Set up monitoring (Render has built-in)
