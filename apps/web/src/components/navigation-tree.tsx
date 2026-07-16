'use client';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';

const navStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Hidden', value: 'HIDDEN' },
  { label: 'Coming soon', value: 'COMING_SOON' },
  { label: 'Disabled', value: 'DISABLED' },
];

const commonFields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'slug', label: 'Slug', required: true },
  { key: 'path', label: 'Path' },
  { key: 'icon', label: 'Icon' },
  { key: 'sortOrder', label: 'Sort order', type: 'number' as const },
  { key: 'requiredPermission', label: 'Required permission' },
  { key: 'moduleKey', label: 'Module key', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'comingSoonMessage', label: 'Coming soon message', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: navStatusOptions },
];

function normalizeBooleanPayload(payload: MetadataRecord) {
  return {
    ...payload,
    enabled: payload.enabled === 'true' ? true : payload.enabled === 'false' ? false : payload.enabled,
  };
}

export function NavigationTree() {
  return (
    <div className="grid gap-6">
      <MetadataManager
        title="Menu groups"
        description="Top-level navigation groups shown in the app shell."
        listEndpoint="/admin/navigation/menu-groups"
        createEndpoint="/admin/navigation/menu-groups"
        updatePath={(record) => `/admin/navigation/menu-groups/${record.id}`}
        emptyMessage="No menu groups found."
        fields={commonFields}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'moduleKey', label: 'Module' },
          { key: 'sortOrder', label: 'Sort' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Menu items"
        description="Manage menu entries, including coming-soon placeholders."
        listEndpoint="/admin/navigation/menu-items"
        createEndpoint="/admin/navigation/menu-items"
        updatePath={(record) => `/admin/navigation/menu-items/${record.id}`}
        deleteAction={{
          label: 'Coming soon',
          confirmTitle: 'Mark coming soon',
          confirmMessage: 'Mark this menu item as coming soon?',
          path: (record) => `/admin/navigation/menu-items/${record.id}/coming-soon`,
          successMessage: 'Menu item marked coming soon',
        }}
        emptyMessage="No menu items found."
        fields={[
          ...commonFields,
          { key: 'menuGroupId', label: 'Menu group', type: 'relation' as const, endpoint: '/admin/navigation/menu-groups' },
          { key: 'appPageId', label: 'App page', type: 'relation' as const, endpoint: '/admin/navigation/pages' },
          { key: 'parentId', label: 'Parent item', type: 'relation' as const, endpoint: '/admin/navigation/menu-items' },
        ]}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'path', label: 'Path' },
          { key: 'moduleKey', label: 'Module' },
          { key: 'sortOrder', label: 'Sort' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="App pages"
        description="Registry of routable pages and placeholder page states."
        listEndpoint="/admin/navigation/pages"
        createEndpoint="/admin/navigation/pages"
        updatePath={(record) => `/admin/navigation/pages/${record.id}`}
        emptyMessage="No app pages found."
        fields={[...commonFields, { key: 'parentId', label: 'Parent page', type: 'relation' as const, endpoint: '/admin/navigation/pages' }]}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'path', label: 'Path' },
          { key: 'moduleKey', label: 'Module' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Feature flags"
        description="Global or organization-scoped frontend feature flags."
        listEndpoint="/admin/feature-flags"
        createEndpoint="/admin/feature-flags"
        updatePath={(record) => `/admin/feature-flags/${record.id}`}
        emptyMessage="No feature flags found."
        fields={[
          { key: 'key', label: 'Key', required: true },
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'enabled', label: 'Enabled', type: 'select', options: [{ label: 'No', value: 'false' }, { label: 'Yes', value: 'true' }] },
          { key: 'rolloutStatus', label: 'Rollout status', type: 'select', options: [{ label: 'Planned', value: 'PLANNED' }, { label: 'Preview', value: 'PREVIEW' }, { label: 'Enabled', value: 'ENABLED' }, { label: 'Disabled', value: 'DISABLED' }] },
          { key: 'metadata', label: 'Metadata JSON', type: 'json' },
        ]}
        mapCreatePayload={normalizeBooleanPayload}
        mapUpdatePayload={normalizeBooleanPayload}
        columns={[
          { key: 'key', label: 'Key' },
          { key: 'name', label: 'Name' },
          { key: 'enabled', label: 'Enabled' },
          { key: 'rolloutStatus', label: 'Rollout' },
        ]}
      />
    </div>
  );
}
