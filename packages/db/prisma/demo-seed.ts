import 'dotenv/config';

import { prisma } from '../src/index.js';
import { seedDemoCompany } from './seed/index.js';

async function main() {
  console.time('demo-seed');
  const summary = await seedDemoCompany(prisma);
  console.timeEnd('demo-seed');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error('Demo seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
