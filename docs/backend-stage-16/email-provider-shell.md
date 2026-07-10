# Email Provider Shell

Code:
- `packages/mailer/src/index.ts`

Supported providers:
- Console provider: default development behavior.
- SMTP shell: accepts SMTP-style config and logs accepted delivery without requiring production credentials.

Example provider config:

```json
{
  "smtp": {
    "host": "smtp.example.test",
    "port": 587,
    "secure": false,
    "username": "mailer@example.test",
    "from": "Trackigniter8 <noreply@example.test>"
  }
}
```

Test send:

```bash
curl -X POST http://localhost:3000/api/v1/admin/notification-providers/{providerId}/test-send \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"recipient\":\"ops@example.test\",\"subject\":\"Test\",\"body\":\"Stage 16 email shell test\"}"
```

