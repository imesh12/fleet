import 'dotenv/config';

import { prisma } from '../src/index.js';

import { hashPassword } from '../../auth/src/index.js';
import { getEnv } from '../../config/src/index.js';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLE_PERMISSION_MAP, ROLE_CODES } from '../../shared/src/index.js';

const DEFAULT_MENU_ITEMS = [
  ['Dashboard', 'dashboard', '/dashboard', 'dashboard', 'dashboard:read', 'ACTIVE'],
  ['IAM/Admin', 'iam-admin', '/admin/users', 'iam', 'iam:users:read', 'ACTIVE'],
  ['Organizations', 'organizations', '/admin/organizations', 'organizations', 'organizations:read', 'ACTIVE'],
  ['Customers', 'customers', '/admin/customer-accounts', 'customers', 'customer-accounts:read', 'ACTIVE'],
  ['Vendors', 'vendors', '/admin/vendors', 'vendors', 'vendors:read', 'ACTIVE'],
  ['Vehicles', 'vehicles', '/admin/vehicles', 'vehicles', 'vehicles:read', 'ACTIVE'],
  ['Drivers', 'drivers', '/admin/drivers', 'drivers', 'drivers:read', 'ACTIVE'],
  ['Trips', 'trips', '/admin/trips', 'trips', 'trips:read', 'ACTIVE'],
  ['Dispatch', 'dispatch', '/admin/dispatch-queues', 'dispatch', 'dispatch-queues:read', 'ACTIVE'],
  ['Tracking', 'tracking', '/admin/tracking/vehicles/latest', 'tracking', 'vehicle-positions:read', 'ACTIVE'],
  ['Geofences', 'geofences', '/admin/geofences', 'geofences', 'geofences:read', 'ACTIVE'],
  ['Maintenance', 'maintenance', '/admin/maintenance/due', 'maintenance', 'maintenance-due:read', 'ACTIVE'],
  ['Fuel', 'fuel', '/admin/fuel-entries', 'fuel', 'fuel-entries:read', 'ACTIVE'],
  ['Reports', 'reports', '/admin/report-definitions', 'reports', 'reports:read', 'ACTIVE'],
  ['Settings', 'settings', '/admin/settings', 'settings', 'settings:read', 'ACTIVE'],
  ['Inventory', 'inventory', '/coming-soon/inventory', 'inventory', null, 'COMING_SOON'],
  ['Tyres', 'tyres', '/coming-soon/tyres', 'tyres', null, 'COMING_SOON'],
  ['Consumables', 'consumables', '/coming-soon/consumables', 'consumables', null, 'COMING_SOON'],
  ['Attendance', 'attendance', '/coming-soon/attendance', 'attendance', null, 'COMING_SOON'],
  ['Payroll', 'payroll', '/coming-soon/payroll', 'payroll', null, 'COMING_SOON'],
  ['Import/Export', 'import-export', '/coming-soon/import-export', 'import-export', null, 'COMING_SOON'],
  ['Bulk Upload', 'bulk-upload', '/coming-soon/bulk-upload', 'bulk-upload', null, 'COMING_SOON'],
  ['Accounting', 'accounting', '/coming-soon/accounting', 'accounting', null, 'COMING_SOON'],
  ['Billing', 'billing', '/coming-soon/billing', 'billing', null, 'COMING_SOON'],
] as const;

async function seedNavigation() {
  const existingGroup = await prisma.appMenuGroup.findFirst({ where: { organizationId: null, slug: 'main' } });
  const group = existingGroup
    ? await prisma.appMenuGroup.update({
        where: { id: existingGroup.id },
        data: {
          title: 'Main',
          moduleKey: 'platform',
          status: 'ACTIVE',
          sortOrder: 0,
        },
      })
    : await prisma.appMenuGroup.create({
        data: {
          organizationId: null,
          title: 'Main',
          slug: 'main',
          moduleKey: 'platform',
          status: 'ACTIVE',
          sortOrder: 0,
          description: 'Default Trackigniter8 application navigation.',
        },
      });

  let sortOrder = 10;
  for (const [title, slug, path, moduleKey, requiredPermission, status] of DEFAULT_MENU_ITEMS) {
    const comingSoonMessage =
      status === 'COMING_SOON' ? `${title} is planned and will be available in a future Trackigniter8 stage.` : null;
    const existingPage = await prisma.appPage.findFirst({ where: { organizationId: null, slug } });
    const page = existingPage
      ? await prisma.appPage.update({
          where: { id: existingPage.id },
          data: {
            title,
            path,
            moduleKey,
            status,
            requiredPermission,
            comingSoonMessage,
            sortOrder,
          },
        })
      : await prisma.appPage.create({
          data: {
            organizationId: null,
            title,
            slug,
            path,
            moduleKey,
            status,
            requiredPermission,
            comingSoonMessage,
            sortOrder,
            description: status === 'COMING_SOON' ? `${title} placeholder page registry entry.` : `${title} page registry entry.`,
          },
        });

    const existingItem = await prisma.appMenuItem.findFirst({ where: { organizationId: null, slug } });
    if (existingItem) {
      await prisma.appMenuItem.update({
        where: { id: existingItem.id },
        data: {
          title,
          path,
          moduleKey,
          status,
          requiredPermission,
          comingSoonMessage,
          sortOrder,
          menuGroupId: group.id,
          appPageId: page.id,
        },
      });
    } else {
      await prisma.appMenuItem.create({
        data: {
          organizationId: null,
          menuGroupId: group.id,
          appPageId: page.id,
          title,
          slug,
          path,
          moduleKey,
          status,
          requiredPermission,
          comingSoonMessage,
          sortOrder,
          description: status === 'COMING_SOON' ? `${title} is coming soon.` : `${title} navigation item.`,
        },
      });
    }

    const flagKey = moduleKey.toUpperCase().replace(/-/g, '_');
    const existingFlag = await prisma.featureFlag.findFirst({ where: { organizationId: null, key: flagKey } });
    if (existingFlag) {
      await prisma.featureFlag.update({
        where: { id: existingFlag.id },
        data: {
          name: title,
          enabled: status === 'ACTIVE',
          rolloutStatus: status === 'ACTIVE' ? 'ENABLED' : 'PLANNED',
        },
      });
    } else {
      await prisma.featureFlag.create({
        data: {
          organizationId: null,
          key: flagKey,
          name: title,
          description: status === 'COMING_SOON' ? `${title} feature placeholder.` : `${title} feature flag.`,
          enabled: status === 'ACTIVE',
          rolloutStatus: status === 'ACTIVE' ? 'ENABLED' : 'PLANNED',
        },
      });
    }
    sortOrder += 10;
  }
}

async function main() {
  const env = getEnv();

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        name: permission.name,
        description: permission.description,
      },
      create: {
        code: permission.code,
        module: permission.module,
        name: permission.name,
        description: permission.description,
      },
    });
  }

  for (const roleCode of Object.values(ROLE_CODES) as Array<(typeof ROLE_CODES)[keyof typeof ROLE_CODES]>) {
    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name: roleCode.replace(/_/g, ' '),
        description: `${roleCode.replace(/_/g, ' ')} system role`,
        isSystem: true,
      },
      create: {
        code: roleCode,
        name: roleCode.replace(/_/g, ' '),
        description: `${roleCode.replace(/_/g, ' ')} system role`,
        isSystem: true,
      },
    });
  }

  for (const [roleCode, permissionCodes] of Object.entries(DEFAULT_ROLE_PERMISSION_MAP) as Array<
    [keyof typeof DEFAULT_ROLE_PERMISSION_MAP, string[]]
  >) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);
  const superAdmin = await prisma.user.upsert({
    where: { email: env.SUPER_ADMIN_EMAIL },
    update: {
      username: env.SUPER_ADMIN_USERNAME,
      firstName: env.SUPER_ADMIN_FIRST_NAME,
      lastName: env.SUPER_ADMIN_LAST_NAME,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      email: env.SUPER_ADMIN_EMAIL,
      username: env.SUPER_ADMIN_USERNAME,
      firstName: env.SUPER_ADMIN_FIRST_NAME,
      lastName: env.SUPER_ADMIN_LAST_NAME,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: ROLE_CODES.SUPER_ADMIN },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  await seedNavigation();

  console.log(`Seeded super admin: ${env.SUPER_ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
