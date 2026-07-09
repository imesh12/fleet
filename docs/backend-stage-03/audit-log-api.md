# Audit Log API

Base path: `/api/v1/admin/audit-logs`

## Endpoints
- `GET /` list audit logs
- `GET /:auditLogId` get one audit log

## Supported Filters
- `page`
- `pageSize`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `dateFrom`
- `dateTo`

## Data Included
- actor type and actor user
- action name
- entity type and entity id
- JSON metadata payload
- IP address and user agent
- creation timestamp

## Guarding Rules
- both routes require `audit:logs:read`
