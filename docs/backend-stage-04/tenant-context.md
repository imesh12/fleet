# Tenant Context

Stage 04 adds a reusable organization access helper to the Fastify application instance.

## Helper
- `fastify.requireOrganizationAccess(request, organizationId?)`

## Resolution Rules
1. Use the explicit organization id if passed by route code.
2. Otherwise read `x-organization-id`.
3. Load the organization.
4. If the user has `SUPER_ADMIN`, allow access.
5. Otherwise require an active `OrganizationUser` membership for that org.
6. Attach resolved organization context to the request.

## Request Fields Added
- `request.currentOrganization`
- `request.currentOrganizationMembership`

## Why This Matters
- future fleet modules can depend on one consistent organization boundary
- customer, dispatch, alert, stock, and reporting modules can share the same tenant resolution path
- it avoids scattered ad-hoc membership checks
