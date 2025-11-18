# ❓ Frequently Asked Questions (FAQ)

**TicTacStick Quote Engine - Common Questions & Answers**

---

## Table of Contents

1. [General Questions](#general-questions)
2. [Quote Questions](#quote-questions)
3. [Payment Questions](#payment-questions)
4. [Task & Follow-up Questions](#task--follow-up-questions)
5. [Technical Questions](#technical-questions)
6. [Integration Questions](#integration-questions)
7. [Troubleshooting](#troubleshooting)

---

## General Questions

### Q: Does TicTacStick work offline?

**A:** Yes! TicTacStick is a Progressive Web App (PWA) that works completely offline. You can:
- Create quotes without internet
- Manage clients
- Track tasks
- View analytics

Everything syncs automatically when you're back online. No data is lost!

---

### Q: Can I use TicTacStick on multiple devices?

**A:** Currently, data is stored locally on each device. Cloud sync is coming in v2.0.

**Workaround:** Use the backup/restore feature to transfer data between devices:
1. Device 1: Settings → Backup → Download
2. Transfer file to Device 2
3. Device 2: Settings → Restore → Upload file

---

### Q: How much does TicTacStick cost?

**A:** TicTacStick is custom software developed for 925 Pressure Glass. For enterprise licensing options or custom development, contact: info@925pressureglass.com.au

---

### Q: Is my data secure?

**A:** Yes! Your data is:
- ✅ Stored locally on your device using encrypted browser storage
- ✅ Never sent to external servers (except integrations you enable)
- ✅ Protected by your device passcode/Face ID
- ✅ Backed up when you download backups

**Security Tip:** Enable device passcode or Face ID for additional protection.

---

### Q: Can I customize quote templates?

**A:** Absolutely! Go to:
1. Settings → Quote Templates
2. Customize:
   - Colors and branding
   - Company logo
   - Terms & conditions
   - Quote layout
   - Footer text

Changes apply to all future quotes.

---

## Quote Questions

### Q: How accurate is the automatic pricing?

**A:** Very accurate! Pricing is based on:
- ✅ Industry-standard rates
- ✅ Time-based calculations (proven formulas)
- ✅ Difficulty adjustments
- ✅ Condition factors
- ✅ Equipment requirements

You can always manually adjust if needed.

---

### Q: Can I create quotes for custom services?

**A:** Yes! Two options:

**Option 1 - Skip Wizard:**
1. Tap "+ New Quote"
2. Tap "Skip Wizard"
3. Manually enter service details
4. Add line items
5. Set your pricing

**Option 2 - Add Custom Line Items:**
1. Create quote normally
2. Tap "+ Add Line Item"
3. Enter description, quantity, price
4. Repeat as needed

---

### Q: What if I quote incorrectly and need to change it?

**A:** No problem!

**Before client accepts:**
- Edit the quote anytime
- Changes are saved immediately
- Re-send updated quote

**After client accepts:**
- Create a "Revised Quote"
- Reference original quote number
- Note it replaces previous quote
- Get client approval again

---

### Q: Can I save incomplete quotes?

**A:** Yes! Quotes auto-save as drafts:
- Tap "Save as Draft"
- Come back later to finish
- Find in Quotes tab (filter: Draft)

---

### Q: How do I handle discounts?

**A:** Three methods:

**Method 1 - Percentage Discount:**
Add negative line item:
```
Description: "10% Discount"
Amount: -$85.00
```

**Method 2 - Fixed Amount:**
```
Description: "Promotional Discount"
Amount: -$50.00
```

**Method 3 - Adjust Base Price:**
Manually reduce the quote total before saving.

---

### Q: How long are quotes valid for?

**A:** Default: 30 days from creation date.

**Customize:**
1. Settings → Quote Settings
2. Change "Validity Period"
3. Options: 7, 14, 30, 60, 90 days

This appears on quote PDFs.

---

## Payment Questions

### Q: How do clients pay?

**A:** Multiple payment options:

1. **Cash**
   - Record manually: Invoice → Record Payment → Cash

2. **Bank Transfer**
   - Bank details shown on invoice
   - Record manually when received

3. **Credit Card (via Stripe)**
   - If Stripe configured: Invoice includes payment link
   - Client clicks, enters card details
   - Payment processes automatically

4. **Online Payment**
   - If payment gateway configured
   - Client pays via secure link

---

### Q: Do I need to record cash payments?

**A:** YES! Always record all payments for:
- ✅ Accurate financial tracking
- ✅ Tax compliance
- ✅ Business analytics
- ✅ Client payment history

**How:**
1. Open invoice
2. Tap "Record Payment"
3. Select "Cash"
4. Enter amount and date
5. Tap "Save"

---

### Q: Can I accept deposits?

**A:** Yes!

**Method 1 - Deposit Invoice:**
1. Open accepted quote
2. Tap "Create Invoice"
3. Select "Deposit Invoice"
4. Set deposit percentage (e.g., 20%)
5. Create invoice

**Method 2 - Progress Invoicing:**
For large jobs:
1. Invoice 1: 20% deposit
2. Invoice 2: 50% on start
3. Invoice 3: 30% on completion

---

### Q: What about refunds?

**A:** Record refunds through invoice screen:

1. Open invoice
2. Tap "Record Refund"
3. Enter:
   - Refund amount
   - Reason
   - Method
   - Date
4. Tap "Save"

Invoice status updates to:
- "Partially Refunded" (partial refund)
- "Refunded" (full refund)

---

### Q: Can I send payment reminders?

**A:** Yes! Manual reminders:
1. Open unpaid invoice
2. Tap "Send Reminder"
3. Choose method (Email/SMS)
4. Customize message
5. Send

**Auto-reminders (if configured):**
- 7 days before due date
- On due date
- 7 days after due date
- 14 days overdue

---

## Task & Follow-up Questions

### Q: Can I turn off automatic tasks?

**A:** Yes!

**Disable completely:**
1. Settings → Automation
2. Toggle off "Auto-create follow-up tasks"
3. Save

**Customize schedule:**
1. Settings → Automation → Follow-up Schedule
2. Adjust timing (e.g., 24h → 48h)
3. Change message templates
4. Save

---

### Q: What happens to tasks when a quote is accepted?

**A:** Smart task management:

**Automatic actions:**
- ✅ Pending follow-up tasks → Cancelled
- ✅ New post-acceptance tasks created:
  - Send invoice
  - Schedule job
  - Order supplies (if needed)

---

### Q: Can I share tasks with team members?

**A:** Team features coming in v2.0!

**Current workaround:**
- Export tasks as CSV
- Share via email
- Manual coordination

---

### Q: How do I prioritize tasks?

**A:** Three ways:

**1. Set Priority When Creating:**
- Urgent (🔴)
- High (🟡)
- Normal (🔵)
- Low (⚪)

**2. Sort Task List:**
- By priority
- By due date
- By client value

**3. Use Filters:**
- Show only urgent
- Show overdue
- Show today's tasks

---

## Technical Questions

### Q: Why do I need to "Add to Home Screen"?

**A:** This enables full PWA functionality:

**Benefits:**
- ✅ Full-screen app experience
- ✅ Offline mode works properly
- ✅ Faster loading (caching)
- ✅ App-like navigation
- ✅ No browser UI clutter

**Without it:**
- Offline mode limited
- Browser UI visible
- Slower performance
- Less professional

---

### Q: How much storage does TicTacStick use?

**A:** Storage breakdown:

- **App:** ~50MB (one-time)
- **Data:** Grows over time
  - 100 quotes ≈ 1-2MB
  - 1,000 quotes ≈ 10-20MB
  - 10,000 quotes ≈ 100-200MB

**Photos add more:**
- Uncompressed photo: 2-5MB
- Compressed (automatic): 200-500KB

---

### Q: What if I run out of storage?

**A:** Solutions:

**1. Download backup first:**
```
Settings → Backup → Download Backup
```

**2. Delete old data:**
- Remove old quotes you don't need
- Delete completed tasks
- Remove old photos

**3. Archive yearly:**
- Export year-end data
- Clear from app
- Store backup file safely

**4. Free up device space:**
- Delete other apps
- Remove photos/videos
- Clear browser cache

---

### Q: Can I use TicTacStick on a tablet?

**A:** Yes! Works great on tablets:

**iPad:**
- Safari recommended
- Full offline support
- Larger screen perfect for showing quotes

**Android Tablet:**
- Chrome recommended
- Same full features
- Great for presentations

**Benefits of tablets:**
- Show quotes to clients
- Easier data entry
- Better for analytics

---

### Q: Does it work on desktop?

**A:** Yes, but optimized for mobile.

**Desktop use cases:**
- ✅ Analytics review (big screen helpful)
- ✅ Bulk data entry
- ✅ Settings configuration
- ✅ Report generation
- ✅ Admin tasks

**Mobile use cases:**
- ✅ Field quoting (primary use)
- ✅ On-site client interaction
- ✅ Quick task checking
- ✅ Payment recording

---

## Integration Questions

### Q: How do I connect to GoHighLevel?

**A:** Setup steps:

1. **Get GHL Credentials:**
   - GHL Location ID
   - API Key
   - Webhook secret

2. **Configure in TicTacStick:**
   - Settings → Integrations → GoHighLevel
   - Enter Location ID
   - Enter API Key
   - Enter Webhook URL
   - Test connection

3. **Enable Sync:**
   - Toggle on "Bidirectional Sync"
   - Select sync options:
     - ✅ Contacts
     - ✅ Opportunities
     - ✅ Tasks
   - Save

4. **Initial Sync:**
   - Tap "Sync Now"
   - Wait for completion
   - Verify data synced

---

### Q: What is Stripe and do I need it?

**A:** Stripe processes credit card payments online.

**You need it if:**
- ✅ You want to accept cards
- ✅ You want online payment links
- ✅ You want automatic payment processing

**You don't need it if:**
- Only accepting cash/bank transfer
- Manual payment recording is fine

**Setup:**
1. Create Stripe account: stripe.com
2. Get API keys (Publishable & Secret)
3. TicTacStick → Settings → Integrations → Stripe
4. Enter API keys
5. Test with small transaction

---

### Q: Can I integrate with my accounting software?

**A:** Not directly yet, but export options:

**Current:**
- Export invoices as CSV
- Import into Xero/MYOB/QuickBooks
- Manual reconciliation

**Coming in v2.0:**
- Direct Xero integration
- MYOB integration
- QuickBooks integration

**Workaround:**
Use weekly CSV exports for accounting.

---

## Troubleshooting

### Q: App won't load - what do I do?

**A:** Troubleshooting steps:

**1. Check internet (first-time load):**
- Need internet for first load
- After that, offline works

**2. Clear browser cache:**
- Safari: Settings → Safari → Clear History and Website Data
- Chrome: Settings → Privacy → Clear Browsing Data

**3. Force-reload page:**
- Pull down to refresh
- Or close and reopen

**4. Try different browser:**
- Safari recommended
- Chrome also works

**5. Check URL:**
- Ensure using HTTPS
- Verify correct domain

**Still not working?**
Contact support with:
- Device type
- Browser version
- Error messages
- Screenshots

---

### Q: Quotes not saving - help!

**A:** Common causes & fixes:

**1. Check device storage:**
```
Settings → General → Storage
Free up space if needed
```

**2. Try again:**
- Temporary issue may resolve
- Wait 10 seconds, retry

**3. Download backup:**
```
Settings → Backup → Download
Protects existing data
```

**4. Clear app cache:**
```
Settings → Advanced → Clear Cache
(NOT Clear Data!)
```

**5. Force save:**
- Tap "Save" multiple times
- Check Quotes tab to verify

---

### Q: PDF won't generate - why?

**A:** Solutions:

**1. Check all required fields:**
- Client name ✓
- Client address ✓
- At least one line item ✓
- Valid pricing ✓

**2. Check internet:**
- PDF generation needs fonts
- Requires brief connection
- Wait and retry

**3. Try different browser:**
- Safari works best on iOS
- Chrome on Android

**4. Fallback option:**
- Take screenshot of quote
- Email screenshot to client
- Generate PDF later

---

### Q: Can't log into integrations - help!

**A:** Verification checklist:

**1. Check credentials:**
- ✅ Username correct?
- ✅ Password correct?
- ✅ API key valid?
- ✅ No extra spaces?

**2. Verify integration active:**
- Check integration provider site
- Ensure account not suspended
- Verify API access enabled

**3. Re-authorize:**
- Settings → Integrations
- Disconnect
- Reconnect with fresh login

**4. Check API key expiry:**
- Some keys expire
- Generate new key
- Update in TicTacStick

**5. Contact provider:**
- GoHighLevel support
- Stripe support
- Provide error messages

---

### Q: Tasks not appearing - where are they?

**A:** Checklist:

**1. Refresh task list:**
- Pull down to refresh
- Wait a few seconds

**2. Check date filters:**
- Remove date filters
- Show "All Tasks"

**3. Verify automation enabled:**
```
Settings → Automation
Ensure "Auto-create tasks" is ON
```

**4. Check quote status:**
- Tasks only create when quote marked "Sent"
- Draft quotes don't create tasks

**5. Manual create:**
- If auto-tasks fail, create manually
- Tap "+ New Task"

---

## Error Messages Explained

### "Storage quota exceeded"

**Meaning:** Device is full.

**Fix:**
1. Download backup
2. Delete old quotes/photos
3. Free up device space
4. Try again

---

### "Network error"

**Meaning:** No internet connection.

**Fix:**
- Don't panic! App works offline
- Will sync when reconnected
- Don't refresh page
- Keep working

---

### "Invalid data"

**Meaning:** Corrupted entry.

**Fix:**
1. Try re-entering data
2. Check for special characters
3. Use alphanumeric only
4. Contact support if persists

---

### "Sync failed"

**Meaning:** Integration sync error.

**Fix:**
1. Check integration credentials
2. Verify internet connection
3. Retry sync manually
4. Check integration status page

---

## Still Need Help?

### Self-Service Resources

1. ✅ [Quick Start Guide](./QUICK_START_GUIDE.md)
2. ✅ [Complete User Manual](./USER_MANUAL.md)
3. ✅ [Best Practices Guide](./BEST_PRACTICES.md)
4. ✅ [Video Tutorials](./VIDEO_TUTORIALS.md)
5. ✅ In-App Help (tap ❓ icon)

### Contact Support

**Email:** support@tictacstick.com.au

**Include in your message:**
- Device type (iPhone 12, iPad Pro, etc.)
- Browser and version
- Screenshot of error
- Steps to reproduce problem
- What you've already tried

**Response Time:**
- Standard: 24-48 hours
- Urgent: 4-8 hours (business hours)

---

**Last Updated:** 2025-11-18
**Version:** 1.11.0
**TicTacStick Quote Engine** - 925 Pressure Glass, Perth, Australia
