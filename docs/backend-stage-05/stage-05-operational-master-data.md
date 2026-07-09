# Stage 05: Operational Master Data Foundation

Stage 05 adds organization-scoped operational master data that later fleet, dispatch, scheduling, maintenance, and reporting modules can reuse safely.

## Scope Delivered
- departments
- business units
- vendors and vendor contacts
- service routes and service stops
- organization invitation flow

## Tenant Safety
- all Stage 05 data is organization scoped
- `SUPER_ADMIN` can access all organizations
- non-super-admin users are limited to active organization memberships
- `x-organization-id` is supported where an explicit organization route parameter is not present

## Added Models
- `Department`
- `BusinessUnit`
- `Vendor`
- `VendorContact`
- `ServiceRoute`
- `ServiceStop`
- `OrganizationInvitation`

## Added Permissions
- `departments:read`
- `departments:manage`
- `business-units:read`
- `business-units:manage`
- `vendors:read`
- `vendors:manage`
- `vendor-contacts:manage`
- `service-routes:read`
- `service-routes:manage`
- `service-stops:manage`
- `organization-invitations:read`
- `organization-invitations:manage`

## Added Audit Actions
- `admin.department.*`
- `admin.business_unit.*`
- `admin.vendor.*`
- `admin.vendor_contact.*`
- `admin.service_route.*`
- `admin.service_stop.*`
- `admin.organization_invitation.*`
