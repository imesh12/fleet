export function SecretValueMask({ hint }: { hint?: unknown }) {
  return <span className="font-mono text-sm text-ink/65">{hint ? String(hint) : '********'}</span>;
}
