import 'dotenv/config';

import { prisma } from '../src/index.js';

import { hashPassword } from '../../auth/src/index.js';
import { getEnv } from '../../config/src/index.js';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLE_PERMISSION_MAP, ROLE_CODES } from '../../shared/src/index.js';

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
