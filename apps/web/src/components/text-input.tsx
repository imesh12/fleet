import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-ember/30 transition focus:ring-4', className)}
      {...props}
    />
  );
}
