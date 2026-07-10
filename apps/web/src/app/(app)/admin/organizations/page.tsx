import { AdminCrudPage } from '@/components/admin-crud-page';

export default function OrganizationsPage() {
  return (
    <AdminCrudPage
      eyebrow="Admin"
      title="Organizations"
      description="Create, edit, activate, and deactivate tenant organizations."
      endpoint="/admin/organizations"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true, createOnly: true },
        { key: 'legalName', label: 'Legal name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'taxIdentifier', label: 'Tax identifier' },
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
        { key: 'status', label: 'Status', variant: 'status' },
        { key: 'userCount', label: 'Users' },
        { key: 'customerAccountCount', label: 'Customers' },
      ]}
    />
  );
}
