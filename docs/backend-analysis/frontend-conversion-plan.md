# Frontend Conversion Plan

## Option A: Keep HTML And Connect Backend First
Pros:
- fastest path to validate backend contracts
- lowest initial UI rewrite cost
- useful if a short-term compatibility bridge is needed

Cons:
- preserves duplicated markup and plugin-heavy technical debt
- hard to introduce typed state management and reusable UI patterns
- increases migration cost later

## Option B: Convert To React Or Next.js First
Pros:
- cleaner long-term frontend architecture
- better type sharing with TypeScript backend
- easier testing and component reuse

Cons:
- highest up-front cost
- delays backend validation while business logic is still being rediscovered
- risky given the size of the exported admin surface

## Option C: Build Backend First, Then Convert Gradually
Pros:
- best balance for this project
- stabilizes data model and API contracts first
- lets old and new frontend coexist during migration
- reduces the chance of rebuilding uncertain legacy behavior twice

Cons:
- may need a temporary compatibility layer for any legacy pages kept alive
- requires disciplined API versioning and shared DTOs

## Recommendation
Recommend Option C.

The biggest risk in Trackigniter8 is not styling; it is correctly reconstructing domain rules across trips, fleet, maintenance, tracking, accounts, and permissions. A backend-first approach gives the team a stable contract surface before any large UI rewrite.

## Suggested Migration Sequence
1. Preserve the exported HTML as a reference-only artifact
2. Build the backend foundation and core master data
3. If needed, add a thin adapter for temporary legacy-page usage
4. Rebuild frontend modules in this order:
- auth shell and navigation
- dashboard
- vehicles, drivers, customers
- trips and dispatch
- maintenance and fuel
- tracking, geofence, route planner
- accounts, payroll, stock, alerts
- reports and settings
5. Retire HTML pages module by module after parity

## Technical Recommendation
- If this is an internal admin product only, React plus Vite is sufficient
- If public marketing or SSR matters, prefer Next.js App Router
- Share validation schemas and DTO types from backend packages where possible
- Normalize common patterns early:
- tables with server-side filters
- form sections and file uploads
- modal/dialog flows
- permission-based navigation

## Migration Risks
- repeated layout/plugin code can hide true behavior differences
- tracking and geofence screens should wait until position/event models are stable
- report screens likely depend on backend aggregations not visible in static HTML
