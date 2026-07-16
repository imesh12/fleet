# Dependency Security Review

Command reviewed:

```powershell
npm.cmd audit --json
```

Initial findings:
- `@fastify/jwt` direct dependency was affected by critical transitive `fast-jwt` advisories.
- `next` reported a moderate transitive `postcss` advisory through npm audit metadata.

Actions applied:
- Upgraded `@fastify/jwt` in `@trackigniter8/api` to `10.2.0`.
- Added a root npm `overrides.postcss` entry for `8.5.16`.
- Ran `npm dedupe` so Next no longer kept a vulnerable nested PostCSS copy.
- `npm audit` then reported `found 0 vulnerabilities`.

Reasoning:
- JWT handling is runtime security-critical.
- The JWT update was targeted and testable.
- The PostCSS remediation avoids `npm audit fix --force` and keeps the current Next major line.
- Typecheck/build/QA were run afterward.

No `npm audit fix --force` was run.
