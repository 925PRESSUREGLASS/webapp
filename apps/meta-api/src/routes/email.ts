import { FastifyInstance } from 'fastify';
import { emailService } from '../services/email.service';

/**
 * Register email routes
 */
function registerEmailRoutes(app: FastifyInstance, allowedOrigin: string): void {
  // CORS preflight
  app.options('/email/*', function (_request, reply) {
    reply
      .header('Access-Control-Allow-Origin', allowedOrigin)
      .header('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
      .code(204)
      .send();
  });

  /**
   * POST /email/verify - Verify email configuration
   */
  app.post('/email/verify', async function (_request, reply) {
    if (!emailService.isConfigured()) {
      reply.code(503);
      return { error: 'Email service not configured', configured: false };
    }

    var result = await emailService.verify();
    if (!result.success) {
      reply.code(500);
      return { error: result.error, configured: true, verified: false };
    }

    return { configured: true, verified: true };
  });

  /**
   * POST /email/send-quote - Send a quote PDF via email
   */
  app.post('/email/send-quote', async function (request, reply) {
    if (!emailService.isConfigured()) {
      reply.code(503);
      return { error: 'Email service not configured' };
    }

    var body = request.body as {
      to?: string;
      subject?: string;
      body?: string;
      attachment?: string;
      quoteNumber?: string;
    };

    if (!body || !body.to) {
      reply.code(400);
      return { error: 'Recipient email (to) is required' };
    }

    var validation = emailService.validateRequest({
      to: body.to,
      subject: body.subject || 'Quote from 925 Pressure Glass',
      body: body.body || 'Please find your quote attached.',
      attachment: body.attachment,
      filename: body.quoteNumber ? 'Quote-' + body.quoteNumber + '.pdf' : 'Quote.pdf'
    });

    if (!validation.success) {
      reply.code(400);
      return { error: 'Invalid request', details: validation.error.format() };
    }

    var result = await emailService.send(validation.data);
    if (!result.success) {
      reply.code(500);
      return { error: result.error };
    }

    return { success: true, messageId: result.messageId };
  });

  /**
   * POST /email/send-invoice - Send an invoice PDF via email
   */
  app.post('/email/send-invoice', async function (request, reply) {
    if (!emailService.isConfigured()) {
      reply.code(503);
      return { error: 'Email service not configured' };
    }

    var body = request.body as {
      to?: string;
      subject?: string;
      body?: string;
      attachment?: string;
      invoiceNumber?: string;
    };

    if (!body || !body.to) {
      reply.code(400);
      return { error: 'Recipient email (to) is required' };
    }

    var validation = emailService.validateRequest({
      to: body.to,
      subject: body.subject || 'Invoice from 925 Pressure Glass',
      body: body.body || 'Please find your invoice attached.',
      attachment: body.attachment,
      filename: body.invoiceNumber ? 'Invoice-' + body.invoiceNumber + '.pdf' : 'Invoice.pdf'
    });

    if (!validation.success) {
      reply.code(400);
      return { error: 'Invalid request', details: validation.error.format() };
    }

    var result = await emailService.send(validation.data);
    if (!result.success) {
      reply.code(500);
      return { error: result.error };
    }

    return { success: true, messageId: result.messageId };
  });

  /**
   * POST /email/send-backup - Send a backup file via email
   */
  app.post('/email/send-backup', async function (request, reply) {
    if (!emailService.isConfigured()) {
      reply.code(503);
      return { error: 'Email service not configured' };
    }

    var body = request.body as {
      to?: string;
      subject?: string;
      body?: string;
      attachment?: string;
      filename?: string;
    };

    if (!body || !body.to) {
      reply.code(400);
      return { error: 'Recipient email (to) is required' };
    }

    if (!body.attachment) {
      reply.code(400);
      return { error: 'Backup attachment is required' };
    }

    var validation = emailService.validateRequest({
      to: body.to,
      subject: body.subject || 'TicTacStick Backup',
      body: body.body || 'Please find your TicTacStick data backup attached.',
      attachment: body.attachment,
      filename: body.filename || 'tictacstick-backup.json'
    });

    if (!validation.success) {
      reply.code(400);
      return { error: 'Invalid request', details: validation.error.format() };
    }

    var result = await emailService.send(validation.data);
    if (!result.success) {
      reply.code(500);
      return { error: result.error };
    }

    return { success: true, messageId: result.messageId };
  });

  /**
   * POST /email/send - Generic email send endpoint
   */
  app.post('/email/send', async function (request, reply) {
    if (!emailService.isConfigured()) {
      reply.code(503);
      return { error: 'Email service not configured' };
    }

    var body = request.body as {
      to?: string;
      subject?: string;
      body?: string;
      html?: string;
      attachment?: string;
      filename?: string;
      cc?: string;
      bcc?: string;
    };

    if (!body || !body.to) {
      reply.code(400);
      return { error: 'Recipient email (to) is required' };
    }

    if (!body.subject) {
      reply.code(400);
      return { error: 'Subject is required' };
    }

    var validation = emailService.validateRequest(body);
    if (!validation.success) {
      reply.code(400);
      return { error: 'Invalid request', details: validation.error.format() };
    }

    var result = await emailService.send(validation.data);
    if (!result.success) {
      reply.code(500);
      return { error: result.error };
    }

    return { success: true, messageId: result.messageId };
  });
}

export { registerEmailRoutes };
