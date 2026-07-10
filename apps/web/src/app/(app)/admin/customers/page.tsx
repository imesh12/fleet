import { AdminCrudPage } from '@/components/admin-crud-page';

export default function CustomersPage() {
  return (
    <AdminCrudPage
      eyebrow="Admin"
      title="Customer Accounts"
      description="Create, edit, activate, and deactivate organization-scoped customer accounts."
      endpoint="/admin/customer-accounts"
      requiresOrganization
      contactPlaceholder="Customer contacts and locations are intentionally placeholder sections for a later frontend stage."
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true, createOnly: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'billingAddress', label: 'Billing address', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          createOnly: true,
          options: [
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
            { label: 'Suspended', value: 'SUSPENDED' },
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
        { key: 'locationCount', label: 'Locations' },
      ]}
    />
  );
}
