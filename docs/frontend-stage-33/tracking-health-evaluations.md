# Tracking Health And Evaluations

Integrated APIs:
- `GET /admin/tracking/health`
- `POST /admin/tracking/evaluate`
- `GET /admin/tracking/evaluation-runs`

Frontend behavior:
- Health summary is displayed on the live tracking page.
- Tracking evaluation can be started from `/tracking/alerts`.
- Evaluation run history is displayed as a read-only API summary.

Stale/offline indicators use backend timestamps and local age calculations.
