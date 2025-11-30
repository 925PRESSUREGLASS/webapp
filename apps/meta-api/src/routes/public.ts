/**
 * Public API Routes
 * Unauthenticated endpoints for pricing data used by quote-engine frontend
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface ServiceLine {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

interface ServiceType {
  id: string;
  serviceLineId: string;
  code: string;
  name: string;
  unit: string;
  baseRate?: number;
  isActive?: boolean;
}

interface Modifier {
  id: string;
  businessId?: string;
  scope: string;
  name: string;
  multiplier?: number;
  flatAdjust?: number;
  isActive?: boolean;
}

interface MarketArea {
  id: string;
  businessId: string;
  name: string;
  postalCodes?: string[];
  travelFee?: number;
  minJobValue?: number;
}

interface Package {
  id: string;
  businessId: string;
  name: string;
  isActive?: boolean;
  items?: unknown[];
}

interface PublicApiContext {
  prisma: PrismaClient | null;
  serviceLinesStore: ServiceLine[];
  serviceTypesStore: ServiceType[];
  modifiersStore: Modifier[];
  marketAreasStore: MarketArea[];
  packagesStore: Package[];
}

export function registerPublicRoutes(
  app: FastifyInstance,
  ctx: PublicApiContext
): void {
  var { prisma, serviceLinesStore, serviceTypesStore, modifiersStore, marketAreasStore, packagesStore } = ctx;

  // Get all service types with pricing for quote calculations
  app.get('/api/public/pricing', async function (request: FastifyRequest) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925';

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
  app.get('/api/public/service-lines', async function (request: FastifyRequest) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925';

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
  app.get('/api/public/packages', async function (request: FastifyRequest) {
    var query = request.query as { businessId?: string };
    var businessId = query.businessId || 'biz-925';

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
}
