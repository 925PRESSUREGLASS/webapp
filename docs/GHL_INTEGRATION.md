# GoHighLevel CRM Integration

**Version:** 2.0.0
**Date:** 2025-11-18
**Status:** Production Ready

## Overview

The GoHighLevel (GHL) CRM integration connects TicTacStick Quote Engine with GoHighLevel's all-in-one CRM platform, enabling seamless lead-to-cash workflow automation.

### Key Features

✅ **Bidirectional Contact Sync** - Sync clients between TicTacStick and GHL contacts
✅ **Quote to Opportunity** - Automatically create opportunities from quotes
✅ **Pipeline Management** - Track quotes through sales pipeline stages
✅ **Offline Support** - Queue sync requests when offline, process when back online
✅ **OAuth 2.0 Authentication** - Secure, standards-based authentication
✅ **Rate Limiting** - Respects GHL API limits (120 requests/minute)
✅ **Automatic Retry** - Failed requests automatically retry up to 3 times
✅ **Custom Field Mapping** - Map TicTacStick data to GHL custom fields
✅ **Tag Management** - Automatically tag contacts by service type and client type
✅ **Notes & Tasks** - Add notes and follow-up tasks to contacts

---

## Quick Start

### 1. Prerequisites

- Active GoHighLevel account (Agency or Location)
- TicTacStick Quote Engine v2.0.0+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 2. Setup (5 minutes)

1. **Create GHL App:**
   - Log in to GoHighLevel
   - Settings → Integrations → Custom Apps
   - Create App
   - Set Redirect URI: `https://your-domain.com/ghl-oauth-callback.html`
   - Save Client ID and Client Secret

2. **Configure TicTacStick:**
   - Click "GoHighLevel" button in header
   - Connection tab → Enter credentials
   - Click "Save Configuration"
   - Click "Authenticate with GHL"
   - Authorize in popup

3. **Initial Sync:**
   - Sync tab → Click "Sync Clients"
   - Wait for completion
   - Click "Sync Quotes"

✅ **Done!** Your data is now syncing with GoHighLevel.

---

## Architecture

### Components

```
TicTacStick                          GoHighLevel
┌─────────────────┐                 ┌─────────────────┐
│                 │                 │                 │
│  Client DB      │◄──────sync─────►│  Contacts       │
│                 │                 │                 │
│  Saved Quotes   │◄──────sync─────►│  Opportunities  │
│                 │                 │                 │
│  Quote Notes    │◄──────sync─────►│  Notes          │
│                 │                 │                 │
│  Follow-ups     │◄──────sync─────►│  Tasks          │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │         Offline Queue             │
         │      ┌─────────────────┐          │
         └─────►│  localStorage   │◄─────────┘
                │  (when offline) │
                └─────────────────┘
```

### Modules

| Module | Purpose | Size | ES5 |
|--------|---------|------|-----|
| `ghl-config.js` | Configuration management | 800 lines | ✅ |
| `ghl-client.js` | API client with offline support | 1,200 lines | ✅ |
| `ghl-contact-sync.js` | Client/contact synchronization | 900 lines | ✅ |
| `ghl-opportunity-sync.js` | Quote/opportunity sync | 1,100 lines | ✅ |
| `ghl-ui.js` | Settings UI and controls | 1,400 lines | ✅ |
| `ghl-oauth-callback.html` | OAuth callback handler | 150 lines | ✅ |
| `css/ghl.css` | Integration UI styles | 500 lines | N/A |

**Total:** ~6,050 lines of production-ready code

---

## Data Flow

### Client Creation

```
User creates client in TicTacStick
    ↓
ClientDatabase.addClient(client)
    ↓
GHLContactSync.syncClient(client) [if autoSync enabled]
    ↓
Check if client has ghlId
    ├─ Yes → Update existing contact
    └─ No → Search by email/phone
        ├─ Found → Update and link
        └─ Not found → Create new contact
    ↓
Store ghlId with client
    ↓
Client synced! ✓
```

### Quote Creation

```
User creates quote in TicTacStick
    ↓
Save quote (SaveQuoteBtn or auto-save)
    ↓
GHLOpportunitySync.syncQuote(quote, client) [if syncOnQuoteCreate enabled]
    ↓
Ensure client exists in GHL
    ├─ No ghlId → Sync client first
    └─ Has ghlId → Continue
    ↓
Map quote to opportunity
    ├─ Name: Quote title
    ├─ Value: Total inc GST
    ├─ Stage: Based on quote status
    ├─ Contact: Link to client
    └─ Custom fields: Quote number, services, etc.
    ↓
Create or update opportunity in GHL
    ↓
Add quote details as note
    ↓
Store ghlOpportunityId with quote
    ↓
Quote synced! ✓
```

### Status Update

```
User updates quote status
    ↓
quote.status = 'accepted'
    ↓
GHLOpportunitySync.updateOpportunity(quote, client) [if syncOnQuoteUpdate enabled]
    ↓
Map status to pipeline stage
    ├─ accepted → Won
    ├─ declined → Lost
    └─ follow-up → Follow Up
    ↓
Update opportunity in GHL
    ├─ Status
    ├─ Pipeline stage
    └─ Monetary value
    ↓
Opportunity updated! ✓
```

---

## Configuration

### Basic Configuration

```javascript
GHL_CONFIG = {
  // API Credentials
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  locationId: 'your-location-id',

  // Authentication
  accessToken: null,  // Set after OAuth
  refreshToken: null,  // Set after OAuth
  tokenExpiry: null,  // Auto-calculated

  // Pipeline
  pipeline: {
    id: 'your-pipeline-id',
    stages: {
      quote: 'stage-id-for-quote',
      followUp: 'stage-id-for-follow-up',
      won: 'stage-id-for-won',
      lost: 'stage-id-for-lost'
    }
  }
};
```

### Feature Flags

```javascript
GHL_CONFIG.features = {
  contactSync: true,       // Sync clients to contacts
  opportunitySync: true,   // Sync quotes to opportunities
  taskSync: true,          // Sync follow-ups to tasks
  noteSync: true,          // Sync notes
  smsSync: false,          // SMS integration (premium)
  emailSync: false,        // Email integration (premium)
  calendarSync: false,     // Calendar integration (premium)
  paymentSync: false       // Payment integration (premium)
};
```

### Sync Settings

```javascript
GHL_CONFIG.syncSettings = {
  autoSync: true,                // Enable automatic sync
  syncInterval: 300000,          // 5 minutes (milliseconds)
  offlineQueue: true,            // Queue requests when offline
  conflictResolution: 'ghl-wins', // How to resolve conflicts
  syncOnQuoteCreate: true,       // Sync when quote created
  syncOnQuoteUpdate: true,       // Sync when quote updated
  syncOnClientUpdate: true       // Sync when client updated
};
```

### Custom Field Mapping

```javascript
GHL_CONFIG.customFields = {
  quoteNumber: 'quote_number',
  serviceTypes: 'service_types',
  primaryService: 'primary_service',
  quoteDate: 'quote_date',
  quoteTotal: 'quote_total',
  clientType: 'client_type',
  clientSource: 'client_source',
  lastJobDate: 'last_job_date',
  totalRevenue: 'total_revenue'
};
```

Create matching custom fields in GHL:
1. Settings → Custom Fields
2. Add field with same ID
3. Set type: Text (except `quoteTotal` = Number)

---

## API Reference

### GHLConfig

```javascript
// Save configuration
GHLConfig.save()

// Load configuration
GHLConfig.load()

// Clear configuration
GHLConfig.clear()

// Check if configured
GHLConfig.isConfigured()  // Returns: boolean

// Check if authenticated
GHLConfig.isAuthenticated()  // Returns: boolean

// Get config value
GHLConfig.getConfig('pipeline.id')  // Returns: string

// Set config value
GHLConfig.setConfig('features.contactSync', true)

// Update last sync timestamp
GHLConfig.updateLastSync('contacts')
```

### GHLClient

```javascript
// Make API request
GHLClient.makeRequest(method, endpoint, data, callback)
// Example:
GHLClient.makeRequest('GET', '/contacts/', null, function(error, response) {
  if (!error) console.log(response.contacts);
});

// Refresh access token
GHLClient.refreshAccessToken(callback)

// Process offline queue
GHLClient.processQueue(callback)

// Clear queue
GHLClient.clearQueue()

// Get queue length
GHLClient.getQueueLength()  // Returns: number

// Check configuration
GHLClient.isConfigured()  // Returns: boolean

// Check token validity
GHLClient.isTokenValid()  // Returns: boolean
```

### GHLContactSync

```javascript
// Sync single client
GHLContactSync.syncClient(client, callback)

// Sync all clients
GHLContactSync.syncAllClients(callback)

// Create contact
GHLContactSync.createContact(client, callback)

// Update contact
GHLContactSync.updateContact(client, callback)

// Get contact
GHLContactSync.getContact(ghlId, callback)

// Search contacts
GHLContactSync.searchContacts(query, callback)

// Delete contact
GHLContactSync.deleteContact(client, callback)

// Add note
GHLContactSync.addNote(client, noteText, callback)
```

### GHLOpportunitySync

```javascript
// Sync single quote
GHLOpportunitySync.syncQuote(quote, client, callback)

// Sync all quotes
GHLOpportunitySync.syncAllQuotes(callback)

// Create opportunity
GHLOpportunitySync.createOpportunity(quote, client, callback)

// Update opportunity
GHLOpportunitySync.updateOpportunity(quote, client, callback)

// Update status
GHLOpportunitySync.updateOpportunityStatus(quote, status, callback)

// Delete opportunity
GHLOpportunitySync.deleteOpportunity(quote, callback)

// Add follow-up task
GHLOpportunitySync.addFollowUpTask(quote, client, taskDetails, callback)
```

### GHLUI

```javascript
// Open settings modal
GHLUI.openSettings()

// Close settings modal
GHLUI.closeSettings()
```

---

## Testing

### Run Integration Tests

```bash
# Run all GHL tests
npm test -- tests/ghl-integration.spec.js

# Run with UI
npm run test:ui -- tests/ghl-integration.spec.js

# Run with browser visible
npm run test:headed -- tests/ghl-integration.spec.js
```

### Manual Testing

1. **Configuration:**
   - Open GHL settings
   - Enter valid credentials
   - Save and verify no errors

2. **Authentication:**
   - Click "Authenticate with GHL"
   - Complete OAuth flow
   - Verify token received

3. **Connection Test:**
   - Click "Test Connection"
   - Should show "Connection successful!"

4. **Client Sync:**
   - Create test client
   - Click "Sync Clients"
   - Verify client appears in GHL

5. **Quote Sync:**
   - Create test quote
   - Click "Sync Quotes"
   - Verify opportunity in GHL

6. **Offline Mode:**
   - Go offline (disable network)
   - Create client/quote
   - Go online
   - Click "Process Queue"
   - Verify data synced

---

## Troubleshooting

### Common Issues

#### ❌ "GHL not configured"

**Solution:**
```javascript
// Check configuration
console.log(GHLConfig.isConfigured());

// If false, configure:
GHL_CONFIG.clientId = 'your-client-id';
GHL_CONFIG.clientSecret = 'your-client-secret';
GHL_CONFIG.locationId = 'your-location-id';
GHLConfig.save();
```

#### ❌ "Authentication failed"

**Solutions:**
1. Verify Client ID and Client Secret
2. Check Redirect URI matches exactly
3. Ensure Location ID is correct
4. Try re-authenticating

```javascript
// Refresh token manually
GHLClient.refreshAccessToken(function(error) {
  if (error) console.error(error);
  else console.log('Token refreshed!');
});
```

#### ❌ "Rate limit exceeded"

GHL API limit: 120 requests/minute

**Solutions:**
1. Wait 1 minute
2. Reduce sync frequency
3. Batch operations

```javascript
// Check current rate limit
console.log(GHL_CONFIG.rateLimit);

// Increase sync interval
GHL_CONFIG.syncSettings.syncInterval = 600000; // 10 minutes
GHLConfig.save();
```

#### ❌ "Queue not processing"

**Solutions:**
```javascript
// Check queue
var queueLength = GHLClient.getQueueLength();
console.log(queueLength, 'requests pending');

// Process manually
GHLClient.processQueue(function(error, result) {
  console.log('Processed:', result.processed);
  console.log('Failed:', result.failed);
});

// Clear if stuck
GHLClient.clearQueue();
```

#### ❌ "Contact not found"

**Solutions:**
1. Ensure client has ghlId
2. Search for contact in GHL
3. Re-sync client

```javascript
// Check if client has GHL ID
console.log(client.ghlId);

// Search for contact
GHLContactSync.searchContacts(client.email, function(error, contacts) {
  console.log('Found:', contacts.length, 'contacts');
});

// Re-sync
GHLContactSync.syncClient(client, function(error) {
  if (!error) console.log('Client synced!');
});
```

### Debug Mode

Enable verbose logging:

```javascript
DEBUG_CONFIG.enabled = true;
localStorage.setItem('debug-enabled', 'true');
location.reload();

// View logs in console
// [GHL-CONFIG] ...
// [GHL-CLIENT] ...
// [GHL-CONTACT-SYNC] ...
// [GHL-OPP-SYNC] ...
```

### Reset Integration

Complete reset (clears all GHL data):

```javascript
// WARNING: This will disconnect GHL and clear queue!
GHLConfig.clear();
GHLClient.clearQueue();
localStorage.removeItem('tts_ghl_config');
localStorage.removeItem('tts_ghl_queue');
location.reload();
```

---

## Security

### Best Practices

✅ **DO:**
- Use OAuth 2.0 for authentication
- Store credentials securely in localStorage
- Refresh tokens automatically
- Use HTTPS for all API calls
- Validate all user input
- Sanitize data before display
- Rate limit API requests

❌ **DON'T:**
- Share API credentials
- Store credentials in code
- Hardcode access tokens
- Disable token refresh
- Skip input validation
- Expose sensitive data in logs
- Exceed rate limits

### Content Security Policy

CSP allows GHL API domains:

```html
<meta http-equiv="Content-Security-Policy" content="
  connect-src 'self'
    https://rest.gohighlevel.com
    https://services.leadconnectorhq.com
    https://marketplace.gohighlevel.com;
">
```

### Token Management

- Access tokens expire after 1 hour
- Refresh tokens used to get new access tokens
- Automatic refresh 5 minutes before expiry
- Manual refresh available if needed

---

## Performance

### Optimization Tips

1. **Batch Operations:**
   - Use `syncAllClients()` instead of individual syncs
   - Use `syncAllQuotes()` for bulk operations

2. **Reduce Frequency:**
   - Set reasonable sync interval (5-10 minutes)
   - Disable auto-sync if manual control preferred

3. **Queue Management:**
   - Process queue during low-activity periods
   - Clear old failed requests periodically

4. **Selective Sync:**
   - Disable features you don't use
   - Sync only changed data

### Metrics

```javascript
// Monitor sync performance
GHL_CONFIG.lastSync.contacts  // Last contact sync timestamp
GHL_CONFIG.lastSync.opportunities  // Last quote sync timestamp

// Monitor queue
GHLClient.getQueueLength()  // Pending requests

// Monitor rate limit
GHL_CONFIG.rateLimit.currentCount  // Current request count
GHL_CONFIG.rateLimit.resetTime  // When counter resets
```

---

## Roadmap

### v2.1.0 (Planned)
- ⏰ **Scheduled Sync** - Run sync at specific times
- 🔔 **Webhook Support** - Receive real-time updates from GHL
- 📊 **Sync Reports** - Detailed sync history and analytics
- 🔄 **Bidirectional Sync** - Updates from GHL back to TicTacStick

### v2.2.0 (Planned)
- 💬 **SMS Integration** - Send quotes via SMS through GHL
- 📧 **Email Templates** - Custom email templates for quotes
- 📅 **Calendar Integration** - Sync job scheduling with GHL calendar
- 💰 **Payment Integration** - Process payments through GHL

### v2.3.0 (Future)
- 🤖 **Automation Workflows** - Trigger GHL workflows from TicTacStick
- 📞 **Call Tracking** - Log calls in GHL
- 🎯 **Campaign Integration** - Track quote sources from GHL campaigns
- 📈 **Advanced Analytics** - Cross-platform reporting

---

## Support

### Documentation

- **Main Documentation:** `CLAUDE.md`
- **API Reference:** `docs/GHL_INTEGRATION.md` (this file)
- **Setup Guide:** See "Quick Start" above
- **Troubleshooting:** See "Troubleshooting" section

### Resources

- **GoHighLevel Docs:** https://help.gohighlevel.com
- **GHL API Docs:** https://highlevel.stoplight.io/docs/integrations
- **OAuth 2.0 Spec:** https://oauth.net/2/

### Getting Help

1. Check this documentation
2. Review browser console for errors
3. Test connection in GHL settings
4. Check queue for failed requests
5. Enable debug mode for verbose logs

---

## Changelog

### v2.0.0 (2025-11-18)

**Initial Release** - Complete GHL CRM integration

**Features:**
- OAuth 2.0 authentication
- Contact synchronization
- Opportunity synchronization
- Offline request queuing
- Rate limiting
- Automatic retry logic
- Custom field mapping
- Tag management
- Notes and tasks
- Comprehensive UI

**Modules Added:**
- `ghl-config.js` (800 lines)
- `ghl-client.js` (1,200 lines)
- `ghl-contact-sync.js` (900 lines)
- `ghl-opportunity-sync.js` (1,100 lines)
- `ghl-ui.js` (1,400 lines)
- `ghl-oauth-callback.html` (150 lines)
- `css/ghl.css` (500 lines)

**Tests Added:**
- `tests/ghl-integration.spec.js` (40+ test cases)

**Documentation:**
- Updated `CLAUDE.md` with GHL integration guide
- Created `docs/GHL_INTEGRATION.md` (this file)

---

## License

MIT License - 925 Pressure Glass

---

**Last Updated:** 2025-11-18
**Version:** 2.0.0
**Maintainer:** TicTacStick Development Team
