# RC1 Defects

| ID | Route/Module | Severity | Viewport | Steps | Expected | Actual | Fix | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 38D-001 | Local runtime | Medium | N/A | Start RC rehearsal with existing dev processes. | Ports `3000` and `3001` are available or owned by known project processes. | Stale Trackigniter8 Node processes were listening on both ports. | Inspected command lines and stopped only workspace-owned dev processes. | Fixed |
| 38D-002 | Browser screenshots | Low | N/A | Initialize browser automation for screenshot capture. | Browser tool connects or local automation binary is available. | Browser runtime failed during kernel asset setup; local Playwright/Chrome/Edge were unavailable. | Documented screenshot limitation; used live endpoint and automated verification evidence. | Open |

