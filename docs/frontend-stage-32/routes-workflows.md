# Routes Workflows

Integrated APIs:
- `GET/POST/PATCH /admin/service-routes`
- `POST /admin/service-routes/:serviceRouteId/activate`
- `POST /admin/service-routes/:serviceRouteId/deactivate`
- `GET /admin/service-routes/:serviceRouteId`
- `POST/PATCH/DELETE /admin/service-routes/:serviceRouteId/stops/:stopId`

Routes can be created and edited inline on `/operations/routes`.
Route stops are managed on `/operations/routes/[routeId]`.
