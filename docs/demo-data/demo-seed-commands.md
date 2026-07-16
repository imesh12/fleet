# Demo Seed Commands

Generate the Prisma client when the engine file is not locked:

```powershell
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
```

Seed required system data only:

```powershell
npm.cmd run prisma:seed
```

Seed the full demo company:

```powershell
npm.cmd run demo:seed
```

Verify the demo dataset:

```powershell
npm.cmd run demo:verify
```

Optional deterministic date override:

```powershell
$env:DEMO_REFERENCE_DATE='2026-07-01'
npm.cmd run demo:seed
```

If `DEMO_REFERENCE_DATE` is omitted, the seed normalizes the current date to midnight UTC and creates data around that reference point.
