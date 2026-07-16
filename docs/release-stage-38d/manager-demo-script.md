# Manager Demo Script

Target duration: 15 to 20 minutes.

## 1. Login

- Route: `/login`.
- Action: Log in with a development demo account.
- Expected data: successful session and redirect into protected app.
- Talking point: Role-based access is enforced from the first request.
- Fallback: Use `admin.demo@trackigniter8.local` if another demo role lacks an admin view.

## 2. Select DEMO-TOKYO

- Route: any protected page topbar.
- Action: Select Tokyo Metro Fleet Services.
- Expected data: organization code `DEMO-TOKYO`.
- Talking point: All operational data is tenant scoped.
- Fallback: If already selected, refresh dashboard.

## 3. Dashboard

- Route: `/dashboard`.
- Action: Review summaries and widgets.
- Expected data: non-zero fleet, trip, tracking, maintenance, fuel, report, and alert summaries.
- Talking point: The dashboard is backed by live seeded API data.
- Fallback: Run `npm run demo:verify`.

## 4. Vehicle

- Route: `/fleet/vehicles`.
- Action: Open a seeded vehicle and review detail sections.
- Expected data: 20 vehicles; documents, devices, compliance, maintenance/fuel/tracking context.
- Talking point: Vehicle registry is ready for operations modules.
- Fallback: Use `DEMO-VEH-020`.

## 5. Driver

- Route: `/fleet/drivers`.
- Action: Open a seeded driver.
- Expected data: 20 drivers; skills, licenses, documents, compliance, assignments.
- Talking point: Driver readiness and assignment context are modeled.
- Fallback: Use list search or first row.

## 6. Route

- Route: `/operations/routes`.
- Action: Open a route and review ordered stops.
- Expected data: 30 service routes.
- Talking point: Route master data supports planning.
- Fallback: Show trip templates if route detail is unavailable.

## 7. Planned Trip

- Route: `/operations/trips`.
- Action: Open a planned trip.
- Expected data: 60 planned trips.
- Talking point: Planning and assignment happen before dispatch execution.
- Fallback: Use dispatch queue view.

## 8. Dispatch

- Route: `/operations/dispatch`.
- Action: Open a queue and review validation/status.
- Expected data: dispatch queues and queue items.
- Talking point: Dispatch execution is guarded by readiness validation.
- Fallback: Use API smoke result for dispatch queues.

## 9. Executed Trip

- Route: `/operations/trips/executed/[executedTripId]`.
- Action: Review lifecycle, stops, and timeline.
- Expected data: 30 executed trips.
- Talking point: Trip lifecycle history is stored separately from planning.
- Fallback: Use planned trip detail if a direct executed trip link is not available.

## 10. Tracking

- Route: `/tracking/live`.
- Action: Review latest positions and tracking health.
- Expected data: 20 latest positions and 8000 telemetry events.
- Talking point: Tracking is provider-neutral and ready for map integration.
- Fallback: Open tracking health in API smoke report.

## 11. Maintenance

- Route: `/maintenance`.
- Action: Review due items, requests, and work orders.
- Expected data: 40 requests and 35 work orders.
- Talking point: Maintenance planning exists before mechanic workflow expansion.
- Fallback: Show due endpoint smoke result.

## 12. Fuel

- Route: `/fuel`.
- Action: Review cards, tanks, entries, alerts.
- Expected data: 120 fuel entries.
- Talking point: Fuel foundation supports alerts and policy metadata.
- Fallback: Show fuel alerts smoke result.

## 13. Reports

- Route: `/reports`.
- Action: Review definitions, runs, exports, widgets.
- Expected data: 20 report definitions and 12 dashboard widgets.
- Talking point: Reporting foundation is ready for export implementation later.
- Fallback: Use dashboard summary.

## 14. Admin/RBAC

- Routes: `/admin/users`, `/admin/roles`, `/admin/settings`.
- Action: Show users, roles, settings, jobs, files, notifications.
- Expected data: admin areas load under privileged roles.
- Talking point: Permissions and route guards are covered.
- Fallback: Show permission coverage output.

## 15. Coming Soon

- Route: `/coming-soon/[slug]`.
- Action: Open a skipped module.
- Expected data: Coming Soon page only.
- Talking point: Skipped manager modules are intentionally present in navigation without unfinished APIs.
- Fallback: Use menu placeholders.

## 16. Logout

- Route: `/logout` or topbar logout.
- Action: End session.
- Expected data: user returns to login.
- Talking point: Session flow is complete for demo use.

