import { ModuleShell } from '@/components/module-shell';

export default function PermissionsPage() {
  return <ModuleShell eyebrow="Admin" title="Permissions" description="Permission inspection shell grouped by backend resources." endpoint="/admin/permissions" />;
}
