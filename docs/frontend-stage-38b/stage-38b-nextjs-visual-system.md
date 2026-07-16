# Stage 38B Next.js Visual System

Stage 38B implements the shared visual foundation recommended by Stage 38A without changing backend behavior, Prisma schema, route contracts, organization context, RBAC, or skipped-module behavior.

Implemented focus:

- Semantic design tokens through CSS variables and Tailwind colors.
- Global shell polish for app background, content spacing, topbar, and sidebar.
- Reusable `ModulePageHeader`.
- Semantic status badge foundation.
- Card/table/form primitive polish.
- Driver and vehicle list/detail visual upgrades.
- Dashboard and operational pages inherit upgraded metrics, cards, tables, forms, and status badges.

No legacy jQuery/AdminLTE implementation code, map keys, Twilio values, or unsafe legacy configuration were reused.
