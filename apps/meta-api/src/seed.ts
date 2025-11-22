import { PrismaClient } from '@prisma/client';
import { sampleProjects, sampleAssets } from '../../domain/sampleData';

async function run(): Promise<void> {
  var prisma = new PrismaClient();
  try {
    // Reset tables in order of dependencies
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
