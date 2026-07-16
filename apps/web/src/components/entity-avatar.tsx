import { cn } from '@/lib/utils';

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TI';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function EntityAvatar({
  className,
  imageUrl,
  label,
  shape = 'circle',
  size = 'md',
}: {
  className?: string;
  imageUrl?: string | null;
  label: string;
  shape?: 'circle' | 'rounded';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-base',
    lg: 'h-24 w-24 text-2xl',
    xl: 'h-32 w-32 text-3xl',
  }[size];

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-white/30 bg-gradient-to-br from-info/20 via-surface to-warning/20 font-display font-bold text-ink shadow-lift',
        sizeClass,
        shape === 'circle' ? 'rounded-full' : 'rounded-[1.5rem]',
        className,
      )}
      aria-label={label}
    >
      {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span>{initialsFromName(label)}</span>}
    </div>
  );
}

export function DriverAvatar(props: Omit<Parameters<typeof EntityAvatar>[0], 'shape'>) {
  return <EntityAvatar {...props} shape="circle" />;
}

export function InitialsAvatar(props: Omit<Parameters<typeof EntityAvatar>[0], 'imageUrl'>) {
  return <EntityAvatar {...props} imageUrl={null} />;
}
