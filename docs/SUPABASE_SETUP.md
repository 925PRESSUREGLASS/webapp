# Supabase Database Setup Guide

This guide walks through setting up the Supabase PostgreSQL database for the TicTacStick Quote Engine and Metabuild platform.

## Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Name:** `metabuild` (or your preference)
   - **Database Password:** Generate a strong password and SAVE IT
   - **Region:** Choose closest to you (e.g., `ap-southeast-2` for Australia)
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

## Step 2: Get Connection Strings

Once the project is ready:

1. Go to **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Copy the **URI** format connection strings:

### Connection Pooler (for API - port 6543)
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Direct Connection (for migrations - port 5432)
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Step 3: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://[project-ref].supabase.co`
   - **anon public key:** `eyJhbG...` (safe for client-side)
   - **service_role key:** `eyJhbG...` (NEVER expose publicly)

## Step 4: Configure Environment Variables

Create/update `.env` file in `apps/meta-api/`:

```bash
cd apps/meta-api
cp .env.example .env
```

Edit `.env` with your Supabase values:

```env
# Database - Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Supabase Keys
SUPABASE_URL=https://[YOUR-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key

# API Configuration  
API_KEY=generate-a-random-key-here
ALLOWED_ORIGIN=http://localhost:9000
PORT=3001

# JWT Secret (generate a random 64-char string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Step 5: Run Database Migrations

From the project root:

```bash
# Install dependencies
cd apps/meta-api
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# OR push schema directly (faster for initial setup)
npm run prisma:push
```

## Step 6: Verify Database

### Option A: Check in Supabase Dashboard
1. Go to **Table Editor** in Supabase dashboard
2. You should see all tables:
   - `User`, `Organization`, `Client`
   - `Quote`, `Job`, `Invoice`
   - `AuditLog`, `SyncQueue`
   - Plus the existing `Project`, `Asset`, etc.

### Option B: Check via Prisma Studio
```bash
cd apps/meta-api
npx prisma studio
```
Opens a browser UI at http://localhost:5555

## Step 7: Seed Initial Data (Optional)

```bash
npm run prisma:seed
```

This creates:
- Default organization
- Admin user (email: admin@example.com)
- Sample data for testing

---

## Database Schema Overview

### Core TicTacStick Models

| Model | Purpose |
|-------|---------|
| `User` | Authentication & user profiles |
| `Organization` | Multi-tenant business accounts |
| `Client` | Customer database |
| `Quote` | Window cleaning quotes |
| `Job` | Active/completed jobs |
| `Invoice` | Billing & payments |

### Support Models

| Model | Purpose |
|-------|---------|
| `AuditLog` | Activity tracking |
| `SyncQueue` | Offline sync queue |

### Existing Metabuild Models

| Model | Purpose |
|-------|---------|
| `Project` | App/project registry |
| `Feature` | Feature tracking |
| `Asset` | Code snippets, templates |
| `Business` | Service business config |
| `ServiceLine` | Service categories |
| `ServiceType` | Individual services |

---

## Troubleshooting

### "Password authentication failed"
- Check your password doesn't have special characters that need escaping
- Try URL-encoding special characters: `@` → `%40`, `#` → `%23`

### "Connection refused"
- Ensure you're using the correct port:
  - **6543** for pooler connection (API)
  - **5432** for direct connection (migrations)

### "SSL required"
- Add `?sslmode=require` to connection string if needed

### "Table already exists"
- Run `npm run prisma:migrate reset` to reset database (WARNING: deletes data)

---

## Next Steps

After database setup:
1. ✅ Database is configured
2. → **Phase 2:** Deploy meta-api to Render
3. → **Phase 3:** Deploy quote-engine to Vercel
4. → **Phase 4:** Configure sync service

---

## Security Notes

- Never commit `.env` files to git
- Use different passwords for dev/staging/production
- Rotate `service_role` key if exposed
- Enable Row Level Security (RLS) for production
