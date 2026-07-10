import { Card, CardTitle } from '@/components/ui/card';

type DataStateProps = {
  state: 'loading' | 'error' | 'empty';
  title?: string | undefined;
  message?: string | undefined;
};

export function DataState({ message, state, title }: DataStateProps) {
  const defaults = {
    loading: ['Loading data', 'Fetching the latest backend response...'],
    error: ['Something needs attention', 'The backend request could not be completed.'],
    empty: ['No records yet', 'This shell is connected, but there are no records to show yet.'],
  } satisfies Record<DataStateProps['state'], [string, string]>;

  const [defaultTitle, defaultMessage] = defaults[state];

  const cardClassName = state === 'error' ? 'border-ember/30 bg-ember/10 text-ember' : '';

  return (
    <Card className={cardClassName}>
      <CardTitle>{title ?? defaultTitle}</CardTitle>
      <p className="mt-2 text-sm opacity-75">{message ?? defaultMessage}</p>
    </Card>
  );
}
