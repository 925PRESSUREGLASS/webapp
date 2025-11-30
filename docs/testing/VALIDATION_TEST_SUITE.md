# Invoice Validation System - Test Suite

## Overview

This document contains comprehensive test cases for the invoice validation system. Run these tests after integration to verify everything works correctly.

**Total Test Cases:** 50+
**Estimated Test Time:** 2 hours
**Required Tools:** Browser (Chrome/Safari), Developer Console

---

## Table of Contents

1. [Setup](#setup)
2. [Invoice Validation Tests](#invoice-validation-tests)
3. [Payment Validation Tests](#payment-validation-tests)
4. [Edge Case Tests](#edge-case-tests)
5. [Integration Tests](#integration-tests)
6. [Performance Tests](#performance-tests)
7. [Browser Compatibility Tests](#browser-compatibility-tests)

---

## Setup

### Test Environment Setup

1. Open TicTacStick application in browser
2. Open browser Developer Console (F12)
3. Clear LocalStorage (optional, for clean tests):
   ```javascript
   localStorage.clear();
   ```
4. Reload page

### Verify Validation Module Loaded

Run in console:
```javascript
console.log('Validation loaded:', !!window.InvoiceValidation);
// Expected: true
```

### Helper Functions for Testing

Add these helper functions to console for easier testing:

```javascript
// Helper: Create valid invoice
function createValidInvoice() {
  return {
    id: 'test_invoice_' + Date.now(),
    invoiceNumber: 'INV-' + Date.now(),
    createdDate: Date.now(),
    invoiceDate: Date.now(),
    dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
    status: 'draft',
    clientName: 'Test Client',
    clientLocation: 'Sydney',
    clientEmail: 'test@example.com',
    clientPhone: '0400123456',
    quoteTitle: 'Test Quote',
    windowLines: [
      { description: 'Window cleaning', price: 500 }
    ],
    pressureLines: [],
    subtotal: 500.00,
    gst: 50.00,
    total: 550.00,
    amountPaid: 0,
    balance: 550.00,
    payments: [],
    internalNotes: '',
    clientNotes: '',
    statusHistory: [
      { status: 'draft', timestamp: Date.now(), note: 'Created' }
    ]
  };
}

// Helper: Create valid payment
function createValidPayment(amount) {
  return {
    id: 'test_payment_' + Date.now(),
    amount: amount || 100,
    method: 'cash',
    date: Date.now(),
    reference: 'TEST123',
    notes: 'Test payment'
  };
}

// Helper: Run validation test
function testValidation(name, invoice, shouldPass) {
  var result = window.InvoiceValidation.validateInvoice(invoice, {
    existingInvoices: [],
    mode: 'create'
  });

  var passed = result.valid === shouldPass;
  console.log(
    '%c' + (passed ? '✓ PASS' : '✗ FAIL') + ': ' + name,
    'color: ' + (passed ? 'green' : 'red') + '; font-weight: bold'
  );

  if (!passed) {
    console.log('  Expected valid:', shouldPass);
    console.log('  Got valid:', result.valid);
    console.log('  Errors:', result.errors);
  }

  return passed;
}
```

---

## Invoice Validation Tests

### Test Group 1: Basic Required Fields

#### Test 1.1: Valid Invoice with All Required Fields
```javascript
var invoice = createValidInvoice();
testValidation('Valid invoice with all fields', invoice, true);
```
**Expected:** ✓ PASS

#### Test 1.2: Missing Client Name
```javascript
var invoice = createValidInvoice();
invoice.clientName = '';
testValidation('Missing client name', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV001

#### Test 1.3: Client Name Too Short
```javascript
var invoice = createValidInvoice();
invoice.clientName = 'A';
testValidation('Client name too short (1 char)', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV002

#### Test 1.4: Client Name Too Long
```javascript
var invoice = createValidInvoice();
invoice.clientName = 'A'.repeat(101);
testValidation('Client name too long (101 chars)', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV002

#### Test 1.5: Missing Invoice Number
```javascript
var invoice = createValidInvoice();
invoice.invoiceNumber = '';
testValidation('Missing invoice number', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV006

#### Test 1.6: Invalid Invoice Number Format
```javascript
var invoice = createValidInvoice();
invoice.invoiceNumber = '12345';
testValidation('Invalid invoice number format', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV008

### Test Group 2: Line Items Validation

#### Test 2.1: No Line Items
```javascript
var invoice = createValidInvoice();
invoice.windowLines = [];
invoice.pressureLines = [];
testValidation('No line items', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV003

#### Test 2.2: Empty Line Item Description
```javascript
var invoice = createValidInvoice();
invoice.windowLines[0].description = '';
testValidation('Empty line item description', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** LINE001

#### Test 2.3: Line Item Description Too Long
```javascript
var invoice = createValidInvoice();
invoice.windowLines[0].description = 'A'.repeat(501);
testValidation('Line item description too long', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** LINE002

#### Test 2.4: Negative Line Item Price
```javascript
var invoice = createValidInvoice();
invoice.windowLines[0].price = -100;
testValidation('Negative line item price', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** LINE007

### Test Group 3: Financial Calculations

#### Test 3.1: GST Calculation Correct
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 100.00;
invoice.gst = 10.00;
invoice.total = 110.00;
testValidation('Correct GST calculation (10%)', invoice, true);
```
**Expected:** ✓ PASS

#### Test 3.2: GST Calculation Incorrect
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 100.00;
invoice.gst = 9.00; // Should be 10.00
invoice.total = 109.00;
testValidation('Incorrect GST calculation', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV004

#### Test 3.3: Total Calculation Incorrect
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 100.00;
invoice.gst = 10.00;
invoice.total = 111.00; // Should be 110.00
testValidation('Incorrect total calculation', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV005

#### Test 3.4: Subtotal Zero
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 0;
invoice.gst = 0;
invoice.total = 0;
testValidation('Subtotal is zero', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV009

#### Test 3.5: Negative GST
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 100.00;
invoice.gst = -10.00;
invoice.total = 90.00;
testValidation('Negative GST', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV010

### Test Group 4: Status Validation

#### Test 4.1: Valid Status - Draft
```javascript
var invoice = createValidInvoice();
invoice.status = 'draft';
testValidation('Valid status: draft', invoice, true);
```
**Expected:** ✓ PASS

#### Test 4.2: Valid Status - Sent
```javascript
var invoice = createValidInvoice();
invoice.status = 'sent';
testValidation('Valid status: sent', invoice, true);
```
**Expected:** ✓ PASS

#### Test 4.3: Invalid Status
```javascript
var invoice = createValidInvoice();
invoice.status = 'pending';
testValidation('Invalid status value', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV013

#### Test 4.4: Missing Status
```javascript
var invoice = createValidInvoice();
invoice.status = '';
testValidation('Missing status', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV012

### Test Group 5: Date Validation

#### Test 5.1: Valid Due Date (7 days from now)
```javascript
var invoice = createValidInvoice();
invoice.dueDate = Date.now() + (7 * 24 * 60 * 60 * 1000);
testValidation('Valid due date (7 days)', invoice, true);
```
**Expected:** ✓ PASS

#### Test 5.2: Due Date Too Far in Future
```javascript
var invoice = createValidInvoice();
invoice.dueDate = Date.now() + (400 * 24 * 60 * 60 * 1000); // 400 days
testValidation('Due date too far in future', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV016

#### Test 5.3: Due Date in Past (Create Mode)
```javascript
var invoice = createValidInvoice();
invoice.dueDate = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
testValidation('Due date in past (create)', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV017

#### Test 5.4: Missing Due Date
```javascript
var invoice = createValidInvoice();
invoice.dueDate = null;
testValidation('Missing due date', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV014

### Test Group 6: Email Validation

#### Test 6.1: Valid Email
```javascript
var invoice = createValidInvoice();
invoice.clientEmail = 'test@example.com';
testValidation('Valid email address', invoice, true);
```
**Expected:** ✓ PASS

#### Test 6.2: Invalid Email Format
```javascript
var invoice = createValidInvoice();
invoice.clientEmail = 'invalid-email';
testValidation('Invalid email format', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV019

#### Test 6.3: Empty Email (Optional Field)
```javascript
var invoice = createValidInvoice();
invoice.clientEmail = '';
testValidation('Empty email (optional)', invoice, true);
```
**Expected:** ✓ PASS

### Test Group 7: Bank Details Validation

#### Test 7.1: Valid BSB
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { bsb: '123-456' };
testValidation('Valid BSB format', invoice, true);
```
**Expected:** ✓ PASS

#### Test 7.2: Invalid BSB
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { bsb: '12-345' };
testValidation('Invalid BSB format', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** BANK001

#### Test 7.3: Valid Account Number
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { accountNumber: '12345678' };
testValidation('Valid account number', invoice, true);
```
**Expected:** ✓ PASS

#### Test 7.4: Invalid Account Number
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { accountNumber: '12345' }; // Too short
testValidation('Invalid account number', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** BANK003

#### Test 7.5: Valid ABN
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { abn: '12 345 678 901' };
testValidation('Valid ABN format', invoice, true);
```
**Expected:** ✓ PASS

#### Test 7.6: Invalid ABN
```javascript
var invoice = createValidInvoice();
invoice.bankDetails = { abn: '12345' }; // Too short
testValidation('Invalid ABN format', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** BANK005

---

## Payment Validation Tests

### Test Group 8: Payment Amount Validation

#### Test 8.1: Valid Payment
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Valid payment:', result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS

#### Test 8.2: Zero Payment
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(0);
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Zero payment:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY002

#### Test 8.3: Negative Payment
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(-100);
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Negative payment:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY002

#### Test 8.4: Overpayment
```javascript
var invoice = createValidInvoice();
invoice.total = 500;
invoice.amountPaid = 0;
invoice.balance = 500;
var payment = createValidPayment(600); // More than balance
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Overpayment:', !result.valid ? '✓ PASS' : '✗ FAIL');
if (!result.valid) console.log('Error:', result.errors[0].message);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY003
**Error Message:** Should mention amount due

#### Test 8.5: Exact Balance Payment
```javascript
var invoice = createValidInvoice();
invoice.total = 500;
invoice.amountPaid = 300;
invoice.balance = 200;
var payment = createValidPayment(200); // Exact balance
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Exact balance payment:', result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS

### Test Group 9: Payment Method Validation

#### Test 9.1: Valid Payment Method - Cash
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.method = 'cash';
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Valid method (cash):', result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS

#### Test 9.2: Valid Payment Method - EFT
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.method = 'eft';
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Valid method (eft):', result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS

#### Test 9.3: Invalid Payment Method
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.method = 'bitcoin';
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Invalid method:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY005

#### Test 9.4: Missing Payment Method
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.method = '';
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Missing method:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY004

### Test Group 10: Payment Date Validation

#### Test 10.1: Valid Payment Date (Today)
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.date = Date.now();
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Valid date (today):', result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS

#### Test 10.2: Future Payment Date
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.date = Date.now() + (10 * 24 * 60 * 60 * 1000); // 10 days future
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Future date:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY008

#### Test 10.3: Payment Date Before Invoice Creation
```javascript
var invoice = createValidInvoice();
invoice.createdDate = Date.now();
var payment = createValidPayment(100);
payment.date = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days before
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Date before creation:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY009

#### Test 10.4: Payment Date Too Far in Past
```javascript
var invoice = createValidInvoice();
var payment = createValidPayment(100);
payment.date = Date.now() - (800 * 24 * 60 * 60 * 1000); // 800 days ago
var result = window.InvoiceValidation.validatePayment(payment, invoice);
console.log('Date too far in past:', !result.valid ? '✓ PASS' : '✗ FAIL');
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** PAY010

---

## Edge Case Tests

### Test Group 11: Floating-Point Precision

#### Test 11.1: GST Rounding - $66.66
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 66.66;
invoice.gst = 6.67; // Rounded up
invoice.total = 73.33;
invoice.windowLines[0].price = 66.66;
testValidation('GST rounding: $66.66', invoice, true);
```
**Expected:** ✓ PASS

#### Test 11.2: GST Rounding - $33.33
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 33.33;
invoice.gst = 3.33;
invoice.total = 36.66;
invoice.windowLines[0].price = 33.33;
testValidation('GST rounding: $33.33', invoice, true);
```
**Expected:** ✓ PASS

#### Test 11.3: GST Rounding - $0.01
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 0.01;
invoice.gst = 0.00; // Rounds down to 0
invoice.total = 0.01;
invoice.windowLines[0].price = 0.01;
testValidation('GST rounding: $0.01', invoice, true);
```
**Expected:** ✓ PASS

#### Test 11.4: GST Rounding - $0.09
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 0.09;
invoice.gst = 0.01; // Rounds up
invoice.total = 0.10;
invoice.windowLines[0].price = 0.09;
testValidation('GST rounding: $0.09', invoice, true);
```
**Expected:** ✓ PASS

### Test Group 12: Boundary Values

#### Test 12.1: Maximum Invoice Total
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 909090.90;
invoice.gst = 90909.09;
invoice.total = 999999.99; // Maximum allowed
invoice.windowLines[0].price = 909090.90;
testValidation('Maximum invoice total', invoice, true);
```
**Expected:** ✓ PASS

#### Test 12.2: Exceeds Maximum Total
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 1000000.00;
invoice.gst = 100000.00;
invoice.total = 1100000.00; // Exceeds maximum
invoice.windowLines[0].price = 1000000.00;
testValidation('Exceeds maximum total', invoice, false);
```
**Expected:** ✓ PASS (should fail validation)
**Error Code:** INV018

#### Test 12.3: Minimum Valid Amount
```javascript
var invoice = createValidInvoice();
invoice.subtotal = 0.01;
invoice.gst = 0.00;
invoice.total = 0.01;
invoice.windowLines[0].price = 0.01;
testValidation('Minimum valid amount', invoice, true);
```
**Expected:** ✓ PASS

### Test Group 13: Special Characters and XSS

#### Test 13.1: HTML in Client Name
```javascript
var invoice = createValidInvoice();
invoice.clientName = '<script>alert("XSS")</script>';
testValidation('HTML in client name', invoice, true);
// Should pass validation but sanitize on display
```
**Expected:** ✓ PASS (validation allows it, sanitization happens on display)

#### Test 13.2: SQL Injection Attempt
```javascript
var invoice = createValidInvoice();
invoice.clientName = "'; DROP TABLE invoices; --";
testValidation('SQL injection in client name', invoice, true);
// Should pass validation (uses LocalStorage, not SQL)
```
**Expected:** ✓ PASS

---

## Integration Tests

### Test Group 14: UI Integration

#### Test 14.1: Error Modal Displays
**Manual Test:**
1. Open application
2. Try to create invoice without client name
3. ✅ Error modal should appear
4. ✅ Modal should have red header with ⚠ icon
5. ✅ Error message should be clear

#### Test 14.2: Field Highlighting
**Manual Test:**
1. Open edit invoice modal
2. Clear client name field
3. Click outside field
4. ✅ Field should have red border
5. ✅ Error message should appear below field

#### Test 14.3: Real-Time Validation
**Manual Test:**
1. Open payment modal
2. Enter amount > invoice balance
3. Click outside amount field
4. ✅ Should show error immediately
5. Enter valid amount
6. ✅ Error should clear

---

## Performance Tests

### Test Group 15: Performance

#### Test 15.1: Validation Speed
```javascript
var invoice = createValidInvoice();
var start = performance.now();
for (var i = 0; i < 1000; i++) {
  window.InvoiceValidation.validateInvoice(invoice, {
    existingInvoices: [],
    mode: 'create'
  });
}
var end = performance.now();
var avgTime = (end - start) / 1000;
console.log('Average validation time:', avgTime.toFixed(3), 'ms');
console.log(avgTime < 5 ? '✓ PASS (< 5ms)' : '✗ FAIL (>= 5ms)');
```
**Expected:** < 5ms per validation

---

## Browser Compatibility Tests

### Test Group 16: Cross-Browser

Run tests in:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] iOS Safari (iPhone/iPad)
- [ ] Chrome Mobile (Android)

**All tests should pass in all browsers!**

---

## Test Summary

### Quick Test Run

Run all critical tests in console:

```javascript
console.log('=== RUNNING VALIDATION TEST SUITE ===\n');

// Valid invoice
testValidation('1. Valid invoice', createValidInvoice(), true);

// Missing fields
var inv2 = createValidInvoice(); inv2.clientName = '';
testValidation('2. Missing client name', inv2, false);

var inv3 = createValidInvoice(); inv3.windowLines = []; inv3.pressureLines = [];
testValidation('3. No line items', inv3, false);

// Wrong calculations
var inv4 = createValidInvoice(); inv4.gst = 9.00;
testValidation('4. Wrong GST', inv4, false);

var inv5 = createValidInvoice(); inv5.total = 999.00;
testValidation('5. Wrong total', inv5, false);

// Edge cases
var inv6 = createValidInvoice();
inv6.subtotal = 66.66; inv6.gst = 6.67; inv6.total = 73.33;
testValidation('6. GST rounding (66.66)', inv6, true);

// Payment tests
var invoice = createValidInvoice();
invoice.balance = 500;

var pay1 = createValidPayment(100);
var r1 = window.InvoiceValidation.validatePayment(pay1, invoice);
console.log(r1.valid ? '✓ PASS: 7. Valid payment' : '✗ FAIL: 7. Valid payment');

var pay2 = createValidPayment(600);
var r2 = window.InvoiceValidation.validatePayment(pay2, invoice);
console.log(!r2.valid ? '✓ PASS: 8. Overpayment rejected' : '✗ FAIL: 8. Overpayment rejected');

console.log('\n=== TEST SUITE COMPLETE ===');
```

---

## Reporting Issues

If any test fails:

1. Note the test number and name
2. Copy the error message from console
3. Note browser and version
4. Check `VALIDATION_INTEGRATION_GUIDE.md` for troubleshooting
5. Review `ERROR_CATALOG.md` for error explanations

---

## Success Criteria

- ✅ All valid invoices pass validation
- ✅ All invalid invoices fail with appropriate errors
- ✅ All edge cases handled correctly
- ✅ Performance < 5ms per validation
- ✅ Works in all browsers
- ✅ UI integration works smoothly
- ✅ No JavaScript console errors
