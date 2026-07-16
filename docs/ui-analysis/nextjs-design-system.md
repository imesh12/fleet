# Next.js Design System Recommendation

The frontend should keep its current warm operations-console direction and add sharper fleet-specific primitives.

## Tokens

- `ink`: primary text/sidebar, already present.
- `cream`: app background, already present.
- `linen`: card background, already present.
- `ember`: danger/urgent/expired.
- `moss`: active/success.
- Add `amber`: warning/expiring/held.
- Add `sky`: tracking/live/map info.
- Add `ash`: muted borders and table surfaces.

## Typography

- Keep display serif for page identity, but use it sparingly.
- Use body sans for dense tables and controls.
- Scale: 12 metadata, 14 table/body, 16 card body, 20 section title, 32-48 page/hero title.

## Components And Styles

- Cards: rounded `2xl/3xl`, thin border, subtle shadow, tighter variants for dense tables.
- Tables: sticky-ish header option, compact rows, avatar/image cell support, status cell support.
- Badges: semantic variants for active, inactive, archived, expired, warning, blocked, ready, dispatched, completed, failed, offline, stale.
- Page headers: module title, description, selected org, primary actions, optional metric strip.
- Profile cards: image/avatar, entity name, key identifier, status, top 4 facts, quick actions.
- Timeline: vertical rail with status icon, timestamp, actor, note.
- Map panels: borderless full-height card with sidebar slot.
- Forms: grouped `FormSection`, required markers, relation selects, sticky/safe action footer on long forms.

## Responsive Breakpoints

- Mobile: single-column cards, horizontal table overflow, actions collapse into menus.
- Tablet: two-column detail cards and summary metrics.
- Desktop: sidebar + main detail grid, map/sidebar split.

## Implementation Guidance

- Add Tailwind tokens centrally in `apps/web/tailwind.config.ts`.
- Add components rather than hardcoding one-off classes across pages.
- Keep `MetadataManager` for CRUD mechanics, but wrap it in richer domain-specific cards/tabs.
