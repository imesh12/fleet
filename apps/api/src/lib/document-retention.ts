import type { FastifyInstance } from 'fastify';

type App = FastifyInstance;

export async function evaluateDocumentRetention(
  fastify: App,
  input: {
    organizationId?: string;
  } = {}
) {
  const now = new Date();
  const policies = await fastify.prisma.documentRetentionPolicy.findMany({
    where: {
      status: 'ACTIVE',
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    },
  });

  let archivedCandidateCount = 0;
  let expiredCandidateCount = 0;

  for (const policy of policies) {
    const archiveBefore = policy.archiveAfterDays ? new Date(now.getTime() - policy.archiveAfterDays * 24 * 60 * 60 * 1000) : null;
    const expireBefore = new Date(now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000);
    const entityFilter = policy.entityType ? { attachments: { some: { entityType: policy.entityType } } } : {};

    if (archiveBefore) {
      archivedCandidateCount += await fastify.prisma.fileObject.count({
        where: {
          organizationId: policy.organizationId,
          status: 'ACTIVE',
          createdAt: { lt: archiveBefore },
          ...entityFilter,
        },
      });
    }

    expiredCandidateCount += await fastify.prisma.fileObject.count({
      where: {
        organizationId: policy.organizationId,
        status: { in: ['ACTIVE', 'ARCHIVED'] },
        createdAt: { lt: expireBefore },
        ...entityFilter,
      },
    });
  }

  return {
    policyCount: policies.length,
    archivedCandidateCount,
    expiredCandidateCount,
    note: 'Stage 21 logs retention candidates only; no physical or metadata deletion is performed.',
  };
}
