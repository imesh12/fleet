import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

export function ConfirmDialog({
  actionLabel,
  message,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  actionLabel: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardTitle>{title}</CardTitle>
        <p className="mt-3 text-sm text-ink/65">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {actionLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
