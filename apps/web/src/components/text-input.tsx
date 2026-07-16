import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full rounded-xl border border-border/80 bg-elevated px-4 py-3 text-sm text-ink outline-none ring-info/20 transition placeholder:text-ink/35 focus:border-info/40 focus:ring-4 disabled:bg-ink/5 disabled:text-ink/45', className)}
      {...props}
    />
  );
}
