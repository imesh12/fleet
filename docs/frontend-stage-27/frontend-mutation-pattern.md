# Frontend Mutation Pattern

Stage 27 extends the API client with helpers:

- `getList`
- `getOne`
- `post`
- `patch`
- `remove`
- `getErrorMessage`

Mutation flow:

1. Validate basic required fields through browser form requirements.
2. Submit through API helper.
3. Show backend envelope error messages when mutation fails.
4. Show toast notification on success or error.
5. Refresh list after successful mutation.
6. Disable submit button while saving.
7. Confirm activate/deactivate actions.

Organization-scoped modules rely on the selected organization context and automatic `x-organization-id` header.
