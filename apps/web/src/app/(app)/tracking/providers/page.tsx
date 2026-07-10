import { ModuleShell } from '@/components/module-shell';

export default function TrackingProvidersPage() {
  return <ModuleShell eyebrow="Tracking" title="Tracking Providers" description="Provider-neutral GPS integration shell." endpoint="/admin/tracking-providers" />;
}
