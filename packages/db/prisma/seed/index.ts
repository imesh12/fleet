import type { PrismaClient } from '../../src/index.js';

import { seedDemoCompany } from './demo-company.js';

export { seedDemoCompany };

export type DemoSeedSummary = Awaited<ReturnType<typeof seedDemoCompany>>;

export async function runDemoSeed(prisma: PrismaClient) {
  return seedDemoCompany(prisma);
}
