// pdf-config.js - PDF Generation Configuration
// Company branding, layout settings, and PDF templates
// Dependencies: None (pure configuration)
// iOS Safari 12+ compatible

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[PDF-CONFIG] Skipped in test mode');
    return;
  }

  /**
   * PDF Configuration
   * Page setup, margins, colors, fonts, and layout specifications
   */
  var PDF_CONFIG = {
    // Page settings
    format: 'a4',
    orientation: 'portrait',
    unit: 'mm',

    // Margins (in mm)
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },

    // Page dimensions (A4)
    page: {
      width: 210,
      height: 297
    },

    // Content area (excluding margins)
    content: {
      width: 170,  // 210 - 20 - 20
      height: 257  // 297 - 20 - 20
    },

    // Colors (RGB arrays for jsPDF)
    colors: {
      primary: [37, 99, 235],      // #2563eb (blue)
      secondary: [16, 185, 129],   // #10b981 (emerald)
      accent: [245, 158, 11],      // #f59e0b (amber)
      text: {
        dark: [31, 41, 55],        // #1f2937
        medium: [107, 114, 128],   // #6b7280
        light: [156, 163, 175]     // #9ca3af
      },
      background: {
        light: [249, 250, 251],    // #f9fafb
        medium: [243, 244, 246],   // #f3f4f6
        dark: [229, 231, 235]      // #e5e7eb
      },
      border: [229, 231, 235],     // #e5e7eb
      success: [16, 185, 129],     // #10b981
      warning: [245, 158, 11],     // #f59e0b
      error: [239, 68, 68]         // #ef4444
    },

    // Font sizes (in pt)
    fontSize: {
      title: 24,
      heading: 16,
      subheading: 12,
      body: 10,
      small: 8,
      tiny: 7
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8
    },

    // Spacing
    spacing: {
      xs: 2,
      sm: 5,
      md: 10,
      lg: 15,
      xl: 20
    }
  };

  /**
   * Company Configuration
   * Business details, contact information, and branding
   */
  var COMPANY_CONFIG = {
    // Business details
    name: '925 Pressure Glass',
    tagline: 'Window Cleaning & Pressure Washing Specialists',
    abn: '12 345 678 901', // Placeholder - will be loaded from invoice settings if available
    acn: null, // Australian Company Number (if applicable)

    // Contact information
    phone: '0400 000 000', // Placeholder - update via invoice settings if needed
    email: 'info@925pressureglass.com.au',
    website: 'www.925pressureglass.com.au',

    // Address
    address: {
      street: '123 Business Street',
      suburb: 'Perth',
      city: 'Perth',
      state: 'WA',
      postcode: '6000',
      country: 'Australia'
    },

    // Operating area
    serviceArea: 'Perth Metropolitan Area',

    // Social media (optional)
    social: {
      facebook: 'facebook.com/925pressureglass',
      instagram: '@925pressureglass',
      linkedin: null
    },

    // Logo configuration
    // Note: Logo should be base64 encoded for embedding in PDF
    // Generate from image: https://www.base64-image.de/
    logo: {
      enabled: false, // Set to true when logo is added
      base64: null,   // Add base64 encoded logo here
      format: 'PNG',  // or 'JPEG', 'GIF'
      width: 40,      // width in mm
      height: 20,     // height in mm
      // Placeholder text when logo not available
      placeholder: '925 PG'
    },

    // Business credentials
    credentials: {
      fullyInsured: true,
      publicLiability: true,
      publicLiabilityAmount: '$20,000,000',
      workersComp: true,
      policeChecked: true,
      abn: true
    },

    // Payment details
    payment: {
      methods: ['Cash', 'Bank Transfer', 'Credit Card', 'Direct Debit'],
      depositPercentage: 50,
      terms: '50% deposit required to secure booking. Balance due upon completion.',
      bankDetails: {
        accountName: '925 Pressure Glass', // Will be loaded from invoice settings if available
        bsb: '123-456', // Placeholder - will be loaded from invoice settings if available
        accountNumber: '12345678', // Placeholder - will be loaded from invoice settings if available
        reference: 'Quote number'
      }
    },

    // Quote settings
    quote: {
      validityDays: 30,
      numberPrefix: 'QT',
      numberFormat: 'YYYYMMDD-XXX' // e.g., 20250118-001
    },

    // Default terms and conditions
    terms: {
      short: '50% deposit required. Balance due on completion. Valid for 30 days. Weather dependent services.',

      full: [
        '1. PAYMENT: A 50% deposit is required to secure your booking. The balance is due upon completion of work. We accept cash, bank transfer, and credit card payments.',
        '',
        '2. QUOTE VALIDITY: This quote is valid for 30 days from the date of issue. Prices may be subject to change after this period due to market conditions.',
        '',
        '3. SITE ACCESS: Client must ensure clear and safe access to all areas requiring service. Any obstructions, delays, or additional work required may result in additional charges.',
        '',
        '4. WEATHER CONDITIONS: Window cleaning and pressure washing services are weather-dependent. We will reschedule if conditions are unsuitable for safe, quality work at no additional charge.',
        '',
        '5. INSURANCE & LIABILITY: 925 Pressure Glass is fully insured with public liability coverage of $20,000,000. We take all reasonable care to protect your property, but clients must secure any loose items or fragile objects.',
        '',
        '6. CANCELLATIONS: Cancellations or rescheduling within 24 hours of the scheduled service time may incur a cancellation fee to cover scheduling costs.',
        '',
        '7. SCOPE OF WORK: This quote covers the services as described. Any additional work requested will be quoted separately and requires approval before proceeding.',
        '',
        '8. QUALITY GUARANTEE: We stand behind our work. If you\'re not satisfied with any aspect of our service, please contact us within 48 hours and we\'ll make it right.',
        '',
        '9. SAFETY: All work will be performed in compliance with WA WorkSafe regulations. We reserve the right to refuse work that poses unacceptable safety risks.',
        '',
        '10. ACCEPTANCE: Acceptance of this quote constitutes agreement to these terms and conditions.'
      ].join('\n')
    },

    // Disclaimer text
    disclaimer: 'Prices are in Australian Dollars and include GST. E&OE (Errors and Omissions Excepted).',

    // Contact hours
    businessHours: 'Mon-Fri: 7am-5pm, Sat: 8am-2pm, Sun: Closed',

    // Emergency contact
    emergencyContact: null
  };

  /**
   * Load Invoice Settings and Update Company Config
   * Integrates user-configured business details from invoice settings
   * Falls back to placeholder values if settings not configured
   */
  (function loadInvoiceSettings() {
    try {
      var settingsData = localStorage.getItem('invoice-settings');
      if (settingsData) {
        var invoiceSettings = JSON.parse(settingsData);

        // Update ABN if configured
        if (invoiceSettings.abn && invoiceSettings.abn.trim() !== '') {
          COMPANY_CONFIG.abn = invoiceSettings.abn;
        }

        // Update bank details if configured
        if (invoiceSettings.bsb && invoiceSettings.bsb.trim() !== '') {
          COMPANY_CONFIG.payment.bankDetails.bsb = invoiceSettings.bsb;
        }

        if (invoiceSettings.accountNumber && invoiceSettings.accountNumber.trim() !== '') {
          COMPANY_CONFIG.payment.bankDetails.accountNumber = invoiceSettings.accountNumber;
        }

        if (invoiceSettings.accountName && invoiceSettings.accountName.trim() !== '') {
          COMPANY_CONFIG.payment.bankDetails.accountName = invoiceSettings.accountName;
        }

        console.log('[PDF-CONFIG] Loaded business details from invoice settings');
      }
    } catch (e) {
      console.warn('[PDF-CONFIG] Could not load invoice settings:', e);
      console.log('[PDF-CONFIG] Using default placeholder values');
    }
  })();

  /**
   * PDF Template Definitions
   * Different layout templates for various quote types
   */
  var PDF_TEMPLATES = {
    // Standard professional template
    standard: {
      id: 'standard',
      name: 'Standard Professional',
      description: 'Professional layout with company branding and detailed breakdown',
      showLogo: true,
      showPhotos: false,
      showDetailedLineItems: true,
      colorScheme: 'blue', // primary color
      headerStyle: 'full',
      footerStyle: 'detailed'
    },

    // Minimal template
    minimal: {
      id: 'minimal',
      name: 'Minimal Clean',
      description: 'Clean, simple layout focusing on essentials',
      showLogo: false,
      showPhotos: false,
      showDetailedLineItems: false,
      colorScheme: 'gray',
      headerStyle: 'minimal',
      footerStyle: 'simple'
    },

    // Detailed template with photos
    detailed: {
      id: 'detailed',
      name: 'Detailed with Photos',
      description: 'Comprehensive layout including site photos and diagrams',
      showLogo: true,
      showPhotos: true,
      showDetailedLineItems: true,
      colorScheme: 'blue',
      headerStyle: 'full',
      footerStyle: 'detailed'
    },

    // Quick quote template
    quick: {
      id: 'quick',
      name: 'Quick Quote',
      description: 'Fast, simple quote for immediate pricing',
      showLogo: false,
      showPhotos: false,
      showDetailedLineItems: false,
      colorScheme: 'blue',
      headerStyle: 'minimal',
      footerStyle: 'simple'
    }
  };

  /**
   * Helper Functions
   */
  var PDFHelpers = {
    /**
     * Format currency value
     * @param {number} value - Value to format
     * @returns {string} Formatted currency string
     */
    formatCurrency: function(value) {
      if (typeof value !== 'number') {
        value = parseFloat(value) || 0;
      }
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Format date as DD/MM/YYYY
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate: function(date) {
      var d = date instanceof Date ? date : new Date(date);
      var day = String(d.getDate()).padStart(2, '0');
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var year = d.getFullYear();
      return day + '/' + month + '/' + year;
    },

    /**
     * Calculate expiry date (days from now)
     * @param {number} days - Number of days from now
     * @returns {string} Formatted expiry date
     */
    calculateExpiryDate: function(days) {
      var date = new Date();
      date.setDate(date.getDate() + days);
      return this.formatDate(date);
    },

    /**
     * Generate unique quote number
     * @returns {string} Quote number
     */
    generateQuoteNumber: function() {
      var date = new Date();
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var day = String(date.getDate()).padStart(2, '0');

      // Get sequence number from localStorage
      var key = 'quote-sequence-' + year + month + day;
      var sequence = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, String(sequence));

      var seqStr = String(sequence).padStart(3, '0');

      return COMPANY_CONFIG.quote.numberPrefix + year + month + day + '-' + seqStr;
    },

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    validateEmail: function(email) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    /**
     * Get full company address as string
     * @returns {string} Full address
     */
    getFullAddress: function() {
      var addr = COMPANY_CONFIG.address;
      var parts = [];

      if (addr.street) parts.push(addr.street);
      if (addr.suburb) parts.push(addr.suburb);
      if (addr.state && addr.postcode) {
        parts.push(addr.state + ' ' + addr.postcode);
      } else {
        if (addr.state) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);
      }
      if (addr.country && addr.country !== 'Australia') parts.push(addr.country);

      return parts.join(', ');
    },

    /**
     * Get default email body for quote
     * @param {object} quoteData - Quote data
     * @returns {string} Email body text
     */
    getDefaultEmailBody: function(quoteData) {
      var clientName = (quoteData.client && quoteData.client.name) ? quoteData.client.name : 'Valued Client';
      var quoteNum = quoteData.quoteNumber || 'DRAFT';
      var total = this.formatCurrency(quoteData.total || 0);

      var body = 'Dear ' + clientName + ',\n\n';
      body += 'Thank you for your interest in 925 Pressure Glass services.\n\n';
      body += 'Please find attached your quote (#' + quoteNum + ') for the requested ';
      body += 'window cleaning and pressure washing services.\n\n';
      body += 'Total: $' + total + ' (inc. GST)\n\n';
      body += 'This quote is valid for ' + COMPANY_CONFIG.quote.validityDays + ' days from the date of issue.\n\n';
      body += 'To proceed with booking:\n';
      body += '1. Reply to confirm acceptance of this quote\n';
      body += '2. Pay the 50% deposit to secure your booking\n';
      body += '3. We\'ll contact you to schedule the work\n\n';
      body += 'Payment can be made via:\n';
      body += '- Bank transfer (details in quote)\n';
      body += '- Credit card (call us to arrange)\n';
      body += '- Cash on the day\n\n';
      body += 'If you have any questions or would like to discuss the quote, ';
      body += 'please don\'t hesitate to contact us.\n\n';
      body += 'We look forward to working with you!\n\n';
      body += 'Best regards,\n\n';
      body += COMPANY_CONFIG.name + '\n';
      body += 'Phone: ' + COMPANY_CONFIG.phone + '\n';
      body += 'Email: ' + COMPANY_CONFIG.email + '\n';
      body += 'Web: ' + COMPANY_CONFIG.website;

      return body;
    }
  };

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('pdfConfig', {
      config: PDF_CONFIG,
      company: COMPANY_CONFIG,
      templates: PDF_TEMPLATES,
      helpers: PDFHelpers
    });
  }

  // Make globally available
  window.PDF_CONFIG = PDF_CONFIG;
  window.COMPANY_CONFIG = COMPANY_CONFIG;
  window.PDF_TEMPLATES = PDF_TEMPLATES;
  window.PDFHelpers = PDFHelpers;

  console.log('[PDF-CONFIG] PDF configuration initialized');
  console.log('[PDF-CONFIG] Company:', COMPANY_CONFIG.name);
  console.log('[PDF-CONFIG] Templates:', Object.keys(PDF_TEMPLATES).length);
})();
