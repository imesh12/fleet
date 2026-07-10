import { Card, CardTitle } from '@/components/ui/card';

export function ComingSoonPanel({ message = 'Create/Edit workflows are coming in the next frontend stage.' }: { message?: string }) {
  return (
    <Card className="border-dashed">
      <CardTitle>Create/Edit coming in next stage</CardTitle>
      <p className="mt-2 text-sm text-ink/60">{message}</p>
    </Card>
  );
}
