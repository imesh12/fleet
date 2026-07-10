import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }>;

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-ink text-white shadow-sm hover:bg-slateblue',
        variant === 'ghost' && 'bg-transparent text-ink hover:bg-ink/10',
        variant === 'danger' && 'bg-ember text-white hover:bg-ember/90',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
