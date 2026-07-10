import { FleetReadonlyList } from '@/components/fleet-readonly-list';

export default function DriversPage() {
  return (
    <FleetReadonlyList
      eyebrow="Fleet"
      title="Drivers"
      description="Read-only driver registry with richer detail pages. Create/Edit coming next stage."
      endpoint="/admin/drivers"
      detailBasePath="/fleet/drivers"
      createHref="/fleet/drivers/new"
      columns={[
        { key: 'employeeNumber', label: 'Employee #' },
        { key: 'displayName', label: 'Driver' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', variant: 'status' },
      ]}
    />
  );
}
