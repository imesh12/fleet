import { DataState } from '@/components/data-state';

export function ErrorAlert({ message }: { message: string }) {
  return <DataState state="error" message={message} />;
}
