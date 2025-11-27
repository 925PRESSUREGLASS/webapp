/**
 * TicTacStick Security Utilities
 * ES5-compatible security functions for input validation, sanitization, and encryption
 *
 * @module Security
 * @version 1.0.0
 * @compatible iOS Safari 12+, ES5 only
 */

(function(window) {
  'use strict';

  // ============================================================================
  // 1. XSS PREVENTION - HTML Sanitization
  // ============================================================================

  /**
   * Sanitize HTML by escaping dangerous characters
   * Prevents XSS attacks by converting HTML entities
   *
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string safe for HTML insertion
   */
  function sanitizeHTML(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escape HTML entities (more explicit version)
   * Useful when you need direct string manipulation
   *
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  function escapeHTML(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, function(char) {
      return map[char];
    });
  }

  /**
   * Safely set text content (preferred method)
   * Use this instead of innerHTML when displaying user input
   *
   * @param {HTMLElement} element - DOM element
   * @param {string} text - Text to set
   */
  function setTextSafely(element, text) {
    if (!element) {
      throw new Error('Element is required');
    }
    element.textContent = text || '';
  }

  /**
   * Sanitize HTML and convert newlines to <br> tags
   * Safe for client notes and multi-line text fields
   *
   * @param {string} str - String with newlines
   * @returns {string} - Sanitized HTML with <br> tags
   */
  function sanitizeWithLineBreaks(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    // First escape HTML, then replace newlines
    var escaped = escapeHTML(str);
    return escaped.replace(/\n/g, '<br/>');
  }

  // ============================================================================
  // 2. INPUT VALIDATION - Numbers
  // ============================================================================

  /**
   * Validate numeric input with comprehensive checks
   * Prevents Infinity, NaN, negative numbers, and enforces bounds
   *
   * @param {*} value - Input value to validate
   * @param {Object} options - Validation options
   * @param {number} options.min - Minimum allowed value (default: 0)
   * @param {number} options.max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
   * @param {number} options.decimals - Decimal places to round to (default: 2)
   * @param {boolean} options.allowNegative - Allow negative numbers (default: false)
   * @param {number} options.fallback - Fallback value if invalid (default: 0)
   * @param {string} options.fieldName - Field name for error messages
   * @returns {number} - Validated and sanitized number
   */
  function validateNumber(value, options) {
    // Default options
    var defaults = {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      decimals: 2,
      allowNegative: false,
      fallback: 0,
      fieldName: 'Value'
    };

    // Merge options (ES5-compatible)
    var opts = {};
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)) {
        opts[key] = defaults[key];
      }
    }
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        opts[key] = options[key];
      }
    }

    // Parse to number
    var num = parseFloat(value);

    // Check if valid number
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      console.warn('[Security] Invalid number for ' + opts.fieldName + ':', value, '- using fallback:', opts.fallback);
      return opts.fallback;
    }

    // Check negative
    if (!opts.allowNegative && num < 0) {
      console.warn('[Security] Negative not allowed for ' + opts.fieldName + ':', num, '- using fallback:', opts.fallback);
      return opts.fallback;
    }

    // Apply min/max bounds
    if (num < opts.min) {
      console.warn('[Security] Value below minimum for ' + opts.fieldName + ':', num, '- clamping to:', opts.min);
      num = opts.min;
    }
    if (num > opts.max) {
      console.warn('[Security] Value above maximum for ' + opts.fieldName + ':', num, '- clamping to:', opts.max);
      num = opts.max;
    }

    // Round to specified decimal places
    var multiplier = Math.pow(10, opts.decimals);
    num = Math.round(num * multiplier) / multiplier;

    return num;
  }

  /**
   * Validate positive integer
   * Useful for counts, quantities, panes, etc.
   *
   * @param {*} value - Input value
   * @param {number} min - Minimum value (default: 1)
   * @param {number} max - Maximum value (default: 10000)
   * @param {string} fieldName - Field name for errors
   * @returns {number} - Validated integer
   */
  function validatePositiveInteger(value, min, max, fieldName) {
    min = typeof min === 'number' ? min : 1;
    max = typeof max === 'number' ? max : 10000;
    fieldName = fieldName || 'Integer';

    var num = parseInt(value, 10);

    if (isNaN(num) || !isFinite(num)) {
      throw new Error(fieldName + ' must be a number');
    }

    if (num !== parseFloat(value)) {
      throw new Error(fieldName + ' must be a whole number');
    }

    if (num < min || num > max) {
      throw new Error(fieldName + ' must be between ' + min + ' and ' + max);
    }

    return num;
  }

  /**
   * Validate currency amount
   * Ensures proper decimal places and positive values
   *
   * @param {*} value - Currency value
   * @param {string} fieldName - Field name for errors
   * @returns {number} - Validated currency amount
   */
  function validateCurrency(value, fieldName) {
    return validateNumber(value, {
      min: 0,
      max: 1000000,
      decimals: 2,
      allowNegative: false,
      fallback: 0,
      fieldName: fieldName || 'Currency'
    });
  }

  // ============================================================================
  // 3. INPUT VALIDATION - Strings
  // ============================================================================

  /**
   * Validate and sanitize string input
   * Trims, enforces length limits, and validates format
   *
   * @param {*} value - Input value
   * @param {Object} options - Validation options
   * @param {number} options.maxLength - Maximum length (default: 500)
   * @param {boolean} options.trim - Trim whitespace (default: true)
   * @param {boolean} options.allowEmpty - Allow empty strings (default: true)
   * @param {RegExp} options.pattern - Regex pattern to match
   * @param {string} options.fallback - Fallback value (default: '')
   * @param {string} options.fieldName - Field name for errors
   * @returns {string} - Validated string
   */
  function validateString(value, options) {
    var defaults = {
      maxLength: 500,
      trim: true,
      allowEmpty: true,
      pattern: null,
      fallback: '',
      fieldName: 'String'
    };

    // Merge options
    var opts = {};
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)) {
        opts[key] = defaults[key];
      }
    }
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        opts[key] = options[key];
      }
    }

    // Type check
    if (typeof value !== 'string') {
      console.warn('[Security] ' + opts.fieldName + ' must be a string - using fallback');
      return opts.fallback;
    }

    // Trim
    var str = opts.trim ? value.trim() : value;

    // Empty check
    if (!opts.allowEmpty && str.length === 0) {
      console.warn('[Security] ' + opts.fieldName + ' cannot be empty - using fallback');
      return opts.fallback;
    }

    // Length limit
    if (str.length > opts.maxLength) {
      console.warn('[Security] ' + opts.fieldName + ' exceeds max length - truncating');
      str = str.substring(0, opts.maxLength);
    }

    // Pattern validation
    if (opts.pattern && !opts.pattern.test(str)) {
      console.warn('[Security] ' + opts.fieldName + ' does not match required pattern');
      throw new Error(opts.fieldName + ' format is invalid');
    }

    return str;
  }

  /**
   * Validate email address
   * Simple but effective email validation
   *
   * @param {string} value - Email address
   * @returns {string} - Validated email or empty string
   */
  function validateEmail(value) {
    if (!value) return '';

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return validateString(value, {
      maxLength: 255,
      pattern: emailPattern,
      allowEmpty: true,
      fieldName: 'Email'
    });
  }

  /**
   * Validate phone number (Australian format)
   * Allows: 0412345678, 04 1234 5678, (04) 1234-5678, +61 412 345 678
   *
   * @param {string} value - Phone number
   * @returns {string} - Validated phone
   */
  function validatePhone(value) {
    if (!value) return '';

    // Allow digits, spaces, hyphens, parentheses, plus
    var phonePattern = /^[\d\s\-\+\(\)]+$/;

    return validateString(value, {
      maxLength: 20,
      pattern: phonePattern,
      allowEmpty: true,
      fieldName: 'Phone'
    });
  }

  /**
   * Validate Australian BSB (Bank-State-Branch)
   * Format: XXX-XXX or XXXXXX
   *
   * @param {string} value - BSB number
   * @returns {string} - Validated BSB
   */
  function validateBSB(value) {
    if (!value) return '';

    var bsbPattern = /^\d{3}-?\d{3}$/;

    return validateString(value, {
      maxLength: 7,
      pattern: bsbPattern,
      allowEmpty: true,
      fieldName: 'BSB'
    });
  }

  /**
   * Validate Australian Business Number (ABN)
   * Format: 11 digits with optional spaces
   *
   * @param {string} value - ABN
   * @returns {string} - Validated ABN
   */
  function validateABN(value) {
    if (!value) return '';

    // Remove spaces for validation
    var cleaned = value.replace(/\s/g, '');

    if (!/^\d{11}$/.test(cleaned)) {
      throw new Error('ABN must be 11 digits');
    }

    return value;
  }

  // ============================================================================
  // 4. LOCALSTORAGE ENCRYPTION
  // ============================================================================

  /**
   * Simple XOR encryption for LocalStorage
   * NOTE: This is NOT cryptographically secure!
   * Use Web Crypto API for production (see SecureStorageAdvanced below)
   *
   * This is a lightweight fallback for browsers without Web Crypto API
   *
   * @param {string} text - Text to encrypt/decrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted/decrypted text (base64)
   */
  function simpleEncrypt(text, key) {
    var result = '';
    for (var i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }

  function simpleDecrypt(encrypted, key) {
    try {
      var text = atob(encrypted); // Base64 decode
      var result = '';
      for (var i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      console.error('[Security] Decryption failed:', e);
      return null;
    }
  }

  /**
   * Secure Storage wrapper with simple encryption
   * Uses XOR cipher (lightweight but not cryptographically secure)
   *
   * Usage:
   *   SecureStorage.setItem('myData', { secret: 'value' });
   *   var data = SecureStorage.getItem('myData');
   */
  var SecureStorage = {
    _key: 'tictacstick-2025-default-key', // Change this!

    /**
     * Set encryption key
     * @param {string} key - Encryption key (session-based recommended)
     */
    setKey: function(key) {
      if (!key || typeof key !== 'string' || key.length < 8) {
        throw new Error('Encryption key must be at least 8 characters');
      }
      this._key = key;
    },

    /**
     * Store encrypted data
     * @param {string} key - LocalStorage key
     * @param {*} value - Value to store (will be JSON.stringify'd)
     */
    setItem: function(key, value) {
      try {
        var json = JSON.stringify(value);
        var encrypted = simpleEncrypt(json, this._key);
        localStorage.setItem(key, encrypted);
      } catch (e) {
        console.error('[Security] SecureStorage.setItem failed:', e);
        throw e;
      }
    },

    /**
     * Retrieve and decrypt data
     * @param {string} key - LocalStorage key
     * @param {*} fallback - Fallback value if decrypt fails
     * @returns {*} - Decrypted value
     */
    getItem: function(key, fallback) {
      try {
        var encrypted = localStorage.getItem(key);
        if (!encrypted) {
          return fallback;
        }

        var json = simpleDecrypt(encrypted, this._key);
        if (!json) {
          return fallback;
        }

        return JSON.parse(json);
      } catch (e) {
        console.error('[Security] SecureStorage.getItem failed:', e);
        return fallback;
      }
    },

    /**
     * Remove item
     * @param {string} key - LocalStorage key
     */
    removeItem: function(key) {
      localStorage.removeItem(key);
    }
  };

  /**
   * Advanced Secure Storage using Web Crypto API (AES-GCM)
   * Only works in modern browsers with crypto.subtle support
   *
   * NOTE: This is asynchronous (returns Promises)
   */
  var SecureStorageAdvanced = {
    _keyMaterial: null,

    /**
     * Check if Web Crypto API is available
     * @returns {boolean}
     */
    isSupported: function() {
      return !!(window.crypto && window.crypto.subtle);
    },

    /**
     * Initialize with password
     * @param {string} password - User password
     * @returns {Promise}
     */
    init: function(password) {
      var self = this;

      if (!this.isSupported()) {
        return Promise.reject(new Error('Web Crypto API not supported'));
      }

      var enc = new TextEncoder();
      var passwordBuffer = enc.encode(password);

      return crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      ).then(function(keyMaterial) {
        self._keyMaterial = keyMaterial;
      });
    },

    /**
     * Derive encryption key from password
     * @param {ArrayBuffer} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>}
     */
    _deriveKey: function(salt) {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        this._keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },

    /**
     * Encrypt and store data
     * @param {string} key - LocalStorage key
     * @param {*} value - Value to encrypt
     * @returns {Promise}
     */
    setItem: function(key, value) {
      var self = this;

      if (!this._keyMaterial) {
        return Promise.reject(new Error('SecureStorageAdvanced not initialized'));
      }

      var json = JSON.stringify(value);
      var enc = new TextEncoder();
      var data = enc.encode(json);

      // Generate random salt and IV
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));

      return this._deriveKey(salt).then(function(key) {
        return crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          data
        );
      }).then(function(encrypted) {
        // Combine salt + iv + encrypted data
        var combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Convert to base64 and store
        var base64 = btoa(String.fromCharCode.apply(null, combined));
        localStorage.setItem(key, base64);
      });
    },

    /**
     * Retrieve and decrypt data
     * @param {string} key - LocalStorage key
     * @param {*} fallback - Fallback value
     * @returns {Promise}
     */
    getItem: function(key, fallback) {
      var self = this;

      if (!this._keyMaterial) {
        return Promise.reject(new Error('SecureStorageAdvanced not initialized'));
      }

      var base64 = localStorage.getItem(key);
      if (!base64) {
        return Promise.resolve(fallback);
      }

      try {
        // Decode base64
        var combined = new Uint8Array(
          atob(base64).split('').map(function(c) { return c.charCodeAt(0); })
        );

        // Extract salt, iv, encrypted data
        var salt = combined.slice(0, 16);
        var iv = combined.slice(16, 28);
        var encrypted = combined.slice(28);

        return this._deriveKey(salt).then(function(key) {
          return crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
          );
        }).then(function(decrypted) {
          var dec = new TextDecoder();
          var json = dec.decode(decrypted);
          return JSON.parse(json);
        });
      } catch (e) {
        console.error('[Security] SecureStorageAdvanced.getItem failed:', e);
        return Promise.resolve(fallback);
      }
    }
  };

  // ============================================================================
  // 5. SAFE JSON PARSING
  // ============================================================================

  /**
   * Safely parse JSON with error handling and schema validation
   *
   * @param {string} json - JSON string to parse
   * @param {Object} schema - Optional schema for validation
   * @param {*} fallback - Fallback value if parse fails
   * @returns {*} - Parsed value or fallback
   */
  function safeJSONParse(json, schema, fallback) {
    try {
      var parsed = JSON.parse(json);

      // Schema validation if provided
      if (schema && !validateSchema(parsed, schema)) {
        console.warn('[Security] Schema validation failed');
        return fallback;
      }

      return parsed;
    } catch (e) {
      console.error('[Security] JSON parse error:', e.message);
      return fallback;
    }
  }

  /**
   * Simple schema validator
   *
   * @param {*} obj - Object to validate
   * @param {Object} schema - Schema definition
   * @returns {boolean} - True if valid
   *
   * Schema format:
   *   { fieldName: 'type' }
   *   Types: 'string', 'number', 'boolean', 'array', 'object'
   */
  function validateSchema(obj, schema) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    for (var key in schema) {
      if (schema.hasOwnProperty(key)) {
        var expectedType = schema[key];
        var actualValue = obj[key];

        if (expectedType === 'array' && !Array.isArray(actualValue)) {
          console.warn('[Security] Schema validation failed: ' + key + ' should be array');
          return false;
        } else if (expectedType === 'number' && typeof actualValue !== 'number') {
          console.warn('[Security] Schema validation failed: ' + key + ' should be number');
          return false;
        } else if (expectedType === 'string' && typeof actualValue !== 'string') {
          console.warn('[Security] Schema validation failed: ' + key + ' should be string');
          return false;
        } else if (expectedType === 'boolean' && typeof actualValue !== 'boolean') {
          console.warn('[Security] Schema validation failed: ' + key + ' should be boolean');
          return false;
        } else if (expectedType === 'object' && (typeof actualValue !== 'object' || Array.isArray(actualValue))) {
          console.warn('[Security] Schema validation failed: ' + key + ' should be object');
          return false;
        }
      }
    }

    return true;
  }

  // ============================================================================
  // 6. UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Check if LocalStorage is available
   * Returns false in Private Browsing mode on iOS Safari
   *
   * @returns {boolean}
   */
  function isStorageAvailable() {
    try {
      var test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a random ID
   * Useful for creating unpredictable IDs
   *
   * @param {string} prefix - ID prefix
   * @returns {string} - Random ID
   */
  function generateSecureId(prefix) {
    prefix = prefix || 'id';
    var timestamp = Date.now();
    var random = Math.random().toString(36).substr(2, 9);
    return prefix + '_' + timestamp + '_' + random;
  }

  /**
   * Sanitize object for safe logging
   * Removes sensitive fields before logging
   *
   * @param {Object} obj - Object to sanitize
   * @param {Array<string>} sensitiveKeys - Keys to redact
   * @returns {Object} - Sanitized object
   */
  function sanitizeForLogging(obj, sensitiveKeys) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    sensitiveKeys = sensitiveKeys || ['password', 'token', 'secret', 'key', 'apiKey', 'bsb', 'accountNumber'];

    var sanitized = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (sensitiveKeys.indexOf(key.toLowerCase()) !== -1) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeForLogging(obj[key], sensitiveKeys);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  }

  // ============================================================================
  // EXPORT API
  // ============================================================================

  // Create global Security namespace
  window.Security = {
    // XSS Prevention
    sanitizeHTML: sanitizeHTML,
    escapeHTML: escapeHTML,
    setTextSafely: setTextSafely,
    sanitizeWithLineBreaks: sanitizeWithLineBreaks,

    // Number Validation
    validateNumber: validateNumber,
    validatePositiveInteger: validatePositiveInteger,
    validateCurrency: validateCurrency,

    // String Validation
    validateString: validateString,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    validateBSB: validateBSB,
    validateABN: validateABN,

    // Encryption
    SecureStorage: SecureStorage,
    SecureStorageAdvanced: SecureStorageAdvanced,

    // JSON
    safeJSONParse: safeJSONParse,
    validateSchema: validateSchema,

    // Utilities
    isStorageAvailable: isStorageAvailable,
    generateSecureId: generateSecureId,
    sanitizeForLogging: sanitizeForLogging
  };

  // Also create shorthand alias
  window.Sec = window.Security;

  console.log('[Security] Security utilities loaded successfully');

})(window);
