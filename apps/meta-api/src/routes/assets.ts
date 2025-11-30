/**
 * Assets routes module
 * Extracted from server.ts to reduce file size and improve maintainability
 */
import { FastifyInstance } from 'fastify';
import { AssetLibraryItem } from '../../../domain/types';
import { z } from 'zod';

var assetStatusEnum = ['draft', 'active', 'deprecated'] as const;
var assetTypeEnum = ['snippet', 'component', 'template', 'static', 'doc', 'prompt'] as const;

var assetBodySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(assetTypeEnum),
  status: z.enum(assetStatusEnum),
  link: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

export interface AssetsContext {
  prisma: any;
  assetsStore: AssetLibraryItem[];
}

function validateOrReply<T>(schema: z.ZodSchema<T>, body: any, reply: any): { success: true; data: T } | { success: false } {
  var parsed = schema.safeParse(body);
  if (!parsed.success) {
    reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    return { success: false };
  }
  return { success: true, data: parsed.data };
}

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

export function registerAssetsRoutes(app: FastifyInstance, ctx: AssetsContext): void {
  var prisma = ctx.prisma;
  var assetsStore = ctx.assetsStore;

  // GET /assets - List all assets
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

  // GET /assets/summary - Get asset statistics
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

  // GET /assets/:id - Get single asset by ID
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

  // POST /assets - Create new asset
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

  // PUT /assets/:id - Update existing asset
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

  // DELETE /assets/:id - Delete asset
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

      // Update context store reference
      ctx.assetsStore = nextAssets;
      return { status: 'ok' };
    }
  });
}
