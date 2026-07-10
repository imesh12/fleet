import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardTitle } from '@/components/ui/card';
import { comingSoonModules } from '@/lib/coming-soon';

export default async function ComingSoonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = comingSoonModules[slug];

  if (!module) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden">
        <div className="rounded-[1.6rem] bg-ink p-8 text-white">
          <p className="text-sm uppercase tracking-[0.32em] text-white/50">Coming soon</p>
          <h1 className="mt-3 font-display text-5xl">{module.title}</h1>
        </div>
        <div className="p-2">
          <CardTitle>{module.message}</CardTitle>
          <p className="mt-4 text-ink/65">
            This module is intentionally a placeholder. Stage 24 does not call any business APIs for skipped manager modules.
          </p>
          <Link className="mt-6 inline-flex rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
