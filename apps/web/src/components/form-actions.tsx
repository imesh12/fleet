import { Button } from '@/components/ui/button';

export function FormActions({ onCancel, saving, submitLabel }: { onCancel: () => void; saving: boolean; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
}
