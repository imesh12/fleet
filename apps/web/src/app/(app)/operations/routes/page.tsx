import { ModuleShell } from '@/components/module-shell';

export default function RoutesPage() {
  return <ModuleShell eyebrow="Operations" title="Routes" description="Service route master-data shell." endpoint="/admin/service-routes" />;
}
