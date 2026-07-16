'use client';

import { FleetReadonlyList } from '@/components/fleet-readonly-list';
import { OperationalStatusBadge } from '@/components/operational-status-badge';
import { VehicleRegistrationDisplay } from '@/components/visual-system';

export default function VehiclesPage() {
  return (
    <FleetReadonlyList
      eyebrow="Fleet"
      title="Vehicles"
      description="Vehicle registry with registration-first scanning, operational status, odometer, and quick access to detail workflows."
      endpoint="/admin/vehicles"
      detailBasePath="/fleet/vehicles"
      createHref="/fleet/vehicles/new"
      columns={[
        {
          key: 'registrationNumber',
          label: 'Vehicle',
          render: (row) => <VehicleRegistrationDisplay registration={row.registrationNumber} plate={row.plateNumber} />,
        },
        { key: 'plateNumber', label: 'Plate' },
        { key: 'fuelType', label: 'Fuel' },
        { key: 'odometer', label: 'Odometer' },
        { key: 'status', label: 'Status', render: (row) => <OperationalStatusBadge value={row.status} /> },
      ]}
    />
  );
}
