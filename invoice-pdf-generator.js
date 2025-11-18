// invoice-pdf-generator.js - Generate PDF invoices and receipts
// Dependencies: invoice-manager.js, payment-config.js, pdf-components.js (if available)
// iOS Safari 12+ compatible (ES5 syntax only)

(function() {
  'use strict';

  /**
   * Generate invoice PDF
   * Uses jsPDF library if available
   */
  function generateInvoicePDF(invoice) {
    // Check if jsPDF is available
    if (typeof jsPDF === 'undefined') {
      console.error('[INVOICE-PDF] jsPDF library not loaded');
      return null;
    }

    var doc = new jsPDF();
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 20;
    var yPos = 20;

    // Get company config
    var companyName = '925 Pressure Glass';
    var companyPhone = '(08) 9XXX XXXX';
    var companyEmail = 'info@925pressureglass.com.au';
    var companyABN = '';
    var companyAddress = 'Perth, Western Australia';

    // Try to get from global config if available
    if (window.COMPANY_CONFIG) {
      companyName = window.COMPANY_CONFIG.name || companyName;
      companyPhone = window.COMPANY_CONFIG.phone || companyPhone;
      companyEmail = window.COMPANY_CONFIG.email || companyEmail;
      companyABN = window.COMPANY_CONFIG.abn || companyABN;
      companyAddress = window.COMPANY_CONFIG.address || companyAddress;
    }

    var paymentConfig = window.PaymentConfig.getConfig();

    // Company header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, margin, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Professional Window Cleaning & Pressure Washing', margin, yPos);

    // Company details (right side)
    var rightX = pageWidth - margin;
    yPos = 20;
    doc.setFontSize(10);
    doc.text(companyPhone, rightX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(companyEmail, rightX, yPos, { align: 'right' });
    yPos += 5;
    if (paymentConfig.invoice.showABN && companyABN) {
      doc.text('ABN: ' + companyABN, rightX, yPos, { align: 'right' });
    }

    // Invoice title
    yPos = 50;
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('TAX INVOICE', margin, yPos);

    // Status badge
    var statusColor = getStatusColor(invoice.status);
    doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    doc.rect(margin + 55, yPos - 5, 30, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.status.toUpperCase(), margin + 70, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Invoice details
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Invoice #: ' + invoice.invoiceNumber, margin, yPos);
    yPos += 6;
    doc.text('Date: ' + formatDate(invoice.dateIssued || invoice.dateCreated), margin, yPos);
    yPos += 6;
    if (invoice.dateDue) {
      doc.text('Due Date: ' + formatDate(invoice.dateDue), margin, yPos);
      yPos += 6;
    }
    if (invoice.type !== 'full') {
      doc.text('Type: ' + invoice.type.toUpperCase(), margin, yPos);
      yPos += 6;
    }

    // Bill to section
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('BILL TO:', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');

    if (invoice.client.name) {
      doc.text(invoice.client.name, margin, yPos);
      yPos += 5;
    }

    if (invoice.client.address) {
      var address = formatAddressMultiline(invoice.client.address);
      for (var i = 0; i < address.length; i++) {
        doc.text(address[i], margin, yPos);
        yPos += 5;
      }
    }

    if (invoice.client.email) {
      doc.text(invoice.client.email, margin, yPos);
      yPos += 5;
    }

    if (invoice.client.phone) {
      doc.text(invoice.client.phone, margin, yPos);
      yPos += 5;
    }

    // Line items table
    yPos += 10;

    // Table headers
    doc.setFont(undefined, 'bold');
    doc.setFillColor(37, 99, 235); // Blue background
    doc.setTextColor(255, 255, 255); // White text
    doc.rect(margin, yPos - 5, pageWidth - (2 * margin), 8, 'F');

    doc.text('Description', margin + 2, yPos);
    doc.text('Qty', pageWidth - 80, yPos, { align: 'right' });
    doc.text('Price', pageWidth - 50, yPos, { align: 'right' });
    doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });

    yPos += 10;
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont(undefined, 'normal');

    // Line items
    if (invoice.items && invoice.items.length > 0) {
      for (var i = 0; i < invoice.items.length; i++) {
        var item = invoice.items[i];

        // Check if we need a new page
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }

        var description = item.description || item.name || 'Service';
        var quantity = item.quantity || 1;
        var unitPrice = item.unitPrice || item.price || 0;
        var total = item.total || (quantity * unitPrice);

        // Wrap long descriptions
        var maxWidth = pageWidth - 100;
        var splitDesc = doc.splitTextToSize(description, maxWidth);

        for (var j = 0; j < splitDesc.length; j++) {
          if (j === 0) {
            // First line - include all data
            doc.text(splitDesc[j], margin + 2, yPos);
            doc.text(String(quantity), pageWidth - 80, yPos, { align: 'right' });
            doc.text('$' + unitPrice.toFixed(2), pageWidth - 50, yPos, { align: 'right' });
            doc.text('$' + total.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });
          } else {
            // Continuation lines - just description
            doc.text(splitDesc[j], margin + 2, yPos);
          }
          yPos += 5;
        }

        yPos += 2; // Extra spacing between items
      }
    } else {
      doc.text('No line items', margin + 2, yPos);
      yPos += 7;
    }

    // Totals section
    yPos += 10;
    var totalsX = pageWidth - 70;

    // Subtotal
    doc.text('Subtotal:', totalsX, yPos);
    doc.text('$' + invoice.subtotal.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 7;

    // GST
    if (paymentConfig.invoice.showGST) {
      doc.text('GST (10%):', totalsX, yPos);
      doc.text('$' + invoice.gst.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 7;
    }

    // Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text('$' + invoice.total.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });

    // Amount paid (if any)
    if (invoice.amountPaid > 0) {
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('Amount Paid:', totalsX, yPos);
      doc.text('$' + invoice.amountPaid.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });

      // Amount due
      yPos += 7;
      doc.setFont(undefined, 'bold');
      var dueColor = invoice.amountDue > 0 ? [239, 68, 68] : [16, 185, 129]; // Red or green
      doc.setTextColor(dueColor[0], dueColor[1], dueColor[2]);
      doc.text('Amount Due:', totalsX, yPos);
      doc.text('$' + invoice.amountDue.toFixed(2), pageWidth - margin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    // Notes section
    yPos += 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    if (invoice.notes) {
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', margin, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      var splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - (2 * margin));
      doc.text(splitNotes, margin, yPos);
      yPos += (splitNotes.length * 5) + 5;
    }

    // Payment details (if unpaid)
    if (paymentConfig.invoice.showBankDetails && invoice.status !== 'paid' && invoice.amountDue > 0) {
      yPos += 5;
      doc.setFont(undefined, 'bold');
      doc.text('Payment Details:', margin, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');

      var bank = paymentConfig.invoice.bankDetails;
      if (bank.accountName) {
        doc.text('Account Name: ' + bank.accountName, margin, yPos);
        yPos += 5;
      }
      if (bank.bsb) {
        doc.text('BSB: ' + bank.bsb, margin, yPos);
        yPos += 5;
      }
      if (bank.accountNumber) {
        doc.text('Account: ' + bank.accountNumber, margin, yPos);
        yPos += 5;
      }
      doc.text('Reference: ' + invoice.invoiceNumber, margin, yPos);
      yPos += 5;
    }

    // Footer
    var footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

    return doc;
  }

  /**
   * Get status color
   */
  function getStatusColor(status) {
    var colors = {
      'draft': { r: 107, g: 114, b: 128 },       // Gray
      'sent': { r: 59, g: 130, b: 246 },         // Blue
      'paid': { r: 16, g: 185, b: 129 },         // Green
      'overdue': { r: 239, g: 68, b: 68 },       // Red
      'cancelled': { r: 107, g: 114, b: 128 },   // Gray
      'partially-paid': { r: 245, g: 158, b: 11 } // Orange
    };

    return colors[status] || colors.draft;
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format address for multiline display
   */
  function formatAddressMultiline(address) {
    if (typeof address === 'string') {
      return [address];
    }

    var lines = [];
    if (address.street) lines.push(address.street);

    var cityLine = [];
    if (address.city) cityLine.push(address.city);
    if (address.state) cityLine.push(address.state);
    if (address.postcode) cityLine.push(address.postcode);
    if (cityLine.length > 0) lines.push(cityLine.join(' '));

    if (address.country && address.country !== 'Australia') {
      lines.push(address.country);
    }

    return lines.length > 0 ? lines : [address.toString()];
  }

  /**
   * Download invoice PDF
   */
  function downloadInvoice(invoice) {
    var doc = generateInvoicePDF(invoice);
    if (!doc) {
      console.error('[INVOICE-PDF] Failed to generate PDF');
      return false;
    }

    var filename = 'Invoice-' + invoice.invoiceNumber + '.pdf';
    doc.save(filename);

    console.log('[INVOICE-PDF] Invoice PDF downloaded:', filename);
    return true;
  }

  /**
   * Email invoice PDF (would integrate with email system)
   */
  function emailInvoice(invoice, callback) {
    var doc = generateInvoicePDF(invoice);
    if (!doc) {
      if (callback) callback(new Error('Failed to generate PDF'));
      return;
    }

    // Convert to base64
    var pdfBase64 = doc.output('datauristring');

    console.log('[INVOICE-PDF] Invoice PDF ready for email:', invoice.invoiceNumber);

    // Would integrate with email system here
    if (callback) callback(null, pdfBase64);
  }

  /**
   * Generate receipt PDF
   */
  function generateReceiptPDF(receipt, invoice) {
    if (typeof jsPDF === 'undefined') {
      console.error('[INVOICE-PDF] jsPDF library not loaded');
      return null;
    }

    var doc = new jsPDF();
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 20;
    var yPos = 20;

    var companyName = '925 Pressure Glass';

    // Company header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, margin, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Professional Window Cleaning & Pressure Washing', margin, yPos);

    // Receipt title
    yPos = 50;
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('RECEIPT', margin, yPos);

    // Receipt details
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Receipt #: ' + receipt.receiptNumber, margin, yPos);
    yPos += 6;
    doc.text('Date: ' + formatDate(receipt.dateIssued), margin, yPos);
    yPos += 6;
    doc.text('Invoice #: ' + receipt.invoiceNumber, margin, yPos);

    // Client info
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('RECEIVED FROM:', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(invoice.client.name || 'Customer', margin, yPos);

    // Payment details box
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT DETAILS:', margin, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');

    var payment = receipt.payment;

    // Amount (highlighted)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Amount Paid: $' + payment.amount.toFixed(2), margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Payment Method: ' + payment.method, margin, yPos);
    yPos += 6;

    if (payment.reference) {
      doc.text('Reference: ' + payment.reference, margin, yPos);
      yPos += 6;
    }

    if (payment.transactionId) {
      doc.text('Transaction ID: ' + payment.transactionId, margin, yPos);
      yPos += 6;
    }

    doc.text('Date: ' + formatDate(payment.date), margin, yPos);

    // Thank you message
    yPos += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });

    // Footer
    var footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('925 Pressure Glass - Perth, Western Australia', pageWidth / 2, footerY, { align: 'center' });

    return doc;
  }

  /**
   * Download receipt PDF
   */
  function downloadReceipt(receipt, invoice) {
    var doc = generateReceiptPDF(receipt, invoice);
    if (!doc) {
      console.error('[INVOICE-PDF] Failed to generate receipt PDF');
      return false;
    }

    var filename = 'Receipt-' + receipt.receiptNumber + '.pdf';
    doc.save(filename);

    console.log('[INVOICE-PDF] Receipt PDF downloaded:', filename);
    return true;
  }

  // Public API
  var InvoicePDFGenerator = {
    generateInvoicePDF: generateInvoicePDF,
    downloadInvoice: downloadInvoice,
    emailInvoice: emailInvoice,
    generateReceiptPDF: generateReceiptPDF,
    downloadReceipt: downloadReceipt
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('invoicePDFGenerator', InvoicePDFGenerator);
  }

  // Make globally available
  window.InvoicePDFGenerator = InvoicePDFGenerator;

  console.log('[INVOICE-PDF] Module loaded');
})();
