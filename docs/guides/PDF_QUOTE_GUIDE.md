# Quote PDF Generation Guide

## Overview

The TicTacStick Quote Engine v1.8.0 includes a professional PDF generation system for creating, previewing, downloading, and sharing quote documents.

**Features:**
- 📄 Professional, branded PDF layouts
- 👁️ Preview before download
- 📧 Email integration
- 📱 Mobile share support (Web Share API)
- 🎨 Customizable company branding
- ⌨️ Keyboard shortcuts
- 🚀 Fast, client-side generation
- 📴 Works completely offline

---

## Quick Start

### 1. Basic Usage

```javascript
// Get current quote data
var quoteData = getCurrentQuoteData();

// Generate and download PDF
QuotePDFGenerator.download(quoteData);

// Preview PDF in new window
QuotePDFGenerator.preview(quoteData);

// Prepare for email
var emailData = QuotePDFGenerator.prepareEmail(quoteData);
```

### 2. Using UI Buttons

Add PDF action buttons to your quote page:

```javascript
// Render PDF buttons
var buttonsHTML = QuotePDFUI.renderPDFButtons();
document.getElementById('quote-actions-container').innerHTML = buttonsHTML;

// Re-attach handlers
QuotePDFUI.init();
```

Or add buttons manually in HTML:

```html
<div class="quote-actions pdf-actions">
  <button id="btn-preview-pdf" class="btn-primary btn-icon">
    <svg>...</svg>
    <span>Preview PDF</span>
  </button>

  <button id="btn-download-pdf" class="btn-secondary btn-icon">
    <svg>...</svg>
    <span>Download PDF</span>
  </button>

  <button id="btn-email-pdf" class="btn-tertiary btn-icon">
    <svg>...</svg>
    <span>Email Quote</span>
  </button>
</div>
```

### 3. Keyboard Shortcuts

- **Ctrl/Cmd + P** - Preview PDF
- **Ctrl/Cmd + Shift + D** - Download PDF

---

## Configuration

### Company Branding

Edit `pdf-config.js` to customize your company information:

```javascript
var COMPANY_CONFIG = {
  // Business details
  name: '925 Pressure Glass',
  tagline: 'Window Cleaning & Pressure Washing Specialists',
  abn: '12 345 678 901', // Update with real ABN

  // Contact information
  phone: '0400 000 000', // Update with real phone
  email: 'info@925pressureglass.com.au',
  website: 'www.925pressureglass.com.au',

  // Address
  address: {
    street: '123 Business Street',
    suburb: 'Perth',
    city: 'Perth',
    state: 'WA',
    postcode: '6000',
    country: 'Australia'
  },

  // Logo (base64 encoded)
  logo: {
    enabled: false, // Set to true when logo added
    base64: null,   // Add base64 encoded logo
    format: 'PNG',
    width: 40,
    height: 20
  }
};
```

### Adding Your Company Logo

1. **Convert logo to base64:**
   - Use online converter: https://www.base64-image.de/
   - Or use command line: `base64 logo.png > logo.txt`

2. **Add to config:**
   ```javascript
   logo: {
     enabled: true,
     base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
     format: 'PNG',
     width: 40,  // Adjust size in mm
     height: 20
   }
   ```

### Payment Terms

Customize default payment terms:

```javascript
payment: {
  methods: ['Cash', 'Bank Transfer', 'Credit Card'],
  depositPercentage: 50,
  terms: '50% deposit required. Balance due upon completion.',
  bankDetails: {
    accountName: '925 Pressure Glass',
    bsb: '123-456',
    accountNumber: '12345678',
    reference: 'Quote number'
  }
}
```

### Quote Settings

```javascript
quote: {
  validityDays: 30,           // How long quote is valid
  numberPrefix: 'QT',         // Quote number prefix
  numberFormat: 'YYYYMMDD-XXX' // Format: QT20250118-001
}
```

---

## Quote Data Format

The PDF generator expects quote data in this format:

```javascript
var quoteData = {
  // Quote metadata
  quoteNumber: 'QT20250118-001',
  dateIssued: '18/01/2025',
  expiryDate: '17/02/2025',
  status: 'draft', // or 'sent', 'accepted', 'expired'

  // Client information
  client: {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '0400 123 456',
    address: '123 Main Street, Perth WA 6000'
  },

  // Project address (if different from client)
  projectAddress: '456 Other Street, Fremantle WA 6160',

  // Line items
  lineItems: [
    {
      description: 'Standard Window Cleaning',
      details: '10 inside, 10 outside panes',
      quantity: 10,
      unit: 'window',
      unitPrice: 12.50,
      total: 125.00
    },
    {
      description: 'Concrete Driveway Pressure Cleaning',
      details: '50 sqm',
      quantity: 50,
      unit: 'sqm',
      unitPrice: 3.00,
      total: 150.00
    }
  ],

  // Financial summary
  subtotal: 275.00,
  discount: 0,
  gst: 27.50,
  total: 302.50,

  // Additional information
  notes: 'Access required from 8am. Please ensure driveway is clear.',
  terms: null // Will use default from COMPANY_CONFIG
};
```

---

## API Reference

### QuotePDFGenerator

Main PDF generation module.

#### Methods

**`generate(quoteData, options)`**
```javascript
var result = QuotePDFGenerator.generate(quoteData, {
  action: 'download', // 'download', 'preview', or 'blob'
  template: 'standard' // Template ID (future use)
});
```

**`preview(quoteData)`**
```javascript
QuotePDFGenerator.preview(quoteData);
// Opens PDF in new browser window
```

**`download(quoteData)`**
```javascript
QuotePDFGenerator.download(quoteData);
// Downloads PDF file to device
```

**`prepareEmail(quoteData)`**
```javascript
var emailData = QuotePDFGenerator.prepareEmail(quoteData);
// Returns: { to, subject, body, attachment: { filename, blob, mimeType } }
```

**`share(quoteData)`**
```javascript
QuotePDFGenerator.share(quoteData);
// Uses Web Share API on mobile, falls back to email modal
```

### QuotePDFUI

UI integration module.

#### Methods

**`init()`**
```javascript
QuotePDFUI.init();
// Attaches event handlers to PDF buttons
```

**`renderPDFButtons()`**
```javascript
var html = QuotePDFUI.renderPDFButtons();
// Returns HTML for PDF action buttons
```

**`showEmailModal(emailData)`**
```javascript
QuotePDFUI.showEmailModal({
  to: 'client@example.com',
  subject: 'Quote from 925 Pressure Glass',
  body: 'Please find attached...',
  attachment: { filename: 'quote.pdf', blob: pdfBlob }
});
```

**`handlePreviewPDF()`**
```javascript
QuotePDFUI.handlePreviewPDF();
// Handle preview button click
```

**`handleDownloadPDF()`**
```javascript
QuotePDFUI.handleDownloadPDF();
// Handle download button click
```

**`handleEmailPDF()`**
```javascript
QuotePDFUI.handleEmailPDF();
// Handle email button click
```

### PDFHelpers

Utility functions.

```javascript
// Format currency
var formatted = PDFHelpers.formatCurrency(125.50); // "125.50"

// Format date
var dateStr = PDFHelpers.formatDate(new Date()); // "18/01/2025"

// Calculate expiry date
var expiry = PDFHelpers.calculateExpiryDate(30); // 30 days from now

// Generate quote number
var quoteNum = PDFHelpers.generateQuoteNumber(); // "QT20250118-001"

// Validate email
var isValid = PDFHelpers.validateEmail('test@example.com'); // true

// Get full company address
var address = PDFHelpers.getFullAddress(); // "123 Street, Perth WA 6000"

// Get default email body
var body = PDFHelpers.getDefaultEmailBody(quoteData);
```

---

## Advanced Usage

### Custom Email Body

```javascript
var quoteData = getCurrentQuoteData();
var emailData = QuotePDFGenerator.prepareEmail(quoteData);

// Customize email body
emailData.body = "Dear " + quoteData.client.name + ",\n\n" +
  "Custom message here...\n\n" +
  "Best regards,\n" +
  COMPANY_CONFIG.name;

// Show email modal with custom body
QuotePDFUI.showEmailModal(emailData);
```

### Batch PDF Generation

```javascript
var quotes = [quoteData1, quoteData2, quoteData3];
var results = QuotePDFGenerator.batchGenerate(quotes);

results.forEach(function(result) {
  if (result.success) {
    console.log('Generated:', result.result.filename);
  } else {
    console.error('Failed:', result.error);
  }
});
```

### Custom Quote Number Generation

Override the default quote number generator:

```javascript
// In pdf-config.js
PDFHelpers.generateQuoteNumber = function() {
  // Custom logic
  var prefix = 'CUSTOM-';
  var timestamp = Date.now();
  return prefix + timestamp;
};
```

### Programmatic Email Sending

To implement backend email sending:

```javascript
// In quote-pdf-ui.js, modify sendEmail()
sendEmail: function() {
  var to = document.getElementById('email-to').value;
  var subject = document.getElementById('email-subject').value;
  var body = document.getElementById('email-body').value;
  var emailData = window._emailData;

  // Send to backend API
  fetch('/api/send-quote-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: to,
      subject: subject,
      body: body,
      pdfBlob: emailData.attachment.blob,
      filename: emailData.attachment.filename
    })
  })
  .then(function(response) {
    if (response.ok) {
      UIComponents.showToast('Email sent successfully', 'success');
      QuotePDFUI.closeEmailModal();
    } else {
      throw new Error('Email sending failed');
    }
  })
  .catch(function(error) {
    UIComponents.showToast('Failed to send email: ' + error.message, 'error');
  });
}
```

---

## Troubleshooting

### PDFs Not Generating

**Problem:** PDF generation fails silently

**Solutions:**
1. Check browser console for errors
2. Verify jsPDF library loaded: `console.log(typeof jsPDF)`
3. Ensure quote data is valid: `QuotePDFGenerator._validateQuoteData(quoteData)`
4. Check if line items exist: `quoteData.lineItems.length > 0`

### Missing Company Logo

**Problem:** Logo placeholder appears instead of actual logo

**Solutions:**
1. Verify logo is base64 encoded correctly
2. Check `COMPANY_CONFIG.logo.enabled = true`
3. Ensure base64 string includes data URI prefix: `data:image/png;base64,...`
4. Test logo separately: `var img = new Image(); img.src = COMPANY_CONFIG.logo.base64;`

### Email Modal Not Opening

**Problem:** Email button doesn't show modal

**Solutions:**
1. Check if client email is set: `quoteData.client.email`
2. Verify event handler attached: `QuotePDFUI.init()`
3. Check console for errors
4. Test directly: `QuotePDFUI.showEmailModal(emailData)`

### Keyboard Shortcuts Not Working

**Problem:** Ctrl+P doesn't preview PDF

**Solutions:**
1. Ensure `quote-pdf.js` is loaded
2. Check if quote data available
3. Test manually: `QuotePDFGenerator.preview(getCurrentQuoteData())`
4. Check browser shortcut conflicts

### PDFs Look Wrong on Mobile

**Problem:** Layout issues on iOS/Android

**Solutions:**
1. Test PDF in desktop browser first
2. Check PDF scaling in mobile PDF viewer
3. Adjust `PDF_CONFIG` dimensions if needed
4. Use preview feature to test before downloading

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Safari iOS | 12+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

**Features:**
- ✅ PDF Generation (all browsers)
- ✅ Download (all browsers)
- ✅ Preview (all browsers)
- ✅ Web Share API (iOS Safari 12+, Android Chrome 75+)
- ✅ Offline support (all browsers with Service Worker)

---

## Performance

**Generation Times:**
- Small quote (1-5 items): ~100-200ms
- Medium quote (6-15 items): ~200-400ms
- Large quote (16+ items): ~400-800ms

**File Sizes:**
- Without logo: ~15-30 KB
- With logo (PNG): ~40-80 KB
- With photos (future): varies

**Optimization Tips:**
1. Use compressed logos (optimize PNG/JPEG before base64 encoding)
2. Limit line item descriptions to essential details
3. Use preview before downloading to avoid regenerating
4. Cache company config to avoid repeated reads

---

## Examples

### Example 1: Simple Quote PDF

```javascript
var simpleQuote = {
  client: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '0400 987 654'
  },
  lineItems: [
    {
      description: 'Window Cleaning',
      quantity: 15,
      unit: 'window',
      unitPrice: 10,
      total: 150
    }
  ],
  subtotal: 150,
  gst: 15,
  total: 165
};

QuotePDFGenerator.download(simpleQuote);
```

### Example 2: Quote with Custom Notes

```javascript
var quoteWithNotes = {
  client: { name: 'Bob Smith', email: 'bob@example.com' },
  lineItems: [...],
  subtotal: 500,
  gst: 50,
  total: 550,
  notes: 'IMPORTANT: Gate code is #1234. Please call on arrival. ' +
         'Ladder access required for second floor windows. ' +
         'Dog will be inside - please close gates.'
};

QuotePDFGenerator.preview(quoteWithNotes);
```

### Example 3: Email Quote Directly

```javascript
function emailQuote() {
  var quoteData = getCurrentQuoteData();

  if (!quoteData.client.email) {
    UIComponents.showToast('Please add client email first', 'warning');
    return;
  }

  var emailData = QuotePDFGenerator.prepareEmail(quoteData);
  QuotePDFUI.showEmailModal(emailData);
}
```

---

## Future Enhancements

**Planned Features:**
- 🎨 Multiple PDF templates (minimal, detailed, photo-heavy)
- 📸 Embedded photos in PDFs
- 💾 Save PDF to quote history
- 📊 Quote comparison PDFs
- 🔐 Password-protected PDFs
- 📝 Digital signature support
- 🌐 Multi-language support
- 📱 Native mobile app integration

---

## Support

**Questions or Issues?**

1. Check console for error messages
2. Review this guide's troubleshooting section
3. Check CLAUDE.md for system architecture
4. Test with simple quote data first
5. Report bugs to project maintainer

**Version:** 1.8.0
**Last Updated:** 2025-01-18
**Maintainer:** Gerard Varone - 925 Pressure Glass
