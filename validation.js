// validation.js - Production-grade input validation for invoice system
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // ============================================================================
  // ERROR CODE CONSTANTS
  // ============================================================================

  var ERROR_CODES = {
    // Invoice validation errors (INV001-INV099)
    INV001: 'Client name is required',
    INV002: 'Client name must be between 2 and 100 characters',
    INV003: 'Invoice must have at least one line item',
    INV004: 'GST must be exactly 10% of subtotal',
    INV005: 'Invoice total must equal subtotal + GST',
    INV006: 'Invoice number is required',
    INV007: 'Invoice number already exists',
    INV008: 'Invalid invoice number format',
    INV009: 'Subtotal must be greater than zero',
    INV010: 'GST cannot be negative',
    INV011: 'Total must be greater than zero',
    INV012: 'Status is required',
    INV013: 'Invalid status value',
    INV014: 'Due date is required',
    INV015: 'Due date must be a valid date',
    INV016: 'Due date cannot be more than 1 year in the future',
    INV017: 'Due date cannot be in the past for new invoices',
    INV018: 'Invoice total cannot exceed $999,999.99',
    INV019: 'Client email must be valid',
    INV020: 'Client phone must be valid',

    // Line item validation errors (LINE001-LINE099)
    LINE001: 'Line item description is required',
    LINE002: 'Line item description must be between 1 and 500 characters',
    LINE003: 'Line item quantity is required',
    LINE004: 'Line item quantity must be greater than zero',
    LINE005: 'Line item quantity cannot exceed 9999',
    LINE006: 'Line item rate is required',
    LINE007: 'Line item rate cannot be negative',
    LINE008: 'Line item rate cannot exceed $999,999.99',
    LINE009: 'Line item total must equal quantity × rate',

    // Payment validation errors (PAY001-PAY099)
    PAY001: 'Payment amount is required',
    PAY002: 'Payment amount must be greater than zero',
    PAY003: 'Payment cannot exceed invoice balance',
    PAY004: 'Payment method is required',
    PAY005: 'Invalid payment method',
    PAY006: 'Payment date is required',
    PAY007: 'Payment date must be a valid date',
    PAY008: 'Payment date cannot be in the future',
    PAY009: 'Payment date cannot be before invoice creation date',
    PAY010: 'Payment date cannot be more than 2 years in the past',
    PAY011: 'Payment reference cannot exceed 50 characters',
    PAY012: 'Payment notes cannot exceed 500 characters',
    PAY013: 'Payment amount has too many decimal places (max 2)',

    // Bank details validation errors (BANK001-BANK099)
    BANK001: 'BSB must be 6 digits',
    BANK002: 'Invalid BSB format',
    BANK003: 'Account number must be 6-9 digits',
    BANK004: 'Account name must be between 2 and 100 characters',
    BANK005: 'ABN must be 11 digits',
    BANK006: 'Invalid ABN format',

    // Business logic errors (BIZ001-BIZ099)
    BIZ001: 'Status "paid" requires amountPaid to equal total',
    BIZ002: 'Status "cancelled" cannot have payments',
    BIZ003: 'Cannot modify a paid invoice',
    BIZ004: 'Cannot add payment to cancelled invoice',
    BIZ005: 'Invoice was modified in another window'
  };

  // ============================================================================
  // VALIDATION RULES
  // ============================================================================

  var VALIDATION_RULES = {
    invoiceNumber: {
      required: true,
      pattern: /^[A-Z]{2,5}-\d{4,10}$/,
      maxLength: 50
    },
    clientName: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    clientEmail: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    clientPhone: {
      required: false,
      pattern: /^[\d\s\-\+\(\)]{8,20}$/
    },
    subtotal: {
      required: true,
      min: 0.01,
      max: 999999.99
    },
    gst: {
      required: true,
      min: 0,
      max: 99999.99
    },
    total: {
      required: true,
      min: 0.01,
      max: 999999.99
    },
    status: {
      required: true,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    },
    paymentMethod: {
      required: true,
      enum: ['cash', 'eft', 'card', 'cheque', 'other']
    },
    bsb: {
      pattern: /^\d{3}-?\d{3}$/
    },
    accountNumber: {
      pattern: /^\d{6,9}$/
    },
    abn: {
      pattern: /^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/
    }
  };

  // Valid payment methods
  var VALID_PAYMENT_METHODS = ['cash', 'eft', 'card', 'cheque', 'other'];

  // Valid invoice statuses
  var VALID_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

  // Maximum values
  var MAX_AMOUNT = 999999.99;
  var MAX_LINE_ITEM_QUANTITY = 9999;
  var MAX_DESCRIPTION_LENGTH = 500;
  var MAX_REFERENCE_LENGTH = 50;
  var MAX_NOTES_LENGTH = 500;
  var MAX_CLIENT_NAME_LENGTH = 100;
  var MAX_FUTURE_DAYS = 365; // 1 year
  var MAX_PAST_DAYS = 730; // 2 years

  // Tolerance for floating-point comparisons (1 cent)
  var AMOUNT_TOLERANCE = 0.01;

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Compare two amounts with tolerance for floating-point precision
   * @param {number} a - First amount
   * @param {number} b - Second amount
   * @param {number} tolerance - Tolerance (default: 0.01)
   * @returns {boolean} - True if amounts are equal within tolerance
   */
  function compareAmounts(a, b, tolerance) {
    tolerance = tolerance || AMOUNT_TOLERANCE;
    return Math.abs(a - b) < tolerance;
  }

  /**
   * Calculate GST (10%) with proper rounding
   * @param {number} subtotal - Subtotal amount
   * @returns {number} - GST amount rounded to 2 decimal places
   */
  function calculateGST(subtotal) {
    return Math.round(subtotal * 0.10 * 100) / 100;
  }

  /**
   * Round amount to 2 decimal places
   * @param {number} amount - Amount to round
   * @returns {number} - Rounded amount
   */
  function roundAmount(amount) {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Check if value is a valid number
   * @param {*} value - Value to check
   * @returns {boolean} - True if valid number
   */
  function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Check if value is a valid date
   * @param {*} value - Value to check (timestamp or Date object)
   * @returns {boolean} - True if valid date
   */
  function isValidDate(value) {
    if (typeof value === 'number') {
      return !isNaN(value) && value > 0;
    }
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    return false;
  }

  /**
   * Sanitize text to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  function sanitizeText(text) {
    if (!text) return '';
    return String(text)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Count decimal places in a number
   * @param {number} num - Number to check
   * @returns {number} - Number of decimal places
   */
  function countDecimalPlaces(num) {
    if (Math.floor(num) === num) return 0;
    var str = num.toString();
    if (str.indexOf('.') === -1) return 0;
    return str.split('.')[1].length || 0;
  }

  /**
   * Format error object
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {string} severity - Error severity (error, warning)
   * @param {string} code - Error code
   * @returns {object} - Formatted error object
   */
  function createError(field, message, severity, code) {
    return {
      field: field,
      message: message,
      severity: severity || 'error',
      code: code || null
    };
  }

  // ============================================================================
  // FIELD VALIDATORS
  // ============================================================================

  /**
   * Validate required field
   * @param {*} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {object|null} - Error object or null if valid
   */
  function validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return createError(fieldName, fieldName + ' is required', 'error', 'REQUIRED');
    }
    if (typeof value === 'string' && value.trim() === '') {
      return createError(fieldName, fieldName + ' cannot be empty', 'error', 'REQUIRED');
    }
    return null;
  }

  /**
   * Validate string length
   * @param {string} value - Value to validate
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @param {string} fieldName - Field name for error message
   * @returns {object|null} - Error object or null if valid
   */
  function validateLength(value, min, max, fieldName) {
    if (!value) return null;
    var length = String(value).length;

    if (min && length < min) {
      return createError(
        fieldName,
        fieldName + ' must be at least ' + min + ' characters',
        'error',
        'LENGTH'
      );
    }

    if (max && length > max) {
      return createError(
        fieldName,
        fieldName + ' cannot exceed ' + max + ' characters',
        'error',
        'LENGTH'
      );
    }

    return null;
  }

  /**
   * Validate number range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {string} fieldName - Field name for error message
   * @returns {object|null} - Error object or null if valid
   */
  function validateRange(value, min, max, fieldName) {
    if (!isValidNumber(value)) {
      return createError(fieldName, fieldName + ' must be a valid number', 'error', 'NUMBER');
    }

    if (min !== undefined && value < min) {
      return createError(
        fieldName,
        fieldName + ' must be at least ' + min,
        'error',
        'RANGE'
      );
    }

    if (max !== undefined && value > max) {
      return createError(
        fieldName,
        fieldName + ' cannot exceed ' + max,
        'error',
        'RANGE'
      );
    }

    return null;
  }

  /**
   * Validate pattern (regex)
   * @param {string} value - Value to validate
   * @param {RegExp} pattern - Regular expression pattern
   * @param {string} fieldName - Field name for error message
   * @param {string} formatDescription - Human-readable format description
   * @returns {object|null} - Error object or null if valid
   */
  function validatePattern(value, pattern, fieldName, formatDescription) {
    if (!value) return null;

    if (!pattern.test(String(value))) {
      var message = fieldName + ' has invalid format';
      if (formatDescription) {
        message += ' (expected: ' + formatDescription + ')';
      }
      return createError(fieldName, message, 'error', 'PATTERN');
    }

    return null;
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {object|null} - Error object or null if valid
   */
  function validateEmail(email) {
    if (!email) return null;

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return createError(
        'clientEmail',
        'Email address is not valid',
        'error',
        'INV019'
      );
    }

    return null;
  }

  /**
   * Validate BSB number
   * @param {string} bsb - BSB to validate
   * @returns {object|null} - Error object or null if valid
   */
  function validateBSB(bsb) {
    if (!bsb) return null;

    // Remove hyphen and check if it's 6 digits
    var cleaned = bsb.replace(/-/g, '');
    if (!/^\d{6}$/.test(cleaned)) {
      return createError(
        'bsb',
        'BSB must be 6 digits (format: 123-456 or 123456)',
        'error',
        'BANK001'
      );
    }

    return null;
  }

  /**
   * Validate account number
   * @param {string} accountNumber - Account number to validate
   * @returns {object|null} - Error object or null if valid
   */
  function validateAccountNumber(accountNumber) {
    if (!accountNumber) return null;

    if (!/^\d{6,9}$/.test(accountNumber)) {
      return createError(
        'accountNumber',
        'Account number must be 6-9 digits',
        'error',
        'BANK003'
      );
    }

    return null;
  }

  /**
   * Validate ABN
   * @param {string} abn - ABN to validate
   * @returns {object|null} - Error object or null if valid
   */
  function validateABN(abn) {
    if (!abn) return null;

    // Remove spaces and check if it's 11 digits
    var cleaned = abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(cleaned)) {
      return createError(
        'abn',
        'ABN must be 11 digits (format: 12 345 678 901 or 12345678901)',
        'error',
        'BANK005'
      );
    }

    return null;
  }

  // ============================================================================
  // INVOICE VALIDATION
  // ============================================================================

  /**
   * Validate complete invoice object
   * @param {object} invoice - Invoice to validate
   * @param {object} context - Validation context (existingInvoices, mode)
   * @returns {object} - Validation result {valid: boolean, errors: array}
   */
  function validateInvoice(invoice, context) {
    var errors = [];
    context = context || {};
    var existingInvoices = context.existingInvoices || [];
    var mode = context.mode || 'create';

    // Basic null check
    if (!invoice) {
      errors.push(createError('invoice', 'Invoice object is required', 'error'));
      return { valid: false, errors: errors };
    }

    // 1. INVOICE NUMBER VALIDATION
    var invoiceNumberError = validateRequired(invoice.invoiceNumber, 'Invoice number');
    if (invoiceNumberError) {
      errors.push(createError('invoiceNumber', ERROR_CODES.INV006, 'error', 'INV006'));
    } else {
      // Check format
      if (!/^[A-Z]{2,5}-\d+$/.test(invoice.invoiceNumber)) {
        errors.push(createError(
          'invoiceNumber',
          'Invoice number must be in format: PREFIX-NUMBER (e.g., INV-1001)',
          'error',
          'INV008'
        ));
      }

      // Check for duplicates (only in create mode or if invoice number changed)
      if (mode === 'create' || context.invoiceNumberChanged) {
        for (var i = 0; i < existingInvoices.length; i++) {
          if (existingInvoices[i].invoiceNumber === invoice.invoiceNumber &&
              existingInvoices[i].id !== invoice.id) {
            errors.push(createError(
              'invoiceNumber',
              'Invoice number "' + invoice.invoiceNumber + '" already exists',
              'error',
              'INV007'
            ));
            break;
          }
        }
      }
    }

    // 2. CLIENT NAME VALIDATION
    var clientNameError = validateRequired(invoice.clientName, 'Client name');
    if (clientNameError) {
      errors.push(createError('clientName', ERROR_CODES.INV001, 'error', 'INV001'));
    } else {
      var lengthError = validateLength(invoice.clientName, 2, MAX_CLIENT_NAME_LENGTH, 'Client name');
      if (lengthError) {
        errors.push(createError('clientName', ERROR_CODES.INV002, 'error', 'INV002'));
      }
    }

    // 3. CLIENT EMAIL VALIDATION (optional)
    if (invoice.clientEmail) {
      var emailError = validateEmail(invoice.clientEmail);
      if (emailError) {
        errors.push(emailError);
      }
    }

    // 4. LINE ITEMS VALIDATION
    var hasLineItems = false;

    // Check windowLines
    if (invoice.windowLines && invoice.windowLines.length > 0) {
      hasLineItems = true;
      for (var j = 0; j < invoice.windowLines.length; j++) {
        var lineErrors = validateLineItem(invoice.windowLines[j], j, 'window');
        errors = errors.concat(lineErrors);
      }
    }

    // Check pressureLines
    if (invoice.pressureLines && invoice.pressureLines.length > 0) {
      hasLineItems = true;
      for (var k = 0; k < invoice.pressureLines.length; k++) {
        var pressureErrors = validateLineItem(invoice.pressureLines[k], k, 'pressure');
        errors = errors.concat(pressureErrors);
      }
    }

    if (!hasLineItems) {
      errors.push(createError('lineItems', ERROR_CODES.INV003, 'error', 'INV003'));
    }

    // 5. SUBTOTAL VALIDATION
    if (!isValidNumber(invoice.subtotal) || invoice.subtotal <= 0) {
      errors.push(createError('subtotal', ERROR_CODES.INV009, 'error', 'INV009'));
    } else if (invoice.subtotal > MAX_AMOUNT) {
      errors.push(createError(
        'subtotal',
        'Subtotal cannot exceed $' + MAX_AMOUNT.toFixed(2),
        'error',
        'INV018'
      ));
    }

    // 6. GST VALIDATION
    if (!isValidNumber(invoice.gst) || invoice.gst < 0) {
      errors.push(createError('gst', ERROR_CODES.INV010, 'error', 'INV010'));
    } else if (invoice.subtotal > 0) {
      var expectedGST = calculateGST(invoice.subtotal);
      if (!compareAmounts(invoice.gst, expectedGST)) {
        errors.push(createError(
          'gst',
          'GST must be exactly 10% of subtotal. Expected: $' + expectedGST.toFixed(2) +
          ', got: $' + invoice.gst.toFixed(2),
          'error',
          'INV004'
        ));
      }
    }

    // 7. TOTAL VALIDATION
    if (!isValidNumber(invoice.total) || invoice.total <= 0) {
      errors.push(createError('total', ERROR_CODES.INV011, 'error', 'INV011'));
    } else if (invoice.total > MAX_AMOUNT) {
      errors.push(createError('total', ERROR_CODES.INV018, 'error', 'INV018'));
    } else {
      var expectedTotal = roundAmount(invoice.subtotal + invoice.gst);
      if (!compareAmounts(invoice.total, expectedTotal)) {
        errors.push(createError(
          'total',
          'Total must equal subtotal + GST. Expected: $' + expectedTotal.toFixed(2) +
          ', got: $' + invoice.total.toFixed(2),
          'error',
          'INV005'
        ));
      }
    }

    // 8. STATUS VALIDATION
    if (!invoice.status) {
      errors.push(createError('status', ERROR_CODES.INV012, 'error', 'INV012'));
    } else if (VALID_STATUSES.indexOf(invoice.status) === -1) {
      errors.push(createError(
        'status',
        'Status must be one of: ' + VALID_STATUSES.join(', '),
        'error',
        'INV013'
      ));
    }

    // 9. DUE DATE VALIDATION
    if (!invoice.dueDate) {
      errors.push(createError('dueDate', ERROR_CODES.INV014, 'error', 'INV014'));
    } else if (!isValidDate(invoice.dueDate)) {
      errors.push(createError('dueDate', ERROR_CODES.INV015, 'error', 'INV015'));
    } else {
      var now = Date.now();
      var dueDate = typeof invoice.dueDate === 'number' ? invoice.dueDate : invoice.dueDate.getTime();
      var daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);

      // Check if too far in future
      if (daysUntilDue > MAX_FUTURE_DAYS) {
        errors.push(createError(
          'dueDate',
          'Due date cannot be more than 1 year in the future',
          'error',
          'INV016'
        ));
      }

      // Check if in past (only for new invoices)
      if (mode === 'create' && daysUntilDue < -1) {
        errors.push(createError(
          'dueDate',
          'Due date cannot be in the past for new invoices',
          'error',
          'INV017'
        ));
      }
    }

    // 10. BANK DETAILS VALIDATION (if provided)
    if (invoice.bankDetails) {
      var bsbError = validateBSB(invoice.bankDetails.bsb);
      if (bsbError) errors.push(bsbError);

      var accountError = validateAccountNumber(invoice.bankDetails.accountNumber);
      if (accountError) errors.push(accountError);

      var abnError = validateABN(invoice.bankDetails.abn);
      if (abnError) errors.push(abnError);

      if (invoice.bankDetails.accountName) {
        var nameError = validateLength(
          invoice.bankDetails.accountName,
          2,
          MAX_CLIENT_NAME_LENGTH,
          'Account name'
        );
        if (nameError) {
          errors.push(createError(
            'accountName',
            ERROR_CODES.BANK004,
            'error',
            'BANK004'
          ));
        }
      }
    }

    // 11. BUSINESS LOGIC VALIDATION

    // Status "paid" must have amountPaid === total
    if (invoice.status === 'paid') {
      if (!invoice.amountPaid || !compareAmounts(invoice.amountPaid, invoice.total)) {
        errors.push(createError(
          'status',
          'Status "paid" requires amount paid to equal invoice total',
          'error',
          'BIZ001'
        ));
      }
    }

    // Status "cancelled" should not have payments
    if (invoice.status === 'cancelled' && invoice.payments && invoice.payments.length > 0) {
      errors.push(createError(
        'status',
        'Cancelled invoices should not have payments',
        'warning',
        'BIZ002'
      ));
    }

    // 12. CONFLICT DETECTION (if context provided)
    if (context.checkConflicts && mode === 'update') {
      var conflict = checkForConflicts(invoice, context.storedInvoice);
      if (conflict.conflict) {
        errors.push(createError(
          'invoice',
          conflict.message,
          'error',
          'BIZ005'
        ));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Build descriptive identifier for line item to help users locate it
   * @param {object} lineItem - Line item to identify
   * @param {number} index - Line item index (0-based)
   * @param {string} type - Line item type (window, pressure)
   * @returns {string} - Human-readable identifier
   */
  function buildLineItemIdentifier(lineItem, index, type) {
    var parts = [];

    // Type prefix
    if (type === 'window') {
      parts.push('Window line #' + (index + 1));
    } else if (type === 'pressure') {
      parts.push('Pressure line #' + (index + 1));
    } else {
      parts.push('Line item #' + (index + 1));
    }

    // Add identifying details if available
    if (lineItem.title && lineItem.title !== 'Window Line' && lineItem.title !== 'Pressure Line') {
      parts.push('"' + lineItem.title + '"');
    }

    // For window lines: show window type
    if (type === 'window') {
      if (lineItem.windowTypeId) {
        parts.push('(' + lineItem.windowTypeId + ')');
      }
      if (lineItem.panes) {
        parts.push(lineItem.panes + ' panes');
      }
    }

    // For pressure lines: show surface type
    if (type === 'pressure') {
      if (lineItem.surfaceId) {
        parts.push('(' + lineItem.surfaceId + ')');
      }
      if (lineItem.areaSqm) {
        parts.push(lineItem.areaSqm + ' sqm');
      }
    }

    // For invoice line items with description
    if (lineItem.description && lineItem.description.length > 0) {
      var shortDesc = lineItem.description.length > 30
        ? lineItem.description.substring(0, 30) + '...'
        : lineItem.description;
      parts.push('"' + shortDesc + '"');
    }

    return parts.join(' ');
  }

  /**
   * Validate line item
   * @param {object} lineItem - Line item to validate
   * @param {number} index - Line item index
   * @param {string} type - Line item type (window, pressure)
   * @returns {array} - Array of error objects
   */
  function validateLineItem(lineItem, index, type) {
    var errors = [];
    var prefix = type + 'LineItem[' + index + ']';

    // Build human-readable identifier for this line item
    var identifier = buildLineItemIdentifier(lineItem, index, type);

    // Description
    if (!lineItem.description || lineItem.description.trim() === '') {
      errors.push(createError(
        prefix + '.description',
        identifier + ': description is required',
        'error',
        'LINE001'
      ));
    } else {
      var descLength = validateLength(
        lineItem.description,
        1,
        MAX_DESCRIPTION_LENGTH,
        'Description'
      );
      if (descLength) {
        errors.push(createError(
          prefix + '.description',
          identifier + ': description must be 1-500 characters',
          'error',
          'LINE002'
        ));
      }
    }

    // For window/pressure lines, they use 'price' not 'rate' and 'total'
    // Adjust validation based on actual structure
    if (lineItem.price !== undefined) {
      // Window/Pressure line format
      if (!isValidNumber(lineItem.price) || lineItem.price < 0) {
        errors.push(createError(
          prefix + '.price',
          identifier + ': price cannot be negative',
          'error',
          'LINE007'
        ));
      } else if (lineItem.price > MAX_AMOUNT) {
        errors.push(createError(
          prefix + '.price',
          identifier + ': price cannot exceed $' + MAX_AMOUNT.toFixed(2),
          'error',
          'LINE008'
        ));
      }
    } else {
      // Standard invoice line format (quantity × rate = total)
      if (lineItem.quantity !== undefined) {
        if (!isValidNumber(lineItem.quantity) || lineItem.quantity <= 0) {
          errors.push(createError(
            prefix + '.quantity',
            identifier + ': quantity must be greater than zero',
            'error',
            'LINE004'
          ));
        } else if (lineItem.quantity > MAX_LINE_ITEM_QUANTITY) {
          errors.push(createError(
            prefix + '.quantity',
            identifier + ': quantity cannot exceed ' + MAX_LINE_ITEM_QUANTITY,
            'error',
            'LINE005'
          ));
        }
      }

      if (lineItem.rate !== undefined) {
        if (!isValidNumber(lineItem.rate) || lineItem.rate < 0) {
          errors.push(createError(
            prefix + '.rate',
            identifier + ': rate cannot be negative',
            'error',
            'LINE007'
          ));
        } else if (lineItem.rate > MAX_AMOUNT) {
          errors.push(createError(
            prefix + '.rate',
            identifier + ': rate cannot exceed $' + MAX_AMOUNT.toFixed(2),
            'error',
            'LINE008'
          ));
        }
      }

      // Validate total = quantity × rate
      if (lineItem.quantity && lineItem.rate && lineItem.total !== undefined) {
        var expectedTotal = roundAmount(lineItem.quantity * lineItem.rate);
        if (!compareAmounts(lineItem.total, expectedTotal)) {
          errors.push(createError(
            prefix + '.total',
            identifier + ': total must equal quantity × rate (expected: $' + expectedTotal.toFixed(2) + ')',
            'error',
            'LINE009'
          ));
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // PAYMENT VALIDATION
  // ============================================================================

  /**
   * Validate payment
   * @param {object} payment - Payment to validate
   * @param {object} invoice - Invoice payment is for
   * @returns {object} - Validation result {valid: boolean, errors: array}
   */
  function validatePayment(payment, invoice) {
    var errors = [];

    // Basic null check
    if (!payment) {
      errors.push(createError('payment', 'Payment object is required', 'error'));
      return { valid: false, errors: errors };
    }

    if (!invoice) {
      errors.push(createError('invoice', 'Invoice is required for payment validation', 'error'));
      return { valid: false, errors: errors };
    }

    // 1. AMOUNT VALIDATION
    if (!payment.amount) {
      errors.push(createError('amount', ERROR_CODES.PAY001, 'error', 'PAY001'));
    } else if (!isValidNumber(payment.amount) || payment.amount <= 0) {
      errors.push(createError('amount', ERROR_CODES.PAY002, 'error', 'PAY002'));
    } else {
      // Check decimal places
      if (countDecimalPlaces(payment.amount) > 2) {
        errors.push(createError(
          'amount',
          ERROR_CODES.PAY013,
          'error',
          'PAY013'
        ));
      }

      // Check for overpayment
      var currentPaid = invoice.amountPaid || 0;
      var newTotal = currentPaid + payment.amount;

      if (newTotal > invoice.total + AMOUNT_TOLERANCE) {
        errors.push(createError(
          'amount',
          'Payment would exceed invoice total. Amount due: $' +
          (invoice.total - currentPaid).toFixed(2) +
          ' (attempting to pay: $' + payment.amount.toFixed(2) + ')',
          'error',
          'PAY003'
        ));
      }
    }

    // 2. METHOD VALIDATION
    if (!payment.method) {
      errors.push(createError('method', ERROR_CODES.PAY004, 'error', 'PAY004'));
    } else if (VALID_PAYMENT_METHODS.indexOf(payment.method) === -1) {
      errors.push(createError(
        'method',
        'Payment method must be one of: ' + VALID_PAYMENT_METHODS.join(', '),
        'error',
        'PAY005'
      ));
    }

    // 3. DATE VALIDATION
    if (!payment.date) {
      errors.push(createError('date', ERROR_CODES.PAY006, 'error', 'PAY006'));
    } else if (!isValidDate(payment.date)) {
      errors.push(createError('date', ERROR_CODES.PAY007, 'error', 'PAY007'));
    } else {
      var now = Date.now();
      var paymentDate = typeof payment.date === 'number' ? payment.date : payment.date.getTime();

      // Cannot be in future
      if (paymentDate > now) {
        errors.push(createError(
          'date',
          ERROR_CODES.PAY008,
          'error',
          'PAY008'
        ));
      }

      // Cannot be before invoice creation
      if (invoice.createdDate && paymentDate < invoice.createdDate) {
        errors.push(createError(
          'date',
          ERROR_CODES.PAY009,
          'error',
          'PAY009'
        ));
      }

      // Cannot be too far in past
      var daysPast = (now - paymentDate) / (1000 * 60 * 60 * 24);
      if (daysPast > MAX_PAST_DAYS) {
        errors.push(createError(
          'date',
          ERROR_CODES.PAY010,
          'error',
          'PAY010'
        ));
      }
    }

    // 4. REFERENCE VALIDATION (optional)
    if (payment.reference) {
      var refError = validateLength(payment.reference, 0, MAX_REFERENCE_LENGTH, 'Reference');
      if (refError) {
        errors.push(createError(
          'reference',
          ERROR_CODES.PAY011,
          'error',
          'PAY011'
        ));
      }
    }

    // 5. NOTES VALIDATION (optional)
    if (payment.notes) {
      var notesError = validateLength(payment.notes, 0, MAX_NOTES_LENGTH, 'Notes');
      if (notesError) {
        errors.push(createError(
          'notes',
          ERROR_CODES.PAY012,
          'error',
          'PAY012'
        ));
      }
    }

    // 6. BUSINESS LOGIC VALIDATION

    // Cannot add payment to cancelled invoice
    if (invoice.status === 'cancelled') {
      errors.push(createError(
        'invoice',
        'Cannot add payment to cancelled invoice',
        'error',
        'BIZ004'
      ));
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  /**
   * Check for concurrent modification conflicts
   * @param {object} invoice - Invoice being edited
   * @param {object} stored - Stored version of invoice
   * @returns {object} - {conflict: boolean, message: string}
   */
  function checkForConflicts(invoice, stored) {
    if (!stored) {
      return { conflict: false };
    }

    // Check if stored version was updated more recently
    if (stored.updatedAt && invoice.updatedAt && stored.updatedAt > invoice.updatedAt) {
      return {
        conflict: true,
        message: 'This invoice was modified in another window. Please refresh to see the latest version.'
      };
    }

    return { conflict: false };
  }

  // ============================================================================
  // ERROR DISPLAY FUNCTIONS
  // ============================================================================

  /**
   * Show validation errors in modal
   * @param {array} errors - Array of error objects
   * @param {string} title - Modal title (default: "Validation Errors")
   */
  function showValidationErrors(errors, title) {
    if (!errors || errors.length === 0) return;

    title = title || 'Please fix the following errors:';

    // Create modal
    var modal = document.createElement('div');
    modal.className = 'validation-error-modal';
    modal.innerHTML =
      '<div class="validation-error-content">' +
        '<div class="validation-error-header">' +
          '<span class="validation-error-icon">⚠</span>' +
          '<h3>' + sanitizeText(title) + '</h3>' +
          '<button class="validation-error-close" type="button">&times;</button>' +
        '</div>' +
        '<div class="validation-error-body">' +
          '<ul class="validation-error-list">' +
            errors.map(function(error) {
              var className = 'validation-error-item';
              if (error.severity === 'warning') {
                className += ' validation-error-warning';
              }
              return '<li class="' + className + '">' +
                '<strong>' + sanitizeText(error.field) + ':</strong> ' +
                sanitizeText(error.message) +
                '</li>';
            }).join('') +
          '</ul>' +
        '</div>' +
        '<div class="validation-error-footer">' +
          '<button class="btn btn-primary validation-error-ok" type="button">OK</button>' +
        '</div>' +
      '</div>';

    // Add to page
    document.body.appendChild(modal);

    // Show modal
    setTimeout(function() {
      modal.classList.add('active');
    }, 10);

    // Close handlers
    var closeModal = function() {
      modal.classList.remove('active');
      setTimeout(function() {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    };

    modal.querySelector('.validation-error-close').onclick = closeModal;
    modal.querySelector('.validation-error-ok').onclick = closeModal;

    modal.onclick = function(e) {
      if (e.target === modal) {
        closeModal();
      }
    };

    // Highlight fields with errors
    highlightErrorFields(errors);

    // Focus first error field
    if (errors.length > 0 && errors[0].field) {
      focusField(errors[0].field);
    }
  }

  /**
   * Highlight fields with errors
   * @param {array} errors - Array of error objects
   */
  function highlightErrorFields(errors) {
    // First clear all existing highlights
    clearAllFieldErrors();

    errors.forEach(function(error) {
      if (error.field && error.field !== 'invoice' && error.field !== 'payment') {
        showFieldError(error.field, error.message);
      }
    });
  }

  /**
   * Show error for specific field
   * @param {string} fieldId - Field ID or name
   * @param {string} message - Error message
   */
  function showFieldError(fieldId, message) {
    // Try multiple ID patterns
    var field = document.getElementById(fieldId) ||
                document.getElementById('edit' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1)) ||
                document.querySelector('[name="' + fieldId + '"]');

    if (!field) return;

    // Add error class
    field.classList.add('validation-error-field');

    // Create or update error message element
    var errorId = fieldId + '-error';
    var existingError = document.getElementById(errorId);

    if (existingError) {
      existingError.textContent = message;
    } else {
      var errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'validation-field-error';
      errorElement.textContent = message;

      // Insert after field
      if (field.parentNode) {
        field.parentNode.insertBefore(errorElement, field.nextSibling);
      }
    }
  }

  /**
   * Clear error for specific field
   * @param {string} fieldId - Field ID or name
   */
  function clearFieldError(fieldId) {
    var field = document.getElementById(fieldId) ||
                document.getElementById('edit' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1)) ||
                document.querySelector('[name="' + fieldId + '"]');

    if (field) {
      field.classList.remove('validation-error-field');
    }

    var errorElement = document.getElementById(fieldId + '-error');
    if (errorElement && errorElement.parentNode) {
      errorElement.parentNode.removeChild(errorElement);
    }
  }

  /**
   * Clear all field errors
   */
  function clearAllFieldErrors() {
    // Remove error classes
    var errorFields = document.querySelectorAll('.validation-error-field');
    for (var i = 0; i < errorFields.length; i++) {
      errorFields[i].classList.remove('validation-error-field');
    }

    // Remove error messages
    var errorMessages = document.querySelectorAll('.validation-field-error');
    for (var j = 0; j < errorMessages.length; j++) {
      if (errorMessages[j].parentNode) {
        errorMessages[j].parentNode.removeChild(errorMessages[j]);
      }
    }
  }

  /**
   * Focus field
   * @param {string} fieldId - Field ID or name
   */
  function focusField(fieldId) {
    var field = document.getElementById(fieldId) ||
                document.getElementById('edit' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1)) ||
                document.querySelector('[name="' + fieldId + '"]');

    if (field && field.focus) {
      setTimeout(function() {
        field.focus();
        if (field.select) {
          field.select();
        }
      }, 100);
    }
  }

  /**
   * Attach real-time validator to field
   * @param {string} fieldId - Field ID
   * @param {function} validatorFn - Validator function (value) => error|null
   */
  function attachFieldValidator(fieldId, validatorFn) {
    var field = document.getElementById(fieldId);
    if (!field) return;

    field.addEventListener('blur', function() {
      var error = validatorFn(field.value);
      if (error) {
        showFieldError(fieldId, error.message || error);
      } else {
        clearFieldError(fieldId);
      }
    });

    // Clear error on input
    field.addEventListener('input', function() {
      clearFieldError(fieldId);
    });
  }

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  /**
   * Validate entire form and disable/enable save button
   * @param {string} formId - Form element ID
   * @param {function} validationFn - Function that returns {valid, errors}
   * @param {string} saveButtonId - Save button ID
   */
  function initializeFormValidation(formId, validationFn, saveButtonId) {
    var form = document.getElementById(formId);
    var saveButton = document.getElementById(saveButtonId);

    if (!form || !saveButton) return;

    // Validate on form change
    form.addEventListener('change', function() {
      var result = validationFn();
      updateSaveButton(saveButton, result.valid);
    });

    // Also validate on input for immediate feedback
    form.addEventListener('input', function() {
      var result = validationFn();
      updateSaveButton(saveButton, result.valid);
    });

    // Prevent submit if invalid
    form.addEventListener('submit', function(e) {
      var result = validationFn();

      if (!result.valid) {
        e.preventDefault();
        showValidationErrors(result.errors);
        return false;
      }
    });

    // Initial validation
    setTimeout(function() {
      var result = validationFn();
      updateSaveButton(saveButton, result.valid);
    }, 100);
  }

  /**
   * Update save button state
   * @param {HTMLElement} button - Button element
   * @param {boolean} isValid - Whether form is valid
   */
  function updateSaveButton(button, isValid) {
    if (isValid) {
      button.disabled = false;
      button.classList.remove('btn-disabled');
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    } else {
      button.disabled = true;
      button.classList.add('btn-disabled');
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }
      button.textContent = 'Fix errors to save';
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.InvoiceValidation = {
    // Core validators
    validateInvoice: validateInvoice,
    validatePayment: validatePayment,
    validateLineItem: validateLineItem,

    // Field validators
    validateRequired: validateRequired,
    validateLength: validateLength,
    validateRange: validateRange,
    validatePattern: validatePattern,
    validateEmail: validateEmail,
    validateBSB: validateBSB,
    validateAccountNumber: validateAccountNumber,
    validateABN: validateABN,

    // Utility functions
    compareAmounts: compareAmounts,
    calculateGST: calculateGST,
    roundAmount: roundAmount,
    isValidNumber: isValidNumber,
    isValidDate: isValidDate,
    sanitizeText: sanitizeText,
    checkForConflicts: checkForConflicts,

    // Error display
    showValidationErrors: showValidationErrors,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    clearAllFieldErrors: clearAllFieldErrors,
    attachFieldValidator: attachFieldValidator,
    initializeFormValidation: initializeFormValidation,

    // Constants
    ERROR_CODES: ERROR_CODES,
    VALID_STATUSES: VALID_STATUSES,
    VALID_PAYMENT_METHODS: VALID_PAYMENT_METHODS,
    MAX_AMOUNT: MAX_AMOUNT
  };

  // Log initialization
  if (window.DEBUG) {
    DEBUG.log('[VALIDATION] Invoice validation module initialized');
  }

})();
