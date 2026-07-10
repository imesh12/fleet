import { ModuleShell } from '@/components/module-shell';

export default function LiveTrackingPage() {
  return <ModuleShell eyebrow="Tracking" title="Live Tracking" description="Latest vehicle position shell. Map UI comes later." endpoint="/admin/tracking/vehicles/latest" />;
}
