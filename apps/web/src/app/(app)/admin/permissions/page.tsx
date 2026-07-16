'use client';

import { PageHeader } from '@/components/page-header';
import { PermissionMatrix } from '@/components/permission-matrix';

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Permissions" description="Seeded system permission catalogue grouped by backend module/resource." />
      <PermissionMatrix />
    </div>
  );
}
