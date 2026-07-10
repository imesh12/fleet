import { ModuleShell } from '@/components/module-shell';

export default function ReportsPage() {
  return <ModuleShell eyebrow="Reports" title="Reports" description="Report definition shell. PDF and Excel exports remain placeholders." endpoint="/admin/report-definitions" />;
}
