# GoHighLevel Quote & Invoice Integration Guide

**Version:** 1.0.0
**Date:** 2025-11-18
**Module:** GHL Opportunity Sync

---

## Overview

This integration allows TicTacStick quotes and invoices to be synced to GoHighLevel as **opportunities** with full line item details in the notes field. The system automatically creates/updates contacts and opportunities, keeping your CRM in sync with your quote engine.

---

## Features

### ✅ Quote Sync
- **Automatic Contact Creation**: Creates GHL contacts from quote client data
- **Opportunity Creation**: Converts quotes to GHL opportunities
- **Line Item Details**: All window/pressure cleaning line items included in notes
- **Status Mapping**: Quote statuses mapped to pipeline stages
- **Bidirectional Tracking**: Stores GHL IDs for future updates

### ✅ Invoice Sync
- **Invoice Opportunities**: Syncs invoices as separate opportunities
- **Payment Tracking**: Payment history included in notes
- **Status Updates**: Invoice status changes update GHL stages
- **Automatic Won Status**: Paid invoices marked as "won"

### ✅ Smart Features
- **Duplicate Prevention**: Searches for existing contacts before creating
- **Auto-sync on Status Change**: Automatically syncs when quote/invoice status updates
- **Retry Logic**: 3 automatic retries with exponential backoff
- **Error Handling**: Graceful failure with user notifications

---

## Setup Instructions

### Step 1: Get GHL API Credentials

1. Log in to your GoHighLevel account
2. Go to **Settings** → **API Keys**
3. Create a new API key or copy an existing one
4. Note your **Location ID** from the URL: `app.gohighlevel.com/location/LOCATION_ID`

### Step 2: Configure TicTacStick

1. Click the **🔄 GHL** button in the top right header
2. Go to the **API Configuration** tab
3. Enter your:
   - **API Key** (from Step 1)
   - **Location ID** (from Step 1)
   - **Base URL** (leave default: `https://rest.gohighlevel.com/v1`)
4. Click **Save Settings**

### Step 3: Set Up Pipelines

#### Option A: Load Pipelines Automatically
1. Go to the **Pipelines** tab
2. Click **Load Pipelines** button
3. Select your Quote pipeline and Invoice pipeline from the dropdown
4. The pipeline IDs will be automatically filled in

#### Option B: Manual Configuration
1. In your GHL account, go to **Opportunities** → **Pipelines**
2. Copy the Pipeline IDs from the URL
3. Go to TicTacStick **Pipelines** tab
4. Paste the Pipeline IDs
5. For each stage (Draft, Sent, Accepted, etc.):
   - Get the Stage ID from GHL
   - Enter it in the corresponding field

### Step 4: Enable Features

1. Go to the **Features** tab
2. Enable:
   - ☑ **Enable Opportunity Sync** (required for quote/invoice sync)
   - ☑ **Enable Contact Sync** (optional, auto-creates contacts)
   - ☑ **Enable Task Sync** (optional, syncs follow-up tasks)
3. Click **Save Settings**

### Step 5: Test Connection

1. Go to the **Test Connection** tab
2. Click **Test Connection** button
3. Verify you see: "Connection successful!"

---

## Usage

### Syncing a Quote

#### Manual Sync
1. Create a quote in TicTacStick
2. Fill in all quote details (client name, line items, etc.)
3. Scroll to the **Quote Summary** section
4. Click **🔄 Sync to GoHighLevel** button
5. Wait for confirmation: "Quote synced to GoHighLevel successfully!"

#### Automatic Sync
- Quotes automatically sync when status changes (e.g., Draft → Sent)
- Enable in **Features** tab

### Syncing an Invoice

```javascript
// From JavaScript console or code:
window.GHLOpportunitySync.syncInvoiceToOpportunity(invoice, function(error, result) {
  if (error) {
    console.error('Sync failed:', error);
  } else {
    console.log('Sync successful:', result);
  }
});
```

### What Gets Synced?

#### Contact Information
- First Name / Last Name (parsed from client name)
- Email (if provided)
- Phone (if provided)
- Address (from client location)
- Tags: `['TicTacStick', 'Quote']`

#### Opportunity Data
- **Name**: `"Quote Title - Client Name"` or `"Invoice INV-1001 - Client Name"`
- **Monetary Value**: Total including GST (in cents)
- **Pipeline Stage**: Based on status
- **Notes**: Detailed breakdown (see below)

#### Notes Format

```
=== QUOTE DETAILS ===
Quote Title: 3BR House Standard Clean
Client: John Smith
Location: Perth WA
Job Type: Residential Windows

=== WINDOW CLEANING ===
standard x10 - $150.00
sliding x4 (High Reach) - $95.00

=== PRESSURE CLEANING ===
concrete - 50 sqm - $180.00

=== PRICING ===
Base Fee: $120.00
Subtotal: $425.00
GST (10%): $42.50
Total (Inc GST): $467.50

=== INTERNAL NOTES ===
Customer requested weekend service

=== CLIENT NOTES ===
Special access via side gate
```

---

## Pipeline Stage Mapping

### Quote Pipeline

| TicTacStick Status | GHL Stage |
|-------------------|-----------|
| Draft | Draft Stage |
| Sent | Sent Stage |
| Accepted | Accepted Stage |
| Declined | Declined Stage |

### Invoice Pipeline

| TicTacStick Status | GHL Stage | GHL Status |
|-------------------|-----------|------------|
| Draft | Draft Stage | open |
| Sent | Sent Stage | open |
| Paid | Paid Stage | **won** |
| Overdue | Overdue Stage | open |
| Cancelled | Cancelled Stage | open |

---

## API Reference

### GHLClient

Core API client for making requests to GoHighLevel.

```javascript
// Test connection
window.GHLClient.testConnection(function(error, result) {
  if (!error) {
    console.log('Connected to:', result.location.name);
  }
});

// Create contact
window.GHLClient.createContact({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  phone: '0400000000'
}, callback);

// Create opportunity
window.GHLClient.createOpportunity({
  name: 'New Quote',
  pipelineId: 'pipeline_123',
  pipelineStageId: 'stage_456',
  contactId: 'contact_789',
  monetaryValue: 50000 // $500.00 in cents
}, callback);
```

### GHLOpportunitySync

Sync quotes and invoices to GHL.

```javascript
// Sync current quote
window.GHLOpportunitySync.syncCurrentQuote(function(error, result) {
  if (!error) {
    console.log('Quote synced! Opportunity ID:', result.opportunity.id);
  }
});

// Sync specific quote
var quote = window.APP.getState();
window.GHLOpportunitySync.syncQuoteToOpportunity(quote, callback);

// Sync invoice
window.GHLOpportunitySync.syncInvoiceToOpportunity(invoice, callback);

// Check if sync is enabled
if (window.GHLOpportunitySync.isOpportunitySyncEnabled()) {
  // Sync is ready
}
```

---

## Troubleshooting

### "GHL not configured" Error

**Solution:**
1. Click 🔄 GHL button
2. Enter API Key and Location ID
3. Save Settings

### "Quote pipeline not configured" Error

**Solution:**
1. Go to Pipelines tab
2. Click "Load Pipelines" or manually enter pipeline IDs
3. Save Settings

### "Failed to create contact" Error

**Possible Causes:**
- Invalid API key
- Missing required fields (name, email, or phone)
- Network connectivity issues

**Solution:**
1. Test connection in Test tab
2. Check that quote has client name
3. Verify API key is correct

### Contact/Opportunity Not Appearing in GHL

**Solution:**
1. Check the quote has `ghlContactId` and `ghlOpportunityId` properties
2. Log in to GHL and verify pipeline is correct
3. Check GHL API rate limits

### "Sync failed: 429 Too Many Requests"

**Solution:**
- GHL API rate limit exceeded
- Wait 1 minute and try again
- Contact GHL support to increase limits

---

## Data Storage

### LocalStorage Keys

- `ghl_config` - API credentials and feature flags
- `ghl_pipeline_config` - Pipeline and stage IDs
- Quotes store: `ghlContactId`, `ghlOpportunityId`, `ghlSyncStatus`, `ghlLastSync`
- Invoices store: `ghlContactId`, `ghlOpportunityId`, `ghlSyncStatus`, `ghlLastSync`

### Quote/Invoice Properties Added

```javascript
{
  // ... existing quote/invoice data
  ghlContactId: 'contact_123456',        // GHL contact ID
  ghlOpportunityId: 'opportunity_789',   // GHL opportunity ID
  ghlSyncStatus: 'synced',               // 'pending', 'synced', 'failed'
  ghlLastSync: '2025-11-18T10:30:00Z'   // ISO timestamp
}
```

---

## Security & Privacy

### API Key Storage
- API keys stored in browser localStorage
- **NOT encrypted** by default
- Only accessible from same domain
- Never transmitted except to GHL API

### Data Transmitted
- Client name, email, phone, address
- Quote/invoice line items and totals
- Internal and client notes
- **NO** payment card details
- **NO** bank account information

### Recommendations
- Use a dedicated GHL API key for TicTacStick
- Limit API key permissions to minimum required
- Regularly rotate API keys
- Clear browser data when uninstalling

---

## Advanced Configuration

### Custom Pipeline Stages

You can map different quote statuses to custom stages:

1. Create custom stages in GHL
2. Copy Stage IDs
3. Enter in TicTacStick Pipelines tab
4. Save

### Auto-sync on Events

Listen for quote/invoice events:

```javascript
// In your code
if (window.APP && window.APP.on) {
  window.APP.on('quote-status-changed', function(quote) {
    console.log('Quote status changed to:', quote.status);
    // Auto-sync handled by GHLOpportunitySync module
  });
}
```

### Retry Configuration

Modify retry behavior in `ghl-client.js`:

```javascript
var GHL_CONFIG = {
  retryAttempts: 3,      // Number of retries
  retryDelay: 1000,      // Initial delay (ms)
  timeout: 30000         // Request timeout (ms)
};
```

---

## Module Architecture

### Files

1. **ghl-client.js** (474 lines)
   - Core API client
   - HTTP request handling
   - Authentication
   - Retry logic

2. **ghl-opportunity-sync.js** (783 lines)
   - Quote/invoice sync logic
   - Contact creation
   - Opportunity mapping
   - Line item formatting

3. **ghl-settings-ui.js** (540 lines)
   - Settings modal UI
   - Configuration forms
   - Test connection
   - Sync buttons

4. **css/ghl-settings.css** (150 lines)
   - Modal styling
   - Tab navigation
   - Responsive design

### Dependencies

- `ghl-client.js` → No dependencies
- `ghl-opportunity-sync.js` → Requires `ghl-client.js`
- `ghl-settings-ui.js` → Requires `ghl-client.js`, `ghl-opportunity-sync.js`, `ui-components.js`

---

## Frequently Asked Questions

### Q: Can I sync existing quotes?

**A:** Yes! Open any saved quote and click "🔄 Sync to GoHighLevel" button.

### Q: What happens if I update a quote after syncing?

**A:** Click the sync button again to update the GHL opportunity. The system will update the existing opportunity rather than creating a duplicate.

### Q: Can I sync to multiple GHL locations?

**A:** Not currently. The system supports one location at a time. You would need to reconfigure for different locations.

### Q: Does this work offline?

**A:** No. Syncing requires internet connectivity to reach the GHL API.

### Q: What if the client email/phone changes?

**A:** Update the quote and re-sync. The system will update the existing contact in GHL.

### Q: Can I disable auto-sync?

**A:** Yes. Go to Features tab and uncheck "Enable Opportunity Sync".

### Q: How do I bulk sync all quotes?

**A:** Currently not supported. You must sync quotes individually. Bulk sync feature planned for future release.

---

## Support & Feedback

For issues, questions, or feature requests:
- Check this guide first
- Test connection in GHL settings
- Check browser console for errors
- Contact 925 Pressure Glass support

---

## Changelog

### Version 1.0.0 (2025-11-18)
- Initial release
- Quote to opportunity sync
- Invoice to opportunity sync
- Contact creation/update
- Pipeline stage mapping
- Auto-sync on status change
- Settings UI with tabs
- Test connection feature
- Comprehensive error handling

---

## Future Enhancements

### Planned Features
- [ ] Bulk sync for all quotes
- [ ] Two-way sync (GHL → TicTacStick)
- [ ] Custom field mapping
- [ ] Photo attachments in opportunities
- [ ] Calendar event creation
- [ ] SMS/Email campaign triggers
- [ ] Advanced conflict resolution
- [ ] Sync history and logs
- [ ] Multi-location support
- [ ] Webhook integration for real-time updates

---

**End of Guide**
