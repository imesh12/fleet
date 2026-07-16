# Tracking Alert Workflows

Pages:
- `/tracking/alerts`
- `/tracking/alerts/events/[alertEventId]`

Integrated APIs:
- `GET/POST/PATCH /admin/tracking-alert-rules`
- `POST /admin/tracking-alert-rules/:alertRuleId/activate`
- `POST /admin/tracking-alert-rules/:alertRuleId/deactivate`
- `GET /admin/tracking-alert-events`
- `GET /admin/tracking-alert-events/:alertEventId`
- `POST /admin/tracking-alert-events/:alertEventId/acknowledge`
- `POST /admin/tracking-alert-events/:alertEventId/resolve`
- `POST /admin/tracking-alert-events/:alertEventId/deliver`
- `POST /admin/tracking-alert-events/:alertEventId/escalate`

Alert conditions are JSON metadata and remain interpreted by backend evaluators.
