import { getPrismaClient } from '../db/client';
import { Prisma } from '@prisma/client';

const prisma = getPrismaClient()!;

/**
 * Sync Service
 * Handles synchronization of quotes, jobs, invoices, and clients between PWA and cloud
 */

// Types for sync payloads
interface SyncQuotePayload {
  localId: string;
  quoteNumber: string;
  status?: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  lineItems: unknown[];
  subtotal: number;
  gstAmount: number;
  total: number;
  discount?: number | null;
  discountType?: string | null;
  frequency?: string | null;
  notes?: string | null;
  validUntil?: string | null;
  clientId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface SyncJobPayload {
  localId: string;
  jobNumber: string;
  status?: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  scheduledDate: string;
  scheduledTime?: string | null;
  estimatedDuration?: number | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  actualDuration?: number | null;
  items: unknown[];
  estimatedSubtotal: number;
  estimatedGst: number;
  estimatedTotal: number;
  actualSubtotal?: number | null;
  actualGst?: number | null;
  actualTotal?: number | null;
  adjustmentReason?: string | null;
  photos?: unknown[];
  notes?: unknown[];
  issues?: unknown[];
  completedAt?: string | null;
  signature?: string | null;
  signedByName?: string | null;
  rating?: number | null;
  feedback?: string | null;
  quoteId?: string | null;
  clientId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface SyncClientPayload {
  localId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  suburb?: string | null;
  postcode?: string | null;
  state?: string | null;
  notes?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SyncInvoicePayload {
  localId: string;
  invoiceNumber: string;
  status?: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  lineItems: unknown[];
  subtotal: number;
  gstAmount: number;
  total: number;
  dueDate?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  notes?: string | null;
  terms?: string | null;
  quoteId?: string | null;
  jobId?: string | null;
  clientId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// Quote Sync
// ========================================

export async function syncQuote(
  userId: string,
  organizationId: string | null,
  payload: SyncQuotePayload
) {
  // Check if quote already exists by localId
  const existing = await prisma.quote.findFirst({
    where: {
      localId: payload.localId,
      userId,
    },
  });

  const quoteData = {
    quoteNumber: payload.quoteNumber,
    status: (payload.status as 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted') || 'draft',
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    clientPhone: payload.clientPhone,
    clientAddress: payload.clientAddress,
    lineItems: payload.lineItems as Prisma.JsonValue,
    subtotal: payload.subtotal,
    gstAmount: payload.gstAmount,
    total: payload.total,
    discount: payload.discount,
    discountType: payload.discountType,
    frequency: payload.frequency,
    notes: payload.notes,
    validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
    clientId: payload.clientId,
    syncedAt: new Date(),
  };

  if (existing) {
    // Update existing quote
    return prisma.quote.update({
      where: { id: existing.id },
      data: quoteData,
    });
  } else {
    // Create new quote
    return prisma.quote.create({
      data: {
        ...quoteData,
        localId: payload.localId,
        userId,
        organizationId,
      },
    });
  }
}

export async function getQuotes(userId: string, organizationId: string | null, since?: Date) {
  const where: Prisma.QuoteWhereInput = {
    OR: [
      { userId },
      ...(organizationId ? [{ organizationId }] : []),
    ],
  };

  if (since) {
    where.updatedAt = { gte: since };
  }

  return prisma.quote.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function deleteQuote(userId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId },
  });

  if (!quote) {
    throw new Error('Quote not found or access denied');
  }

  return prisma.quote.delete({ where: { id: quoteId } });
}

// ========================================
// Job Sync
// ========================================

export async function syncJob(
  userId: string,
  organizationId: string | null,
  payload: SyncJobPayload
) {
  const existing = await prisma.job.findFirst({
    where: {
      localId: payload.localId,
      userId,
    },
  });

  const jobData = {
    jobNumber: payload.jobNumber,
    status: (payload.status as 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'invoiced' | 'cancelled') || 'scheduled',
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    clientPhone: payload.clientPhone,
    clientAddress: payload.clientAddress,
    scheduledDate: new Date(payload.scheduledDate),
    scheduledTime: payload.scheduledTime,
    estimatedDuration: payload.estimatedDuration,
    actualStartTime: payload.actualStartTime ? new Date(payload.actualStartTime) : null,
    actualEndTime: payload.actualEndTime ? new Date(payload.actualEndTime) : null,
    actualDuration: payload.actualDuration,
    items: payload.items as Prisma.JsonValue,
    estimatedSubtotal: payload.estimatedSubtotal,
    estimatedGst: payload.estimatedGst,
    estimatedTotal: payload.estimatedTotal,
    actualSubtotal: payload.actualSubtotal,
    actualGst: payload.actualGst,
    actualTotal: payload.actualTotal,
    adjustmentReason: payload.adjustmentReason,
    photos: (payload.photos || []) as Prisma.JsonValue,
    notes: (payload.notes || []) as Prisma.JsonValue,
    issues: (payload.issues || []) as Prisma.JsonValue,
    completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    signature: payload.signature,
    signedByName: payload.signedByName,
    rating: payload.rating,
    feedback: payload.feedback,
    quoteId: payload.quoteId,
    clientId: payload.clientId,
    syncedAt: new Date(),
  };

  if (existing) {
    return prisma.job.update({
      where: { id: existing.id },
      data: jobData,
    });
  } else {
    return prisma.job.create({
      data: {
        ...jobData,
        localId: payload.localId,
        userId,
        organizationId,
      },
    });
  }
}

export async function getJobs(userId: string, organizationId: string | null, since?: Date) {
  const where: Prisma.JobWhereInput = {
    OR: [
      { userId },
      ...(organizationId ? [{ organizationId }] : []),
    ],
  };

  if (since) {
    where.updatedAt = { gte: since };
  }

  return prisma.job.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function deleteJob(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error('Job not found or access denied');
  }

  return prisma.job.delete({ where: { id: jobId } });
}

// ========================================
// Client Sync
// ========================================

export async function syncClient(
  userId: string,
  organizationId: string | null,
  payload: SyncClientPayload
) {
  // For clients, check by name + organizationId (or userId for personal clients)
  const existing = await prisma.client.findFirst({
    where: {
      OR: [
        { id: payload.localId },
        {
          name: payload.name,
          organizationId: organizationId || undefined,
        },
      ],
    },
  });

  const clientData = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    suburb: payload.suburb,
    postcode: payload.postcode,
    state: payload.state,
    notes: payload.notes,
    tags: payload.tags || [],
  };

  if (existing) {
    return prisma.client.update({
      where: { id: existing.id },
      data: clientData,
    });
  } else {
    return prisma.client.create({
      data: {
        ...clientData,
        organizationId,
      },
    });
  }
}

export async function getClients(userId: string, organizationId: string | null, since?: Date) {
  const where: Prisma.ClientWhereInput = organizationId
    ? { organizationId }
    : {};

  if (since) {
    where.updatedAt = { gte: since };
  }

  return prisma.client.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 500,
  });
}

export async function deleteClient(organizationId: string | null, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organizationId || undefined },
  });

  if (!client) {
    throw new Error('Client not found or access denied');
  }

  return prisma.client.delete({ where: { id: clientId } });
}

// ========================================
// Invoice Sync
// ========================================

export async function syncInvoice(
  userId: string,
  organizationId: string | null,
  payload: SyncInvoicePayload
) {
  const existing = await prisma.invoice.findFirst({
    where: {
      localId: payload.localId,
      userId,
    },
  });

  const invoiceData = {
    invoiceNumber: payload.invoiceNumber,
    status: (payload.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded') || 'draft',
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    clientPhone: payload.clientPhone,
    clientAddress: payload.clientAddress,
    lineItems: payload.lineItems as Prisma.JsonValue,
    subtotal: payload.subtotal,
    gstAmount: payload.gstAmount,
    total: payload.total,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    paidAt: payload.paidAt ? new Date(payload.paidAt) : null,
    paidAmount: payload.paidAmount,
    paymentMethod: payload.paymentMethod,
    paymentRef: payload.paymentRef,
    notes: payload.notes,
    terms: payload.terms,
    quoteId: payload.quoteId,
    jobId: payload.jobId,
    clientId: payload.clientId,
    syncedAt: new Date(),
  };

  if (existing) {
    return prisma.invoice.update({
      where: { id: existing.id },
      data: invoiceData,
    });
  } else {
    return prisma.invoice.create({
      data: {
        ...invoiceData,
        localId: payload.localId,
        userId,
        organizationId,
      },
    });
  }
}

export async function getInvoices(userId: string, organizationId: string | null, since?: Date) {
  const where: Prisma.InvoiceWhereInput = {
    OR: [
      { userId },
      ...(organizationId ? [{ organizationId }] : []),
    ],
  };

  if (since) {
    where.updatedAt = { gte: since };
  }

  return prisma.invoice.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    throw new Error('Invoice not found or access denied');
  }

  return prisma.invoice.delete({ where: { id: invoiceId } });
}

// ========================================
// Bulk Sync
// ========================================

interface BulkSyncPayload {
  quotes?: SyncQuotePayload[];
  jobs?: SyncJobPayload[];
  clients?: SyncClientPayload[];
  invoices?: SyncInvoicePayload[];
}

interface BulkSyncResult {
  quotes: { synced: number; errors: string[] };
  jobs: { synced: number; errors: string[] };
  clients: { synced: number; errors: string[] };
  invoices: { synced: number; errors: string[] };
}

export async function bulkSync(
  userId: string,
  organizationId: string | null,
  payload: BulkSyncPayload
): Promise<BulkSyncResult> {
  const result: BulkSyncResult = {
    quotes: { synced: 0, errors: [] },
    jobs: { synced: 0, errors: [] },
    clients: { synced: 0, errors: [] },
    invoices: { synced: 0, errors: [] },
  };

  // Sync clients first (they're referenced by other entities)
  if (payload.clients) {
    for (const client of payload.clients) {
      try {
        await syncClient(userId, organizationId, client);
        result.clients.synced++;
      } catch (err) {
        result.clients.errors.push(`Client ${client.name}: ${(err as Error).message}`);
      }
    }
  }

  // Sync quotes
  if (payload.quotes) {
    for (const quote of payload.quotes) {
      try {
        await syncQuote(userId, organizationId, quote);
        result.quotes.synced++;
      } catch (err) {
        result.quotes.errors.push(`Quote ${quote.quoteNumber}: ${(err as Error).message}`);
      }
    }
  }

  // Sync jobs
  if (payload.jobs) {
    for (const job of payload.jobs) {
      try {
        await syncJob(userId, organizationId, job);
        result.jobs.synced++;
      } catch (err) {
        result.jobs.errors.push(`Job ${job.jobNumber}: ${(err as Error).message}`);
      }
    }
  }

  // Sync invoices
  if (payload.invoices) {
    for (const invoice of payload.invoices) {
      try {
        await syncInvoice(userId, organizationId, invoice);
        result.invoices.synced++;
      } catch (err) {
        result.invoices.errors.push(`Invoice ${invoice.invoiceNumber}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}

// ========================================
// Fetch All (Initial Sync)
// ========================================

export async function fetchAll(userId: string, organizationId: string | null) {
  const [quotes, jobs, clients, invoices] = await Promise.all([
    getQuotes(userId, organizationId),
    getJobs(userId, organizationId),
    getClients(userId, organizationId),
    getInvoices(userId, organizationId),
  ]);

  return {
    quotes,
    jobs,
    clients,
    invoices,
    syncedAt: new Date().toISOString(),
  };
}
