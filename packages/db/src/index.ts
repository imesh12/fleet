import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  __trackigniter8Prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__trackigniter8Prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__trackigniter8Prisma = prisma;
}

// Re-export the generated Prisma client types for the workspace packages.
export * from '@prisma/client';
