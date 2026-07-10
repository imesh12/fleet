import { ModuleShell } from '@/components/module-shell';

export default function FuelPage() {
  return <ModuleShell eyebrow="Fuel" title="Fuel" description="Fuel entry shell connected to fuel foundation APIs." endpoint="/admin/fuel-entries" />;
}
