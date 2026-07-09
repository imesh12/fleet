# Stage 06: Operational Extensions Foundation

Stage 06 extends the organization-scoped planning and master-data foundation before any fleet runtime modules begin.

## Scope Delivered
- vendor categories
- vendor contract metadata
- service areas and linked customer locations
- service route groups
- service route templates and template stops
- invitation resend/expire improvements
- reusable mailer foundation for development-safe email delivery

## Added Models
- `VendorCategory`
- `VendorContract`
- `ServiceArea`
- `ServiceAreaLocation`
- `ServiceRouteGroup`
- `ServiceRouteGroupRoute`
- `ServiceRouteTemplate`
- `ServiceRouteTemplateStop`

## Invitation Enhancements
- `message`
- `lastSentAt`
- `sentCount`
- resend endpoint
- expire endpoint

## Mailer Foundation
- package: `@trackigniter8/mailer`
- current implementation: console/dev mailer
- current behavior: invitation create/resend can emit mail send audit records without requiring SMTP
