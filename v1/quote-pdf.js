// quote-pdf.js - Quote PDF Generator
// Main module for generating professional quote PDFs
// Dependencies: pdf-config.js, pdf-components.js, jsPDF
// iOS Safari 12+ compatible

(function() {
  'use strict';

  /**
   * Quote PDF Generator
   * Generates professional PDF quotes with multiple output options
   */
  var QuotePDFGenerator = {

    /**
     * Generate PDF from quote data
     * @param {object} quoteData - Complete quote data object
     * @param {object} options - Generation options
     * @returns {object} PDF result with blob, filename, etc.
     */
    generate: function(quoteData, options) {
      options = options || {};
      var action = options.action || 'download';
      var template = options.template || 'standard';

      try {
        // Validate quote data
        this._validateQuoteData(quoteData);

        // Enrich quote data with calculated values
        quoteData = this._enrichQuoteData(quoteData);

        // Create PDF instance
        var pdf = new jsPDF({
          orientation: PDF_CONFIG.orientation,
          unit: PDF_CONFIG.unit,
          format: PDF_CONFIG.format
        });

        // Set document properties
        this._setDocumentProperties(pdf, quoteData);

        // Render PDF sections using components
        this._renderPDF(pdf, quoteData, template);

        // Generate filename
        var filename = this._generateFilename(quoteData);

        // Handle output based on action
        var result = {
          pdf: pdf,
          filename: filename,
          blob: null,
          success: true
        };

        if (action === 'download') {
          pdf.save(filename);
        } else if (action === 'preview') {
          var blobUrl = pdf.output('bloburl');
          window.open(blobUrl, '_blank');
          result.blobUrl = blobUrl;
        } else if (action === 'blob') {
          result.blob = pdf.output('blob');
        }

        console.log('[QUOTE-PDF] PDF generated successfully:', filename);
        return result;

      } catch (error) {
        console.error('[QUOTE-PDF] Generation error:', error);
        throw error;
      }
    },

    /**
     * Validate quote data
     * @private
     */
    _validateQuoteData: function(quoteData) {
      if (!quoteData) {
        throw new Error('Quote data is required');
      }

      if (!quoteData.lineItems || !Array.isArray(quoteData.lineItems)) {
        throw new Error('Quote must have line items array');
      }

      if (quoteData.lineItems.length === 0) {
        throw new Error('Quote must have at least one line item');
      }

      // Validate client data
      if (!quoteData.client || !quoteData.client.name) {
        console.warn('[QUOTE-PDF] Client name missing');
      }

      return true;
    },

    /**
     * Enrich quote data with calculated values
     * @private
     */
    _enrichQuoteData: function(quoteData) {
      var enriched = Object.assign({}, quoteData);

      // Calculate totals if not present
      if (!enriched.subtotal) {
        enriched.subtotal = this._calculateSubtotal(enriched.lineItems);
      }

      // Apply discount
      var discount = enriched.discount || 0;

      // Calculate GST
      if (!enriched.gst) {
        enriched.gst = Money.calculateGST(enriched.subtotal - discount);
      }

      // Calculate total
      if (!enriched.total) {
        enriched.total = enriched.subtotal - discount + enriched.gst;
      }

      // Add dates if missing
      if (!enriched.dateIssued) {
        enriched.dateIssued = PDFHelpers.formatDate(new Date());
      }

      if (!enriched.expiryDate) {
        enriched.expiryDate = PDFHelpers.calculateExpiryDate(COMPANY_CONFIG.quote.validityDays);
      }

      // Add quote number if missing
      if (!enriched.quoteNumber) {
        enriched.quoteNumber = PDFHelpers.generateQuoteNumber();
      }

      // Ensure client object exists
      if (!enriched.client) {
        enriched.client = {
          name: 'Valued Client',
          email: '',
          phone: '',
          address: ''
        };
      }

      return enriched;
    },

    /**
     * Calculate subtotal from line items
     * @private
     */
    _calculateSubtotal: function(lineItems) {
      var subtotal = 0;

      for (var i = 0; i < lineItems.length; i++) {
        var item = lineItems[i];
        var itemTotal = item.total || 0;

        if (!itemTotal && item.quantity && item.unitPrice) {
          itemTotal = item.quantity * item.unitPrice;
        }

        subtotal += itemTotal;
      }

      return subtotal;
    },

    /**
     * Set PDF document properties
     * @private
     */
    _setDocumentProperties: function(pdf, quoteData) {
      var quoteNum = quoteData.quoteNumber || 'DRAFT';
      var clientName = (quoteData.client && quoteData.client.name) ? quoteData.client.name : 'Client';

      pdf.setProperties({
        title: 'Quote ' + quoteNum + ' - ' + COMPANY_CONFIG.name,
        subject: 'Quote for ' + clientName,
        author: COMPANY_CONFIG.name,
        keywords: 'quote, window cleaning, pressure washing, ' + COMPANY_CONFIG.name,
        creator: 'TicTacStick v1.8.0'
      });
    },

    /**
     * Render PDF using components
     * @private
     */
    _renderPDF: function(pdf, quoteData, template) {
      var y = PDF_CONFIG.margin.top;

      // 1. Header
      y = PDFComponents.renderHeader(pdf, quoteData);

      // 2. Client details
      y = PDFComponents.renderClientDetails(pdf, quoteData, y);

      // 3. Line items table
      y = PDFComponents.renderLineItems(pdf, quoteData, y);

      // 4. Pricing summary
      y = PDFComponents.renderPricingSummary(pdf, quoteData, y);

      // 5. Notes and terms
      y = PDFComponents.renderNotesAndTerms(pdf, quoteData, y);

      // 6. Footer (on all pages)
      PDFComponents.renderFooter(pdf, quoteData);
    },

    /**
     * Generate filename for PDF
     * @private
     */
    _generateFilename: function(quoteData) {
      var parts = ['Quote'];

      if (quoteData.quoteNumber) {
        parts.push(quoteData.quoteNumber);
      }

      if (quoteData.client && quoteData.client.name) {
        // Sanitize client name for filename
        var clientName = quoteData.client.name
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_')
          .substring(0, 30);
        parts.push(clientName);
      }

      // Add date
      var date = new Date();
      var dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      parts.push(dateStr);

      return parts.join('_') + '.pdf';
    },

    /**
     * Preview quote PDF in new window
     * @param {object} quoteData - Quote data
     * @returns {object} Result
     */
    preview: function(quoteData) {
      try {
        UIComponents.showLoading('Generating preview...');

        var result = this.generate(quoteData, { action: 'preview' });

        UIComponents.hideLoading();
        return result;

      } catch (error) {
        UIComponents.hideLoading();
        UIComponents.showToast('Failed to preview PDF: ' + error.message, 'error');
        console.error('[QUOTE-PDF]', error);
        throw error;
      }
    },

    /**
     * Download quote PDF
     * @param {object} quoteData - Quote data
     * @returns {object} Result
     */
    download: function(quoteData) {
      try {
        UIComponents.showLoading('Generating PDF...');

        // Small delay to show loading
        var self = this;
        setTimeout(function() {
          try {
            var result = self.generate(quoteData, { action: 'download' });

            UIComponents.hideLoading();
            UIComponents.showToast('Quote PDF downloaded successfully', 'success');

            return result;

          } catch (error) {
            UIComponents.hideLoading();
            UIComponents.showToast('Failed to generate PDF: ' + error.message, 'error');
            throw error;
          }
        }, 100);

      } catch (error) {
        UIComponents.hideLoading();
        UIComponents.showToast('Failed to generate PDF: ' + error.message, 'error');
        console.error('[QUOTE-PDF]', error);
        throw error;
      }
    },

    /**
     * Prepare quote PDF for email
     * @param {object} quoteData - Quote data
     * @returns {object} Email data with PDF attachment
     */
    prepareEmail: function(quoteData) {
      try {
        var result = this.generate(quoteData, { action: 'blob' });

        var emailData = {
          to: (quoteData.client && quoteData.client.email) ? quoteData.client.email : '',
          subject: 'Quote from ' + COMPANY_CONFIG.name + ' - ' + (quoteData.quoteNumber || 'DRAFT'),
          body: PDFHelpers.getDefaultEmailBody(quoteData),
          attachment: {
            filename: result.filename,
            blob: result.blob,
            mimeType: 'application/pdf'
          }
        };

        return emailData;

      } catch (error) {
        console.error('[QUOTE-PDF] Email preparation error:', error);
        throw error;
      }
    },

    /**
     * Share quote PDF using Web Share API or fallback
     * @param {object} quoteData - Quote data
     */
    share: function(quoteData) {
      try {
        var self = this;

        UIComponents.showLoading('Preparing to share...');

        setTimeout(function() {
          try {
            var result = self.generate(quoteData, { action: 'blob' });

            UIComponents.hideLoading();

            // Check if Web Share API is available (mobile)
            if (navigator.share && navigator.canShare) {
              var file = new File([result.blob], result.filename, {
                type: 'application/pdf'
              });

              var shareData = {
                title: 'Quote from ' + COMPANY_CONFIG.name,
                text: 'Quote #' + (quoteData.quoteNumber || 'DRAFT'),
                files: [file]
              };

              if (navigator.canShare(shareData)) {
                navigator.share(shareData)
                  .then(function() {
                    UIComponents.showToast('Quote shared successfully', 'success');
                  })
                  .catch(function(error) {
                    if (error.name !== 'AbortError') {
                      console.error('[QUOTE-PDF] Share error:', error);
                      UIComponents.showToast('Failed to share: ' + error.message, 'error');
                    }
                  });
              } else {
                // Fallback to email modal
                self._showEmailModal(quoteData);
              }
            } else {
              // Fallback to email modal
              self._showEmailModal(quoteData);
            }

          } catch (error) {
            UIComponents.hideLoading();
            UIComponents.showToast('Failed to prepare share: ' + error.message, 'error');
            throw error;
          }
        }, 100);

      } catch (error) {
        UIComponents.hideLoading();
        UIComponents.showToast('Failed to share PDF: ' + error.message, 'error');
        console.error('[QUOTE-PDF]', error);
      }
    },

    /**
     * Show email modal (internal fallback)
     * @private
     */
    _showEmailModal: function(quoteData) {
      try {
        var emailData = this.prepareEmail(quoteData);

        // Trigger custom event that UI can listen to
        var event = new CustomEvent('quotepdf:email', {
          detail: emailData
        });
        document.dispatchEvent(event);

        // Also call global function if available
        if (typeof window.showEmailModal === 'function') {
          window.showEmailModal(emailData);
        }

      } catch (error) {
        console.error('[QUOTE-PDF] Email modal error:', error);
        UIComponents.showToast('Failed to prepare email', 'error');
      }
    },

    /**
     * Batch generate PDFs for multiple quotes
     * @param {array} quotes - Array of quote data objects
     * @returns {array} Array of results
     */
    batchGenerate: function(quotes) {
      var results = [];

      for (var i = 0; i < quotes.length; i++) {
        try {
          var result = this.generate(quotes[i], { action: 'blob' });
          results.push({
            success: true,
            quote: quotes[i],
            result: result
          });
        } catch (error) {
          results.push({
            success: false,
            quote: quotes[i],
            error: error.message
          });
        }
      }

      return results;
    }
  };

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + P = Preview PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        var currentQuote = getCurrentQuoteData();
        if (currentQuote && currentQuote.lineItems && currentQuote.lineItems.length > 0) {
          e.preventDefault();
          QuotePDFGenerator.preview(currentQuote);
        }
      }

      // Ctrl/Cmd + Shift + D = Download PDF
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        var currentQuote = getCurrentQuoteData();
        if (currentQuote && currentQuote.lineItems && currentQuote.lineItems.length > 0) {
          e.preventDefault();
          QuotePDFGenerator.download(currentQuote);
        }
      }
    });
  }

  /**
   * Get current quote data from app state
   * This function should be implemented by the main app
   * @returns {object|null} Current quote data
   */
  function getCurrentQuoteData() {
    // Check if app has getCurrentQuote function
    if (window.APP && typeof window.APP.getCurrentQuote === 'function') {
      return window.APP.getCurrentQuote();
    }

    // Fallback: try to build from app state
    if (window.APP && typeof window.APP.getState === 'function') {
      var state = window.APP.getState();
      if (!state) return null;

      // Convert app state to quote data format
      return convertStateToQuoteData(state);
    }

    return null;
  }

  /**
   * Convert app state to quote data format
   * @param {object} state - App state
   * @returns {object} Quote data
   */
  function convertStateToQuoteData(state) {
    // Build line items from window and pressure lines
    var lineItems = [];

    // Add window lines
    if (state.windowLines && Array.isArray(state.windowLines)) {
      for (var i = 0; i < state.windowLines.length; i++) {
        var wl = state.windowLines[i];
        lineItems.push({
          description: (wl.typeName || wl.type || 'Window') + ' Cleaning',
          details: wl.insidePanes + ' inside, ' + wl.outsidePanes + ' outside panes',
          quantity: wl.quantity || 1,
          unit: 'window',
          unitPrice: wl.price || 0,
          total: wl.total || (wl.price * wl.quantity)
        });
      }
    }

    // Add pressure lines
    if (state.pressureLines && Array.isArray(state.pressureLines)) {
      for (var j = 0; j < state.pressureLines.length; j++) {
        var pl = state.pressureLines[j];
        lineItems.push({
          description: (pl.surfaceName || pl.surface || 'Pressure') + ' Cleaning',
          details: pl.area + ' ' + (pl.unit || 'sqm'),
          quantity: pl.area || 1,
          unit: pl.unit || 'sqm',
          unitPrice: pl.rate || 0,
          total: pl.total || (pl.rate * pl.area)
        });
      }
    }

    return {
      quoteNumber: state.quoteNumber || null,
      dateIssued: state.dateCreated || null,
      status: state.status || 'draft',
      client: {
        name: state.clientName || '',
        email: state.clientEmail || '',
        phone: state.clientPhone || '',
        address: state.clientLocation || ''
      },
      projectAddress: state.projectAddress || state.clientLocation || '',
      lineItems: lineItems,
      notes: state.clientNotes || state.internalNotes || '',
      terms: null, // Will use default
      subtotal: state.subtotalExGst || 0,
      gst: state.gst || 0,
      total: state.totalIncGst || 0,
      discount: state.discount || 0
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventListeners);
  } else {
    initEventListeners();
  }

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('quotePDF', QuotePDFGenerator);
  }

  // Make globally available
  window.QuotePDFGenerator = QuotePDFGenerator;

  console.log('[QUOTE-PDF] Quote PDF generator initialized');
  console.log('[QUOTE-PDF] Keyboard shortcuts:');
  console.log('[QUOTE-PDF]   Ctrl/Cmd + P = Preview PDF');
  console.log('[QUOTE-PDF]   Ctrl/Cmd + Shift + D = Download PDF');
})();
