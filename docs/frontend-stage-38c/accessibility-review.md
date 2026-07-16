# Accessibility Review

## Improvements

- Added accessible hamburger and close button labels.
- Added `role="dialog"` and `aria-modal` to the mobile navigation drawer.
- Added Escape-key support for closing the drawer.
- Preserved visible focus outlines through the shared visual system.
- Kept status labels textual, not color-only.
- Moved organization selection into a mobile-visible area.

## Known Limitation

The drawer moves focus to the close button and supports Escape/backdrop close, but it does not yet implement a full focus trap. This is acceptable for the current demo baseline and should be revisited before a stricter accessibility audit.

