# Demo Visual Walkthrough

Use the DEMO-TOKYO tenant, shown as Tokyo Metro Fleet Services.

## Recommended Sequence

1. Log in with a development demo user.
2. Select Tokyo Metro Fleet Services in the organization selector.
3. Open the dashboard and highlight non-zero operational summaries.
4. Open Vehicles and show registration-first list rows, status badges, and vehicle detail sections.
5. Open Drivers and show avatar/name hierarchy, licenses, compliance, skills, and assignments.
6. Open Routes, Trips, and Dispatch to show planning and lifecycle readiness.
7. Open Tracking Live, Providers, Geofences, and Alerts to show telemetry-oriented records.
8. Open Maintenance and Fuel to show due states, work orders, cards, tanks, entries, and alerts.
9. Open Reports to show report definitions, runs, exports, and dashboard widget metadata.
10. Open Admin areas for users, roles, settings, files, jobs, notifications, and feature flags.
11. Open a skipped module from navigation and show the Coming Soon treatment.

## Visual Points To Highlight

- Consistent semantic status badges.
- Profile-style driver and vehicle detail pages.
- Mobile drawer behavior.
- Dashboard summaries backed by seeded data.
- Coming-soon modules remain placeholders, not unfinished broken pages.

## Fallback Notes

If the API is not running, use the build and seed verification results to confirm readiness, then start `npm run dev:api` and `npm run dev:web` for live browser review.

