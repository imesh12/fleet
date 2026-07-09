# Assignment Policies

## Endpoints
- `GET /api/v1/admin/assignment-policies`
- `GET /api/v1/admin/assignment-policies/:assignmentPolicyId`
- `POST /api/v1/admin/assignment-policies`
- `PATCH /api/v1/admin/assignment-policies/:assignmentPolicyId`
- `POST /api/v1/admin/assignment-policies/:assignmentPolicyId/activate`
- `POST /api/v1/admin/assignment-policies/:assignmentPolicyId/deactivate`
- `POST /api/v1/admin/assignment-policies/:assignmentPolicyId/rules`
- `PATCH /api/v1/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId`
- `DELETE /api/v1/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId`
- `POST /api/v1/admin/assignment-policies/:assignmentPolicyId/rules/reorder`

## Example Rule Codes
- `VEHICLE_ACTIVE`
- `DRIVER_ACTIVE`
- `DRIVER_VALID_LICENSE`
- `VEHICLE_VALID_DOCUMENTS`
- `VEHICLE_ACTIVE_DEVICE`
- `ACTIVE_ASSIGNMENT_REQUIRED`
- `NO_OVERLAPPING_ACTIVE_ASSIGNMENT`
- `SAME_ORGANIZATION`
- `SAME_CUSTOMER`
- `CUSTOM`
