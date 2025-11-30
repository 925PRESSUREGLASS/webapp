# Invoice Validation System - Error Catalog

## Overview

This catalog documents all validation error messages, their causes, and how users can fix them.

**Total Error Codes:** 50+
**Last Updated:** 2025-11-17

---

## Table of Contents

1. [Invoice Validation Errors (INV001-INV099)](#invoice-validation-errors)
2. [Line Item Errors (LINE001-LINE099)](#line-item-errors)
3. [Payment Errors (PAY001-PAY099)](#payment-errors)
4. [Bank Details Errors (BANK001-BANK099)](#bank-details-errors)
5. [Business Logic Errors (BIZ001-BIZ099)](#business-logic-errors)
6. [Quick Reference Table](#quick-reference-table)

---

## Invoice Validation Errors

### INV001: Client name is required

**Error Code:** `INV001`
**Severity:** Error
**Field:** `clientName`

**When It Occurs:**
- Client name field is empty
- Client name is null or undefined
- Client name contains only whitespace

**User Action:**
- Enter a client name (minimum 2 characters)

**Technical Cause:**
```javascript
if (!invoice.clientName || invoice.clientName.trim() === '') {
  // Error: INV001
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.clientName = '';
invoice.clientName = '   ';
invoice.clientName = null;

// ✓ VALID
invoice.clientName = 'John Smith';
invoice.clientName = 'ABC Company Pty Ltd';
```

---

### INV002: Client name must be between 2 and 100 characters

**Error Code:** `INV002`
**Severity:** Error
**Field:** `clientName`

**When It Occurs:**
- Client name is less than 2 characters
- Client name is more than 100 characters

**User Action:**
- Enter a client name with at least 2 characters
- If name is too long, use abbreviation or shorter version

**Technical Cause:**
```javascript
if (invoice.clientName.length < 2 || invoice.clientName.length > 100) {
  // Error: INV002
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.clientName = 'A'; // Too short
invoice.clientName = 'Very Long Company Name That Exceeds The Maximum...'; // > 100 chars

// ✓ VALID
invoice.clientName = 'Jo'; // Minimum 2 chars
invoice.clientName = 'ABC Company'; // Within range
```

---

### INV003: Invoice must have at least one line item

**Error Code:** `INV003`
**Severity:** Error
**Field:** `lineItems`

**When It Occurs:**
- Both `windowLines` and `pressureLines` are empty arrays
- No line items added to invoice

**User Action:**
- Add at least one window cleaning or pressure cleaning line item
- Cannot create an invoice with no services

**Technical Cause:**
```javascript
if ((!invoice.windowLines || invoice.windowLines.length === 0) &&
    (!invoice.pressureLines || invoice.pressureLines.length === 0)) {
  // Error: INV003
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.windowLines = [];
invoice.pressureLines = [];

// ✓ VALID
invoice.windowLines = [
  { description: 'Window cleaning', price: 500 }
];
```

---

### INV004: GST must be exactly 10% of subtotal

**Error Code:** `INV004`
**Severity:** Error
**Field:** `gst`

**When It Occurs:**
- GST is not 10% of subtotal
- Rounding error in GST calculation
- Manual GST entry is incorrect

**User Action:**
- Recalculate GST as 10% of subtotal
- Use auto-calculate feature
- For $66.66 subtotal, GST should be $6.67 (rounded)

**Technical Cause:**
```javascript
var expectedGST = Math.round(subtotal * 0.10 * 100) / 100;
if (Math.abs(invoice.gst - expectedGST) >= 0.01) {
  // Error: INV004
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.subtotal = 100.00;
invoice.gst = 9.00; // Should be 10.00

// ✓ VALID
invoice.subtotal = 100.00;
invoice.gst = 10.00;

invoice.subtotal = 66.66;
invoice.gst = 6.67; // Correctly rounded
```

**GST Calculation Reference:**
| Subtotal | GST (10%) | Total |
|----------|-----------|-------|
| $100.00  | $10.00    | $110.00 |
| $66.66   | $6.67     | $73.33 |
| $33.33   | $3.33     | $36.66 |
| $0.01    | $0.00     | $0.01 |
| $0.09    | $0.01     | $0.10 |

---

### INV005: Invoice total must equal subtotal + GST

**Error Code:** `INV005`
**Severity:** Error
**Field:** `total`

**When It Occurs:**
- Total doesn't match subtotal + GST
- Calculation error
- Manual total entry is incorrect

**User Action:**
- Recalculate total as subtotal + GST
- Use auto-calculate feature

**Technical Cause:**
```javascript
var expectedTotal = invoice.subtotal + invoice.gst;
if (Math.abs(invoice.total - expectedTotal) >= 0.01) {
  // Error: INV005
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.subtotal = 100.00;
invoice.gst = 10.00;
invoice.total = 111.00; // Should be 110.00

// ✓ VALID
invoice.subtotal = 100.00;
invoice.gst = 10.00;
invoice.total = 110.00;
```

---

### INV006: Invoice number is required

**Error Code:** `INV006`
**Severity:** Error
**Field:** `invoiceNumber`

**When It Occurs:**
- Invoice number is missing or empty
- Auto-generation failed

**User Action:**
- System should auto-generate invoice numbers
- If manual entry required, use format: PREFIX-NUMBER

**Technical Cause:**
```javascript
if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
  // Error: INV006
}
```

---

### INV007: Invoice number already exists

**Error Code:** `INV007`
**Severity:** Error
**Field:** `invoiceNumber`

**When It Occurs:**
- Trying to create invoice with duplicate invoice number
- Invoice number collision

**User Action:**
- Use auto-generated invoice number
- If manual entry, check existing invoices first

**Technical Cause:**
```javascript
// Check if invoice number exists in database
if (existingInvoices.some(inv => inv.invoiceNumber === invoice.invoiceNumber)) {
  // Error: INV007
}
```

**Example:**
```javascript
// ✗ INVALID
// INV-1001 already exists in system
invoice.invoiceNumber = 'INV-1001';

// ✓ VALID
invoice.invoiceNumber = 'INV-1002'; // Unique number
```

---

### INV008: Invalid invoice number format

**Error Code:** `INV008`
**Severity:** Error
**Field:** `invoiceNumber`

**When It Occurs:**
- Invoice number doesn't match required format
- Format should be: PREFIX-NUMBER (e.g., INV-1001)

**User Action:**
- Use format: 2-5 uppercase letters, hyphen, then numbers
- Examples: INV-1001, QUOTE-2023-001, ABC-123

**Technical Cause:**
```javascript
if (!/^[A-Z]{2,5}-\d+$/.test(invoice.invoiceNumber)) {
  // Error: INV008
}
```

**Example:**
```javascript
// ✗ INVALID
invoice.invoiceNumber = '12345'; // No prefix
invoice.invoiceNumber = 'inv-1001'; // Lowercase
invoice.invoiceNumber = 'TOOLONGPREFIX-123'; // Prefix too long

// ✓ VALID
invoice.invoiceNumber = 'INV-1001';
invoice.invoiceNumber = 'QUOTE-123';
invoice.invoiceNumber = 'ABC-2023-001';
```

---

### INV009: Subtotal must be greater than zero

**Error Code:** `INV009`
**Severity:** Error
**Field:** `subtotal`

**When It Occurs:**
- Subtotal is zero or negative
- No valid line items

**User Action:**
- Add line items with positive amounts
- Ensure subtotal calculation is correct

**Technical Cause:**
```javascript
if (!isValidNumber(invoice.subtotal) || invoice.subtotal <= 0) {
  // Error: INV009
}
```

---

### INV010: GST cannot be negative

**Error Code:** `INV010`
**Severity:** Error
**Field:** `gst`

**When It Occurs:**
- GST value is negative
- Calculation error

**User Action:**
- Recalculate GST (should be 10% of subtotal)
- GST minimum is $0.00

**Technical Cause:**
```javascript
if (!isValidNumber(invoice.gst) || invoice.gst < 0) {
  // Error: INV010
}
```

---

### INV011: Total must be greater than zero

**Error Code:** `INV011`
**Severity:** Error
**Field:** `total`

**When It Occurs:**
- Total is zero or negative
- Invalid calculation

**User Action:**
- Recalculate total as subtotal + GST
- Ensure line items have positive amounts

---

### INV012: Status is required

**Error Code:** `INV012`
**Severity:** Error
**Field:** `status`

**When It Occurs:**
- Status field is missing or empty

**User Action:**
- Select invoice status
- Default: "draft" for new invoices

**Valid Statuses:**
- `draft` - Invoice created but not sent
- `sent` - Invoice sent to client
- `paid` - Invoice fully paid
- `overdue` - Invoice past due date
- `cancelled` - Invoice cancelled

---

### INV013: Invalid status value

**Error Code:** `INV013`
**Severity:** Error
**Field:** `status`

**When It Occurs:**
- Status is not one of the valid options

**User Action:**
- Use one of: draft, sent, paid, overdue, cancelled

**Example:**
```javascript
// ✗ INVALID
invoice.status = 'pending';
invoice.status = 'complete';

// ✓ VALID
invoice.status = 'draft';
invoice.status = 'sent';
invoice.status = 'paid';
```

---

### INV014: Due date is required

**Error Code:** `INV014`
**Severity:** Error
**Field:** `dueDate`

**When It Occurs:**
- Due date is missing or null

**User Action:**
- Enter a due date
- Typically 7-30 days from invoice date

---

### INV015: Due date must be a valid date

**Error Code:** `INV015`
**Severity:** Error
**Field:** `dueDate`

**When It Occurs:**
- Due date is not a valid date
- Invalid date format

**User Action:**
- Enter date in format: YYYY-MM-DD
- Or use date picker

---

### INV016: Due date cannot be more than 1 year in the future

**Error Code:** `INV016`
**Severity:** Error
**Field:** `dueDate`

**When It Occurs:**
- Due date is more than 365 days from now

**User Action:**
- Enter a due date within 1 year
- Check date is correct (not typo)

**Example:**
```javascript
// ✗ INVALID
// Setting due date 400 days from now
invoice.dueDate = Date.now() + (400 * 24 * 60 * 60 * 1000);

// ✓ VALID
// Setting due date 30 days from now
invoice.dueDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
```

---

### INV017: Due date cannot be in the past for new invoices

**Error Code:** `INV017`
**Severity:** Error
**Field:** `dueDate`

**When It Occurs:**
- Creating new invoice with past due date

**User Action:**
- Set due date to future date
- For historical invoices, use update mode

---

### INV018: Invoice total cannot exceed $999,999.99

**Error Code:** `INV018`
**Severity:** Error
**Field:** `total` or `subtotal`

**When It Occurs:**
- Invoice total exceeds maximum allowed
- System limit for display/calculation

**User Action:**
- Split into multiple invoices
- Contact support if legitimate large invoice

---

### INV019: Email address is not valid

**Error Code:** `INV019`
**Severity:** Error
**Field:** `clientEmail`

**When It Occurs:**
- Email format is invalid

**User Action:**
- Enter valid email format: name@domain.com
- Leave empty if not available (email is optional)

**Example:**
```javascript
// ✗ INVALID
invoice.clientEmail = 'invalid-email';
invoice.clientEmail = 'test@';
invoice.clientEmail = '@domain.com';

// ✓ VALID
invoice.clientEmail = 'john@example.com';
invoice.clientEmail = 'contact@company.com.au';
invoice.clientEmail = ''; // Empty is allowed
```

---

## Line Item Errors

### LINE001: Line item description is required

**Error Code:** `LINE001`
**Severity:** Error
**Field:** `lineItem.description`

**When It Occurs:**
- Line item has no description
- Description is empty or whitespace only

**User Action:**
- Enter description for the service/product
- Example: "Window cleaning - 10 panels"

---

### LINE002: Line item description must be 1-500 characters

**Error Code:** `LINE002`
**Severity:** Error
**Field:** `lineItem.description`

**When It Occurs:**
- Description is too long (> 500 characters)

**User Action:**
- Shorten description
- Use notes field for additional details

---

### LINE003: Line item quantity is required

**Error Code:** `LINE003`
**Severity:** Error
**Field:** `lineItem.quantity`

**When It Occurs:**
- Quantity is missing for standard line items

**User Action:**
- Enter quantity (e.g., 1, 2, 10)

---

### LINE004: Line item quantity must be greater than zero

**Error Code:** `LINE004`
**Severity:** Error
**Field:** `lineItem.quantity`

**When It Occurs:**
- Quantity is zero or negative

**User Action:**
- Enter positive quantity
- Minimum: 0.01

---

### LINE005: Line item quantity cannot exceed 9999

**Error Code:** `LINE005`
**Severity:** Error
**Field:** `lineItem.quantity`

**When It Occurs:**
- Quantity exceeds maximum (9999)

**User Action:**
- Split into multiple line items
- Check for data entry error

---

### LINE006: Line item rate is required

**Error Code:** `LINE006`
**Severity:** Error
**Field:** `lineItem.rate`

**When It Occurs:**
- Rate/price per unit is missing

**User Action:**
- Enter rate (price per item)

---

### LINE007: Line item rate cannot be negative

**Error Code:** `LINE007`
**Severity:** Error
**Field:** `lineItem.rate` or `lineItem.price`

**When It Occurs:**
- Rate or price is negative

**User Action:**
- Enter positive amount
- Use $0.00 for complimentary items

---

### LINE008: Line item rate cannot exceed $999,999.99

**Error Code:** `LINE008`
**Severity:** Error
**Field:** `lineItem.rate` or `lineItem.price`

**When It Occurs:**
- Rate exceeds maximum allowed

**User Action:**
- Check for data entry error
- Split into multiple line items if legitimate

---

### LINE009: Line item total must equal quantity × rate

**Error Code:** `LINE009`
**Severity:** Error
**Field:** `lineItem.total`

**When It Occurs:**
- Total doesn't match quantity × rate
- Calculation error

**User Action:**
- Recalculate total
- Use auto-calculate feature

**Example:**
```javascript
// ✗ INVALID
lineItem.quantity = 5;
lineItem.rate = 100.00;
lineItem.total = 499.00; // Should be 500.00

// ✓ VALID
lineItem.quantity = 5;
lineItem.rate = 100.00;
lineItem.total = 500.00;
```

---

## Payment Errors

### PAY001: Payment amount is required

**Error Code:** `PAY001`
**Severity:** Error
**Field:** `amount`

**When It Occurs:**
- Payment amount is missing

**User Action:**
- Enter payment amount received

---

### PAY002: Payment amount must be greater than zero

**Error Code:** `PAY002`
**Severity:** Error
**Field:** `amount`

**When It Occurs:**
- Payment amount is zero or negative

**User Action:**
- Enter positive payment amount
- Minimum: $0.01

---

### PAY003: Payment cannot exceed invoice balance

**Error Code:** `PAY003`
**Severity:** Error
**Field:** `amount`

**When It Occurs:**
- Payment amount is greater than amount due
- Would result in overpayment

**User Action:**
- Enter amount up to balance due
- Check invoice balance before entering payment

**Example:**
```javascript
// Invoice has $500 balance
// ✗ INVALID
payment.amount = 600; // Exceeds balance

// ✓ VALID
payment.amount = 500; // Exact balance
payment.amount = 250; // Partial payment
```

**Error Message Shows:**
```
Payment would exceed invoice total.
Amount due: $500.00 (attempting to pay: $600.00)
```

---

### PAY004: Payment method is required

**Error Code:** `PAY004`
**Severity:** Error
**Field:** `method`

**When It Occurs:**
- Payment method not selected

**User Action:**
- Select payment method

**Valid Methods:**
- Cash
- EFT/Bank Transfer
- Credit/Debit Card
- Cheque
- Other

---

### PAY005: Invalid payment method

**Error Code:** `PAY005`
**Severity:** Error
**Field:** `method`

**When It Occurs:**
- Payment method is not one of the valid options

**User Action:**
- Select from dropdown: cash, eft, card, cheque, other

---

### PAY006: Payment date is required

**Error Code:** `PAY006`
**Severity:** Error
**Field:** `date`

**When It Occurs:**
- Payment date is missing

**User Action:**
- Enter date payment was received
- Default: today

---

### PAY007: Payment date must be a valid date

**Error Code:** `PAY007`
**Severity:** Error
**Field:** `date`

**When It Occurs:**
- Invalid date format

**User Action:**
- Enter valid date in YYYY-MM-DD format
- Use date picker

---

### PAY008: Payment date cannot be in the future

**Error Code:** `PAY008`
**Severity:** Error
**Field:** `date`

**When It Occurs:**
- Payment date is set to future date

**User Action:**
- Enter today's date or past date
- Cannot record future payments

---

### PAY009: Payment date cannot be before invoice creation date

**Error Code:** `PAY009`
**Severity:** Error
**Field:** `date`

**When It Occurs:**
- Payment date is before invoice was created

**User Action:**
- Check payment date
- Cannot receive payment before invoice exists

**Example:**
```javascript
// Invoice created: 2025-11-01
// ✗ INVALID
payment.date = new Date('2025-10-30'); // Before invoice

// ✓ VALID
payment.date = new Date('2025-11-02'); // After invoice
```

---

### PAY010: Payment date cannot be more than 2 years in the past

**Error Code:** `PAY010`
**Severity:** Error
**Field:** `date`

**When It Occurs:**
- Payment date is more than 730 days ago

**User Action:**
- Check date is correct
- Contact support if legitimate historical payment

---

### PAY011: Payment reference cannot exceed 50 characters

**Error Code:** `PAY011`
**Severity:** Error
**Field:** `reference`

**When It Occurs:**
- Reference/transaction ID is too long

**User Action:**
- Shorten reference
- Use notes field for additional details

---

### PAY012: Payment notes cannot exceed 500 characters

**Error Code:** `PAY012`
**Severity:** Error
**Field:** `notes`

**When It Occurs:**
- Notes field exceeds character limit

**User Action:**
- Shorten notes to 500 characters or less

---

### PAY013: Payment amount has too many decimal places

**Error Code:** `PAY013`
**Severity:** Error
**Field:** `amount`

**When It Occurs:**
- Amount has more than 2 decimal places

**User Action:**
- Round to 2 decimal places
- Example: $123.456 → $123.46

---

## Bank Details Errors

### BANK001: BSB must be 6 digits

**Error Code:** `BANK001`
**Severity:** Error
**Field:** `bsb`

**When It Occurs:**
- BSB is not 6 digits

**User Action:**
- Enter 6-digit BSB
- Format: 123-456 or 123456

**Example:**
```javascript
// ✗ INVALID
bsb = '12-345'; // Only 5 digits
bsb = '1234567'; // 7 digits

// ✓ VALID
bsb = '123-456';
bsb = '123456';
```

---

### BANK003: Account number must be 6-9 digits

**Error Code:** `BANK003`
**Severity:** Error
**Field:** `accountNumber`

**When It Occurs:**
- Account number is not 6-9 digits

**User Action:**
- Enter valid Australian bank account number (6-9 digits)

**Example:**
```javascript
// ✗ INVALID
accountNumber = '12345'; // Too short
accountNumber = '1234567890'; // Too long

// ✓ VALID
accountNumber = '123456'; // 6 digits
accountNumber = '12345678'; // 8 digits
accountNumber = '123456789'; // 9 digits
```

---

### BANK004: Account name must be 2-100 characters

**Error Code:** `BANK004`
**Severity:** Error
**Field:** `accountName`

**When It Occurs:**
- Account name is too short or too long

**User Action:**
- Enter account holder name (2-100 characters)

---

### BANK005: ABN must be 11 digits

**Error Code:** `BANK005`
**Severity:** Error
**Field:** `abn`

**When It Occurs:**
- ABN is not 11 digits

**User Action:**
- Enter 11-digit ABN
- Format: 12 345 678 901 or 12345678901

**Example:**
```javascript
// ✗ INVALID
abn = '12345'; // Too short

// ✓ VALID
abn = '12 345 678 901';
abn = '12345678901';
```

---

## Business Logic Errors

### BIZ001: Status "paid" requires amountPaid to equal total

**Error Code:** `BIZ001`
**Severity:** Error
**Field:** `status`

**When It Occurs:**
- Invoice status is "paid" but amount paid doesn't match total

**User Action:**
- Record all payments before marking as paid
- Or change status to "sent"

---

### BIZ002: Status "cancelled" cannot have payments

**Error Code:** `BIZ002`
**Severity:** Warning
**Field:** `status`

**When It Occurs:**
- Cancelled invoice has payment records

**User Action:**
- Remove payments before cancelling
- Or use different status

---

### BIZ003: Cannot modify a paid invoice

**Error Code:** `BIZ003`
**Severity:** Error
**Field:** `invoice`

**When It Occurs:**
- Trying to edit invoice that's fully paid

**User Action:**
- Create a new invoice or credit note
- Contact support if modification needed

---

### BIZ004: Cannot add payment to cancelled invoice

**Error Code:** `BIZ004`
**Severity:** Error
**Field:** `invoice`

**When It Occurs:**
- Trying to record payment on cancelled invoice

**User Action:**
- Change invoice status first
- Or create new invoice

---

### BIZ005: Invoice was modified in another window

**Error Code:** `BIZ005`
**Severity:** Error
**Field:** `invoice`

**When It Occurs:**
- Concurrent edit detected
- Invoice modified in another browser tab/window

**User Action:**
- Refresh page to see latest version
- Re-apply your changes

---

## Quick Reference Table

| Code | Field | Message | Severity | Fix |
|------|-------|---------|----------|-----|
| INV001 | clientName | Client name is required | Error | Enter client name |
| INV002 | clientName | Name must be 2-100 characters | Error | Adjust name length |
| INV003 | lineItems | Must have at least one line item | Error | Add line items |
| INV004 | gst | GST must be 10% of subtotal | Error | Recalculate GST |
| INV005 | total | Total must equal subtotal + GST | Error | Recalculate total |
| INV006 | invoiceNumber | Invoice number is required | Error | Use auto-generated |
| INV007 | invoiceNumber | Invoice number already exists | Error | Use unique number |
| INV008 | invoiceNumber | Invalid invoice number format | Error | Use PREFIX-NUMBER |
| INV009 | subtotal | Subtotal must be > 0 | Error | Add line items |
| INV010 | gst | GST cannot be negative | Error | Fix GST value |
| INV011 | total | Total must be > 0 | Error | Fix calculation |
| INV012 | status | Status is required | Error | Select status |
| INV013 | status | Invalid status value | Error | Use valid status |
| INV014 | dueDate | Due date is required | Error | Enter due date |
| INV015 | dueDate | Invalid date | Error | Fix date format |
| INV016 | dueDate | Cannot be > 1 year ahead | Error | Use nearer date |
| INV017 | dueDate | Cannot be in past (new) | Error | Use future date |
| INV018 | total | Cannot exceed $999,999.99 | Error | Split invoice |
| INV019 | clientEmail | Invalid email format | Error | Fix email format |
| PAY001 | amount | Amount is required | Error | Enter amount |
| PAY002 | amount | Amount must be > 0 | Error | Enter positive amount |
| PAY003 | amount | Cannot exceed balance | Error | Reduce amount |
| PAY004 | method | Method is required | Error | Select method |
| PAY005 | method | Invalid method | Error | Use valid method |
| PAY006 | date | Date is required | Error | Enter date |
| PAY007 | date | Invalid date | Error | Fix date format |
| PAY008 | date | Cannot be in future | Error | Use past date |
| PAY009 | date | Before invoice creation | Error | Check date |
| PAY010 | date | Too far in past | Error | Check date |
| PAY013 | amount | Too many decimals | Error | Round to 2 places |

---

## Error Message Best Practices

### Good Error Messages ✅

- "Client name is required"
- "Payment amount cannot exceed $500.00 (amount due)"
- "GST must be exactly 10% of subtotal. Expected: $50.00, got: $45.00"
- "Invoice number INV-2025-000123 already exists"

### Bad Error Messages ❌

- "Invalid input"
- "Error"
- "Validation failed"
- "Check console for details"

---

## Getting Help

If you encounter an error not listed here:

1. Note the error code and message
2. Check field that's highlighted
3. Review validation rules in `VALIDATION_INTEGRATION_GUIDE.md`
4. Run test suite: `VALIDATION_TEST_SUITE.md`
5. Contact support with error code

---

## Error Statistics

Track which errors are most common to identify user training needs or UI improvements.

**Common Errors (expected):**
- INV003 - No line items (user creates empty invoice)
- PAY003 - Overpayment (user enters wrong amount)
- INV004 - GST calculation (manual entry errors)

**Rare Errors (investigate if frequent):**
- INV007 - Duplicate invoice number (auto-generation issue?)
- BIZ005 - Concurrent modification (multiple users?)

---

**Last Updated:** 2025-11-17
**Version:** 1.0
**Total Error Codes:** 50+
