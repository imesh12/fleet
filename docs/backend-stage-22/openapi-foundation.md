# OpenAPI Foundation

Stage 22 adds a lightweight OpenAPI skeleton without introducing a Swagger dependency.

## Endpoints

- `GET /api/v1/openapi.json`
- `GET /api/v1/docs`

## Design

The OpenAPI document establishes:

- API title and version.
- `/api/v1` server base path.
- JWT bearer security scheme.
- success and error envelope schemas.
- placeholder paths for major modules.

The generated route inventory remains the authoritative Stage 22 route list until full per-route request and response schemas are attached.

## Future Expansion

Later stages can add:

- Fastify schema registration per route.
- Swagger UI dependency.
- generated TypeScript client.
- schema validation coverage checks.
