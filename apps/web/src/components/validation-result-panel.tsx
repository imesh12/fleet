import { StatusBadge } from '@/components/status-badge';
import { Card, CardTitle } from '@/components/ui/card';

type ValidationResult = {
  valid?: boolean;
  ready?: boolean;
  blockers?: string[];
  warnings?: string[];
  checks?: Array<{ code?: string; label?: string; passed?: boolean; severity?: string; details?: string }>;
  readinessResult?: ValidationResult;
  policyChecks?: Array<{ code?: string; label?: string; passed?: boolean; severity?: string; details?: string }>;
};

function resultReady(result: ValidationResult) {
  return result.valid ?? result.ready ?? result.readinessResult?.ready ?? false;
}

export function ValidationResultPanel({ result, title = 'Validation result' }: { result: ValidationResult | null; title?: string }) {
  if (!result) {
    return (
      <Card>
        <CardTitle>{title}</CardTitle>
        <p className="mt-3 text-sm text-ink/60">Run validation to see readiness blockers and warnings.</p>
      </Card>
    );
  }

  const blockers = result.blockers ?? result.readinessResult?.blockers ?? [];
  const warnings = result.warnings ?? result.readinessResult?.warnings ?? [];
  const checks = [...(result.checks ?? []), ...(result.readinessResult?.checks ?? []), ...(result.policyChecks ?? [])];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <StatusBadge value={resultReady(result) ? 'READY' : 'BLOCKED'} />
      </div>
      {blockers.length ? <p className="mt-3 text-sm font-semibold text-ember">Blockers: {blockers.join('; ')}</p> : null}
      {warnings.length ? <p className="mt-2 text-sm font-semibold text-amber-700">Warnings: {warnings.join('; ')}</p> : null}
      <div className="mt-4 grid gap-2">
        {checks.map((check, index) => (
          <div key={`${check.code ?? index}`} className="rounded-2xl bg-ink/5 px-4 py-3 text-sm">
            <span className="font-semibold text-ink">{check.label ?? check.code ?? 'Check'}</span>
            <span className="ml-2 text-ink/60">{check.passed ? 'passed' : check.details ?? check.severity ?? 'needs attention'}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
