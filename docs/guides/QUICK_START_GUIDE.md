# TicTacStick Quick Start Guide

**For:** Gerard Varone - 925 Pressure Glass
**Version:** 1.8.0
**Last Updated:** 2025-11-18

---

## 🚀 Getting Started in 5 Minutes

### What is TicTacStick?

Your complete business management system for window and pressure cleaning quotes, invoices, and client management - all working offline on your iPad/iPhone.

---

## 📱 First Time Setup

### Step 1: Add to Home Screen (iPhone/iPad)

1. **Open Safari** on your iPhone/iPad
2. **Navigate to** the TicTacStick URL (your production URL)
3. **Tap the Share button** (square with arrow pointing up)
4. **Scroll down** and tap "Add to Home Screen"
5. **Tap "Add"** in the top right
6. **Icon appears** on your home screen - looks like a native app!

### Step 2: Open the App

1. **Tap the TicTacStick icon** on your home screen
2. App opens in full-screen mode (looks and feels like a native app)
3. **No internet required** - works completely offline!

---

## 💼 Creating Your First Quote

### Quick Method (2 Minutes)

1. **Enter Client Details** (top of screen):
   - Client Name: "John Smith"
   - Location: "123 Main St, Perth"
   - Job Type: "Residential"

2. **Set Your Rates**:
   - Base Fee: $120 (default)
   - Hourly Rate: $95 (default)
   - These save automatically for next time

3. **Add Window Cleaning**:
   - Click "➕ Add Window Line"
   - Select window type (e.g., "Standard Windows")
   - Enter quantity (e.g., "10")
   - Choose: Inside, Outside, or Both
   - Click "Add to Quote"

4. **Add Pressure Cleaning** (if needed):
   - Click "➕ Add Pressure Line"
   - Select surface (e.g., "Concrete Driveway")
   - Enter area in square meters (e.g., "50")
   - Click "Add to Quote"

5. **Review Total**:
   - Summary panel shows breakdown
   - Total includes GST (automatically calculated)
   - Minimum job fee enforced ($180)

6. **Save Quote**:
   - Click "💾 Save Quote"
   - Quote saved to device storage
   - Accessible even offline!

---

## 📄 Generating a PDF Quote

1. **After creating quote**, click "📄 Generate PDF"
2. **Review PDF preview** in modal
3. **Choose action**:
   - **Download** - Saves PDF to Files app
   - **Share** - Opens iOS share sheet (Email, Message, AirDrop, etc.)
   - **Print** - Prints directly from iPhone/iPad

4. **Send to Client**:
   - Email directly from PDF modal
   - Or use iOS share to send via SMS, WhatsApp, etc.

---

## 👥 Managing Clients

### Add a New Client

1. **Click "👥 Clients"** (navigation tab)
2. **Click "➕ Add Client"**
3. **Fill in details**:
   - Name: (required)
   - Email:
   - Phone:
   - Address:
   - Notes:
4. **Click "Save Client"**

### Quick Client Selection

When creating a quote:
1. **Start typing** client name in "Client Name" field
2. **Autocomplete suggestions** appear
3. **Tap suggestion** - auto-fills all client details!
4. **Saves time** - no re-typing addresses

---

## 🧾 Converting Quote to Invoice

1. **Create and save quote** (as above)
2. **Click "📋 Invoices"** tab
3. **Click "Create Invoice from Quote"**
4. **Select your saved quote** from list
5. **Invoice generated** with unique invoice number
6. **Send invoice** to client (PDF or email)

### Recording Payments

1. **Open invoice** from invoice list
2. **Click "💵 Record Payment"**
3. **Enter details**:
   - Amount: (e.g., $550.00)
   - Payment Method: (Bank Transfer, Cash, Credit Card)
   - Reference: (e.g., "Transaction #12345")
   - Payment Date: (auto-filled with today)
4. **Click "Record Payment"**
5. **Status updates** automatically:
   - Partial payment → Status: "sent" (balance remaining)
   - Full payment → Status: "paid" (✅ locked from editing)

---

## 🔧 Common Tasks

### Clear Current Quote (Start Fresh)

- **Click "Clear All"** button (top right)
- Confirms before clearing
- Saved quotes are NOT deleted (safe)

### Switch Between Modes

- **Accordion Mode** (default) - Compact, sections collapse/expand
- **Wizard Mode** - Guided step-by-step
- **Toggle with button** at top of screen

### View Quote History & Analytics

1. **Click "📊 Analytics"** tab
2. **See statistics**:
   - Total quotes created
   - Total revenue
   - Average quote value
   - Top clients
3. **View quote history** - Last 100 quotes
4. **Export to CSV** for Excel analysis

### Backup Your Data

1. **Click "⚙️ Settings"** or "Import/Export" tab
2. **Click "Export All Data"**
3. **Save JSON file** to iCloud Drive or Files app
4. **Set reminder** to export weekly (recommended)
5. **Keep backups safe** - this is your business data!

### Restore from Backup

1. **Click "Import/Export"** tab
2. **Click "Import Data"**
3. **Select your backup file** (JSON)
4. **Data restored** to app
5. **Verify quotes and clients** loaded correctly

---

## 💡 Pro Tips

### Tip 1: Use Templates

Pre-configured for common jobs:
- "Standard House Package"
- "Apartment Balcony Special"
- "Commercial Storefront"
- "Driveway & Paths Package"
- "Full Service Package"

**How to use:**
1. Click "Templates" in navigation
2. Select template
3. Quote auto-fills with template items
4. Adjust as needed
5. Much faster than adding each line!

### Tip 2: Job Presets

Save your own common configurations:
1. Create a quote for a common job (e.g., "3BR House Standard")
2. Click "Save as Preset"
3. Name it (e.g., "3BR House")
4. Next time: Load preset → Instant quote!

### Tip 3: Add Photos

Document jobs with photos:
1. Click "📷 Add Photos" button
2. Take photo with camera or choose from library
3. Photos attach to quote
4. Include in PDF (optional)
5. Great for before/after documentation!

### Tip 4: Use Keyboard Shortcuts (iPad)

- **?** - Show keyboard shortcuts help
- **Cmd+S** - Save quote
- **Cmd+N** - New quote (clear all)
- **Cmd+P** - Generate PDF
- **Esc** - Close modal dialogs

### Tip 5: High-Reach Jobs

For difficult access (extension ladder required):
1. When adding window lines, **check "High Reach"** checkbox
2. Automatically adds $60 premium
3. Or adjust "High Reach Modifier" in settings

### Tip 6: Quick Add UI (Mobile)

On small screens:
1. Look for "⚡ Quick Add" button
2. Streamlined mobile interface
3. Preset buttons for common items
4. Optimized for touch

---

## 🆘 Troubleshooting

### Issue: Quote doesn't save

**Cause:** LocalStorage full (quota exceeded)
**Fix:**
1. Export all data (backup)
2. Delete old quotes from history
3. Clear unnecessary saved quotes
4. Import backup if needed
5. Consider exporting quotes monthly

### Issue: Can't edit paid invoice

**Expected:** Paid invoices are **locked** to protect data integrity
**Why:** Accounting compliance and audit trail
**Solution:**
- If you need to correct: Create a new invoice
- Or add notes to explain discrepancy
- NEVER try to edit paid invoices!

### Issue: GST calculation looks wrong

**Check:** GST must be exactly 10% of subtotal
- Subtotal: $1,000.00
- GST: $100.00 (10%)
- Total: $1,100.00

**Note:** GST field is auto-calculated and read-only (this is intentional for tax compliance)

### Issue: App feels slow

**Fix:**
1. Close other apps (free up memory)
2. Restart app (close and reopen)
3. Clear old data (export first!)
4. Update iOS if available

### Issue: PDF won't download on iPhone

**Try:**
1. Use "Share" instead of "Download"
2. Share to Files app
3. Share via Email
4. Or use AirDrop to Mac/laptop

### Issue: Data disappeared

**Likely Causes:**
1. Cleared browser cache/cookies
2. Used different browser
3. App reinstalled

**Prevention:**
- **Export backups weekly!**
- Save to iCloud Drive
- Email backups to yourself
- Keep multiple copies

**Recovery:**
- Restore from most recent backup
- Check if data in different browser

---

## 📊 Understanding Your Numbers

### Quote Breakdown Example

```
Base Fee:              $120.00
Window Time:           2.5 hours × $95 = $237.50
Pressure Time:         1.0 hours × $95 = $95.00
High Reach Premium:    $60.00
                       ─────────
Subtotal:              $512.50
GST (10%):             $51.25
                       ─────────
TOTAL:                 $563.75
```

### Pricing Strategy

**Base Fee ($120):**
- Covers travel time
- Equipment setup
- Basic overhead
- Minimum commitment

**Hourly Rate ($95):**
- Your labour value
- Industry standard for Perth
- Adjust based on experience
- Can increase for premium service

**Minimum Job ($180):**
- Won't accept jobs below this
- Covers your time + costs
- Small jobs auto-adjust to minimum

**High Reach Premium ($60):**
- Extension ladder required
- Extra time and risk
- Premium service charge

---

## 📈 Growing Your Business

### Month 1: Get Comfortable

- Create 20+ quotes
- Send 10+ to real clients
- Track conversion rate
- Refine your pricing
- Build client database

### Month 2: Optimize

- Identify common job types
- Create custom presets
- Reduce quote time to <10 min
- Improve quote-to-job ratio
- Ask for referrals

### Month 3: Scale

- Start offering contracts
- Set up recurring clients
- Track monthly revenue
- Analyze profitable job types
- Consider price increases

### Long-Term Goals

- Build recurring revenue (contracts)
- Automate follow-ups (tasks/reminders)
- Track customer lifetime value
- Expand service offerings
- Hire second technician (when ready)

---

## 🔐 Data & Privacy

### Where is My Data?

- **Stored on your device** (iPhone/iPad)
- **LocalStorage** in Safari/browser
- **NOT on cloud** (unless you back up to iCloud)
- **Completely private** and offline

### Is My Data Safe?

- **Yes** - Stored locally, not on external servers
- **But** - If device lost/broken, data lost too
- **Solution** - **Export backups regularly!**

### Who Can See My Data?

- **Only you** - Data never leaves your device
- **No tracking** - No analytics sent anywhere
- **No account required** - Fully local app
- **Privacy first** - Your business, your data

---

## ⚙️ Settings & Customization

### Invoice Settings

Click "⚙️" in Invoices tab to configure:

**Invoice Numbering:**
- Prefix: "INV-" (or your preference)
- Next Number: Auto-increments
- ⚠️ Cannot decrease once invoices exist (prevents duplicates)

**Payment Terms:**
- Default: 7 days
- Shown on invoices
- Adjust per client if needed

**Bank Details:**
- Your business bank account
- Shows on invoices for payment
- Optional but recommended

**Company Info:**
- Business name
- ABN (Australian Business Number)
- Contact details
- Appears on invoices

### Theme Customization

1. Click "🎨 Theme" (if available)
2. Choose Light or Dark mode
3. Customize colors
4. Upload logo
5. Set brand colors

---

## 📚 Additional Resources

### In-App Help

- Press **?** for keyboard shortcuts
- Hover over fields for tooltips
- Click "ℹ️" icons for explanations

### Documentation

- `README.md` - Project overview
- `CLAUDE.md` - Complete technical guide
- `PROJECT_STATE.md` - Current feature list
- `PRINT_GUIDE.md` - Printing instructions

### Support

**For Technical Issues:**
1. Check console for errors (Safari: Develop → Show Web Inspector)
2. Export data (backup first!)
3. Try clearing cache and reloading
4. Check bug reports in `docs/bug-reports/`

**For Feature Requests:**
- Document what you need
- Explain the use case
- Prioritize must-have vs nice-to-have

---

## ✅ Daily Workflow

### Morning Routine

1. Open TicTacStick app
2. Check for errors/issues
3. Review schedule for day
4. Prepare quote templates if needed

### At Job Site

1. Open app on iPad
2. Take before photos
3. Walk property with client
4. Create quote on-site
5. Review and adjust with client
6. Generate PDF
7. Email/text quote immediately
8. Take after photos when job done

### End of Day

1. Review quotes sent today
2. Follow up on pending quotes
3. Record any payments received
4. Create invoices for completed jobs
5. Export backup (weekly)

---

## 🎯 Success Metrics

### Track These Weekly

**Efficiency:**
- Time per quote: Target <10 min
- Quotes per day: Track
- Same-day quotes: Aim for 100%

**Conversion:**
- Quotes sent: Count
- Jobs won: Count
- Conversion rate: Target 35%+
- Average quote value: Track

**Revenue:**
- Weekly revenue: Track
- Monthly revenue: Target
- Recurring contracts: Build
- Repeat client rate: Target 25%+

---

## 🎉 You're Ready!

**You now know:**
- ✅ How to create quotes
- ✅ How to manage clients
- ✅ How to generate PDFs
- ✅ How to create invoices
- ✅ How to track payments
- ✅ How to backup data
- ✅ How to use templates and presets
- ✅ How to troubleshoot issues

**Next Steps:**
1. **Create 5 test quotes** (practice with real data)
2. **Send first real quote** to a client
3. **Generate your first invoice**
4. **Set up weekly backup reminder**
5. **Start building your client database**

**Remember:**
- Export backups weekly!
- Test on your iPad before job sites
- Keep it simple at first
- Add advanced features as needed
- Your data is private and offline

---

## 💬 Final Tips

> **"Start simple, ship fast, iterate often."**

1. **Don't overcomplicate** - Basic quotes work great
2. **Trust the system** - It's been tested thoroughly
3. **Backup regularly** - Set calendar reminder
4. **Use it daily** - Builds muscle memory
5. **Give feedback** - Note what you'd like improved

---

**You've got this!** 🚀

**Your TicTacStick system is production-ready and waiting for you to create professional quotes and grow your business.**

---

*Questions? Check the full documentation in `CLAUDE.md` or review the technical guides in the `docs/` folder.*

**925 Pressure Glass · Window & Pressure Cleaning · Perth, Western Australia**
