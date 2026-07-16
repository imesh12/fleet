'use client';

import { useEffect, useState } from 'react';

import { DataState } from '@/components/data-state';
import { StatusActionBar } from '@/components/status-action-bar';
import { useToast } from '@/components/toast-provider';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList, post } from '@/lib/api-client';

type SessionRecord = {
  id: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function SessionManager({ userId }: { userId: string }) {
  const { notify } = useToast();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const response = await getList<SessionRecord>('/admin/sessions', { userId, pageSize: 100 });
      setSessions(response.data.items);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, [userId]);

  async function revokeAll() {
    try {
      await post('/admin/sessions/revoke-all', { userId, reason: 'frontend_admin_revoke_all' });
      notify('All sessions revoked');
      await loadSessions();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Active sessions</CardTitle>
          <p className="mt-2 text-sm text-ink/60">Revoke one session or every active refresh token for this user.</p>
        </div>
        <button className="rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!sessions.length} onClick={() => void revokeAll()}>
          Revoke all
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {loading ? <DataState state="loading" message="Loading sessions..." /> : null}
        {error ? <DataState state="error" message={error} /> : null}
        {!loading && !error && !sessions.length ? <DataState state="empty" message="No active sessions." /> : null}
        {sessions.map((session) => (
          <div key={session.id} className="rounded-3xl border border-ink/10 bg-white/65 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-ink/55">{session.tokenId ?? session.id}</p>
                <p className="mt-1 text-sm text-ink/70">Created {session.createdAt ? new Date(session.createdAt).toLocaleString() : '-'}</p>
                <p className="text-sm text-ink/70">Expires {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : '-'}</p>
                <p className="mt-2 text-xs text-ink/45">{session.ipAddress ?? 'No IP'} · {session.userAgent ?? 'No user agent'}</p>
              </div>
              <StatusActionBar actions={[{ label: 'Revoke session', path: `/admin/sessions/${session.id}/revoke`, payload: { reason: 'frontend_admin_revoke' }, tone: 'danger' }]} onChanged={loadSessions} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
