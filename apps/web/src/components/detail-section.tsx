import type { ReactNode } from 'react';

import { Card, CardTitle } from '@/components/ui/card';

export function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <CardTitle>{title}</CardTitle>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
