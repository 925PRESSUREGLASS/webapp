# Webhook Integration & Real-time Sync Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Feature:** Bonus Prompt #30 - Webhook Integration

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Setup Instructions](#setup-instructions)
5. [Configuration](#configuration)
6. [Event Types](#event-types)
7. [Conflict Resolution](#conflict-resolution)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Security](#security)

---

## Overview

The webhook integration enables **bidirectional real-time sync** between TicTacStick and GoHighLevel CRM. Changes in GHL instantly reflect in TicTacStick, and vice versa.

### Benefits

- ✅ **Real-time updates** - No manual refresh needed
- ✅ **Automatic sync** - Changes propagate instantly
- ✅ **Conflict resolution** - Handles concurrent updates gracefully
- ✅ **Offline support** - Event queue processes when back online
- ✅ **Team collaboration** - Multiple users stay in sync

### How It Works

```
GoHighLevel → Webhook → Cloudflare Worker → TicTacStick (polling)
TicTacStick → GHL API → GoHighLevel
```

1. **GHL sends webhooks** when events occur (contact updated, opportunity won, etc.)
2. **Cloudflare Worker** receives webhooks, verifies signatures, transforms data
3. **TicTacStick polls** the worker endpoint every 30 seconds for new events
4. **Events processed** in batches with retry logic
5. **Local data updated** with conflict resolution

---

## Architecture

### Components

#### 1. Cloudflare Worker (`cloudflare/worker.js`)
- Receives HTTP POST webhooks from GHL
- Verifies HMAC signatures
- Transforms GHL events to TicTacStick format
- Stores events for client polling (optional KV storage)
- Handles CORS for browser access

#### 2. Webhook Processor (`webhook-processor.js`)
- Client-side event processing
- Polls worker endpoint every 30 seconds
- Event queue with retry logic
- Batch processing (10 events per batch)
- Conflict detection and resolution

#### 3. GHL Webhook Setup (`ghl-webhook-setup.js`)
- Register/update/delete webhooks via GHL API
- Test webhook endpoint connectivity
- List and verify webhooks

#### 4. Webhook Settings UI (`webhook-settings.js`)
- Configuration interface
- Sync status monitoring
- Event queue management
- Manual sync trigger

#### 5. Debug Utilities (`webhook-debug.js`)
- Simulate webhook events
- View queue status
- Export debug logs
- Integration testing

### Data Flow

```
┌─────────────────┐
│  GoHighLevel    │
│   (CRM System)  │
└────────┬────────┘
         │ HTTP POST Webhook
         ▼
┌─────────────────┐
│ Cloudflare      │
│   Worker        │
│ (Edge Function) │
└────────┬────────┘
         │ Store Event
         ▼
┌─────────────────┐
│  Event Storage  │
│  (Optional KV)  │
└────────┬────────┘
         │ HTTP GET (poll)
         ▼
┌─────────────────┐
│  TicTacStick    │
│   (Browser)     │
└────────┬────────┘
         │ Process & Update
         ▼
┌─────────────────┐
│  LocalStorage   │
└─────────────────┘
```

---

## Quick Start

### Prerequisites

- ✅ GoHighLevel account with API access
- ✅ Cloudflare Workers account (free tier works)
- ✅ TicTacStick v1.8.0+
- ✅ GHL API credentials configured

### 5-Minute Setup

1. **Deploy Cloudflare Worker**
   ```bash
   # See cloudflare/README.md for detailed instructions
   cd cloudflare
   # Copy worker.js to Cloudflare Workers dashboard
   ```

2. **Configure Environment Variables**
   ```
   WEBHOOK_SECRET=your-secret-here
   ALLOWED_ORIGINS=https://your-domain.com
   ```

3. **Get Worker URL**
   ```
   https://tictacstick-webhooks.your-account.workers.dev
   ```

4. **Configure TicTacStick**
   - Click "🔄 Sync" button in header
   - Enter webhook URL
   - Enter webhook secret
   - Save settings

5. **Register Webhook with GHL**
   - In webhook settings, click "Register Webhook"
   - Select events to subscribe to
   - Save

6. **Test Integration**
   ```javascript
   // In browser console:
   WebhookDebug.runIntegrationTest();
   ```

---

## Setup Instructions

### Step 1: Deploy Cloudflare Worker

See `cloudflare/README.md` for complete deployment instructions.

**Summary:**
1. Create Cloudflare Workers account
2. Create new worker named `tictacstick-webhooks`
3. Paste code from `cloudflare/worker.js`
4. Configure environment variables
5. Deploy and test

**Result:** Worker URL like `https://tictacstick-webhooks.your-account.workers.dev`

### Step 2: Configure TicTacStick

1. **Open Webhook Settings**
   - Click "🔄 Sync" button in app header
   - Or use keyboard shortcut (if configured)

2. **Enter Configuration**
   - **Webhook URL:** Your Cloudflare Worker URL
   - **Webhook Secret:** Generated secret (must match GHL)
   - **Enable real-time sync:** ✅
   - **Bidirectional sync:** ✅
   - **Conflict resolution:** Most recent wins (recommended)

3. **Select Event Subscriptions**
   - ✅ Contact Updates
   - ✅ Opportunity Updates
   - ✅ Task Updates
   - ✅ New Notes
   - ⬜ Inbound Messages (optional)
   - ⬜ Appointment Updates (optional)

4. **Save Settings**

### Step 3: Test Webhook Endpoint

Before registering with GHL, test your endpoint:

1. In webhook settings, click **"Test Endpoint"**
2. Should see success message
3. If fails, check:
   - Worker is deployed
   - URL is correct
   - CORS is configured
   - Worker is not rate-limited

### Step 4: Register with GoHighLevel

1. **In TicTacStick webhook settings**, click **"Register Webhook"**
2. This calls GHL API to register your webhook
3. You'll receive a webhook ID
4. GHL will now send events to your worker

**Verify Registration:**
```javascript
// In browser console:
GHLWebhookSetup.verifyWebhook(function(err, result) {
  console.log(result);
});
```

### Step 5: Monitor Sync

**Sync Status shows:**
- **Status:** Active/Disabled/Error
- **Last Sync:** Timestamp of last successful sync
- **Pending Events:** Number of queued events

**Manual Sync:**
Click **"Sync Now"** to immediately poll for new events.

---

## Configuration

### Webhook Configuration Options

```javascript
{
  // Webhook endpoint (your Cloudflare Worker)
  webhookUrl: 'https://tictacstick-webhooks.your-account.workers.dev',

  // Webhook secret for signature verification
  webhookSecret: 'your-secret-here',

  // Events to subscribe to
  subscribedEvents: [
    'ContactUpdate',
    'OpportunityUpdate',
    'OpportunityStatusUpdate',
    'TaskUpdate',
    'TaskComplete',
    'NoteCreate',
    'InboundMessage'
  ],

  // Processing configuration
  processing: {
    batchSize: 10,        // Events per batch
    batchDelay: 5000,     // Delay between batches (ms)
    retryAttempts: 3,     // Retry failed events
    retryDelay: 60000,    // Delay before retry (ms)
    maxQueueSize: 1000    // Maximum queued events
  },

  // Feature flags
  features: {
    enabled: true,                    // Enable/disable webhooks
    autoSync: true,                   // Auto-poll for events
    bidirectionalSync: true,          // Sync both ways
    conflictResolution: 'timestamp',  // How to resolve conflicts
    deduplicate: true                 // Ignore duplicate events
  }
}
```

### Conflict Resolution Strategies

#### 1. Timestamp (Recommended)
Most recent change wins, based on timestamps.

**Use when:** Multiple team members may edit the same data.

**Example:**
```
Local:  Updated 10:30 AM
Remote: Updated 10:32 AM
Result: Remote wins (more recent)
```

#### 2. GHL Wins
GoHighLevel data always takes precedence.

**Use when:** GHL is the source of truth.

**Example:**
```
Local:  "John Smith"
Remote: "John M. Smith"
Result: "John M. Smith" (remote)
```

#### 3. Local Wins
TicTacStick data takes precedence.

**Use when:** Field changes should never be overwritten.

**Example:**
```
Local:  "$500"
Remote: "$450"
Result: "$500" (local)
```

#### 4. Manual
User chooses which version to keep (not implemented yet).

**Use when:** Data conflicts need human review.

---

## Event Types

### Supported Events

#### Contact Events
- **ContactCreate** - New contact created
- **ContactUpdate** - Contact details changed

**Triggers:**
- Update local client database
- Create new client if not exists
- Resolve conflicts

#### Opportunity Events
- **OpportunityCreate** - New opportunity created
- **OpportunityUpdate** - Opportunity details changed
- **OpportunityStatusUpdate** - Status changed (won/lost)
- **OpportunityStageUpdate** - Pipeline stage changed

**Triggers:**
- Update quote status
- Mark quote as accepted/declined
- Trigger follow-up automation

#### Task Events
- **TaskCreate** - New task created
- **TaskUpdate** - Task details changed
- **TaskComplete** - Task marked complete

**Triggers:**
- Update task status
- Mark task complete
- Remove from pending tasks

#### Note Events
- **NoteCreate** - New note added
- **NoteUpdate** - Note edited
- **NoteDelete** - Note deleted

**Triggers:**
- Add note to quote
- Show notification
- Update quote history

#### Message Events
- **InboundMessage** - SMS/Email received from client
- **OutboundMessage** - SMS/Email sent to client

**Triggers:**
- Show notification
- Create follow-up task (if quote pending)
- Update communication history

#### Appointment Events
- **AppointmentCreate** - New appointment scheduled
- **AppointmentUpdate** - Appointment details changed
- **AppointmentDelete** - Appointment cancelled

**Triggers:**
- Update job schedule
- Show notification
- Create reminder task

### Event Processing

Each event is:
1. **Received** by Cloudflare Worker
2. **Validated** (signature check)
3. **Transformed** to TicTacStick format
4. **Stored** for client polling
5. **Polled** by TicTacStick every 30s
6. **Queued** in local event queue
7. **Processed** in batches
8. **Applied** to local data

**Error Handling:**
- Failed events are retried up to 3 times
- After max retries, logged as permanently failed
- Event queue persists across app restarts

---

## Testing

### Manual Testing

#### Test Webhook Endpoint
```javascript
// In browser console:
WebhookDebug.testEndpoint();
```

#### Simulate Events
```javascript
// Simulate contact update
WebhookDebug.simulateEvent('contact-updated');

// Simulate opportunity won
WebhookDebug.simulateEvent('opportunity-updated', {
  id: 'opp_123',
  status: 'won'
});

// Simulate task completion
WebhookDebug.simulateEvent('task-updated', {
  id: 'task_123',
  completed: true
});
```

#### View Queue Status
```javascript
WebhookDebug.viewQueue();
// Returns:
// {
//   queueLength: 5,
//   processing: false,
//   lastEventId: 'evt_123',
//   polling: true,
//   enabled: true
// }
```

#### Run Integration Test
```javascript
// Runs full test suite
WebhookDebug.runIntegrationTest();
```

### Automated Testing

Create Playwright test:

```javascript
// tests/webhook-integration.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Webhook Integration', () => {
  test('should process contact update event', async ({ page }) => {
    await page.goto('http://localhost:8080');

    // Simulate contact update
    await page.evaluate(() => {
      window.WebhookDebug.simulateEvent('contact-updated', {
        id: 'test_contact',
        name: 'Test Client',
        email: 'test@example.com'
      });
    });

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify event was processed
    var queueLength = await page.evaluate(() => {
      return window.WebhookProcessor.getSyncStatus().queueLength;
    });

    expect(queueLength).toBe(0); // Event processed
  });
});
```

---

## Troubleshooting

### Webhooks Not Received

**Symptoms:**
- No events in queue
- Sync status shows 0 pending events
- Manual sync returns empty

**Solutions:**
1. **Check worker is deployed**
   ```bash
   curl https://your-worker.workers.dev/health
   # Should return: {"status":"ok"}
   ```

2. **Verify webhook registered with GHL**
   ```javascript
   GHLWebhookSetup.listWebhooks(function(err, webhooks) {
     console.log(webhooks);
   });
   ```

3. **Check GHL sends events**
   - Log into GHL
   - Go to Settings → Integrations → Webhooks
   - Check delivery logs

4. **Test worker directly**
   ```bash
   curl -X POST https://your-worker.workers.dev/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"test","id":"123","data":{}}'
   ```

### Events Not Processing

**Symptoms:**
- Events in queue but not processing
- Queue length keeps growing
- Processing stuck

**Solutions:**
1. **Check browser console for errors**
2. **Clear event queue**
   ```javascript
   WebhookDebug.clearQueue();
   ```

3. **Restart polling**
   ```javascript
   WebhookProcessor.stopPolling();
   WebhookProcessor.startPolling();
   ```

4. **Manually process queue**
   ```javascript
   WebhookProcessor.processEventQueue();
   ```

### CORS Errors

**Symptoms:**
```
Access to fetch at 'https://worker.workers.dev/events' from origin 'https://your-app.com' has been blocked by CORS policy
```

**Solutions:**
1. **Check ALLOWED_ORIGINS in worker**
   - Must include your domain
   - No trailing slash
   - Use HTTPS in production

2. **Verify CSP in index.html**
   ```html
   connect-src 'self' https://*.workers.dev;
   ```

3. **Test CORS directly**
   ```bash
   curl -H "Origin: https://your-app.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://your-worker.workers.dev/events
   ```

### Signature Verification Failures

**Symptoms:**
- Worker returns 401 Unauthorized
- Logs show "Invalid webhook signature"

**Solutions:**
1. **Implement signature verification in worker.js**
   - See TODO in `verifySignature()` function
   - Use HMAC-SHA256
   - Compare with X-GHL-Signature header

2. **Verify webhook secret matches**
   - Same secret in TicTacStick
   - Same secret in Cloudflare Worker
   - Same secret in GHL webhook configuration

### High Queue Length

**Symptoms:**
- Pending events > 100
- Sync feels slow
- Events not clearing

**Solutions:**
1. **Increase batch size**
   ```javascript
   var config = WebhookProcessor.getConfig();
   config.processing.batchSize = 20;
   WebhookProcessor.updateConfig(config);
   ```

2. **Decrease batch delay**
   ```javascript
   config.processing.batchDelay = 2000; // 2 seconds
   ```

3. **Clear old events**
   ```javascript
   WebhookSettings.clearEventQueue();
   ```

---

## Security

### Best Practices

1. **Use HTTPS Only**
   - Never use HTTP for webhook URLs
   - Cloudflare Workers enforce HTTPS

2. **Implement Signature Verification**
   - Verify all webhooks using HMAC-SHA256
   - Reject invalid signatures
   - See `worker.js` TODO

3. **Rotate Secrets Regularly**
   - Change webhook secret every 90 days
   - Update in all 3 locations:
     - TicTacStick settings
     - Cloudflare Worker env vars
     - GHL webhook configuration

4. **Limit CORS Origins**
   - Only allow your actual domains
   - Don't use wildcards (`*`)
   - Review regularly

5. **Monitor for Anomalies**
   - Watch for high event volumes
   - Check for repeated failures
   - Review worker logs

### Signature Verification Implementation

**In Cloudflare Worker:**

```javascript
async function verifySignature(payload, signature) {
  var encoder = new TextEncoder();
  var data = encoder.encode(JSON.stringify(payload));

  var key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CONFIG.WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  var computedSignature = await crypto.subtle.sign('HMAC', key, data);

  var computedHex = Array.from(new Uint8Array(computedSignature))
    .map(function(b) { return b.toString(16).padStart(2, '0'); })
    .join('');

  return computedHex === signature;
}
```

---

## Advanced Usage

### Custom Event Handlers

Add custom logic for specific events:

```javascript
// In webhook-processor.js, add custom handler:
function handleContactUpdated(event, callback) {
  var contact = event.contact;

  // Custom logic here
  if (contact.email && contact.email.includes('@enterprise.com')) {
    // Enterprise client - create high-priority task
    TaskManager.createTask({
      priority: 'high',
      title: 'Follow up with enterprise client',
      contactId: contact.id
    });
  }

  // Continue with default handling
  // ...
}
```

### Event Filtering

Filter events before processing:

```javascript
// In webhook-processor.js
function processEvent(event, callback) {
  // Skip events older than 24 hours
  var eventTime = new Date(event.timestamp).getTime();
  var now = Date.now();
  if (now - eventTime > 86400000) {
    console.log('Skipping old event:', event.id);
    if (callback) callback(null);
    return;
  }

  // Continue processing...
}
```

### Performance Optimization

For high-volume scenarios:

```javascript
// Increase batch size and reduce delay
var config = WebhookProcessor.getConfig();
config.processing.batchSize = 50;
config.processing.batchDelay = 1000;
WebhookProcessor.updateConfig(config);
```

---

## API Reference

### WebhookProcessor

```javascript
// Initialize
WebhookProcessor.init();

// Start/stop polling
WebhookProcessor.startPolling();
WebhookProcessor.stopPolling();

// Manual sync
WebhookProcessor.syncNow();

// Get status
var status = WebhookProcessor.getSyncStatus();

// Update config
WebhookProcessor.updateConfig({
  webhookUrl: 'https://new-url.com',
  features: { enabled: true }
});

// Queue event manually
WebhookProcessor.queueEvent(eventObject);

// Process queue
WebhookProcessor.processEventQueue();
```

### GHLWebhookSetup

```javascript
// Register webhook
GHLWebhookSetup.registerWebhook(function(err, webhook) {
  if (err) console.error(err);
  else console.log('Registered:', webhook.id);
});

// Update webhook
GHLWebhookSetup.updateWebhook(callback);

// Delete webhook
GHLWebhookSetup.deleteWebhook(callback);

// Test webhook
GHLWebhookSetup.testWebhook(callback);

// List webhooks
GHLWebhookSetup.listWebhooks(callback);

// Verify webhook
GHLWebhookSetup.verifyWebhook(callback);
```

### WebhookDebug

```javascript
// Simulate events
WebhookDebug.simulateEvent('contact-updated');
WebhookDebug.simulateEvent('opportunity-updated', customData);

// View queue
WebhookDebug.viewQueue();

// Clear queue
WebhookDebug.clearQueue();

// Test endpoint
WebhookDebug.testEndpoint();

// Run integration test
WebhookDebug.runIntegrationTest();

// Export logs
WebhookDebug.exportLogs();

// Help
WebhookDebug.help();
```

---

## FAQ

### Q: Do webhooks work offline?

**A:** Events are queued and processed when you come back online. The event queue persists in LocalStorage.

### Q: How often does TicTacStick poll for events?

**A:** Every 30 seconds when webhooks are enabled and you're online.

### Q: What happens if I hit the Cloudflare Workers free tier limit?

**A:** The free tier includes 100,000 requests/day, which is plenty for webhook usage. If you exceed, consider upgrading to paid tier ($5/month).

### Q: Can I use a different backend instead of Cloudflare Workers?

**A:** Yes! The worker is just a simple HTTP endpoint. You can implement the same API using:
- AWS Lambda
- Firebase Cloud Functions
- Node.js server
- Any HTTP server

Just ensure it implements the same endpoints (`/webhook`, `/events`, `/health`).

### Q: How do I disable webhooks temporarily?

**A:** Uncheck "Enable real-time sync" in webhook settings and save. Polling will stop but configuration is preserved.

### Q: Are there any costs?

**A:** Cloudflare Workers free tier should be sufficient. GoHighLevel API calls are included in your GHL subscription.

---

## Support

### Resources

- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **GoHighLevel API Docs:** https://highlevel.stoplight.io/
- **TicTacStick Docs:** See CLAUDE.md

### Debugging

Enable debug logging:
```javascript
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();
```

Export debug logs:
```javascript
WebhookDebug.exportLogs();
```

### Community

For issues or questions:
1. Check this guide
2. Review browser console for errors
3. Check Cloudflare Worker logs
4. Export debug logs for analysis

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
**Maintained by:** 925 Pressure Glass
