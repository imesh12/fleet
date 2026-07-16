import type { PrismaClient } from '../../src/index.js';

export type DbClient = PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export const DEMO_ORG_CODE = 'DEMO-TOKYO';
export const DEMO_PASSWORD = 'DemoPass123!';

export function getDemoReferenceDate(): Date {
  const source = process.env.DEMO_REFERENCE_DATE;
  const date = source ? new Date(`${source}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('DEMO_REFERENCE_DATE must be a valid YYYY-MM-DD date when provided');
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addMinutes(date: Date, minutes: number): Date {
  const next = new Date(date);
  next.setUTCMinutes(next.getUTCMinutes() + minutes);
  return next;
}

export function money(value: number): string {
  return value.toFixed(2);
}

export function decimal(value: number, digits = 7): string {
  return value.toFixed(digits);
}

export function code(prefix: string, index: number, width = 3): string {
  return `${prefix}-${String(index).padStart(width, '0')}`;
}

export function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

export function routePoint(routeIndex: number, stopIndex: number) {
  const routes = [
    [
      [35.681236, 139.767125],
      [35.698353, 139.773114],
      [35.713768, 139.777254],
      [35.714765, 139.796655],
    ],
    [
      [35.689592, 139.700413],
      [35.706032, 139.665652],
      [35.704941, 139.649909],
      [35.704699, 139.620098],
    ],
    [
      [35.628471, 139.73876],
      [35.561257, 139.716051],
      [35.549393, 139.779839],
      [35.553333, 139.781111],
    ],
    [
      [35.728926, 139.71038],
      [35.751331, 139.709315],
      [35.777709, 139.720787],
      [35.778139, 139.7208],
    ],
    [
      [35.658581, 139.745433],
      [35.665498, 139.75964],
      [35.671667, 139.765],
      [35.681236, 139.767125],
    ],
  ];
  const route = pick(routes, routeIndex);
  const base = pick(route, stopIndex);
  const wobble = routeIndex * 0.0012 + stopIndex * 0.0009;
  return {
    latitude: decimal(base[0] + wobble),
    longitude: decimal(base[1] + wobble),
  };
}

export async function upsertByUnique<T extends { id: string }>(
  model: {
    upsert(args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }): Promise<T>;
  },
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<T> {
  return model.upsert({
    where,
    create: data,
    update: data,
  });
}

export async function createManyChunked(
  model: { createMany(args: { data: Record<string, unknown>[]; skipDuplicates?: boolean }): Promise<unknown> },
  data: Record<string, unknown>[],
  chunkSize = 500,
) {
  for (let index = 0; index < data.length; index += chunkSize) {
    const chunk = data.slice(index, index + chunkSize);
    if (chunk.length > 0) {
      await model.createMany({ data: chunk, skipDuplicates: true });
    }
  }
}

export function demoMeta(extra: Record<string, unknown> = {}) {
  return { demoSeed: true, demoCode: DEMO_ORG_CODE, ...extra };
}
