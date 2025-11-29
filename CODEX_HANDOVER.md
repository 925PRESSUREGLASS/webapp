# Codex Handover Document

**Date:** November 30, 2025  
**Project:** TicTacStick Quote Engine for 925 Pressure Glass  
**Repository:** https://github.com/925PRESSUREGLASS/webapp  
**Branch:** main  
**Last Commit:** `e8fcb3f` - docs: update TODO_ALIGNMENT with Phase 2B completion status

---

## 🎯 IMMEDIATE CONTEXT

You are picking up a monorepo project that just completed **Task 10: Data Sync Infrastructure**. The project has a working authentication system (Tasks 8-9) and data sync infrastructure between a Vue/Quasar PWA and a Fastify backend.

### Current State Summary
- **Tasks 1-10:** ✅ Complete
- **Phase 2A (Infrastructure):** ✅ Complete  
- **Phase 2B (Cloud Sync):** ✅ Complete
- **Phase 2C (GHL Integration):** ⬜ Next
- **Phase 2D (Push Notifications):** ⬜ Pending

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

## 🔧 RECENT WORK (Tasks 8-10)

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
  - CRUD for Quote, Job, Client, Invoice
  - Upsert by `localId` for conflict resolution
  - Delta sync with `since` parameter
  - Bulk sync for multiple entities

- `apps/meta-api/src/routes/sync.ts` (240 lines)

Sync Endpoints:
| Endpoint | Method | Description |
|----------|--------|-------------|
| /sync/all | GET | Fetch all cloud data |
| /sync/bulk | POST | Bulk push entities |
| /sync/quotes | GET/POST/DELETE | Quote operations |
| /sync/jobs | GET/POST/DELETE | Job operations |
| /sync/clients | GET/POST/DELETE | Client operations |
| /sync/invoices | GET/POST/DELETE | Invoice operations |

**Frontend Created:**
- `apps/quote-engine/src/stores/sync.ts` (330 lines)
  - Offline-first sync queue
  - Auto-sync on reconnect
  - 5-minute periodic sync
  - localStorage caching

---

## 🎯 NEXT TASK: Task 11 - Wire Sync Store

### What Needs to Be Done

The sync infrastructure exists but is **not yet connected** to the actual page operations. The sync store needs to be integrated into:

1. **QuotePage.vue** - When saving quotes, call `syncStore.queueChange('quote', quoteData)`
2. **SavedQuotesPage.vue** - Pull quotes from cloud on mount if authenticated
3. **JobsPage.vue** - Sync jobs when created/updated
4. **InvoicesPage.vue** - Sync invoices

### Suggested Implementation

```typescript
// In any page that saves data:
import { useSyncStore } from 'src/stores/sync';
import { useAuthStore } from 'src/stores/auth';

const syncStore = useSyncStore();
const authStore = useAuthStore();

// After saving locally:
async function saveQuote(quote: Quote) {
  // Save to local store first
  quotesStore.saveQuote(quote);
  
  // If authenticated, queue for cloud sync
  if (authStore.isAuthenticated) {
    await syncStore.queueChange('quote', {
      action: 'upsert',
      data: quote
    });
  }
}
```

### Files to Modify

1. `apps/quote-engine/src/pages/QuotePage.vue`
2. `apps/quote-engine/src/pages/SavedQuotesPage.vue`
3. `apps/quote-engine/src/pages/JobsPage.vue`
4. `apps/quote-engine/src/pages/ActiveJobPage.vue`
5. `apps/quote-engine/src/pages/InvoicesPage.vue`

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

**Good luck! The project is well-documented and the codebase is clean. Start by reading the sync store and picking one page to integrate.**
