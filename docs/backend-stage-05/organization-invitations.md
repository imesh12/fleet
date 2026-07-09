# Organization Invitations

Stage 05 adds a lightweight invitation flow for onboarding existing platform users into organizations. Email delivery is still optional and future-facing.

## Model
- `id`
- `organizationId`
- `email`
- `role`
- `status`
- `tokenHash`
- `expiresAt`
- `acceptedAt`
- `canceledAt`
- `invitedByUserId`
- `createdAt`
- `updatedAt`

Status values:
- `PENDING`
- `ACCEPTED`
- `CANCELED`
- `EXPIRED`

## APIs
- `GET /api/v1/admin/organization-invitations`
- `POST /api/v1/admin/organization-invitations`
- `POST /api/v1/admin/organization-invitations/:invitationId/cancel`
- `POST /api/v1/admin/organization-invitations/accept`

## Behavior Notes
- create returns a token and example accept link in non-production mode
- accept requires an authenticated user
- the authenticated user email must match the invitation email
- acceptance creates or updates the `OrganizationUser` membership

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/organization-invitations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"email\":\"staff@example.com\",\"role\":\"MEMBER\",\"expiresInDays\":7}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/organization-invitations/accept \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"<INVITATION_TOKEN>\"}"
```
