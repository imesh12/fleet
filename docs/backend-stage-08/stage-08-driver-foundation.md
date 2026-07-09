# Stage 08: Driver Foundation API

Stage 08 adds organization-scoped driver and workforce master data without introducing trips, dispatch, live tracking, payroll, or frontend behavior.

## Scope Delivered
- driver classifications:
  - `DriverGroup`
  - `DriverSkill`
  - `DriverSkillAssignment`
- driver registry:
  - `Driver`
- driver compliance metadata:
  - `DriverLicense`
  - `DriverDocument`
- driver to vehicle placeholder assignments:
  - `DriverVehicleAssignment`

## Design Notes
- all records are tenant-aware and enforced through organization membership checks
- `SUPER_ADMIN` can cross organizations
- licenses and documents are metadata-only in this stage
- vehicle assignments are placeholders for future dispatch and trip modules

## Driver Enums
- `DriverGender`: `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED`
- `DriverEmploymentType`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `TEMPORARY`, `OUTSOURCED`, `OTHER`
- `DriverStatus`: `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `DriverLicenseStatus`: `ACTIVE`, `INACTIVE`, `ARCHIVED`, `SUSPENDED`, `EXPIRED`
- `DriverDocumentStatus`: `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `DriverVehicleAssignmentType`: `PRIMARY`, `SECONDARY`, `TEMPORARY`, `RELIEF`, `OTHER`
- `DriverVehicleAssignmentStatus`: `ACTIVE`, `ENDED`, `CANCELED`

## Audit Actions
- `admin.driver_group.*`
- `admin.driver_skill.*`
- `admin.driver_skill_assignment.*`
- `admin.driver.*`
- `admin.driver_license.*`
- `admin.driver_document.*`
- `admin.driver_vehicle_assignment.*`
