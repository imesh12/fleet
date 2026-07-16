'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const routeFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const tripTemplateFields = [
  { key: 'serviceRouteId', label: 'Service route', type: 'relation' as const, endpoint: '/admin/service-routes' },
  { key: 'serviceRouteTemplateId', label: 'Route template', type: 'relation' as const, endpoint: '/admin/service-route-templates' },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

function relatedName(value: unknown) {
  const record = value as MetadataRecord | undefined;
  const label = record?.name ?? record?.code;
  return label ? String(label) : null;
}

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function RoutesPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Routes and trip templates" description={`Route master data, stops, and reusable trip templates. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />

      <MetadataManager
        title="Service routes"
        description="Create/edit routes and open route detail to manage stops."
        listEndpoint="/admin/service-routes"
        createEndpoint="/admin/service-routes"
        updatePath={(record) => `/admin/service-routes/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the route active/inactive state.',
          confirmTitle: 'Toggle service route status',
          path: (record) => `/admin/service-routes/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Service route status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={routeFields}
        columns={[
          { key: 'name', label: 'Route', render: (record) => detailLink(`/operations/routes/${record.id}`, record.name) },
          { key: 'code', label: 'Code' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No service routes found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Trip templates"
        description="Reusable planned trip patterns. Open a template detail page to manage template stops."
        listEndpoint="/admin/trip-templates"
        createEndpoint="/admin/trip-templates"
        updatePath={(record) => `/admin/trip-templates/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the trip template active/inactive state.',
          confirmTitle: 'Toggle trip template status',
          path: (record) => `/admin/trip-templates/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Trip template status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={tripTemplateFields}
        columns={[
          { key: 'name', label: 'Template', render: (record) => detailLink(`/operations/trip-templates/${record.id}`, record.name) },
          { key: 'code', label: 'Code' },
          { key: 'serviceRoute', label: 'Route', render: (record) => relatedName(record.serviceRoute) ?? String(record.serviceRouteId ?? '-') },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No trip templates found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
