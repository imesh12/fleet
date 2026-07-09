# Stage 09: Fleet Operations Foundation

Stage 09 adds operational readiness and compliance foundations on top of the vehicle and driver registries.

## Scope Delivered
- fleet readiness profiles
- vehicle compliance types and compliance records
- driver compliance types and compliance records
- assignment policies and ordered policy rules
- read-only fleet readiness evaluation

## Purpose
- prepare fleet validation before trips and dispatch begin
- centralize compliance metadata without implementing maintenance or live tracking
- provide reusable readiness rules for future dispatch and trip checks

## Key Models
- `FleetReadinessProfile`
- `VehicleComplianceType`
- `VehicleComplianceRecord`
- `DriverComplianceType`
- `DriverComplianceRecord`
- `AssignmentPolicy`
- `AssignmentPolicyRule`

## Audit Actions
- `admin.fleet_readiness_profile.*`
- `admin.vehicle_compliance_type.*`
- `admin.vehicle_compliance_record.*`
- `admin.driver_compliance_type.*`
- `admin.driver_compliance_record.*`
- `admin.assignment_policy.*`
- `admin.assignment_policy_rule.*`
