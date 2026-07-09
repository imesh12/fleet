# Trip Templates API

## Purpose

Trip templates store reusable planned trip patterns before runtime scheduling or dispatch execution exists.

## Endpoints

- `GET /api/v1/admin/trip-templates`
- `GET /api/v1/admin/trip-templates/:tripTemplateId`
- `POST /api/v1/admin/trip-templates`
- `PATCH /api/v1/admin/trip-templates/:tripTemplateId`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/activate`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/deactivate`

Stop management:

- `POST /api/v1/admin/trip-templates/:tripTemplateId/stops`
- `PATCH /api/v1/admin/trip-templates/:tripTemplateId/stops/:stopId`
- `DELETE /api/v1/admin/trip-templates/:tripTemplateId/stops/:stopId`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/stops/reorder`

## Key fields

Template:

- `organizationId`
- `serviceRouteId`
- `serviceRouteTemplateId`
- `name`
- `code`
- `description`
- `status`

Template stop:

- `serviceStopId`
- `serviceRouteTemplateStopId`
- `name`
- `code`
- `description`
- `sequence`
- address fields
- `latitude`
- `longitude`
- `isActive`

## Notes

- Route references must belong to the same organization
- Stop references must belong to the linked route or route template
- Stop reorder requests must include every current stop exactly once
- Every write is audit logged under `admin.trip_template.*` or `admin.trip_template_stop.*`
