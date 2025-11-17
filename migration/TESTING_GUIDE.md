# TicTacStick Migration Testing Guide

## Overview

This document outlines the testing strategy for the cloud migration. All tests must pass before deploying to production.

## Test Categories

### 1. Unit Tests

**UUID Generation Tests**
```javascript
// Test UUID format and uniqueness
function testUUIDGeneration() {
  var uuids = [];
  for (var i = 0; i < 1000; i++) {
    var uuid = MigrationUUID.generateUUID();

    // Check format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    assert(uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));

    // Check uniqueness
    assert(uuids.indexOf(uuid) === -1);
    uuids.push(uuid);
  }
  console.log('✓ UUID generation test passed');
}
```

**Metadata Tests**
```javascript
function testMetadataAddition() {
  var record = { clientName: 'Test Client', total: 100 };
  var enhanced = MigrationUUID.addMetadataToRecord(record);

  assert(enhanced._metadata);
  assert(enhanced._metadata.uuid);
  assert(enhanced._metadata.createdAt);
  assert(enhanced._metadata.version === 1);
  assert(enhanced._metadata.syncStatus === 'local');

  console.log('✓ Metadata addition test passed');
}
```

**Conflict Resolution Tests**
```javascript
function testLastWriteWins() {
  var local = {
    _metadata: { uuid: '123', version: 1, updatedAt: '2025-01-02T00:00:00Z' },
    value: 'local'
  };

  var cloud = {
    _metadata: { uuid: '123', version: 2, updatedAt: '2025-01-01T00:00:00Z' },
    value: 'cloud'
  };

  var result = MigrationConflictResolution.resolveLastWriteWins(local, cloud);
  assert(result.winner === 'local'); // Local is newer

  console.log('✓ Last-write-wins test passed');
}
```

### 2. Integration Tests

**LocalStorage → Cloud Sync Test**
```javascript
function testSyncFlow() {
  // 1. Create test data
  var testQuote = {
    clientName: 'Test Client',
    total: 100,
    lineItems: []
  };

  // 2. Save to LocalStorage (should queue for sync)
  StorageSync.set('quote-history', testQuote);

  // 3. Verify queued
  var queue = StorageSync.getSyncQueue();
  assert(queue.length > 0);

  // 4. Process queue (mock cloud API)
  StorageSync.processQueue(function(result) {
    assert(result.success);
    console.log('✓ Sync flow test passed');
  });
}
```

**Offline → Online → Sync Test**
```javascript
function testOfflineOnlineTransition() {
  // 1. Simulate offline
  window.dispatchEvent(new Event('offline'));
  assert(!StorageSync.isOnline());

  // 2. Create data while offline
  StorageSync.set('test-key', { data: 'offline' });

  // 3. Verify queued
  assert(StorageSync.getSyncQueue().length > 0);

  // 4. Go back online
  window.dispatchEvent(new Event('online'));

  // 5. Wait for sync
  setTimeout(function() {
    assert(StorageSync.getSyncQueue().length === 0);
    console.log('✓ Offline/online transition test passed');
  }, 2000);
}
```

### 3. End-to-End Tests

**Complete Migration Test**
```javascript
function testCompleteMigration() {
  // 1. Populate LocalStorage with test data
  var quotes = [];
  for (var i = 0; i < 10; i++) {
    quotes.push({
      id: 'Q-' + i,
      clientName: 'Client ' + i,
      total: 100 * (i + 1)
    });
  }
  localStorage.setItem('quote-history', JSON.stringify(quotes));

  // 2. Run migration
  var results = MigrationUUID.runMigration();

  // 3. Verify all records have UUIDs
  var migrated = JSON.parse(localStorage.getItem('quote-history'));
  migrated.forEach(function(quote) {
    assert(quote._metadata);
    assert(quote._metadata.uuid);
  });

  // 4. Verify checksums
  var verification = MigrationUUID.verifyMigration();
  assert(verification.success);
  assert(verification.validRecords === quotes.length);

  console.log('✓ Complete migration test passed');
}
```

**Concurrent Modification Test**
```javascript
function testConcurrentModification() {
  // Simulate same record modified on two devices
  var baseRecord = {
    _metadata: {
      uuid: 'test-123',
      version: 1,
      updatedAt: '2025-01-01T00:00:00Z'
    },
    clientName: 'Original'
  };

  // Device A modification
  var deviceA = JSON.parse(JSON.stringify(baseRecord));
  deviceA._metadata.version = 2;
  deviceA._metadata.updatedAt = '2025-01-01T10:00:00Z';
  deviceA.clientName = 'Modified A';

  // Device B modification (concurrent)
  var deviceB = JSON.parse(JSON.stringify(baseRecord));
  deviceB._metadata.version = 2;
  deviceB._metadata.updatedAt = '2025-01-01T10:00:05Z';
  deviceB.clientName = 'Modified B';

  // Detect conflict
  var detection = MigrationConflictResolution.detectConflict(deviceA, deviceB);
  assert(detection.hasConflict);

  // Resolve
  var resolution = MigrationConflictResolution.resolveConflict('quote', deviceA, deviceB);
  assert(resolution.resolution === 'cloud'); // B is 5 seconds newer

  console.log('✓ Concurrent modification test passed');
}
```

### 4. Load Tests

**Large Dataset Test**
```javascript
function testLargeDataset() {
  // Create 1000 test quotes
  var quotes = [];
  for (var i = 0; i < 1000; i++) {
    quotes.push({
      clientName: 'Client ' + i,
      total: Math.random() * 10000,
      lineItems: [
        { description: 'Item 1', price: 50 },
        { description: 'Item 2', price: 100 }
      ]
    });
  }

  // Test migration performance
  localStorage.setItem('quote-history', JSON.stringify(quotes));
  var start = Date.now();
  var results = MigrationUUID.runMigration();
  var duration = Date.now() - start;

  assert(results.totalMigrated === 1000);
  assert(duration < 5000); // Should complete in < 5 seconds

  console.log('✓ Large dataset test passed (' + duration + 'ms)');
}
```

**Network Failure Simulation**
```javascript
function testNetworkFailure() {
  // Mock failing XHR
  var originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    var xhr = new originalXHR();
    var originalSend = xhr.send;
    xhr.send = function() {
      setTimeout(function() {
        xhr.onerror();
      }, 100);
    };
    return xhr;
  };

  // Attempt sync
  StorageSync.set('test-key', { data: 'test' });
  StorageSync.processQueue(function(result) {
    // Should queue for retry
    var queue = StorageSync.getSyncQueue();
    assert(queue.length > 0);
    assert(queue[0].attempts > 0);

    // Restore XHR
    window.XMLHttpRequest = originalXHR;
    console.log('✓ Network failure test passed');
  });
}
```

## Running Tests

### Manual Testing Checklist

**Phase 1: Preparation (Week 1-2)**
- [ ] Run UUID generation test (1000 UUIDs)
- [ ] Run metadata addition test
- [ ] Run data validation test on production snapshot
- [ ] Verify no data corruption
- [ ] Test rollback procedure

**Phase 2: Dual-Write (Week 3-4)**
- [ ] Test LocalStorage write (should succeed)
- [ ] Test cloud queue (should queue if offline)
- [ ] Test sync retry logic (simulate network failure)
- [ ] Test conflict detection
- [ ] Test conflict resolution (all strategies)

**Phase 3: Cloud-First (Week 5-6)**
- [ ] Test full migration (10% users)
- [ ] Verify data integrity (checksums)
- [ ] Test multi-device sync (2+ devices)
- [ ] Test offline operation
- [ ] Monitor error rates

**Phase 4: Cleanup (Week 7-8)**
- [ ] Test retention policy
- [ ] Verify old data archived
- [ ] Test data retrieval from cloud

### Automated Testing

Run all tests:
```javascript
// Run all unit tests
testUUIDGeneration();
testMetadataAddition();
testLastWriteWins();

// Run all integration tests
testSyncFlow();
testOfflineOnlineTransition();

// Run all E2E tests
testCompleteMigration();
testConcurrentModification();

// Run all load tests
testLargeDataset();
testNetworkFailure();

console.log('✅ All tests passed!');
```

## Test Data

### Creating Test Data
```javascript
function createTestData() {
  // Quotes
  localStorage.setItem('quote-history', JSON.stringify([
    {
      clientName: 'Test Client A',
      total: 1100,
      subtotal: 1000,
      gst: 100,
      quoteStatus: 'draft'
    },
    {
      clientName: 'Test Client B',
      total: 2200,
      subtotal: 2000,
      gst: 200,
      quoteStatus: 'sent'
    }
  ]));

  // Invoices
  localStorage.setItem('invoice-database', JSON.stringify([
    {
      invoiceNumber: 'INV-1001',
      total: 1100,
      balance: 1100,
      status: 'sent'
    }
  ]));

  // Clients
  localStorage.setItem('client-database', JSON.stringify([
    {
      name: 'Test Client A',
      email: 'testa@example.com',
      phone: '555-1234'
    }
  ]));
}
```

### Cleaning Test Data
```javascript
function cleanTestData() {
  var testKeys = [
    'quote-history',
    'invoice-database',
    'client-database',
    'tictacstick_migration_v1_complete',
    'tictacstick_sync_queue'
  ];

  testKeys.forEach(function(key) {
    localStorage.removeItem(key);
  });
}
```

## Success Criteria

### Migration Tests Must Pass:
- ✅ 100% of records have valid UUIDs
- ✅ 100% of records have metadata
- ✅ Data checksums match before/after
- ✅ No data loss (count before = count after)
- ✅ All relationships intact

### Sync Tests Must Pass:
- ✅ Sync success rate > 99%
- ✅ Sync latency < 5s (p95)
- ✅ Queue processes successfully
- ✅ Retry logic works
- ✅ Offline operation works

### Conflict Tests Must Pass:
- ✅ Conflicts detected correctly
- ✅ LWW resolution works
- ✅ Version-based resolution works
- ✅ Manual resolution UI works

## Troubleshooting

**Migration fails with errors:**
- Check browser console for errors
- Verify LocalStorage data format
- Run data validation separately
- Try with smaller dataset first

**Sync queue backs up:**
- Check network connectivity
- Verify API endpoint configured
- Check retry delays and attempts
- Review failed queue for patterns

**Conflicts not resolving:**
- Verify metadata present
- Check resolution strategy config
- Test with simpler conflicts first
- Enable manual resolution UI

---

**Remember:** Test thoroughly with production data snapshots before deploying!
