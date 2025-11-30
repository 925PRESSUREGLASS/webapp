// Build: 2025-11-30T23:30 - Skip API key auth for sync routes
var BUILD_VERSION = '2025-11-30T23:30-sync-auth-fix';
import fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { AppService, AssetLibraryItem, FeatureRecord, Project } from '../../domain/types';
import { sampleProjects, sampleApps, sampleAssets, sampleFeatures } from '../../domain/sampleData';
import {
  serviceBusinesses,
  serviceLines,
  serviceTypes,
  modifiers as sampleModifiers,
  marketAreas as sampleMarketAreas,
  priceBooks as samplePriceBooks,
  packages as samplePackages
} from '../../domain/serviceData';
import { getPrismaClient } from './db/client';
import { z } from 'zod';
import { env } from './config/env';
import { registerLogging } from './plugins/logging';
import { aiBridge } from './ai/bridge';
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

var projectStatusEnum = ['draft', 'in-progress', 'complete'] as const;
var assetStatusEnum = ['draft', 'active', 'deprecated'] as const;
var assetTypeEnum = ['snippet', 'component', 'template', 'static', 'doc', 'prompt'] as const;
var businessStatusEnum = ['active', 'paused', 'archived'] as const;
var riskEnum = ['low', 'medium', 'high'] as const;
var methodEnum = ['pressure', 'softwash'] as const;

var projectBodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(projectStatusEnum)
});

var projectUpdateSchema = projectBodySchema.partial().extend({
  id: z.string().min(1)
});

var featureBodySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(projectStatusEnum)
});

var assetBodySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(assetTypeEnum),
  status: z.enum(assetStatusEnum),
  link: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

var serviceLineSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

var serviceTypeSchema = z.object({
  id: z.string().min(1),
  serviceLineId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  baseRate: z.number().optional(),
  baseMinutesPerUnit: z.number().optional(),
  riskLevel: z.enum(riskEnum).optional(),
  pressureMethod: z.enum(methodEnum).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

var marketAreaSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  postalCodes: z.array(z.string()).optional(),
  travelFee: z.number().optional(),
  minJobValue: z.number().optional(),
  notes: z.string().optional()
});

var modifierSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().optional(),
  scope: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  multiplier: z.number().optional(),
  flatAdjust: z.number().optional(),
  appliesTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

var packageSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  discountPct: z.number().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        serviceTypeId: z.string().min(1),
        quantity: z.number().optional(),
        unitOverride: z.string().optional()
      })
    )
    .optional()
});

function validateOrReply<T>(schema: z.ZodSchema<T>, body: any, reply: any): { success: true; data: T } | { success: false } {
  var parsed = schema.safeParse(body);
  if (!parsed.success) {
    reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    return { success: false };
  }
  return { success: true, data: parsed.data };
}

function buildProjectSummary(projects: Project[]): {
  projectCount: number;
  featureCount: number;
  assetCount: number;
  statusCounts: { [status: string]: number };
} {
  var projectCount = projects.length;
  var featureCount = 0;
  var assetCount = 0;
  var statusCounts: { [status: string]: number } = {};

  for (var i = 0; i < projects.length; i++) {
    var project = projects[i];
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;

    for (var f = 0; f < project.features.length; f++) {
      featureCount += 1;
      var feature = project.features[f];
      for (var a = 0; a < feature.assets.length; a++) {
        assetCount += 1;
      }
    }
  }

  return {
    projectCount: projectCount,
    featureCount: featureCount,
    assetCount: assetCount,
    statusCounts: statusCounts
  };
}

function buildAppSummary(apps: AppService[]): {
  appCount: number;
  statusCounts: { [status: string]: number };
  kinds: { [kind: string]: number };
} {
  var statusCounts: { [status: string]: number } = {};
  var kinds: { [kind: string]: number } = {};

  for (var i = 0; i < apps.length; i++) {
    var app = apps[i];
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    kinds[app.kind] = (kinds[app.kind] || 0) + 1;
  }

  return {
    appCount: apps.length,
    statusCounts: statusCounts,
    kinds: kinds
  };
}

function buildAssetSummary(assets: AssetLibraryItem[]): {
  assetCount: number;
  statusCounts: { [status: string]: number };
  typeCounts: { [type: string]: number };
} {
  var statusCounts: { [status: string]: number } = {};
  var typeCounts: { [type: string]: number } = {};

  for (var i = 0; i < assets.length; i++) {
    var asset = assets[i];
    statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
    typeCounts[asset.type] = (typeCounts[asset.type] || 0) + 1;
  }

  return {
    assetCount: assets.length,
    statusCounts: statusCounts,
    typeCounts: typeCounts
  };
}

function buildFeatureSummary(features: FeatureRecord[]): {
  featureCount: number;
  projectCoverage: number;
  averageAssetsPerFeature: number;
} {
  var featureCount = features.length;
  var projectIds: { [id: string]: boolean } = {};
  var assetTotal = 0;

  for (var i = 0; i < features.length; i++) {
    projectIds[features[i].projectId] = true;
    if (features[i].assets) {
      assetTotal += features[i].assets.length;
    }
  }

  var projectCoverage = Object.keys(projectIds).length;
  var averageAssetsPerFeature = featureCount === 0 ? 0 : Math.round((assetTotal / featureCount) * 100) / 100;

  return {
    featureCount: featureCount,
    projectCoverage: projectCoverage,
    averageAssetsPerFeature: averageAssetsPerFeature
  };
}

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
  var priceBooksStore = samplePriceBooks.slice();
  var packagesStore = samplePackages.slice();
  var prisma = getPrismaClient();

  function mapAssetRow(assetRow: any): AssetLibraryItem {
    return {
      id: assetRow.id,
      title: assetRow.title,
      description: assetRow.description || '',
      type: assetRow.type,
      status: assetRow.status,
      tags: assetRow.tags || [],
      link: assetRow.link || '',
      versions: [],
      projectIds: assetRow.projectIds || [],
      featureIds: assetRow.featureIds || []
    };
  }

  function mapFeatureRow(featureRow: any): FeatureRecord {
    var assets = [];
    if (featureRow.assets && featureRow.assets.length > 0) {
      for (var i = 0; i < featureRow.assets.length; i++) {
        var fa = featureRow.assets[i];
        if (fa.asset) {
          assets.push({
            id: fa.asset.id,
            name: fa.asset.title,
            type: fa.asset.type
          });
        }
      }
    }

    return {
      id: featureRow.id,
      name: featureRow.name,
      summary: featureRow.summary,
      status: featureRow.status,
      assets: assets,
      projectId: featureRow.projectId || (featureRow.project ? featureRow.project.id : ''),
      projectName: featureRow.project ? featureRow.project.name : ''
    };
  }

  function mapProjectRow(projectRow: any): Project {
    var features = [];
    if (projectRow.features && projectRow.features.length > 0) {
      for (var i = 0; i < projectRow.features.length; i++) {
        var feature = projectRow.features[i];
        var assets = [];
        if (feature.assets && feature.assets.length > 0) {
          for (var a = 0; a < feature.assets.length; a++) {
            var fa = feature.assets[a];
            if (fa.asset) {
              assets.push({
                id: fa.asset.id,
                name: fa.asset.title,
                type: fa.asset.type
              });
            }
          }
        }
        features.push({
          id: feature.id,
          name: feature.name,
          summary: feature.summary,
          status: feature.status,
          assets: assets
        });
      }
    }

    return {
      id: projectRow.id,
      name: projectRow.name,
      description: projectRow.description,
      status: projectRow.status,
      features: features
    };
  }

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

  app.get('/apps', function () {
    var updatedAt = new Date('2025-11-22T00:00:00Z').toISOString();
    return {
      data: sampleApps,
      updatedAt: updatedAt
    };
  });

  app.get('/businesses', async function () {
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var businessesDb = await prisma.business.findMany();
      return { data: businessesDb, updatedAt: updatedAt };
    }
    return { data: businessStore, updatedAt: updatedAt };
  });

  app.post('/businesses', async function (request, reply) {
    var body = request.body as { id?: string; name?: string; slug?: string; status?: string; region?: string };
    if (!body || !body.id || !body.name || !body.slug) {
      reply.code(400);
      return { error: 'id, name, and slug are required' };
    }

    if (prisma) {
      try {
        var createdBiz = await prisma.business.create({
          data: {
            id: body.id,
            name: body.name,
            slug: body.slug,
            status: body.status || 'active',
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

    businessStore.push({
      id: body.id,
      name: body.name,
      slug: body.slug,
      status: (body.status as any) || 'active',
      region: body.region || ''
    });
    return body;
  });

  app.get('/apps/summary', function () {
    var summary = buildAppSummary(sampleApps);
    return {
      data: summary,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.get('/apps/:id', function (request, reply) {
    var params = request.params as { id?: string };
    var appId = params.id;
    var appEntry = sampleApps.find(function (item) {
      return item.id === appId;
    });

    if (!appEntry) {
      reply.code(404);
      return { error: 'App not found' };
    }

    return appEntry;
  });

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
