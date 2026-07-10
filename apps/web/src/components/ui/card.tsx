import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('rounded-3xl border border-ink/10 bg-linen p-5 shadow-panel', className)}>{children}</section>;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="font-display text-xl text-ink">{children}</h2>;
}
