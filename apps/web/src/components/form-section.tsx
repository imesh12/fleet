import type { ReactNode } from 'react';

import { Card, CardTitle } from '@/components/ui/card';

export function FormSection({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {description ? <p className="mt-2 text-sm text-ink/60">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </Card>
  );
}
