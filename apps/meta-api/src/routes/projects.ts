/**
 * Projects & Features Routes
 * Project CRUD and nested Features management
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Project, FeatureRecord } from '../../../domain/types';

var projectStatusEnum = ['draft', 'in-progress', 'complete'] as const;

var projectBodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(projectStatusEnum)
});

var featureBodySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(projectStatusEnum)
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

export interface ProjectsContext {
  prisma: PrismaClient | null;
  projectsStore: Project[];
  featuresStore: FeatureRecord[];
}

export function registerProjectsRoutes(
  app: FastifyInstance,
  ctx: ProjectsContext
): void {
  var prisma = ctx.prisma;
  var projectsStore = ctx.projectsStore;
  var featuresStore = ctx.featuresStore;

  // ===== PROJECTS =====

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

  // ===== FEATURES (nested under projects) =====

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

    ctx.featuresStore = nextFeatures;

    // Remove from project lists
    for (var p = 0; p < projectsStore.length; p++) {
      var project = projectsStore[p];
      project.features = project.features.filter(function (item) {
        return item.id !== featureId;
      });
    }

    return { status: 'ok' };
  });
}
