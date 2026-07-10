# Seed Verification

Run:

```powershell
npm.cmd run api:verify-seed
```

The verifier checks:

- default roles exist.
- default permissions exist.
- configured super admin exists.
- coming-soon menu/page placeholders exist.
- expected background job enum values are available.

It uses the existing `.env` database configuration.
