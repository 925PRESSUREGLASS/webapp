// routes/ai.ts - AI routes module
import { FastifyInstance } from 'fastify';
import { aiBridge } from '../ai/bridge';

export interface AiContext {
  // No mutable state - uses aiBridge singleton
}

export function registerAiRoutes(app: FastifyInstance, _ctx: AiContext): void {
  // POST /ai/ask - Ask AI a question using embeddings
  app.post('/ai/ask', async function (request, reply) {
    if (!aiBridge.isConfigured()) {
      reply.code(503);
      return { error: 'AI embeddings service not configured' };
    }
    var body = request.body as { question?: string; k?: number; sources?: string[] };
    if (!body || !body.question) {
      reply.code(400);
      return { error: 'question is required' };
    }
    var k = body.k && body.k > 0 ? body.k : 5;
    var sources = body.sources && Array.isArray(body.sources) ? body.sources : undefined;

    try {
      var result = await aiBridge.ask(body.question, k, sources);
      return result;
    } catch (err: any) {
      var message = err && err.message ? err.message : 'AI service unavailable';
      reply.code(502);
      return { error: 'AI service unavailable', detail: message };
    }
  });
}
