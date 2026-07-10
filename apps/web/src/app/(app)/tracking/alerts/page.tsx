import { ModuleShell } from '@/components/module-shell';

export default function TrackingAlertsPage() {
  return <ModuleShell eyebrow="Tracking" title="Tracking Alerts" description="Tracking alert events shell for operational exceptions." endpoint="/admin/tracking-alert-events" />;
}
