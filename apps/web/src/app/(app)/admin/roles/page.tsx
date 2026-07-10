import { ModuleShell } from '@/components/module-shell';

export default function RolesPage() {
  return <ModuleShell eyebrow="Admin" title="Roles" description="Role administration shell for RBAC management." endpoint="/admin/roles" />;
}
