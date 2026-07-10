export function InlineFormError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <div className="rounded-2xl border border-ember/25 bg-ember/10 px-4 py-3 text-sm font-semibold text-ember">{message}</div>;
}
