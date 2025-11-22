import fastify, { FastifyInstance } from 'fastify';
import { AppService, AssetLibraryItem, FeatureRecord, Project } from '../../domain/types';
import { sampleProjects, sampleApps, sampleAssets, sampleFeatures } from '../../domain/sampleData';
import { getPrismaClient } from './db/client';

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

  // Simple mutable copies for in-memory CRUD (placeholder until DB)
  var projectsStore = sampleProjects.slice();
  var featuresStore = sampleFeatures.slice();
  var assetsStore = sampleAssets.slice();
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
        featuresTracked: featuresStore.length
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
        featuresTracked: featureCount
      };
    } catch (e) {
      return {
        status: 'error',
        projectsTracked: projectsStore.length,
        appsTracked: sampleApps.length,
        assetsTracked: assetsStore.length,
        featuresTracked: featuresStore.length
      };
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

    var updatedAt = new Date('2025-11-22T00:00:00Z').toISOString();
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
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  app.get('/apps', function () {
    var updatedAt = new Date('2025-11-22T00:00:00Z').toISOString();
    return {
      data: sampleApps,
      updatedAt: updatedAt
    };
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
    var body = request.body as {
      id?: string;
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      link?: string;
      tags?: string[];
    };

    if (!body || !body.id || !body.title || !body.type || !body.status) {
      reply.code(400);
      return { error: 'Missing required fields: id, title, type, status' };
    }

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
        type: body.type as any,
        status: body.status as any,
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
    var body = request.body as {
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      link?: string;
      tags?: string[];
    };
    var assetId = params.id;

    if (prisma) {
      try {
        var updatedDb = await prisma.asset.update({
          where: { id: assetId },
          data: {
            title: body && body.title ? body.title : undefined,
            description: body && body.description ? body.description : undefined,
            type: body && body.type ? body.type : undefined,
            status: body && body.status ? body.status : undefined,
            tags: body && body.tags ? body.tags : undefined,
            link: body && body.link ? body.link : undefined
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
        title: body && body.title ? body.title : current.title,
        description: body && body.description ? body.description : current.description,
        type: body && body.type ? (body.type as any) : current.type,
        status: body && body.status ? (body.status as any) : current.status,
        tags: body && body.tags ? body.tags : current.tags,
        versions: current.versions,
        link: body && body.link ? body.link : current.link,
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
    var body = request.body as { id?: string; name?: string; description?: string; status?: string };
    if (!body || !body.id || !body.name || !body.description) {
      reply.code(400);
      return { error: 'Missing required fields: id, name, description' };
    }

    if (prisma) {
      return prisma.project.create({
        data: {
          id: body.id,
          name: body.name,
          description: body.description,
          status: body.status === 'complete' || body.status === 'draft' ? body.status : 'in-progress'
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
      status: body.status === 'complete' || body.status === 'draft' ? body.status : 'in-progress',
      features: []
    };

    projectsStore.push(project);
    return project;
  });

  app.post('/projects/:id/features', async function (request, reply) {
    var params = request.params as { id?: string };
    var projectId = params.id;
    var body = request.body as { id?: string; name?: string; summary?: string; status?: string };

    if (!body || !body.id || !body.name || !body.summary) {
      reply.code(400);
      return { error: 'Missing required fields: id, name, summary' };
    }

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
            status: body.status && (body.status === 'draft' || body.status === 'complete') ? body.status : 'in-progress',
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
      status: body.status && (body.status === 'draft' || body.status === 'complete') ? body.status : 'in-progress',
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
    var body = request.body as { name?: string; summary?: string; status?: string };
    var projectId = params.projectId;
    var featureId = params.featureId;

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
      status: body && body.status && (body.status === 'draft' || body.status === 'in-progress' || body.status === 'complete')
        ? body.status
        : current.status,
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
  app.listen({ port: 4000 }, function (err, address) {
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
