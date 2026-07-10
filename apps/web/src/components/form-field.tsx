import type { ReactNode } from 'react';

export function FormField({ children, hint, label }: { children: ReactNode; hint?: string; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </label>
  );
}
