// routes/apps.ts - Apps routes module
import { FastifyInstance } from 'fastify';
import { AppService } from '../../../domain/types';
import { sampleApps } from '../../../domain/sampleData';

export interface AppsContext {
  // No mutable state needed - uses static sampleApps
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

export function registerAppsRoutes(app: FastifyInstance, _ctx: AppsContext): void {
  // GET /apps - List all apps
  app.get('/apps', function () {
    var updatedAt = new Date('2025-11-22T00:00:00Z').toISOString();
    return {
      data: sampleApps,
      updatedAt: updatedAt
    };
  });

  // GET /apps/summary - Get apps summary statistics
  app.get('/apps/summary', function () {
    var summary = buildAppSummary(sampleApps);
    return {
      data: summary,
      updatedAt: new Date('2025-11-22T00:00:00Z').toISOString()
    };
  });

  // GET /apps/:id - Get single app by ID
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
}
