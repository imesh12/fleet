import { ModuleShell } from '@/components/module-shell';

export default function AssignmentsPage() {
  return <ModuleShell eyebrow="Fleet" title="Assignments" description="Driver and vehicle assignment shell." endpoint="/admin/driver-vehicle-assignments" />;
}
