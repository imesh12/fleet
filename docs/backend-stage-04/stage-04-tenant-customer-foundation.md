# Stage 04: Tenant / Organization / Customer Foundation

Stage 04 adds the multi-tenant structure that future fleet modules will depend on. It introduces organizations, organization memberships, customer accounts, customer contacts, customer locations, and organization-scoped settings without adding any fleet assets or frontend work.

## Scope Delivered
- Prisma tenant and customer models
- organization administration APIs
- customer account APIs with contact and location management
- tenant context resolution via `x-organization-id`
- organization access enforcement for non-super-admin users
- Stage 04 permission seed definitions and default role mapping
- audit logging for all tenant/customer mutations

## Added Models
- `Organization`
- `OrganizationUser`
- `CustomerAccount`
- `CustomerContact`
- `CustomerLocation`
- `OrganizationSetting`

## Added Permissions
- `organizations:read`
- `organizations:manage`
- `organization-users:read`
- `organization-users:manage`
- `customer-accounts:read`
- `customer-accounts:manage`
- `customer-contacts:manage`
- `customer-locations:manage`

## Added Audit Actions
- `admin.organization.create`
- `admin.organization.update`
- `admin.organization.activate`
- `admin.organization.deactivate`
- `admin.organization_user.assign`
- `admin.organization_user.update`
- `admin.organization_user.remove`
- `admin.customer_account.create`
- `admin.customer_account.update`
- `admin.customer_account.activate`
- `admin.customer_account.deactivate`
- `admin.customer_contact.create`
- `admin.customer_contact.update`
- `admin.customer_contact.delete`
- `admin.customer_location.create`
- `admin.customer_location.update`
- `admin.customer_location.delete`
- `admin.organization_setting.upsert`
- `admin.organization_setting.delete`

## Verification Summary
- Prisma client generation succeeded
- workspace typecheck succeeded
- workspace build succeeded
- Prisma schema operations remain blocked locally by the existing schema engine issue
- Redis is still not running locally, but Stage 04 does not depend on it for compile-time validation
