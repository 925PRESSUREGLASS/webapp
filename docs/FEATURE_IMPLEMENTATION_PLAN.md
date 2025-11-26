# Feature Implementation Plan

> Implementation roadmap for 5 pending features in TicTacStick/Metabuild

---

## Overview

| # | Feature | Priority | Effort | Status |
|---|---------|----------|--------|--------|
| 1 | Email Integration | High | 3-4 days | ❌ Pending |
| 2 | Contract Wizard Edit | Medium | 2 days | ✅ Completed |
| 3 | Dashboard TanStack Query | Low | Already done | ✅ Completed |
| 4 | Business Config UI | Medium | 2-3 days | ✅ Completed |
| 5 | Encryption Settings UI | Low | 1-2 days | ✅ Completed |

---

## Summary of Completed Work

### ✅ Business Config UI (Commit: 3bb164d)
- Created `business-settings.js` - Full ES5-compatible module with localStorage storage
- Created `css/business-settings.css` - Modal styling with dark mode support
- Added modal HTML to `index.html` with form sections for Contact, Address, Bank Details
- Updated `config.js` to use BusinessSettings.applyToConfig() at runtime
- Added validation for Australian formats: ABN (11 digits), phone (10 digits), BSB (6 digits)

### ✅ Contract Wizard Edit Mode (Commit: 1559b1c)
- Added `_editMode` and `_editContractId` state variables to `contract-wizard.js`
- Implemented `initEditMode(contractId)` to load existing contract data
- Created `prefillFormFields()` to populate wizard forms with contract data
- Updated `saveContractDraft()` and `createContractFinal()` to handle updates vs creates
- Added `openContractWizardForEdit(contractId)` global function
- Updated `contract-ui.js` `editContractFromDetail()` to use new wizard edit mode
- Modal title changes to "Edit Contract" vs "New Contract" based on mode

### ✅ Encryption Settings UI (Already in invoice.js)
- Checkbox already exists in invoice settings modal at line 1088
- `getSettings()` and `updateSettings()` API methods exposed
- `enableEncryption` setting stored in invoice settings
- Tests passing in `tests/encryption-settings.spec.js`

### ✅ Dashboard TanStack Query (Already implemented)
- `QueryClient` and `QueryClientProvider` in `apps/meta-dashboard/src/main.tsx`
- `useQuery` hooks for projects, assets, features
- No additional work needed

---

## 1. Email Integration

**Current State:**
- `backup-manager.js:392` - TODO for email backup
- `quote-pdf-ui.js:424` - TODO for PDF email with attachment
- Currently uses `mailto:` links which can't attach PDFs

**Implementation Plan:**

### Phase 1A: Backend Email Service
```
apps/meta-api/src/routes/email.ts (new)
├── POST /email/send-quote     - Send quote PDF via email
├── POST /email/send-invoice   - Send invoice PDF via email
├── POST /email/send-backup    - Send backup file via email
└── POST /email/verify         - Verify email configuration
```

**Dependencies:**
- Nodemailer or SendGrid/Resend SDK
- PDF generation on server (or receive base64)
- SMTP configuration via environment variables

### Phase 1B: Frontend Integration
```javascript
// quote-pdf-ui.js - Update sendEmail()
sendEmail: function() {
  var quoteData = this.currentQuote;
  var pdfBase64 = this.generatePDFBase64();
  
  fetch('/api/email/send-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: document.getElementById('email-to').value,
      subject: document.getElementById('email-subject').value,
      body: document.getElementById('email-body').value,
      attachment: pdfBase64,
      filename: 'quote-' + quoteData.quoteNumber + '.pdf'
    })
  });
}
```

### Files to Create/Modify:
1. `apps/meta-api/src/routes/email.ts` - Email API routes
2. `apps/meta-api/src/services/email.service.ts` - Email sending logic
3. `quote-pdf-ui.js` - Update sendEmail() method
4. `backup-manager.js` - Update emailBackup() function
5. `invoice.js` - Add email invoice capability
6. `.env.example` - Add SMTP configuration variables

### Environment Variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@925pressureglass.com.au
```

---

## 2. Contract Wizard Edit Mode

**Current State:**
- `contract-ui.js:227` - TODO for edit mode
- `editContractFromDetail()` shows "Edit functionality coming soon!" toast
- Wizard only supports creating new contracts

**Implementation Plan:**

### Phase 2A: Wizard Edit Mode Support
```javascript
// contract-wizard.js - Add edit mode initialization
function initEditMode(contractId) {
  var contract = window.ContractManager.getContract(contractId);
  if (!contract) {
    console.error('[CONTRACT-WIZARD] Contract not found:', contractId);
    return;
  }
  
  _editMode = true;
  _editContractId = contractId;
  
  // Pre-populate form fields
  _contractData = {
    type: contract.type,
    client: contract.client,
    services: contract.services,
    category: contract.category,
    frequency: contract.frequency,
    terms: contract.terms,
    schedule: contract.schedule,
    payment: contract.payment
  };
  
  showStep(1);
  prefillFormFields();
}

function prefillFormFields() {
  // Populate contract type selection
  if (_contractData.type) {
    var card = document.querySelector('.contract-type-card[data-type="' + _contractData.type + '"]');
    if (card) card.classList.add('selected');
  }
  
  // Populate client dropdown
  if (_contractData.client && _contractData.client.id) {
    document.getElementById('contract-client-select').value = _contractData.client.id;
  }
  
  // ... populate other fields
}
```

### Phase 2B: UI Updates
```javascript
// contract-ui.js - Update editContractFromDetail()
function editContractFromDetail() {
  if (!_currentContractId) return;
  
  closeContractDetail();
  
  // Open wizard modal
  var modal = document.getElementById('contract-wizard-modal');
  if (modal) modal.style.display = 'block';
  
  // Initialize edit mode
  if (window.ContractWizard) {
    window.ContractWizard.initEditMode(_currentContractId);
  }
}
```

### Files to Modify:
1. `contract-wizard.js` - Add `initEditMode()`, `prefillFormFields()`, update `saveContract()` to handle updates
2. `contract-ui.js` - Update `editContractFromDetail()` to open wizard
3. `contract-wizard.css` (optional) - Add edit mode visual indicator

---

## 3. Dashboard TanStack Query

**Status: ✅ Already Implemented**

The meta-dashboard already uses TanStack Query:
- `QueryClient` and `QueryClientProvider` set up in `main.tsx`
- `useQuery` hooks for projects, assets, features
- `useMutation` hooks for CRUD operations
- React Hook Form with Zod validation for forms

No additional work needed.

---

## 4. Business Config UI

**Current State:**
- `config.js:55-93` - Hardcoded placeholder values for:
  - ABN: 'TBD'
  - Phone: '0400 000 000'
  - Address: empty street/postcode
  - Bank details: empty BSB/account number

**Implementation Plan:**

### Phase 4A: Settings Storage
```javascript
// business-settings.js (new file)
(function() {
  'use strict';
  
  var STORAGE_KEY = 'business_settings';
  
  var BusinessSettings = {
    defaults: {
      abn: '',
      email: 'info@925pressureglass.com.au',
      phone: '',
      website: 'www.925pressureglass.com.au',
      address: {
        street: '',
        city: 'Perth',
        state: 'WA',
        postcode: '',
        country: 'Australia'
      },
      bankDetails: {
        accountName: '925 Pressure Glass',
        bsb: '',
        accountNumber: ''
      }
    },
    
    load: function() {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('[BUSINESS-SETTINGS] Failed to parse:', e);
        }
      }
      return this.defaults;
    },
    
    save: function(settings) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      this.applyToConfig(settings);
    },
    
    applyToConfig: function(settings) {
      if (window.COMPANY_CONFIG) {
        window.COMPANY_CONFIG.abn = settings.abn || '';
        window.COMPANY_CONFIG.phone = settings.phone || '';
        window.COMPANY_CONFIG.email = settings.email || '';
        window.COMPANY_CONFIG.address = settings.address || {};
        window.COMPANY_CONFIG.invoice.bankDetails = settings.bankDetails || {};
      }
    }
  };
  
  window.BusinessSettings = BusinessSettings;
})();
```

### Phase 4B: Settings UI Modal
```html
<!-- Add to index.html -->
<div id="business-settings-modal" class="modal" style="display:none;">
  <div class="modal-content">
    <h2>Business Settings</h2>
    
    <div class="form-group">
      <label>ABN</label>
      <input type="text" id="setting-abn" placeholder="XX XXX XXX XXX">
    </div>
    
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" id="setting-phone" placeholder="0400 000 000">
    </div>
    
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="setting-email">
    </div>
    
    <h3>Address</h3>
    <div class="form-group">
      <label>Street</label>
      <input type="text" id="setting-street">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>City</label>
        <input type="text" id="setting-city" value="Perth">
      </div>
      <div class="form-group">
        <label>State</label>
        <select id="setting-state">
          <option value="WA" selected>WA</option>
          <option value="NSW">NSW</option>
          <option value="VIC">VIC</option>
          <option value="QLD">QLD</option>
          <option value="SA">SA</option>
          <option value="TAS">TAS</option>
          <option value="NT">NT</option>
          <option value="ACT">ACT</option>
        </select>
      </div>
      <div class="form-group">
        <label>Postcode</label>
        <input type="text" id="setting-postcode" maxlength="4">
      </div>
    </div>
    
    <h3>Bank Details (for Invoices)</h3>
    <div class="form-group">
      <label>Account Name</label>
      <input type="text" id="setting-account-name">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>BSB</label>
        <input type="text" id="setting-bsb" placeholder="XXX-XXX" maxlength="7">
      </div>
      <div class="form-group">
        <label>Account Number</label>
        <input type="text" id="setting-account-number">
      </div>
    </div>
    
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeBusinessSettings()">Cancel</button>
      <button class="btn-primary" onclick="saveBusinessSettings()">Save</button>
    </div>
  </div>
</div>
```

### Files to Create/Modify:
1. `business-settings.js` (new) - Settings storage and config sync
2. `business-settings.css` (new) - Modal styling
3. `index.html` - Add modal HTML and script reference
4. `app.js` - Add menu item to open settings
5. `config.js` - Load settings on startup

---

## 5. Encryption Settings UI

**Current State:**
- `tests/encryption-settings.spec.js` - Tests exist for the feature
- Invoice encryption is hardcoded, not user-configurable

**Implementation Plan:**

### Phase 5A: Settings in Invoice Modal
```javascript
// invoice.js - Add encryption toggle
function renderSettingsModal() {
  var html = '<div class="settings-section">';
  html += '<h3>Security</h3>';
  html += '<label class="toggle-setting">';
  html += '<input type="checkbox" id="enableEncryption" ' + 
          (getEncryptionSetting() ? 'checked' : '') + '>';
  html += '<span>Enable invoice encryption</span>';
  html += '</label>';
  html += '<p class="setting-help">When enabled, invoice data is encrypted before storage.</p>';
  html += '</div>';
  return html;
}

function getEncryptionSetting() {
  var setting = localStorage.getItem('invoice_encryption_enabled');
  return setting === null ? true : setting === 'true';
}

function setEncryptionSetting(enabled) {
  localStorage.setItem('invoice_encryption_enabled', enabled ? 'true' : 'false');
}
```

### Phase 5B: Apply Setting to Storage
```javascript
// storage.js - Check encryption setting before encrypt/decrypt
function saveInvoice(invoice) {
  var data = invoice;
  
  if (window.InvoiceSettings && window.InvoiceSettings.isEncryptionEnabled()) {
    data = encrypt(JSON.stringify(invoice));
  }
  
  localStorage.setItem('invoice_' + invoice.id, JSON.stringify(data));
}
```

### Files to Modify:
1. `invoice.js` - Add encryption toggle to settings modal
2. `storage.js` - Check encryption setting before encrypt/decrypt
3. `invoice.css` - Style for toggle setting

---

## Implementation Order

**Recommended sequence:**

1. **Business Config UI** (2-3 days)
   - Immediate user value
   - Removes placeholder TODOs
   - Foundation for other features

2. **Contract Wizard Edit** (2 days)
   - High user request
   - Completes contract management flow

3. **Email Integration** (3-4 days)
   - Requires backend work
   - Most complex feature
   - High business value

4. **Encryption Settings UI** (1-2 days)
   - Tests already exist
   - Quick win
   - Security improvement

5. ~~**Dashboard TanStack Query**~~ ✅ Already complete

---

## Testing Requirements

Each feature should include:

1. **Unit tests** - Pure function logic
2. **Playwright E2E tests** - User flows
3. **Manual iOS Safari testing** - Primary target platform

### Test Files to Create:
- `tests/business-settings.spec.js`
- `tests/contract-wizard-edit.spec.js`
- `tests/email-integration.spec.js`
- (encryption tests already exist)

---

## ES5 Compatibility Reminder

All frontend code must use:
- `var` instead of `let`/`const`
- `function()` instead of `() =>`
- String concatenation instead of template literals
- No destructuring or spread operators
- IIFE module pattern

---

*Last updated: 2025-07-11*
*4/5 features completed. Only Email Integration remains.*
