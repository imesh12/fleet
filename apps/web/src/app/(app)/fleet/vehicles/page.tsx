import { FleetReadonlyList } from '@/components/fleet-readonly-list';

export default function VehiclesPage() {
  return (
    <FleetReadonlyList
      eyebrow="Fleet"
      title="Vehicles"
      description="Read-only vehicle registry with richer detail pages. Create/Edit coming next stage."
      endpoint="/admin/vehicles"
      detailBasePath="/fleet/vehicles"
      createHref="/fleet/vehicles/new"
      columns={[
        { key: 'registrationNumber', label: 'Registration' },
        { key: 'plateNumber', label: 'Plate' },
        { key: 'fuelType', label: 'Fuel' },
        { key: 'odometer', label: 'Odometer' },
        { key: 'status', label: 'Status', variant: 'status' },
      ]}
    />
  );
}
