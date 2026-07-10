import type { ReactNode } from 'react';

import { Card, CardTitle } from '@/components/ui/card';

export function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
