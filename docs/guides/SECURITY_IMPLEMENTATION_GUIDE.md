# Security Implementation Guide - Next Steps

## ✅ What's Been Done

1. **Security Utilities Created** (`security.js`)
   - XSS prevention functions
   - Input validation (numbers & strings)
   - LocalStorage encryption (simple & advanced)
   - Safe JSON parsing
   - Utility functions

2. **Critical XSS Fixes Applied**
   - `app.js` - All quote export fields sanitized
   - `analytics.js` - Client names escaped

3. **Content Security Policy Added**
   - `index.html` - CSP meta tag configured

4. **Service Worker Hardened**
   - `sw.js` - Origin verification, path whitelisting, cache validation

5. **Test Suite Created**
   - `tests/security.spec.js` - Comprehensive security tests

6. **Documentation Complete**
   - `SECURITY.md` - Full security documentation

---

## 🚨 Critical Tasks Remaining (DO THESE FIRST!)

### Priority 0 - Fix Immediately (4-6 hours)

#### 1. Apply Safe JSON Parsing (1 hour)

**Files to update:**

**`invoice.js` line 33:**
```javascript
// BEFORE (UNSAFE):
var stored = localStorage.getItem(INVOICES_KEY);
invoices = stored ? JSON.parse(stored) : [];

// AFTER (SAFE):
invoices = window.Security.safeJSONParse(
  localStorage.getItem(INVOICES_KEY),
  null,
  []
);
```

**`invoice.js` line 59:**
```javascript
// BEFORE:
var stored = localStorage.getItem(INVOICE_SETTINGS_KEY);
return stored ? JSON.parse(stored) : getDefaultSettings();

// AFTER:
return window.Security.safeJSONParse(
  localStorage.getItem(INVOICE_SETTINGS_KEY),
  null,
  getDefaultSettings()
);
```

**`client-database.js` line 13:**
```javascript
// BEFORE:
var stored = localStorage.getItem(CLIENTS_KEY);
clients = stored ? JSON.parse(stored) : [];

// AFTER:
clients = window.Security.safeJSONParse(
  localStorage.getItem(CLIENTS_KEY),
  null,
  []
);
```

**`analytics.js` line 80:**
```javascript
// BEFORE:
var stored = localStorage.getItem(HISTORY_KEY);
return stored ? JSON.parse(stored) : [];

// AFTER:
return window.Security.safeJSONParse(
  localStorage.getItem(HISTORY_KEY),
  null,
  []
);
```

**`templates.js` line 338:**
```javascript
// BEFORE:
var stored = localStorage.getItem('quoteTemplates');
return stored ? JSON.parse(stored) : {};

// AFTER:
return window.Security.safeJSONParse(
  localStorage.getItem('quoteTemplates'),
  null,
  {}
);
```

**`import-export.js` line 90:**
```javascript
// BEFORE:
var backup = JSON.parse(e.target.result);

// AFTER:
var backup = window.Security.safeJSONParse(
  e.target.result,
  null,
  null
);
if (!backup) {
  alert('Invalid backup file format');
  return;
}
```

---

#### 2. Add Input Validation to Payments (1 hour)

**`invoice.js` line 229-241:**

```javascript
// BEFORE:
var payment = {
  amount: parseFloat(paymentData.amount) || 0,
  // ...
};

// AFTER:
var payment = {
  amount: window.Security.validateCurrency(
    paymentData.amount,
    'Payment Amount'
  ),
  // ...
};
```

---

#### 3. Implement LocalStorage Encryption for Critical Data (2-3 hours)

**Option A: Simple Encryption (Quick Implementation)**

**`invoice.js` - Modify save/load functions:**

```javascript
// Add at top of file
var ENCRYPTION_KEY = 'tictacstick-2025-secure'; // TODO: Make this user-configurable

// Initialize encryption
window.Security.SecureStorage.setKey(ENCRYPTION_KEY);

// UPDATE saveInvoices() function:
function saveInvoices() {
  window.Security.SecureStorage.setItem(INVOICES_KEY, invoices);
}

// UPDATE loadInvoices() function:
function loadInvoices() {
  invoices = window.Security.SecureStorage.getItem(INVOICES_KEY, []);
}

// Same pattern for invoice settings:
function saveInvoiceSettings(settings) {
  window.Security.SecureStorage.setItem(INVOICE_SETTINGS_KEY, settings);
}

function loadInvoiceSettings() {
  return window.Security.SecureStorage.getItem(
    INVOICE_SETTINGS_KEY,
    getDefaultSettings()
  );
}
```

**`client-database.js` - Same pattern:**

```javascript
window.Security.SecureStorage.setKey(ENCRYPTION_KEY);

function saveClients() {
  window.Security.SecureStorage.setItem(CLIENTS_KEY, clients);
}

function loadClients() {
  clients = window.Security.SecureStorage.getItem(CLIENTS_KEY, []);
}
```

**Option B: Advanced Encryption (More Secure, Async)**

Implement user password prompt on app load:
1. Show password modal on first visit
2. Store encrypted key derivation salt
3. Use Web Crypto API for AES-256-GCM encryption
4. Auto-lock after 15 minutes inactivity

---

#### 4. Add Validation to Form Inputs (1-2 hours)

**`app.js` - Update buildStateFromUI() function (lines 108-125):**

```javascript
// BEFORE:
var baseFee = Math.max(0, parseFloat($("baseFeeInput").value) || 0);
var hourlyRate = Math.max(0, parseFloat($("hourlyRateInput").value) || 0);

// AFTER:
var baseFee = window.Security.validateCurrency(
  $("baseFeeInput").value,
  'Base Fee'
);
var hourlyRate = window.Security.validateNumber(
  $("hourlyRateInput").value,
  {
    min: 0,
    max: 500,
    decimals: 2,
    fallback: 95,
    fieldName: 'Hourly Rate'
  }
);

var minimumJob = window.Security.validateCurrency(
  $("minimumJobInput").value,
  'Minimum Job'
);

// Continue for all numeric inputs...
```

**`app.js` - Update line input handlers:**

```javascript
// Line 400 - Window panes validation:
panesInput.addEventListener("input", function (e) {
  var val = window.Security.validatePositiveInteger(
    e.target.value,
    1,
    100,
    'Pane Count'
  );
  line.panes = val;
  scheduleAutosave(true);
  recalculate();
});

// Line 630 - Pressure area validation:
areaInput.addEventListener("input", function (e) {
  var val = window.Security.validateNumber(
    e.target.value,
    {
      min: 0.1,
      max: 10000,
      decimals: 2,
      fallback: 30,
      fieldName: 'Area (sqm)'
    }
  );
  line.areaSqm = val;
  scheduleAutosave(true);
  recalculate();
});
```

---

## 🟡 High Priority Tasks (This Week)

### 1. Add Email/Phone Validation to Client Database

**`client-database.js` line 48-49:**

```javascript
// BEFORE:
var client = {
  email: clientData.email || '',
  phone: clientData.phone || '',
};

// AFTER:
var client = {
  email: window.Security.validateEmail(clientData.email || ''),
  phone: window.Security.validatePhone(clientData.phone || ''),
};
```

### 2. Add BSB/ABN Validation to Invoice Settings

**`invoice.js` line 705-712:**

```javascript
// AFTER reading form values:
try {
  settings.bsb = window.Security.validateBSB(
    document.getElementById('bsb').value
  );
  settings.abn = window.Security.validateABN(
    document.getElementById('abn').value
  );
} catch (e) {
  alert(e.message);
  return; // Don't save invalid settings
}
```

### 3. Add String Length Limits

Add `maxlength` attribute to all text inputs in `index.html`:

```html
<input id="clientNameInput" type="text" maxlength="100" placeholder="Client name" />
<input id="clientLocationInput" type="text" maxlength="200" placeholder="Suburb / area" />
<textarea id="clientNotesInput" maxlength="1000" placeholder="Notes..."></textarea>
```

---

## 📊 Testing Checklist

After implementing changes, run:

```bash
# Security tests
npm test -- tests/security.spec.js

# All tests
npm test

# Manual testing with XSS payloads
```

**Manual Test Payloads:**

1. Client Name: `<script>alert('XSS')</script>`
2. Hourly Rate: `Infinity`
3. Pane Count: `-5`
4. Payment Amount: `999999999`
5. Email: `not-an-email`
6. Phone: `abc123`

**Verify:**
- No alerts execute
- Invalid inputs rejected or clamped
- App doesn't crash
- Data validates correctly

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All P0 tasks completed
- [ ] All security tests passing
- [ ] Manual XSS testing passed
- [ ] LocalStorage encryption enabled for critical data
- [ ] CSP tightened (remove 'unsafe-inline' if possible)
- [ ] Service Worker cache verified
- [ ] Backup/restore tested with encrypted data
- [ ] Session timeout implemented (optional but recommended)
- [ ] Security audit performed
- [ ] Documentation updated

---

## 💡 Quick Wins (Low Effort, High Impact)

1. **Add CSP Reporting** (10 min)
   - Add `report-uri` to CSP header
   - Monitor violations

2. **Implement Session Timeout** (30 min)
   - Clear encryption key after 15 min inactivity
   - Re-prompt for password

3. **Add Audit Logging** (1 hour)
   - Log all invoice creation/editing
   - Log all payment records
   - Log all exports

4. **Sanitize Logs** (15 min)
   - Use `window.Security.sanitizeForLogging()` before console.log
   - Prevent leaking sensitive data in error logs

---

## 🆘 Help & Support

**If you encounter issues:**

1. Check browser console for errors
2. Verify security.js is loaded: `console.log(window.Security)`
3. Test functions in console: `window.Security.escapeHTML('<script>test</script>')`
4. Review SECURITY.md for detailed documentation
5. Run security tests: `npm test -- tests/security.spec.js`

**Common Issues:**

- **"window.Security is undefined"** - security.js not loaded, check script order in index.html
- **"Function is not defined"** - Typo in function name, check SECURITY.md API reference
- **Encryption fails** - Key not set, call `SecureStorage.setKey()` first
- **Tests fail** - Clear cache and reload: `localStorage.clear()`

---

## 📈 Success Metrics

**After implementation, verify:**

- ✅ 0 XSS vulnerabilities in penetration testing
- ✅ All input validation tests passing
- ✅ LocalStorage data encrypted (check DevTools → Application → LocalStorage)
- ✅ Service Worker only caches whitelisted files
- ✅ No console errors related to security functions
- ✅ App works offline with encrypted data
- ✅ Backup/restore works with encryption

---

**Estimated Total Time to Complete:**
- P0 Tasks: **4-6 hours**
- P1 Tasks: **2-3 hours**
- Testing: **1-2 hours**
- **Total: 7-11 hours** (1-2 work days)

**Priority Order:**
1. Safe JSON parsing (prevents crashes)
2. Payment validation (prevents financial corruption)
3. LocalStorage encryption (protects sensitive data)
4. Form input validation (improves data quality)

---

**Good luck! 🔒 Reach out if you need help with implementation.**
