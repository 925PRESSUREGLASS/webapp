# Hybrid Database Architecture

TicTacStick uses a hybrid architecture with **Prisma Postgres** and **Supabase** working together.

## Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Prisma Postgres** | `db.prisma.io` | Primary database via Prisma ORM |
| **Supabase** | `hqvvaesgovdtnbxsxrpf.supabase.co` | Realtime, Auth, Storage |

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     QUOTE ENGINE (Vue/Quasar)               │
│                                                             │
│  ┌─────────────────┐            ┌─────────────────┐         │
│  │  API Calls      │            │  Realtime       │         │
│  │  (REST/fetch)   │            │  Subscriptions  │         │
│  └────────┬────────┘            └────────┬────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐      ┌───────────────────────┐
│    META-API           │      │     SUPABASE          │
│    (Fastify)          │      │     Realtime          │
│                       │      │                       │
│  ┌─────────────────┐  │      │  - Live updates       │
│  │  Prisma Client  │  │      │  - Presence           │
│  └────────┬────────┘  │      │  - File storage       │
└───────────┼───────────┘      └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│   PRISMA POSTGRES     │
│   (PostgreSQL)        │
│                       │
│  - Users              │
│  - Organizations      │
│  - Clients            │
│  - Quotes             │
│  - Jobs               │
│  - Invoices           │
│  - AuditLog           │
│  - SyncQueue          │
└───────────────────────┘
```

## When to Use What

### Prisma Postgres (via meta-api)
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Complex queries with relations
- ✅ Transactions
- ✅ Data validation with Zod
- ✅ Business logic

### Supabase
- ✅ Realtime subscriptions (live updates)
- ✅ File storage (photos, PDFs, signatures)
- ✅ Authentication (if needed)
- ✅ Edge functions (optional)
- ✅ Presence (who's online)

## Usage Examples

### API Call (Prisma)
```typescript
// Frontend
const response = await fetch('/api/quotes', {
  method: 'POST',
  body: JSON.stringify(quoteData)
});
const quote = await response.json();
```

### Realtime Subscription (Supabase)
```typescript
// Frontend
import { supabase } from '@/utils/supabase';

supabase
  .channel('quotes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'Quote' }, 
    (payload) => {
      console.log('Quote changed:', payload);
      // Update local state
    })
  .subscribe();
```

### File Upload (Supabase Storage)
```typescript
// Frontend
import { supabase } from '@/utils/supabase';

const { data, error } = await supabase.storage
  .from('job-photos')
  .upload(`jobs/${jobId}/${filename}`, file);
```

## Environment Variables

### meta-api/.env
```env
# Prisma Postgres
DATABASE_URL="postgres://...@db.prisma.io:5432/postgres"

# Supabase
SUPABASE_URL=https://hqvvaesgovdtnbxsxrpf.supabase.co
SUPABASE_KEY=eyJ...
```

### quote-engine/.env
```env
# Supabase (for realtime)
VITE_SUPABASE_URL=https://hqvvaesgovdtnbxsxrpf.supabase.co
VITE_SUPABASE_KEY=eyJ...

# API
VITE_API_URL=http://localhost:3001
```

## Benefits of This Architecture

1. **Type Safety**: Prisma provides full TypeScript types for all database operations
2. **Realtime**: Supabase handles WebSocket connections for live updates
3. **Storage**: Supabase Storage for files without managing S3
4. **Separation**: API handles business logic, Supabase handles realtime
5. **Scalability**: Both services scale independently
