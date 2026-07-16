# Visual Defects

| ID | Route | Viewport | Severity | Issue | Expected | Fix | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 38C-001 | Protected app shell | Mobile | High | Sidebar was hidden below desktop width, leaving no mobile navigation path. | Mobile users can open navigation. | Added `AppChrome`, topbar hamburger, drawer overlay, Escape/outside close, body scroll lock, and close-on-navigation. | Fixed |
| 38C-002 | Shared metadata pages | All | Medium | Metadata manager still used older color classes and cramped action layout. | Shared metadata tables/forms match the Stage 38B visual system. | Updated metadata manager surfaces, forms, table borders, muted text, and action wrapping. | Fixed |
| 38C-003 | Dashboard | Demo | Low | Summary cards could display raw nested object values. | Demo summaries should read like operational metrics, not debug output. | Added value formatting for numbers, booleans, and nested structures. | Fixed |
| 38C-004 | Sidebar link typing | Build | Medium | Optional drawer close handler was passed as `undefined` to `Link` under exact optional types. | Typecheck and build pass. | Only pass `onClick` when the handler exists. | Fixed |

