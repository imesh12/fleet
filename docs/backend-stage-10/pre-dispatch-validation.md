# Pre-Dispatch Validation

## Endpoint

- `POST /api/v1/admin/dispatch/validate`

## Request body

```json
{
  "plannedTripId": "trip_id",
  "assignmentPolicyId": "optional_policy_id",
  "readinessProfileId": "optional_profile_id"
}
```

## Response shape

```json
{
  "valid": true,
  "readinessResult": {
    "ready": true,
    "checks": [],
    "warnings": [],
    "blockers": []
  },
  "policyChecks": [],
  "blockers": [],
  "warnings": [],
  "context": {}
}
```

## Current rule coverage

Readiness checks:

- active vehicle
- active driver
- valid vehicle documents
- valid driver license
- active vehicle device
- active assignment
- expired vehicle compliance records
- expired driver compliance records

Assignment policy checks:

- `VEHICLE_ACTIVE`
- `DRIVER_ACTIVE`
- `DRIVER_VALID_LICENSE`
- `VEHICLE_VALID_DOCUMENTS`
- `VEHICLE_ACTIVE_DEVICE`
- `ACTIVE_ASSIGNMENT_REQUIRED`
- `NO_OVERLAPPING_ACTIVE_ASSIGNMENT`
- `SAME_ORGANIZATION`
- `SAME_CUSTOMER`
- `CUSTOM` placeholder

## Notes

- Validation does not start dispatch execution
- If explicit policy/profile ids are omitted, the first active organization record is used when available
- Validation requests are audit logged under `admin.dispatch.validate`
