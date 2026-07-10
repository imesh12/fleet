import { AdminCrudPage } from '@/components/admin-crud-page';

export default function VendorsPage() {
  return (
    <AdminCrudPage
      eyebrow="Admin"
      title="Vendors"
      description="Create, edit, activate, and deactivate organization-scoped vendors."
      endpoint="/admin/vendors"
      requiresOrganization
      contactPlaceholder="Vendor contacts and contract metadata remain placeholders for a later frontend stage."
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true, createOnly: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          createOnly: true,
          options: [
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ],
        },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', variant: 'status' },
        { key: 'contactCount', label: 'Contacts' },
      ]}
    />
  );
}
