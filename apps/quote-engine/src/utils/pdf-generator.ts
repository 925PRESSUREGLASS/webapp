/**
 * PDF Generation Utility for Quotes, Invoices, and Job Receipts
 *
 * Uses html2pdf.js to convert HTML to PDF documents.
 * Provides generatePdfBase64() for email attachments.
 */

import type { Job, WindowLine, PressureLine } from '@tictacstick/calculation-engine';
import type { Invoice, InvoiceLineItem } from '../stores/invoices';

// We use dynamic import to avoid bundling issues
let html2pdf: typeof import('html2pdf.js').default | null = null;

/**
 * PDF generation options
 */
export interface PdfOptions {
  /** Include photos in the PDF (can make file larger) */
  includePhotos?: boolean;
  /** Image quality for photos (0-1) */
  imageQuality?: number;
  /** Paper format */
  format?: 'a4' | 'letter';
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Filename without extension */
  filename?: string;
}

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  includePhotos: true,
  imageQuality: 0.95,
  format: 'a4',
  orientation: 'portrait',
  filename: 'job-receipt',
};

/**
 * Load html2pdf.js dynamically
 */
async function loadHtml2Pdf(): Promise<typeof import('html2pdf.js').default> {
  if (html2pdf) {
    return html2pdf;
  }
  const module = await import('html2pdf.js');
  html2pdf = module.default;
  return html2pdf;
}

/**
 * Generate a PDF from an HTML element
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfOptions = {},
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lib = await loadHtml2Pdf();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfOptions: any = {
    margin: 10,
    filename: `${opts.filename}.pdf`,
    image: { type: 'jpeg', quality: opts.imageQuality },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: opts.format,
      orientation: opts.orientation,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  // Generate PDF as blob
  const pdfBlob = await lib()
    .set(pdfOptions)
    .from(element)
    .outputPdf('blob');

  return pdfBlob;
}

/**
 * Download a PDF from an HTML element
 */
export async function downloadPdfFromElement(
  element: HTMLElement,
  options: PdfOptions = {},
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lib = await loadHtml2Pdf();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfOptions: any = {
    margin: 10,
    filename: `${opts.filename}.pdf`,
    image: { type: 'jpeg', quality: opts.imageQuality },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: opts.format,
      orientation: opts.orientation,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await lib()
    .set(pdfOptions)
    .from(element)
    .save();
}

/**
 * Generate filename for a job receipt
 */
export function generateJobReceiptFilename(job: Job): string {
  const date = new Date().toISOString().split('T')[0];
  const clientName = job.client.name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  return `${job.jobNumber}_${clientName}_${date}`;
}

/**
 * Open PDF in new tab for preview/print
 */
export async function previewPdf(element: HTMLElement, options: PdfOptions = {}): Promise<void> {
  const blob = await generatePdfFromElement(element, options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Clean up after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Share PDF (using Web Share API if available)
 */
export async function sharePdf(
  element: HTMLElement,
  options: PdfOptions = {},
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const blob = await generatePdfFromElement(element, opts);
  const file = new File([blob], `${opts.filename}.pdf`, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: opts.filename,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[PDF] Share failed:', error);
      }
      return false;
    }
  }

  // Fallback: download
  downloadPdfFromElement(element, opts);
  return true;
}

// ============================================
// Quote PDF Generation
// ============================================

export interface QuoteData {
  id: string;
  title: string;
  clientName: string;
  clientLocation: string;
  clientEmail?: string;
  clientPhone?: string;
  jobType: 'residential' | 'commercial';
  windowLines: WindowLine[];
  pressureLines: PressureLine[];
  breakdown: {
    windows: number;
    pressure: number;
    highReach: number;
  };
  subtotal: number;
  gst: number;
  total: number;
  createdAt?: string;
}

/**
 * Generate HTML content for a quote PDF
 */
function generateQuoteHtml(quote: QuoteData): string {
  var date = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU');
  
  var windowRowsHtml = '';
  quote.windowLines.forEach(function(line, index) {
    windowRowsHtml += '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + line.count + 'x ' + (line.size || 'Standard') + ' windows' + (line.inside ? ' (Inside)' : '') + (line.outside ? ' (Outside)' : '') + (line.highReach ? ' [High Reach]' : '') + '</td>' +
      '<td style="text-align:right;">$' + (line.calculatedCost || 0).toFixed(2) + '</td>' +
      '</tr>';
  });
  
  var pressureRowsHtml = '';
  quote.pressureLines.forEach(function(line, index) {
    pressureRowsHtml += '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + (line.surfaceType || 'Surface') + ' - ' + (line.totalSqm || 0).toFixed(1) + ' sqm</td>' +
      '<td style="text-align:right;">$' + (line.calculatedCost || 0).toFixed(2) + '</td>' +
      '</tr>';
  });
  
  return '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: Arial, sans-serif; padding: 20px; color: #333; }' +
    '.header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 15px; margin-bottom: 20px; }' +
    '.header h1 { color: #1976d2; margin: 0; font-size: 24px; }' +
    '.header p { margin: 5px 0; color: #666; }' +
    '.section { margin-bottom: 20px; }' +
    '.section-title { font-size: 14px; font-weight: bold; color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }' +
    '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }' +
    '.info-item { margin-bottom: 5px; }' +
    '.info-label { font-weight: bold; color: #666; font-size: 12px; }' +
    '.info-value { font-size: 14px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 12px; }' +
    'th { background: #f5f5f5; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }' +
    'td { padding: 8px; border-bottom: 1px solid #eee; }' +
    '.totals { margin-top: 20px; text-align: right; }' +
    '.totals-row { display: flex; justify-content: flex-end; padding: 5px 0; }' +
    '.totals-label { width: 120px; font-weight: bold; color: #666; }' +
    '.totals-value { width: 100px; text-align: right; }' +
    '.grand-total { font-size: 18px; color: #1976d2; border-top: 2px solid #1976d2; padding-top: 10px; }' +
    '.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 11px; }' +
    '</style></head><body>' +
    '<div class="header">' +
    '<h1>925 Pressure Glass</h1>' +
    '<p>Professional Window & Pressure Cleaning</p>' +
    '</div>' +
    '<div class="section">' +
    '<div class="section-title">QUOTE #' + quote.id + '</div>' +
    '<div class="info-grid">' +
    '<div class="info-item"><span class="info-label">Client:</span> <span class="info-value">' + quote.clientName + '</span></div>' +
    '<div class="info-item"><span class="info-label">Date:</span> <span class="info-value">' + date + '</span></div>' +
    '<div class="info-item"><span class="info-label">Location:</span> <span class="info-value">' + quote.clientLocation + '</span></div>' +
    '<div class="info-item"><span class="info-label">Type:</span> <span class="info-value">' + quote.jobType + '</span></div>' +
    (quote.clientEmail ? '<div class="info-item"><span class="info-label">Email:</span> <span class="info-value">' + quote.clientEmail + '</span></div>' : '') +
    (quote.clientPhone ? '<div class="info-item"><span class="info-label">Phone:</span> <span class="info-value">' + quote.clientPhone + '</span></div>' : '') +
    '</div></div>' +
    (quote.windowLines.length > 0 ? 
      '<div class="section"><div class="section-title">Window Cleaning</div>' +
      '<table><thead><tr><th>#</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>' +
      '<tbody>' + windowRowsHtml + '</tbody></table></div>' : '') +
    (quote.pressureLines.length > 0 ?
      '<div class="section"><div class="section-title">Pressure Cleaning</div>' +
      '<table><thead><tr><th>#</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>' +
      '<tbody>' + pressureRowsHtml + '</tbody></table></div>' : '') +
    '<div class="totals">' +
    '<div class="totals-row"><span class="totals-label">Subtotal:</span><span class="totals-value">$' + quote.subtotal.toFixed(2) + '</span></div>' +
    '<div class="totals-row"><span class="totals-label">GST (10%):</span><span class="totals-value">$' + quote.gst.toFixed(2) + '</span></div>' +
    '<div class="totals-row grand-total"><span class="totals-label">Total:</span><span class="totals-value">$' + quote.total.toFixed(2) + '</span></div>' +
    '</div>' +
    '<div class="footer">' +
    '<p>This quote is valid for 30 days from the date above.</p>' +
    '<p>925 Pressure Glass | ABN: TBD | info@925pressureglass.com.au</p>' +
    '</div>' +
    '</body></html>';
}

/**
 * Generate a quote PDF as base64 string for email attachment
 */
export async function generateQuotePdfBase64(quote: QuoteData): Promise<string> {
  var html = generateQuoteHtml(quote);
  
  // Create temporary container
  var container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);
  
  try {
    var blob = await generatePdfFromElement(container, {
      filename: 'quote-' + quote.id,
      format: 'a4',
      orientation: 'portrait'
    });
    
    // Convert blob to base64
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function() {
        var result = reader.result as string;
        // Remove data URL prefix to get pure base64
        var base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate filename for a quote
 */
export function generateQuoteFilename(quote: QuoteData): string {
  var date = new Date().toISOString().split('T')[0];
  var clientName = quote.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  return 'Quote_' + quote.id + '_' + clientName + '_' + date;
}

// ============================================
// Invoice PDF Generation
// ============================================

/**
 * Generate HTML content for an invoice PDF
 */
function generateInvoiceHtml(invoice: Invoice): string {
  var invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-AU');
  var dueDate = new Date(invoice.dueDate).toLocaleDateString('en-AU');
  
  var lineItemsHtml = '';
  invoice.lineItems.forEach(function(item, index) {
    lineItemsHtml += '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + item.description + '</td>' +
      '<td style="text-align:center;">' + item.quantity + '</td>' +
      '<td style="text-align:right;">$' + item.unitPrice.toFixed(2) + '</td>' +
      '<td style="text-align:right;">$' + item.amount.toFixed(2) + '</td>' +
      '</tr>';
  });
  
  var statusColor = invoice.status === 'paid' ? '#4caf50' : 
                    invoice.status === 'overdue' ? '#f44336' : '#ff9800';
  
  return '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: Arial, sans-serif; padding: 20px; color: #333; }' +
    '.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1976d2; padding-bottom: 15px; margin-bottom: 20px; }' +
    '.logo { }' +
    '.logo h1 { color: #1976d2; margin: 0; font-size: 24px; }' +
    '.logo p { margin: 5px 0; color: #666; font-size: 12px; }' +
    '.invoice-info { text-align: right; }' +
    '.invoice-info h2 { margin: 0; font-size: 20px; color: #333; }' +
    '.invoice-info p { margin: 5px 0; font-size: 12px; }' +
    '.status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 11px; color: white; background: ' + statusColor + '; }' +
    '.section { margin-bottom: 20px; }' +
    '.section-title { font-size: 14px; font-weight: bold; color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }' +
    '.bill-to { background: #f9f9f9; padding: 15px; border-radius: 4px; }' +
    '.bill-to h3 { margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; }' +
    '.bill-to p { margin: 3px 0; font-size: 14px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 12px; }' +
    'th { background: #1976d2; color: white; padding: 10px 8px; text-align: left; }' +
    'td { padding: 10px 8px; border-bottom: 1px solid #eee; }' +
    'tbody tr:nth-child(even) { background: #f9f9f9; }' +
    '.totals { margin-top: 20px; margin-left: auto; width: 250px; }' +
    '.totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }' +
    '.totals-label { font-weight: bold; color: #666; }' +
    '.totals-value { }' +
    '.grand-total { font-size: 18px; color: #1976d2; border-top: 2px solid #1976d2; border-bottom: none; padding-top: 10px; }' +
    '.payment-info { margin-top: 30px; background: #f0f7ff; padding: 15px; border-radius: 4px; border-left: 4px solid #1976d2; }' +
    '.payment-info h3 { margin: 0 0 10px 0; font-size: 14px; color: #1976d2; }' +
    '.payment-info p { margin: 5px 0; font-size: 12px; }' +
    '.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 11px; }' +
    '</style></head><body>' +
    '<div class="header">' +
    '<div class="logo">' +
    '<h1>925 Pressure Glass</h1>' +
    '<p>Professional Window & Pressure Cleaning</p>' +
    '<p>ABN: TBD</p>' +
    '</div>' +
    '<div class="invoice-info">' +
    '<h2>INVOICE</h2>' +
    '<p><strong>#' + invoice.invoiceNumber + '</strong></p>' +
    '<p>Date: ' + invoiceDate + '</p>' +
    '<p>Due: ' + dueDate + '</p>' +
    '<p><span class="status-badge">' + invoice.status + '</span></p>' +
    '</div>' +
    '</div>' +
    '<div class="section">' +
    '<div class="bill-to">' +
    '<h3>Bill To</h3>' +
    '<p><strong>' + invoice.clientName + '</strong></p>' +
    '<p>' + invoice.clientLocation + '</p>' +
    (invoice.clientEmail ? '<p>' + invoice.clientEmail + '</p>' : '') +
    (invoice.clientPhone ? '<p>' + invoice.clientPhone + '</p>' : '') +
    '</div>' +
    '</div>' +
    '<div class="section">' +
    '<table>' +
    '<thead><tr><th>#</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Amount</th></tr></thead>' +
    '<tbody>' + lineItemsHtml + '</tbody>' +
    '</table>' +
    '</div>' +
    '<div class="totals">' +
    '<div class="totals-row"><span class="totals-label">Subtotal:</span><span class="totals-value">$' + invoice.subtotal.toFixed(2) + '</span></div>' +
    '<div class="totals-row"><span class="totals-label">GST (10%):</span><span class="totals-value">$' + invoice.gst.toFixed(2) + '</span></div>' +
    '<div class="totals-row grand-total"><span class="totals-label">Total Due:</span><span class="totals-value">$' + invoice.total.toFixed(2) + '</span></div>' +
    '</div>' +
    '<div class="payment-info">' +
    '<h3>Payment Details</h3>' +
    '<p><strong>Bank:</strong> 925 Pressure Glass</p>' +
    '<p><strong>BSB:</strong> TBD</p>' +
    '<p><strong>Account:</strong> TBD</p>' +
    '<p><strong>Reference:</strong> ' + invoice.invoiceNumber + '</p>' +
    '</div>' +
    '<div class="footer">' +
    '<p>Thank you for your business!</p>' +
    '<p>925 Pressure Glass | info@925pressureglass.com.au | www.925pressureglass.com.au</p>' +
    '</div>' +
    '</body></html>';
}

/**
 * Generate an invoice PDF as base64 string for email attachment
 */
export async function generateInvoicePdfBase64(invoice: Invoice): Promise<string> {
  var html = generateInvoiceHtml(invoice);
  
  // Create temporary container
  var container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);
  
  try {
    var blob = await generatePdfFromElement(container, {
      filename: 'invoice-' + invoice.invoiceNumber,
      format: 'a4',
      orientation: 'portrait'
    });
    
    // Convert blob to base64
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function() {
        var result = reader.result as string;
        // Remove data URL prefix to get pure base64
        var base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate filename for an invoice
 */
export function generateInvoiceFilename(invoice: Invoice): string {
  var date = new Date().toISOString().split('T')[0];
  var clientName = invoice.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  return 'Invoice_' + invoice.invoiceNumber + '_' + clientName + '_' + date;
}

/**
 * Download a quote PDF
 */
export async function downloadQuotePdf(quote: QuoteData): Promise<void> {
  var html = generateQuoteHtml(quote);
  
  var container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  document.body.appendChild(container);
  
  try {
    await downloadPdfFromElement(container, {
      filename: generateQuoteFilename(quote),
      format: 'a4',
      orientation: 'portrait'
    });
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Download an invoice PDF
 */
export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  var html = generateInvoiceHtml(invoice);
  
  var container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  document.body.appendChild(container);
  
  try {
    await downloadPdfFromElement(container, {
      filename: generateInvoiceFilename(invoice),
      format: 'a4',
      orientation: 'portrait'
    });
  } finally {
    document.body.removeChild(container);
  }
}

// ============================================
// Job Receipt PDF Generation (for email)
// ============================================

/**
 * Generate HTML content for a job receipt/completion summary
 */
function generateJobReceiptHtml(job: Job): string {
  var completedDate = job.schedule.actualEndTime 
    ? new Date(job.schedule.actualEndTime).toLocaleDateString('en-AU')
    : new Date().toLocaleDateString('en-AU');
  var completedTime = job.schedule.actualEndTime
    ? new Date(job.schedule.actualEndTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : '';
  
  // Calculate duration
  var duration = '';
  if (job.schedule.actualStartTime && job.schedule.actualEndTime) {
    var startMs = new Date(job.schedule.actualStartTime).getTime();
    var endMs = new Date(job.schedule.actualEndTime).getTime();
    var durationMs = endMs - startMs;
    var hours = Math.floor(durationMs / (1000 * 60 * 60));
    var minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    duration = hours > 0 ? hours + 'h ' + minutes + 'm' : minutes + ' minutes';
  }
  
  // Build items table
  var itemsHtml = '';
  job.items.forEach(function(item, index) {
    var statusIcon = item.completed ? '✓' : '○';
    var statusColor = item.completed ? '#2e7d32' : '#757575';
    itemsHtml += '<tr>' +
      '<td style="color:' + statusColor + ';font-weight:bold;">' + statusIcon + '</td>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + (item.description || 'Item') + '</td>' +
      '<td style="text-align:right;">$' + (item.adjustedPrice || item.originalPrice || 0).toFixed(2) + '</td>' +
      '</tr>';
  });
  
  // Build notes section
  var notesHtml = '';
  if (job.notes && job.notes.length > 0) {
    notesHtml = '<div style="margin-top:20px;">' +
      '<h3 style="color:#1565c0;margin-bottom:10px;">Job Notes</h3>' +
      '<ul style="margin:0;padding-left:20px;">';
    job.notes.forEach(function(note) {
      var noteDate = new Date(note.createdAt).toLocaleString('en-AU');
      notesHtml += '<li style="margin-bottom:8px;"><span style="color:#666;font-size:0.9em;">' + noteDate + '</span><br/>' + note.text + '</li>';
    });
    notesHtml += '</ul></div>';
  }
  
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"><style>' +
    'body { font-family: Arial, sans-serif; padding: 20px; color: #333; }' +
    '.header { text-align: center; border-bottom: 2px solid #1565c0; padding-bottom: 20px; margin-bottom: 20px; }' +
    '.header h1 { color: #1565c0; margin: 0 0 10px 0; }' +
    '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }' +
    '.info-box { background: #f5f5f5; padding: 15px; border-radius: 8px; }' +
    '.info-box h3 { margin: 0 0 10px 0; color: #1565c0; }' +
    '.info-box p { margin: 5px 0; }' +
    '.completed-badge { background: #2e7d32; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 20px; }' +
    'th { background: #1565c0; color: white; padding: 12px; text-align: left; }' +
    'td { padding: 10px; border-bottom: 1px solid #ddd; }' +
    '.totals { margin-top: 20px; text-align: right; }' +
    '.totals .row { display: flex; justify-content: flex-end; gap: 20px; padding: 5px 0; }' +
    '.totals .total { font-size: 1.2em; font-weight: bold; color: #1565c0; border-top: 2px solid #1565c0; padding-top: 10px; margin-top: 10px; }' +
    '.footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.9em; border-top: 1px solid #ddd; padding-top: 20px; }' +
    '</style></head><body>' +
    '<div class="header">' +
    '<h1>Job Completion Summary</h1>' +
    '<p><strong>' + job.jobNumber + '</strong></p>' +
    '<span class="completed-badge">✓ COMPLETED</span>' +
    '</div>' +
    '<div class="info-grid">' +
    '<div class="info-box">' +
    '<h3>Client Details</h3>' +
    '<p><strong>' + job.client.name + '</strong></p>' +
    '<p>' + (job.client.address || 'No address on file') + '</p>' +
    (job.client.phone ? '<p>📞 ' + job.client.phone + '</p>' : '') +
    (job.client.email ? '<p>✉️ ' + job.client.email + '</p>' : '') +
    '</div>' +
    '<div class="info-box">' +
    '<h3>Job Details</h3>' +
    '<p><strong>Completed:</strong> ' + completedDate + (completedTime ? ' at ' + completedTime : '') + '</p>' +
    (duration ? '<p><strong>Duration:</strong> ' + duration + '</p>' : '') +
    '<p><strong>Type:</strong> ' + (job.jobType === 'commercial' ? 'Commercial' : 'Residential') + '</p>' +
    '</div>' +
    '</div>' +
    '<h3 style="color:#1565c0;">Work Completed</h3>' +
    '<table>' +
    '<thead><tr><th style="width:30px;"></th><th style="width:30px;">#</th><th>Description</th><th style="width:100px;text-align:right;">Amount</th></tr></thead>' +
    '<tbody>' + itemsHtml + '</tbody>' +
    '</table>' +
    '<div class="totals">' +
    '<div class="row"><span>Subtotal:</span><span>$' + job.pricing.actualSubtotal.toFixed(2) + '</span></div>' +
    '<div class="row"><span>GST (10%):</span><span>$' + job.pricing.actualGst.toFixed(2) + '</span></div>' +
    '<div class="row total"><span>Total:</span><span>$' + job.pricing.actualTotal.toFixed(2) + '</span></div>' +
    '</div>' +
    notesHtml +
    '<div class="footer">' +
    '<p>Thank you for choosing our services!</p>' +
    '<p>If you have any questions about this work, please contact us.</p>' +
    '</div>' +
    '</body></html>';
}

/**
 * Generate job receipt PDF as base64 for email attachment
 */
export async function generateJobReceiptPdfBase64(job: Job): Promise<string> {
  var html = generateJobReceiptHtml(job);
  
  var container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  document.body.appendChild(container);
  
  try {
    var blob = await generatePdfFromElement(container, {
      format: 'a4',
      orientation: 'portrait'
    });
    
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function() {
        var result = reader.result as string;
        var base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } finally {
    document.body.removeChild(container);
  }
}
