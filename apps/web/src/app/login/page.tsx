'use client';

import { FormEvent, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/lib/api-client';

export default function LoginPage() {
  const { error, login, loading } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@trackigniter8.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    try {
      await login(emailOrUsername, password);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'Login failed');
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-cream lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex items-center justify-center px-8 py-12">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-ember">Trackigniter8</p>
          <h1 className="font-display text-6xl leading-tight text-ink">Fleet operations, rebuilt from the inside out.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
            Stage 24 connects the new backend to a modern Next.js shell: auth, RBAC navigation, dashboard status, and coming-soon handling.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-ink px-8 py-12 text-white">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/8 p-8 shadow-panel backdrop-blur">
          <h2 className="font-display text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-white/60">API: {getApiBaseUrl()}</p>

          <label className="mt-8 block text-sm font-semibold">
            Email or username
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-ink outline-none ring-ember/40 focus:ring-4"
              value={emailOrUsername}
              onChange={(event) => setEmailOrUsername(event.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-ink outline-none ring-ember/40 focus:ring-4"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          {localError || error ? <div className="mt-4 rounded-xl bg-ember/25 p-3 text-sm">{localError ?? error}</div> : null}

          <Button className="mt-6 w-full" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </section>
    </main>
  );
}
