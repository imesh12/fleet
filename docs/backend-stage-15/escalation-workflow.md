# Escalation Workflow

## Models

- `EscalationPolicy`
- `EscalationPolicyStep`
- `EscalationEvent`

## APIs

- `GET /api/v1/admin/escalation-policies`
- `POST /api/v1/admin/escalation-policies`
- `GET /api/v1/admin/escalation-policies/:policyId`
- `PATCH /api/v1/admin/escalation-policies/:policyId`
- `POST /api/v1/admin/escalation-policies/:policyId/activate`
- `POST /api/v1/admin/escalation-policies/:policyId/deactivate`
- `POST /api/v1/admin/escalation-policies/:policyId/steps`
- `PATCH /api/v1/admin/escalation-policies/:policyId/steps/:stepId`
- `DELETE /api/v1/admin/escalation-policies/:policyId/steps/:stepId`
- `POST /api/v1/admin/escalation-policies/:policyId/steps/reorder`
- `GET /api/v1/admin/escalation-events`
- `POST /api/v1/admin/escalation-events`
- `GET /api/v1/admin/escalation-events/:eventId`
- `POST /api/v1/admin/escalation-events/:eventId/acknowledge`
- `POST /api/v1/admin/escalation-events/:eventId/resolve`

## Notes

- policies can be global or organization-scoped
- steps are ordered and channel-based
- events are the runtime records linked to alert conditions
