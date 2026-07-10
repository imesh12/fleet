import { ModuleShell } from '@/components/module-shell';

export default function GeofencesPage() {
  return <ModuleShell eyebrow="Tracking" title="Geofences" description="Geofence definition shell. Runtime map editing comes later." endpoint="/admin/geofences" />;
}
