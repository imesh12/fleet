import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

type EnvelopeFinding = {
  method: string;
  path: string;
  source: string;
  line: number;
  status: 'enveloped' | 'raw-allowed' | 'check-needed';
  detail: string;
};

const rootDir = process.cwd();
const sourceRoot = join(rootDir, 'apps', 'api', 'src', 'modules');
const docsDir = join(rootDir, 'docs', 'api');
const routeCallPattern = /fastify\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const rawAllowedPaths = new Set(['/api/v1/openapi.json', '/api/v1/docs']);

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

function detectRouteWindow(content: string, matchIndex: number) {
  const nextMatch = content.slice(matchIndex + 1).search(/fastify\.(get|post|put|patch|delete)\(\s*['"`]/);
  const end = nextMatch === -1 ? content.length : matchIndex + 1 + nextMatch;
  return content.slice(matchIndex, end);
}

function scan(): EnvelopeFinding[] {
  const findings: EnvelopeFinding[] = [];

  for (const filePath of walk(sourceRoot)) {
    if (!filePath.endsWith('routes.ts')) {
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    for (const match of content.matchAll(routeCallPattern)) {
      const method = match[1]?.toUpperCase() ?? 'GET';
      const path = `/api/v1${match[2] ?? '/'}`;
      const window = detectRouteWindow(content, match.index ?? 0);
      const usesEnvelope = window.includes('.success(');
      const rawAllowed = rawAllowedPaths.has(path);

      findings.push({
        method,
        path,
        source: relative(rootDir, filePath).replace(/\\/g, '/'),
        line: lineForOffset(content, match.index ?? 0),
        status: usesEnvelope ? 'enveloped' : rawAllowed ? 'raw-allowed' : 'check-needed',
        detail: usesEnvelope ? 'uses reply.success' : rawAllowed ? 'contract/documentation endpoint' : 'no reply.success detected in route window',
      });
    }
  }

  return findings.sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
}

const findings = scan();
const needsReview = findings.filter((finding) => finding.status === 'check-needed');

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, 'response-envelope-check.md'),
  [
    '# Response Envelope Check',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    `Routes scanned: ${findings.length}`,
    `Routes needing review: ${needsReview.length}`,
    '',
    '## Findings Needing Review',
    '',
    needsReview.length === 0 ? 'No envelope consistency issues detected.' : '| Method | Path | Source | Detail |',
    needsReview.length === 0 ? '' : '| --- | --- | --- | --- |',
    ...needsReview.map((finding) => `${finding.method} | \`${finding.path}\` | ${finding.source}:${finding.line} | ${finding.detail}`),
    '',
    '## Full Table',
    '',
    '| Method | Path | Status | Source |',
    '| --- | --- | --- | --- |',
    ...findings.map((finding) => `${finding.method} | \`${finding.path}\` | ${finding.status} | ${finding.source}:${finding.line}`),
    '',
  ].join('\n')
);

console.log(`Checked response envelopes. Routes needing review: ${needsReview.length}.`);
