import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function SelectInput({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full rounded-xl border border-border/80 bg-elevated px-4 py-3 text-sm font-semibold text-ink outline-none ring-info/20 transition focus:border-info/40 focus:ring-4 disabled:bg-ink/5 disabled:text-ink/45', className)}
      {...props}
    >
      {children}
    </select>
  );
}
