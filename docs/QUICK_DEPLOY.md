# Quick Deployment Guide

## Your Credentials (for copy/paste)

### Database (Prisma Postgres)
```
DATABASE_URL=postgres://6af1284fb8bd859283c9fb1e1821741ce530784562a5c468df23be6801bdb17c:sk_UdqYWq2w7xH_XDiU089f4@db.prisma.io:5432/postgres?sslmode=require
```

### Supabase
```
SUPABASE_URL=https://hqvvaesgovdtnbxsxrpf.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdnZhZXNnb3ZkdG5ieHN4cnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE4NjgsImV4cCI6MjA3OTk5Nzg2OH0.T91mF2dyBCmq0FgNyyE5t0_9_LHajJvYlIt7eObqVf8
```

---

## Step 1: Deploy API to Render (5 min)

1. Go to **[render.com](https://render.com)** and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `925PRESSUREGLASS/webapp`
4. Configure:
   - **Name**: `meta-api`
   - **Root Directory**: `apps/meta-api`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate --schema ../../prisma/schema.prisma && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | *(paste from above)* |
   | `SUPABASE_URL` | *(paste from above)* |
   | `SUPABASE_KEY` | *(paste from above)* |
   | `JWT_SECRET` | *(click Generate)* |
   | `ALLOWED_ORIGIN` | `https://tictacstick.vercel.app` |
6. Click **Create Web Service**
7. Wait for deploy (~5 min)
8. Test: `curl https://YOUR-APP.onrender.com/health`

**Copy your Render URL**: `https://meta-api-XXXX.onrender.com`

---

## Step 2: Deploy Frontend to Vercel (3 min)

1. Go to **[vercel.com](https://vercel.com)** and sign in
2. Click **Add New** → **Project**
3. Import: `925PRESSUREGLASS/webapp`
4. Configure:
   - **Root Directory**: `apps/quote-engine`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/spa`
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com` |
   | `VITE_SUPABASE_URL` | *(paste from above)* |
   | `VITE_SUPABASE_KEY` | *(paste from above)* |
6. Click **Deploy**
7. Wait for deploy (~2 min)
8. Open your app URL!

---

## Step 3: Update CORS (after both deployed)

Once you have your Vercel URL, go back to Render and update:
- `ALLOWED_ORIGIN` → your actual Vercel URL

---

## Verification Checklist

- [ ] Render deploy successful
- [ ] Health check returns OK: `curl https://YOUR-RENDER-URL/health`
- [ ] Vercel deploy successful
- [ ] App loads in browser
- [ ] Can create a quote (tests API connection)

---

## Troubleshooting

**API returns 500?**
- Check Render logs for errors
- Verify DATABASE_URL is correct

**CORS errors?**
- Update ALLOWED_ORIGIN in Render to match your Vercel URL

**App won't load?**
- Check Vercel build logs
- Verify VITE_API_URL points to Render URL

---

## Your Live URLs

**Deployment Complete! ✅**

- **API**: https://meta-api-78ow.onrender.com
- **App**: https://webap5p.vercel.app
- **Health Check**: https://meta-api-78ow.onrender.com/health
