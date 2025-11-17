# TicTacStick Cloud Migration Runbook

**CRITICAL: Follow this runbook exactly. Data loss is unacceptable.**

## 🚨 Pre-Flight Checklist

Before starting ANY phase:

- [ ] ✅ Full backup of production LocalStorage data
- [ ] ✅ Rollback plan tested and ready
- [ ] ✅ Monitoring dashboard accessible
- [ ] ✅ All stakeholders notified
- [ ] ✅ Maintenance window scheduled (if needed)
- [ ] ✅ Coffee/water ready (this will take time!)

---

## Phase 1: Preparation (Week 1-2)

### Goal
Add UUIDs, metadata, and validate data WITHOUT affecting users.

### Duration
2 weeks (1 week implementation, 1 week monitoring)

### Step 1.1: Deploy UUID Utils Module (Day 1)

**Deploy File:** `/migration/migration-uuid-utils.js`

**Steps:**
```bash
# 1. Add to index.html (before closing </body>)
<script src="/migration/migration-uuid-utils.js"></script>

# 2. Deploy to production
git add migration/migration-uuid-utils.js index.html
git commit -m "feat: add UUID migration utilities (Phase 1)"
git push

# 3. Deploy to hosting
# (Your deployment command here)
```

**Verify:**
- Open browser console
- Check for: `[MIGRATION-UUID] Module loaded`
- Check for: `[MIGRATION] Starting UUID and metadata migration...`
- Check for: `[MIGRATION] Complete! Migrated X records`

**Expected Behavior:**
- Migration runs automatically on first page load
- All LocalStorage records get `_metadata` field
- No user-facing changes
- No data loss

**Rollback:**
```javascript
// If issues found, disable auto-migration:
localStorage.setItem('DISABLE_AUTO_MIGRATION', 'true');
// Refresh page
```

### Step 1.2: Monitor for Issues (Day 2-7)

**Daily Checks:**
```javascript
// Check migration status
var results = JSON.parse(localStorage.getItem('tictacstick_migration_v1_results'));
console.log(results);
// Should show: success: true, totalMigrated: X, issues: []

// Verify migration
var verification = MigrationUUID.verifyMigration();
console.log(verification);
// Should show: success: true, validRecords: X, invalidRecords: 0
```

**Monitor:**
- Error logs
- User reports
- Data integrity

**Success Criteria:**
- ✅ No user-reported issues
- ✅ Migration success rate 100%
- ✅ All records have UUIDs
- ✅ No data corruption

**If Issues Found:**
1. Stop here - do NOT proceed to Phase 2
2. Investigate logs
3. Fix issues
4. Re-deploy
5. Monitor for another week

---

## Phase 2: Dual-Write (Week 3-4)

### Goal
Enable cloud sync WITHOUT changing primary storage (LocalStorage).

### Duration
2 weeks (1 week deployment, 1 week stabilization)

### Step 2.1: Setup Supabase Database (Day 1)

**Database Setup:**
```bash
# 1. Login to Supabase Dashboard
# 2. Create new project: "tictacstick-production"
# 3. Go to SQL Editor
# 4. Run migration/supabase-schema.sql
# 5. Verify all tables created
# 6. Note down:
#    - API URL: https://xxx.supabase.co
#    - Anon Key: eyJxxx...
#    - Service Role Key: eyJxxx... (keep secret!)
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should see: quotes, invoices, clients, etc.
```

### Step 2.2: Create API Endpoint (Day 2-3)

**Create:** `/api/sync/index.js` (or your backend framework)

```javascript
// Minimal sync API endpoint
app.post('/api/sync/push', async (req, res) => {
  const { entity, operation, data, deviceId } = req.body;
  const userId = req.user.id; // From auth

  try {
    // Insert/update to Supabase
    const { data: result, error } = await supabase
      .from(entity)
      .upsert({
        ...data,
        user_id: userId,
        device_id: deviceId
      });

    if (error) throw error;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sync/pull', async (req, res) => {
  const { since } = req.query;
  const userId = req.user.id;

  try {
    let query = supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId);

    if (since) {
      query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, changes: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Test API:**
```bash
# Test push
curl -X POST https://your-api.com/api/sync/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "entity": "quotes",
    "operation": "create",
    "data": {"clientName": "Test", "total": 100}
  }'

# Test pull
curl https://your-api.com/api/sync/pull?since=2025-01-01 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2.3: Deploy Sync Modules (Day 4)

**Deploy Files:**
- `/migration/storage-sync.js`
- `/migration/migration-conflict-resolution.js`
- `/migration/migration-monitoring.js`

**Update index.html:**
```html
<!-- Before closing </body>, after migration-uuid-utils.js -->
<script src="/migration/storage-sync.js"></script>
<script src="/migration/migration-conflict-resolution.js"></script>
<script src="/migration/migration-monitoring.js"></script>

<script>
// Configure API endpoint
StorageSync.configure({
  apiEndpoint: 'https://your-api.com/api/sync',
  apiKey: 'your-api-key-here' // Or get from auth
});
</script>
```

**Deploy:**
```bash
git add migration/*.js index.html
git commit -m "feat: enable cloud sync (Phase 2)"
git push
# Deploy to hosting
```

**Verify:**
- Console shows: `[SYNC] Module loaded`
- Console shows: `[SYNC] Storage sync initialized`
- No errors

### Step 2.4: Monitor Sync Health (Day 5-14)

**Daily Checks:**
```javascript
// Check sync stats
var stats = StorageSync.getStats();
console.log(stats);
// queueLength should be low (< 10)
// failedQueue should be empty

// Check health
var health = MigrationMonitoring.getHealth();
console.log(health);
// status should be 'healthy'

// Show dashboard
MigrationMonitoring.showDashboard();
```

**Weekly Reviews:**
- Sync success rate > 99%
- Sync latency < 5s (p95)
- Queue not backing up
- No critical alerts

**Common Issues:**

**Queue backing up:**
```javascript
// Check queue
var queue = StorageSync.getSyncQueue();
console.log(queue);

// Check failed queue
var failed = StorageSync.getFailedQueue();
console.log(failed);

// Manual retry
StorageSync.retryFailed();
```

**High failure rate:**
```javascript
// Check API endpoint
StorageSync.configure({ apiEndpoint: 'CORRECT_URL' });

// Check authentication
// Verify API key is valid

// Test manually
StorageSync.processQueue();
```

**Success Criteria:**
- ✅ Sync enabled for 1 week
- ✅ Success rate > 99%
- ✅ No data loss
- ✅ Users report no issues
- ✅ Queue processing normally

---

## Phase 3: Cloud-First Migration (Week 5-6)

### Goal
Migrate users to cloud-first storage with gradual rollout.

### Duration
2 weeks (gradual rollout)

### Step 3.1: Backup Everything (Day 1)

**Critical: Create backups before migrating any users!**

```javascript
// Export all data
function backupAllUsers() {
  var backup = {
    timestamp: new Date().toISOString(),
    data: {}
  };

  var keys = [
    'quote-history',
    'invoice-database',
    'client-database',
    'tictacstick_saved_quotes_v1',
    'tictacstick_presets_v1',
    'invoice-settings'
  ];

  keys.forEach(function(key) {
    var data = localStorage.getItem(key);
    if (data) {
      backup.data[key] = JSON.parse(data);
    }
  });

  // Download backup
  var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'tictacstick-backup-' + Date.now() + '.json';
  a.click();
}

backupAllUsers();
```

**Store backups securely!**

### Step 3.2: Enable for 10% Users (Day 2-4)

**Feature Flag Setup:**
```javascript
// In your app initialization code:
function isCloudSyncEnabled() {
  // Check server-side flag OR use % rollout
  var userId = getCurrentUserId();
  var hash = simpleHash(userId);
  return (hash % 100) < 10; // 10% of users
}

if (isCloudSyncEnabled()) {
  // Cloud sync already enabled in Phase 2
  console.log('Cloud sync active');
} else {
  // Disable cloud sync for this user
  StorageSync.disableSync();
}

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

**Monitor (3 days):**
- No increase in error rate
- Sync working for 10% users
- No user complaints

### Step 3.3: Scale to 25% (Day 5-7)

```javascript
// Update rollout percentage
return (hash % 100) < 25; // 25% of users
```

**Monitor (3 days)**

### Step 3.4: Scale to 50% (Day 8-10)

```javascript
return (hash % 100) < 50; // 50% of users
```

**Monitor (3 days)**

### Step 3.5: Scale to 100% (Day 11-14)

```javascript
// Enable for all users
return true; // 100% rollout
```

**Monitor (4+ days)**

**Final Verification:**
```javascript
// Check all users migrated
var stats = MigrationMonitoring.getMetrics();
console.log('Total syncs:', stats.totalSyncAttempts);
console.log('Success rate:', stats.successRate);

// Verify data integrity
var verification = MigrationUUID.verifyMigration();
console.log(verification);
```

---

## Phase 4: Cleanup (Week 7-8)

### Goal
Optimize storage, archive old data, remove migration code.

### Step 4.1: Implement Retention Policy (Day 1-3)

**Deploy retention logic:**
```javascript
// Auto-cleanup old data from LocalStorage
setInterval(function() {
  cleanupOldLocalData();
}, 24 * 60 * 60 * 1000); // Daily

function cleanupOldLocalData() {
  var cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

  // Clean quote history
  var history = JSON.parse(localStorage.getItem('quote-history') || '[]');
  var kept = history.filter(function(q) {
    return new Date(q._metadata.createdAt).getTime() > cutoff;
  });
  localStorage.setItem('quote-history', JSON.stringify(kept));

  console.log('Cleaned up ' + (history.length - kept.length) + ' old quotes');
}
```

### Step 4.2: Archive Old Data (Day 4-5)

**Already in cloud! Just verify:**
```sql
-- Verify old data in Supabase
SELECT COUNT(*) FROM quotes WHERE created_at < NOW() - INTERVAL '30 days';
```

### Step 4.3: Remove Migration Code (Day 6-7)

**After 30 days of successful operation:**

```javascript
// Disable auto-migration (no longer needed)
// Remove from index.html:
// <script src="/migration/migration-uuid-utils.js"></script> // KEEP UUID generation functions!

// Keep these:
// - storage-sync.js (now primary sync mechanism)
// - migration-conflict-resolution.js (still needed)
// - migration-monitoring.js (still useful)
```

---

## 🚨 Emergency Rollback Procedure

**If CRITICAL issues arise at ANY phase:**

### Immediate Action (< 5 minutes)

```javascript
// 1. Disable cloud sync for ALL users
StorageSync.disableSync();
localStorage.setItem('CLOUD_SYNC_DISABLED', 'true');

// 2. Verify LocalStorage intact
var verification = MigrationUUID.verifyMigration();
console.log(verification);

// 3. Notify users
alert('Working offline while we fix a technical issue. Your data is safe.');
```

### Investigate (< 30 minutes)

```javascript
// Check monitoring
MigrationMonitoring.showDashboard();

// Check sync queue
var queue = StorageSync.getSyncQueue();
var failed = StorageSync.getFailedQueue();
console.log('Queue:', queue.length, 'Failed:', failed.length);

// Check recent alerts
var alerts = MigrationMonitoring.getAlerts();
console.log(alerts);
```

### Fix & Resume (< 24 hours)

1. Identify root cause
2. Deploy fix
3. Test thoroughly
4. Gradually re-enable sync (10% → 100%)

---

## Success Metrics

**Migration Complete When:**
- ✅ 100% of users on cloud sync
- ✅ Data integrity 100% (verified via checksums)
- ✅ Sync success rate > 99.5%
- ✅ Zero data loss incidents
- ✅ User satisfaction maintained
- ✅ Multi-device sync working
- ✅ Offline operation working

---

## Contact & Support

**During Migration:**
- **On-Call Engineer:** [Your phone/email]
- **Escalation:** [Manager phone/email]
- **Status Page:** [URL]

**Post-Migration:**
- Monitor for 30 days
- Weekly reviews
- Monthly retrospectives

---

**Remember: Go slow. Test thoroughly. Data loss is UNACCEPTABLE.**

**Good luck! 🚀**
