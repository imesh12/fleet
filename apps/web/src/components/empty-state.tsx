import { DataState } from '@/components/data-state';

export function EmptyState({ message }: { message?: string }) {
  return <DataState state="empty" message={message} />;
}
