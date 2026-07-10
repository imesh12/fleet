# Reusable Components

Stage 26 adds reusable frontend components:

- `PageHeader`
- `DataState`
- `SimpleTable`
- `StatusBadge`
- `ComingSoonPanel`
- `ModuleShell`

`ModuleShell` handles:

- backend endpoint calls.
- organization-context refresh.
- loading state.
- error state.
- empty state.
- simple table rendering.
- response preview for non-list endpoints.
- "Create/Edit coming in next stage" messaging.

The components are intentionally generic so module-specific pages can be refined incrementally in later stages.
