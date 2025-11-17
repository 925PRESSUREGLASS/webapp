# TicTacStick Cloud Migration Strategy
## LocalStorage → Cloud (Supabase PostgreSQL) with Offline-First Sync

**Document Version:** 1.0
**Created:** 2025-11-17
**Status:** Phase 3 Preparation
**Priority:** CRITICAL - Zero Data Loss Required

---

## Executive Summary

This document outlines the complete migration strategy for moving TicTacStick from 100% LocalStorage to cloud-based storage (Supabase PostgreSQL) while maintaining offline-first functionality. The migration prioritizes **data integrity above all else** with comprehensive rollback capabilities.

### Current State
- **Storage:** 100% browser LocalStorage
- **Data:** 8 LocalStorage keys storing ~5-10MB per user
- **Sync:** None (single device, offline-only)
- **Users:** Solo operator (will scale to multi-device + team)

### Target State
- **Storage:** Supabase PostgreSQL (primary) + LocalStorage (offline cache)
- **Sync:** Real-time bidirectional sync with conflict resolution
- **Access:** Multi-device support with offline-first architecture
- **Features:** Audit trail, backup/recovery, team collaboration ready

### Migration Phases
- **Phase 1:** Preparation (Week 1-2) - Add UUIDs, timestamps, validation
- **Phase 2:** Dual-Write (Week 3-4) - LocalStorage + Cloud sync
- **Phase 3:** Cloud-First (Week 5-6) - Gradual user migration
- **Phase 4:** Cleanup (Week 7-8) - Retention policies, archive old data

---

## 1. Current LocalStorage Schema

### 1.1 Storage Keys

| Key | Purpose | Size | Structure |
|-----|---------|------|-----------|
| `tictacstick_autosave_state_v1` | Current quote state | ~50KB | Single object |
| `tictacstick_saved_quotes_v1` | Named saved quotes | ~500KB | Array of quotes |
| `tictacstick_presets_v1` | Configuration & defaults | ~10KB | Array of presets |
| `quote-history` | Historical quotes with status | ~2MB | Array of quotes |
| `client-database` | Customer registry | ~1MB | Array of clients |
| `invoice-database` | Generated invoices | ~2MB | Array of invoices |
| `invoice-settings` | Invoice numbering & config | ~5KB | Single object |
| `quote-templates` | Pre-configured line items | ~500KB | Array of templates |

### 1.2 Current Data Structures

**Quote Object:**
```javascript
{
  id: 'Q-2025-000123',              // User-facing ID (NOT globally unique)
  clientName: 'ABC Corporation',
  clientLocation: '123 Main St',
  quoteTitle: 'Window Cleaning',
  jobType: 'windows',
  windowLines: [...],
  pressureLines: [...],
  subtotal: 1000.00,
  gst: 100.00,
  total: 1100.00,
  quoteStatus: 'sent',
  statusUpdatedAt: 1700000000000,
  createdAt: 1700000000000          // May be missing in old records
}
```

**Invoice Object:**
```javascript
{
  id: 'invoice_1700000000000_abc123',  // Timestamp-based (collision risk)
  invoiceNumber: 'INV-1001',
  quoteId: 'Q-2025-000123',            // Reference to quote
  clientName: 'ABC Corporation',
  total: 1100.00,
  amountPaid: 0,
  balance: 1100.00,
  status: 'sent',
  invoiceDate: 1700000000000,
  dueDate: 1700604800000,
  payments: [...]
}
```

**Client Object:**
```javascript
{
  id: 'client_1700000000000_xyz789',  // Timestamp-based (collision risk)
  name: 'ABC Corporation',
  email: 'contact@abc.com',
  phone: '555-1234',
  address: '123 Main St',
  location: 'Sydney, NSW',
  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

### 1.3 Identified Issues

❌ **No globally unique identifiers** - ID collision risk across devices
❌ **Missing timestamps** - Some old records lack created/updated timestamps
❌ **No versioning** - Can't detect concurrent modifications
❌ **No sync metadata** - No way to track sync status
❌ **No soft deletes** - Hard deletes prevent sync conflict resolution
❌ **Inconsistent data** - GST calculations, orphaned references possible

---

## 2. Phase 1: Preparation (Week 1-2)

### 2.1 Add Unique IDs to All Records

**Goal:** Every record gets a globally unique UUID while preserving user-facing IDs.

**Implementation Files:**
- `/migration/migration-uuid-utils.js` - UUID generation and migration
- See implementation in next section

**Key Principles:**
- ✅ Use `crypto.randomUUID()` where available (modern browsers)
- ✅ Fallback to collision-resistant custom UUID generator
- ✅ Preserve existing user-facing IDs (quote numbers, invoice numbers)
- ✅ Add internal UUID field for sync/conflict resolution
- ✅ Run migration on app load (one-time, idempotent)

### 2.2 Add Timestamps & Versioning

**Goal:** Track creation time, modification time, and version for conflict resolution.

**Metadata Structure:**
```javascript
{
  _metadata: {
    uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Global unique ID
    createdAt: '2025-11-17T10:30:00.000Z',         // ISO 8601 timestamp
    updatedAt: '2025-11-17T11:45:00.000Z',         // ISO 8601 timestamp
    version: 3,                                     // Optimistic lock version
    deviceId: 'device-abc123',                     // Which device made change
    syncStatus: 'synced',                          // local|pending|synced|conflict
    deletedAt: null,                               // Soft delete timestamp
    lastSyncedAt: '2025-11-17T11:45:00.000Z'      // Last successful sync
  }
}
```

### 2.3 Data Validation & Cleanup

**Goal:** Fix inconsistencies before migration to prevent propagating bad data.

**Validation Checks:**
1. Required fields present (clientName, total, etc.)
2. Numeric values valid (no NaN, Infinity, negative where invalid)
3. Dates in valid format
4. GST calculations correct (should be subtotal * 0.1)
5. Relationships intact (invoice → quote, quote → client)
6. No orphaned records

**Implementation:** `/migration/migration-uuid-utils.js` includes validation

---

## 3. Phase 2: Dual-Write (Week 3-4)

### 3.1 Storage Abstraction Layer

**Architecture:**
```
┌─────────────────────────────────────────┐
│      Application Layer                  │
│   (calc.js, invoice.js, etc.)           │
└──────────────────┬──────────────────────┘
                   │ Uses unified API
                   ▼
┌─────────────────────────────────────────┐
│   Storage Abstraction (storage-sync.js) │
│  ┌───────────────┐  ┌────────────────┐ │
│  │  LocalStorage │◄─┤  Sync Queue    │ │
│  │   (primary)   │  └────────────────┘ │
│  └───────────────┘           │          │
│         │                    │          │
│         │          ┌─────────▼────────┐ │
│         └─────────►│  CloudStorage    │ │
│                    │  (secondary)     │ │
│                    └──────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Principles:**
- ✅ **LocalStorage is primary** - Always fast, always works
- ✅ **Cloud is secondary** - Eventual consistency acceptable
- ✅ **Queue failed syncs** - Never lose data due to network issues
- ✅ **Never block UI** - Cloud operations run in background
- ✅ **Graceful degradation** - App works fully offline

**Implementation:** `/migration/storage-sync.js`

### 3.2 Conflict Resolution Strategies

**Strategy 1: Last-Write-Wins (LWW)**
- Simple, automatic
- Compare `updatedAt` timestamps
- **Use for:** Settings, presets, templates
- **Risk:** May lose concurrent edits

**Strategy 2: Version-Based (Optimistic Locking)**
- Compare version numbers
- Detect conflicts reliably
- **Use for:** Quotes, invoices, clients
- **Risk:** More conflicts flagged for user resolution

**Strategy 3: Field-Level Merge**
- Merge non-conflicting fields
- Complex but preserves more data
- **Use for:** Future enhancement
- **Risk:** Complex edge cases

**Recommendation:** Start with LWW for auto-resolution + version-based for detection, show conflicts to user when critical.

**Implementation:** `/migration/migration-conflict-resolution.js`

### 3.3 Sync Queue & Retry Logic

**Features:**
- Exponential backoff (1s → 60s max)
- Max 10 retry attempts
- Failed queue for manual intervention
- Background processing
- Online/offline detection

**Implementation:** `/migration/migration-sync-queue.js`

---

## 4. Phase 3: Cloud-First Migration (Week 5-6)

### 4.1 Gradual Rollout

**Rollout Schedule:**
| Week | Rollout % | Users | Monitor Period |
|------|-----------|-------|----------------|
| 5.1  | 10%       | Beta testers | 3 days |
| 5.2  | 25%       | Early adopters | 3 days |
| 6.1  | 50%       | Half of users | 3 days |
| 6.2  | 100%      | All users | Ongoing |

**Feature Flag System:**
- Server-side or localStorage-based flags
- Per-user enablement
- Instant rollback capability
- A/B test infrastructure ready

### 4.2 Data Verification

**Post-Migration Checks:**
1. Record count matches (local vs cloud)
2. Checksums match for each record
3. Relationships preserved
4. No data corruption
5. Sync queue empty or processing normally

---

## 5. Phase 4: Cleanup (Week 7-8)

### 5.1 LocalStorage Retention Policy

**Strategy:** Keep recent data locally, archive old data to cloud-only

**Retention Rules:**
- ✅ Keep last 30 days of quotes
- ✅ Keep last 10 invoices
- ✅ Keep all unsaved drafts
- ✅ Keep all settings
- ✅ Archive older data to cloud-only
- ✅ User can manually pin important quotes to keep offline

### 5.2 Migration Code Removal

**After 100% Rollout:**
- Remove UUID migration code (keep UUID generation)
- Remove dual-write abstraction (use cloud-first)
- Remove feature flags
- Archive migration docs

---

## 6. Database Schema (PostgreSQL/Supabase)

**See:** `/migration/supabase-schema.sql` for complete schema

**Key Tables:**
- `quotes` - All quote data
- `invoices` - All invoice data
- `clients` - Customer registry
- `quote_line_items` - Normalized line items
- `invoice_payments` - Payment records
- `sync_queue` - Debug sync issues
- `audit_log` - Change history

**Features:**
- UUID primary keys
- Soft deletes (`deleted_at`)
- Optimistic locking (`version`)
- Audit timestamps
- JSONB for flexible schema evolution
- Indexes for performance
- Row-level security (RLS) for multi-tenancy

---

## 7. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data loss during migration** | CRITICAL | Low | Extensive testing, backups, verification, rollback plan |
| **Sync conflicts not handled** | HIGH | Medium | Multiple conflict strategies, user resolution UI |
| **Sync queue grows too large** | MEDIUM | Medium | Exponential backoff, failed queue, monitoring |
| **Users lose offline access** | MEDIUM | Low | Dual-write ensures LocalStorage always works |
| **Cloud costs exceed budget** | LOW | Medium | Monitor usage, optimize queries, implement limits |
| **Network issues cause sync failures** | MEDIUM | High | Queue with retry, graceful degradation, user notification |
| **Schema evolution breaks sync** | HIGH | Low | Version all APIs, backward compatibility, migration paths |

---

## 8. Success Metrics

**Migration Success:**
- ✅ Zero data loss (verified via checksums)
- ✅ 100% of users migrated
- ✅ Sync success rate > 99%
- ✅ Sync latency < 5 seconds (p95)
- ✅ Offline functionality intact
- ✅ User satisfaction maintained

**Performance Targets:**
- Sync latency: < 3s (p50), < 5s (p95), < 10s (p99)
- Sync success rate: > 99.5%
- Conflict rate: < 1% of syncs
- Failed sync recovery: < 10 minutes
- Offline operation: 100% functional

---

## 9. Rollback Plan

**If Critical Issues Arise:**

### Step 1: Immediate Response (< 5 min)
```javascript
// Disable cloud sync via feature flag
FeatureFlags.disableAllCloudSync();
// App continues working with LocalStorage only
```

### Step 2: Verify Data Integrity (< 15 min)
```javascript
// Check LocalStorage has all data
verifyLocalStorageIntact();
// If corrupted, restore from pre-migration backup
```

### Step 3: Communicate (< 30 min)
- Show in-app message: "Working offline while we fix an issue"
- Update status page
- Email affected users if data at risk

### Step 4: Investigate (< 2 hours)
- Check error logs
- Check sync queue
- Identify root cause

### Step 5: Fix & Resume (< 24 hours)
- Deploy fix
- Test thoroughly
- Gradually re-enable cloud sync (10% → 100%)

---

## 10. Testing Strategy

**Unit Tests:**
- UUID generation (uniqueness, format)
- Metadata addition
- Conflict resolution algorithms
- Sync queue logic

**Integration Tests:**
- LocalStorage ↔ Cloud sync
- Offline → Online → Offline transitions
- Conflict detection and resolution
- Multi-device scenarios

**End-to-End Tests:**
- Complete migration flow
- User workflows (create quote, generate invoice, etc.)
- Network failure scenarios
- Concurrent modification scenarios

**Load Tests:**
- 1000+ quotes per user
- 10+ devices per user
- Network latency (slow 3G, packet loss)
- Supabase rate limits

**Implementation:** `/migration/migration-tests.js`

---

## 11. Monitoring & Alerts

**Metrics to Track:**
- Sync attempts (total, success, failure)
- Sync latency (p50, p95, p99)
- Conflict rate
- Queue length
- Failed sync count
- User-facing errors

**Alert Thresholds:**
- 🔴 Critical: Sync failure rate > 10%
- 🟠 Warning: Queue length > 100 items
- 🟠 Warning: Sync latency p95 > 10s
- 🟡 Info: Conflict rate > 5%

**Implementation:** `/migration/migration-monitoring.js`

---

## 12. User Communication Plan

**Before Migration:**
- ✅ "We're adding cloud sync for multi-device support!"
- ✅ "Your data will be backed up to the cloud"
- ✅ "You'll still be able to work offline"

**During Migration:**
- ✅ Progress indicator (if user-initiated)
- ✅ "Syncing your data..." status
- ✅ Clear error messages if issues

**After Migration:**
- ✅ "Cloud sync enabled! Your data is now backed up"
- ✅ "Access your quotes from any device"
- ✅ Help doc on how multi-device works

---

## 13. Implementation Files

| File | Purpose |
|------|---------|
| `/migration/migration-uuid-utils.js` | UUID generation, metadata addition, data validation |
| `/migration/storage-sync.js` | Storage abstraction layer with dual-write |
| `/migration/migration-conflict-resolution.js` | Conflict detection and resolution strategies |
| `/migration/supabase-schema.sql` | PostgreSQL database schema |
| `/migration/migration-sync-queue.js` | Sync queue, retry logic, background processing |
| `/migration/migration-tests.js` | Comprehensive test suite |
| `/migration/migration-monitoring.js` | Monitoring, metrics, and alerting |
| `/migration/MIGRATION_RUNBOOK.md` | Step-by-step execution guide |

---

## 14. Timeline & Dependencies

**Week 1-2: Preparation**
- [ ] Implement UUID generation
- [ ] Implement metadata addition
- [ ] Implement data validation
- [ ] Deploy and monitor (no user impact)

**Week 3-4: Dual-Write**
- [ ] Implement storage-sync.js
- [ ] Implement conflict resolution
- [ ] Implement sync queue
- [ ] Deploy and monitor (sync in background)

**Week 5-6: Cloud-First**
- [ ] Setup Supabase database
- [ ] Deploy schema and APIs
- [ ] Gradual user migration (10% → 100%)
- [ ] Monitor closely, ready to rollback

**Week 7-8: Cleanup**
- [ ] Implement retention policy
- [ ] Archive old data
- [ ] Remove migration code
- [ ] Update documentation

---

## 15. Constraints & Requirements

### Technical Constraints
- ✅ ES5 JavaScript (iOS Safari 12+ compatibility)
- ✅ No external dependencies for core sync logic
- ✅ Work in Progressive Web App (PWA) context
- ✅ Supabase for backend (or compatible PostgreSQL)

### Business Constraints
- ✅ Zero data loss (non-negotiable)
- ✅ No user disruption
- ✅ Offline-first always
- ✅ No forced data migration (gradual rollout)

### Operational Constraints
- ✅ Can rollback at any time
- ✅ Monitoring and alerting in place
- ✅ Support for manual intervention
- ✅ Documentation for troubleshooting

---

## 16. Next Steps

1. **Review this document** with stakeholders
2. **Setup Supabase project** and provision database
3. **Implement Phase 1** (UUID utils, metadata)
4. **Test Phase 1** thoroughly with production data snapshot
5. **Deploy Phase 1** to production (low risk, no user impact)
6. **Monitor Phase 1** for 1 week
7. **Proceed to Phase 2** if no issues

---

## Appendix A: Glossary

- **UUID**: Universally Unique Identifier (128-bit, globally unique)
- **LWW**: Last-Write-Wins (conflict resolution strategy)
- **RLS**: Row-Level Security (Supabase security model)
- **Optimistic Locking**: Version-based concurrency control
- **Soft Delete**: Mark as deleted without removing from database
- **Dual-Write**: Write to both LocalStorage and Cloud simultaneously
- **Sync Queue**: Queue of pending changes to sync to cloud
- **Feature Flag**: Runtime configuration to enable/disable features

---

**Document Prepared By:** Claude (AI Assistant)
**Review Status:** Pending
**Approval Required:** Product Owner, Engineering Lead
**Next Review Date:** 2025-11-24
