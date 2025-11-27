// quote-validation.js - Quote data validation system
// Prevents saving quotes with invalid or missing data
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  // ============================================================================
  // ERROR CODE CONSTANTS
  // ============================================================================

  var ERROR_CODES = {
    // Quote validation errors (QUOTE001-QUOTE099)
    QUOTE001: 'Quote title is required',
    QUOTE002: 'Quote title must be between 2 and 100 characters',
    QUOTE003: 'Client name is required',
    QUOTE004: 'Client name must be between 2 and 100 characters',
    QUOTE005: 'Quote must have at least one line item',
    QUOTE006: 'Quote total must be greater than zero',
    QUOTE007: 'Quote total must meet minimum job fee',
    QUOTE008: 'Quote total cannot exceed $999,999.99',
    QUOTE009: 'Client location is required',
    QUOTE010: 'Job type is required',
    QUOTE011: 'Invalid job type',
    QUOTE012: 'Client email must be valid',
    QUOTE013: 'Client phone must be valid',
    QUOTE014: 'Window line must have valid window type',
    QUOTE015: 'Window line must have at least 1 pane',
    QUOTE016: 'Pressure line must have valid surface type',
    QUOTE017: 'Pressure line must have area greater than 0',
    QUOTE018: 'Hourly rate must be greater than zero',
    QUOTE019: 'Base fee cannot be negative',
    QUOTE020: 'Minimum job fee must be greater than zero'
  };

  var VALID_JOB_TYPES = ['residential', 'commercial', 'strata'];
  var MAX_AMOUNT = 999999.99;
  var MAX_TITLE_LENGTH = 100;
  var MAX_NAME_LENGTH = 100;

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Create error object
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {object} - Error object
   */
  function createError(field, message, code) {
    return {
      field: field,
      message: message,
      code: code,
      severity: 'error'
    };
  }

  /**
   * Check if value is a valid positive number
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  function isValidPositiveNumber(value) {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value) && 
           value > 0;
  }

  // ============================================================================
  // QUOTE VALIDATION
  // ============================================================================

  /**
   * Validate complete quote object before save
   * @param {object} quote - Quote to validate
   * @param {object} options - Validation options
   * @param {boolean} options.allowDefaults - Allow default values (for autosave)
   * @param {number} options.minimumJobFee - Minimum job fee to enforce
   * @returns {object} - {valid: boolean, errors: array}
   */
  function validateQuote(quote, options) {
    var errors = [];
    options = options || {};
    var allowDefaults = options.allowDefaults || false;
    var minimumJobFee = options.minimumJobFee || quote.minimumJob || 0;

    // Basic null check
    if (!quote) {
      errors.push(createError('quote', 'Quote object is required', 'QUOTE_NULL'));
      return { valid: false, errors: errors };
    }

    // 1. QUOTE TITLE VALIDATION
    if (!quote.quoteTitle || quote.quoteTitle.trim() === '') {
      errors.push(createError('quoteTitle', ERROR_CODES.QUOTE001, 'QUOTE001'));
    } else if (quote.quoteTitle.length < 2 || quote.quoteTitle.length > MAX_TITLE_LENGTH) {
      errors.push(createError('quoteTitle', ERROR_CODES.QUOTE002, 'QUOTE002'));
    }

    // 2. CLIENT NAME VALIDATION
    if (!quote.clientName || quote.clientName.trim() === '') {
      errors.push(createError('clientName', ERROR_CODES.QUOTE003, 'QUOTE003'));
    } else if (quote.clientName.length < 2 || quote.clientName.length > MAX_NAME_LENGTH) {
      errors.push(createError('clientName', ERROR_CODES.QUOTE004, 'QUOTE004'));
    }

    // 3. CLIENT LOCATION VALIDATION
    if (!allowDefaults && (!quote.clientLocation || quote.clientLocation.trim() === '')) {
      errors.push(createError('clientLocation', ERROR_CODES.QUOTE009, 'QUOTE009'));
    }

    // 4. JOB TYPE VALIDATION
    if (!quote.jobType || quote.jobType === '') {
      errors.push(createError('jobType', ERROR_CODES.QUOTE010, 'QUOTE010'));
    } else if (VALID_JOB_TYPES.indexOf(quote.jobType) === -1) {
      errors.push(createError(
        'jobType',
        'Job type must be one of: ' + VALID_JOB_TYPES.join(', '),
        'QUOTE011'
      ));
    }

    // 5. LINE ITEMS VALIDATION
    var hasLineItems = false;
    var windowLines = quote.windowLines || [];
    var pressureLines = quote.pressureLines || [];

    if (windowLines.length > 0) {
      hasLineItems = true;
      for (var i = 0; i < windowLines.length; i++) {
        var windowErrors = validateWindowLine(windowLines[i], i);
        errors = errors.concat(windowErrors);
      }
    }

    if (pressureLines.length > 0) {
      hasLineItems = true;
      for (var j = 0; j < pressureLines.length; j++) {
        var pressureErrors = validatePressureLine(pressureLines[j], j);
        errors = errors.concat(pressureErrors);
      }
    }

    if (!hasLineItems) {
      errors.push(createError('lineItems', ERROR_CODES.QUOTE005, 'QUOTE005'));
    }

    // 6. PRICING VALIDATION
    // Validate hourly rate
    if (!isValidPositiveNumber(quote.hourlyRate)) {
      errors.push(createError('hourlyRate', ERROR_CODES.QUOTE018, 'QUOTE018'));
    }

    // Validate base fee (can be zero, but not negative)
    if (typeof quote.baseFee !== 'number' || quote.baseFee < 0) {
      errors.push(createError('baseFee', ERROR_CODES.QUOTE019, 'QUOTE019'));
    }

    // Validate minimum job fee
    if (!isValidPositiveNumber(minimumJobFee)) {
      errors.push(createError('minimumJob', ERROR_CODES.QUOTE020, 'QUOTE020'));
    }

    // 7. QUOTE TOTAL VALIDATION
    // Calculate total using the breakdown if available
    var quoteTotal = 0;
    if (quote.breakdown && typeof quote.breakdown.totalIncGst === 'number') {
      quoteTotal = quote.breakdown.totalIncGst;
    } else if (quote.total && typeof quote.total === 'number') {
      quoteTotal = quote.total;
    }

    if (quoteTotal <= 0) {
      errors.push(createError(
        'total',
        'Quote total is $0.00. Please add services or adjust pricing.',
        'QUOTE006'
      ));
    } else if (minimumJobFee > 0 && quoteTotal < minimumJobFee) {
      errors.push(createError(
        'total',
        'Quote total ($' + quoteTotal.toFixed(2) + ') is below minimum job fee ($' + 
        minimumJobFee.toFixed(2) + '). Please increase services or waive minimum.',
        'QUOTE007'
      ));
    } else if (quoteTotal > MAX_AMOUNT) {
      errors.push(createError(
        'total',
        'Quote total cannot exceed $' + MAX_AMOUNT.toFixed(2),
        'QUOTE008'
      ));
    }

    // 8. OPTIONAL: EMAIL VALIDATION (if provided)
    if (quote.clientEmail && quote.clientEmail.trim() !== '') {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(quote.clientEmail)) {
        errors.push(createError('clientEmail', ERROR_CODES.QUOTE012, 'QUOTE012'));
      }
    }

    // 9. OPTIONAL: PHONE VALIDATION (if provided)
    if (quote.clientPhone && quote.clientPhone.trim() !== '') {
      var phonePattern = /^[\d\s\-\+\(\)]{8,20}$/;
      if (!phonePattern.test(quote.clientPhone)) {
        errors.push(createError('clientPhone', ERROR_CODES.QUOTE013, 'QUOTE013'));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate window line item
   * @param {object} line - Window line to validate
   * @param {number} index - Line index
   * @returns {array} - Array of error objects
   */
  function validateWindowLine(line, index) {
    var errors = [];
    var prefix = 'windowLine[' + index + ']';
    var identifier = 'Window line #' + (index + 1);

    if (line.title) {
      identifier += ' "' + line.title + '"';
    }

    // Window type validation
    if (!line.windowTypeId || line.windowTypeId === '') {
      errors.push(createError(
        prefix + '.windowTypeId',
        identifier + ': window type is required',
        'QUOTE014'
      ));
    }

    // Panes validation
    if (typeof line.panes !== 'number' || line.panes < 1) {
      errors.push(createError(
        prefix + '.panes',
        identifier + ': must have at least 1 pane',
        'QUOTE015'
      ));
    }

    return errors;
  }

  /**
   * Validate pressure line item
   * @param {object} line - Pressure line to validate
   * @param {number} index - Line index
   * @returns {array} - Array of error objects
   */
  function validatePressureLine(line, index) {
    var errors = [];
    var prefix = 'pressureLine[' + index + ']';
    var identifier = 'Pressure line #' + (index + 1);

    if (line.title) {
      identifier += ' "' + line.title + '"';
    }

    // Surface type validation
    if (!line.surfaceId || line.surfaceId === '') {
      errors.push(createError(
        prefix + '.surfaceId',
        identifier + ': surface type is required',
        'QUOTE016'
      ));
    }

    // Area validation
    if (typeof line.areaSqm !== 'number' || line.areaSqm <= 0) {
      errors.push(createError(
        prefix + '.areaSqm',
        identifier + ': area must be greater than 0',
        'QUOTE017'
      ));
    }

    return errors;
  }

  /**
   * Validate quote before autosave (less strict)
   * @param {object} quote - Quote to validate
   * @returns {boolean} - True if valid for autosave
   */
  function validateForAutosave(quote) {
    // For autosave, only check critical fields
    if (!quote) return false;

    // Must have at least a title or client name
    var hasBasicInfo = (quote.quoteTitle && quote.quoteTitle.trim() !== '') ||
                       (quote.clientName && quote.clientName.trim() !== '');

    return hasBasicInfo;
  }

  /**
   * Validate quote before manual save (strict)
   * @param {object} quote - Quote to validate
   * @returns {object} - {valid: boolean, errors: array}
   */
  function validateForSave(quote) {
    return validateQuote(quote, {
      allowDefaults: false,
      minimumJobFee: quote.minimumJob || 0
    });
  }

  /**
   * Validate quote before creating invoice (very strict)
   * @param {object} quote - Quote to validate
   * @returns {object} - {valid: boolean, errors: array}
   */
  function validateForInvoice(quote) {
    var result = validateQuote(quote, {
      allowDefaults: false,
      minimumJobFee: quote.minimumJob || 0
    });

    // Additional checks for invoice creation
    if (result.valid) {
      // Ensure we have a calculated total
      if (!quote.breakdown || typeof quote.breakdown.totalIncGst !== 'number') {
        result.valid = false;
        result.errors.push(createError(
          'breakdown',
          'Quote must be calculated before creating invoice',
          'QUOTE_NO_CALC'
        ));
      }
    }

    return result;
  }

  // ============================================================================
  // CLIENT VALIDATION
  // ============================================================================

  /**
   * Validate client data before save
   * @param {object} client - Client to validate
   * @returns {object} - {valid: boolean, errors: array}
   */
  function validateClient(client) {
    var errors = [];

    if (!client) {
      errors.push(createError('client', 'Client object is required', 'CLIENT001'));
      return { valid: false, errors: errors };
    }

    // Name validation
    if (!client.name || client.name.trim() === '') {
      errors.push(createError('name', 'Client name is required', 'CLIENT002'));
    } else if (client.name.length < 2 || client.name.length > MAX_NAME_LENGTH) {
      errors.push(createError(
        'name',
        'Client name must be between 2 and ' + MAX_NAME_LENGTH + ' characters',
        'CLIENT003'
      ));
    }

    // Email validation (if provided)
    if (client.email && client.email.trim() !== '') {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(client.email)) {
        errors.push(createError('email', 'Email address is not valid', 'CLIENT004'));
      }
    }

    // Phone validation (if provided)
    if (client.phone && client.phone.trim() !== '') {
      var phonePattern = /^[\d\s\-\+\(\)]{8,20}$/;
      if (!phonePattern.test(client.phone)) {
        errors.push(createError('phone', 'Phone number is not valid', 'CLIENT005'));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ============================================================================
  // ERROR DISPLAY
  // ============================================================================

  /**
   * Show validation errors using UIComponents toast
   * @param {array} errors - Array of error objects
   * @param {string} context - Context message (e.g., "Cannot save quote")
   */
  function showValidationErrors(errors, context) {
    if (!errors || errors.length === 0) return;

    var message = context || 'Validation errors';
    message += ':\n\n';

    // Show first 3 errors in toast
    var displayCount = Math.min(errors.length, 3);
    for (var i = 0; i < displayCount; i++) {
      message += '• ' + errors[i].message + '\n';
    }

    if (errors.length > 3) {
      message += '\n...and ' + (errors.length - 3) + ' more error(s)';
    }

    // Use UIComponents if available, otherwise fall back to alert
    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast(message, 'error', 8000);
    } else {
      alert(message);
    }

    // Also log to console for debugging
    console.warn('[QUOTE-VALIDATION] Validation failed:', errors);
  }

  /**
   * Show validation summary with all errors
   * @param {array} errors - Array of error objects
   */
  function showValidationSummary(errors) {
    if (!errors || errors.length === 0) return;

    var message = 'Please fix the following issues:\n\n';
    
    errors.forEach(function(error) {
      message += '• ' + error.message + '\n';
    });

    // Use UIComponents modal if available
    if (window.UIComponents && window.UIComponents.showAlert) {
      window.UIComponents.showAlert({
        title: 'Validation Errors',
        message: message,
        buttonText: 'OK'
      });
    } else if (window.InvoiceValidation && window.InvoiceValidation.showValidationErrors) {
      window.InvoiceValidation.showValidationErrors(errors, 'Please fix the following issues');
    } else {
      alert(message);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.QuoteValidation = {
    // Main validation functions
    validateQuote: validateQuote,
    validateForAutosave: validateForAutosave,
    validateForSave: validateForSave,
    validateForInvoice: validateForInvoice,
    validateClient: validateClient,

    // Line item validators
    validateWindowLine: validateWindowLine,
    validatePressureLine: validatePressureLine,

    // Error display
    showValidationErrors: showValidationErrors,
    showValidationSummary: showValidationSummary,

    // Constants
    ERROR_CODES: ERROR_CODES,
    VALID_JOB_TYPES: VALID_JOB_TYPES,
    MAX_AMOUNT: MAX_AMOUNT
  };

  console.log('[QUOTE-VALIDATION] Quote validation module initialized');

})();
