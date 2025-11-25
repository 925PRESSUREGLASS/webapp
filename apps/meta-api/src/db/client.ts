import { PrismaClient as PrismaClientDefault } from '@prisma/client';
import { PrismaClient as PrismaClientEdge } from '@prisma/client/edge';
import withAccelerate from '@prisma/extension-accelerate';
import { env } from '../config/env';

var prisma: PrismaClientDefault | any = null;

function getPrismaClient() {
  var accelerateUrl = env.PRISMA_ACCELERATE_URL || process.env.PRISMA_ACCELERATE_URL;

  if (!env.DATABASE_URL && !accelerateUrl) {
    return null;
  }

  if (prisma) {
    return prisma;
  }

  // Prefer Accelerate if provided
  if (accelerateUrl) {
    prisma = (new (PrismaClientEdge as any)({
      datasourceUrl: accelerateUrl
    }) as any).$extends(withAccelerate({}));
    return prisma;
  }

  prisma = new PrismaClientDefault({});
  return prisma;
}

export { getPrismaClient };
