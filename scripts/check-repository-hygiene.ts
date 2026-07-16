import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Finding = {
  severity: 'error' | 'warning';
  category: string;
  path: string;
  detail: string;
};

const rootDir = process.cwd();

function gitLines(args: string[]) {
  return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const tracked = gitLines(['ls-files']);
const findings: Finding[] = [];

const forbiddenTrackedExact = new Set([
  '.env',
  '.env.local',
  '.env.production',
  'apps/web/.env.local',
  'settings/websitesetting.html',
  'settings/smsconfig.html',
  'whatsapp_settings.html',
]);

for (const path of tracked) {
  const normalized = path.replace(/\\/g, '/');
  if (forbiddenTrackedExact.has(normalized)) {
    findings.push({ severity: 'error', category: 'forbidden-tracked-path', path: normalized, detail: 'Sensitive or local-only path is tracked' });
  }
  if (/(\.log|\.tmp|\.temp|\.bak|\.backup)$/i.test(normalized)) {
    findings.push({ severity: 'error', category: 'tracked-temporary-artifact', path: normalized, detail: 'Temporary/log artifact is tracked' });
  }
  if (/(^|\/)(node_modules|\.next|dist|coverage)\//.test(normalized)) {
    findings.push({ severity: 'error', category: 'tracked-build-artifact', path: normalized, detail: 'Build/dependency artifact is tracked' });
  }
  if (/\.(sqlite|sqlite3|db)$/i.test(normalized) && !normalized.endsWith('schema.prisma')) {
    findings.push({ severity: 'error', category: 'tracked-local-database', path: normalized, detail: 'Local database artifact is tracked' });
  }
}

const placeholderOnlyFiles = ['.env.example', '.env.production.example', 'apps/web/.env.example', 'apps/web/.env.production.example'];
const secretLikePatterns = [
  { name: 'Google API key shape', pattern: /AIza[0-9A-Za-z_-]{20,}/ },
  { name: 'Twilio Account SID shape', pattern: /AC[0-9a-fA-F]{32}/ },
  { name: 'Private key header', pattern: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
];

for (const file of placeholderOnlyFiles) {
  const fullPath = join(rootDir, file);
  if (!existsSync(fullPath)) continue;
  const content = readFileSync(fullPath, 'utf8');
  for (const check of secretLikePatterns) {
    if (check.pattern.test(content)) {
      findings.push({ severity: 'error', category: 'secret-like-example-value', path: file, detail: `${check.name} found in example file` });
    }
  }
}

const activeSourceRoots = ['apps', 'packages', 'scripts'];
for (const path of tracked) {
  const normalized = path.replace(/\\/g, '/');
  if (!activeSourceRoots.some((root) => normalized.startsWith(`${root}/`))) continue;
  if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|prisma)$/.test(normalized)) continue;
  const content = readFileSync(join(rootDir, normalized), 'utf8');
  for (const check of secretLikePatterns) {
    if (check.pattern.test(content)) {
      findings.push({ severity: 'error', category: 'secret-like-active-source-value', path: normalized, detail: `${check.name} found in active source` });
    }
  }
}

if (findings.length === 0) {
  console.log('Repository hygiene check passed. No tracked sensitive/local artifacts detected.');
} else {
  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.category}: ${finding.path} - ${finding.detail}`);
  }
  process.exitCode = findings.some((finding) => finding.severity === 'error') ? 1 : 0;
}
