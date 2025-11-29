import fastify, { FastifyInstance } from 'fastify';
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
        .header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
        .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        .code(204)
        .send();
      return;
    }
    // Skip auth for health check and public endpoints
    if (request.url === '/health' || request.url === '/' || request.url.startsWith('/api/public')) {
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
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    done(null, payload);
  });

  app.options('/*', function (_request, reply) {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    reply.send();
  });

  app.get('/health', async function () {
    if (!prisma) {
      return {
        status: 'ok',
        projectsTracked: projectsStore.length,
        appsTracked: sampleApps.length,
        assetsTracked: assetsStore.length,
        featuresTracked: featuresStore.length,
        dbMode: 'memory'
      };
    }

    try {
      var projectCount = await prisma.project.count();
      var featureCount = await prisma.feature.count();
      var assetCount = await prisma.asset.count();
      return {
        status: 'ok',
        projectsTracked: projectCount,
        appsTracked: sampleApps.length,
        assetsTracked: assetCount,
        featuresTracked: featureCount,
        dbMode: 'prisma'
      };
    } catch (e) {
      return {
        status: 'error',
        projectsTracked: projectsStore.length,
        appsTracked: sampleApps.length,
        assetsTracked: assetsStore.length,
        featuresTracked: featuresStore.length,
        dbMode: 'memory'
      };
    }
  });

  // ===== PUBLIC API ROUTES (no auth required) =====
  // These endpoints provide pricing data for the quote-engine frontend

  // Get all service types with pricing for quote calculations
  app.get('/api/public/pricing', async function (request) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925-pressure-glass';

    if (prisma) {
      var serviceTypesDb = await prisma.serviceType.findMany({
        where: {
          serviceLine: { businessId: businessId },
          isActive: true
        },
        include: { serviceLine: true }
      });

      var modifiersDb = await prisma.modifier.findMany({
        where: {
          OR: [
            { businessId: businessId },
            { businessId: null }
          ],
          isActive: true
        }
      });

      var marketAreasDb = await prisma.marketArea.findMany({
        where: { businessId: businessId }
      });

      return {
        serviceTypes: serviceTypesDb,
        modifiers: modifiersDb,
        marketAreas: marketAreasDb,
        updatedAt: new Date().toISOString()
      };
    }

    // Fallback to in-memory data
    var allowedLines = serviceLinesStore
      .filter(function (line) { return line.businessId === businessId; })
      .map(function (line) { return line.id; });

    return {
      serviceTypes: serviceTypesStore.filter(function (st) {
        return allowedLines.indexOf(st.serviceLineId) !== -1 && st.isActive !== false;
      }),
      modifiers: modifiersStore.filter(function (m) {
        return m.businessId === businessId || !m.businessId;
      }),
      marketAreas: marketAreasStore.filter(function (a) {
        return a.businessId === businessId;
      }),
      updatedAt: new Date().toISOString()
    };
  });

  // Get service lines for category grouping
  app.get('/api/public/service-lines', async function (request) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925-pressure-glass';

    if (prisma) {
      var linesDb = await prisma.serviceLine.findMany({
        where: { businessId: businessId },
        include: {
          serviceTypes: {
            where: { isActive: true }
          }
        }
      });
      return { data: linesDb, updatedAt: new Date().toISOString() };
    }

    var lines = serviceLinesStore.filter(function (line) {
      return line.businessId === businessId;
    });
    return { data: lines, updatedAt: new Date().toISOString() };
  });

  // Get packages/bundles for upselling
  app.get('/api/public/packages', async function (request) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925-pressure-glass';

    if (prisma) {
      var packagesDb = await prisma.package.findMany({
        where: {
          businessId: businessId,
          isActive: true
        },
        include: { items: true }
      });
      return { data: packagesDb, updatedAt: new Date().toISOString() };
    }

    var pkgs = packagesStore.filter(function (pkg) {
      return pkg.businessId === businessId && pkg.isActive !== false;
    });
    return { data: pkgs, updatedAt: new Date().toISOString() };
  });

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

  app.get('/projects', async function () {
    if (prisma) {
      var projects = await prisma.project.findMany({
        include: {
          features: {
            include: {
              assets: {
                include: {
                  asset: true
                }
              }
            }
          }
        }
      });
      return {
        data: projects.map(mapProjectRow),
        updatedAt: new Date().toISOString()
      };
    }

    var updatedAt = new Date().toISOString();
    return {
      data: projectsStore,
      updatedAt: updatedAt
    };
  });

  app.put('/projects/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var body = request.body as { name?: string; description?: string; status?: string };
    var projectId = params.id;
    if (prisma) {
      try {
        var updatedDb = await prisma.project.update({
          where: { id: projectId },
          data: {
            name: body && body.name ? body.name : undefined,
            description: body && body.description ? body.description : undefined,
            status: body && body.status ? body.status : undefined
          },
          include: {
            features: {
              include: {
                assets: {
                  include: {
                    asset: true
                  }
                }
              }
            }
          }
        });
        return mapProjectRow(updatedDb);
      } catch (e) {
        reply.code(404);
        return { error: 'Project not found' };
      }
    }

    var projectIndex = -1;
    for (var i = 0; i < projectsStore.length; i++) {
      if (projectsStore[i].id === projectId) {
        projectIndex = i;
        break;
      }
    }

    if (projectIndex === -1) {
      reply.code(404);
      return { error: 'Project not found' };
    }

    var current = projectsStore[projectIndex];
    var updated: Project = {
      id: current.id,
      name: body && body.name ? body.name : current.name,
      description: body && body.description ? body.description : current.description,
      status: body && body.status && (body.status === 'draft' || body.status === 'in-progress' || body.status === 'complete')
        ? body.status
        : current.status,
      features: current.features
    };

    projectsStore[projectIndex] = updated;
    return updated;
  });

  app.get('/projects/summary', async function () {
    if (prisma) {
      var projectsDb = await prisma.project.findMany({
        include: {
          features: {
            include: {
              assets: true
            }
          }
        }
      });
      var mapped = projectsDb.map(mapProjectRow);
      var summaryDb = buildProjectSummary(mapped);
      return {
        data: summaryDb,
        updatedAt: new Date().toISOString()
      };
    }
    var summary = buildProjectSummary(projectsStore);
    return {
      data: summary,
      updatedAt: new Date().toISOString()
    };
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

  app.get('/service-lines', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var linesDb = await prisma.serviceLine.findMany({ where: whereClause });
      return { data: linesDb, updatedAt: updatedAt };
    }
    var lines = serviceLinesStore;
    if (query && query.businessId) {
      lines = serviceLinesStore.filter(function (line) {
        return line.businessId === query.businessId;
      });
    }
    return { data: lines, updatedAt: updatedAt };
  });

  app.post('/service-lines', async function (request, reply) {
    var parsed = validateOrReply(serviceLineSchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var createdLine = await prisma.serviceLine.create({
          data: {
            id: body.id,
            businessId: body.businessId,
            name: body.name,
            description: body.description || '',
            category: body.category || '',
            tags: []
          }
        });
        return createdLine;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create service line' };
      }
    }
    serviceLinesStore.push({
      id: body.id,
      businessId: body.businessId,
      name: body.name,
      description: body.description || '',
      category: body.category || '',
      tags: []
    });
    return body;
  });

  app.put('/service-lines/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var lineId = params.id;
    if (!lineId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = serviceLineSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var updatedLine = await prisma.serviceLine.update({
          where: { id: lineId },
          data: {
            name: body && body.name ? body.name : undefined,
            description: body && body.description ? body.description : undefined,
            category: body && body.category ? body.category : undefined,
            tags: body && body.tags ? body.tags : undefined
          }
        });
        return updatedLine;
      } catch (e) {
        reply.code(404);
        return { error: 'Service line not found' };
      }
    }
    var lineIdx = -1;
    for (var li = 0; li < serviceLinesStore.length; li++) {
      if (serviceLinesStore[li].id === lineId) {
        lineIdx = li;
        break;
      }
    }
    if (lineIdx === -1) {
      reply.code(404);
      return { error: 'Service line not found' };
    }
    var existingLine = serviceLinesStore[lineIdx];
    serviceLinesStore[lineIdx] = {
      id: existingLine.id,
      businessId: existingLine.businessId,
      name: body && body.name ? body.name : existingLine.name,
      description: body && body.description ? body.description : existingLine.description,
      category: body && body.category ? body.category : existingLine.category,
      tags: body && body.tags ? body.tags : existingLine.tags || []
    };
    return serviceLinesStore[lineIdx];
  });

  app.delete('/service-lines/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var lineId = params.id;
    if (!lineId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    if (prisma) {
      try {
        await prisma.serviceLine.delete({ where: { id: lineId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Service line not found or in use' };
      }
    }
    serviceLinesStore = serviceLinesStore.filter(function (item) {
      return item.id !== lineId;
    });
    serviceTypesStore = serviceTypesStore.filter(function (item) {
      return item.serviceLineId !== lineId;
    });
    return { ok: true };
  });

  app.get('/service-types', async function (request) {
    var query = request.query as { businessId?: string; serviceLineId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.serviceLineId) {
        whereClause.serviceLineId = query.serviceLineId;
      } else if (query && query.businessId) {
        whereClause.serviceLine = { businessId: query.businessId };
      }
      var typesDb = await prisma.serviceType.findMany({
        where: whereClause,
        include: {
          serviceLine: true
        }
      });
      return { data: typesDb, updatedAt: updatedAt };
    }

    var filteredTypes = serviceTypesStore;
    if (query && query.serviceLineId) {
      filteredTypes = serviceTypesStore.filter(function (item) {
        return item.serviceLineId === query.serviceLineId;
      });
    } else if (query && query.businessId) {
      var allowedLines = serviceLinesStore
        .filter(function (line) {
          return line.businessId === query.businessId;
        })
        .map(function (line) {
          return line.id;
        });
      filteredTypes = serviceTypesStore.filter(function (item) {
        return allowedLines.indexOf(item.serviceLineId) !== -1;
      });
    }
    return { data: filteredTypes, updatedAt: updatedAt };
  });

  app.post('/service-types', async function (request, reply) {
    var parsed = validateOrReply(serviceTypeSchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var createdType = await prisma.serviceType.create({
          data: {
            id: body.id,
            serviceLineId: body.serviceLineId,
            code: body.code,
            name: body.name,
            description: body.description || '',
            unit: body.unit,
            baseRate: body.baseRate,
            baseMinutesPerUnit: body.baseMinutesPerUnit,
            riskLevel: body.riskLevel || '',
            pressureMethod: body.pressureMethod || '',
            tags: [],
            isActive: true
          }
        });
        return createdType;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create service type' };
      }
    }

    serviceTypesStore.push({
      id: body.id,
      serviceLineId: body.serviceLineId,
      code: body.code,
      name: body.name,
      description: body.description || '',
      unit: body.unit,
      baseRate: body.baseRate,
      baseMinutesPerUnit: body.baseMinutesPerUnit,
      riskLevel: body.riskLevel || '',
      pressureMethod: body.pressureMethod || '',
      tags: [],
      isActive: true
    });
    return body;
  });

  app.put('/service-types/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var typeId = params.id;
    if (!typeId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = serviceTypeSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var updatedType = await prisma.serviceType.update({
          where: { id: typeId },
          data: {
            serviceLineId: body && body.serviceLineId ? body.serviceLineId : undefined,
            code: body && body.code ? body.code : undefined,
            name: body && body.name ? body.name : undefined,
            description: body && body.description ? body.description : undefined,
            unit: body && body.unit ? body.unit : undefined,
            baseRate: typeof body.baseRate === 'number' ? body.baseRate : undefined,
            baseMinutesPerUnit: typeof body.baseMinutesPerUnit === 'number' ? body.baseMinutesPerUnit : undefined,
            riskLevel: body && body.riskLevel ? body.riskLevel : undefined,
            pressureMethod: body && body.pressureMethod ? body.pressureMethod : undefined,
            tags: body && body.tags ? body.tags : undefined,
            isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined
          }
        });
        return updatedType;
      } catch (e) {
        reply.code(404);
        return { error: 'Service type not found' };
      }
    }
    var typeIdx = -1;
    for (var ti = 0; ti < serviceTypesStore.length; ti++) {
      if (serviceTypesStore[ti].id === typeId) {
        typeIdx = ti;
        break;
      }
    }
    if (typeIdx === -1) {
      reply.code(404);
      return { error: 'Service type not found' };
    }
    var existingType = serviceTypesStore[typeIdx];
    serviceTypesStore[typeIdx] = {
      id: existingType.id,
      serviceLineId: body && body.serviceLineId ? body.serviceLineId : existingType.serviceLineId,
      code: body && body.code ? body.code : existingType.code,
      name: body && body.name ? body.name : existingType.name,
      description: body && body.description ? body.description : existingType.description,
      unit: body && body.unit ? body.unit : existingType.unit,
      baseRate: typeof body.baseRate === 'number' ? body.baseRate : existingType.baseRate,
      baseMinutesPerUnit: typeof body.baseMinutesPerUnit === 'number' ? body.baseMinutesPerUnit : existingType.baseMinutesPerUnit,
      riskLevel: body && body.riskLevel ? body.riskLevel : existingType.riskLevel,
      pressureMethod: body && body.pressureMethod ? body.pressureMethod : existingType.pressureMethod,
      tags: body && body.tags ? body.tags : existingType.tags || [],
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existingType.isActive
    };
    return serviceTypesStore[typeIdx];
  });

  app.delete('/service-types/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var typeId = params.id;
    if (!typeId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    if (prisma) {
      try {
        await prisma.serviceType.delete({ where: { id: typeId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Service type not found or in use' };
      }
    }
    serviceTypesStore = serviceTypesStore.filter(function (item) {
      return item.id !== typeId;
    });
    return { ok: true };
  });

  app.get('/market-areas', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var areasDb = await prisma.marketArea.findMany({
        where: whereClause
      });
      return { data: areasDb, updatedAt: updatedAt };
    }

    var areas = marketAreasStore;
    if (query && query.businessId) {
      areas = marketAreasStore.filter(function (area) {
        return area.businessId === query.businessId;
      });
    }
    return { data: areas, updatedAt: updatedAt };
  });

  app.post('/market-areas', async function (request, reply) {
    var parsed = validateOrReply(marketAreaSchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var createdArea = await prisma.marketArea.create({
          data: {
            id: body.id,
            businessId: body.businessId,
            name: body.name,
            postalCodes: body.postalCodes || [],
            travelFee: body.travelFee || 0,
            minJobValue: body.minJobValue || 0,
            notes: body.notes || ''
          }
        });
        return createdArea;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create market area' };
      }
    }
    marketAreasStore.push({
      id: body.id,
      businessId: body.businessId,
      name: body.name,
      postalCodes: body.postalCodes || [],
      travelFee: body.travelFee || 0,
      minJobValue: body.minJobValue || 0,
      notes: body.notes || ''
    });
    return body;
  });

  app.put('/market-areas/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var areaId = params.id;
    if (!areaId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = marketAreaSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var updatedArea = await prisma.marketArea.update({
          where: { id: areaId },
          data: {
            name: body && body.name ? body.name : undefined,
            postalCodes: body && body.postalCodes ? body.postalCodes : undefined,
            travelFee: typeof body.travelFee === 'number' ? body.travelFee : undefined,
            minJobValue: typeof body.minJobValue === 'number' ? body.minJobValue : undefined,
            notes: body && body.notes ? body.notes : undefined
          }
        });
        return updatedArea;
      } catch (e) {
        reply.code(404);
        return { error: 'Market area not found' };
      }
    }
    var idx = -1;
    for (var i = 0; i < marketAreasStore.length; i++) {
      if (marketAreasStore[i].id === areaId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      reply.code(404);
      return { error: 'Market area not found' };
    }
    var existing = marketAreasStore[idx];
    marketAreasStore[idx] = {
      id: existing.id,
      businessId: existing.businessId,
      name: body && body.name ? body.name : existing.name,
      postalCodes: body && body.postalCodes ? body.postalCodes : existing.postalCodes || [],
      travelFee: typeof body.travelFee === 'number' ? body.travelFee : existing.travelFee,
      minJobValue: typeof body.minJobValue === 'number' ? body.minJobValue : existing.minJobValue,
      notes: body && body.notes ? body.notes : existing.notes
    };
    return marketAreasStore[idx];
  });

  app.delete('/market-areas/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var areaId = params.id;
    if (!areaId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    if (prisma) {
      try {
        await prisma.marketArea.delete({ where: { id: areaId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Market area not found' };
      }
    }
    marketAreasStore = marketAreasStore.filter(function (area) {
      return area.id !== areaId;
    });
    return { ok: true };
  });

  app.get('/pricebook/current', async function (request, reply) {
    var query = request.query as { businessId?: string };
    var businessId = query && query.businessId ? query.businessId : '';
    var updatedAt = new Date().toISOString();
    if (!businessId) {
      reply.code(400);
      return { error: 'businessId is required' };
    }
    if (prisma) {
      var book = await prisma.priceBookVersion.findFirst({
        where: {
          businessId: businessId,
          isCurrent: true
        },
        include: {
          rates: true
        }
      });
      return { data: book, updatedAt: updatedAt };
    }

    var bookFallback = priceBooksStore.find(function (b) {
      return b.businessId === businessId && b.isCurrent;
    });
    return { data: bookFallback || null, updatedAt: updatedAt };
  });

  app.get('/packages', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var pkgDb = await prisma.package.findMany({
        where: whereClause,
        include: {
          items: true
        }
      });
      return { data: pkgDb, updatedAt: updatedAt };
    }
    var pkg = packagesStore;
    if (query && query.businessId) {
      pkg = packagesStore.filter(function (item) {
        return item.businessId === query.businessId;
      });
    }
    return { data: pkg, updatedAt: updatedAt };
  });

  app.post('/packages', async function (request, reply) {
    var parsed = validateOrReply(packageSchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var createdPkg = await prisma.package.create({
          data: {
            id: body.id,
            businessId: body.businessId,
            name: body.name,
            description: body.description || '',
            discountPct: body.discountPct || 0,
            tags: body.tags || [],
            isActive: true
          }
        });
        return createdPkg;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create package' };
      }
    }
    packagesStore.push({
      id: body.id,
      businessId: body.businessId,
      name: body.name,
      description: body.description || '',
      discountPct: body.discountPct || 0,
      tags: body.tags || [],
      isActive: true,
      items: []
    });
    return body;
  });

  app.put('/packages/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var pkgId = params.id;
    if (!pkgId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = packageSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var updatedPkg = await prisma.package.update({
          where: { id: pkgId },
          data: {
            name: body && body.name ? body.name : undefined,
            description: body && body.description ? body.description : undefined,
            discountPct: typeof body.discountPct === 'number' ? body.discountPct : undefined,
            tags: body && body.tags ? body.tags : undefined,
            isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined
          }
        });
        return updatedPkg;
      } catch (e) {
        reply.code(404);
        return { error: 'Package not found' };
      }
    }
    var pkgIdx = -1;
    for (var i = 0; i < packagesStore.length; i++) {
      if (packagesStore[i].id === pkgId) {
        pkgIdx = i;
        break;
      }
    }
    if (pkgIdx === -1) {
      reply.code(404);
      return { error: 'Package not found' };
    }
    var currentPkg = packagesStore[pkgIdx];
    packagesStore[pkgIdx] = {
      id: currentPkg.id,
      businessId: currentPkg.businessId,
      name: body && body.name ? body.name : currentPkg.name,
      description: body && body.description ? body.description : currentPkg.description,
      discountPct: typeof body.discountPct === 'number' ? body.discountPct : currentPkg.discountPct,
      tags: body && body.tags ? body.tags : currentPkg.tags || [],
      isActive: typeof body.isActive === 'boolean' ? body.isActive : currentPkg.isActive,
      items: currentPkg.items
    };
    return packagesStore[pkgIdx];
  });

  app.delete('/packages/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var pkgId = params.id;
    if (!pkgId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    if (prisma) {
      try {
        await prisma.package.delete({ where: { id: pkgId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Package not found' };
      }
    }
    packagesStore = packagesStore.filter(function (item) {
      return item.id !== pkgId;
    });
    return { ok: true };
  });

  app.get('/modifiers', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var modsDb = await prisma.modifier.findMany({
        where: whereClause,
        include: {
          serviceTypes: true
        }
      });
      return { data: modsDb, updatedAt: updatedAt };
    }
    var mods = modifiersStore;
    if (query && query.businessId) {
      mods = modifiersStore.filter(function (mod) {
        return mod.businessId === query.businessId;
      });
    }
    return { data: mods, updatedAt: updatedAt };
  });

  app.post('/modifiers', async function (request, reply) {
    var parsed = validateOrReply(modifierSchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var createdMod = await prisma.modifier.create({
          data: {
            id: body.id,
            businessId: body.businessId || null,
            scope: body.scope,
            name: body.name,
            description: body.description || '',
            multiplier: body.multiplier,
            flatAdjust: body.flatAdjust,
            appliesTo: body.appliesTo || '',
            tags: body.tags || [],
            isActive: true
          }
        });
        return createdMod;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to create modifier' };
      }
    }
    modifiersStore.push({
      id: body.id,
      businessId: body.businessId,
      scope: body.scope,
      name: body.name,
      description: body.description || '',
      multiplier: body.multiplier,
      flatAdjust: body.flatAdjust,
      appliesTo: body.appliesTo || '',
      tags: body.tags || [],
      isActive: true
    } as any);
    return body;
  });

  app.delete('/modifiers/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var modId = params.id;
    if (!modId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    if (prisma) {
      try {
        await prisma.modifier.delete({ where: { id: modId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Modifier not found' };
      }
    }
    modifiersStore = modifiersStore.filter(function (mod) {
      return mod.id !== modId;
    });
    return { ok: true };
  });

  app.put('/modifiers/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var modId = params.id;
    if (!modId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = modifierSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;
    if (prisma) {
      try {
        var updatedMod = await prisma.modifier.update({
          where: { id: modId },
          data: {
            businessId: body.businessId,
            scope: body.scope,
            name: body.name,
            description: body.description,
            multiplier: body.multiplier,
            flatAdjust: body.flatAdjust,
            appliesTo: body.appliesTo,
            tags: body.tags,
            isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined
          }
        });
        return updatedMod;
      } catch (e) {
        reply.code(404);
        return { error: 'Modifier not found' };
      }
    }
    var idx = -1;
    for (var m = 0; m < modifiersStore.length; m++) {
      if (modifiersStore[m].id === modId) {
        idx = m;
        break;
      }
    }
    if (idx === -1) {
      reply.code(404);
      return { error: 'Modifier not found' };
    }
    var current = modifiersStore[idx];
    modifiersStore[idx] = Object.assign({}, current, body);
    return modifiersStore[idx];
  });

  app.post('/packages/:id/items', async function (request, reply) {
    var params = request.params as { id?: string };
    var body = request.body as { serviceTypeId?: string; quantity?: number; unitOverride?: string };
    var pkgId = params.id;
    if (!pkgId || !body || !body.serviceTypeId) {
      reply.code(400);
      return { error: 'package id and serviceTypeId are required' };
    }
    if (prisma) {
      try {
        var createdItem = await prisma.packageItem.create({
          data: {
            packageId: pkgId,
            serviceTypeId: body.serviceTypeId,
            quantity: body.quantity || 0,
            unitOverride: body.unitOverride || ''
          }
        });
        return createdItem;
      } catch (e) {
        reply.code(500);
        return { error: 'Failed to add package item' };
      }
    }
    var pkgIndex = -1;
    for (var pi = 0; pi < packagesStore.length; pi++) {
      if (packagesStore[pi].id === pkgId) {
        pkgIndex = pi;
        break;
      }
    }
    if (pkgIndex === -1) {
      reply.code(404);
      return { error: 'Package not found' };
    }
    var nextLength = packagesStore[pkgIndex].items ? (packagesStore[pkgIndex].items as any).length : 0;
    var newItem = {
      id: pkgId + '-item-' + nextLength,
      serviceTypeId: body.serviceTypeId,
      quantity: body.quantity || 0,
      unitOverride: body.unitOverride || ''
    };
    if (!packagesStore[pkgIndex].items) {
      (packagesStore[pkgIndex] as any).items = [];
    }
    (packagesStore[pkgIndex].items as any).push(newItem);
    return newItem;
  });

  app.delete('/packages/:packageId/items/:itemId', async function (request, reply) {
    var params = request.params as { packageId?: string; itemId?: string };
    if (!params.packageId || !params.itemId) {
      reply.code(400);
      return { error: 'packageId and itemId are required' };
    }
    if (prisma) {
      try {
        await prisma.packageItem.delete({ where: { id: params.itemId } });
        return { ok: true };
      } catch (e) {
        reply.code(404);
        return { error: 'Package item not found' };
      }
    }
    for (var i = 0; i < packagesStore.length; i++) {
      if (packagesStore[i].id === params.packageId && packagesStore[i].items) {
        packagesStore[i].items = (packagesStore[i].items as any).filter(function (itm: any) {
          return itm.id !== params.itemId;
        });
        break;
      }
    }
    return { ok: true };
  });

  app.get('/apps/summary', function () {
    var summary = buildAppSummary(sampleApps);
    return {
      data: summary,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.get('/assets', async function () {
    if (prisma) {
      var assetsDb = await prisma.asset.findMany();
      return {
        data: assetsDb.map(mapAssetRow),
        updatedAt: new Date().toISOString()
      };
    }
    return {
      data: assetsStore,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.get('/assets/summary', async function () {
    if (prisma) {
      var assetsDb = await prisma.asset.findMany();
      var mapped = assetsDb.map(mapAssetRow);
      var summaryDb = buildAssetSummary(mapped);
      return {
        data: summaryDb,
        updatedAt: new Date().toISOString()
      };
    }
    var summary = buildAssetSummary(assetsStore);
    return {
      data: summary,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.post('/assets', async function (request, reply) {
    var parsed = validateOrReply(assetBodySchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;

    if (prisma) {
      try {
        var created = await prisma.asset.create({
          data: {
            id: body.id,
            title: body.title,
            description: body.description || '',
            type: body.type,
            status: body.status,
            link: body.link || '',
            tags: body.tags || []
          }
        });
        return mapAssetRow(created);
      } catch (e) {
        reply.code(409);
        return { error: 'Asset with this id already exists' };
      }
    } else {
      var exists = assetsStore.find(function (item) {
        return item.id === body.id;
      });

      if (exists) {
        reply.code(409);
        return { error: 'Asset with this id already exists' };
      }

      var asset: AssetLibraryItem = {
        id: body.id,
        title: body.title,
        description: body.description || '',
        type: body.type,
        status: body.status,
        tags: body.tags || [],
        versions: [],
        link: body.link
      };

      assetsStore.push(asset);
      return asset;
    }
  });

  app.put('/assets/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var assetId = params.id;
    var body = request.body as any;
    if (!assetId) {
      reply.code(400);
      return { error: 'id is required' };
    }
    var parsed = assetBodySchema.partial().safeParse(Object.assign({}, body, { id: assetId }));
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var clean = parsed.data;

    if (prisma) {
      try {
        var updatedDb = await prisma.asset.update({
          where: { id: assetId },
          data: {
            title: clean.title,
            description: clean.description,
            type: clean.type,
            status: clean.status,
            tags: clean.tags,
            link: clean.link
          }
        });
        return mapAssetRow(updatedDb);
      } catch (e) {
        reply.code(404);
        return { error: 'Asset not found' };
      }
    } else {
      var index = -1;
      for (var i = 0; i < assetsStore.length; i++) {
        if (assetsStore[i].id === assetId) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        reply.code(404);
        return { error: 'Asset not found' };
      }

      var current = assetsStore[index];
      var updated: AssetLibraryItem = {
        id: current.id,
        title: clean.title || current.title,
        description: clean.description || current.description,
        type: clean.type || current.type,
        status: clean.status || current.status,
        tags: clean.tags || current.tags,
        versions: current.versions,
        link: clean.link || current.link,
        projectIds: current.projectIds,
        featureIds: current.featureIds
      };

      assetsStore[index] = updated;
      return updated;
    }
  });

  app.delete('/assets/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var assetId = params.id;
    if (prisma) {
      try {
        await prisma.asset.delete({ where: { id: assetId } });
        return { status: 'ok' };
      } catch (e) {
        reply.code(404);
        return { error: 'Asset not found' };
      }
    } else {
      var nextAssets: AssetLibraryItem[] = [];
      var found = false;

      for (var i = 0; i < assetsStore.length; i++) {
        if (assetsStore[i].id === assetId) {
          found = true;
        } else {
          nextAssets.push(assetsStore[i]);
        }
      }

      if (!found) {
        reply.code(404);
        return { error: 'Asset not found' };
      }

      assetsStore = nextAssets;
      return { status: 'ok' };
    }
  });

  app.get('/features', async function () {
    if (prisma) {
      var featuresDb = await prisma.feature.findMany({
        include: {
          project: true,
          assets: {
            include: {
              asset: true
            }
          }
        }
      });
      return {
        data: featuresDb.map(mapFeatureRow),
        updatedAt: new Date().toISOString()
      };
    }
    return {
      data: featuresStore,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.get('/features/summary', async function () {
    if (prisma) {
      var featuresDb = await prisma.feature.findMany({
        include: {
          assets: true
        }
      });
      var mapped = featuresDb.map(mapFeatureRow);
      var summaryDb = buildFeatureSummary(mapped);
      return {
        data: summaryDb,
        updatedAt: new Date().toISOString()
      };
    }
    var summary = buildFeatureSummary(featuresStore);
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

  app.get('/projects/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var projectId = params.id;

    if (prisma) {
      var projectDb = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          features: {
            include: {
              assets: {
                include: {
                  asset: true
                }
              }
            }
          }
        }
      });

      if (!projectDb) {
        reply.code(404);
        return { error: 'Project not found' };
      }
      return mapProjectRow(projectDb);
    }

    var project = projectsStore.find(function (item) {
      return item.id === projectId;
    });

    if (!project) {
      reply.code(404);
      return { error: 'Project not found' };
    }

    return project;
  });

  app.post('/projects', function (request, reply) {
    var parsed = validateOrReply(projectBodySchema, request.body, reply);
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;

    if (prisma) {
      return prisma.project.create({
        data: {
          id: body.id,
          name: body.name,
          description: body.description,
          status: body.status
        }
      }).then(function (projectRow: any) {
        return mapProjectRow(projectRow);
      }).catch(function () {
        reply.code(409);
        return { error: 'Project with this id already exists' };
      });
    }

    var exists = projectsStore.find(function (item) {
      return item.id === body.id;
    });

    if (exists) {
      reply.code(409);
      return { error: 'Project with this id already exists' };
    }

    var project: Project = {
      id: body.id,
      name: body.name,
      description: body.description,
      status: body.status,
      features: []
    };

    projectsStore.push(project);
    return project;
  });

  app.post('/projects/:id/features', async function (request, reply) {
    var projectId = (request.params as { id?: string }).id;
    var parsed = validateOrReply(
      featureBodySchema,
      Object.assign({}, request.body, { projectId: projectId }),
      reply
    );
    if (!parsed.success) {
      return;
    }
    var body = parsed.data;

    if (prisma) {
      var parentPrisma = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!parentPrisma) {
        reply.code(404);
        return { error: 'Project not found' };
      }

      try {
        var createdFeature = await prisma.feature.create({
          data: {
            id: body.id,
            name: body.name,
            summary: body.summary,
            status: body.status,
            projectId: parentPrisma.id
          },
          include: {
            project: true,
            assets: {
              include: { asset: true }
            }
          }
        });
        return mapFeatureRow(createdFeature);
      } catch (e) {
        reply.code(409);
        return { error: 'Feature with this id already exists' };
      }
    }

    var parent = projectsStore.find(function (item) {
      return item.id === projectId;
    });

    if (!parent) {
      reply.code(404);
      return { error: 'Project not found' };
    }

    var exists = featuresStore.find(function (item) {
      return item.id === body.id;
    });

    if (exists) {
      reply.code(409);
      return { error: 'Feature with this id already exists' };
    }

    var feature: FeatureRecord = {
      id: body.id,
      name: body.name,
      summary: body.summary,
      status: body.status,
      assets: [],
      projectId: parent.id,
      projectName: parent.name
    };

    featuresStore.push(feature);

    // Attach to project feature list
    parent.features.push({
      id: feature.id,
      name: feature.name,
      summary: feature.summary,
      status: feature.status,
      assets: []
    });

    return feature;
  });

  app.delete('/features/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var featureId = params.id;

    if (prisma) {
      try {
        await prisma.feature.delete({ where: { id: featureId } });
        return { status: 'ok' };
      } catch (e) {
        reply.code(404);
        return { error: 'Feature not found' };
      }
    }

    var found = false;
    var nextFeatures: FeatureRecord[] = [];

    for (var i = 0; i < featuresStore.length; i++) {
      if (featuresStore[i].id === featureId) {
        found = true;
      } else {
        nextFeatures.push(featuresStore[i]);
      }
    }

    if (!found) {
      reply.code(404);
      return { error: 'Feature not found' };
    }

    featuresStore = nextFeatures;

    // Remove from project lists
    for (var p = 0; p < projectsStore.length; p++) {
      var project = projectsStore[p];
      project.features = project.features.filter(function (item) {
        return item.id !== featureId;
      });
    }

    return { status: 'ok' };
  });

  app.put('/projects/:projectId/features/:featureId', async function (request, reply) {
    var params = request.params as { projectId?: string; featureId?: string };
    var projectId = params.projectId;
    var featureId = params.featureId;
    var parsed = featureBodySchema.partial().safeParse(Object.assign({}, request.body, { projectId: projectId }));
    if (!parsed.success) {
      reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
      return;
    }
    var body = parsed.data;

    if (prisma) {
      try {
        var updatedDb = await prisma.feature.update({
          where: { id: featureId },
          data: {
            name: body && body.name ? body.name : undefined,
            summary: body && body.summary ? body.summary : undefined,
            status: body && body.status ? body.status : undefined
          },
          include: {
            project: true,
            assets: {
              include: {
                asset: true
              }
            }
          }
        });

        if (updatedDb.projectId !== projectId) {
          reply.code(400);
          return { error: 'Feature does not belong to this project' };
        }

        return mapFeatureRow(updatedDb);
      } catch (e) {
        reply.code(404);
        return { error: 'Feature not found' };
      }
    }

    var featureIndex = -1;
    for (var i = 0; i < featuresStore.length; i++) {
      if (featuresStore[i].id === featureId) {
        featureIndex = i;
        break;
      }
    }

    if (featureIndex === -1) {
      reply.code(404);
      return { error: 'Feature not found' };
    }

    if (featuresStore[featureIndex].projectId !== projectId) {
      reply.code(400);
      return { error: 'Feature does not belong to this project' };
    }

    var current = featuresStore[featureIndex];
    var updated: FeatureRecord = {
      id: current.id,
      projectId: current.projectId,
      projectName: current.projectName,
      name: body && body.name ? body.name : current.name,
      summary: body && body.summary ? body.summary : current.summary,
      status: body && body.status ? body.status : current.status,
      assets: current.assets || []
    };

    featuresStore[featureIndex] = updated;

    // Update project list entry
    for (var p = 0; p < projectsStore.length; p++) {
      if (projectsStore[p].id === projectId) {
        for (var f = 0; f < projectsStore[p].features.length; f++) {
          if (projectsStore[p].features[f].id === featureId) {
            projectsStore[p].features[f] = {
              id: updated.id,
              name: updated.name,
              summary: updated.summary,
              status: updated.status,
              assets: projectsStore[p].features[f].assets || []
            };
            break;
          }
        }
      }
    }

    return updated;
  });

  app.get('/assets/:id', function (request, reply) {
    var params = request.params as { id?: string };
    var assetId = params.id;
    var assetEntry = assetsStore.find(function (item) {
      return item.id === assetId;
    });

    if (!assetEntry) {
      reply.code(404);
      return { error: 'Asset not found' };
    }

    return assetEntry;
  });

  app.get('/features/:id', async function (request, reply) {
    var params = request.params as { id?: string };
    var featureId = params.id;

    if (prisma) {
      var featureDb = await prisma.feature.findUnique({
        where: { id: featureId },
        include: {
          project: true,
          assets: {
            include: {
              asset: true
            }
          }
        }
      });
      if (!featureDb) {
        reply.code(404);
        return { error: 'Feature not found' };
      }
      return mapFeatureRow(featureDb);
    }

    var featureEntry = featuresStore.find(function (item) {
      return item.id === featureId;
    });

    if (!featureEntry) {
      reply.code(404);
      return { error: 'Feature not found' };
    }

    return featureEntry;
  });

  return app;
}

function start() {
  var app = buildServer();
  var port = env.PORT ? parseInt(env.PORT, 10) : 4000;
  app.listen({ port: port, host: '0.0.0.0' }, function (err, address) {
    if (err) {
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
