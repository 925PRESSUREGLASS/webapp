import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { testConnection, createContact, createOpportunity, getGhlStatus } from '../services/ghl.service.js';

interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string | null;
}

var contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional()
});

var opportunitySchema = z.object({
  title: z.string().min(1),
  contactId: z.string().min(1),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  status: z.string().optional(),
  monetaryValue: z.number().optional(),
  assignedTo: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

async function validateBody<T>(request: FastifyRequest, reply: FastifyReply, schema: z.ZodSchema<T>): Promise<T | null> {
  var parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    return null;
  }
  return parsed.data;
}

export async function registerGhlRoutes(app: FastifyInstance) {
  // All routes require JWT
  app.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.get('/ghl/status', async (_request, _reply) => {
    return getGhlStatus();
  });

  app.get('/ghl/test', async (_request, reply) => {
    try {
      var result = await testConnection();
      reply.send({ success: true, result });
    } catch (err: any) {
      reply.status(400).send({ success: false, error: err.message || 'GHL test failed' });
    }
  });

  app.post('/ghl/contacts', async (request, reply) => {
    var body = await validateBody(request, reply, contactSchema);
    if (!body) return;

    try {
      var result = await createContact(body);
      reply.send({ success: true, contact: result });
    } catch (err: any) {
      reply.status(400).send({ success: false, error: err.message || 'Failed to create contact' });
    }
  });

  app.post('/ghl/opportunities', async (request, reply) => {
    var body = await validateBody(request, reply, opportunitySchema);
    if (!body) return;

    try {
      var result = await createOpportunity(body);
      reply.send({ success: true, opportunity: result });
    } catch (err: any) {
      reply.status(400).send({ success: false, error: err.message || 'Failed to create opportunity' });
    }
  });
}
