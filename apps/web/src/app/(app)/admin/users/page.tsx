import { ModuleShell } from '@/components/module-shell';

export default function UsersPage() {
  return <ModuleShell eyebrow="Admin" title="Users" description="User administration shell connected to the IAM backend." endpoint="/admin/users" />;
}
