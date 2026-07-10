import { ModuleShell } from '@/components/module-shell';

export default function DispatchPage() {
  return <ModuleShell eyebrow="Operations" title="Dispatch" description="Dispatch queue planning and execution shell." endpoint="/admin/dispatch-queues" />;
}
