// business-settings.js - Business Configuration UI
// iOS Safari 12+ compatible (ES5 only)
// Manages user-configurable business information

(function() {
  'use strict';

  var STORAGE_KEY = 'tts_business_settings';

  /**
   * Default business settings (matches config.js structure)
   */
  var DEFAULTS = {
    abn: '',
    email: 'info@925pressureglass.com.au',
    phone: '',
    website: 'www.925pressureglass.com.au',
    address: {
      street: '',
      city: 'Perth',
      state: 'WA',
      postcode: '',
      country: 'Australia'
    },
    bankDetails: {
      accountName: '925 Pressure Glass',
      bsb: '',
      accountNumber: ''
    },
    // Track when settings were last updated
    lastUpdated: null
  };

  /**
   * BusinessSettings module
   */
  var BusinessSettings = {
    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    load: function() {
      try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          var parsed = JSON.parse(stored);
          // Merge with defaults to ensure all fields exist
          return this._mergeWithDefaults(parsed);
        }
      } catch (e) {
        console.error('[BUSINESS-SETTINGS] Failed to load:', e);
      }
      return this._cloneDefaults();
    },

    /**
     * Save settings to localStorage
     * @param {Object} settings - Settings to save
     */
    save: function(settings) {
      try {
        settings.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        this.applyToConfig(settings);
        console.log('[BUSINESS-SETTINGS] Settings saved');
        return true;
      } catch (e) {
        console.error('[BUSINESS-SETTINGS] Failed to save:', e);
        return false;
      }
    },

    /**
     * Apply settings to global COMPANY_CONFIG
     * @param {Object} settings - Settings to apply
     */
    applyToConfig: function(settings) {
      if (!window.COMPANY_CONFIG) {
        console.warn('[BUSINESS-SETTINGS] COMPANY_CONFIG not available');
        return;
      }

      // Apply business details
      if (settings.abn) {
        window.COMPANY_CONFIG.abn = settings.abn;
      }
      if (settings.phone) {
        window.COMPANY_CONFIG.phone = settings.phone;
      }
      if (settings.email) {
        window.COMPANY_CONFIG.email = settings.email;
      }
      if (settings.website) {
        window.COMPANY_CONFIG.website = settings.website;
      }

      // Apply address
      if (settings.address) {
        window.COMPANY_CONFIG.address = {
          street: settings.address.street || '',
          city: settings.address.city || 'Perth',
          state: settings.address.state || 'WA',
          postcode: settings.address.postcode || '',
          country: settings.address.country || 'Australia'
        };
      }

      // Apply bank details
      if (settings.bankDetails && window.COMPANY_CONFIG.invoice) {
        window.COMPANY_CONFIG.invoice.bankDetails = {
          accountName: settings.bankDetails.accountName || '925 Pressure Glass',
          bsb: settings.bankDetails.bsb || '',
          accountNumber: settings.bankDetails.accountNumber || ''
        };
      }

      console.log('[BUSINESS-SETTINGS] Applied to COMPANY_CONFIG');
    },

    /**
     * Open settings modal
     */
    openModal: function() {
      var modal = document.getElementById('business-settings-modal');
      if (!modal) {
        console.error('[BUSINESS-SETTINGS] Modal not found');
        return;
      }

      // Load current settings into form
      var settings = this.load();
      this._populateForm(settings);

      // Show modal
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    },

    /**
     * Close settings modal
     */
    closeModal: function() {
      var modal = document.getElementById('business-settings-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    },

    /**
     * Save from modal form
     */
    saveFromModal: function() {
      var settings = this._collectFormData();
      
      // Validate required fields
      var errors = this._validate(settings);
      if (errors.length > 0) {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Please fix: ' + errors.join(', '), 'error');
        } else {
          alert('Please fix: ' + errors.join(', '));
        }
        return;
      }

      // Save settings
      if (this.save(settings)) {
        this.closeModal();
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Business settings saved!', 'success');
        } else {
          alert('Business settings saved!');
        }
      } else {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Failed to save settings', 'error');
        } else {
          alert('Failed to save settings');
        }
      }
    },

    /**
     * Populate form with settings
     * @private
     */
    _populateForm: function(settings) {
      // Business details
      this._setInputValue('business-abn', settings.abn);
      this._setInputValue('business-phone', settings.phone);
      this._setInputValue('business-email', settings.email);
      this._setInputValue('business-website', settings.website);

      // Address
      this._setInputValue('business-street', settings.address ? settings.address.street : '');
      this._setInputValue('business-city', settings.address ? settings.address.city : 'Perth');
      this._setInputValue('business-state', settings.address ? settings.address.state : 'WA');
      this._setInputValue('business-postcode', settings.address ? settings.address.postcode : '');

      // Bank details
      this._setInputValue('business-account-name', settings.bankDetails ? settings.bankDetails.accountName : '');
      this._setInputValue('business-bsb', settings.bankDetails ? settings.bankDetails.bsb : '');
      this._setInputValue('business-account-number', settings.bankDetails ? settings.bankDetails.accountNumber : '');
    },

    /**
     * Collect form data into settings object
     * @private
     */
    _collectFormData: function() {
      return {
        abn: this._getInputValue('business-abn'),
        phone: this._getInputValue('business-phone'),
        email: this._getInputValue('business-email'),
        website: this._getInputValue('business-website'),
        address: {
          street: this._getInputValue('business-street'),
          city: this._getInputValue('business-city'),
          state: this._getInputValue('business-state'),
          postcode: this._getInputValue('business-postcode'),
          country: 'Australia'
        },
        bankDetails: {
          accountName: this._getInputValue('business-account-name'),
          bsb: this._getInputValue('business-bsb'),
          accountNumber: this._getInputValue('business-account-number')
        }
      };
    },

    /**
     * Validate settings
     * @private
     */
    _validate: function(settings) {
      var errors = [];

      // ABN validation (11 digits)
      if (settings.abn) {
        var abnClean = settings.abn.replace(/\s/g, '');
        if (!/^\d{11}$/.test(abnClean)) {
          errors.push('ABN must be 11 digits');
        }
      }

      // Phone validation (basic Australian format)
      if (settings.phone) {
        var phoneClean = settings.phone.replace(/[\s\-()]/g, '');
        if (!/^(0[2-9]\d{8}|04\d{8})$/.test(phoneClean)) {
          errors.push('Invalid phone format');
        }
      }

      // Email validation
      if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
        errors.push('Invalid email format');
      }

      // BSB validation (6 digits, optional dash)
      if (settings.bankDetails && settings.bankDetails.bsb) {
        var bsbClean = settings.bankDetails.bsb.replace(/[\s\-]/g, '');
        if (!/^\d{6}$/.test(bsbClean)) {
          errors.push('BSB must be 6 digits');
        }
      }

      // Postcode validation (4 digits for Australia)
      if (settings.address && settings.address.postcode) {
        if (!/^\d{4}$/.test(settings.address.postcode)) {
          errors.push('Postcode must be 4 digits');
        }
      }

      return errors;
    },

    /**
     * Helper to get input value
     * @private
     */
    _getInputValue: function(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    },

    /**
     * Helper to set input value
     * @private
     */
    _setInputValue: function(id, value) {
      var el = document.getElementById(id);
      if (el) {
        el.value = value || '';
      }
    },

    /**
     * Merge settings with defaults
     * @private
     */
    _mergeWithDefaults: function(settings) {
      var result = this._cloneDefaults();
      
      if (settings.abn !== undefined) result.abn = settings.abn;
      if (settings.email !== undefined) result.email = settings.email;
      if (settings.phone !== undefined) result.phone = settings.phone;
      if (settings.website !== undefined) result.website = settings.website;
      if (settings.lastUpdated !== undefined) result.lastUpdated = settings.lastUpdated;

      if (settings.address) {
        result.address.street = settings.address.street || result.address.street;
        result.address.city = settings.address.city || result.address.city;
        result.address.state = settings.address.state || result.address.state;
        result.address.postcode = settings.address.postcode || result.address.postcode;
        result.address.country = settings.address.country || result.address.country;
      }

      if (settings.bankDetails) {
        result.bankDetails.accountName = settings.bankDetails.accountName || result.bankDetails.accountName;
        result.bankDetails.bsb = settings.bankDetails.bsb || result.bankDetails.bsb;
        result.bankDetails.accountNumber = settings.bankDetails.accountNumber || result.bankDetails.accountNumber;
      }

      return result;
    },

    /**
     * Clone defaults object
     * @private
     */
    _cloneDefaults: function() {
      return {
        abn: DEFAULTS.abn,
        email: DEFAULTS.email,
        phone: DEFAULTS.phone,
        website: DEFAULTS.website,
        address: {
          street: DEFAULTS.address.street,
          city: DEFAULTS.address.city,
          state: DEFAULTS.address.state,
          postcode: DEFAULTS.address.postcode,
          country: DEFAULTS.address.country
        },
        bankDetails: {
          accountName: DEFAULTS.bankDetails.accountName,
          bsb: DEFAULTS.bankDetails.bsb,
          accountNumber: DEFAULTS.bankDetails.accountNumber
        },
        lastUpdated: null
      };
    },

    /**
     * Format ABN for display (XX XXX XXX XXX)
     */
    formatABN: function(abn) {
      if (!abn) return '';
      var clean = abn.replace(/\s/g, '');
      if (clean.length !== 11) return abn;
      return clean.slice(0, 2) + ' ' + clean.slice(2, 5) + ' ' + clean.slice(5, 8) + ' ' + clean.slice(8, 11);
    },

    /**
     * Format BSB for display (XXX-XXX)
     */
    formatBSB: function(bsb) {
      if (!bsb) return '';
      var clean = bsb.replace(/[\s\-]/g, '');
      if (clean.length !== 6) return bsb;
      return clean.slice(0, 3) + '-' + clean.slice(3, 6);
    },

    /**
     * Initialize on page load
     */
    init: function() {
      var settings = this.load();
      
      // Only apply if settings have been saved before
      if (settings.lastUpdated) {
        this.applyToConfig(settings);
        console.log('[BUSINESS-SETTINGS] Loaded saved settings from', settings.lastUpdated);
      } else {
        console.log('[BUSINESS-SETTINGS] No saved settings, using defaults');
      }
    }
  };

  // Export to window
  window.BusinessSettings = BusinessSettings;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      BusinessSettings.init();
    });
  } else {
    BusinessSettings.init();
  }

  console.log('[BUSINESS-SETTINGS] Module loaded');
})();
