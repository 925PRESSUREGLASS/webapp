// Build: 2025-11-30T23:30 - Skip API key auth for sync routes
var BUILD_VERSION = '2025-11-30T23:30-sync-auth-fix';
import fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { sampleProjects, sampleApps, sampleAssets, sampleFeatures } from '../../domain/sampleData';
import {
  serviceBusinesses,
  serviceLines,
  serviceTypes,
  modifiers as sampleModifiers,
  marketAreas as sampleMarketAreas,
  packages as samplePackages
} from '../../domain/serviceData';
import { getPrismaClient } from './db/client';
import { env } from './config/env';
import { registerLogging } from './plugins/logging';
import { emailService } from './services/email.service';
import { registerEmailRoutes } from './routes/email';
import { registerAuthRoutes } from './routes/auth';
import syncRoutes from './routes/sync.js';
import { registerGhlRoutes } from './routes/ghl.js';
import { registerHealthRoutes } from './routes/health';
import { registerPublicRoutes } from './routes/public';
import { registerPricebookRoutes } from './routes/pricebook';
import { registerProjectsRoutes } from './routes/projects';
import { registerAssetsRoutes } from './routes/assets';
import { registerAppsRoutes } from './routes/apps';
import { registerBusinessesRoutes } from './routes/businesses';
import { registerAiRoutes } from './routes/ai';

function buildServer(): FastifyInstance {
  var app = fastify();
  var apiKey = env.API_KEY;
  var allowedOrigin = env.ALLOWED_ORIGIN || '*';
  var rateLimitPerMin = env.RATE_LIMIT_PER_MIN ? parseInt(env.RATE_LIMIT_PER_MIN, 10) : null;
  var rateMap: { [ip: string]: { count: number; windowStart: number } } = {};

  app.addHook('onRequest', function (request, reply, done) {
    if (rateLimitPerMin && rateLimitPerMin > 0) {
      var ip = request.ip || 'unknown';
      var now = Date.now();
      var windowKey = rateMap[ip] || { count: 0, windowStart: now };
      if (now - windowKey.windowStart >= 60 * 1000) {
        windowKey = { count: 0, windowStart: now };
      }
      windowKey.count += 1;
      rateMap[ip] = windowKey;
      if (windowKey.count > rateLimitPerMin) {
        reply.code(429).send({ error: 'Rate limit exceeded' });
        return;
      }
    }

    if (request.method === 'OPTIONS') {
      reply
        .header('Access-Control-Allow-Origin', allowedOrigin)
        .header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization')
        .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        .code(204)
        .send();
      return;
    }
    // Skip API key auth for health check, public endpoints, auth routes, and sync routes (which use JWT auth)
    if (request.url === '/health' || request.url === '/' || request.url.startsWith('/api/public') || request.url.startsWith('/auth') || request.url.startsWith('/sync')) {
      done();
      return;
    }
    if (apiKey) {
      var headerKey = request.headers['x-api-key'] as string | undefined;
      if (!headerKey || headerKey !== apiKey) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
    }
    done();
  });

  registerLogging(app, allowedOrigin);

  // Register JWT plugin for authentication
  var jwtSecret = env.JWT_SECRET || 'dev-secret-change-in-production-12345';
  app.register(fastifyJwt, {
    secret: jwtSecret
  });
  
  console.log('[AUTH] JWT authentication configured');

  // Configure email service if SMTP settings are provided
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    emailService.configure({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587,
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM || env.SMTP_USER
    });
    console.log('[EMAIL] Email service configured with host:', env.SMTP_HOST);
  } else {
    console.log('[EMAIL] Email service not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASS)');
  }

  // Register email routes
  registerEmailRoutes(app, allowedOrigin);
  
  // Register auth routes
  registerAuthRoutes(app, allowedOrigin);
  
  // Register sync routes (authenticated data sync for PWA)
  app.register(syncRoutes);
  console.log('[SYNC] Data sync routes registered');

  // Register GoHighLevel routes (Phase 2C)
  registerGhlRoutes(app);
  console.log('[GHL] Routes registered');

  // Simple mutable copies for in-memory CRUD (placeholder until DB)
  var projectsStore = sampleProjects.slice();
  var featuresStore = sampleFeatures.slice();
  var assetsStore = sampleAssets.slice();
  var businessStore = serviceBusinesses.slice();
  var serviceLinesStore = serviceLines.slice();
  var serviceTypesStore = serviceTypes.slice();
  var modifiersStore = sampleModifiers.slice();
  var marketAreasStore = sampleMarketAreas.slice();
  var packagesStore = samplePackages.slice();
  var prisma = getPrismaClient();

  // Basic CORS headers to allow dashboard fetches during dev
  app.addHook('onSend', function (request, reply, payload, done) {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    done(null, payload);
  });

  app.options('/*', function (_request, reply) {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    reply.send();
  });

  // Register modular route handlers
  registerHealthRoutes(app, {
    prisma: prisma,
    buildVersion: BUILD_VERSION,
    projectsStore: projectsStore,
    assetsStore: assetsStore,
    featuresStore: featuresStore,
    sampleApps: sampleApps
  });

  registerPublicRoutes(app, {
    prisma: prisma,
    serviceLinesStore: serviceLinesStore,
    serviceTypesStore: serviceTypesStore,
    modifiersStore: modifiersStore,
    marketAreasStore: marketAreasStore,
    packagesStore: packagesStore
  });

  // Pricebook context object for mutable store references
  var pricebookContext = {
    prisma: prisma,
    serviceLinesStore: serviceLinesStore,
    serviceTypesStore: serviceTypesStore,
    marketAreasStore: marketAreasStore,
    modifiersStore: modifiersStore,
    packagesStore: packagesStore
  };
  registerPricebookRoutes(app, pricebookContext);

  // Projects routes context
  var projectsContext = {
    prisma: prisma,
    projectsStore: projectsStore,
    featuresStore: featuresStore
  };
  registerProjectsRoutes(app, projectsContext);

  // Assets routes context
  var assetsContext = {
    prisma: prisma,
    assetsStore: assetsStore
  };
  registerAssetsRoutes(app, assetsContext);

  // Apps routes (static sample data)
  registerAppsRoutes(app, {});

  // Businesses routes context
  var businessesContext = {
    prisma: prisma,
    businessStore: businessStore
  };
  registerBusinessesRoutes(app, businessesContext);

  // AI routes
  registerAiRoutes(app, {});

  return app;
}

function start() {
  var app = buildServer();
  var port = env.PORT ? parseInt(env.PORT, 10) : 4000;
  app.listen({ port: port, host: '0.0.0.0' }, function (err, address) {
    if (err) {
      console.error('[SERVER] Listen error:', err);
      app.log.error(err);
      process.exit(1);
    }

    app.log.info('meta-api running at ' + address);
  });
}

if (require.main === module) {
  start();
}

export { buildServer, start };
