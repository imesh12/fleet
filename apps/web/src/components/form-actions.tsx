import { Button } from '@/components/ui/button';

export function FormActions({ onCancel, saving, submitLabel }: { onCancel: () => void; saving: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-3 border-t border-ink/10 pt-4">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
}
