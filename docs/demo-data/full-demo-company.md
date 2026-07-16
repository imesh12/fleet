# Full Demo Company

Stage 38A adds a deterministic demo tenant for browser testing, manager walkthroughs, dashboard validation, report previews, tracking replay, maintenance/fuel workflows, alerts, pagination, and QA smoke checks.

Primary tenant:

- Organization: Tokyo Metro Fleet Services
- Code: `DEMO-TOKYO`
- Status: active

Additional tenant-switching organizations:

- Osaka Regional Transport, `DEMO-OSAKA`
- Yokohama Service Logistics, `DEMO-YOKOHAMA`

The full dataset is created only by `npm run demo:seed`. The normal `npm run prisma:seed` remains focused on required system data such as roles, permissions, super admin, and navigation placeholders.

The seed is deterministic and safe to rerun. It updates stable unique records and replaces only explicitly demo-owned child/history data under deterministic demo codes.
