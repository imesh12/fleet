import type { FastifyPluginAsync } from 'fastify';
import { ROLE_CODES } from '@trackigniter8/shared';

export const navigationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/navigation/menu', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.currentUser!;
    const permissions = new Set(user.permissions);
    const isSuperAdmin = user.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = request.headers['x-organization-id']?.toString();

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    const groups = await fastify.prisma.appMenuGroup.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMING_SOON'] },
        ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : { organizationId: null }),
      },
      include: {
        menuItems: {
          where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
          include: { appPage: true },
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    const itemsAllowed = (requiredPermission: string | null) => isSuperAdmin || !requiredPermission || permissions.has(requiredPermission);

    const filtered = groups
      .filter((group) => itemsAllowed(group.requiredPermission))
      .map((group) => ({
        id: group.id,
        title: group.title,
        slug: group.slug,
        path: group.path,
        icon: group.icon,
        sortOrder: group.sortOrder,
        status: group.status,
        moduleKey: group.moduleKey,
        description: group.description,
        comingSoonMessage: group.comingSoonMessage,
        items: group.menuItems
          .filter((item) => itemsAllowed(item.requiredPermission))
          .map((item) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            path: item.path ?? item.appPage?.path ?? null,
            icon: item.icon,
            sortOrder: item.sortOrder,
            status: item.status,
            requiredPermission: item.requiredPermission,
            moduleKey: item.moduleKey,
            description: item.description,
            comingSoonMessage: item.comingSoonMessage,
            page: item.appPage
              ? {
                  id: item.appPage.id,
                  title: item.appPage.title,
                  slug: item.appPage.slug,
                  path: item.appPage.path,
                  status: item.appPage.status,
                  moduleKey: item.appPage.moduleKey,
                  comingSoonMessage: item.appPage.comingSoonMessage,
                }
              : null,
          })),
      }))
      .filter((group) => group.items.length > 0 || group.status === 'COMING_SOON');

    return reply.success({ items: filtered });
  });
};
