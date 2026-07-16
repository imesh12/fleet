'use client';

import { FleetReadonlyList } from '@/components/fleet-readonly-list';
import { DriverAvatar } from '@/components/entity-avatar';
import { OperationalStatusBadge } from '@/components/operational-status-badge';

export default function DriversPage() {
  return (
    <FleetReadonlyList
      eyebrow="Fleet"
      title="Drivers"
      description="Driver registry with profile-first scanning, contact details, employment state, and compliance-ready detail pages."
      endpoint="/admin/drivers"
      detailBasePath="/fleet/drivers"
      createHref="/fleet/drivers/new"
      columns={[
        { key: 'employeeNumber', label: 'Employee #' },
        {
          key: 'displayName',
          label: 'Driver',
          render: (row) => (
            <div className="flex items-center gap-3">
              <DriverAvatar label={String(row.displayName ?? row.employeeNumber ?? 'Driver')} size="sm" />
              <div>
                <div className="font-bold text-ink">{String(row.displayName ?? '-')}</div>
                <div className="text-xs text-ink/48">{String(row.employeeNumber ?? '')}</div>
              </div>
            </div>
          ),
        },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', render: (row) => <OperationalStatusBadge value={row.status} /> },
      ]}
    />
  );
}
