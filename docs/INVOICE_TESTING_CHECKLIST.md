# Invoice System Verification Checklist

**Version:** 2.0 (Corrected)
**Last Updated:** 2025-11-17
**Status:** Ready for Testing
**Implementation:** invoice.js (1704 lines)

---

## Test Environment Setup

- [ ] Open TicTacStick in browser
- [ ] Clear LocalStorage to start fresh: `localStorage.clear()`
- [ ] Open browser console for error monitoring (F12)
- [ ] Have calculator ready for manual verification
- [ ] Create test client in system: "Test Customer" (test@example.com)

**Environment Verification:**
```javascript
// Run in console to verify invoice system loaded:
console.log(typeof window.InvoiceManager);  // Should output "object"
console.log(typeof window.APP);             // Should output "object"
```

---

## CRITICAL: Actual Invoice Data Structure

**IMPORTANT:** The actual implementation differs from initial assumptions. Use this structure:

```javascript
{
  // Identifiers
  id: "invoice_1700000000000_abc123xyz",  // Format: invoice_<timestamp>_<random>
  invoiceNumber: "INV-1001",              // Format: <prefix><sequential> (NO year, NO padding)

  // Dates (Unix timestamps in milliseconds, NOT ISO strings)
  createdDate: 1700000000000,
  invoiceDate: 1700000000000,
  dueDate: 1700604800000,

  // Status
  status: "draft",  // Values: draft, sent, paid, overdue, cancelled

  // Client info
  clientName: "John Smith",
  clientLocation: "Sydney CBD",
  clientEmail: "john@example.com",
  clientPhone: "0400123456",

  // Quote info
  quoteId: "quote_1700000000000_abc123def",  // Unique quote identifier, displayed in UI
  quoteTitle: "Office Windows - Level 12",
  jobType: "commercial",

  // Line items (copied from quote, prices are STRINGS)
  windowLines: [
    {
      id: "...",
      description: "8x Standard Sliding Windows",
      price: "100.00",  // String, not number
      // ... other quote fields
    }
  ],
  pressureLines: [],

  // Financial (numbers)
  subtotal: 685.50,
  gst: 68.55,
  total: 754.05,

  // Payments
  amountPaid: 0,
  balance: 754.05,  // Field name is "balance" NOT "amountDue"
  payments: [
    {
      id: "payment_1700100000000",  // Format: payment_<timestamp>
      amount: 100.00,
      method: "eft",  // Values: cash, eft, card, cheque, other (NOT bank_transfer)
      date: 1700100000000,
      reference: "REF123",
      notes: "Partial payment"
    }
  ],

  // Notes
  internalNotes: "",
  clientNotes: "Thank you!",

  // Audit trail
  statusHistory: [
    {
      status: "draft",
      timestamp: 1700000000000,
      note: "Invoice created"
    }
  ]
}
```

---

## P0: Critical Path Tests (Must Pass)

### Test 1: Create Invoice from Quote

**Priority:** P0
**Description:** Convert an existing quote to an invoice

**Preconditions:**
- Create a quote with:
  - Client: Test Customer, test@example.com
  - 8x Standard Sliding Windows @ $12.50 = $100
  - Driveway 45.5 sqm @ $8.50/sqm = $386.75
  - Callout Fee: $85
  - High-reach premium: $120
  - Subtotal: $691.75
  - GST (10%): $69.18
  - Total: $760.93
- Save quote to history (status: accepted)

**Steps:**
1. Open invoice management modal (click "📄 Manage Invoices" button)
2. Click "Create Invoice from Quote" button
3. Verify invoice creation confirmation appears

**Expected Results:**
- [ ] Invoice created with ID format: `invoice_<timestamp>_<random>`
- [ ] Invoice number: `INV-1001` (if first invoice - sequential, NO year component)
- [ ] Client info matches quote exactly (name, location)
- [ ] Client email populated from ClientDatabase if exists
- [ ] All line items copied to `windowLines` and `pressureLines` arrays
- [ ] Subtotal = $691.75 (matches quote)
- [ ] GST = $69.18 (10% of subtotal)
- [ ] Total = $760.93 (matches quote)
- [ ] `invoiceDate` = today (Unix timestamp)
- [ ] `dueDate` = today + 7 days (Unix timestamp, default from settings)
- [ ] `createdDate` = today (Unix timestamp)
- [ ] Status = "draft"
- [ ] `amountPaid` = 0
- [ ] `balance` = $760.93 (equals total)
- [ ] `statusHistory` array has one entry: {status: "draft", timestamp: <now>, note: "Invoice created"}
- [ ] `quoteTitle` copied from quote
- [ ] `jobType` copied from quote
- [ ] `quoteId` field generated and displayed in invoice detail/edit views
- [ ] Success message shown: "Invoice INV-1001 created!"
- [ ] No console errors

**Manual Verification:**
- Calculator: $691.75 × 0.10 = $69.175 → rounds to $69.18 ✓
- Calculator: $691.75 + $69.18 = $760.93 ✓
- Check LocalStorage: `localStorage.getItem('invoice-database')` contains new invoice

**Pass Criteria:** All checkboxes checked, calculations verified

---

### Test 2: Record Full Payment

**Priority:** P0
**Description:** Record a payment that fully pays an invoice

**Preconditions:**
- Invoice exists from Test 1 (total: $760.93, status: draft, balance: $760.93)

**Steps:**
1. Open invoice list modal
2. Find the invoice, click "View" button
3. Click "Record Payment" button
4. Enter payment details:
   - Amount: $760.93
   - Method: EFT/Bank Transfer (value: "eft")
   - Reference: TEST001
   - Date: Today
   - Notes: "Full payment received"
5. Click "Record Payment" button

**Expected Results:**
- [ ] Payment modal closes
- [ ] Payment added to `invoice.payments` array
- [ ] Payment has unique `id` field: `payment_<timestamp>`
- [ ] Payment `amount` = 760.93 (number)
- [ ] Payment `method` = "eft" (NOT "bank_transfer")
- [ ] Payment `reference` = "TEST001"
- [ ] Payment `date` is Unix timestamp for today
- [ ] Payment `notes` = "Full payment received"
- [ ] Invoice `amountPaid` updates to $760.93
- [ ] Invoice `balance` updates to $0.00
- [ ] Status auto-changes to "paid"
- [ ] `statusHistory` has new entry: {status: "paid", timestamp: <now>, note: "Fully paid"}
- [ ] Success message: "Payment recorded: $760.93"
- [ ] Invoice detail view refreshes showing payment
- [ ] Payment appears in "Payment History" section
- [ ] "Record Payment" button no longer visible (balance = 0)
- [ ] No console errors

**Manual Verification:**
- Calculator: $760.93 - $760.93 = $0.00 ✓
- Check LocalStorage: invoice saved with payment

**Pass Criteria:** All checkboxes checked, balance = 0, status = paid

---

### Test 3: Invoice Numbering Sequence

**Priority:** P0
**Description:** Verify invoices are numbered sequentially

**Preconditions:**
- Clear all invoices: `localStorage.removeItem('invoice-database')`
- Clear settings: `localStorage.removeItem('invoice-settings')`
- Refresh page

**Steps:**
1. Create quote #1, convert to invoice
2. Note invoice number (should be INV-1001 - default starting number)
3. Create quote #2, convert to invoice
4. Note invoice number (should be INV-1002)
5. Create quote #3, convert to invoice
6. Note invoice number (should be INV-1003)
7. Refresh page
8. Create quote #4, convert to invoice
9. Note invoice number (should be INV-1004 - counter persisted)

**Expected Results:**
- [ ] Invoice #1 = INV-1001 (NOT INV-2025-000001)
- [ ] Invoice #2 = INV-1002 (NOT INV-2025-000002)
- [ ] Invoice #3 = INV-1003 (NOT INV-2025-000003)
- [ ] Invoice #4 = INV-1004 (after page refresh)
- [ ] Numbers increment by exactly 1
- [ ] No gaps in sequence
- [ ] No duplicate numbers
- [ ] NO year in invoice number (simple sequential)
- [ ] NO zero-padding (4-digit numbers, not 6-digit)
- [ ] Counter persists in LocalStorage key: 'invoice-settings'
- [ ] `settings.nextInvoiceNumber` increments correctly
- [ ] No console errors

**Manual Verification:**
```javascript
// Check settings in console:
JSON.parse(localStorage.getItem('invoice-settings'))
// Should show: {nextInvoiceNumber: 1005, invoicePrefix: "INV-", ...}
```

**Pass Criteria:** Sequential numbering works, persists across refresh

---

### Test 4: GST Calculation Accuracy

**Priority:** P0
**Description:** Verify GST is calculated correctly at exactly 10%

**Test Scenarios:**

#### **Scenario A: Round numbers**
- Create quote: 1x item @ $1000.00
- Subtotal: $1000.00
- Expected GST: $100.00
- Expected Total: $1100.00

#### **Scenario B: Decimal cents**
- Create quote: 10x windows @ $68.55 each
- Subtotal: $685.50
- Expected GST: $68.55
- Expected Total: $754.05

#### **Scenario C: Requires rounding**
- Create quote: 1x item @ $333.33
- Subtotal: $333.33
- Expected GST: $33.33 (rounds from $33.333)
- Expected Total: $366.66

#### **Scenario D: Large amount**
- Create quote with items totaling $15,847.82
- Subtotal: $15,847.82
- Expected GST: $1,584.78
- Expected Total: $17,432.60

**Steps for each scenario:**
1. Create quote with items totaling test subtotal
2. Convert to invoice
3. Open invoice detail view
4. Check calculated GST and total
5. Compare with calculator

**Expected Results:**
- [ ] Scenario A: GST = $100.00, Total = $1100.00
- [ ] Scenario B: GST = $68.55, Total = $754.05
- [ ] Scenario C: GST = $33.33, Total = $366.66
- [ ] Scenario D: GST = $1,584.78, Total = $17,432.60
- [ ] All GST calculations accurate to 2 decimal places
- [ ] Rounding follows standard rules (0.5 rounds up)
- [ ] Total always equals subtotal + GST exactly
- [ ] No floating-point precision errors
- [ ] No console errors

**Manual Verification:**
- Use calculator for each scenario
- Verify: subtotal × 0.10 = GST
- Verify: subtotal + GST = total

**Pass Criteria:** All 4 scenarios calculate correctly

---

### Test 5: Record Partial Payment

**Priority:** P1
**Description:** Record multiple payments for one invoice

**Preconditions:**
- Invoice total: $760.93, status: sent, balance: $760.93

**Steps:**
1. Open invoice detail view
2. Click "Record Payment"
3. Enter payment #1:
   - Amount: $300.00
   - Method: Cash
   - Reference: CASH-001
4. Save payment
5. Verify status and amounts
6. Click "Record Payment" again
7. Enter payment #2:
   - Amount: $460.93
   - Method: Card
   - Reference: CARD-002
8. Save payment
9. Verify final status

**Expected Results After Payment 1:**
- [ ] Payment saved to `payments` array
- [ ] `amountPaid` = $300.00
- [ ] `balance` = $460.93 (calculated: $760.93 - $300.00)
- [ ] Status remains "sent" (not fully paid)
- [ ] Success message shown
- [ ] Payment visible in payment history

**Expected Results After Payment 2:**
- [ ] Second payment saved to `payments` array
- [ ] `amountPaid` = $760.93 (calculated: $300.00 + $460.93)
- [ ] `balance` = $0.00
- [ ] Status auto-changes to "paid"
- [ ] `statusHistory` updated with "Fully paid" note
- [ ] Both payments visible in payment history
- [ ] "Record Payment" button hidden (balance = 0)

**Manual Verification:**
- Calculator: $300.00 + $460.93 = $760.93 ✓
- Calculator: $760.93 - $760.93 = $0.00 ✓
- Check both payments have unique IDs

**Pass Criteria:** Multiple payments work, balance calculated correctly

---

### Test 6: Overpayment Handling

**Priority:** P1
**Description:** Verify behavior when payment exceeds invoice balance

**Preconditions:**
- Invoice total: $500.00, status: sent, balance: $500.00

**Steps:**
1. Click "Record Payment"
2. Enter amount: $600.00 (exceeds balance by $100)
3. Click "Record Payment"
4. Observe confirmation dialog
5. Test both responses:
   - **Path A:** Click "Cancel" on dialog
   - **Path B:** Click "OK" on dialog

**Expected Results - Path A (Cancel):**
- [ ] Confirmation dialog appears: "Payment amount ($600.00) exceeds balance ($500.00). Continue?"
- [ ] User clicks "Cancel"
- [ ] Payment NOT saved
- [ ] `amountPaid` remains $0.00
- [ ] `balance` remains $500.00
- [ ] Status unchanged
- [ ] Modal remains open

**Expected Results - Path B (OK):**
- [ ] Confirmation dialog appears (same message)
- [ ] User clicks "OK"
- [ ] Payment IS saved (overpayment allowed)
- [ ] `amountPaid` = $600.00
- [ ] `balance` = -$100.00 (negative balance allowed)
- [ ] Status changes to "paid"
- [ ] Success message: "Payment recorded: $600.00"
- [ ] Payment appears in history with $600.00 amount

**Data Integrity Note:**
System ALLOWS overpayment with user confirmation. This may be intentional for:
- Customer tips
- Rounding up payments
- Prepayment for future work

Document this behavior for accounting purposes.

**Code Reference:** invoice.js:244-248

**Pass Criteria:** Confirmation dialog works, both paths behave as expected

---

### Test 7: Invoice Status Transitions

**Priority:** P1
**Description:** Verify status changes work correctly

**Valid Status Transitions (All Allowed - No Validation):**

The current implementation allows ANY status transition. Test each:

**Automatic Transitions:**
- [ ] draft → paid (when full payment added)
- [ ] sent → paid (when full payment added)
- [ ] overdue → paid (when full payment added)
- [ ] sent → overdue (automatic when past due date)
- [ ] overdue → sent (when partial payment received)

**Manual Transitions (via "Change Status" button):**
- [ ] draft → sent
- [ ] sent → draft
- [ ] paid → draft (allowed but dangerous - test this)
- [ ] paid → sent (allowed but dangerous)
- [ ] any → cancelled

**Expected Results:**
- [ ] All transitions succeed (no validation prevents any)
- [ ] `statusHistory` array records each change
- [ ] Each history entry has: {status, timestamp, note}
- [ ] Status badge color changes in UI
- [ ] Status icon updates
- [ ] Success message shown

**Critical Issue Identified:**
- No validation prevents illogical transitions (e.g., paid → draft)
- This is a **data integrity risk**
- Document as known limitation or file bug

**Pass Criteria:** Status changes work, history tracked

---

### Test 8: Create Standalone Invoice (Without Quote)

**Priority:** P1
**Description:** Create invoice directly without pre-existing quote

**Steps:**
1. Enter client name in header: "Direct Invoice Client"
2. Add line items to quote form:
   - 10x Standard windows @ $15 each = $150
   - 30 sqm pressure cleaning @ $10/sqm = $300
3. Verify quote totals:
   - Subtotal: $450.00
   - GST: $45.00
   - Total: $495.00
4. Click "Create Invoice from Quote" button
5. View created invoice

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Invoice number assigned (sequential)
- [ ] Client name = "Direct Invoice Client"
- [ ] `clientLocation`, `clientEmail`, `clientPhone` copied if entered
- [ ] `windowLines` and/or `pressureLines` populated
- [ ] Subtotal = $450.00
- [ ] GST = $45.00
- [ ] Total = $495.00
- [ ] Status = "draft"
- [ ] All standard invoice fields populated
- [ ] No console errors

**Manual Verification:**
- Calculator: $450.00 × 0.10 = $45.00 ✓
- Calculator: $450.00 + $45.00 = $495.00 ✓

**Pass Criteria:** Invoice created without errors, calculations correct

---

### Test 9: Invoice Aging / Overdue Detection

**Priority:** P1
**Description:** Verify invoices become overdue after due date

**Setup:**
1. Create invoice with normal due date (7 days from today)
2. Manually edit invoice in LocalStorage to set `dueDate` to yesterday:
   ```javascript
   // In console:
   var invoices = JSON.parse(localStorage.getItem('invoice-database'));
   invoices[0].dueDate = Date.now() - (24 * 60 * 60 * 1000); // yesterday
   invoices[0].status = 'sent';
   invoices[0].balance = 500; // unpaid
   localStorage.setItem('invoice-database', JSON.stringify(invoices));
   ```
3. Refresh page or open invoice list

**Expected Results:**
- [ ] `checkOverdueInvoices()` runs automatically when invoice list opens
- [ ] Invoice status auto-changes from 'sent' to 'overdue'
- [ ] `statusHistory` records: {status: "overdue", timestamp: <now>, note: "Automatically marked overdue"}
- [ ] Invoice appears in "Overdue" filter
- [ ] Red warning badge/icon displayed
- [ ] "Days overdue" calculated correctly (e.g., "1 day overdue")
- [ ] Invoice list stats show overdue count
- [ ] No user interaction needed (automatic)

**Test Aging Report:**
- [ ] Click "📊 Aging Report" button
- [ ] Overdue invoice appears in correct bucket (0-30 days if 1 day late)
- [ ] Balance shown in aging report
- [ ] Can click invoice to view details

**Code Reference:** invoice.js:305-326 (checkOverdueInvoices)

**Pass Criteria:** Automatic overdue detection works

---

### Test 10: Print Invoice (HTML Print View)

**Priority:** P1
**Description:** Generate printable HTML view from invoice

**Steps:**
1. Create invoice with all fields populated:
   - Client name, location, email, phone
   - Multiple line items
   - Notes
2. Open Settings, configure bank details:
   - Bank Name, Account Name, BSB, Account Number, ABN
3. View invoice detail
4. Click "Print Invoice" button
5. Review print preview

**Expected Results:**
- [ ] Print dialog opens (window.print() called)
- [ ] Print container div created with class "invoice-print-view"
- [ ] Invoice formatted for printing (clean layout)
- [ ] Header shows: "Tic-Tac-Stick" title
- [ ] Invoice number displayed prominently
- [ ] Invoice date and due date shown
- [ ] Client details ("Bill To") section populated
- [ ] Line items table with descriptions and amounts
- [ ] Subtotal, GST (10%), Total displayed
- [ ] If partially paid: "Amount Paid" and "Balance Due" shown
- [ ] Payment terms section: "Payment due within X days"
- [ ] Bank details section (if configured in settings)
- [ ] ABN displayed (if configured)
- [ ] Client notes displayed (if present)
- [ ] "Thank you for your business!" footer
- [ ] Professional layout, readable fonts
- [ ] NO automatic PDF download (user must print-to-PDF via browser)
- [ ] Print container removed from DOM after printing

**Test Print to PDF:**
- [ ] Use browser's "Save as PDF" option
- [ ] Verify PDF looks professional
- [ ] All content visible and formatted

**Code Reference:** invoice.js:1008-1174 (printInvoiceView)

**Pass Criteria:** Print view generates, looks professional

---

### Test 11: Invoice Editing

**Priority:** P1 (CRITICAL - Data Integrity)
**Description:** Modify invoice after creation

**⚠️ CRITICAL ISSUE:** Current implementation allows editing invoices in ANY status, including paid invoices. This is a **data integrity risk**.

**Test Scenarios:**

#### **Scenario A: Edit Draft Invoice**
1. Create invoice, status = draft
2. Click "Edit Invoice"
3. Change client name
4. Change subtotal to different amount
5. Save

**Expected:**
- [ ] Edit form opens
- [ ] All fields editable
- [ ] Changes saved successfully
- [ ] GST auto-recalculates when subtotal changed
- [ ] Total auto-recalculates
- [ ] Balance recalculates: `balance = total - amountPaid`

#### **Scenario B: Edit Sent Invoice**
1. Invoice status = sent
2. Click "Edit Invoice"
3. Attempt to edit

**Expected (Current Behavior):**
- [ ] Edit form opens (no restrictions)
- [ ] All fields editable
- [ ] **RISK:** Can change amounts after invoice sent

**Expected (Should Be):**
- Limited editing or warning shown

#### **Scenario C: Edit Paid Invoice (CRITICAL TEST)**
1. Create invoice: total = $500
2. Record payment: $500 (status = paid, balance = $0)
3. Click "Edit Invoice"
4. Change total to $100
5. Save

**Expected (Current Behavior):**
- [ ] Edit allowed
- [ ] Total changes to $100
- [ ] Balance recalculates: $100 - $500 = -$400 (negative)
- [ ] Status remains "paid"
- [ ] **DATA CORRUPTION:** Invoice shows $500 paid but only $100 owed

**Expected (Should Be):**
- Error: "Cannot edit paid invoices" OR
- Warning: "This invoice has payments. Edit carefully." OR
- Paid invoices should be read-only

**Status Change via Edit:**
- [ ] Can change status in edit form
- [ ] Status change recorded in `statusHistory`
- [ ] Note: "Status changed via edit"

**GST Auto-Calculation:**
- [ ] When subtotal changed, GST auto-calculates (subtotal × 0.10)
- [ ] Total = subtotal + GST (auto-calculated, field readonly)

**Code Reference:** invoice.js:1435-1613

**Pass Criteria:** Edit works for draft, **BUT FILE BUG** for paid invoice editing

**Action Required:** File Bug #1 - Paid invoices can be edited (see GitHub Issues section)

---

### Test 12: Invoice Deletion

**Priority:** P2 (P1 if deleting paid invoices)
**Description:** Delete invoice safely

**Test Scenarios:**

#### **Scenario A: Delete Draft Invoice**
1. Create draft invoice (no payments)
2. Click "Delete" button
3. Observe confirmation dialog

**Expected:**
- [ ] Confirmation dialog: "Delete invoice INV-XXXX? This cannot be undone."
- [ ] If Cancel: invoice not deleted
- [ ] If OK: invoice removed from database
- [ ] Invoice number NOT reused (nextInvoiceNumber not decremented)
- [ ] Invoice removed from list
- [ ] Success message: "Invoice deleted"

#### **Scenario B: Delete Invoice with Payments (CRITICAL)**
1. Create invoice, record payment of $500
2. Click "Delete" button
3. Observe confirmation dialogs

**Expected:**
- [ ] First dialog: "This invoice has payments recorded. Are you sure you want to delete it?"
- [ ] If Cancel: deletion cancelled
- [ ] If OK: Second confirmation appears
- [ ] Second dialog: "Delete invoice INV-XXXX? This cannot be undone."
- [ ] If OK: invoice deleted (including payment history)
- [ ] **DATA LOSS:** Payment records gone forever
- [ ] No way to recover

**Data Integrity Notes:**
- Deleting invoices with payments is **dangerous**
- Consider implementing "void" instead of delete
- Or prevent deletion of invoices with payments

**Invoice Number Sequence After Delete:**
- [ ] Create invoice INV-1001
- [ ] Create invoice INV-1002
- [ ] Delete INV-1001
- [ ] Create new invoice
- [ ] New invoice is INV-1003 (NOT INV-1001 - no reuse)

**Code Reference:** invoice.js:356-386

**Pass Criteria:** Deletion works, confirmations shown, numbers not reused

---

### Test 13: Multiple Payment Methods

**Priority:** P2
**Description:** Test all payment method options

**⚠️ CORRECTED VALUES:**

The actual payment method values are:
- `cash` (Cash)
- `eft` (EFT/Bank Transfer) - **NOT "bank_transfer"**
- `card` (Credit/Debit Card)
- `cheque` (Cheque)
- `other` (Other)

**Steps:**
1. Create 5 invoices, each for $100
2. Record payments using each method:
   - Invoice 1: Method = Cash
   - Invoice 2: Method = EFT/Bank Transfer
   - Invoice 3: Method = Credit/Debit Card
   - Invoice 4: Method = Cheque
   - Invoice 5: Method = Other

**Expected Results:**
- [ ] Cash payment: `method` = "cash"
- [ ] EFT payment: `method` = "eft"
- [ ] Card payment: `method` = "card"
- [ ] Cheque payment: `method` = "cheque"
- [ ] Other payment: `method` = "other"
- [ ] All methods save correctly to database
- [ ] Payment history displays method name
- [ ] No errors for any method

**Code Reference:** invoice.js:907-914 (payment method dropdown)

**Pass Criteria:** All 5 payment methods work correctly

---

### Test 14: Invoice Search and Filter

**Priority:** P1
**Description:** Find invoices by various criteria

**Setup:**
Create 10+ test invoices with variety:
- 3x status = draft
- 3x status = sent
- 2x status = paid
- 2x status = overdue
- Various clients: "John Smith", "Jane Doe", "ABC Corp", "XYZ Ltd"
- Various amounts: $100, $500, $1000, $5000

**Test Search Functionality:**

1. **Search by Invoice Number:**
   - Enter: "INV-1001"
   - Expected: Only INV-1001 shown
   - Search is case-insensitive

2. **Search by Client Name:**
   - Enter: "john"
   - Expected: All invoices for "John Smith" shown
   - Partial match works

3. **Search by Location:**
   - Enter: "sydney"
   - Expected: Invoices with "Sydney" in clientLocation shown

4. **Search by Quote Title:**
   - Enter: "windows"
   - Expected: Invoices with "windows" in quoteTitle shown

**Test Status Filter:**
- [ ] Select "All Status": All invoices shown
- [ ] Select "Draft": Only draft invoices shown
- [ ] Select "Sent": Only sent invoices shown
- [ ] Select "Paid": Only paid invoices shown
- [ ] Select "Overdue": Only overdue invoices shown
- [ ] Select "Cancelled": Only cancelled invoices shown

**Test Sort Options:**
- [ ] Sort by Date: Newest first (descending createdDate)
- [ ] Sort by Number: Ascending invoice number (INV-1001, INV-1002...)
- [ ] Sort by Client: Alphabetical by clientName
- [ ] Sort by Amount: Descending total
- [ ] Sort by Balance: Descending balance

**Test Combined Filters:**
- [ ] Status = "Sent" + Search = "john" → Only sent invoices for John
- [ ] Status = "Paid" + Sort = "Amount" → Paid invoices sorted by amount
- [ ] Search updates results instantly (on input)
- [ ] Filter/sort state persists when modal closed and reopened

**Expected Results:**
- [ ] Search is case-insensitive (uses `.toLowerCase()`)
- [ ] Search matches: invoiceNumber, clientName, clientLocation, quoteTitle
- [ ] Empty search shows all (filtered by status)
- [ ] No results message: "No invoices yet. Create your first invoice!" (if filtered to 0)
- [ ] Filter and search work together
- [ ] Sorting works correctly
- [ ] UI updates immediately

**Code Reference:** invoice.js:484-497 (search/filter event listeners), 514-554 (filter logic)

**Pass Criteria:** Search, filter, and sort all work correctly

---

### Test 15: Year Rollover (Invoice Numbering)

**Priority:** P2
**Description:** Test invoice numbering behavior across year boundary

**⚠️ CORRECTED EXPECTATION:**

The current implementation does **NOT** include year-based numbering or automatic reset on January 1st. Invoice numbers are simple sequential counters.

**Actual Behavior:**
- Invoice numbers: INV-1001, INV-1002, INV-1003...
- No year component (no INV-2025-XXXX format)
- Counter NEVER resets
- Continues indefinitely: INV-999999, INV-1000000...

**Test to Perform:**

1. Set counter to high value:
   ```javascript
   var settings = JSON.parse(localStorage.getItem('invoice-settings'));
   settings.nextInvoiceNumber = 999999;
   localStorage.setItem('invoice-settings', JSON.stringify(settings));
   ```

2. Create invoice
   - Expected: INV-999999

3. Create another invoice
   - Expected: INV-1000000 (counter continues)

**Expected Results:**
- [ ] No year in invoice number
- [ ] No automatic reset on January 1st
- [ ] Counter increments indefinitely
- [ ] No errors at rollover (999999 → 1000000)

**Feature Request:**
If year-based numbering with annual reset is desired, this would need to be implemented as a new feature.

**Pass Criteria:** Counter continues indefinitely without errors

---

## P2: Medium Priority Tests

### Test 16: Empty Invoice (Validation)

**Priority:** P0 (Actually Critical)
**Description:** Try to create invoice with no line items

**Steps:**
1. Clear all quote fields (no windows, no pressure items)
2. Enter client name: "Test Client"
3. Click "Create Invoice from Quote"
4. Observe result

**Expected Results:**
- [ ] Validation error triggered
- [ ] Error message: "Quote must have at least one line item"
- [ ] Invoice NOT created
- [ ] No invalid invoice in database
- [ ] No console errors (controlled error, not crash)

**Code Reference:** invoice.js:104-112

**Pass Criteria:** Validation prevents empty invoices

---

### Test 17: Zero Amount Line Item

**Priority:** P1
**Description:** Line item with $0.00 price

**Steps:**
1. Create quote with line item: 1x Free consultation @ $0.00
2. Add another item: 1x Service @ $100
3. Convert to invoice

**Expected Results:**
- [ ] Invoice created successfully
- [ ] Zero-dollar line item included
- [ ] Subtotal = $100.00 (only paid item)
- [ ] GST = $10.00
- [ ] Total = $110.00
- [ ] No errors

**Use Case:**
- Free services (e.g., free initial consultation)
- Promotional items
- Zero-cost add-ons

**Pass Criteria:** Zero-price items allowed and handled correctly

---

### Test 18: Negative Amounts (Validation)

**Priority:** P1
**Description:** Try to enter negative quantities or prices

**Test in Edit Invoice Form:**

1. Edit invoice
2. Try to set subtotal to -$100
3. Try to set GST to -$10
4. Observe behavior

**Expected Results:**
- [ ] HTML5 validation may prevent negative numbers (type="number")
- [ ] If saved, check invoice behavior
- [ ] Negative totals should be prevented or validated
- [ ] System should not allow negative invoices

**Credit Notes:**
If negative amounts needed (for refunds/credits), should be separate "Credit Note" feature, not negative invoice.

**Pass Criteria:** Negative amounts prevented or handled gracefully

---

### Test 19: Very Large Invoice

**Priority:** P2
**Description:** Invoice with many line items and large total

**Steps:**
1. Create quote with 50+ line items (use mix of windows and pressure items)
2. Total amount > $100,000
3. Convert to invoice
4. View invoice detail
5. Print invoice

**Expected Results:**
- [ ] Invoice created without errors
- [ ] All line items copied correctly
- [ ] Totals calculated accurately (no overflow)
- [ ] UI displays without performance issues
- [ ] Invoice list shows large amount correctly
- [ ] Print layout handles long line item list (pagination if needed)
- [ ] LocalStorage saves large invoice (watch for 5MB limit)

**Performance:**
- Page should remain responsive
- No browser freezing

**Pass Criteria:** Large invoices handled without issues

---

### Test 20: Special Characters in Text Fields

**Priority:** P2
**Description:** Client name with special characters, emojis

**Steps:**
1. Create invoice with client name: "John's Café & Bar 🍕"
2. Add notes with special chars: "Payment via e-transfer @ 2pm"
3. Save invoice
4. View invoice detail
5. Print invoice

**Expected Results:**
- [ ] Special characters saved correctly (', &, @)
- [ ] Emojis saved and displayed (🍕)
- [ ] HTML escaped properly (no XSS vulnerabilities)
- [ ] Print view shows characters correctly
- [ ] No console errors

**Security Test:**
- Try client name: `<script>alert('XSS')</script>`
- Expected: Script NOT executed (should be escaped)
- Code uses `escapeHtml()` function (invoice.js:1428-1433)

**Pass Criteria:** Special characters handled safely, no XSS

---

### Test 21: LocalStorage Full (5MB Limit)

**Priority:** P2
**Description:** What happens when LocalStorage quota exceeded?

**Setup:**
1. Create many large invoices to approach 5MB limit
2. Or manually add large data to LocalStorage

**Steps:**
1. Monitor LocalStorage size
2. Create invoices until quota exceeded
3. Observe error handling

**Expected Results:**
- [ ] Error caught in try/catch (invoice.js:44-53)
- [ ] Error message shown: "Failed to save invoice data"
- [ ] Console error: "Failed to save invoices"
- [ ] Application doesn't crash
- [ ] User notified of storage issue

**Recommended Solution:**
- Implement data export/import
- Warn user when approaching limit
- Suggest archiving old paid invoices

**Code Reference:** invoice.js:43-54 (saveInvoices error handling)

**Pass Criteria:** Graceful error handling when storage full

---

## Data Integrity Tests

### Test 22: Invoice-Quote Relationship

**Priority:** P1
**Description:** Verify invoice relationship to source quote

**⚠️ CRITICAL LIMITATION:**

The current implementation does **NOT** store a `quoteId` field linking invoices back to their source quotes. This is an **expected limitation** or **missing feature**.

**What Works:**
- [ ] Invoice copies all quote data (line items, client info, totals)
- [ ] `quoteTitle` and `jobType` copied from quote
- [ ] Client info matches quote

**What Doesn't Work:**
- [ ] NO `quoteId` field in invoice data structure
- [ ] Cannot navigate from invoice back to original quote
- [ ] No link between invoice and quote in database
- [ ] Quote status doesn't update when invoice created

**Test:**
1. Create quote Q1
2. Convert to invoice I1
3. Check invoice data structure:
   ```javascript
   var invoices = JSON.parse(localStorage.getItem('invoice-database'));
   console.log(invoices[0].quoteId);  // undefined (field doesn't exist)
   ```

**Expected Results:**
- [ ] `quoteId` field does NOT exist
- [ ] Invoice is standalone after creation
- [ ] This is a **known limitation**

**Feature Request:**
If quote linkage is needed, file enhancement request to:
- Add `quoteId` field to invoice schema
- Store original quote ID when converting
- Add "View Source Quote" button in invoice detail

**Pass Criteria:** Document this limitation, decide if acceptable

---

### Test 23: Client Relationship

**Priority:** P1
**Description:** Verify invoice links to client record

**Steps:**
1. Create client in ClientDatabase: "John Smith" (john@example.com, 0400123456)
2. Create quote for "John Smith"
3. Convert to invoice
4. Check invoice client fields

**Expected Results:**
- [ ] Invoice `clientName` = "John Smith"
- [ ] Invoice `clientEmail` populated from ClientDatabase
- [ ] Invoice `clientPhone` populated from ClientDatabase
- [ ] If client not in database, email/phone fields empty

**Code Reference:** invoice.js:168-174 (client lookup)

**Limitation:**
- No `clientId` field (similar to quoteId issue)
- Invoice copies client data but doesn't maintain link
- Editing client in database won't update existing invoices

**Pass Criteria:** Client data copied correctly at creation time

---

### Test 24: LocalStorage Persistence

**Priority:** P0
**Description:** Verify invoices persist across page reloads and browser sessions

**Steps:**
1. Create 3 invoices with different data
2. Record payments on 1 invoice
3. Note all invoice details
4. **Refresh page** (F5)
5. Open invoice list
6. Verify all invoices present
7. **Close browser tab**
8. Reopen page in new tab
9. Verify all invoices still present
10. Check invoice details match

**Expected Results:**
- [ ] All 3 invoices persist after refresh
- [ ] Payment data persists
- [ ] Invoice numbers unchanged
- [ ] All client data intact
- [ ] Totals correct
- [ ] Status correct
- [ ] statusHistory preserved
- [ ] Settings persisted (nextInvoiceNumber, etc.)
- [ ] Data survives browser close/reopen

**LocalStorage Keys:**
- [ ] 'invoice-database' contains invoices array
- [ ] 'invoice-settings' contains settings object

**Manual Verification:**
```javascript
// Check in console:
console.log(localStorage.getItem('invoice-database'));
console.log(localStorage.getItem('invoice-settings'));
```

**Pass Criteria:** All data persists correctly

---

### Test 25: Regression - Existing Features Still Work

**Priority:** P0
**Description:** Adding invoices didn't break quote functionality

**Test Quote System:**
- [ ] Can still create quotes
- [ ] Quote calculations correct (subtotal, GST, total)
- [ ] Quote wizard mode works
- [ ] Quote history saves
- [ ] Client database works
- [ ] Import/export works
- [ ] Print quote works
- [ ] No console errors

**Test UI:**
- [ ] All buttons clickable
- [ ] Modals open/close
- [ ] Accordions expand/collapse
- [ ] Theme switching works
- [ ] Responsive design intact

**Pass Criteria:** No regressions, all existing features functional

---

## New Critical Tests (Identified During Review)

### Test 26: Invoice Settings Persistence

**Priority:** P0
**Description:** Verify invoice settings persist across page reloads

**Steps:**
1. Open Invoice Management modal
2. Click "⚙ Settings" button
3. Change settings:
   - Invoice Prefix: "QUOTE-" (default: "INV-")
   - Next Invoice Number: 5000 (default: 1001)
   - Payment Terms: 14 days (default: 7)
   - Bank Name: "Commonwealth Bank"
   - Account Name: "925 Pressure Glass"
   - BSB: "123-456"
   - Account Number: "12345678"
   - ABN: "12 345 678 901"
4. Click "Save Settings"
5. **Refresh page**
6. Open Settings again
7. Verify all fields

**Expected Results:**
- [ ] All settings saved to LocalStorage
- [ ] Success message: "Settings saved"
- [ ] After refresh: all settings restored
- [ ] invoicePrefix = "QUOTE-"
- [ ] nextInvoiceNumber = 5000
- [ ] paymentTermsDays = 14
- [ ] All bank details preserved
- [ ] Settings key: 'invoice-settings'

**Create Invoice After Settings Change:**
- [ ] New invoice has number: QUOTE-5000 (not INV-1001)
- [ ] Due date = invoice date + 14 days
- [ ] Print view shows bank details

**CRITICAL:**
If settings don't persist, invoice numbering could reset to 1001, causing **duplicate invoice numbers**.

**Code Reference:** invoice.js:57-82 (loadSettings, saveSettings)

**Pass Criteria:** All settings persist correctly

---

### Test 27: Balance Recalculation After Edit

**Priority:** P0
**Description:** Verify balance recalculates when invoice total edited

**Preconditions:**
- Invoice: total = $500, amountPaid = $300, balance = $200, status = sent

**Steps:**
1. Open invoice detail
2. Click "Edit Invoice"
3. Change subtotal from $454.55 to $727.27
4. GST auto-recalculates to $72.73
5. Total auto-recalculates to $800.00
6. Save invoice
7. Check balance

**Expected Results:**
- [ ] Subtotal changes to $727.27
- [ ] GST recalculates to $72.73
- [ ] Total recalculates to $800.00
- [ ] Balance recalculates: $800.00 - $300.00 = $500.00
- [ ] amountPaid remains $300.00 (unchanged)
- [ ] Status changes from "sent" to "sent" (or stays same)
- [ ] If balance > 0 and status was "paid", status should change

**Edge Case - Total Decreased Below Paid:**
- [ ] Edit invoice: change total from $500 to $200
- [ ] amountPaid = $300, balance = -$100 (overpaid)
- [ ] Status remains "paid"
- [ ] Negative balance displayed

**Code Reference:** invoice.js:1597 - `invoice.balance = invoice.total - invoice.amountPaid;`

**Pass Criteria:** Balance always = total - amountPaid after edit

---

### Test 28: Automatic Overdue Detection Timing

**Priority:** P1
**Description:** Verify when checkOverdueInvoices() runs automatically

**Setup:**
1. Create invoice with dueDate = 2 days ago
2. Set status = 'sent', balance > 0

**Test Triggers:**

**Trigger 1: Opening Invoice List**
- [ ] Open invoice list modal
- [ ] `checkOverdueInvoices()` runs (invoice.js:562)
- [ ] Invoice auto-marked overdue
- [ ] statusHistory updated

**Trigger 2: Page Load**
- [ ] Refresh page
- [ ] Open invoice list
- [ ] Overdue detection runs

**Test Multiple Overdue:**
- [ ] Create 5 sent invoices with past due dates
- [ ] Open invoice list
- [ ] All 5 auto-marked overdue
- [ ] Success message or count shown

**Expected Results:**
- [ ] Function runs automatically (no user action)
- [ ] Only sent invoices checked (not draft, paid, cancelled)
- [ ] Only invoices with balance > 0 marked overdue
- [ ] `dueDate < now` triggers overdue
- [ ] statusHistory note: "Automatically marked overdue"
- [ ] Changes saved to LocalStorage

**Code Reference:** invoice.js:305-326

**Pass Criteria:** Automatic detection works on list open

---

### Test 29: Detailed Filter and Search Testing

**Priority:** P1
**Description:** Comprehensive search/filter/sort testing

(Already covered in Test 14, but expanded here)

**Search Query Persistence:**
1. Search for "john"
2. Close modal
3. Reopen modal
4. Check search box

**Expected:**
- [ ] Search query "john" still in input field
- [ ] Results still filtered
- [ ] searchState persists (invoice.js:389-393)

**Code Reference:** invoice.js:499-508 (restore search state)

**Pass Criteria:** Search state persists across modal close/open

---

### Test 30: Invoice Requires Line Items (Validation)

**Priority:** P0
**Description:** Cannot create invoice without line items

(Already covered in Test 16, repeated here for P0 priority)

**Steps:**
1. Clear all quote line items
2. Enter client name only
3. Click "Create Invoice from Quote"

**Expected:**
- [ ] Error: "Quote must have at least one line item"
- [ ] Invoice NOT created
- [ ] Database unchanged

**Code Reference:** invoice.js:104-112

**Pass Criteria:** Validation enforced

---

### Test 31: Concurrent Payment Recording (Race Condition)

**Priority:** P1
**Description:** Prevent duplicate payment from rapid double-clicks

**Steps:**
1. Open payment modal
2. Enter payment: $100
3. **Rapidly double-click** "Record Payment" button
4. Check payment history

**Expected Results:**
- [ ] Only ONE payment of $100 recorded
- [ ] Modal closes after first submission
- [ ] Second click ignored (modal already closing)
- [ ] No duplicate payment entries in payments array

**Possible Issue:**
If modal doesn't close fast enough, second click might record duplicate payment.

**Workaround:**
- Disable button on first click
- Or check if payment already being processed

**Pass Criteria:** No duplicate payments created

---

### Test 32: Search/Sort State Persistence

**Priority:** P2
**Description:** Filter/search/sort state persists when modal reopened

(Already covered in Test 29, but formalized here)

**Steps:**
1. Open invoice list
2. Set status filter: "Paid"
3. Enter search: "john"
4. Set sort: "Amount"
5. **Close modal**
6. **Reopen invoice list**

**Expected Results:**
- [ ] Status filter still "Paid"
- [ ] Search input still "john"
- [ ] Sort still "Amount"
- [ ] Results match previous view
- [ ] Filters applied immediately on open

**Code Reference:** invoice.js:389-393 (searchState object), 499-508 (restore state)

**Pass Criteria:** All UI state persists

---

### Test 33: Invoice Number Counter Manipulation (CRITICAL BUG)

**Priority:** P0
**Description:** Duplicate invoice numbers via settings

**Steps:**
1. Create invoice #1 → INV-1001
2. Create invoice #2 → INV-1002
3. Create invoice #3 → INV-1003
4. Open Settings
5. Change "Next Invoice Number" from 1004 to 1002
6. Save settings
7. Create invoice #4
8. Check invoice number

**Expected Results (CURRENT BUGGY BEHAVIOR):**
- [ ] Invoice #4 gets number INV-1002
- [ ] **DUPLICATE NUMBER EXISTS** (two invoices with INV-1002)
- [ ] System does NOT prevent this
- [ ] No validation or warning
- [ ] Database has duplicate invoice numbers

**Expected Results (CORRECT BEHAVIOR):**
- Should prevent decreasing counter
- Or warn: "This may create duplicate invoice numbers"
- Or validate uniqueness before saving

**CRITICAL BUG CONFIRMED:**
This is a **data integrity bug**. File as Bug #2.

**Workaround:**
- Never decrease invoice number in settings
- Only increase or leave unchanged

**Pass Criteria:** Document bug, file issue

---

## Risk Assessment & Edge Cases

### High Risk Areas:

1. **Invoice Numbering**
   - Duplicates would be catastrophic for accounting
   - Test: Counter manipulation (Test 33)
   - Test: Concurrent creation (two tabs)

2. **GST Calculation**
   - Errors affect legal compliance (ATO reporting)
   - Test: All scenarios in Test 4
   - Test: Manual edit validation

3. **Payment Tracking**
   - Wrong amounts = accounting nightmare
   - Test: Partial payments (Test 5)
   - Test: Balance recalculation (Test 27)

4. **Editing Paid Invoices**
   - Data corruption risk
   - Test: Edit paid invoice (Test 11)
   - **FILE BUG**

5. **LocalStorage Corruption**
   - Could lose all invoices
   - Test: Persistence (Test 24)
   - Test: Storage full (Test 21)

### Mitigation Strategies:

- **Backup Data:** Export invoices to CSV regularly
- **Validation:** Add more validation before save
- **Audit Trail:** Keep full history of changes
- **Testing:** Run full test suite before production
- **Monitoring:** Check console for errors regularly

---

## Test Data Sets

### Small Invoice
```
Client: Small Customer (small@example.com)
Items:
  - Window cleaning: 5 windows @ $10 = $50
Subtotal: $50.00
GST: $5.00
Total: $55.00
```

### Medium Invoice
```
Client: John Smith (john@smith.com)
Items:
  - Window cleaning: 12 windows @ $12.50 = $150.00
  - Pressure washing: 40 sqm @ $8 = $320.00
  - Callout fee: 1 @ $85 = $85.00
Subtotal: $555.00
GST: $55.50
Total: $610.50
```

### Large Invoice
```
Client: ABC Property Management (admin@abcpm.com)
Items:
  - Window cleaning: 50 windows @ $12 = $600.00
  - Pressure washing: 200 sqm @ $9 = $1,800.00
  - High-reach premium: 1 @ $450 = $450.00
  - Callout fee: 1 @ $100 = $100.00
Subtotal: $2,950.00
GST: $295.00
Total: $3,245.00
```

### Edge Case Invoice (GST Rounding)
```
Client: Rounding Test (test@example.com)
Items:
  - Service: 1 @ $333.33
Subtotal: $333.33
GST: $33.33 (rounds from $33.333)
Total: $366.66
```

---

## Sign-Off Criteria

### Production Ready When:

**Must Pass (P0 Tests):**
- [ ] All P0 tests pass (100%)
- [ ] Test 1: Create from quote ✓
- [ ] Test 2: Record payment ✓
- [ ] Test 3: Invoice numbering ✓
- [ ] Test 4: GST calculations ✓
- [ ] Test 24: LocalStorage persistence ✓
- [ ] Test 26: Settings persistence ✓
- [ ] Test 27: Balance recalculation ✓
- [ ] Test 30: Require line items ✓

**Should Pass (P1 Tests):**
- [ ] All P1 tests pass (>95%)
- [ ] No critical bugs (unless documented and accepted)

**General Criteria:**
- [ ] No console errors in any test
- [ ] GST calculations verified accurate (calculator)
- [ ] Invoice numbering verified sequential
- [ ] Payment tracking verified accurate
- [ ] PDF/Print generation working
- [ ] Data persists correctly across sessions
- [ ] Manual testing by 2+ people completed
- [ ] Real-world test data created and verified

**Known Issues Documented:**
- [ ] Paid invoices can be edited (Bug #1)
- [ ] Duplicate invoice numbers possible (Bug #2)
- [ ] No quote linkage (Limitation)
- [ ] Overpayment allowed (Feature or bug?)

**Data Safety:**
- [ ] LocalStorage backup/export available
- [ ] Users trained on NOT editing paid invoices
- [ ] Users trained on NOT decreasing invoice counter

---

## Bug Tracking Section

### Bugs Found During Testing:

#### Bug #1: Paid Invoices Can Be Edited
- **Severity:** CRITICAL
- **Status:** [Open/Fixed/Won't Fix]
- **Found By:** ________
- **Date:** ________
- **Steps to Reproduce:** See Test 11, Scenario C
- **Impact:** Financial data corruption
- **Fix Required:** Yes / No / Documented Limitation

#### Bug #2: Duplicate Invoice Numbers via Settings
- **Severity:** CRITICAL
- **Status:** [Open/Fixed/Won't Fix]
- **Found By:** ________
- **Date:** ________
- **Steps to Reproduce:** See Test 33
- **Impact:** Accounting compliance failure
- **Fix Required:** Yes / No / Documented Limitation

#### Bug #3: Total ≠ Subtotal + GST Allowed in Edit
- **Severity:** HIGH
- **Status:** [Open/Fixed/Won't Fix]
- **Found By:** ________
- **Date:** ________
- **Impact:** Tax reporting errors
- **Fix Required:** Yes / No / Documented Limitation

### Questions Raised:

1. Should paid invoices be editable? (Yes/No/Limited)
2. Should overpayment be allowed? (Yes/No/Warning)
3. Should quote linkage be added? (Future feature?)
4. Should year-based numbering be added? (Future feature?)

### Improvements Needed:

1. Add validation to prevent editing paid invoices
2. Add uniqueness check for invoice numbers
3. Add quoteId field to link invoices to quotes
4. Add clientId field to link invoices to clients
5. Implement credit notes for refunds (instead of negative invoices)
6. Add data export functionality
7. Add "void invoice" instead of delete
8. Add validation: total must equal subtotal + GST

---

## Testing Log

| Test ID | Description | Date | Tester | Status | Notes |
|---------|-------------|------|--------|--------|-------|
| Test 1 | Create from quote | | | ☐ Pass ☐ Fail | |
| Test 2 | Record payment | | | ☐ Pass ☐ Fail | |
| Test 3 | Numbering | | | ☐ Pass ☐ Fail | |
| Test 4 | GST calculation | | | ☐ Pass ☐ Fail | |
| ... | ... | | | | |

---

## Notes

- Test plan corrected based on actual implementation (invoice.js)
- Invoice number format: INV-XXXX (NOT INV-YYYY-NNNNNN)
- Payment method values: cash, eft, card, cheque, other
- No quoteId or clientId fields (limitation)
- Print is HTML view, not automatic PDF
- Overpayment allowed with confirmation
- All status transitions allowed (no validation)
- Paid invoices can be edited (BUG)

**Important:** This test plan reflects the ACTUAL implementation, not the original assumptions.

---

## Automation Coverage

**Can Automate (Playwright):**
- Invoice creation (Test 1)
- Payment recording (Test 2, 5, 6)
- Invoice numbering sequence (Test 3)
- Search/filter/sort (Test 14, 29)
- Settings persistence (Test 26)
- LocalStorage persistence (Test 24)
- Modal interactions
- Status changes

**Must Test Manually:**
- GST calculation accuracy (use calculator)
- Print layout quality
- Visual design/styling
- Real-world user flows
- Edge case exploration
- Final sign-off

**Current Automation:**
- tests/invoice-interface.spec.js (UI only, expand to functional tests)

---

**END OF TEST PLAN**

---

**Next Steps:**
1. Review and approve this test plan
2. Execute all P0 tests (8 tests)
3. Execute all P1 tests (~15 tests)
4. File bugs for critical issues
5. Decide: Fix bugs or document as limitations
6. Execute P2 tests if time allows
7. Manual exploratory testing (2+ hours)
8. Final sign-off meeting
9. Production deployment decision
