// quote-pdf-ui.js - PDF UI Integration
// UI components and handlers for PDF generation
// Dependencies: quote-pdf.js, ui.js
// iOS Safari 12+ compatible

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[PDF-UI] Skipped in test mode');
    return;
  }

  /**
   * PDF UI Integration
   * Provides UI components and event handlers for PDF operations
   */
  var QuotePDFUI = {

    /**
     * Initialize PDF UI components
     */
    init: function() {
      this._attachButtonHandlers();
      this._attachEventListeners();
      console.log('[PDF-UI] PDF UI initialized');
    },

    /**
     * Attach click handlers to PDF buttons
     * @private
     */
    _attachButtonHandlers: function() {
      // Preview PDF button
      var previewBtn = document.getElementById('btn-preview-pdf');
      if (previewBtn) {
        previewBtn.addEventListener('click', this.handlePreviewPDF.bind(this));
      }

      // Download PDF button
      var downloadBtn = document.getElementById('btn-download-pdf');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', this.handleDownloadPDF.bind(this));
      }

      // Email PDF button
      var emailBtn = document.getElementById('btn-email-pdf');
      if (emailBtn) {
        emailBtn.addEventListener('click', this.handleEmailPDF.bind(this));
      }

      // Share PDF button (mobile)
      var shareBtn = document.getElementById('btn-share-pdf');
      if (shareBtn) {
        shareBtn.addEventListener('click', this.handleSharePDF.bind(this));
      }
    },

    /**
     * Attach custom event listeners
     * @private
     */
    _attachEventListeners: function() {
      // Listen for email event from quote-pdf.js
      document.addEventListener('quotepdf:email', function(e) {
        this.showEmailModal(e.detail);
      }.bind(this));
    },

    /**
     * Handle preview PDF button
     */
    handlePreviewPDF: function() {
      try {
        var quoteData = this._getCurrentQuoteData();

        if (!this._validateQuote(quoteData)) {
          return;
        }

        QuotePDFGenerator.preview(quoteData);

      } catch (error) {
        console.error('[PDF-UI] Preview error:', error);
        UIComponents.showToast('Failed to preview PDF: ' + error.message, 'error');
      }
    },

    /**
     * Handle download PDF button
     */
    handleDownloadPDF: function() {
      try {
        var quoteData = this._getCurrentQuoteData();

        if (!this._validateQuote(quoteData)) {
          return;
        }

        // Confirm if quote is draft
        if (!quoteData.quoteNumber || quoteData.status === 'draft') {
          UIComponents.showConfirm({
            title: 'Download Draft Quote?',
            message: 'This quote hasn\'t been finalized yet. Download anyway?',
            confirmText: 'Yes, Download',
            cancelText: 'Cancel',
            onConfirm: function() {
              QuotePDFGenerator.download(quoteData);
            }
          });
        } else {
          QuotePDFGenerator.download(quoteData);
        }

      } catch (error) {
        console.error('[PDF-UI] Download error:', error);
        UIComponents.showToast('Failed to download PDF: ' + error.message, 'error');
      }
    },

    /**
     * Handle email PDF button
     */
    handleEmailPDF: function() {
      try {
        var quoteData = this._getCurrentQuoteData();

        if (!this._validateQuote(quoteData)) {
          return;
        }

        // Check if client has email
        if (!quoteData.client || !quoteData.client.email) {
          UIComponents.showToast('Please add client email address first', 'warning');
          return;
        }

        // Prepare and show email modal
        UIComponents.showLoading('Preparing email...');

        var self = this;
        setTimeout(function() {
          try {
            var emailData = QuotePDFGenerator.prepareEmail(quoteData);
            UIComponents.hideLoading();
            self.showEmailModal(emailData);

          } catch (error) {
            UIComponents.hideLoading();
            UIComponents.showToast('Failed to prepare email: ' + error.message, 'error');
          }
        }, 100);

      } catch (error) {
        console.error('[PDF-UI] Email error:', error);
        UIComponents.showToast('Failed to email PDF: ' + error.message, 'error');
      }
    },

    /**
     * Handle share PDF button
     */
    handleSharePDF: function() {
      try {
        var quoteData = this._getCurrentQuoteData();

        if (!this._validateQuote(quoteData)) {
          return;
        }

        QuotePDFGenerator.share(quoteData);

      } catch (error) {
        console.error('[PDF-UI] Share error:', error);
        UIComponents.showToast('Failed to share PDF: ' + error.message, 'error');
      }
    },

    /**
     * Get current quote data
     * @private
     */
    _getCurrentQuoteData: function() {
      // Try multiple methods to get quote data

      // Method 1: Global function
      if (typeof window.getCurrentQuoteData === 'function') {
        return window.getCurrentQuoteData();
      }

      // Method 2: APP module
      if (window.APP && typeof window.APP.getCurrentQuote === 'function') {
        return window.APP.getCurrentQuote();
      }

      // Method 3: Convert from app state
      if (window.APP && typeof window.APP.getState === 'function') {
        var state = window.APP.getState();
        return this._convertStateToQuote(state);
      }

      return null;
    },

    /**
     * Convert app state to quote data
     * @private
     */
    _convertStateToQuote: function(state) {
      if (!state) return null;

      // Build line items
      var lineItems = [];

      // Window lines
      if (state.windowLines && Array.isArray(state.windowLines)) {
        for (var i = 0; i < state.windowLines.length; i++) {
          var wl = state.windowLines[i];
          lineItems.push({
            description: (wl.typeName || wl.type || 'Window') + ' Cleaning',
            details: (wl.insidePanes || 0) + ' inside, ' + (wl.outsidePanes || 0) + ' outside panes',
            quantity: wl.quantity || 1,
            unit: 'window',
            unitPrice: wl.price || 0,
            total: wl.total || 0
          });
        }
      }

      // Pressure lines
      if (state.pressureLines && Array.isArray(state.pressureLines)) {
        for (var j = 0; j < state.pressureLines.length; j++) {
          var pl = state.pressureLines[j];
          lineItems.push({
            description: (pl.surfaceName || pl.surface || 'Pressure') + ' Cleaning',
            details: (pl.area || 0) + ' ' + (pl.unit || 'sqm'),
            quantity: pl.area || 1,
            unit: pl.unit || 'sqm',
            unitPrice: pl.rate || 0,
            total: pl.total || 0
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
        subtotal: state.subtotalExGst || 0,
        gst: state.gst || 0,
        total: state.totalIncGst || 0,
        discount: state.discount || 0
      };
    },

    /**
     * Validate quote before PDF generation
     * @private
     */
    _validateQuote: function(quoteData) {
      if (!quoteData) {
        UIComponents.showToast('No quote data available', 'warning');
        return false;
      }

      if (!quoteData.lineItems || quoteData.lineItems.length === 0) {
        UIComponents.showToast('Please add line items before generating PDF', 'warning');
        return false;
      }

      if (!quoteData.client || !quoteData.client.name) {
        UIComponents.showToast('Please add client name before generating PDF', 'warning');
        return false;
      }

      return true;
    },

    /**
     * Show email modal
     * @param {object} emailData - Email data with attachment
     */
    showEmailModal: function(emailData) {
      // Create modal overlay
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.id = 'email-modal-overlay';

      // Create modal
      var modal = document.createElement('div');
      modal.className = 'modal active';
      modal.id = 'email-modal';

      // Modal content
      modal.innerHTML =
        '<div class="modal-header">' +
        '  <h3 class="modal-title">Email Quote</h3>' +
        '  <button class="modal-close" id="close-email-modal" aria-label="Close">' +
        '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
        '      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' +
        '    </svg>' +
        '  </button>' +
        '</div>' +
        '<div class="modal-body">' +
        '  <div class="form-group">' +
        '    <label class="form-label" for="email-to">To:</label>' +
        '    <input type="email" class="form-input" id="email-to" value="' + (emailData.to || '') + '" required />' +
        '  </div>' +
        '  <div class="form-group">' +
        '    <label class="form-label" for="email-subject">Subject:</label>' +
        '    <input type="text" class="form-input" id="email-subject" value="' + emailData.subject + '" required />' +
        '  </div>' +
        '  <div class="form-group">' +
        '    <label class="form-label" for="email-body">Message:</label>' +
        '    <textarea class="form-textarea" id="email-body" rows="10">' + emailData.body + '</textarea>' +
        '  </div>' +
        '  <div class="alert alert-info">' +
        '    <div class="alert-content">' +
        '      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
        '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '      </svg>' +
        '      <div class="alert-message">PDF will be attached: <strong>' + emailData.attachment.filename + '</strong></div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '  <button class="btn-secondary" id="cancel-email">Cancel</button>' +
        '  <button class="btn-primary" id="send-email">Send Email</button>' +
        '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      document.body.classList.add('modal-open');

      // Store email data
      window._emailData = emailData;

      // Attach event handlers
      var self = this;

      document.getElementById('close-email-modal').addEventListener('click', function() {
        self.closeEmailModal();
      });

      document.getElementById('cancel-email').addEventListener('click', function() {
        self.closeEmailModal();
      });

      document.getElementById('send-email').addEventListener('click', function() {
        self.sendEmail();
      });

      // Close on overlay click
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          self.closeEmailModal();
        }
      });

      // Focus email input
      document.getElementById('email-to').focus();
    },

    /**
     * Close email modal
     */
    closeEmailModal: function() {
      var overlay = document.getElementById('email-modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');

        setTimeout(function() {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }

      window._emailData = null;
    },

    /**
     * Send email
     */
    sendEmail: function() {
      // Get form values
      var to = document.getElementById('email-to').value.trim();
      var subject = document.getElementById('email-subject').value.trim();
      var body = document.getElementById('email-body').value.trim();

      // Validate
      if (!to) {
        UIComponents.showToast('Please enter recipient email address', 'warning');
        return;
      }

      if (!PDFHelpers.validateEmail(to)) {
        UIComponents.showToast('Please enter a valid email address', 'warning');
        return;
      }

      if (!subject) {
        UIComponents.showToast('Please enter email subject', 'warning');
        return;
      }

      // For now, open mailto link
      // In production, this would send via backend API
      var mailtoLink = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailtoLink;

      this.closeEmailModal();

      UIComponents.showToast('Email client opened. Please attach the PDF manually.', 'info');

      // TODO: Implement backend email sending with attachment
      // This would require a server-side endpoint to handle PDF attachment
    },

    /**
     * Render PDF action buttons
     * @returns {string} HTML for PDF action buttons
     */
    renderPDFButtons: function() {
      var html = '<div class="quote-actions pdf-actions">';

      // Preview button
      html += '<button class="btn-primary btn-icon" id="btn-preview-pdf" title="Preview PDF (Ctrl+P)">';
      html += '  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">';
      html += '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>';
      html += '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
      html += '  </svg>';
      html += '  <span>Preview PDF</span>';
      html += '</button>';

      // Download button
      html += '<button class="btn-secondary btn-icon" id="btn-download-pdf" title="Download PDF (Ctrl+Shift+D)">';
      html += '  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">';
      html += '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>';
      html += '  </svg>';
      html += '  <span>Download PDF</span>';
      html += '</button>';

      // Email button
      html += '<button class="btn-tertiary btn-icon" id="btn-email-pdf" title="Email Quote">';
      html += '  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">';
      html += '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>';
      html += '  </svg>';
      html += '  <span>Email Quote</span>';
      html += '</button>';

      // Share button (show on mobile)
      html += '<button class="btn-accent btn-icon mobile-only" id="btn-share-pdf" title="Share Quote">';
      html += '  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">';
      html += '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>';
      html += '  </svg>';
      html += '  <span>Share</span>';
      html += '</button>';

      html += '</div>';

      return html;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      QuotePDFUI.init();
    });
  } else {
    QuotePDFUI.init();
  }

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('quotePDFUI', QuotePDFUI);
  }

  // Make globally available
  window.QuotePDFUI = QuotePDFUI;
  window.showEmailModal = QuotePDFUI.showEmailModal.bind(QuotePDFUI);
  window.closeEmailModal = QuotePDFUI.closeEmailModal.bind(QuotePDFUI);

  console.log('[PDF-UI] PDF UI components ready');
})();
