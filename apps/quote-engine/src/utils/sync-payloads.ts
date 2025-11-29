import type { PricingConfig, Job } from '@tictacstick/calculation-engine';
import type { SavedQuote } from '../composables/useStorage';
import type { Invoice } from '../stores/invoices';

interface QuoteSyncSource {
  id: string;
  title?: string;
  clientName: string;
  clientLocation?: string;
  clientEmail?: string;
  clientPhone?: string;
  jobType?: 'residential' | 'commercial';
  windowLines: any[];
  pressureLines: any[];
  subtotal: number;
  gst: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildQuoteSyncPayload(source: QuoteSyncSource) {
  return {
    localId: source.id,
    quoteNumber: source.title || source.id,
    status: source.status || 'draft',
    clientName: source.clientName || 'Unknown Client',
    clientEmail: source.clientEmail || '',
    clientPhone: source.clientPhone || '',
    clientAddress: source.clientLocation || '',
    lineItems: [
      { type: 'window', items: source.windowLines || [] },
      { type: 'pressure', items: source.pressureLines || [] },
    ],
    subtotal: source.subtotal,
    gstAmount: source.gst,
    total: source.total,
    frequency: source.jobType || 'residential',
    notes: source.title || undefined,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt || new Date().toISOString(),
  };
}

export function mapCloudQuoteToSavedQuote(
  cloudQuote: any,
  pricingConfig: PricingConfig
): SavedQuote | null {
  if (!cloudQuote) return null;

  const id = cloudQuote.localId || cloudQuote.id;
  if (!id) return null;

  const lineItems = Array.isArray(cloudQuote.lineItems) ? cloudQuote.lineItems : [];
  let windowLines: any[] = [];
  let pressureLines: any[] = [];

  for (const item of lineItems) {
    if (item && item.type === 'window' && Array.isArray(item.items)) {
      windowLines = item.items;
    } else if (item && item.type === 'pressure' && Array.isArray(item.items)) {
      pressureLines = item.items;
    }
  }

  if (windowLines.length === 0 && Array.isArray(cloudQuote.windowLines)) {
    windowLines = cloudQuote.windowLines;
  }
  if (pressureLines.length === 0 && Array.isArray(cloudQuote.pressureLines)) {
    pressureLines = cloudQuote.pressureLines;
  }
  if (windowLines.length === 0 && pressureLines.length === 0 && lineItems.length > 0) {
    windowLines = lineItems;
  }

  const subtotal = Number(cloudQuote.subtotal) || 0;
  const gst = Number(cloudQuote.gstAmount !== undefined ? cloudQuote.gstAmount : cloudQuote.gst) || 0;
  const total = Number(cloudQuote.total) || subtotal + gst;

  return {
    id,
    title: cloudQuote.quoteTitle || cloudQuote.title || cloudQuote.quoteNumber || 'Synced Quote',
    clientName: cloudQuote.clientName || 'Unknown Client',
    clientLocation: cloudQuote.clientAddress || '',
    clientEmail: cloudQuote.clientEmail || '',
    clientPhone: cloudQuote.clientPhone || '',
    jobType: cloudQuote.jobType || 'residential',
    windowLines,
    pressureLines,
    pricingConfig: cloneValue(pricingConfig),
    subtotal,
    gst,
    total,
    estimatedMinutes: cloudQuote.estimatedDuration || cloudQuote.estimatedMinutes || 0,
    createdAt: cloudQuote.createdAt || cloudQuote.syncedAt || new Date().toISOString(),
    updatedAt: cloudQuote.updatedAt || cloudQuote.syncedAt || new Date().toISOString(),
    status: cloudQuote.status || 'draft',
  };
}

export function buildJobSyncPayload(job: Job) {
  return {
    localId: job.id,
    jobNumber: job.jobNumber,
    status: job.status,
    clientName: job.client.name,
    clientEmail: job.client.email,
    clientPhone: job.client.phone,
    clientAddress: job.client.address,
    scheduledDate: job.schedule.scheduledDate,
    scheduledTime: job.schedule.scheduledTime,
    estimatedDuration: job.schedule.estimatedDuration,
    actualStartTime: job.schedule.actualStartTime,
    actualEndTime: job.schedule.actualEndTime,
    actualDuration: job.schedule.actualDuration,
    items: job.items,
    estimatedSubtotal: job.pricing.estimatedSubtotal,
    estimatedGst: job.pricing.estimatedGst,
    estimatedTotal: job.pricing.estimatedTotal,
    actualSubtotal: job.pricing.actualSubtotal,
    actualGst: job.pricing.actualGst,
    actualTotal: job.pricing.actualTotal,
    adjustmentReason: job.pricing.adjustmentReason,
    photos: job.photos,
    notes: job.notes,
    issues: job.issues,
    completedAt: job.completion?.completedAt,
    signature: job.completion?.clientSignature,
    signedByName: job.completion?.clientName,
    rating: job.completion?.rating,
    feedback: job.completion?.feedback,
    quoteId: job.quoteId,
    clientId: job.client.id || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function buildInvoiceSyncPayload(invoice: Invoice) {
  return {
    localId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail || '',
    clientPhone: invoice.clientPhone || '',
    clientAddress: invoice.clientLocation || '',
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    gstAmount: invoice.gst,
    total: invoice.total,
    dueDate: invoice.dueDate,
    paidAt: invoice.balance <= 0 ? invoice.updatedAt : undefined,
    paidAmount: invoice.amountPaid,
    paymentMethod: invoice.payments[0]?.method,
    paymentRef: invoice.payments[0]?.reference,
    notes: invoice.internalNotes || invoice.notes || invoice.clientNotes,
    quoteId: invoice.quoteId,
    jobId: invoice.jobId,
    clientId: invoice.clientId,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}
