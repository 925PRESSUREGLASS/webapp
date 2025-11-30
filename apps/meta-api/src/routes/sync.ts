import { FastifyInstance, FastifyRequest } from 'fastify';
import * as syncService from '../services/sync.service.js';
import type { JwtPayload } from '../types/jwt.js';

/**
 * Sync Routes
 * All routes require JWT authentication
 */

// JwtPayload imported from ../types/jwt.js for consistency

// Request types
interface SyncQuoteBody {
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
}

interface SyncJobBody {
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
  items: unknown[];
  estimatedSubtotal: number;
  estimatedGst: number;
  estimatedTotal: number;
  photos?: unknown[];
  notes?: unknown[];
  issues?: unknown[];
  completedAt?: string | null;
  signature?: string | null;
  quoteId?: string | null;
  clientId?: string | null;
}

interface SyncClientBody {
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
}

interface SyncInvoiceBody {
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
  notes?: string | null;
  quoteId?: string | null;
  jobId?: string | null;
  clientId?: string | null;
}

interface BulkSyncBody {
  quotes?: SyncQuoteBody[];
  jobs?: SyncJobBody[];
  clients?: SyncClientBody[];
  invoices?: SyncInvoiceBody[];
}

interface SinceQuery {
  since?: string;
}

interface IdParams {
  id: string;
}

export default async function syncRoutes(fastify: FastifyInstance) {
  // All sync routes require authentication
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // ========================================
  // Fetch All Data (Initial Sync / Pull)
  // ========================================
  
  fastify.get('/sync/all', async (request: FastifyRequest) => {
    const user = request.user as JwtPayload;
    const data = await syncService.fetchAll(user.id, user.organizationId);
    return data;
  });

  // ========================================
  // Bulk Sync (Push multiple entities)
  // ========================================

  fastify.post<{ Body: BulkSyncBody }>(
    '/sync/bulk',
    async (request) => {
      const user = request.user as JwtPayload;
      const result = await syncService.bulkSync(
        user.id,
        user.organizationId,
        request.body
      );
      return result;
    }
  );

  // ========================================
  // Quote Sync
  // ========================================

  fastify.get<{ Querystring: SinceQuery }>(
    '/sync/quotes',
    async (request) => {
      const user = request.user as JwtPayload;
      const since = request.query.since ? new Date(request.query.since) : undefined;
      const quotes = await syncService.getQuotes(user.id, user.organizationId, since);
      return { quotes };
    }
  );

  fastify.post<{ Body: SyncQuoteBody }>(
    '/sync/quotes',
    async (request) => {
      const user = request.user as JwtPayload;
      const quote = await syncService.syncQuote(
        user.id,
        user.organizationId,
        request.body
      );
      return { quote };
    }
  );

  fastify.delete<{ Params: IdParams }>(
    '/sync/quotes/:id',
    async (request, reply) => {
      const user = request.user as JwtPayload;
      try {
        await syncService.deleteQuote(user.id, request.params.id);
        return { success: true };
      } catch (err) {
        reply.status(404);
        return { error: (err as Error).message };
      }
    }
  );

  // ========================================
  // Job Sync
  // ========================================

  fastify.get<{ Querystring: SinceQuery }>(
    '/sync/jobs',
    async (request) => {
      const user = request.user as JwtPayload;
      const since = request.query.since ? new Date(request.query.since) : undefined;
      const jobs = await syncService.getJobs(user.id, user.organizationId, since);
      return { jobs };
    }
  );

  fastify.post<{ Body: SyncJobBody }>(
    '/sync/jobs',
    async (request) => {
      const user = request.user as JwtPayload;
      const job = await syncService.syncJob(
        user.id,
        user.organizationId,
        request.body
      );
      return { job };
    }
  );

  fastify.delete<{ Params: IdParams }>(
    '/sync/jobs/:id',
    async (request, reply) => {
      const user = request.user as JwtPayload;
      try {
        await syncService.deleteJob(user.id, request.params.id);
        return { success: true };
      } catch (err) {
        reply.status(404);
        return { error: (err as Error).message };
      }
    }
  );

  // ========================================
  // Client Sync
  // ========================================

  fastify.get<{ Querystring: SinceQuery }>(
    '/sync/clients',
    async (request) => {
      const user = request.user as JwtPayload;
      const since = request.query.since ? new Date(request.query.since) : undefined;
      const clients = await syncService.getClients(user.id, user.organizationId, since);
      return { clients };
    }
  );

  fastify.post<{ Body: SyncClientBody }>(
    '/sync/clients',
    async (request) => {
      const user = request.user as JwtPayload;
      const client = await syncService.syncClient(
        user.id,
        user.organizationId,
        request.body
      );
      return { client };
    }
  );

  fastify.delete<{ Params: IdParams }>(
    '/sync/clients/:id',
    async (request, reply) => {
      const user = request.user as JwtPayload;
      try {
        await syncService.deleteClient(user.organizationId, request.params.id);
        return { success: true };
      } catch (err) {
        reply.status(404);
        return { error: (err as Error).message };
      }
    }
  );

  // ========================================
  // Invoice Sync
  // ========================================

  fastify.get<{ Querystring: SinceQuery }>(
    '/sync/invoices',
    async (request) => {
      const user = request.user as JwtPayload;
      const since = request.query.since ? new Date(request.query.since) : undefined;
      const invoices = await syncService.getInvoices(user.id, user.organizationId, since);
      return { invoices };
    }
  );

  fastify.post<{ Body: SyncInvoiceBody }>(
    '/sync/invoices',
    async (request) => {
      const user = request.user as JwtPayload;
      const invoice = await syncService.syncInvoice(
        user.id,
        user.organizationId,
        request.body
      );
      return { invoice };
    }
  );

  fastify.delete<{ Params: IdParams }>(
    '/sync/invoices/:id',
    async (request, reply) => {
      const user = request.user as JwtPayload;
      try {
        await syncService.deleteInvoice(user.id, request.params.id);
        return { success: true };
      } catch (err) {
        reply.status(404);
        return { error: (err as Error).message };
      }
    }
  );
}
