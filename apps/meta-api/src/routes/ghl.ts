import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { testConnection, createContact, createOpportunity, getGhlStatus } from '../services/ghl.service.js';
import { env } from '../config/env.js';

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

export function registerGhlRoutes(app: FastifyInstance): void {
  // Scope all GHL routes under /ghl prefix with JWT requirement
  app.register(async function ghlPlugin(ghl) {
    // All routes in this plugin require JWT
    ghl.addHook('preHandler', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    });

    ghl.get('/status', async (_request, _reply) => {
      return getGhlStatus();
    });

    ghl.get('/test', async (_request, reply) => {
      try {
        var result = await testConnection();
        reply.send({ success: true, result });
      } catch (err: any) {
        reply.status(400).send({ success: false, error: err.message || 'GHL test failed' });
      }
    });

    ghl.post('/contacts', async (request, reply) => {
      var body = await validateBody(request, reply, contactSchema);
      if (!body) return;

      try {
        var result = await createContact(body);
        reply.send({ success: true, contact: result });
      } catch (err: any) {
        reply.status(400).send({ success: false, error: err.message || 'Failed to create contact' });
      }
    });

    ghl.post('/opportunities', async (request, reply) => {
      var body = await validateBody(request, reply, opportunitySchema);
      if (!body) return;

      try {
        var result = await createOpportunity(body);
        reply.send({ success: true, opportunity: result });
      } catch (err: any) {
        reply.status(400).send({ success: false, error: err.message || 'Failed to create opportunity' });
      }
    });

    // Webhook receiver (signature is a shared secret check for now)
    // Note: webhooks use their own auth (signature), not JWT
  }, { prefix: '/ghl' });

  // Webhook is outside the JWT-protected scope (uses signature auth)
  app.post('/ghl/webhook', async (request, reply) => {
    var configuredSecret = env.GHL_WEBHOOK_SECRET;
    if (configuredSecret) {
      var provided = (request.headers['x-ghl-signature'] as string) || '';
      if (provided !== configuredSecret) {
        reply.status(401).send({ success: false, error: 'Invalid webhook signature' });
        return;
      }
    }

    try {
      console.log('[GHL-WEBHOOK] Event received:', request.body);
    } catch (err) {
      // Ignore logging errors
    }

    reply.send({ success: true });
  });
}
