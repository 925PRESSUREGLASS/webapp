// pdf-components.js - PDF Rendering Components
// Reusable PDF section renderers for quotes
// Dependencies: pdf-config.js, jsPDF
// iOS Safari 12+ compatible

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[PDF-COMPONENTS] Skipped in test mode');
    return;
  }

  /**
   * PDF Components Library
   * Renders individual sections of quote PDFs
   */
  var PDFComponents = {

    /**
     * Render PDF header with company branding
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     * @returns {number} New Y position after header
     */
    renderHeader: function(pdf, quoteData) {
      var config = PDF_CONFIG;
      var company = COMPANY_CONFIG;
      var x = config.margin.left;
      var y = config.margin.top;

      // Company logo or placeholder
      if (company.logo.enabled && company.logo.base64) {
        try {
          pdf.addImage(
            company.logo.base64,
            company.logo.format || 'PNG',
            x,
            y,
            company.logo.width,
            company.logo.height
          );
        } catch (e) {
          console.error('[PDF] Error adding logo:', e);
          // Fall back to text
          this._renderLogoPlaceholder(pdf, x, y);
        }
      } else {
        // Render placeholder
        this._renderLogoPlaceholder(pdf, x, y);
      }

      // Company name and tagline (right of logo)
      var textX = x + (company.logo.enabled ? company.logo.width + 5 : 25);

      pdf.setFontSize(config.fontSize.title);
      pdf.setTextColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(company.name.toUpperCase(), textX, y + 8);

      pdf.setFontSize(config.fontSize.small);
      pdf.setTextColor(config.colors.text.medium[0], config.colors.text.medium[1], config.colors.text.medium[2]);
      pdf.setFont('helvetica', 'normal');
      pdf.text(company.tagline, textX, y + 14);

      // Quote title and number (right side)
      var rightX = config.margin.left + config.content.width;

      pdf.setFontSize(config.fontSize.heading);
      pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('QUOTE', rightX, y + 8, { align: 'right' });

      pdf.setFontSize(config.fontSize.body);
      pdf.setFont('helvetica', 'normal');
      var quoteNum = quoteData.quoteNumber || 'DRAFT';
      pdf.text('Quote #: ' + quoteNum, rightX, y + 14, { align: 'right' });

      // Status badge if not draft
      if (quoteData.status && quoteData.status !== 'draft') {
        pdf.setFontSize(config.fontSize.small);
        var statusText = quoteData.status.toUpperCase();
        var statusColor = this._getStatusColor(quoteData.status);
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.text('[' + statusText + ']', rightX, y + 19, { align: 'right' });
      }

      // Contact details (below logo)
      y += 25;
      pdf.setFontSize(config.fontSize.small);
      pdf.setTextColor(config.colors.text.medium[0], config.colors.text.medium[1], config.colors.text.medium[2]);

      var contactLines = [
        'Phone: ' + company.phone,
        'Email: ' + company.email,
        'Web: ' + company.website
      ];

      for (var i = 0; i < contactLines.length; i++) {
        pdf.text(contactLines[i], x, y + (i * 4));
      }

      // Horizontal line separator
      y += 15;
      pdf.setDrawColor(config.colors.border[0], config.colors.border[1], config.colors.border[2]);
      pdf.setLineWidth(0.5);
      pdf.line(x, y, rightX, y);

      return y + 5;
    },

    /**
     * Render logo placeholder
     * @private
     */
    _renderLogoPlaceholder: function(pdf, x, y) {
      var config = PDF_CONFIG;
      var company = COMPANY_CONFIG;

      // Draw border box
      pdf.setDrawColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.setLineWidth(1);
      pdf.rect(x, y, 20, 20);

      // Draw text
      pdf.setFontSize(config.fontSize.subheading);
      pdf.setTextColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(company.logo.placeholder, x + 10, y + 13, { align: 'center' });
    },

    /**
     * Get color for status badge
     * @private
     */
    _getStatusColor: function(status) {
      var config = PDF_CONFIG;
      switch (status) {
        case 'accepted': return config.colors.success;
        case 'sent': return config.colors.primary;
        case 'expired': return config.colors.error;
        case 'pending': return config.colors.warning;
        default: return config.colors.text.medium;
      }
    },

    /**
     * Render client and quote details
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     * @param {number} startY - Starting Y position
     * @returns {number} New Y position
     */
    renderClientDetails: function(pdf, quoteData, startY) {
      var config = PDF_CONFIG;
      var x = config.margin.left;
      var y = startY;

      // Calculate box height based on content
      var boxHeight = 30;
      if (quoteData.projectAddress) boxHeight += 10;

      // Section background
      pdf.setFillColor(config.colors.background.light[0], config.colors.background.light[1], config.colors.background.light[2]);
      pdf.rect(x, y, config.content.width, boxHeight, 'F');

      y += 5;
      var innerX = x + 5;

      // Left column - Client details
      pdf.setFontSize(config.fontSize.subheading);
      pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CLIENT DETAILS', innerX, y);

      y += 6;
      pdf.setFontSize(config.fontSize.body);
      pdf.setFont('helvetica', 'normal');

      var client = quoteData.client || {};
      var clientLines = [];

      if (client.name) clientLines.push(client.name);
      if (client.email) clientLines.push(client.email);
      if (client.phone) clientLines.push(client.phone);

      // Add address if available
      if (client.address) {
        if (typeof client.address === 'string') {
          clientLines.push(client.address);
        } else {
          if (client.address.street) clientLines.push(client.address.street);
          var cityLine = [client.address.city, client.address.state, client.address.postcode]
            .filter(function(v) { return v; })
            .join(' ');
          if (cityLine) clientLines.push(cityLine);
        }
      }

      // Render client lines
      for (var i = 0; i < clientLines.length; i++) {
        if (clientLines[i]) {
          pdf.text(clientLines[i], innerX, y + (i * 5));
        }
      }

      // Right column - Quote metadata
      var midX = config.margin.left + (config.content.width / 2);
      y = startY + 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('QUOTE DETAILS', midX, y);

      y += 6;
      pdf.setFont('helvetica', 'normal');

      var dateIssued = quoteData.dateIssued || PDFHelpers.formatDate(new Date());
      var expiryDate = quoteData.expiryDate || PDFHelpers.calculateExpiryDate(COMPANY_CONFIG.quote.validityDays);
      var paymentTerms = quoteData.paymentTerms || COMPANY_CONFIG.payment.terms;

      var quoteMetadata = [
        'Quote Date: ' + dateIssued,
        'Valid Until: ' + expiryDate,
        'Payment Terms: ' + COMPANY_CONFIG.payment.depositPercentage + '% deposit'
      ];

      for (var j = 0; j < quoteMetadata.length; j++) {
        pdf.text(quoteMetadata[j], midX, y + (j * 5));
      }

      // Project address if different from client address
      if (quoteData.projectAddress && quoteData.projectAddress !== client.address) {
        y += 20;
        pdf.setFont('helvetica', 'bold');
        pdf.text('PROJECT ADDRESS', innerX, y);

        y += 5;
        pdf.setFont('helvetica', 'normal');

        var projAddr = typeof quoteData.projectAddress === 'string'
          ? quoteData.projectAddress
          : PDFHelpers.getFullAddress();

        var addrLines = pdf.splitTextToSize(projAddr, config.content.width / 2 - 10);
        pdf.text(addrLines, innerX, y);
      }

      return startY + boxHeight + 5;
    },

    /**
     * Render line items table
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     * @param {number} startY - Starting Y position
     * @returns {number} New Y position
     */
    renderLineItems: function(pdf, quoteData, startY) {
      var config = PDF_CONFIG;
      var x = config.margin.left;
      var y = startY;

      // Table configuration
      var table = {
        x: x,
        y: y,
        width: config.content.width,
        columns: [
          { header: 'Description', width: 80, align: 'left' },
          { header: 'Qty', width: 20, align: 'center' },
          { header: 'Unit', width: 25, align: 'center' },
          { header: 'Unit Price', width: 25, align: 'right' },
          { header: 'Total', width: 20, align: 'right' }
        ],
        rowHeight: 8,
        headerHeight: 10
      };

      // Draw table header
      pdf.setFillColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.rect(table.x, table.y, table.width, table.headerHeight, 'F');

      pdf.setFontSize(config.fontSize.body);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');

      var colX = table.x + 2;
      for (var i = 0; i < table.columns.length; i++) {
        var col = table.columns[i];
        var textX = this._getAlignedX(colX, col.width, col.align);
        pdf.text(col.header, textX, table.y + 7, { align: col.align });
        colX += col.width;
      }

      y += table.headerHeight;

      // Draw line items
      pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
      pdf.setFont('helvetica', 'normal');

      var lineItems = quoteData.lineItems || [];
      var rowIndex = 0;
      var startTableY = table.y;

      for (var j = 0; j < lineItems.length; j++) {
        var item = lineItems[j];

        // Check if we need a new page
        if (y > config.page.height - 80) {
          pdf.addPage();
          y = config.margin.top;

          // Redraw table header
          this._renderTableHeader(pdf, table, y);
          y += table.headerHeight;

          rowIndex = 0;
        }

        // Alternating row background
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(config.colors.background.medium[0], config.colors.background.medium[1], config.colors.background.medium[2]);
          pdf.rect(table.x, y, table.width, table.rowHeight, 'F');
        }

        // Build description
        var description = item.description || item.serviceType || 'Service';
        if (item.details) {
          description += ' - ' + item.details;
        }

        // Draw row data
        colX = table.x + 2;
        var textY = y + 6;

        // Description (can be multi-line)
        var descLines = pdf.splitTextToSize(description, table.columns[0].width - 4);
        pdf.text(descLines, colX + 2, textY);
        colX += table.columns[0].width;

        // Quantity
        var qty = item.quantity || 1;
        pdf.text(String(qty), this._getAlignedX(colX, table.columns[1].width, 'center'), textY, { align: 'center' });
        colX += table.columns[1].width;

        // Unit
        var unit = item.unit || 'ea';
        pdf.text(unit, this._getAlignedX(colX, table.columns[2].width, 'center'), textY, { align: 'center' });
        colX += table.columns[2].width;

        // Unit Price
        var unitPrice = item.unitPrice || (item.total / qty);
        pdf.text('$' + PDFHelpers.formatCurrency(unitPrice), this._getAlignedX(colX, table.columns[3].width, 'right'), textY, { align: 'right' });
        colX += table.columns[3].width;

        // Line Total
        var lineTotal = item.total || (unitPrice * qty);
        pdf.text('$' + PDFHelpers.formatCurrency(lineTotal), this._getAlignedX(colX, table.columns[4].width, 'right'), textY, { align: 'right' });

        // Calculate actual row height
        var rowHeight = Math.max(table.rowHeight, descLines.length * 4 + 4);
        y += rowHeight;
        rowIndex++;
      }

      // Draw table border
      pdf.setDrawColor(config.colors.border[0], config.colors.border[1], config.colors.border[2]);
      pdf.setLineWidth(0.2);

      // If table spans pages, only draw current page portion
      var tableHeight = y - startTableY;
      if (tableHeight > 0) {
        pdf.rect(table.x, startTableY, table.width, tableHeight);
      }

      return y + 5;
    },

    /**
     * Render table header (for multi-page tables)
     * @private
     */
    _renderTableHeader: function(pdf, table, y) {
      var config = PDF_CONFIG;

      pdf.setFillColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.rect(table.x, y, table.width, table.headerHeight, 'F');

      pdf.setFontSize(config.fontSize.body);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');

      var colX = table.x + 2;
      for (var i = 0; i < table.columns.length; i++) {
        var col = table.columns[i];
        var textX = this._getAlignedX(colX, col.width, col.align);
        pdf.text(col.header, textX, y + 7, { align: col.align });
        colX += col.width;
      }

      pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
      pdf.setFont('helvetica', 'normal');
    },

    /**
     * Get X position for aligned text
     * @private
     */
    _getAlignedX: function(colX, colWidth, align) {
      if (align === 'center') {
        return colX + (colWidth / 2);
      } else if (align === 'right') {
        return colX + colWidth - 2;
      }
      return colX + 2;
    },

    /**
     * Render pricing summary box
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     * @param {number} startY - Starting Y position
     * @returns {number} New Y position
     */
    renderPricingSummary: function(pdf, quoteData, startY) {
      var config = PDF_CONFIG;
      var x = config.margin.left;
      var y = startY;

      // Summary box configuration
      var summaryBox = {
        width: 70,
        x: config.margin.left + config.content.width - 70,
        y: y,
        padding: 5,
        lineHeight: 7
      };

      // Calculate box height
      var boxHeight = 40;
      if (quoteData.discount && quoteData.discount > 0) {
        boxHeight += 7;
      }

      // Draw background box
      pdf.setFillColor(config.colors.background.light[0], config.colors.background.light[1], config.colors.background.light[2]);
      pdf.setDrawColor(config.colors.border[0], config.colors.border[1], config.colors.border[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(summaryBox.x, summaryBox.y, summaryBox.width, boxHeight, 'FD');

      // Setup text
      pdf.setFontSize(config.fontSize.body);
      pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);

      var textY = summaryBox.y + summaryBox.padding + 5;
      var labelX = summaryBox.x + summaryBox.padding;
      var valueX = summaryBox.x + summaryBox.width - summaryBox.padding;

      // Subtotal
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', labelX, textY);
      pdf.text('$' + PDFHelpers.formatCurrency(quoteData.subtotal || 0), valueX, textY, { align: 'right' });
      textY += summaryBox.lineHeight;

      // Discount (if applicable)
      if (quoteData.discount && quoteData.discount > 0) {
        pdf.setTextColor(config.colors.secondary[0], config.colors.secondary[1], config.colors.secondary[2]);
        pdf.text('Discount:', labelX, textY);
        pdf.text('-$' + PDFHelpers.formatCurrency(quoteData.discount), valueX, textY, { align: 'right' });
        textY += summaryBox.lineHeight;
        pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
      }

      // GST
      var gstAmount = quoteData.gst || Money.calculateGST(quoteData.subtotal - (quoteData.discount || 0));
      pdf.text('GST (10%):', labelX, textY);
      pdf.text('$' + PDFHelpers.formatCurrency(gstAmount), valueX, textY, { align: 'right' });
      textY += summaryBox.lineHeight;

      // Divider line
      pdf.setDrawColor(config.colors.border[0], config.colors.border[1], config.colors.border[2]);
      pdf.line(labelX, textY, valueX, textY);
      textY += 5;

      // Total
      pdf.setFontSize(config.fontSize.subheading);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(config.colors.primary[0], config.colors.primary[1], config.colors.primary[2]);
      pdf.text('TOTAL:', labelX, textY);
      pdf.text('$' + PDFHelpers.formatCurrency(quoteData.total || 0), valueX, textY, { align: 'right' });

      // Deposit amount (below box)
      if (COMPANY_CONFIG.payment.depositPercentage) {
        textY = summaryBox.y + boxHeight + 8;
        pdf.setFontSize(config.fontSize.small);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(config.colors.text.medium[0], config.colors.text.medium[1], config.colors.text.medium[2]);

        var depositAmount = (quoteData.total || 0) * (COMPANY_CONFIG.payment.depositPercentage / 100);
        var depositText = COMPANY_CONFIG.payment.depositPercentage + '% deposit: $' + PDFHelpers.formatCurrency(depositAmount);
        pdf.text(depositText, valueX, textY, { align: 'right' });
      }

      return summaryBox.y + boxHeight + 15;
    },

    /**
     * Render notes and terms section
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     * @param {number} startY - Starting Y position
     * @returns {number} New Y position
     */
    renderNotesAndTerms: function(pdf, quoteData, startY) {
      var config = PDF_CONFIG;
      var x = config.margin.left;
      var y = startY;

      // Special notes section (if any)
      if (quoteData.notes && quoteData.notes.trim()) {
        pdf.setFontSize(config.fontSize.subheading);
        pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SPECIAL NOTES', x, y);

        y += 6;
        pdf.setFontSize(config.fontSize.body);
        pdf.setFont('helvetica', 'normal');

        var noteLines = pdf.splitTextToSize(quoteData.notes, config.content.width);
        pdf.text(noteLines, x, y);

        y += (noteLines.length * 5) + 8;
      }

      // Terms and conditions
      pdf.setFontSize(config.fontSize.subheading);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TERMS & CONDITIONS', x, y);

      y += 6;
      pdf.setFontSize(config.fontSize.small);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(config.colors.text.medium[0], config.colors.text.medium[1], config.colors.text.medium[2]);

      var terms = quoteData.terms || COMPANY_CONFIG.terms.full;
      var termLines = pdf.splitTextToSize(terms, config.content.width);

      // Check if terms will fit on current page
      if (y + (termLines.length * 4) > config.page.height - 40) {
        pdf.addPage();
        y = config.margin.top;

        pdf.setFontSize(config.fontSize.subheading);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(config.colors.text.dark[0], config.colors.text.dark[1], config.colors.text.dark[2]);
        pdf.text('TERMS & CONDITIONS (continued)', x, y);

        y += 6;
        pdf.setFontSize(config.fontSize.small);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(config.colors.text.medium[0], config.colors.text.medium[1], config.colors.text.medium[2]);
      }

      pdf.text(termLines, x, y);

      return y + (termLines.length * 4) + 5;
    },

    /**
     * Render PDF footer on all pages
     * @param {object} pdf - jsPDF instance
     * @param {object} quoteData - Quote data object
     */
    renderFooter: function(pdf, quoteData) {
      var config = PDF_CONFIG;
      var company = COMPANY_CONFIG;
      var pageCount = pdf.internal.getNumberOfPages();

      for (var i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        var x = config.margin.left;
        var y = config.page.height - config.margin.bottom + 5;

        // Horizontal line
        pdf.setDrawColor(config.colors.border[0], config.colors.border[1], config.colors.border[2]);
        pdf.setLineWidth(0.5);
        pdf.line(x, y - 5, x + config.content.width, y - 5);

        // Footer text
        pdf.setFontSize(config.fontSize.tiny);
        pdf.setTextColor(config.colors.text.light[0], config.colors.text.light[1], config.colors.text.light[2]);
        pdf.setFont('helvetica', 'normal');

        // Left: ABN and credentials
        var footerLeft = 'ABN: ' + company.abn;
        if (company.credentials.fullyInsured) {
          footerLeft += ' | Fully Insured';
        }
        if (company.credentials.publicLiability) {
          footerLeft += ' | Public Liability ' + company.credentials.publicLiabilityAmount;
        }

        pdf.text(footerLeft, x, y);

        // Center: Website
        pdf.text(company.website, x + (config.content.width / 2), y, { align: 'center' });

        // Right: Page number
        pdf.text('Page ' + i + ' of ' + pageCount, x + config.content.width, y, { align: 'right' });

        // Disclaimer (on last page only)
        if (i === pageCount) {
          pdf.text(company.disclaimer, x + (config.content.width / 2), y + 4, { align: 'center' });
        }
      }
    }
  };

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('pdfComponents', PDFComponents);
  }

  // Make globally available
  window.PDFComponents = PDFComponents;

  console.log('[PDF-COMPONENTS] PDF component library initialized');
})();
