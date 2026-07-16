# Docker Deployment

Deployment baseline:
- `api` service built from root `Dockerfile`
- `web` service built from `apps/web/Dockerfile`
- `postgres` service with persistent volume
- `redis` service with persistent volume and password

Local production-style flow:

```powershell
Copy-Item .env.production.example .env.production
# Edit .env.production with real secrets before running.
docker compose up --build
```

Health checks:
- API live: `/api/v1/health/live`
- API ready: `/api/v1/health/ready`
- PostgreSQL: `pg_isready`
- Redis: authenticated `redis-cli ping`

Do not embed real secrets in Docker files or Compose files.
