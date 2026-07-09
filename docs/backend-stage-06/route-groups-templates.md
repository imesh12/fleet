# Route Groups And Templates

Stage 06 extends route planning master data without entering dispatch, schedules, trips, or live tracking.

## Route Groups
Base path: `/api/v1/admin/service-route-groups`

Supported operations:
- list
- get
- create
- update
- activate
- deactivate

Route groups can optionally hold linked `ServiceRoute` references for planning organization.

## Route Templates
Base path: `/api/v1/admin/service-route-templates`

Supported operations:
- list
- get
- create
- update
- activate
- deactivate
- add template stop
- update template stop
- delete template stop
- reorder template stops

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/service-route-groups \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"School Runs\",\"code\":\"SCHOOL_RUNS\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/service-route-templates \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Morning Template\",\"code\":\"MORNING_TEMPLATE\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/service-route-templates/<TEMPLATE_ID>/stops/reorder \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"orderedStopIds\":[\"<STOP_1>\",\"<STOP_2>\",\"<STOP_3>\"]}"
```
