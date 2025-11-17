# 🐛 BUG #3: Missing GST Validation in Invoice Edit - Tax Compliance Risk

**Severity:** HIGH
**Priority:** P1
**Type:** Data Integrity / Tax Compliance
**Status:** Open
**Affects:** invoice.js (lines 1549-1568)
**Discovered:** 2025-11-17
**Discovered By:** Testing team during invoice editing tests

---

## Summary

The invoice edit form allows users to manually set **Subtotal** and **GST** to any values without validation that `GST = Subtotal × 0.10`. While the **Total** field auto-calculates correctly (Total = Subtotal + GST), the system accepts and saves invoices where the GST amount doesn't match the required 10% of subtotal, violating Australian tax law.

---

## Impact

### Tax Compliance Impact
- **ATO Reporting Errors:** Incorrect GST amounts reported to tax office
- **GST Audit Failure:** Tax audits will identify incorrect GST calculations
- **Financial Penalties:** ATO can fine for incorrect GST records
- **Legal Liability:** Business owner liable for incorrect tax collection

### Financial Impact
- **Revenue Recognition Errors:** Subtotal + incorrect GST = wrong total
- **BAS Submission Errors:** Business Activity Statement shows wrong GST
- **Customer Disputes:** Customers see incorrect GST on invoices
- **Reconciliation Issues:** GST collected doesn't match GST reported

### Data Integrity Impact
- **Inconsistent Records:** Some invoices have correct GST, others don't
- **Reporting Unreliable:** Cannot trust GST totals in financial reports
- **Audit Trail Broken:** No record of why GST is wrong

---

## Steps to Reproduce

1. Create invoice with:
   - Subtotal: $1000.00
   - GST: $100.00 (correct 10%)
   - Total: $1100.00

2. Click "Edit Invoice"

3. In edit form:
   - Change **Subtotal** to $1000.00 (keep same)
   - Manually change **GST** to $50.00 (incorrect - should be $100)
   - **Total** auto-calculates to $1050.00

4. Click "Save Changes"

5. Invoice saved with:
   ```javascript
   {
     subtotal: 1000.00,
     gst: 50.00,       // Only 5% instead of 10%!
     total: 1050.00,   // Calculation is correct (subtotal + gst)
   }
   ```

---

## Expected Behavior

### Option A: Auto-Calculate GST (Recommended)
- **GST field should be read-only** in edit form
- GST auto-calculates when subtotal changes:
  ```javascript
  subtotalInput.oninput = function() {
    var subtotal = parseFloat(subtotalInput.value) || 0;
    var gst = subtotal * 0.10;
    gstInput.value = gst.toFixed(2);
    gstInput.readOnly = true; // Cannot be manually edited
    updateTotal();
  };
  ```
- User cannot override GST calculation
- Always enforces 10% GST rate

### Option B: Validate GST on Save
- Allow manual GST entry BUT validate before saving:
  ```javascript
  var subtotal = parseFloat(subtotalInput.value);
  var gst = parseFloat(gstInput.value);
  var expectedGST = (subtotal * 0.10).toFixed(2);

  if (Math.abs(gst - expectedGST) > 0.01) { // Allow 1 cent rounding
    showError(
      'GST must be exactly 10% of subtotal.\n\n' +
      'Subtotal: $' + subtotal.toFixed(2) + '\n' +
      'Expected GST: $' + expectedGST + '\n' +
      'Your GST: $' + gst.toFixed(2)
    );
    return; // Prevent save
  }
  ```

### Option C: Warning with Override
- Validate GST but allow override with confirmation:
  ```javascript
  if (Math.abs(gst - expectedGST) > 0.01) {
    if (!confirm(
      'Warning: GST amount does not match 10% of subtotal.\n\n' +
      'This may violate tax requirements. Continue anyway?'
    )) {
      return;
    }
  }
  ```
- Log override to audit trail
- Flag invoice for review

---

## Actual Behavior (Current Bug)

- ✅ Subtotal field: Editable
- ✅ GST field: Editable (THIS IS THE PROBLEM)
- ✅ When subtotal changed: GST auto-recalculates (good)
- ✅ User can manually change GST after auto-calc (bad)
- ✅ Total = Subtotal + GST (calculation correct)
- ❌ No validation that GST = Subtotal × 10%
- ❌ Any GST value accepted
- ❌ Can save invoice with 5% GST, 15% GST, or $0 GST
- ❌ No warning shown

### Example Invalid Invoices Allowed:

```javascript
// 0% GST (incorrect)
{ subtotal: 1000, gst: 0, total: 1000 }

// 5% GST (incorrect)
{ subtotal: 1000, gst: 50, total: 1050 }

// 15% GST (incorrect)
{ subtotal: 1000, gst: 150, total: 1150 }

// Random GST (incorrect)
{ subtotal: 333.33, gst: 12.34, total: 345.67 }
```

All of these are **accepted and saved** without validation.

---

## Test Case

**Test:** Manual test in browser

**Steps:**
```javascript
// 1. Create invoice
// 2. Edit invoice
// 3. Set subtotal = $1000, GST = $50 (should be $100)
// 4. Save
// 5. Check database:
var invoice = JSON.parse(localStorage.getItem('invoice-database'))[0];
console.log('Subtotal:', invoice.subtotal);
console.log('GST:', invoice.gst);
console.log('Expected GST:', (invoice.subtotal * 0.10).toFixed(2));
console.log('Match:', invoice.gst === invoice.subtotal * 0.10);
```

**Expected:** Match = false (BUG confirmed)

---

## Code Location

**File:** `invoice.js`
**Lines:** 1549-1568
**Function:** Edit form auto-calculation

### Current Code:

```javascript
// invoice.js:1549-1568
// Calculate total when subtotal or GST changes
var subtotalInput = modal.querySelector('#editSubtotal');
var gstInput = modal.querySelector('#editGST');
var totalInput = modal.querySelector('#editTotal');

function updateTotal() {
  var subtotal = parseFloat(subtotalInput.value) || 0;
  var gst = parseFloat(gstInput.value) || 0;
  totalInput.value = (subtotal + gst).toFixed(2);
}

subtotalInput.oninput = function() {
  updateTotal();
  // Auto-calculate GST if changed
  var subtotal = parseFloat(subtotalInput.value) || 0;
  gstInput.value = (subtotal * 0.1).toFixed(2);
  updateTotal();
};

gstInput.oninput = updateTotal; // ❌ PROBLEM: Allows manual GST override
```

**Issue:** The `gstInput.oninput = updateTotal;` line allows users to manually change GST after it auto-calculates. There's no validation on save.

---

## Recommended Fix

### Severity: HIGH - Fix Before Production

**Recommended Approach:** Option A (Auto-Calculate, Read-Only)

### Fix 1: Make GST Read-Only

```javascript
// In createEditInvoiceModal() (invoice.js:1507-1510)
'<div class="form-group">' +
  '<label for="editGST">GST (10%) *</label>' +
  '<input type="number" id="editGST" step="0.01" value="' + invoice.gst.toFixed(2) + '" readonly style="background: rgba(31, 41, 55, 0.3);" />' +
  '<small>Automatically calculated as 10% of subtotal</small>' +
'</div>';
```

### Fix 2: Add Validation on Save (Belt and Suspenders)

```javascript
// In form submit handler (invoice.js:1571-1610)
modal.querySelector('#editInvoiceForm').onsubmit = function(e) {
  e.preventDefault();

  var subtotal = parseFloat(document.getElementById('editSubtotal').value);
  var gst = parseFloat(document.getElementById('editGST').value);
  var total = parseFloat(document.getElementById('editTotal').value);

  // ✅ ADD VALIDATION:
  var expectedGST = parseFloat((subtotal * 0.10).toFixed(2));
  var gstDiff = Math.abs(gst - expectedGST);

  if (gstDiff > 0.01) { // Allow 1 cent rounding error
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'GST must be exactly 10% of subtotal.\n' +
        'Expected: $' + expectedGST.toFixed(2) + '\n' +
        'Entered: $' + gst.toFixed(2)
      );
    }
    return; // Prevent save
  }

  // Verify total = subtotal + gst
  var expectedTotal = parseFloat((subtotal + gst).toFixed(2));
  var totalDiff = Math.abs(total - expectedTotal);

  if (totalDiff > 0.01) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(
        'Total must equal Subtotal + GST.\n' +
        'Expected: $' + expectedTotal.toFixed(2) + '\n' +
        'Shown: $' + total.toFixed(2)
      );
    }
    return;
  }

  // Continue with save...
  invoice.subtotal = subtotal;
  invoice.gst = gst;
  invoice.total = total;
  // ...
};
```

### Fix 3: Prevent Manual GST Override

```javascript
// Update event listeners (invoice.js:1560-1568)
subtotalInput.oninput = function() {
  var subtotal = parseFloat(subtotalInput.value) || 0;
  gstInput.value = (subtotal * 0.1).toFixed(2);
  updateTotal();
};

// ✅ REMOVE THIS LINE (don't allow manual GST changes):
// gstInput.oninput = updateTotal;  // DELETE

// ✅ REPLACE WITH:
gstInput.addEventListener('input', function(e) {
  // Prevent manual changes, revert to calculated value
  var subtotal = parseFloat(subtotalInput.value) || 0;
  gstInput.value = (subtotal * 0.1).toFixed(2);
  updateTotal();
});

// Or simply make field readonly and remove event listener entirely
```

---

## Australian GST Law Requirements

### GST Rate (ATO)
- Current GST rate: **10%** (effective since 2000)
- Applied to most goods and services
- Must be shown separately on tax invoices over $82.50

### Tax Invoice Requirements
- Must show: `GST: $XX.XX` (or `includes GST $XX.XX`)
- GST must be calculated correctly
- Incorrect GST = invalid tax invoice
- Recipients cannot claim input tax credit for invalid invoices

### Penalties
- **Incorrect BAS:** Penalties for incorrect reporting
- **Audit Issues:** Systematic errors flagged for investigation
- **Customer Impact:** Customers lose GST credit if invoice incorrect

### Reference
- [ATO: GST Rates](https://www.ato.gov.au/rates/gst/)
- [ATO: Tax Invoices](https://www.ato.gov.au/business/gst/tax-invoices/)

---

## Workaround (Until Fixed)

### For Users:
⚠️ **Always verify GST is exactly 10% of subtotal**

When editing invoices:
1. **Don't manually change GST field**
2. **Let it auto-calculate** when subtotal changes
3. **Use calculator** to verify: Subtotal × 0.10 = GST
4. **Double-check** before saving
5. **Print invoice** and review before sending to customer

### Verification Formula:
```
Expected GST = Subtotal × 0.10
Total = Subtotal + GST

Example:
Subtotal = $1,234.56
Expected GST = $123.46 (rounded from $123.456)
Total = $1,358.02
```

### For Developers:
- Add validation before production deployment
- Train users on GST calculation
- Regular audit of invoice GST amounts
- Automated check on app startup

---

## Detection Script

Run this in browser console to check for incorrect GST:

```javascript
// Detect invoices with incorrect GST
(function() {
  var invoices = JSON.parse(localStorage.getItem('invoice-database') || '[]');
  var incorrect = [];

  invoices.forEach(function(inv) {
    var expectedGST = parseFloat((inv.subtotal * 0.10).toFixed(2));
    var actualGST = parseFloat(inv.gst.toFixed(2));
    var diff = Math.abs(expectedGST - actualGST);

    if (diff > 0.01) { // More than 1 cent difference
      incorrect.push({
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        subtotal: inv.subtotal,
        expectedGST: expectedGST,
        actualGST: actualGST,
        difference: diff.toFixed(2)
      });
    }
  });

  if (incorrect.length > 0) {
    console.error('🚨 INVOICES WITH INCORRECT GST:');
    console.table(incorrect);
  } else {
    console.log('✓ All invoices have correct GST (10% of subtotal)');
  }

  return incorrect;
})();
```

---

## Related Issues

- **BUG #1:** Paid invoices editable (allows changing GST after payment)
- **Missing Feature:** GST rate configuration (for non-Australian use)
- **Missing Feature:** GST-exempt invoice support
- **Missing Feature:** Historical GST rate tracking (if rate changes)

---

## Testing Checklist

- [ ] GST field is read-only in edit form
- [ ] GST auto-calculates when subtotal changes
- [ ] Cannot manually override GST calculation
- [ ] Validation prevents saving incorrect GST
- [ ] Error message shown if GST wrong
- [ ] GST always exactly 10% of subtotal (±1 cent rounding)
- [ ] Total = Subtotal + GST (validated)
- [ ] Existing invoices with wrong GST detected
- [ ] Regression test: Quote creation still works
- [ ] Print view shows correct GST

---

## Acceptance Criteria

Fix is complete when:
- [ ] GST field cannot be manually edited (read-only)
- [ ] GST always calculated as subtotal × 0.10
- [ ] Validation prevents incorrect GST from being saved
- [ ] Error message shown if GST calculation wrong
- [ ] All new invoices have correct GST
- [ ] Detection script finds no incorrect GST invoices
- [ ] Manual testing confirms fix
- [ ] No regression in other features
- [ ] Documentation updated

---

## Labels

- `bug` 🐛
- `high-priority`
- `data-integrity`
- `tax-compliance`
- `invoice-system`
- `p1`
- `gst`
- `validation`

---

## References

- **Test Plan:** `docs/INVOICE_TESTING_CHECKLIST.md` (Test 4, Test 11)
- **Source Code:** `invoice.js:1549-1568, 1571-1610`
- **ATO GST Info:** https://www.ato.gov.au/rates/gst/
- **Related PR:** (will be linked when fix is created)
