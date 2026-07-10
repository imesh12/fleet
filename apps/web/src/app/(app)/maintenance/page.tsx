import { ModuleShell } from '@/components/module-shell';

export default function MaintenancePage() {
  return <ModuleShell eyebrow="Maintenance" title="Maintenance" description="Maintenance due shell connected to planning and reminder foundation." endpoint="/admin/maintenance/due" responseKey="due" />;
}
