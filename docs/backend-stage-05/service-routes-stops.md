# Service Routes And Stops

Stage 05 only provides route and stop master data. It does not implement trips, dispatch, schedules, live tracking, or tracking history.

## Models
### `ServiceRoute`
- `id`
- `organizationId`
- `name`
- `code`
- `description`
- `status`
- `createdAt`
- `updatedAt`

### `ServiceStop`
- `id`
- `serviceRouteId`
- `name`
- `code`
- `description`
- `sequence`
- `addressLine1`
- `addressLine2`
- `city`
- `state`
- `postalCode`
- `country`
- `latitude`
- `longitude`
- `isActive`
- `createdAt`
- `updatedAt`

## APIs
- `GET /api/v1/admin/service-routes`
- `GET /api/v1/admin/service-routes/:serviceRouteId`
- `POST /api/v1/admin/service-routes`
- `PATCH /api/v1/admin/service-routes/:serviceRouteId`
- `POST /api/v1/admin/service-routes/:serviceRouteId/activate`
- `POST /api/v1/admin/service-routes/:serviceRouteId/deactivate`
- `POST /api/v1/admin/service-routes/:serviceRouteId/stops`
- `PATCH /api/v1/admin/service-routes/:serviceRouteId/stops/:stopId`
- `DELETE /api/v1/admin/service-routes/:serviceRouteId/stops/:stopId`
- `POST /api/v1/admin/service-routes/:serviceRouteId/stops/reorder`

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/service-routes \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Morning Line\",\"code\":\"MORNING_LINE\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/service-routes/<ROUTE_ID>/stops \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Depot A\",\"sequence\":1,\"city\":\"Tokyo\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/service-routes/<ROUTE_ID>/stops/reorder \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"orderedStopIds\":[\"<STOP_1>\",\"<STOP_2>\",\"<STOP_3>\"]}"
```
