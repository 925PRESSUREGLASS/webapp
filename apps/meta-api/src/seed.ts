import { PrismaClient } from '@prisma/client';
import { sampleProjects, sampleAssets } from '../../domain/sampleData';
import {
  serviceBusinesses,
  serviceLines,
  serviceTypes,
  modifiers,
  marketAreas,
  priceBooks,
  packages
} from '../../domain/serviceData';

async function run(): Promise<void> {
  var prisma = new PrismaClient();
  try {
    // Reset tables in order of dependencies
    await prisma.priceBookRate.deleteMany();
    await prisma.priceBookVersion.deleteMany();
    await prisma.packageItem.deleteMany();
    await prisma.package.deleteMany();
    await prisma.$executeRawUnsafe('DELETE FROM "_ModifierToServiceType";');
    await prisma.modifier.deleteMany();
    await prisma.serviceType.deleteMany();
    await prisma.serviceLine.deleteMany();
    await prisma.marketArea.deleteMany();
    await prisma.business.deleteMany();
    await prisma.featureAsset.deleteMany();
    await prisma.projectAsset.deleteMany();
    await prisma.assetVersion.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.project.deleteMany();
    await prisma.asset.deleteMany();

    // Seed assets first
    var assetIds: { [key: string]: boolean } = {};
    for (var i = 0; i < sampleAssets.length; i++) {
      var asset = sampleAssets[i];
      var createdAsset = await prisma.asset.create({
        data: {
          id: asset.id,
          title: asset.title,
          description: asset.description || '',
          type: asset.type,
          status: asset.status,
          tags: asset.tags || [],
          link: asset.link || ''
        }
      });
      assetIds[createdAsset.id] = true;

      if (asset.versions && asset.versions.length > 0) {
        for (var v = 0; v < asset.versions.length; v++) {
          var version = asset.versions[v];
          await prisma.assetVersion.create({
            data: {
              id: version.id,
              version: version.version,
              changelog: version.changelog || '',
              isCurrent: version.isCurrent,
              assetId: createdAsset.id
            }
          });
        }
      }
    }

    // Seed businesses
    for (var b = 0; b < serviceBusinesses.length; b++) {
      var biz = serviceBusinesses[b];
      await prisma.business.create({
        data: {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          status: biz.status,
          region: biz.region || '',
          contactEmail: biz.contactEmail || '',
          contactPhone: biz.contactPhone || '',
          website: biz.website || '',
          currency: biz.currency || 'AUD',
          defaultMarkup: biz.defaultMarkup || 0
        }
      });
    }

    // Seed service lines
    for (var sl = 0; sl < serviceLines.length; sl++) {
      var line = serviceLines[sl];
      await prisma.serviceLine.create({
        data: {
          id: line.id,
          businessId: line.businessId,
          name: line.name,
          description: line.description || '',
          category: line.category || '',
          tags: line.tags || []
        }
      });
    }

    // Seed service types
    for (var st = 0; st < serviceTypes.length; st++) {
      var type = serviceTypes[st];
      await prisma.serviceType.create({
        data: {
          id: type.id,
          serviceLineId: type.serviceLineId,
          code: type.code,
          name: type.name,
          description: type.description || '',
          unit: type.unit,
          baseRate: type.baseRate,
          baseMinutesPerUnit: type.baseMinutesPerUnit,
          riskLevel: type.riskLevel || '',
          pressureMethod: type.pressureMethod || '',
          tags: type.tags || [],
          isActive: type.isActive !== false
        }
      });
    }

    // Seed modifiers and link to all service types within same business
    var lineById: { [id: string]: string } = {};
    for (var l = 0; l < serviceLines.length; l++) {
      lineById[serviceLines[l].id] = serviceLines[l].businessId;
    }

    var typesByBusiness: { [id: string]: string[] } = {};
    for (var t = 0; t < serviceTypes.length; t++) {
      var stBizId = lineById[serviceTypes[t].serviceLineId];
      if (!typesByBusiness[stBizId]) {
        typesByBusiness[stBizId] = [];
      }
      typesByBusiness[stBizId].push(serviceTypes[t].id);
    }

    for (var m = 0; m < modifiers.length; m++) {
      var mod = modifiers[m];
      var targetBusiness = mod.businessId || '';
      var targetTypes = targetBusiness && typesByBusiness[targetBusiness] ? typesByBusiness[targetBusiness] : [];
      await prisma.modifier.create({
        data: {
          id: mod.id,
          businessId: mod.businessId || null,
          scope: mod.scope,
          name: mod.name,
          description: mod.description || '',
          multiplier: mod.multiplier,
          flatAdjust: mod.flatAdjust,
          appliesTo: mod.appliesTo || '',
          tags: mod.tags || [],
          isActive: mod.isActive !== false,
          serviceTypes: targetTypes.length
            ? {
                connect: targetTypes.map(function (tid) {
                  return { id: tid };
                })
              }
            : undefined
        }
      });
    }

    // Seed market areas
    for (var ma = 0; ma < marketAreas.length; ma++) {
      var area = marketAreas[ma];
      await prisma.marketArea.create({
        data: {
          id: area.id,
          businessId: area.businessId,
          name: area.name,
          postalCodes: area.postalCodes || [],
          travelFee: area.travelFee || 0,
          minJobValue: area.minJobValue || 0,
          notes: area.notes || ''
        }
      });
    }

    // Seed price books and rates
    for (var pb = 0; pb < priceBooks.length; pb++) {
      var book = priceBooks[pb];
      await prisma.priceBookVersion.create({
        data: {
          id: book.id,
          businessId: book.businessId,
          version: book.version,
          changelog: book.changelog || '',
          isCurrent: book.isCurrent,
          rates: book.rates
            ? {
                create: book.rates.map(function (rate) {
                  return {
                    id: rate.id,
                    serviceTypeId: rate.serviceTypeId,
                    rate: rate.rate || 0,
                    minutesPerUnit: rate.minutesPerUnit || 0,
                    currency: rate.currency || 'AUD',
                    notes: rate.notes || ''
                  };
                })
              }
            : undefined
        }
      });
    }

    // Seed packages
    for (var pk = 0; pk < packages.length; pk++) {
      var pkg = packages[pk];
      await prisma.package.create({
        data: {
          id: pkg.id,
          businessId: pkg.businessId,
          name: pkg.name,
          description: pkg.description || '',
          discountPct: pkg.discountPct || 0,
          tags: pkg.tags || [],
          isActive: pkg.isActive !== false,
          items: pkg.items
            ? {
                create: pkg.items.map(function (item, idx) {
                  return {
                    id: pkg.id + '-item-' + idx,
                    serviceTypeId: item.serviceTypeId,
                    quantity: item.quantity || 0,
                    unitOverride: item.unitOverride || ''
                  };
                })
              }
            : undefined
        }
      });
    }

    // Seed projects and features
    for (var p = 0; p < sampleProjects.length; p++) {
      var project = sampleProjects[p];
      await prisma.project.create({
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          features: {
            create: project.features.map(function (feat) {
              return {
                id: feat.id,
                name: feat.name,
                summary: feat.summary,
                status: feat.status || 'in-progress'
              };
            })
          }
        }
      });
    }

    // Join assets to projects/features
    for (var a = 0; a < sampleAssets.length; a++) {
      var assetJoin = sampleAssets[a];

      if (assetJoin.projectIds) {
        for (var pj = 0; pj < assetJoin.projectIds.length; pj++) {
          await prisma.projectAsset.create({
            data: {
              projectId: assetJoin.projectIds[pj],
              assetId: assetJoin.id
            }
          });
        }
      }

      if (assetJoin.featureIds) {
        for (var fj = 0; fj < assetJoin.featureIds.length; fj++) {
          await prisma.featureAsset.create({
            data: {
              featureId: assetJoin.featureIds[fj],
              assetId: assetJoin.id
            }
          });
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(function (e) {
  console.error('Seed failed:', e);
  process.exit(1);
});
