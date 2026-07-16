# Design Tokens

Tokens are defined as CSS variables in `apps/web/src/app/globals.css` and exposed through Tailwind in `apps/web/tailwind.config.ts`.

Token groups:

- Background: `background`
- Surfaces: `surface`, `elevated`
- Border: `border`
- Text: primary, secondary, muted through `ink` opacity and semantic variables
- Actions: `primary`
- Status: `success`, `warning`, `danger`, `info`, `active`, `inactive`, `maintenance`, `offline`, `stale`, `completed`, `cancelled`
- Radius/shadow: `rounded-card`, `shadow-panel`, `shadow-lift`

Implementation rule:

Avoid adding raw one-off color values in pages. Use tokens and shared components.
