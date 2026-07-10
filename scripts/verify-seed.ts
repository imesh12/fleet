import 'dotenv/config';

import { BackgroundJobType, prisma } from '../packages/db/src/index.js';
import { DEFAULT_PERMISSIONS, ROLE_CODES } from '../packages/shared/src/index.js';

const comingSoonModules = [
  'inventory',
  'tyres',
  'consumables',
  'attendance',
  'payroll',
  'import-export',
  'bulk-upload',
  'accounting',
  'billing',
];

const expectedBackgroundJobTypes = [
  BackgroundJobType.TRACKING_PROVIDER_SYNC,
  BackgroundJobType.TRACKING_EVALUATION,
  BackgroundJobType.GEOFENCE_EVALUATION,
  BackgroundJobType.NOTIFICATION_DELIVERY,
  BackgroundJobType.CLEANUP_EXPIRED_INVITATIONS,
  BackgroundJobType.MAINTENANCE_DUE_EVALUATION,
  BackgroundJobType.FUEL_ALERT_EVALUATION,
  BackgroundJobType.REPORT_EXPORT_PLACEHOLDER,
  BackgroundJobType.DOCUMENT_RETENTION_EVALUATION,
];

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

async function runChecks(): Promise<CheckResult[]> {
  const roleCodes = Object.values(ROLE_CODES);
  const [roles, permissionCount, superAdmin, comingSoonPages] = await Promise.all([
    prisma.role.findMany({ where: { code: { in: roleCodes } }, select: { code: true } }),
    prisma.permission.count({ where: { code: { in: DEFAULT_PERMISSIONS.map((permission) => permission.code) } } }),
    prisma.user.findUnique({ where: { email: process.env.SUPER_ADMIN_EMAIL ?? 'admin@trackigniter8.local' } }),
    prisma.appPage.findMany({
      where: { slug: { in: comingSoonModules }, status: 'COMING_SOON' },
      select: { slug: true },
    }),
  ]);

  const roleSet = new Set(roles.map((role) => role.code));
  const pageSet = new Set(comingSoonPages.map((page) => page.slug));

  return [
    {
      name: 'default roles',
      ok: roleCodes.every((roleCode) => roleSet.has(roleCode)),
      detail: `${roles.length}/${roleCodes.length} roles found`,
    },
    {
      name: 'default permissions',
      ok: permissionCount === DEFAULT_PERMISSIONS.length,
      detail: `${permissionCount}/${DEFAULT_PERMISSIONS.length} permissions found`,
    },
    {
      name: 'super admin',
      ok: Boolean(superAdmin),
      detail: superAdmin ? `found ${superAdmin.email}` : 'SUPER_ADMIN_EMAIL user not found',
    },
    {
      name: 'coming soon menu/page placeholders',
      ok: comingSoonModules.every((slug) => pageSet.has(slug)),
      detail: `${comingSoonPages.length}/${comingSoonModules.length} coming soon pages found`,
    },
    {
      name: 'background job type enum coverage',
      ok: expectedBackgroundJobTypes.every(Boolean),
      detail: `${expectedBackgroundJobTypes.length} expected job enum values available`,
    },
  ];
}

async function main() {
  const results = await runChecks();
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}`);
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
