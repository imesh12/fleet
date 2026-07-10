import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function SelectInput({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none ring-ember/30 transition focus:ring-4', className)}
      {...props}
    >
      {children}
    </select>
  );
}
