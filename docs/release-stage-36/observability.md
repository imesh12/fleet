# Observability

Available baseline:
- Structured Fastify/Pino logging.
- Request ID propagation.
- `/api/v1/health/live` for process liveness.
- `/api/v1/health/ready` for database and Redis readiness.
- `/api/v1/health` for aggregate dependency health.

Recommended next improvements:
- Centralized log shipping.
- Metrics endpoint or OpenTelemetry.
- Error reporting sink.
- Worker queue dashboards when external workers are introduced.
