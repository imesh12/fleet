# Driver UI Analysis

The driver UI is the strongest visual reference in the legacy export.

## Legacy Findings

- Driver list includes photo, name, contact, license number, license expiry, status, and action columns.
- Driver card view uses image-first cards with rounded/shadow styling.
- Driver add form includes a large photo upload preview and a visible `Driver Photo` section before text fields.
- Driver profile/details use a profile-card pattern with circular image treatment in trip details.
- License expiry and status are prominent enough to support safety/compliance conversations.
- Performance scorecard uses info boxes and avatar rows to compare drivers.

## Recommended Modern Driver Profile Layout

Use a two-column responsive profile page:

- Left rail: `ProfileHeroCard` with avatar, display name, employee number, status, current assignment, phone/email, and quick actions.
- Main top row: compliance cards for license, documents, skills, and assignment readiness.
- Main tabs: Overview, Licenses, Documents, Compliance, Skills, Assignments, Activity.
- Right rail on desktop: expiring items and recent actions.
- Mobile: hero card collapses above tabs, quick actions become a sticky bottom/action row only if needed.

## Visual Details

- Avatar size: 96-128px on detail hero, 48-56px in tables.
- Fallback: generated initials in a colored circle.
- Status badges should distinguish active, inactive, archived, expired, suspended, and compliance-warning.
- License expiry should use an `ExpiryBadge`, not plain text.
- Assignment should be a card with vehicle plate, vehicle type, start date, and assignment status.

## Component Needs

- `DriverAvatar`: new.
- `ProfileHeroCard`: new.
- `ComplianceCard`: new or extend `SummaryCard`.
- `AssignmentCard`: new or extend `AssignmentManager`.
- `DetailTabs`: new.
- Existing `MetadataManager` should remain for CRUD subresources but be visually wrapped in richer sections.
