import { ModuleShell } from '@/components/module-shell';

export default function TripsPage() {
  return <ModuleShell eyebrow="Operations" title="Trips" description="Executed trip lifecycle shell." endpoint="/admin/trips" />;
}
