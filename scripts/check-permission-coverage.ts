import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

type CoverageItem = {
  method: string;
  path: string;
  module: string;
  source: string;
  line: number;
  authRequired: boolean;
  permission: string | null;
  expectedPermission: boolean;
  status: 'covered' | 'missing-permission' | 'public-allowed' | 'authenticated-only';
};

const rootDir = process.cwd();
const sourceRoot = join(rootDir, 'apps', 'api', 'src', 'modules');
const docsDir = join(rootDir, 'docs', 'api');
const routeCallPattern = /fastify\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const publicAdminRoutes = new Set<string>(['POST /admin/organization-invitations/accept']);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('routes.ts') ? [fullPath] : [];
  });
}

function lineForOffset(content: string, offset: number) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function inferModule(filePath: string) {
  return dirname(relative(sourceRoot, filePath).replace(/\\/g, '/')).replace(/\.$/, '') || 'root';
}

function detectRouteWindow(content: string, matchIndex: number) {
  const nextMatch = content.slice(matchIndex + 1).search(/fastify\.(get|post|put|patch|delete)\(\s*['"`]/);
  const end = nextMatch === -1 ? content.length : matchIndex + 1 + nextMatch;
  return content.slice(matchIndex, end);
}

function scanCoverage(): CoverageItem[] {
  const items: CoverageItem[] = [];

  for (const filePath of walk(sourceRoot)) {
    if (!filePath.endsWith('routes.ts')) {
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    for (const match of content.matchAll(routeCallPattern)) {
      const method = match[1]?.toUpperCase() ?? 'GET';
      const path = match[2] ?? '/';
      const window = detectRouteWindow(content, match.index ?? 0);
      const permission = window.match(/requirePermission\(\s*['"`]([^'"`]+)['"`]\s*\)/)?.[1] ?? null;
      const authRequired = window.includes('fastify.authenticate');
      const expectedPermission = path.startsWith('/admin/') && !publicAdminRoutes.has(`${method} ${path}`);
      const status = expectedPermission && permission
        ? 'covered'
        : expectedPermission
          ? 'missing-permission'
          : authRequired
            ? 'authenticated-only'
            : 'public-allowed';

      items.push({
        method,
        path: `/api/v1${path}`,
        module: inferModule(filePath),
        source: relative(rootDir, filePath).replace(/\\/g, '/'),
        line: lineForOffset(content, match.index ?? 0),
        authRequired,
        permission,
        expectedPermission,
        status,
      });
    }
  }

  return items.sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
}

function writeCoverage(items: CoverageItem[]) {
  mkdirSync(docsDir, { recursive: true });
  const missing = items.filter((item) => item.status === 'missing-permission');
  const covered = items.filter((item) => item.status === 'covered');

  const lines = [
    '# Permission Coverage',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    `Admin routes covered: ${covered.length}`,
    `Admin routes missing permission guards: ${missing.length}`,
    '',
    '## Missing Permission Guards',
    '',
    missing.length === 0 ? 'No missing admin permission guards detected.' : '| Method | Path | Source |',
    missing.length === 0 ? '' : '| --- | --- | --- |',
    ...missing.map((item) => `${item.method} | \`${item.path}\` | ${item.source}:${item.line}`),
    '',
    '## Full Coverage Table',
    '',
    '| Method | Path | Module | Auth | Permission | Status | Source |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...items.map((item) =>
      [
        item.method,
        `\`${item.path}\``,
        item.module,
        item.authRequired ? 'yes' : 'no',
        item.permission ? `\`${item.permission}\`` : '',
        item.status,
        `${item.source}:${item.line}`,
      ].join(' | ')
    ),
    '',
  ];

  writeFileSync(join(docsDir, 'permission-coverage.md'), `${lines.join('\n')}\n`);
}

const coverage = scanCoverage();
writeCoverage(coverage);
const missingCount = coverage.filter((item) => item.status === 'missing-permission').length;
console.log(`Checked permission coverage. Missing admin guards: ${missingCount}.`);
