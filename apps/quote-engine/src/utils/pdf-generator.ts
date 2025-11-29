/**
 * PDF Generation Utility for Job Receipts
 *
 * Uses html2pdf.js to convert Vue components to PDF documents.
 */

import type { Job } from '@tictacstick/calculation-engine';

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
