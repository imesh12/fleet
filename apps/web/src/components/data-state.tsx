import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type DataStateProps = {
  state: 'loading' | 'error' | 'empty';
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
};

export function DataState({ message, onRetry, state, title }: DataStateProps) {
  const defaults = {
    loading: ['Loading data', 'Fetching the latest backend response...'],
    error: ['Something needs attention', 'The backend request could not be completed.'],
    empty: ['No records yet', 'This shell is connected, but there are no records to show yet.'],
  } satisfies Record<DataStateProps['state'], [string, string]>;

  const [defaultTitle, defaultMessage] = defaults[state];

  const cardClassName = state === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : state === 'loading' ? 'animate-pulse' : '';

  return (
    <Card className={cardClassName}>
      <CardTitle>{title ?? defaultTitle}</CardTitle>
      <p className="mt-2 text-sm opacity-75">{message ?? defaultMessage}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button type="button" variant="ghost" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
