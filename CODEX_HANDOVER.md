# Codex Handover Document

**Date:** November 30, 2025  
**Project:** TicTacStick Quote Engine for 925 Pressure Glass  
**Repository:** https://github.com/925PRESSUREGLASS/webapp  
**Branch:** main  
**Last Commit:** `34ea58d` - build: build calc engine before vercel deploy

---

## 🎯 IMMEDIATE CONTEXT

You are picking up a monorepo project that just completed **Task 11: Wire Sync Store into Pages**. The project has a working authentication system, data sync infrastructure, and sync wiring across all pages.

### Current State Summary
- **Tasks 1-11:** ✅ Complete
- **Phase 2A (Infrastructure):** ✅ Complete  
- **Phase 2B (Cloud Sync):** ✅ Complete
- **Phase 2C (GHL Integration):** ⬜ Next
- **Phase 2D (Push Notifications):** ⬜ Pending
- **Open Issue:** Blank page on login (needs debugging)

### Live Endpoints
- **Meta-API:** `https://meta-api-78ow.onrender.com`
- **Quote Engine:** `https://webap5p.vercel.app`
- **Database:** Render Postgres (internal connection)

---

## 📁 PROJECT STRUCTURE

```
webapp/
├── apps/
│   ├── meta-api/          # Fastify backend (Render)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts      # JWT auth endpoints
│   │   │   │   ├── email.ts     # Email sending
│   │   │   │   └── sync.ts      # Data sync endpoints (NEW - Task 10)
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts   # Auth logic
│   │   │   │   ├── email.service.ts  # Email via Nodemailer
│   │   │   │   └── sync.service.ts   # Sync CRUD (NEW - Task 10)
│   │   │   ├── db/
│   │   │   │   └── client.ts    # Prisma client
│   │   │   └── server.ts        # Fastify app entry
│   │   └── prisma/
│   │       └── schema.prisma    # Database models
│   │
│   ├── quote-engine/      # Vue 3 + Quasar PWA (Vercel)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.vue
│   │   │   │   ├── RegisterPage.vue
│   │   │   │   ├── QuotePage.vue
│   │   │   │   ├── JobsPage.vue
│   │   │   │   ├── CalendarPage.vue
│   │   │   │   └── InvoicesPage.vue
│   │   │   ├── stores/
│   │   │   │   ├── auth.ts      # JWT token management
│   │   │   │   ├── sync.ts      # Offline-first sync queue (NEW - Task 10)
│   │   │   │   ├── jobs.ts      # Job management
│   │   │   │   ├── quotes.ts    # Quote state
│   │   │   │   └── calendar.ts  # Calendar state
│   │   │   ├── composables/
│   │   │   │   ├── useApi.ts    # Authenticated API calls
│   │   │   │   └── useEmail.ts  # Email sending
│   │   │   └── router/
│   │   │       ├── routes.ts    # Route definitions
│   │   │       └── index.ts     # Navigation guards
│   │   └── quasar.config.js
│   │
│   └── meta-dashboard/    # React admin dashboard
│
├── packages/
│   └── calculation-engine/  # Shared calculation logic
│
├── docs/
│   ├── ATOMIC_IMPROVEMENT_PLAN.md  # Task tracking (READ THIS)
│   ├── TODO_ALIGNMENT.md           # Phase tracking
│   └── adr/                        # Architecture decisions
│
├── prisma/
│   └── schema.prisma        # Master schema
│
├── CLAUDE.md                # Primary AI context (4900+ lines)
├── AGENTS.md                # Contributor rules
└── .github/
    └── copilot-instructions.md
```

---

## 🔧 RECENT WORK (Tasks 8-11)

### Task 8: JWT Authentication Backend ✅
**Commit:** `b119f51`

Created:
- `apps/meta-api/src/services/auth.service.ts` - Register, login, profile management
- `apps/meta-api/src/routes/auth.ts` - REST endpoints

Endpoints:
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /auth/register | POST | Public | Create account |
| /auth/login | POST | Public | Get JWT token |
| /auth/me | GET | JWT | Get profile |
| /auth/profile | PUT | JWT | Update profile |
| /auth/change-password | POST | JWT | Change password |
| /auth/refresh | POST | JWT | Refresh token |

### Task 9: Frontend Auth UI ✅
**Commit:** `d2f4891`

Created:
- `apps/quote-engine/src/stores/auth.ts` - Pinia store with JWT management
- `apps/quote-engine/src/pages/LoginPage.vue` - Login form
- `apps/quote-engine/src/pages/RegisterPage.vue` - Registration form
- Updated `MainLayout.vue` with user menu

### Task 10: Data Sync Infrastructure ✅
**Commit:** `0be206b`

**Backend Created:**
- `apps/meta-api/src/services/sync.service.ts` (560 lines)
- `apps/meta-api/src/routes/sync.ts` (240 lines)

**Frontend Created:**
- `apps/quote-engine/src/stores/sync.ts` (330 lines)

### Task 11: Wire Sync Store into Pages ✅
**Commit:** `e0d887c`

**Pages Updated:**
- `QuotePage.vue` - Queues quote sync on save, invoice sync on convert
- `SavedQuotesPage.vue` - Pulls cloud quotes when authenticated; queues duplicates, deletes, jobs
- `JobsPage.vue` - Initializes sync, processes queue when online/authenticated
- `ActiveJobPage.vue` - Queues job sync on status/notes/photos/price changes
- `InvoicesPage.vue` - Queues invoice sync on create/update/status/payments/delete

**New Helper Created:**
- `apps/quote-engine/src/utils/sync-payloads.ts` - Payload builders + cloud quote mapper

---

## 🎯 NEXT PRIORITIES

### Priority 1: Fix Blank Page on Login
See diagnostic section below.

### Priority 2: Phase 2C - GHL Integration
- Activate existing GHL sync modules in `ghl-sync.js`
- Webhook handlers for GHL in meta-api
- Two-way contact sync

### Priority 3: Phase 2D - Push Notifications
- Push notification token backend
- Notification service in meta-api
- Subscription management UI

---

## 🛠️ DEVELOPMENT COMMANDS

```bash
# Navigate to project
cd /Users/gerardvarone/Desktop/webap5p

# Build meta-api
cd apps/meta-api && npm run build

# Build quote-engine
cd apps/quote-engine && npm run build

# Run quote-engine dev server
cd apps/quote-engine && npx quasar dev

# Run tests
cd packages/calculation-engine && npx vitest run

# Git workflow
git add . && git commit -m "feat: description"
git push origin main
```

---

## 📊 DATABASE SCHEMA (Key Models)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  phone        String?
  orgId        String?
  organization Organization? @relation(fields: [orgId], references: [id])
}

model Quote {
  id        String   @id @default(cuid())
  localId   String?  // For sync conflict resolution
  userId    String
  orgId     String?
  data      Json     // Full quote data
  syncedAt  DateTime?
  createdAt DateTime @default(now())
}

model Job {
  id        String   @id @default(cuid())
  localId   String?
  userId    String
  orgId     String?
  quoteId   String?
  status    String   @default("scheduled")
  data      Json
  syncedAt  DateTime?
}

model Client {
  id        String   @id @default(cuid())
  localId   String?
  userId    String
  orgId     String?
  name      String
  email     String?
  phone     String?
  address   String?
  syncedAt  DateTime?
}

model Invoice {
  id        String   @id @default(cuid())
  localId   String?
  userId    String
  orgId     String?
  jobId     String?
  data      Json
  syncedAt  DateTime?
}
```

---

## 🔐 ENVIRONMENT VARIABLES

### Meta-API (Render)
```
DATABASE_URL=postgresql://...  # Render internal URL
JWT_SECRET=<64-char-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
API_KEY=...
```

### Quote-Engine (Vercel)
```
VITE_API_URL=https://meta-api-78ow.onrender.com
```

---

## 📋 KEY DOCUMENTS TO READ

1. **`docs/ATOMIC_IMPROVEMENT_PLAN.md`** - Task breakdown and status
2. **`docs/TODO_ALIGNMENT.md`** - Phase tracking and next actions
3. **`CLAUDE.md`** - Full project context (4900+ lines)
4. **`AGENTS.md`** - Coding conventions and PR checklist

---

## ⚠️ IMPORTANT CONVENTIONS

1. **Commit Format:** `feat:`, `fix:`, `docs:`, `test:`
2. **Build Before Commit:** Always run `npm run build` in changed apps
3. **TypeScript:** Both apps use TypeScript strictly
4. **Pinia Stores:** All state management via Pinia stores
5. **JWT Auth:** 7-day token expiry, auto-refresh before expiry

---

## 🚀 QUICK START FOR NEXT TASK

```bash
# 1. Check current state
cd /Users/gerardvarone/Desktop/webap5p
git status
git log --oneline -5

# 2. Read the sync store implementation
cat apps/quote-engine/src/stores/sync.ts

# 3. Check a page that needs sync integration
cat apps/quote-engine/src/pages/QuotePage.vue

# 4. Make changes, build, commit
cd apps/quote-engine && npm run build
git add . && git commit -m "feat: wire sync store into QuotePage"
git push origin main
```

---

## 📞 BUSINESS CONTEXT

- **Business ID:** `biz-925`
- **Company:** 925 Pressure Glass (window tinting/glass services)
- **Users:** Field technicians using PWA on mobile devices
- **Key Workflows:**
  1. Create quote → Save → Email to customer
  2. Convert quote to job → Track work → Complete with signature
  3. Generate invoice → Email to customer
  4. Cloud sync for multi-device access

---

---

## 🐛 KNOWN ISSUE: Blank Page on Login

**Reported:** User sees blank page after login attempt.

### Likely Causes (in order of probability)

1. **Render Cold Start** - Free tier API spins down after inactivity. First request can timeout (~30s).
2. **CORS Issue** - API might not be returning proper CORS headers.
3. **API Unreachable** - Network error during login fetch.
4. **Auth State Loop** - Redirect loop between `/login` and `/` if auth state is corrupted.

### Diagnostic Steps

```bash
# 1. Check if API is responsive
curl -X POST https://meta-api-78ow.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 2. Check health endpoint
curl https://meta-api-78ow.onrender.com/health

# 3. In browser console, after blank page:
# - Check for errors: Look for CORS, network, or JS errors
# - Check network tab: Find the /auth/login request status
```

### Quick Fixes to Try

1. **Add error boundary to LoginPage** - Show error to user instead of blank
2. **Add API connection check** - Ping health endpoint before login attempt
3. **Add loading state for cold start** - Show "Waking up server..." message

### Code Locations

- Login logic: `apps/quote-engine/src/pages/LoginPage.vue`
- Auth store: `apps/quote-engine/src/stores/auth.ts` (lines 167-193)
- Router guards: `apps/quote-engine/src/router/index.ts`

---

**Good luck! The project is well-documented and the codebase is clean. Start by reading the sync store and picking one page to integrate.**
