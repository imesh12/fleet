# Demo Reset And Idempotency

The demo seed is rerunnable.

Stable records are updated through unique keys such as:

- `DEMO-TOKYO`
- `DEMO-VEH-001`
- `DEMO-DRV-001`
- `ROUTE-001`
- `PTRIP-001`
- `TRIP-001`

High-volume and child records are replaced only when scoped to demo-owned parent records or deterministic demo markers. Examples:

- Telemetry and latest position rows are replaced for demo vehicles in `DEMO-TOKYO`.
- Route/trip stops are replaced under deterministic demo routes/trips.
- Maintenance requests and work orders are replaced by `DEMO-MR-*` and `DEMO-WO-*`.
- Fuel entries and requests are replaced when marked with `DEMO-SEED`.
- File metadata is replaced when file names begin with `demo-`.

The seed does not delete unrelated tenants or non-demo records.
