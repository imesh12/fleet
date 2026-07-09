import type { FastifyReply } from 'fastify';

export function sendSuccess<T>(reply: FastifyReply, data: T, meta?: Record<string, unknown>) {
  return reply.send({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function buildPaginationMeta(input: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const pageCount = input.total === 0 ? 0 : Math.ceil(input.total / input.pageSize);

  return {
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: input.total,
      pageCount,
      hasNextPage: input.page < pageCount,
      hasPreviousPage: input.page > 1 && pageCount > 0,
    },
  };
}
