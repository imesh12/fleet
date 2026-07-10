import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

type RouteInventoryItem = {
  method: string;
  path: string;
  module: string;
  source: string;
  line: number;
  authRequired: boolean;
  permission: string | null;
  status: 'public' | 'authenticated' | 'guarded';
};

const rootDir = process.cwd();
const sourceRoot = join(rootDir, 'apps', 'api', 'src', 'modules');
const docsDir = join(rootDir, 'docs', 'api');
const apiPrefix = '/api/v1';
const routeCallPattern = /fastify\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : [];
  });
}

function lineForOffset(content: string, offset: number) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function inferModule(filePath: string) {
  const relativePath = relative(sourceRoot, filePath).replace(/\\/g, '/');
  return dirname(relativePath).replace(/\.$/, '').replace(/\/routes$/, '') || 'root';
}

function normalizePath(path: string) {
  return `${apiPrefix}${path}`.replace(/\/+/g, '/').replace(':/', '://');
}

function detectRouteWindow(content: string, matchIndex: number) {
  const nextMatch = content.slice(matchIndex + 1).search(/fastify\.(get|post|put|patch|delete)\(\s*['"`]/);
  const end = nextMatch === -1 ? content.length : matchIndex + 1 + nextMatch;
  return content.slice(matchIndex, end);
}

function scanRoutes(): RouteInventoryItem[] {
  const items: RouteInventoryItem[] = [];

  for (const filePath of walk(sourceRoot)) {
    if (!filePath.endsWith('routes.ts')) {
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    for (const match of content.matchAll(routeCallPattern)) {
      const method = match[1]?.toUpperCase() ?? 'GET';
      const rawPath = match[2] ?? '/';
      const window = detectRouteWindow(content, match.index ?? 0);
      const permission = window.match(/requirePermission\(\s*['"`]([^'"`]+)['"`]\s*\)/)?.[1] ?? null;
      const authRequired = window.includes('fastify.authenticate');
      const status = permission ? 'guarded' : authRequired ? 'authenticated' : 'public';

      items.push({
        method,
        path: normalizePath(rawPath),
        module: inferModule(filePath),
        source: relative(rootDir, filePath).replace(/\\/g, '/'),
        line: lineForOffset(content, match.index ?? 0),
        authRequired,
        permission,
        status,
      });
    }
  }

  return items.sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
}

function writeInventory(items: RouteInventoryItem[]) {
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'route-inventory.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), routes: items }, null, 2)}\n`);

  const modules = new Map<string, RouteInventoryItem[]>();
  for (const item of items) {
    const moduleItems = modules.get(item.module) ?? [];
    moduleItems.push(item);
    modules.set(item.module, moduleItems);
  }

  const lines = [
    '# API Route Inventory',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    `Total routes: ${items.length}`,
    '',
    '## Modules',
    '',
    ...Array.from(modules.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([moduleName, moduleItems]) => [
        `### ${moduleName}`,
        '',
        `Routes: ${moduleItems.length}`,
        '',
        '| Method | Path | Auth | Permission | Status | Source |',
        '| --- | --- | --- | --- | --- | --- |',
        ...moduleItems.map((item) =>
          [
            item.method,
            `\`${item.path}\``,
            item.authRequired ? 'yes' : 'no',
            item.permission ? `\`${item.permission}\`` : '',
            item.status,
            `${item.source}:${item.line}`,
          ].join(' | ')
        ),
        '',
      ]),
    '',
  ];

  writeFileSync(join(docsDir, 'route-inventory.md'), `${lines.join('\n')}\n`);
}

const routes = scanRoutes();
writeInventory(routes);
console.log(`Generated ${routes.length} route inventory entries.`);
