// routes/businesses.ts - Businesses routes module
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BusinessRecord } from '../../../domain/types';

export interface BusinessesContext {
  prisma: PrismaClient | null;
  businessStore: BusinessRecord[];
}

export function registerBusinessesRoutes(app: FastifyInstance, ctx: BusinessesContext): void {
  var prisma = ctx.prisma;

  // GET /businesses - List all businesses
  app.get('/businesses', async function () {
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var businessesDb = await prisma.business.findMany();
      return { data: businessesDb, updatedAt: updatedAt };
    }
    return { data: ctx.businessStore, updatedAt: updatedAt };
  });

  // POST /businesses - Create a new business
  app.post('/businesses', async function (request, reply) {
    var body = request.body as { id?: string; name?: string; slug?: string; status?: string; region?: string };
    if (!body || !body.id || !body.name || !body.slug) {
      reply.code(400);
      return { error: 'id, name, and slug are required' };
    }

    if (prisma) {
      try {
        var statusValue = (body.status || 'active') as 'active' | 'paused' | 'archived';
        var createdBiz = await prisma.business.create({
          data: {
            id: body.id,
            name: body.name,
            slug: body.slug,
            status: statusValue,
            region: body.region || '',
            contactEmail: '',
            contactPhone: '',
            website: '',
            currency: 'AUD',
            defaultMarkup: 0
          }
        });
        return createdBiz;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create business' };
      }
    }

    var newBusiness: BusinessRecord = {
      id: body.id,
      name: body.name,
      slug: body.slug,
      status: (body.status as 'active' | 'paused' | 'archived') || 'active',
      region: body.region || ''
    };
    ctx.businessStore.push(newBusiness);
    return newBusiness;
  });
}
