import type { ReactNode } from 'react';

export function FormField({ children, hint, label, required }: { children: ReactNode; hint?: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </label>
  );
}
