import Link from 'next/link';

export function BackLink({ href, label = 'Back' }: { href: string; label?: string }) {
  return (
    <Link className="inline-flex text-sm font-semibold text-moss hover:text-ink" href={href}>
      ← {label}
    </Link>
  );
}
