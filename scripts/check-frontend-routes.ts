import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type RouteCheck = {
  route: string;
  path: string;
  exists: boolean;
  representedInNavigation: boolean;
  requiredInNavigation: boolean;
};

const rootDir = process.cwd();
const appDir = join(rootDir, 'apps', 'web', 'src', 'app', '(app)');
const docsDir = join(rootDir, 'docs', 'frontend-stage-36');

const expectedRoutes = [
  '/dashboard',
  '/admin/users',
  '/admin/roles',
  '/admin/permissions',
  '/admin/organizations',
  '/admin/customers',
  '/admin/vendors',
  '/admin/settings',
  '/admin/files',
  '/admin/jobs',
  '/admin/notifications',
  '/fleet/vehicles',
  '/fleet/drivers',
  '/fleet/assignments',
  '/operations/trips',
  '/operations/dispatch',
  '/operations/routes',
  '/tracking/live',
  '/tracking/providers',
  '/tracking/geofences',
  '/tracking/alerts',
  '/maintenance',
  '/fuel',
  '/reports',
];

const comingSoonRoutes = [
  '/coming-soon/inventory',
  '/coming-soon/tyres',
  '/coming-soon/consumables',
  '/coming-soon/attendance',
  '/coming-soon/payroll',
  '/coming-soon/import-export',
  '/coming-soon/bulk-upload',
  '/coming-soon/accounting',
  '/coming-soon/billing',
];

const optionalNavigationRoutes = new Set([
  '/admin/files',
  '/admin/jobs',
  '/admin/notifications',
  '/admin/roles',
  '/admin/permissions',
  '/fleet/assignments',
  '/operations/routes',
  '/tracking/providers',
  '/tracking/alerts',
]);

function routeToPagePath(route: string) {
  if (route.startsWith('/coming-soon/')) {
    return join(appDir, 'coming-soon', '[slug]', 'page.tsx');
  }
  return join(appDir, ...route.split('/').filter(Boolean), 'page.tsx');
}

const navigationSources = [
  join(rootDir, 'apps', 'web', 'src', 'lib', 'coming-soon.ts'),
  join(rootDir, 'apps', 'web', 'src', 'components', 'sidebar.tsx'),
  join(rootDir, 'packages', 'db', 'prisma', 'seed.ts'),
]
  .filter(existsSync)
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

const checks: RouteCheck[] = [...expectedRoutes, ...comingSoonRoutes].map((route) => {
  const path = routeToPagePath(route);
  const requiredInNavigation = !optionalNavigationRoutes.has(route);
  return {
    route,
    path,
    exists: existsSync(path),
    representedInNavigation: navigationSources.includes(route) || route.startsWith('/coming-soon/'),
    requiredInNavigation,
  };
});

const failures = checks.filter((check) => !check.exists || (check.requiredInNavigation && !check.representedInNavigation));
mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, 'frontend-route-verification.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2)}\n`
);
writeFileSync(
  join(docsDir, 'frontend-route-verification.md'),
  [
    '# Frontend Route Verification',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| Route | Page exists | Navigation represented |',
    '| --- | --- | --- |',
    ...checks.map((check) => `| \`${check.route}\` | ${check.exists ? 'yes' : 'no'} | ${check.representedInNavigation ? 'yes' : check.requiredInNavigation ? 'no' : 'optional'} |`),
    '',
  ].join('\n')
);

if (failures.length > 0) {
  console.error(`Frontend route verification failed: ${failures.map((failure) => failure.route).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Frontend route verification passed for ${checks.length} routes.`);
}
