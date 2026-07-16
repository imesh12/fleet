# Demo Verification

Run:

```powershell
npm.cmd run demo:verify
```

The verifier checks minimum useful demo counts and duplicate deterministic demo codes.

Current minimums:

- 11 demo users.
- 20 vehicles.
- 20 drivers.
- 30 service routes.
- 60 planned trips.
- 20 executed trips.
- 20 latest vehicle positions.
- 8,000 telemetry history events.
- 40 maintenance requests.
- 35 maintenance work orders.
- 120 fuel entries.
- 20 report definitions.
- 12 dashboard widgets.
- 60 tracking alert events.
- 9 background job definitions.
- 20 file metadata records.

The verifier never prints secrets.
