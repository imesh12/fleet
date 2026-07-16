# Legacy Visual Language

The legacy app is built around an AdminLTE-style operations console.

## Layout

- Fixed left sidebar with nested module groups and Font Awesome icons.
- Fixed topbar with menu toggle, language selector, notification dropdown, fullscreen, and logout.
- Dense content area optimized for dispatch/admin users who scan many rows.
- Page headers use short module titles, often with a primary action button near the title.

## Cards And Tables

- Cards use bordered headers and clear section titles such as `Resources`, `Journey Details`, `Financials`, and `Notifications`.
- Tables are compact and action-heavy, with `Action` as the final column.
- Many list pages support both table and card/grid mental models.
- Tables use status/date/action columns that non-technical clients can scan quickly.

## Forms

- Forms are grouped by business meaning rather than database shape.
- Required fields are marked with `*`.
- Select2-style searchable selects are common for vehicles, drivers, customers, and vendors.
- File upload fields are presented as metadata-aware business documents.
- Confirmation modals are used for delete/destructive actions.

## Badges, Buttons, And Colors

- Primary actions are blue, rounded, and visually prominent.
- Success/active states are green.
- Warning/expiry states are yellow/orange.
- Danger/delete/expired states are red.
- Status badges appear in tables, cards, nav notifications, and detail headers.

## Why Clients Understand It

- Entity photos/images make drivers and vehicles feel concrete.
- Operational grouping reduces cognitive load: driver/contact/license, vehicle/driver/fuel, trip/resource/route/status.
- Status color is consistent and visible at scan distance.
- Cards place actions near the business object being acted on.
- Tracking is map-first, which matches how fleet operators think about location.

## Patterns Not To Copy

- Do not copy jQuery/AdminLTE implementation code.
- Do not copy inline scripts, inline configuration, remote keys, or old vendor bundles.
- Do not preserve overly dense mobile behavior without reconsidering touch usability.
- Do not preserve secrets or API keys from any legacy export.
