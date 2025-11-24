import { FastifyInstance } from 'fastify';

function registerLogging(app: FastifyInstance, allowedOrigin: string): void {
  app.addHook('onRequest', function (request, reply, done) {
    var reqId = crypto.randomUUID();
    (request as any).reqId = reqId;
    (request as any).startTime = process.hrtime();
    reply.header('x-request-id', reqId);
    done();
  });

  app.addHook('onSend', function (request, reply, payload, done) {
    var start = (request as any).startTime || process.hrtime();
    var diff = process.hrtime(start);
    var ms = Math.round(diff[0] * 1000 + diff[1] / 1e6);
    if (ms > 500) {
      console.warn('Slow request', request.method, request.url, ms + 'ms', 'status', reply.statusCode, 'reqId', (request as any).reqId);
    }
    console.info('Request', {
      reqId: (request as any).reqId,
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      durationMs: ms
    });
    reply.header('Access-Control-Allow-Origin', allowedOrigin);
    reply.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    done();
  });

  app.addHook('onError', function (request, reply, error, done) {
    console.error('API error', {
      reqId: (request as any).reqId,
      url: request.url,
      method: request.method,
      status: reply.statusCode,
      error: error && error.message ? error.message : error
    });
    done();
  });
}

export { registerLogging };
import crypto from 'crypto';
