# Invitation And Email Foundation

## Invitation Improvements
Base path: `/api/v1/admin/organization-invitations`

New Stage 06 capabilities:
- resend invitation
- expire invitation
- optional invitation message
- tracking of `lastSentAt`
- tracking of `sentCount`

## Mailer Package
- package path: `packages/mailer`
- current provider: `console`
- configuration placeholders:
  - `MAIL_PROVIDER`
  - `MAIL_FROM_EMAIL`
  - `MAIL_FROM_NAME`

The current implementation is intentionally development-safe. It logs outbound email metadata and returns a synthetic message id. It is designed to be replaced later with SMTP or a third-party provider without changing admin route contracts.

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/organization-invitations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"email\":\"ops@example.com\",\"role\":\"ADMIN\",\"message\":\"Welcome to the operations team\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/organization-invitations/<INVITATION_ID>/resend \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Resending your access link\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/organization-invitations/<INVITATION_ID>/expire \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
