# Mobile Navigation Drawer

## Behavior

- A hamburger button appears in the topbar below the desktop breakpoint.
- Opening the drawer displays the existing RBAC-filtered sidebar in an overlay.
- The drawer closes when a user selects a navigation item.
- The drawer closes on Escape.
- The drawer closes when clicking the backdrop.
- Body scrolling is locked while the drawer is open.
- Focus moves to the drawer close button when opened.

## Implementation Notes

- `AppChrome` owns drawer state and keeps it separate from business pages.
- `Sidebar` accepts optional `className` and `onNavigate` props so the same navigation data powers desktop and mobile.
- `Topbar` accepts `onOpenNavigation` and exposes an accessible menu button.

## Remaining Enhancement

A future pass can add focus trapping inside the drawer for stricter accessibility. Current behavior is focus-safe enough for demo use but not a full modal focus trap.

