# Stage 15 Verification

## Commands run

Executed successfully:

- `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
- `npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_15_background_jobs_notifications`
- `npm.cmd run prisma:seed`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Sample curl commands

### Create and run a cleanup job

```bash
curl -X POST "http://localhost:3000/api/v1/admin/background-jobs" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cleanup expired invitations",
    "code": "CLEANUP_INVITES",
    "jobType": "CLEANUP_EXPIRED_INVITATIONS"
  }'
```

```bash
curl -X POST "http://localhost:3000/api/v1/admin/background-jobs/JOB_ID/run" \
  -H "Authorization: Bearer ADMIN_JWT"
```

### Send a provider test notification

```bash
curl -X POST "http://localhost:3000/api/v1/admin/notification-providers/PROVIDER_ID/test-send" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "ops@example.com",
    "subject": "Stage 15 test",
    "body": "Testing notification delivery foundation"
  }'
```

### Retry a pending delivery

```bash
curl -X POST "http://localhost:3000/api/v1/admin/notification-deliveries/DELIVERY_ID/retry" \
  -H "Authorization: Bearer ADMIN_JWT"
```

### Deliver an alert event manually

```bash
curl -X POST "http://localhost:3000/api/v1/admin/tracking-alert-events/ALERT_EVENT_ID/deliver" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "x-organization-id: ORG_ID"
```

### Escalate an alert event manually

```bash
curl -X POST "http://localhost:3000/api/v1/admin/tracking-alert-events/ALERT_EVENT_ID/escalate" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "x-organization-id: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Escalated tracking alert",
    "message": "Operator follow-up required"
  }'
```
