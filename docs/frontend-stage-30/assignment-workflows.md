# Assignment Workflows

Driver-to-vehicle assignment workflows were included because Stage 08 backend APIs already support them.

Integrated APIs:
- `GET /admin/driver-vehicle-assignments`
- `POST /admin/driver-vehicle-assignments`
- `PATCH /admin/driver-vehicle-assignments/:assignmentId`
- `POST /admin/driver-vehicle-assignments/:assignmentId/activate`
- `POST /admin/driver-vehicle-assignments/:assignmentId/end`
- `POST /admin/driver-vehicle-assignments/:assignmentId/cancel`

The assignment manager appears on:
- vehicle detail pages, with the vehicle locked and driver selected
- driver detail pages, with the driver locked and vehicle selected

The workflow remains metadata-only and does not start dispatch or trips.
