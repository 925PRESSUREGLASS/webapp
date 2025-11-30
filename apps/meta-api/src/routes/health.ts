/**
 * Health Check Routes
 * Provides system health and status information
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface HealthContext {
  prisma: PrismaClient | null;
  buildVersion: string;
  projectsStore: unknown[];
  assetsStore: unknown[];
  featuresStore: unknown[];
  sampleApps: unknown[];
}

export function registerHealthRoutes(
  app: FastifyInstance,
  ctx: HealthContext
): void {
  var { prisma, buildVersion, projectsStore, assetsStore, featuresStore, sampleApps } = ctx;

  app.get('/health', async function () {
    if (!prisma) {
      return {
        status: 'ok',
        build: buildVersion,
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
        build: buildVersion,
        projectsTracked: projectCount,
        appsTracked: sampleApps.length,
        assetsTracked: assetCount,
        featuresTracked: featureCount,
        dbMode: 'prisma'
      };
    } catch (e) {
      return {
        status: 'error',
        build: buildVersion,
        projectsTracked: projectsStore.length,
        appsTracked: sampleApps.length,
        assetsTracked: assetsStore.length,
        featuresTracked: featuresStore.length,
        dbMode: 'memory'
      };
    }
  });
}
