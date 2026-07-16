# Vehicle UI Analysis

## Legacy Findings

- Vehicle list groups information into `Vehicle`, `Driver & Fuel`, `Group & Owner`, `Status & Expiry`, and `Action`.
- Vehicle add page starts with an image preview and required business fields.
- Vehicle group/type pages include images, which helps clients distinguish fleet classes visually.
- Vehicle forms include registration, alias/name, type, color, status, fuel type, fuel efficiency, fuel levels, group, driver, model, manufacturer, chassis, engine, capacity, seats, and dimensions.

## Recommended Modern Vehicle Detail Layout

- Hero: vehicle image/placeholder, registration/plate, make/model/type/group, active status, odometer.
- Metric strip: fuel status, GPS device status, assigned driver, maintenance due, document expiry.
- Tabs: Overview, Documents, Devices, Compliance, Assignments, Maintenance, Fuel, Tracking.
- Quick actions: Edit, Add document, Attach device, View tracking, Create maintenance request.

## Visual Details

- Vehicle image ratio: 16:9 card or square thumbnail in list rows.
- Registration number should be the largest identifier.
- Device/GPS state needs a dedicated badge: online, stale, offline, unmapped.
- Maintenance/fuel/tracking cards should be visible even when data is empty, with clear next action.
- Expired/expiring documents should sit near status, not buried in a generic metadata table.

## Component Needs

- `VehicleImageCard`: new.
- `EntitySummaryCard`: new.
- `OperationalStatusBadge`: extend `StatusBadge`.
- `DocumentCard`: new.
- `ComplianceCard`: new.
- `QuickActionBar`: new or extend `StatusActionBar`.
