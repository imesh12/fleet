# Pagination And Filtering

Most list endpoints accept:

- `page`
- `pageSize`
- `search`
- module-specific filters

Typical response:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Use URL query params for list state so pages can be linked and refreshed.
