# Stage 07: Vehicle Foundation API

Stage 07 introduces organization-scoped vehicle master data without adding runtime tracking, trip execution, maintenance, fuel, reporting, or frontend behavior.

## Scope Delivered
- vehicle classifications:
  - `VehicleType`
  - `VehicleGroup`
  - `VehicleMake`
  - `VehicleModel`
- vehicle registry:
  - `Vehicle`
- vehicle subresources:
  - `VehicleDocument`
  - `VehicleDevice`

## Design Notes
- all new records are tenant-aware and validated against `x-organization-id` or explicit organization context
- `SUPER_ADMIN` can access all organizations
- non-super-admin users must have active organization membership
- vehicle device records are metadata-only placeholders for future GPS/Traccar integration
- vehicle documents store file metadata only; no upload pipeline is introduced in this stage

## Status Enums
- `VehicleStatus`: `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `VehicleDocumentStatus`: `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `VehicleDeviceStatus`: `ACTIVE`, `INACTIVE`, `DETACHED`
- `VehicleFuelType`: `PETROL`, `DIESEL`, `CNG`, `LPG`, `ELECTRIC`, `HYBRID`, `OTHER`
- `VehicleOwnershipType`: `OWNED`, `LEASED`, `CONTRACTED`, `CUSTOMER_PROVIDED`, `OTHER`

## Audit Actions
- `admin.vehicle_type.*`
- `admin.vehicle_group.*`
- `admin.vehicle_make.*`
- `admin.vehicle_model.*`
- `admin.vehicle.*`
- `admin.vehicle_document.*`
- `admin.vehicle_device.*`
