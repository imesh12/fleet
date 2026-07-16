'use client';

import { Button } from '@/components/ui/button';

export function AutoRefreshControl({ enabled, onRefresh, onToggle }: { enabled: boolean; onRefresh: () => void; onToggle: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" onClick={onRefresh}>
        Refresh
      </Button>
      <Button type="button" variant={enabled ? 'primary' : 'ghost'} onClick={onToggle}>
        Auto-refresh {enabled ? 'on' : 'off'}
      </Button>
    </div>
  );
}
