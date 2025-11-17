# Bug Fix Implementation Plan - Invoice System

**Version:** 1.0
**Created:** 2025-11-17
**Target File:** invoice.js
**Estimated Time:** 4-6 hours
**Risk Level:** Medium (modifying financial code)

---

## Executive Summary

This document provides detailed implementation steps to fix **3 critical bugs** identified in the invoice system during testing verification. All bugs relate to data integrity and tax compliance.

### Bugs to Fix:

1. **BUG #1 (CRITICAL):** Paid invoices can be edited → Data corruption
2. **BUG #2 (CRITICAL):** Duplicate invoice numbers possible → Compliance violation
3. **BUG #3 (HIGH):** GST validation missing → Tax reporting errors

### Implementation Strategy:

- **Phased approach:** Fix bugs incrementally, test after each
- **Backward compatible:** Existing invoices continue to work
- **Progressive enhancement:** Add data integrity checks
- **Defensive programming:** Validate at multiple layers

---

## Pre-Implementation Checklist

Before making any changes:

- [ ] **Backup current code:**
  ```bash
  cp invoice.js invoice.js.backup.$(date +%Y%m%d_%H%M%S)
  ```

- [ ] **Backup LocalStorage data:**
  ```javascript
  // Run in browser console:
  var backup = {
    invoices: localStorage.getItem('invoice-database'),
    settings: localStorage.getItem('invoice-settings'),
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(backup));
  // Copy output to file: invoice-data-backup-YYYYMMDD.json
  ```

- [ ] **Create feature branch:**
  ```bash
  git checkout -b fix/invoice-critical-bugs
  ```

- [ ] **Run existing tests (baseline):**
  ```bash
  npx playwright test invoice-interface.spec.js
  npx playwright test invoice-functional.spec.js
  ```

- [ ] **Document current behavior:**
  - Take screenshots of invoice UI
  - Export sample invoice data
  - Note any existing workarounds

---

## Bug Fix #1: Prevent Editing Paid Invoices

**File:** invoice.js
**Severity:** CRITICAL (P0)
**Estimated Time:** 1.5 hours

### Changes Required:

#### Change 1.1: Add Status Validation in editInvoice() Function

**Location:** invoice.js, line ~1435-1448
**Current Code:**
```javascript
function editInvoice(invoiceId) {
  var invoice = getInvoice(invoiceId);
  if (!invoice) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError('Invoice not found');
    }
    return;
  }

  var modal = createEditInvoiceModal(invoice);
  document.body.appendChild(modal);
  modal.classList.add('active');
}
```

**New Code:**
```javascript
function editInvoice(invoiceId) {
  var invoice = getInvoice(invoiceId);
  if (!invoice) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError('Invoice not found');
    }
    return;
  }

  // ✅ NEW: Prevent editing paid invoices
  if (invoice.status === 'paid' && invoice.amountPaid > 0) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'Cannot edit paid invoices. Paid invoices are locked to maintain financial integrity. ' +
        'If you need to make corrections, please create a credit note or contact support.'
      );
    }
    return; // Block editing
  }

  // Optional: Warn about editing partially paid invoices
  if (invoice.amountPaid > 0 && invoice.status !== 'paid') {
    if (!confirm(
      'Warning: This invoice has partial payments recorded ($' + invoice.amountPaid.toFixed(2) + '). ' +
      'Editing may create data inconsistencies.\n\n' +
      'Continue editing?'
    )) {
      return; // User cancelled
    }
  }

  var modal = createEditInvoiceModal(invoice);
  document.body.appendChild(modal);
  modal.classList.add('active');
}
```

#### Change 1.2: Hide Edit Button for Paid Invoices in UI

**Location:** invoice.js, line ~610-611
**Current Code:**
```javascript
html += '<button type="button" class="btn btn-small btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')">Edit</button>';
```

**New Code:**
```javascript
// Show edit button only for non-paid invoices
if (invoice.status === 'paid') {
  html += '<button type="button" class="btn btn-small btn-secondary" disabled title="Paid invoices cannot be edited">🔒 Locked</button>';
} else {
  html += '<button type="button" class="btn btn-small btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')">Edit</button>';
}
```

#### Change 1.3: Add Visual Indicator in Invoice Detail View

**Location:** invoice.js, line ~827-835 (invoice detail actions)
**Current Code:**
```javascript
html += '<div class="invoice-detail-actions">';
html += '<button type="button" class="btn btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')">Edit Invoice</button>';
```

**New Code:**
```javascript
html += '<div class="invoice-detail-actions">';

// Show edit button only if not paid
if (invoice.status === 'paid') {
  html += '<div class="invoice-locked-notice" style="background: rgba(34, 197, 94, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 12px;">';
  html += '🔒 This invoice is paid and locked. Paid invoices cannot be edited to maintain financial integrity.';
  html += '</div>';
} else {
  html += '<button type="button" class="btn btn-primary" onclick="window.InvoiceManager.editInvoice(\'' + invoice.id + '\')">Edit Invoice</button>';
}
```

### Testing Steps for Fix #1:

1. **Test 1:** Create invoice, pay it fully, try to edit
   - Expected: Error message, edit blocked
2. **Test 2:** Create invoice, partial payment, try to edit
   - Expected: Warning shown, can proceed if confirmed
3. **Test 3:** Create invoice (unpaid), try to edit
   - Expected: Edit works normally
4. **Test 4:** Check UI shows locked icon for paid invoices
5. **Test 5:** Run Playwright test: `BUG #1`
   - Update test to verify edit is blocked

---

## Bug Fix #2: Prevent Duplicate Invoice Numbers

**File:** invoice.js
**Severity:** CRITICAL (P0)
**Estimated Time:** 2 hours

### Changes Required:

#### Change 2.1: Add Helper Function to Get Highest Invoice Number

**Location:** invoice.js, line ~290 (after getInvoiceByNumber)
**Add New Function:**
```javascript
// Get highest invoice number from existing invoices
function getHighestInvoiceNumber() {
  if (invoices.length === 0) {
    return 0;
  }

  var highest = 0;
  invoices.forEach(function(invoice) {
    // Extract numeric portion from invoice number
    // Handle formats like "INV-1001", "QUOTE-5000", etc.
    var numStr = invoice.invoiceNumber.replace(settings.invoicePrefix, '');
    var num = parseInt(numStr);

    if (!isNaN(num) && num > highest) {
      highest = num;
    }
  });

  return highest;
}
```

#### Change 2.2: Add Uniqueness Check in getNextInvoiceNumber()

**Location:** invoice.js, line ~84-90
**Current Code:**
```javascript
function getNextInvoiceNumber() {
  var number = settings.invoicePrefix + settings.nextInvoiceNumber;
  settings.nextInvoiceNumber++;
  saveSettings();
  return number;
}
```

**New Code:**
```javascript
function getNextInvoiceNumber() {
  var number;
  var attempts = 0;
  var maxAttempts = 10000;

  // ✅ NEW: Check for uniqueness, skip duplicates
  do {
    number = settings.invoicePrefix + settings.nextInvoiceNumber;
    settings.nextInvoiceNumber++;
    attempts++;

    // Safety: prevent infinite loop
    if (attempts > maxAttempts) {
      console.error('[INVOICE] Failed to generate unique invoice number after ' + maxAttempts + ' attempts');
      // Use timestamp-based fallback
      number = settings.invoicePrefix + Date.now();
      break;
    }
  } while (getInvoiceByNumber(number) !== null); // Loop until unique

  saveSettings();

  DEBUG.log('[INVOICE] Generated invoice number: ' + number +
    (attempts > 1 ? ' (skipped ' + (attempts - 1) + ' duplicates)' : ''));

  return number;
}
```

#### Change 2.3: Validate Settings on Save (Prevent Decreasing Counter)

**Location:** invoice.js, line ~702-722 (settings form submit)
**Current Code:**
```javascript
modal.querySelector('#invoiceSettingsForm').onsubmit = function(e) {
  e.preventDefault();

  settings.invoicePrefix = document.getElementById('invoicePrefix').value;
  settings.nextInvoiceNumber = parseInt(document.getElementById('nextInvoiceNumber').value) || 1001;
  settings.paymentTermsDays = parseInt(document.getElementById('paymentTermsDays').value) || 7;
  // ...

  saveSettings();
```

**New Code:**
```javascript
modal.querySelector('#invoiceSettingsForm').onsubmit = function(e) {
  e.preventDefault();

  var newPrefix = document.getElementById('invoicePrefix').value;
  var newNumber = parseInt(document.getElementById('nextInvoiceNumber').value) || 1001;
  var newPaymentTerms = parseInt(document.getElementById('paymentTermsDays').value) || 7;

  // ✅ NEW: Validate invoice number changes
  if (invoices.length > 0) {
    // Get highest existing invoice number
    var highestNumber = getHighestInvoiceNumber();

    // If same prefix, check number isn't below highest existing
    if (newPrefix === settings.invoicePrefix && newNumber <= highestNumber) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showError(
          'Invalid Invoice Number\n\n' +
          'The next invoice number (' + newNumber + ') must be greater than the highest existing invoice number (' + highestNumber + ').\n\n' +
          'Invoices exist in the database that would create duplicate numbers.'
        );
      }
      return; // Block save
    }

    // If changing prefix, warn about potential confusion
    if (newPrefix !== settings.invoicePrefix) {
      if (!confirm(
        'Warning: Changing Invoice Prefix\n\n' +
        'Changing from "' + settings.invoicePrefix + '" to "' + newPrefix + '"\n\n' +
        'This will change the format of all NEW invoices. Existing invoices keep their current numbers.\n\n' +
        'Continue?'
      )) {
        return; // User cancelled
      }
    }
  }

  // Warn if decreasing number (even if no invoices yet)
  if (newNumber < settings.nextInvoiceNumber) {
    if (!confirm(
      'Warning: Decreasing Invoice Counter\n\n' +
      'Changing from ' + settings.nextInvoiceNumber + ' to ' + newNumber + '\n\n' +
      'This may create duplicate invoice numbers if you have archived invoices elsewhere.\n\n' +
      'Are you sure?'
    )) {
      return; // User cancelled
    }
  }

  // Apply changes
  settings.invoicePrefix = newPrefix;
  settings.nextInvoiceNumber = newNumber;
  settings.paymentTermsDays = newPaymentTerms;
  // ... rest of settings

  saveSettings();

  if (window.ErrorHandler) {
    window.ErrorHandler.showSuccess('Settings saved');
  }

  modal.classList.remove('active');
  setTimeout(function() { modal.remove(); }, 300);
};
```

#### Change 2.4: Add Startup Duplicate Detection (Optional but Recommended)

**Location:** invoice.js, line ~1657-1667 (init function)
**Add After:** `loadInvoices()` and `loadSettings()`
```javascript
function init() {
  loadInvoices();
  loadSettings();
  addInvoiceButton();

  // Check for overdue invoices daily
  checkOverdueInvoices();

  // ✅ NEW: Check for duplicate invoice numbers on startup
  checkDuplicateInvoiceNumbers();

  DEBUG.log('[INVOICE] Invoice manager initialized (' + invoices.length + ' invoices)');
}

// Add new function before init()
function checkDuplicateInvoiceNumbers() {
  var numbers = {};
  var duplicates = [];

  invoices.forEach(function(invoice) {
    var num = invoice.invoiceNumber;
    if (numbers[num]) {
      duplicates.push({
        number: num,
        invoices: [numbers[num].id, invoice.id]
      });
    } else {
      numbers[num] = invoice;
    }
  });

  if (duplicates.length > 0) {
    console.error('[INVOICE] WARNING: Duplicate invoice numbers detected:');
    duplicates.forEach(function(dup) {
      console.error('  - Number: ' + dup.number + ', Invoice IDs: ' + dup.invoices.join(', '));
    });

    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'Data Integrity Warning\n\n' +
        'Duplicate invoice numbers detected (' + duplicates.length + ' duplicates).\n\n' +
        'Check browser console for details. Please export your data and contact support.'
      );
    }
  }

  return duplicates;
}
```

### Testing Steps for Fix #2:

1. **Test 1:** Create 3 invoices, verify sequential numbering
2. **Test 2:** Try to decrease counter in settings
   - Expected: Error or warning shown
3. **Test 3:** Create invoice after Fix #2
   - Expected: No duplicates, skips over any existing numbers
4. **Test 4:** Manually create duplicate invoice numbers (before fix)
   - Expected: Startup check detects and warns
5. **Test 5:** Run Playwright test: `BUG #2`

---

## Bug Fix #3: GST Validation in Invoice Edit

**File:** invoice.js
**Severity:** HIGH (P1)
**Estimated Time:** 1 hour

### Changes Required:

#### Change 3.1: Make GST Field Read-Only

**Location:** invoice.js, line ~1507-1510
**Current Code:**
```javascript
'<div class="form-group">' +
  '<label for="editGST">GST (10%) *</label>' +
  '<input type="number" id="editGST" step="0.01" value="' + invoice.gst.toFixed(2) + '" required />' +
'</div>';
```

**New Code:**
```javascript
'<div class="form-group">' +
  '<label for="editGST">GST (10%) *</label>' +
  '<input type="number" id="editGST" step="0.01" value="' + invoice.gst.toFixed(2) + '" readonly style="background: rgba(31, 41, 55, 0.3); cursor: not-allowed;" title="Auto-calculated as 10% of subtotal" />' +
  '<small style="color: rgba(255,255,255,0.6); font-size: 12px;">Auto-calculated (10% of subtotal)</small>' +
'</div>';
```

#### Change 3.2: Remove Manual GST Override Event Listener

**Location:** invoice.js, line ~1568
**Current Code:**
```javascript
gstInput.oninput = updateTotal;
```

**New Code:**
```javascript
// ✅ REMOVED: Don't allow manual GST changes
// gstInput.oninput = updateTotal;

// Instead, make it re-calculate if user somehow changes it
gstInput.addEventListener('input', function(e) {
  e.preventDefault();
  // Force recalculation from subtotal
  var subtotal = parseFloat(subtotalInput.value) || 0;
  gstInput.value = (subtotal * 0.1).toFixed(2);
  updateTotal();
});
```

#### Change 3.3: Add Validation on Form Submit

**Location:** invoice.js, line ~1571-1598 (form submit handler)
**Add After:** Line ~1573 (after e.preventDefault())
```javascript
modal.querySelector('#editInvoiceForm').onsubmit = function(e) {
  e.preventDefault();

  // ✅ NEW: Validate GST before saving
  var subtotal = parseFloat(document.getElementById('editSubtotal').value);
  var gst = parseFloat(document.getElementById('editGST').value);
  var total = parseFloat(document.getElementById('editTotal').value);

  // Validate GST = 10% of subtotal (allow 1 cent rounding tolerance)
  var expectedGST = parseFloat((subtotal * 0.10).toFixed(2));
  var gstDiff = Math.abs(gst - expectedGST);

  if (gstDiff > 0.01) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'Invalid GST Amount\n\n' +
        'GST must be exactly 10% of subtotal.\n\n' +
        'Subtotal: $' + subtotal.toFixed(2) + '\n' +
        'Expected GST: $' + expectedGST.toFixed(2) + '\n' +
        'Current GST: $' + gst.toFixed(2) + '\n\n' +
        'Please verify your amounts.'
      );
    }
    return; // Block save
  }

  // Validate Total = Subtotal + GST
  var expectedTotal = parseFloat((subtotal + gst).toFixed(2));
  var totalDiff = Math.abs(total - expectedTotal);

  if (totalDiff > 0.01) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'Invalid Total Amount\n\n' +
        'Total must equal Subtotal + GST.\n\n' +
        'Expected: $' + expectedTotal.toFixed(2) + '\n' +
        'Current: $' + total.toFixed(2)
      );
    }
    return; // Block save
  }

  // Update invoice data
  invoice.clientName = document.getElementById('editClientName').value;
  // ... rest of existing code
```

#### Change 3.4: Add GST Validation Function (Reusable)

**Location:** invoice.js, line ~1430 (before editInvoice function)
**Add New Function:**
```javascript
// Validate GST calculation is correct (10% of subtotal)
function validateGSTCalculation(subtotal, gst, tolerance) {
  if (typeof tolerance === 'undefined') {
    tolerance = 0.01; // Default: 1 cent
  }

  var expectedGST = parseFloat((subtotal * 0.10).toFixed(2));
  var actualGST = parseFloat(gst.toFixed(2));
  var difference = Math.abs(expectedGST - actualGST);

  return {
    valid: difference <= tolerance,
    expectedGST: expectedGST,
    actualGST: actualGST,
    difference: difference
  };
}
```

### Testing Steps for Fix #3:

1. **Test 1:** Edit invoice, change subtotal
   - Expected: GST auto-recalculates, read-only
2. **Test 2:** Try to manually change GST field
   - Expected: Field is read-only, cannot change
3. **Test 3:** Verify validation on save
   - Expected: Incorrect GST prevented, error shown
4. **Test 4:** Create invoice from quote
   - Expected: GST still calculates correctly (no regression)
5. **Test 5:** Check existing invoices with wrong GST
   - Use detection script, fix manually if needed

---

## Additional Improvements (Recommended)

### Improvement 1: Add Audit Trail to Invoice Edits

**Location:** invoice.js, line ~1597 (in edit submit handler)
**Add Before:** `saveInvoices()`

```javascript
// Track edit history
if (!invoice.editHistory) {
  invoice.editHistory = [];
}

invoice.editHistory.push({
  timestamp: Date.now(),
  changes: {
    subtotal: { old: oldSubtotal, new: invoice.subtotal },
    gst: { old: oldGST, new: invoice.gst },
    total: { old: oldTotal, new: invoice.total }
  },
  note: 'Invoice edited'
});
```

### Improvement 2: Add Data Export Functionality

**Purpose:** Allow users to backup invoice data before making changes

**Location:** invoice.js, add to public API (line ~1683)

```javascript
window.InvoiceManager = {
  // ... existing methods
  exportData: exportInvoiceData,
  importData: importInvoiceData
};

// Add export function
function exportInvoiceData() {
  var data = {
    invoices: invoices,
    settings: settings,
    exportDate: Date.now(),
    version: '1.0'
  };

  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);

  var a = document.createElement('a');
  a.href = url;
  a.download = 'invoice-data-export-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## Implementation Order

### Day 1: Critical Bugs
1. ✅ Backup everything
2. ✅ Fix Bug #2 (Duplicate numbers) - Most critical for compliance
3. ✅ Test Bug #2 fix thoroughly
4. ✅ Fix Bug #1 (Paid invoice editing) - Data integrity
5. ✅ Test Bug #1 fix thoroughly
6. ✅ Commit: `fix: prevent duplicate invoice numbers and paid invoice editing`

### Day 2: Validation & Testing
7. ✅ Fix Bug #3 (GST validation)
8. ✅ Test Bug #3 fix
9. ✅ Run full test suite (Playwright)
10. ✅ Manual testing with real data
11. ✅ Commit: `fix: add GST validation in invoice edit`

### Day 3: Polish & Deploy
12. ✅ Add audit trail (optional)
13. ✅ Add data export (optional)
14. ✅ Update documentation
15. ✅ Final testing
16. ✅ Deploy to production

---

## Testing Checklist

After implementing all fixes:

### Automated Tests
- [ ] `npx playwright test invoice-interface.spec.js` - UI tests pass
- [ ] `npx playwright test invoice-functional.spec.js` - Functional tests pass
- [ ] Bug #1 test: Paid invoice editing blocked
- [ ] Bug #2 test: Duplicate numbers prevented
- [ ] Bug #3 test: GST validation works

### Manual Tests
- [ ] Create invoice → works
- [ ] Pay invoice → works
- [ ] Try to edit paid invoice → blocked ✓
- [ ] Create 5 invoices → sequential numbering ✓
- [ ] Change settings counter to lower value → warning/error ✓
- [ ] Edit invoice subtotal → GST auto-recalculates ✓
- [ ] Try to manually change GST → field is read-only ✓
- [ ] All existing features still work (no regression)

### Data Integrity Tests
- [ ] Run duplicate detection script → no duplicates
- [ ] Run GST validation script → all invoices have correct GST
- [ ] Check LocalStorage data structure → valid
- [ ] Export/backup data → successful
- [ ] Refresh page → all data persists

---

## Rollback Plan

If issues arise after deployment:

### Immediate Rollback:
```bash
# Restore backup file
cp invoice.js.backup.YYYYMMDD_HHMMSS invoice.js

# Or git revert
git revert <commit-hash>
git push origin <branch>
```

### Data Restoration:
```javascript
// Restore LocalStorage from backup
var backup = <paste backup JSON>;
localStorage.setItem('invoice-database', backup.invoices);
localStorage.setItem('invoice-settings', backup.settings);
```

### Communication:
- Notify users of rollback
- Document issues encountered
- Plan fix and re-deployment

---

## Post-Implementation Tasks

After fixes deployed:

- [ ] Update CHANGELOG.md
- [ ] Update user documentation
- [ ] Train users on new behavior:
  - Paid invoices cannot be edited
  - Invoice numbering more strict
  - GST auto-calculated
- [ ] Monitor for issues (first week)
- [ ] Close GitHub issues (Bug #1, #2, #3)
- [ ] Update test plan with actual results
- [ ] Consider additional enhancements:
  - Credit note feature
  - Invoice version history
  - Enhanced audit trail

---

## Code Review Checklist

Before merging:

- [ ] All code changes documented
- [ ] Comments added to complex logic
- [ ] DEBUG.log statements added where appropriate
- [ ] Error messages are user-friendly
- [ ] No console.log() in production code (use DEBUG.log)
- [ ] Backward compatible with existing invoices
- [ ] No hardcoded values (use constants)
- [ ] Functions have single responsibility
- [ ] Code follows existing style/conventions
- [ ] No security vulnerabilities introduced
- [ ] Performance impact minimal

---

## Risk Mitigation

### Risks:
1. **Breaking existing invoices** → Mitigated by: Backward compatibility testing
2. **Data loss** → Mitigated by: Backups before deployment
3. **User confusion** → Mitigated by: Clear error messages, documentation
4. **Performance degradation** → Mitigated by: Validation only on save, not real-time
5. **Edge cases** → Mitigated by: Comprehensive test coverage

### Monitoring:
- Check browser console for errors
- Monitor user feedback
- Review invoice data integrity weekly
- Track support tickets related to invoices

---

## Success Criteria

Fixes are successful when:

- [ ] All 3 bugs fixed and verified
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] No regressions identified
- [ ] User documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to production
- [ ] No user-reported issues for 1 week

---

## Appendix: Code Snippets

### Useful Detection Scripts

#### Detect All Issues:
```javascript
// Run comprehensive invoice data integrity check
(function() {
  var invoices = JSON.parse(localStorage.getItem('invoice-database') || '[]');

  console.log('=== Invoice Data Integrity Check ===');
  console.log('Total invoices:', invoices.length);

  // Check 1: Duplicate invoice numbers
  var duplicates = [];
  var numbers = {};
  invoices.forEach(function(inv) {
    if (numbers[inv.invoiceNumber]) {
      duplicates.push(inv.invoiceNumber);
    } else {
      numbers[inv.invoiceNumber] = true;
    }
  });
  console.log('Duplicate invoice numbers:', duplicates.length, duplicates);

  // Check 2: Incorrect GST
  var incorrectGST = [];
  invoices.forEach(function(inv) {
    var expected = parseFloat((inv.subtotal * 0.10).toFixed(2));
    var actual = parseFloat(inv.gst.toFixed(2));
    if (Math.abs(expected - actual) > 0.01) {
      incorrectGST.push({
        invoiceNumber: inv.invoiceNumber,
        expected: expected,
        actual: actual
      });
    }
  });
  console.log('Invoices with incorrect GST:', incorrectGST.length, incorrectGST);

  // Check 3: Editable paid invoices (can't detect, but can list them)
  var paidInvoices = invoices.filter(i => i.status === 'paid');
  console.log('Paid invoices (should be locked):', paidInvoices.length);

  console.log('=== Check Complete ===');

  return {
    duplicates: duplicates,
    incorrectGST: incorrectGST,
    paidInvoices: paidInvoices.length
  };
})();
```

---

**END OF IMPLEMENTATION PLAN**
