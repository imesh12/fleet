# Reusable Patterns

Stage 31 reuses:
- `MetadataManager`
- `DetailSection`
- `KeyValueGrid`
- `StatusBadge`
- `ToastProvider`
- `ReadEndpointCard`

`MetadataManager` now supports caller-provided rows for detail payload subresources. This is used for work-order tasks where the backend provides mutation endpoints but exposes the list through the work-order detail response.
