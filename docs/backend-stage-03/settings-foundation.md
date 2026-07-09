# Settings Foundation

Stage 03 introduces a generic `SystemSetting` table and API so later modules can store operational settings without coupling that work to SMTP, SMS, Traccar, or frontend rollout.

## Model
- `id`
- `key`
- `value`
- `valueType`
- `category`
- `isSecret`
- `description`
- `createdAt`
- `updatedAt`

## Supported Value Types
- `STRING`
- `NUMBER`
- `BOOLEAN`
- `JSON`

## API
Base path: `/api/v1/admin/settings`

- `GET /` list settings with optional `category`
- `GET /:key` get one setting
- `PUT /:key` upsert one setting
- `DELETE /:key` delete one setting

## Secret Handling
- secret settings are stored in the same table as non-secret settings in this stage
- API responses mask secret values by returning `value: null` and `isMasked: true`
- before production use, secret-at-rest encryption should be introduced for high-sensitivity values

## Suggested Categories
- `general`
- `auth`
- `notifications`
- `integrations`
