'use client';

import { useEffect, useState } from 'react';

import { DataState } from '@/components/data-state';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList } from '@/lib/api-client';

export function ReadEndpointCard({ description, endpoint, responseKey, title }: { description?: string; endpoint: string; responseKey?: string; title: string }) {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getList(endpoint, { page: 1, pageSize: 20 })
      .then((response) => setPayload(responseKey ? response.data[responseKey as keyof typeof response.data] : response.data))
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [endpoint, responseKey]);

  if (loading) return <DataState state="loading" message={`Loading ${title.toLowerCase()}...`} />;
  if (error) return <DataState state="error" message={error} />;

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {description ? <p className="mt-2 text-sm text-ink/60">{description}</p> : null}
      <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(payload ?? {}, null, 2)}</pre>
    </Card>
  );
}
