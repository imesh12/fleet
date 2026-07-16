import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('rounded-card border border-border/70 bg-surface/92 p-5 shadow-panel', className)}>{children}</section>;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="font-display text-xl leading-tight text-ink">{children}</h2>;
}
