# Component Migration Plan

| Proposed component | Existing base | Action | Primary modules |
| --- | --- | --- | --- |
| `AppShell` | `Sidebar`, `Topbar`, protected layout | Extend | Global |
| `ModulePageHeader` | `PageHeader` | Extend | All modules |
| `ProfileHeroCard` | `DetailHeader`, `Card` | Create | Drivers, users |
| `DriverAvatar` | none | Create | Drivers |
| `VehicleImageCard` | `Card` | Create | Vehicles |
| `EntitySummaryCard` | `SummaryCard`, `Card` | Create/extend | Vehicles, drivers, trips |
| `MetricCard` | `MetricValue` | Extend | Dashboard, tracking, geofence |
| `OperationalStatusBadge` | `StatusBadge` | Extend | All operations |
| `ExpiryBadge` | `ExpiryStatus` | Extend/reuse | Documents, compliance |
| `AssignmentCard` | `AssignmentManager` | Create | Drivers, vehicles, trips |
| `ComplianceCard` | `DetailSection`, `StatusBadge` | Create | Drivers, vehicles |
| `DocumentCard` | `MetadataManager` | Create wrapper | Files/documents |
| `Timeline` | `TimelineList` | Extend | Trips, dispatch, alerts |
| `RouteStopTimeline` | `TimelineList` | Create | Trips/routes |
| `MapSidebarLayout` | `MapReadyPanel` | Create | Tracking, geofences |
| `TrackingVehicleCard` | `TelemetryTable`, `HealthIndicator` | Create | Tracking |
| `FilterToolbar` | `SearchFilterBar` | Extend | Lists |
| `DataTable` | `SimpleTable` | Extend | Dense module lists |
| `DetailTabs` | none | Create | Entity detail pages |
| `QuickActionBar` | `StatusActionBar` | Extend | Trips, vehicles, drivers |
| `EmptyState` | existing | Reuse | All |
| Skeleton loaders | `DataState` | Create lightweight variant | All |

Migration principle: preserve current API integration and state management; improve visual hierarchy through wrappers and composed components.
