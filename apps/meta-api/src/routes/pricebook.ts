/**
 * Pricebook Routes
 * Service Lines, Service Types, Market Areas, Modifiers, and Packages CRUD
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  serviceLineSchema,
  serviceTypeSchema,
  marketAreaSchema,
  modifierSchema,
  packageSchema,
  validateOrReply
} from './shared';

interface ServiceLineItem {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

interface ServiceTypeItem {
  id: string;
  serviceLineId: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  baseRate?: number;
  baseMinutesPerUnit?: number;
  riskLevel?: string;
  pressureMethod?: string;
  tags?: string[];
  isActive?: boolean;
}

interface MarketAreaItem {
  id: string;
  businessId: string;
  name: string;
  postalCodes?: string[];
  travelFee?: number;
  minJobValue?: number;
  notes?: string;
}

interface ModifierItem {
  id: string;
  businessId?: string;
  scope: string;
  name: string;
  description?: string;
  multiplier?: number;
  flatAdjust?: number;
  appliesTo?: string;
  tags?: string[];
  isActive?: boolean;
}

interface PackageItem {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  discountPct?: number;
  tags?: string[];
  isActive?: boolean;
  items?: Array<{
    id?: string;
    serviceTypeId: string;
    quantity?: number;
    unitOverride?: string;
  }>;
}

export interface PricebookContext {
  prisma: PrismaClient | null;
  serviceLinesStore: ServiceLineItem[];
  serviceTypesStore: ServiceTypeItem[];
  marketAreasStore: MarketAreaItem[];
  modifiersStore: ModifierItem[];
  packagesStore: PackageItem[];
}

export function registerPricebookRoutes(
  app: FastifyInstance,
  ctx: PricebookContext
): void {
  var prisma = ctx.prisma;
  var serviceLinesStore = ctx.serviceLinesStore;
  var serviceTypesStore = ctx.serviceTypesStore;
  var marketAreasStore = ctx.marketAreasStore;
  var modifiersStore = ctx.modifiersStore;
  var packagesStore = ctx.packagesStore;

  // ===== SERVICE LINES =====

  app.get('/service-lines', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var lines = await prisma.serviceLine.findMany({
        where: whereClause
      });
      return { data: lines, updatedAt: updatedAt };
    }
    var filtered = serviceLinesStore;
    if (query && query.businessId) {
      filtered = serviceLinesStore.filter(function (line) {
        return line.businessId === query.businessId;
      });
    }
    return { data: filtered, updatedAt: updatedAt };
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
            tags: body.tags || []
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
      tags: body.tags || []
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
            name: body.name,
            description: body.description,
            category: body.category,
            tags: body.tags
          }
        });
        return updatedLine;
      } catch (e) {
        reply.code(404);
        return { error: 'Service line not found' };
      }
    }
    var idx = -1;
    for (var i = 0; i < serviceLinesStore.length; i++) {
      if (serviceLinesStore[i].id === lineId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      reply.code(404);
      return { error: 'Service line not found' };
    }
    var current = serviceLinesStore[idx];
    serviceLinesStore[idx] = Object.assign({}, current, body);
    return serviceLinesStore[idx];
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
        return { error: 'Service line not found' };
      }
    }
    // Also remove related service types
    var originalLength = serviceLinesStore.length;
    ctx.serviceLinesStore = serviceLinesStore.filter(function (item) {
      return item.id !== lineId;
    });
    ctx.serviceTypesStore = serviceTypesStore.filter(function (item) {
      return item.serviceLineId !== lineId;
    });
    if (ctx.serviceLinesStore.length === originalLength) {
      reply.code(404);
      return { error: 'Service line not found' };
    }
    return { ok: true };
  });

  // ===== SERVICE TYPES =====

  app.get('/service-types', async function (request) {
    var query = request.query as { serviceLineId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.serviceLineId) {
        whereClause.serviceLineId = query.serviceLineId;
      }
      var types = await prisma.serviceType.findMany({
        where: whereClause,
        include: {
          modifiers: true
        }
      });
      return { data: types, updatedAt: updatedAt };
    }
    var filtered = serviceTypesStore;
    if (query && query.serviceLineId) {
      filtered = serviceTypesStore.filter(function (st) {
        return st.serviceLineId === query.serviceLineId;
      });
    }
    return { data: filtered, updatedAt: updatedAt };
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
            baseRate: body.baseRate || 0,
            baseMinutesPerUnit: body.baseMinutesPerUnit || 0,
            riskLevel: body.riskLevel || 'low',
            pressureMethod: body.pressureMethod || 'pressure',
            tags: body.tags || [],
            isActive: body.isActive !== false
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
      baseRate: body.baseRate || 0,
      baseMinutesPerUnit: body.baseMinutesPerUnit || 0,
      riskLevel: body.riskLevel || 'low',
      pressureMethod: body.pressureMethod || 'pressure',
      tags: body.tags || [],
      isActive: body.isActive !== false
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
            serviceLineId: body.serviceLineId,
            code: body.code,
            name: body.name,
            description: body.description,
            unit: body.unit,
            baseRate: body.baseRate,
            baseMinutesPerUnit: body.baseMinutesPerUnit,
            riskLevel: body.riskLevel,
            pressureMethod: body.pressureMethod,
            tags: body.tags,
            isActive: body.isActive
          }
        });
        return updatedType;
      } catch (e) {
        reply.code(404);
        return { error: 'Service type not found' };
      }
    }
    var idx = -1;
    for (var i = 0; i < serviceTypesStore.length; i++) {
      if (serviceTypesStore[i].id === typeId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      reply.code(404);
      return { error: 'Service type not found' };
    }
    var current = serviceTypesStore[idx];
    serviceTypesStore[idx] = Object.assign({}, current, body);
    return serviceTypesStore[idx];
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
        return { error: 'Service type not found' };
      }
    }
    ctx.serviceTypesStore = serviceTypesStore.filter(function (item) {
      return item.id !== typeId;
    });
    return { ok: true };
  });

  // ===== MARKET AREAS =====

  app.get('/market-areas', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var areas = await prisma.marketArea.findMany({
        where: whereClause
      });
      return { data: areas, updatedAt: updatedAt };
    }
    var filtered = marketAreasStore;
    if (query && query.businessId) {
      filtered = marketAreasStore.filter(function (area) {
        return area.businessId === query.businessId;
      });
    }
    return { data: filtered, updatedAt: updatedAt };
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
            name: body.name,
            postalCodes: body.postalCodes,
            travelFee: body.travelFee,
            minJobValue: body.minJobValue,
            notes: body.notes
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
    var current = marketAreasStore[idx];
    marketAreasStore[idx] = Object.assign({}, current, body);
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
    ctx.marketAreasStore = marketAreasStore.filter(function (area) {
      return area.id !== areaId;
    });
    return { ok: true };
  });

  // ===== PRICEBOOK CURRENT =====

  app.get('/pricebook/current', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var lines = await prisma.serviceLine.findMany({ where: whereClause });
      var types = await prisma.serviceType.findMany({
        include: { modifiers: true }
      });
      var mods = await prisma.modifier.findMany({ where: whereClause });
      var areas = await prisma.marketArea.findMany({ where: whereClause });
      var pkgs = await prisma.package.findMany({
        where: whereClause,
        include: { items: true }
      });
      return {
        serviceLines: lines,
        serviceTypes: types,
        modifiers: mods,
        marketAreas: areas,
        packages: pkgs,
        updatedAt: updatedAt
      };
    }
    return {
      serviceLines: serviceLinesStore,
      serviceTypes: serviceTypesStore,
      modifiers: modifiersStore,
      marketAreas: marketAreasStore,
      packages: packagesStore,
      updatedAt: updatedAt
    };
  });

  // ===== PACKAGES =====

  app.get('/packages', async function (request) {
    var query = request.query as { businessId?: string };
    var updatedAt = new Date().toISOString();
    if (prisma) {
      var whereClause: any = {};
      if (query && query.businessId) {
        whereClause.businessId = query.businessId;
      }
      var pkgsDb = await prisma.package.findMany({
        where: whereClause,
        include: {
          items: true
        }
      });
      return { data: pkgsDb, updatedAt: updatedAt };
    }
    var pkgs = packagesStore;
    if (query && query.businessId) {
      pkgs = packagesStore.filter(function (pkg) {
        return pkg.businessId === query.businessId;
      });
    }
    return { data: pkgs, updatedAt: updatedAt };
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
    ctx.packagesStore = packagesStore.filter(function (item) {
      return item.id !== pkgId;
    });
    return { ok: true };
  });

  // ===== MODIFIERS =====

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
    ctx.modifiersStore = modifiersStore.filter(function (mod) {
      return mod.id !== modId;
    });
    return { ok: true };
  });

  // ===== PACKAGE ITEMS =====

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
        var itemId = pkgId + '-item-' + Date.now();
        var createdItem = await prisma.packageItem.create({
          data: {
            id: itemId,
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
}
