# Stage 21 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_21_file_document_storage_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample curls:

```bash
curl http://localhost:3000/api/v1/admin/storage/providers \
  -H "authorization: Bearer TOKEN"

curl -X POST http://localhost:3000/api/v1/admin/files/signed-upload-url \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"fileName\":\"vehicle-doc.pdf\",\"mimeType\":\"application/pdf\"}"

curl http://localhost:3000/api/v1/admin/attachments?entityType=vehicle&entityId=VEHICLE_ID \
  -H "authorization: Bearer TOKEN"
```

Expected:
- Migration applies.
- Seed adds storage/document permissions.
- Typecheck and build pass.
- Protected legacy secret files remain untouched.

