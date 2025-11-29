# TicTacStick v2.0 Deployment Plan

**Goal:** Deploy TicTacStick Quote Engine v2.0 with full cloud infrastructure

| Component | Platform | URL |
|-----------|----------|-----|
| **Database** | Supabase | PostgreSQL |
| **API** | Render | `meta-api.onrender.com` |
| **Frontend** | Vercel | `tictacstick.vercel.app` |

---

## Phase 1: Database Setup (Supabase) ✅ IN PROGRESS

### Step 1.1: Update Prisma Schema ✅
- **File:** `prisma/schema.prisma`
- **Change:** Added TicTacStick models (User, Org, Client, Quote, Job, Invoice, AuditLog, SyncQueue)
- **Status:** ✅ Complete

### Step 1.2: Update Environment Config ✅
- **File:** `apps/meta-api/.env.example`
- **Change:** Added Supabase connection variables
- **Status:** ✅ Complete

### Step 1.3: Create Setup Guide ✅
- **File:** `docs/SUPABASE_SETUP.md`
- **Change:** Step-by-step Supabase setup instructions
- **Status:** ✅ Complete

### Step 1.4: Create Supabase Project (Manual)
- **Action:** Go to supabase.com and create project
- **Status:** ⏳ Waiting for user

### Step 1.5: Configure .env with Supabase credentials (Manual)
- **Action:** Copy connection strings from Supabase dashboard
- **Status:** ⏳ Waiting for Step 1.4

### Step 1.6: Run Prisma migrations
- **Command:** `cd apps/meta-api && npm run prisma:push`
- **Status:** ⏳ Waiting for Step 1.5

### Step 1.7: Verify tables created
- **Action:** Check Supabase Table Editor
- **Status:** ⏳ Waiting for Step 1.6

### Step 1.8: Generate Prisma client
- **Command:** `npm run prisma:generate`
- **Status:** ⏳ Waiting for Step 1.6

---

## Phase 2: API Deployment (Render)

### Step 2.1: Create render.yaml config
- **File:** `apps/meta-api/render.yaml`
- **Status:** ⏳ Pending

### Step 2.2: Connect GitHub repo to Render
- **Action:** Link 925PRESSUREGLASS/webapp repo
- **Status:** ⏳ Pending

### Step 2.3: Configure environment variables in Render
- **Action:** Add DATABASE_URL, JWT_SECRET, etc.
- **Status:** ⏳ Pending

### Step 2.4: Deploy API
- **Action:** Trigger deployment
- **Status:** ⏳ Pending

### Step 2.5: Verify API health
- **Test:** `curl https://meta-api.onrender.com/health`
- **Status:** ⏳ Pending

---

## Phase 3: Frontend Deployment (Vercel)

### Step 3.1: Create vercel.json config
- **File:** `apps/quote-engine/vercel.json`
- **Status:** ⏳ Pending

### Step 3.2: Update API endpoint config
- **File:** `apps/quote-engine/src/config.ts`
- **Change:** Point to Render API URL
- **Status:** ⏳ Pending

### Step 3.3: Connect GitHub repo to Vercel
- **Action:** Import project in Vercel dashboard
- **Status:** ⏳ Pending

### Step 3.4: Configure build settings
- **Root Directory:** `apps/quote-engine`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/spa`
- **Status:** ⏳ Pending

### Step 3.5: Deploy to Vercel
- **Action:** Trigger deployment
- **Status:** ⏳ Pending

### Step 3.6: Verify app loads
- **Test:** Open https://tictacstick.vercel.app
- **Status:** ⏳ Pending

---

## Phase 4: Integration & Sync

### Step 4.1: Add sync service to quote-engine
- **File:** `apps/quote-engine/src/services/sync.ts`
- **Status:** ⏳ Pending

### Step 4.2: Configure API routes for sync
- **File:** `apps/meta-api/src/routes/sync.ts`
- **Status:** ⏳ Pending

### Step 4.3: Test quote sync
- **Action:** Create quote in app, verify in Supabase
- **Status:** ⏳ Pending

### Step 4.4: Test job sync
- **Action:** Create job, verify synced
- **Status:** ⏳ Pending

---

## Phase 5: Testing & Go-Live

### Step 5.1: E2E test on deployed environment
- **Status:** ⏳ Pending

### Step 5.2: Performance testing
- **Status:** ⏳ Pending

### Step 5.3: Configure custom domain (optional)
- **Status:** ⏳ Pending

### Step 5.4: Update documentation
- **Status:** ⏳ Pending

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | 🔄 In Progress | 3/8 steps |
| Phase 2 | ⏳ Pending | 0/5 steps |
| Phase 3 | ⏳ Pending | 0/6 steps |
| Phase 4 | ⏳ Pending | 0/4 steps |
| Phase 5 | ⏳ Pending | 0/4 steps |

---

## Quick Commands

```bash
# Phase 1: Database
cd apps/meta-api
cp .env.example .env
# Edit .env with Supabase credentials
npm install
npm run prisma:push
npm run prisma:generate

# Test locally
npm run dev
# Visit http://localhost:3001/health

# Phase 2: Build for production
npm run build
```
