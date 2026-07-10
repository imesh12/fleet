import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('min-h-24 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-ember/30 transition focus:ring-4', className)}
      {...props}
    />
  );
}
