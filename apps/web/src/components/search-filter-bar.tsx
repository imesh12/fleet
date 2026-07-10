import { Button } from '@/components/ui/button';
import { SelectInput } from '@/components/select-input';
import { TextInput } from '@/components/text-input';

export function SearchFilterBar({
  createLabel = 'Create',
  onCreate,
  onSearchChange,
  onStatusChange,
  search,
  status,
}: {
  createLabel?: string;
  onCreate?: (() => void) | undefined;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  search: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-linen p-4 shadow-panel lg:flex-row lg:items-center">
      <TextInput placeholder="Search by name, code, email..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
      <SelectInput className="lg:w-56" value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="SUSPENDED">Suspended</option>
      </SelectInput>
      {onCreate ? (
        <Button className="lg:w-44" onClick={onCreate}>
          {createLabel}
        </Button>
      ) : null}
    </div>
  );
}
