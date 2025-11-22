import { PrismaClient as PrismaClientDefault } from '@prisma/client';
import { PrismaClient as PrismaClientEdge } from '@prisma/client/edge';
import withAccelerate from '@prisma/extension-accelerate';

var prisma: PrismaClientDefault | any = null;

function getPrismaClient() {
  if (!process.env.DATABASE_URL && !process.env.PRISMA_ACCELERATE_URL) {
    return null;
  }

  if (prisma) {
    return prisma;
  }

  // Prefer Accelerate if provided
  if (process.env.PRISMA_ACCELERATE_URL) {
    prisma = (new (PrismaClientEdge as any)({
      datasourceUrl: process.env.PRISMA_ACCELERATE_URL
    }) as any).$extends(withAccelerate({}));
    return prisma;
  }

  prisma = new PrismaClientDefault({});
  return prisma;
}

export { getPrismaClient };
