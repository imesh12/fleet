export const DEFAULT_API_PREFIX = '/api/v1';

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
};

export type JwtSubjectType = 'user';

export type JwtAccessPayload = {
  sub: string;
  type: JwtSubjectType;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
};

export const ORGANIZATION_USER_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;

export type OrganizationUserRole = (typeof ORGANIZATION_USER_ROLES)[number];

export const ORGANIZATION_MEMBERSHIP_STATUSES = ['ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED'] as const;

export type OrganizationMembershipStatus = (typeof ORGANIZATION_MEMBERSHIP_STATUSES)[number];

export const ORGANIZATION_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const CUSTOMER_ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type CustomerAccountStatus = (typeof CUSTOMER_ACCOUNT_STATUSES)[number];

export const MASTER_DATA_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type MasterDataStatus = (typeof MASTER_DATA_STATUSES)[number];

export const ORGANIZATION_INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'CANCELED', 'EXPIRED'] as const;

export type OrganizationInvitationStatus = (typeof ORGANIZATION_INVITATION_STATUSES)[number];

export const VENDOR_CONTRACT_STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELED'] as const;

export type VendorContractStatus = (typeof VENDOR_CONTRACT_STATUSES)[number];

export const VEHICLE_FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID', 'OTHER'] as const;

export type VehicleFuelType = (typeof VEHICLE_FUEL_TYPES)[number];

export const VEHICLE_OWNERSHIP_TYPES = ['OWNED', 'LEASED', 'CONTRACTED', 'CUSTOMER_PROVIDED', 'OTHER'] as const;

export type VehicleOwnershipType = (typeof VEHICLE_OWNERSHIP_TYPES)[number];

export const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_DOCUMENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type VehicleDocumentStatus = (typeof VEHICLE_DOCUMENT_STATUSES)[number];

export const VEHICLE_DEVICE_STATUSES = ['ACTIVE', 'INACTIVE', 'DETACHED'] as const;

export type VehicleDeviceStatus = (typeof VEHICLE_DEVICE_STATUSES)[number];

export const DRIVER_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'] as const;

export type DriverGender = (typeof DRIVER_GENDERS)[number];

export const DRIVER_EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'OUTSOURCED',
  'OTHER',
] as const;

export type DriverEmploymentType = (typeof DRIVER_EMPLOYMENT_TYPES)[number];

export const DRIVER_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_LICENSE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'SUSPENDED', 'EXPIRED'] as const;

export type DriverLicenseStatus = (typeof DRIVER_LICENSE_STATUSES)[number];

export const DRIVER_DOCUMENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type DriverDocumentStatus = (typeof DRIVER_DOCUMENT_STATUSES)[number];

export const DRIVER_VEHICLE_ASSIGNMENT_TYPES = ['PRIMARY', 'SECONDARY', 'TEMPORARY', 'RELIEF', 'OTHER'] as const;

export type DriverVehicleAssignmentType = (typeof DRIVER_VEHICLE_ASSIGNMENT_TYPES)[number];

export const DRIVER_VEHICLE_ASSIGNMENT_STATUSES = ['ACTIVE', 'ENDED', 'CANCELED'] as const;

export type DriverVehicleAssignmentStatus = (typeof DRIVER_VEHICLE_ASSIGNMENT_STATUSES)[number];

export const COMPLIANCE_RECORD_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'EXPIRED'] as const;

export type ComplianceRecordStatus = (typeof COMPLIANCE_RECORD_STATUSES)[number];

export const ASSIGNMENT_POLICY_RULE_CODES = [
  'VEHICLE_ACTIVE',
  'DRIVER_ACTIVE',
  'DRIVER_VALID_LICENSE',
  'VEHICLE_VALID_DOCUMENTS',
  'VEHICLE_ACTIVE_DEVICE',
  'ACTIVE_ASSIGNMENT_REQUIRED',
  'NO_OVERLAPPING_ACTIVE_ASSIGNMENT',
  'SAME_ORGANIZATION',
  'SAME_CUSTOMER',
  'CUSTOM',
] as const;

export type AssignmentPolicyRuleCode = (typeof ASSIGNMENT_POLICY_RULE_CODES)[number];

export const PLANNED_TRIP_STATUSES = [
  'DRAFT',
  'PLANNED',
  'READY',
  'BLOCKED',
  'CANCELED',
  'DISPATCHED_PLACEHOLDER',
] as const;

export type PlannedTripStatus = (typeof PLANNED_TRIP_STATUSES)[number];

export const PLANNED_TRIP_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

export type PlannedTripPriority = (typeof PLANNED_TRIP_PRIORITIES)[number];

export const DISPATCH_QUEUE_ITEM_STATUSES = [
  'DRAFT',
  'PLANNED',
  'READY',
  'BLOCKED',
  'HELD',
  'CANCELED',
  'DISPATCHED_PLACEHOLDER',
] as const;

export type DispatchQueueItemStatus = (typeof DISPATCH_QUEUE_ITEM_STATUSES)[number];

export const TRIP_STATUSES = [
  'SCHEDULED',
  'READY',
  'DISPATCHED',
  'STARTED',
  'ON_HOLD',
  'RESUMED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_STOP_STATUSES = ['PENDING', 'ARRIVED', 'COMPLETED', 'SKIPPED', 'FAILED'] as const;

export type TripStopStatus = (typeof TRIP_STOP_STATUSES)[number];

export const TRIP_EVENT_TYPES = [
  'CREATED',
  'READINESS_VALIDATED',
  'DISPATCHED',
  'STARTED',
  'FORCE_STARTED',
  'HELD',
  'RESUMED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'STOP_STATUS_UPDATED',
  'STOP_REORDERED',
  'NOTE_ADDED',
  'TELEMETRY_RECEIVED',
  'MOVEMENT_STARTED',
  'MOVEMENT_STOPPED',
] as const;

export type TripEventType = (typeof TRIP_EVENT_TYPES)[number];

export const DISPATCH_ACTION_TYPES = [
  'VALIDATED',
  'ASSIGNED',
  'DISPATCHED',
  'STARTED',
  'HELD',
  'RESUMED',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'FORCE_STARTED',
  'NOTE',
] as const;

export type DispatchActionType = (typeof DISPATCH_ACTION_TYPES)[number];

export const TRACKING_PROVIDER_CREDENTIAL_AUTH_TYPES = ['API_KEY', 'BEARER_TOKEN'] as const;

export type TrackingProviderCredentialAuthType = (typeof TRACKING_PROVIDER_CREDENTIAL_AUTH_TYPES)[number];

export const TRACKING_HEALTH_STATUSES = ['UNKNOWN', 'ONLINE', 'DEGRADED', 'OFFLINE', 'ERROR'] as const;

export type TrackingHealthStatus = (typeof TRACKING_HEALTH_STATUSES)[number];

export const TRACKING_DEVICE_DISCOVERY_STATUSES = ['DISCOVERED', 'MAPPED', 'INACTIVE'] as const;

export type TrackingDeviceDiscoveryStatus = (typeof TRACKING_DEVICE_DISCOVERY_STATUSES)[number];

export const VEHICLE_DEVICE_MAPPING_STATUSES = ['ACTIVE', 'INACTIVE', 'UNMAPPED'] as const;

export type VehicleDeviceMappingStatus = (typeof VEHICLE_DEVICE_MAPPING_STATUSES)[number];

export const TRACKING_PROVIDER_SYNC_RUN_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED'] as const;

export type TrackingProviderSyncRunStatus = (typeof TRACKING_PROVIDER_SYNC_RUN_STATUSES)[number];

export const TRACKING_PROVIDER_SYNC_ITEM_STATUSES = ['PENDING', 'PROCESSED', 'SKIPPED', 'FAILED'] as const;

export type TrackingProviderSyncItemStatus = (typeof TRACKING_PROVIDER_SYNC_ITEM_STATUSES)[number];

export const TRACKING_ALERT_RULE_TYPES = [
  'DEVICE_OFFLINE',
  'SPEED_THRESHOLD',
  'IGNITION_ON',
  'IGNITION_OFF',
  'STALE_POSITION',
  'TRIP_STARTED',
  'TRIP_COMPLETED',
] as const;

export type TrackingAlertRuleType = (typeof TRACKING_ALERT_RULE_TYPES)[number];

export const TRACKING_ALERT_EVENT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const;

export type TrackingAlertEventStatus = (typeof TRACKING_ALERT_EVENT_STATUSES)[number];

export const GEOFENCE_TYPES = ['POLYGON', 'POLYLINE'] as const;

export type GeofenceType = (typeof GEOFENCE_TYPES)[number];

export const GEOFENCE_EVENT_TYPES = ['ENTER', 'EXIT', 'INSIDE', 'OUTSIDE'] as const;

export type GeofenceEventType = (typeof GEOFENCE_EVENT_TYPES)[number];

export const EVALUATION_RUN_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED'] as const;

export type EvaluationRunStatus = (typeof EVALUATION_RUN_STATUSES)[number];

export const EVALUATION_ITEM_STATUSES = ['PENDING', 'PROCESSED', 'SKIPPED', 'FAILED'] as const;

export type EvaluationItemStatus = (typeof EVALUATION_ITEM_STATUSES)[number];

export const TRACKING_NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'WEBHOOK', 'IN_APP'] as const;

export type TrackingNotificationChannel = (typeof TRACKING_NOTIFICATION_CHANNELS)[number];

export const TRACKING_NOTIFICATION_EVENT_STATUSES = [
  'PENDING',
  'GENERATED',
  'SKIPPED',
  'ACKNOWLEDGED',
  'RESOLVED',
] as const;

export type TrackingNotificationEventStatus = (typeof TRACKING_NOTIFICATION_EVENT_STATUSES)[number];

export const BACKGROUND_JOB_TYPES = [
  'TRACKING_PROVIDER_SYNC',
  'TRACKING_EVALUATION',
  'GEOFENCE_EVALUATION',
  'NOTIFICATION_DELIVERY',
  'CLEANUP_EXPIRED_INVITATIONS',
] as const;

export type BackgroundJobType = (typeof BACKGROUND_JOB_TYPES)[number];

export const BACKGROUND_JOB_RUN_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED'] as const;

export type BackgroundJobRunStatus = (typeof BACKGROUND_JOB_RUN_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_PROVIDER_TYPES = ['CONSOLE', 'EMAIL', 'WEBHOOK', 'IN_APP', 'SMS'] as const;

export type NotificationProviderType = (typeof NOTIFICATION_PROVIDER_TYPES)[number];

export const NOTIFICATION_DELIVERY_STATUSES = ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED'] as const;

export type NotificationDeliveryStatus = (typeof NOTIFICATION_DELIVERY_STATUSES)[number];

export const ESCALATION_EVENT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELED'] as const;

export type EscalationEventStatus = (typeof ESCALATION_EVENT_STATUSES)[number];

export const DEFAULT_PERMISSIONS = [
  {
    code: 'system:health:read',
    module: 'system',
    name: 'Read health status',
    description: 'Access application and infrastructure health information.',
  },
  {
    code: 'auth:self:read',
    module: 'auth',
    name: 'Read own profile',
    description: 'Read the authenticated user profile and permission summary.',
  },
  {
    code: 'auth:self:logout',
    module: 'auth',
    name: 'Logout current session',
    description: 'Revoke the current refresh token session.',
  },
  {
    code: 'iam:users:read',
    module: 'iam',
    name: 'Read users',
    description: 'List and inspect user accounts, roles, and permission summaries.',
  },
  {
    code: 'iam:users:manage',
    module: 'iam',
    name: 'Manage users',
    description: 'Create, update, activate, deactivate, and reset user accounts.',
  },
  {
    code: 'iam:roles:read',
    module: 'iam',
    name: 'Read roles',
    description: 'Inspect role definitions and assigned permissions.',
  },
  {
    code: 'iam:roles:manage',
    module: 'iam',
    name: 'Manage roles',
    description: 'Create custom roles and manage permission assignments.',
  },
  {
    code: 'iam:permissions:read',
    module: 'iam',
    name: 'Read permissions',
    description: 'Inspect system-defined permissions grouped by module.',
  },
  {
    code: 'iam:sessions:read',
    module: 'iam',
    name: 'Read sessions',
    description: 'Inspect active refresh token sessions for platform users.',
  },
  {
    code: 'iam:sessions:manage',
    module: 'iam',
    name: 'Manage sessions',
    description: 'Revoke one or more refresh token sessions for a user.',
  },
  {
    code: 'iam:seeds:run',
    module: 'iam',
    name: 'Run seed/bootstrap tasks',
    description: 'Run privileged bootstrap and seed routines.',
  },
  {
    code: 'audit:logs:write',
    module: 'audit',
    name: 'Write audit logs',
    description: 'Write audit events for sensitive platform actions.',
  },
  {
    code: 'audit:logs:read',
    module: 'audit',
    name: 'Read audit logs',
    description: 'Read and filter audit trail entries.',
  },
  {
    code: 'settings:read',
    module: 'settings',
    name: 'Read settings',
    description: 'Read non-secret and masked secret system settings.',
  },
  {
    code: 'settings:manage',
    module: 'settings',
    name: 'Manage settings',
    description: 'Create, update, and delete system settings values.',
  },
  {
    code: 'organizations:read',
    module: 'organizations',
    name: 'Read organizations',
    description: 'List and inspect organizations and tenant details.',
  },
  {
    code: 'organizations:manage',
    module: 'organizations',
    name: 'Manage organizations',
    description: 'Create, update, activate, deactivate, and configure organizations.',
  },
  {
    code: 'organization-users:read',
    module: 'organizations',
    name: 'Read organization users',
    description: 'List and inspect organization memberships.',
  },
  {
    code: 'organization-users:manage',
    module: 'organizations',
    name: 'Manage organization users',
    description: 'Assign users to organizations and update membership role or status.',
  },
  {
    code: 'customer-accounts:read',
    module: 'customers',
    name: 'Read customer accounts',
    description: 'List and inspect customer accounts within an organization.',
  },
  {
    code: 'customer-accounts:manage',
    module: 'customers',
    name: 'Manage customer accounts',
    description: 'Create, update, activate, and deactivate customer accounts.',
  },
  {
    code: 'customer-contacts:manage',
    module: 'customers',
    name: 'Manage customer contacts',
    description: 'Create, update, and delete customer account contacts.',
  },
  {
    code: 'customer-locations:manage',
    module: 'customers',
    name: 'Manage customer locations',
    description: 'Create, update, and delete customer account locations.',
  },
  {
    code: 'departments:read',
    module: 'organization',
    name: 'Read departments',
    description: 'List and inspect organization departments.',
  },
  {
    code: 'departments:manage',
    module: 'organization',
    name: 'Manage departments',
    description: 'Create, update, activate, and deactivate organization departments.',
  },
  {
    code: 'business-units:read',
    module: 'organization',
    name: 'Read business units',
    description: 'List and inspect organization business units.',
  },
  {
    code: 'business-units:manage',
    module: 'organization',
    name: 'Manage business units',
    description: 'Create, update, activate, and deactivate organization business units.',
  },
  {
    code: 'vendors:read',
    module: 'vendors',
    name: 'Read vendors',
    description: 'List and inspect organization vendors.',
  },
  {
    code: 'vendors:manage',
    module: 'vendors',
    name: 'Manage vendors',
    description: 'Create, update, activate, and deactivate organization vendors.',
  },
  {
    code: 'vendor-contacts:manage',
    module: 'vendors',
    name: 'Manage vendor contacts',
    description: 'Create, update, and delete vendor contacts.',
  },
  {
    code: 'service-routes:read',
    module: 'routes',
    name: 'Read service routes',
    description: 'List and inspect service route master data.',
  },
  {
    code: 'service-routes:manage',
    module: 'routes',
    name: 'Manage service routes',
    description: 'Create, update, activate, and deactivate service routes.',
  },
  {
    code: 'service-stops:manage',
    module: 'routes',
    name: 'Manage service stops',
    description: 'Create, update, delete, and reorder service route stops.',
  },
  {
    code: 'organization-invitations:read',
    module: 'organization',
    name: 'Read organization invitations',
    description: 'List and inspect organization invitation records.',
  },
  {
    code: 'organization-invitations:manage',
    module: 'organization',
    name: 'Manage organization invitations',
    description: 'Create, cancel, and accept organization invitations.',
  },
  {
    code: 'vendor-categories:read',
    module: 'vendors',
    name: 'Read vendor categories',
    description: 'List and inspect organization vendor categories.',
  },
  {
    code: 'vendor-categories:manage',
    module: 'vendors',
    name: 'Manage vendor categories',
    description: 'Create, update, activate, and deactivate vendor categories.',
  },
  {
    code: 'vendor-contracts:read',
    module: 'vendors',
    name: 'Read vendor contracts',
    description: 'List and inspect vendor contract metadata.',
  },
  {
    code: 'vendor-contracts:manage',
    module: 'vendors',
    name: 'Manage vendor contracts',
    description: 'Create, update, activate, expire, and cancel vendor contracts.',
  },
  {
    code: 'service-areas:read',
    module: 'operations',
    name: 'Read service areas',
    description: 'List and inspect service areas and their locations.',
  },
  {
    code: 'service-areas:manage',
    module: 'operations',
    name: 'Manage service areas',
    description: 'Create, update, activate, and deactivate service areas.',
  },
  {
    code: 'service-area-locations:manage',
    module: 'operations',
    name: 'Manage service area locations',
    description: 'Add and remove customer locations from service areas.',
  },
  {
    code: 'service-route-groups:read',
    module: 'routes',
    name: 'Read service route groups',
    description: 'List and inspect service route groups.',
  },
  {
    code: 'service-route-groups:manage',
    module: 'routes',
    name: 'Manage service route groups',
    description: 'Create, update, activate, and deactivate service route groups.',
  },
  {
    code: 'service-route-templates:read',
    module: 'routes',
    name: 'Read service route templates',
    description: 'List and inspect service route templates.',
  },
  {
    code: 'service-route-templates:manage',
    module: 'routes',
    name: 'Manage service route templates',
    description: 'Create, update, activate, and deactivate service route templates.',
  },
  {
    code: 'service-route-template-stops:manage',
    module: 'routes',
    name: 'Manage service route template stops',
    description: 'Create, update, delete, and reorder template stops.',
  },
  {
    code: 'notifications:send',
    module: 'notifications',
    name: 'Send notifications',
    description: 'Send operational email notifications through configured adapters.',
  },
  {
    code: 'vehicle-types:read',
    module: 'vehicles',
    name: 'Read vehicle types',
    description: 'List and inspect organization vehicle type classifications.',
  },
  {
    code: 'vehicle-types:manage',
    module: 'vehicles',
    name: 'Manage vehicle types',
    description: 'Create, update, activate, and deactivate organization vehicle types.',
  },
  {
    code: 'vehicle-groups:read',
    module: 'vehicles',
    name: 'Read vehicle groups',
    description: 'List and inspect organization vehicle groups.',
  },
  {
    code: 'vehicle-groups:manage',
    module: 'vehicles',
    name: 'Manage vehicle groups',
    description: 'Create, update, activate, and deactivate organization vehicle groups.',
  },
  {
    code: 'vehicle-makes:read',
    module: 'vehicles',
    name: 'Read vehicle makes',
    description: 'List and inspect organization vehicle make metadata.',
  },
  {
    code: 'vehicle-makes:manage',
    module: 'vehicles',
    name: 'Manage vehicle makes',
    description: 'Create, update, activate, and deactivate organization vehicle makes.',
  },
  {
    code: 'vehicle-models:read',
    module: 'vehicles',
    name: 'Read vehicle models',
    description: 'List and inspect organization vehicle model metadata.',
  },
  {
    code: 'vehicle-models:manage',
    module: 'vehicles',
    name: 'Manage vehicle models',
    description: 'Create, update, activate, and deactivate organization vehicle models.',
  },
  {
    code: 'vehicles:read',
    module: 'vehicles',
    name: 'Read vehicles',
    description: 'List and inspect organization vehicles.',
  },
  {
    code: 'vehicles:manage',
    module: 'vehicles',
    name: 'Manage vehicles',
    description: 'Create, update, activate, deactivate, and archive organization vehicles.',
  },
  {
    code: 'vehicle-documents:read',
    module: 'vehicles',
    name: 'Read vehicle documents',
    description: 'List and inspect vehicle document metadata and expiry details.',
  },
  {
    code: 'vehicle-documents:manage',
    module: 'vehicles',
    name: 'Manage vehicle documents',
    description: 'Create, update, and archive vehicle document metadata.',
  },
  {
    code: 'vehicle-devices:read',
    module: 'vehicles',
    name: 'Read vehicle devices',
    description: 'List and inspect vehicle device integration metadata.',
  },
  {
    code: 'vehicle-devices:manage',
    module: 'vehicles',
    name: 'Manage vehicle devices',
    description: 'Attach, update, and detach vehicle device metadata.',
  },
  {
    code: 'driver-groups:read',
    module: 'drivers',
    name: 'Read driver groups',
    description: 'List and inspect organization driver groups.',
  },
  {
    code: 'driver-groups:manage',
    module: 'drivers',
    name: 'Manage driver groups',
    description: 'Create, update, activate, and deactivate driver groups.',
  },
  {
    code: 'driver-skills:read',
    module: 'drivers',
    name: 'Read driver skills',
    description: 'List and inspect organization driver skills and assignments.',
  },
  {
    code: 'driver-skills:manage',
    module: 'drivers',
    name: 'Manage driver skills',
    description: 'Create, update, activate, deactivate, and assign driver skills.',
  },
  {
    code: 'drivers:read',
    module: 'drivers',
    name: 'Read drivers',
    description: 'List and inspect organization driver records.',
  },
  {
    code: 'drivers:manage',
    module: 'drivers',
    name: 'Manage drivers',
    description: 'Create, update, activate, deactivate, and archive organization drivers.',
  },
  {
    code: 'driver-licenses:read',
    module: 'drivers',
    name: 'Read driver licenses',
    description: 'List and inspect driver license metadata and expiry details.',
  },
  {
    code: 'driver-licenses:manage',
    module: 'drivers',
    name: 'Manage driver licenses',
    description: 'Create, update, and archive driver license metadata.',
  },
  {
    code: 'driver-documents:read',
    module: 'drivers',
    name: 'Read driver documents',
    description: 'List and inspect driver document metadata and expiry details.',
  },
  {
    code: 'driver-documents:manage',
    module: 'drivers',
    name: 'Manage driver documents',
    description: 'Create, update, and archive driver document metadata.',
  },
  {
    code: 'driver-vehicle-assignments:read',
    module: 'drivers',
    name: 'Read driver vehicle assignments',
    description: 'List and inspect driver vehicle assignment placeholders.',
  },
  {
    code: 'driver-vehicle-assignments:manage',
    module: 'drivers',
    name: 'Manage driver vehicle assignments',
    description: 'Create, update, activate, end, and cancel driver vehicle assignments.',
  },
  {
    code: 'fleet-readiness:read',
    module: 'fleet-operations',
    name: 'Read fleet readiness',
    description: 'Read fleet readiness profiles and readiness evaluation results.',
  },
  {
    code: 'fleet-readiness:manage',
    module: 'fleet-operations',
    name: 'Manage fleet readiness',
    description: 'Create, update, activate, and deactivate fleet readiness profiles.',
  },
  {
    code: 'vehicle-compliance-types:read',
    module: 'fleet-operations',
    name: 'Read vehicle compliance types',
    description: 'List and inspect vehicle compliance type definitions.',
  },
  {
    code: 'vehicle-compliance-types:manage',
    module: 'fleet-operations',
    name: 'Manage vehicle compliance types',
    description: 'Create, update, activate, and deactivate vehicle compliance type definitions.',
  },
  {
    code: 'vehicle-compliance-records:read',
    module: 'fleet-operations',
    name: 'Read vehicle compliance records',
    description: 'List and inspect vehicle compliance records and expiries.',
  },
  {
    code: 'vehicle-compliance-records:manage',
    module: 'fleet-operations',
    name: 'Manage vehicle compliance records',
    description: 'Create, update, and archive vehicle compliance records.',
  },
  {
    code: 'driver-compliance-types:read',
    module: 'fleet-operations',
    name: 'Read driver compliance types',
    description: 'List and inspect driver compliance type definitions.',
  },
  {
    code: 'driver-compliance-types:manage',
    module: 'fleet-operations',
    name: 'Manage driver compliance types',
    description: 'Create, update, activate, and deactivate driver compliance type definitions.',
  },
  {
    code: 'driver-compliance-records:read',
    module: 'fleet-operations',
    name: 'Read driver compliance records',
    description: 'List and inspect driver compliance records and expiries.',
  },
  {
    code: 'driver-compliance-records:manage',
    module: 'fleet-operations',
    name: 'Manage driver compliance records',
    description: 'Create, update, and archive driver compliance records.',
  },
  {
    code: 'assignment-policies:read',
    module: 'fleet-operations',
    name: 'Read assignment policies',
    description: 'List and inspect assignment policies and their rules.',
  },
  {
    code: 'assignment-policies:manage',
    module: 'fleet-operations',
    name: 'Manage assignment policies',
    description: 'Create, update, activate, deactivate, and manage assignment policy rules.',
  },
  {
    code: 'trip-templates:read',
    module: 'dispatch-planning',
    name: 'Read trip templates',
    description: 'List and inspect reusable trip templates and stop patterns.',
  },
  {
    code: 'trip-templates:manage',
    module: 'dispatch-planning',
    name: 'Manage trip templates',
    description: 'Create, update, activate, and deactivate trip templates.',
  },
  {
    code: 'trip-template-stops:manage',
    module: 'dispatch-planning',
    name: 'Manage trip template stops',
    description: 'Create, update, delete, and reorder trip template stops.',
  },
  {
    code: 'planned-trips:read',
    module: 'dispatch-planning',
    name: 'Read planned trips',
    description: 'List and inspect planned trips and their stop plans.',
  },
  {
    code: 'planned-trips:manage',
    module: 'dispatch-planning',
    name: 'Manage planned trips',
    description: 'Create, update, cancel, assign, and unassign planned trips.',
  },
  {
    code: 'planned-trip-stops:manage',
    module: 'dispatch-planning',
    name: 'Manage planned trip stops',
    description: 'Create, update, delete, and reorder planned trip stops.',
  },
  {
    code: 'dispatch-queues:read',
    module: 'dispatch-planning',
    name: 'Read dispatch queues',
    description: 'List and inspect dispatch queues and queued trip items.',
  },
  {
    code: 'dispatch-queues:manage',
    module: 'dispatch-planning',
    name: 'Manage dispatch queues',
    description: 'Create, update, activate, deactivate, and manage dispatch queue items.',
  },
  {
    code: 'dispatch-validation:read',
    module: 'dispatch-planning',
    name: 'Read dispatch validation',
    description: 'Run pre-dispatch readiness and assignment policy validation checks.',
  },
  {
    code: 'dispatch-status:manage',
    module: 'dispatch-planning',
    name: 'Manage dispatch status',
    description: 'Update safe planning and queue status transitions before runtime dispatch exists.',
  },
  {
    code: 'trips:read',
    module: 'trip-execution',
    name: 'Read trips',
    description: 'List and inspect trip execution records, stops, and runtime history.',
  },
  {
    code: 'trips:manage',
    module: 'trip-execution',
    name: 'Manage trips',
    description: 'Create execution trips from planned trips and manage general lifecycle updates.',
  },
  {
    code: 'trips:start',
    module: 'trip-execution',
    name: 'Start trips',
    description: 'Run readiness checks and start trip execution.',
  },
  {
    code: 'trips:complete',
    module: 'trip-execution',
    name: 'Complete trips',
    description: 'Complete running trips and close execution lifecycle state.',
  },
  {
    code: 'trips:cancel',
    module: 'trip-execution',
    name: 'Cancel trips',
    description: 'Cancel or fail trip execution records.',
  },
  {
    code: 'trips:force-start',
    module: 'trip-execution',
    name: 'Force start trips',
    description: 'Override readiness blockers and force trip start when operationally required.',
  },
  {
    code: 'trip-stops:manage',
    module: 'trip-execution',
    name: 'Manage trip stops',
    description: 'Update trip stop status, notes, timestamps, and reorder stops before trip start.',
  },
  {
    code: 'trip-events:read',
    module: 'trip-execution',
    name: 'Read trip events',
    description: 'Inspect trip event timeline and runtime lifecycle events.',
  },
  {
    code: 'dispatch-actions:read',
    module: 'trip-execution',
    name: 'Read dispatch actions',
    description: 'Inspect dispatch action history across trips, planned trips, and queue items.',
  },
  {
    code: 'dispatch-actions:manage',
    module: 'trip-execution',
    name: 'Manage dispatch actions',
    description: 'Record operational dispatch actions and execution-side activity.',
  },
  {
    code: 'tracking-providers:read',
    module: 'tracking',
    name: 'Read tracking providers',
    description: 'List and inspect tracking providers, masked credentials, and provider health state.',
  },
  {
    code: 'tracking-providers:manage',
    module: 'tracking',
    name: 'Manage tracking providers',
    description: 'Create, update, activate, deactivate, and configure tracking providers.',
  },
  {
    code: 'tracking-credentials:manage',
    module: 'tracking',
    name: 'Manage tracking credentials',
    description: 'Create, rotate, deactivate, and inspect masked provider ingest credentials.',
  },
  {
    code: 'tracking-ingest:write',
    module: 'tracking',
    name: 'Write tracking ingest',
    description: 'Submit telemetry ingestion payloads into the tracking pipeline.',
  },
  {
    code: 'vehicle-positions:read',
    module: 'tracking',
    name: 'Read vehicle positions',
    description: 'Read latest vehicle positions and position history for an organization.',
  },
  {
    code: 'vehicle-telemetry-events:read',
    module: 'tracking',
    name: 'Read vehicle telemetry events',
    description: 'Read raw and normalized vehicle telemetry event history.',
  },
  {
    code: 'tracking-health:read',
    module: 'tracking',
    name: 'Read tracking health',
    description: 'Read provider health, device last-seen information, and stale tracking indicators.',
  },
  {
    code: 'tracking-external-devices:read',
    module: 'tracking',
    name: 'Read external tracking devices',
    description: 'List and inspect discovered external tracking devices from provider sources.',
  },
  {
    code: 'tracking-external-devices:manage',
    module: 'tracking',
    name: 'Manage external tracking devices',
    description: 'Upsert discovered external tracking devices and manage device discovery metadata.',
  },
  {
    code: 'tracking-device-mappings:read',
    module: 'tracking',
    name: 'Read tracking device mappings',
    description: 'Read external-to-internal tracking device mappings for vehicles and vehicle devices.',
  },
  {
    code: 'tracking-device-mappings:manage',
    module: 'tracking',
    name: 'Manage tracking device mappings',
    description: 'Create, update, deactivate, and unmap external tracking device mappings.',
  },
  {
    code: 'tracking-provider-sync:read',
    module: 'tracking',
    name: 'Read tracking provider sync runs',
    description: 'Read tracking provider sync runs and sync item history.',
  },
  {
    code: 'tracking-provider-sync:manage',
    module: 'tracking',
    name: 'Manage tracking provider sync runs',
    description: 'Create manual sync runs and update sync run item status placeholders.',
  },
  {
    code: 'tracking-alert-rules:read',
    module: 'tracking',
    name: 'Read tracking alert rules',
    description: 'Read tracking alert rules and rule configuration for telemetry evaluation.',
  },
  {
    code: 'tracking-alert-rules:manage',
    module: 'tracking',
    name: 'Manage tracking alert rules',
    description: 'Create, update, activate, and deactivate tracking alert rules.',
  },
  {
    code: 'tracking-alert-events:read',
    module: 'tracking',
    name: 'Read tracking alert events',
    description: 'Read tracking alert events generated from ingest or later rule evaluation.',
  },
  {
    code: 'tracking-alert-events:manage',
    module: 'tracking',
    name: 'Manage tracking alert events',
    description: 'Acknowledge and resolve tracking alert events.',
  },
  {
    code: 'geofences:read',
    module: 'tracking',
    name: 'Read geofences',
    description: 'Read stored geofence definitions and point geometry.',
  },
  {
    code: 'geofences:manage',
    module: 'tracking',
    name: 'Manage geofences',
    description: 'Create, update, activate, deactivate, and manage geofence points.',
  },
  {
    code: 'tracking-sync:manage',
    module: 'tracking',
    name: 'Manage tracking sync execution',
    description: 'Run provider sync execution flows and manual tracking pull jobs.',
  },
  {
    code: 'geofence-events:read',
    module: 'tracking',
    name: 'Read geofence events',
    description: 'Read geofence runtime evaluation events for vehicles and trips.',
  },
  {
    code: 'geofence-evaluation:manage',
    module: 'tracking',
    name: 'Manage geofence evaluation',
    description: 'Run manual geofence evaluation against latest or selected vehicle positions.',
  },
  {
    code: 'tracking-evaluation:read',
    module: 'tracking',
    name: 'Read tracking evaluation runs',
    description: 'Read tracking evaluator run history and item-level results.',
  },
  {
    code: 'tracking-evaluation:manage',
    module: 'tracking',
    name: 'Manage tracking evaluations',
    description: 'Run tracking alert evaluators for stale, offline, speed, and ignition checks.',
  },
  {
    code: 'trip-replay:read',
    module: 'tracking',
    name: 'Read trip replay',
    description: 'Read replay-ready trip telemetry and position history.',
  },
  {
    code: 'vehicle-replay:read',
    module: 'tracking',
    name: 'Read vehicle replay',
    description: 'Read replay-ready vehicle telemetry and position history.',
  },
  {
    code: 'tracking-notification-rules:read',
    module: 'tracking',
    name: 'Read tracking notification rules',
    description: 'Read tracking notification routing and escalation placeholders.',
  },
  {
    code: 'tracking-notification-rules:manage',
    module: 'tracking',
    name: 'Manage tracking notification rules',
    description: 'Create, update, activate, deactivate, and configure tracking notification placeholders.',
  },
  {
    code: 'tracking-notification-events:read',
    module: 'tracking',
    name: 'Read tracking notification events',
    description: 'Read generated tracking notification placeholder events and escalation history.',
  },
  {
    code: 'traccar-webhook:write',
    module: 'tracking',
    name: 'Write Traccar webhook ingest',
    description: 'Submit Traccar-normalized telemetry into the tracking ingest pipeline.',
  },
  {
    code: 'traccar-pull:manage',
    module: 'tracking',
    name: 'Manage Traccar pull',
    description: 'Run manual Traccar pull normalization and ingest jobs for a provider.',
  },
  {
    code: 'background-jobs:read',
    module: 'automation',
    name: 'Read background jobs',
    description: 'Read background job definitions and configuration.',
  },
  {
    code: 'background-jobs:manage',
    module: 'automation',
    name: 'Manage background jobs',
    description: 'Create, update, activate, deactivate, and trigger background jobs.',
  },
  {
    code: 'background-job-runs:read',
    module: 'automation',
    name: 'Read background job runs',
    description: 'Read background job runs, results, and execution logs.',
  },
  {
    code: 'queues:read',
    module: 'automation',
    name: 'Read queues',
    description: 'Read queue state and pending foundation worker jobs.',
  },
  {
    code: 'queues:manage',
    module: 'automation',
    name: 'Manage queues',
    description: 'Manage queue registrations, enqueue requests, and recurring job hooks.',
  },
  {
    code: 'job-schedules:read',
    module: 'automation',
    name: 'Read job schedules',
    description: 'Read background job schedules, next run previews, and due job lists.',
  },
  {
    code: 'job-schedules:manage',
    module: 'automation',
    name: 'Manage job schedules',
    description: 'Enable, disable, and update recurring background job schedules.',
  },
  {
    code: 'workers:run',
    module: 'automation',
    name: 'Run workers',
    description: 'Trigger due background jobs and immediate worker executions.',
  },
  {
    code: 'notification-providers:read',
    module: 'notifications',
    name: 'Read notification providers',
    description: 'Read notification providers and delivery configuration.',
  },
  {
    code: 'notification-providers:manage',
    module: 'notifications',
    name: 'Manage notification providers',
    description: 'Create, update, activate, deactivate, and test notification providers.',
  },
  {
    code: 'notification-templates:read',
    module: 'notifications',
    name: 'Read notification templates',
    description: 'Read notification templates for email, webhook, in-app, and SMS placeholders.',
  },
  {
    code: 'notification-templates:manage',
    module: 'notifications',
    name: 'Manage notification templates',
    description: 'Create, update, activate, deactivate, and test notification templates.',
  },
  {
    code: 'notification-deliveries:read',
    module: 'notifications',
    name: 'Read notification deliveries',
    description: 'Read notification deliveries, statuses, attempts, and results.',
  },
  {
    code: 'notification-deliveries:manage',
    module: 'notifications',
    name: 'Manage notification deliveries',
    description: 'Trigger, retry, cancel, and update notification deliveries.',
  },
  {
    code: 'notification-retries:manage',
    module: 'notifications',
    name: 'Manage notification retries',
    description: 'Retry due notification deliveries, retry one delivery, and cancel retry workflows.',
  },
  {
    code: 'webhook-providers:manage',
    module: 'notifications',
    name: 'Manage webhook providers',
    description: 'Manage webhook provider shell configuration and test delivery behavior.',
  },
  {
    code: 'smtp-providers:manage',
    module: 'notifications',
    name: 'Manage SMTP providers',
    description: 'Manage SMTP provider shell configuration and test email behavior.',
  },
  {
    code: 'maintenance-categories:read',
    module: 'maintenance',
    name: 'Read maintenance categories',
    description: 'Read organization-scoped maintenance categories.',
  },
  {
    code: 'maintenance-categories:manage',
    module: 'maintenance',
    name: 'Manage maintenance categories',
    description: 'Create, update, activate, and deactivate maintenance categories.',
  },
  {
    code: 'maintenance-service-tasks:read',
    module: 'maintenance',
    name: 'Read maintenance service tasks',
    description: 'Read preventive maintenance service task definitions.',
  },
  {
    code: 'maintenance-service-tasks:manage',
    module: 'maintenance',
    name: 'Manage maintenance service tasks',
    description: 'Create, update, activate, and deactivate maintenance service tasks.',
  },
  {
    code: 'inspection-checklists:read',
    module: 'maintenance',
    name: 'Read inspection checklists',
    description: 'Read inspection checklist templates and items.',
  },
  {
    code: 'inspection-checklists:manage',
    module: 'maintenance',
    name: 'Manage inspection checklists',
    description: 'Create, update, activate, deactivate, and manage inspection checklist items.',
  },
  {
    code: 'vehicle-maintenance-plans:read',
    module: 'maintenance',
    name: 'Read vehicle maintenance plans',
    description: 'Read vehicle maintenance plans, plan tasks, and due summaries.',
  },
  {
    code: 'vehicle-maintenance-plans:manage',
    module: 'maintenance',
    name: 'Manage vehicle maintenance plans',
    description: 'Create, update, activate, deactivate, and manage vehicle maintenance plan tasks.',
  },
  {
    code: 'maintenance-requests:read',
    module: 'maintenance',
    name: 'Read maintenance requests',
    description: 'Read maintenance requests and planning state.',
  },
  {
    code: 'maintenance-requests:manage',
    module: 'maintenance',
    name: 'Manage maintenance requests',
    description: 'Create, update, and cancel maintenance requests.',
  },
  {
    code: 'maintenance-work-orders:read',
    module: 'maintenance',
    name: 'Read maintenance work orders',
    description: 'Read maintenance work order planning records and tasks.',
  },
  {
    code: 'maintenance-work-orders:manage',
    module: 'maintenance',
    name: 'Manage maintenance work orders',
    description: 'Create, update, cancel, and manage maintenance work order tasks.',
  },
  {
    code: 'maintenance-due:read',
    module: 'maintenance',
    name: 'Read maintenance due',
    description: 'Read due, overdue, and upcoming maintenance summaries.',
  },
  {
    code: 'fuel-types:read',
    module: 'fuel',
    name: 'Read fuel types',
    description: 'Read organization-scoped fuel types.',
  },
  {
    code: 'fuel-types:manage',
    module: 'fuel',
    name: 'Manage fuel types',
    description: 'Create, update, activate, and deactivate fuel types.',
  },
  {
    code: 'fuel-vendor-profiles:read',
    module: 'fuel',
    name: 'Read fuel vendor profiles',
    description: 'Read fuel-specific vendor and station metadata.',
  },
  {
    code: 'fuel-vendor-profiles:manage',
    module: 'fuel',
    name: 'Manage fuel vendor profiles',
    description: 'Create, update, activate, and deactivate fuel vendor profiles.',
  },
  {
    code: 'fuel-cards:read',
    module: 'fuel',
    name: 'Read fuel cards',
    description: 'Read fuel card assignments, status, and expiry metadata.',
  },
  {
    code: 'fuel-cards:manage',
    module: 'fuel',
    name: 'Manage fuel cards',
    description: 'Create, update, activate, deactivate, block, and archive fuel cards.',
  },
  {
    code: 'fuel-tanks:read',
    module: 'fuel',
    name: 'Read fuel tanks',
    description: 'Read fuel tank storage and level metadata.',
  },
  {
    code: 'fuel-tanks:manage',
    module: 'fuel',
    name: 'Manage fuel tanks',
    description: 'Create, update, activate, deactivate, and update fuel tank levels.',
  },
  {
    code: 'fuel-policies:read',
    module: 'fuel',
    name: 'Read fuel policies',
    description: 'Read fuel policies and ordered policy rules.',
  },
  {
    code: 'fuel-policies:manage',
    module: 'fuel',
    name: 'Manage fuel policies',
    description: 'Create, update, activate, deactivate, and manage fuel policy rules.',
  },
  {
    code: 'fuel-requests:read',
    module: 'fuel',
    name: 'Read fuel requests',
    description: 'Read planned or requested fuel actions.',
  },
  {
    code: 'fuel-requests:manage',
    module: 'fuel',
    name: 'Manage fuel requests',
    description: 'Create, update, approve, reject, cancel, and fulfill fuel requests.',
  },
  {
    code: 'fuel-entries:read',
    module: 'fuel',
    name: 'Read fuel entries',
    description: 'Read fuel entry metadata and receipt placeholders.',
  },
  {
    code: 'fuel-entries:manage',
    module: 'fuel',
    name: 'Manage fuel entries',
    description: 'Create, update, approve, reject, cancel, and archive fuel entries.',
  },
  {
    code: 'fuel-alerts:read',
    module: 'fuel',
    name: 'Read fuel alerts',
    description: 'Read card expiry, tank low level, and policy violation placeholder alerts.',
  },
  {
    code: 'reports:read',
    module: 'reports',
    name: 'Read reports',
    description: 'Read report categories, definitions, and filter presets.',
  },
  {
    code: 'reports:manage',
    module: 'reports',
    name: 'Manage reports',
    description: 'Create and update report categories, definitions, and filter presets.',
  },
  {
    code: 'report-runs:read',
    module: 'reports',
    name: 'Read report runs',
    description: 'Read report run history and placeholder results.',
  },
  {
    code: 'report-exports:manage',
    module: 'reports',
    name: 'Manage report exports',
    description: 'Create and manage report export placeholder jobs.',
  },
  {
    code: 'dashboard:read',
    module: 'dashboard',
    name: 'Read dashboard',
    description: 'Read dashboard widgets and summary snapshots.',
  },
  {
    code: 'dashboard:manage',
    module: 'dashboard',
    name: 'Manage dashboard',
    description: 'Create and update dashboard widget definitions.',
  },
  {
    code: 'navigation:read',
    module: 'navigation',
    name: 'Read navigation',
    description: 'Read application menu groups, menu items, and registered pages.',
  },
  {
    code: 'navigation:manage',
    module: 'navigation',
    name: 'Manage navigation',
    description: 'Create, update, reorder, and change status for menu and page registry entries.',
  },
  {
    code: 'feature-flags:read',
    module: 'platform',
    name: 'Read feature flags',
    description: 'Read global and tenant feature flag metadata.',
  },
  {
    code: 'feature-flags:manage',
    module: 'platform',
    name: 'Manage feature flags',
    description: 'Create and update global and tenant feature flag metadata.',
  },
  {
    code: 'storage-providers:read',
    module: 'storage',
    name: 'Read storage providers',
    description: 'Read storage provider metadata and configuration placeholders.',
  },
  {
    code: 'storage-providers:manage',
    module: 'storage',
    name: 'Manage storage providers',
    description: 'Create, update, activate, and deactivate storage providers.',
  },
  {
    code: 'storage-buckets:read',
    module: 'storage',
    name: 'Read storage buckets',
    description: 'Read storage bucket metadata and configuration placeholders.',
  },
  {
    code: 'storage-buckets:manage',
    module: 'storage',
    name: 'Manage storage buckets',
    description: 'Create, update, activate, and deactivate storage buckets.',
  },
  {
    code: 'files:read',
    module: 'storage',
    name: 'Read files',
    description: 'Read file object and file version metadata.',
  },
  {
    code: 'files:manage',
    module: 'storage',
    name: 'Manage files',
    description: 'Create, update, archive, delete metadata, version metadata, and signed URL placeholders.',
  },
  {
    code: 'file-attachments:read',
    module: 'storage',
    name: 'Read file attachments',
    description: 'Read file attachment links across supported modules.',
  },
  {
    code: 'file-attachments:manage',
    module: 'storage',
    name: 'Manage file attachments',
    description: 'Attach files to entities and archive attachment links.',
  },
  {
    code: 'file-access-logs:read',
    module: 'storage',
    name: 'Read file access logs',
    description: 'Read file access logs and signed URL access records.',
  },
  {
    code: 'document-retention:read',
    module: 'storage',
    name: 'Read document retention',
    description: 'Read document retention policies and evaluation metadata.',
  },
  {
    code: 'document-retention:manage',
    module: 'storage',
    name: 'Manage document retention',
    description: 'Create, update, activate, and deactivate document retention policies.',
  },
  {
    code: 'escalation-policies:read',
    module: 'notifications',
    name: 'Read escalation policies',
    description: 'Read escalation policies and ordered escalation steps.',
  },
  {
    code: 'escalation-policies:manage',
    module: 'notifications',
    name: 'Manage escalation policies',
    description: 'Create, update, activate, deactivate, and manage escalation policy steps.',
  },
  {
    code: 'escalation-events:read',
    module: 'notifications',
    name: 'Read escalation events',
    description: 'Read escalation events linked to tracking alerts and notification workflows.',
  },
  {
    code: 'escalation-events:manage',
    module: 'notifications',
    name: 'Manage escalation events',
    description: 'Create, acknowledge, resolve, and update escalation events.',
  },
] as const;

export type PermissionDefinition = (typeof DEFAULT_PERMISSIONS)[number];

export const PROTECTED_SYSTEM_ROLE_CODES = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.MANAGER,
  ROLE_CODES.STAFF,
  ROLE_CODES.VIEWER,
] as const;

export type ProtectedSystemRoleCode = (typeof PROTECTED_SYSTEM_ROLE_CODES)[number];

export const SYSTEM_SETTING_VALUE_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const;

export type SystemSettingValueType = (typeof SYSTEM_SETTING_VALUE_TYPES)[number];

export const DEFAULT_ROLE_PERMISSION_MAP: Record<RoleCode, string[]> = {
  SUPER_ADMIN: DEFAULT_PERMISSIONS.map((permission) => permission.code),
  ADMIN: [
    'system:health:read',
    'auth:self:read',
    'auth:self:logout',
    'iam:users:read',
    'iam:users:manage',
    'iam:roles:read',
    'iam:roles:manage',
    'iam:permissions:read',
    'iam:sessions:read',
    'iam:sessions:manage',
    'audit:logs:write',
    'audit:logs:read',
    'settings:read',
    'settings:manage',
    'organizations:read',
    'organizations:manage',
    'organization-users:read',
    'organization-users:manage',
    'customer-accounts:read',
    'customer-accounts:manage',
    'customer-contacts:manage',
    'customer-locations:manage',
    'departments:read',
    'departments:manage',
    'business-units:read',
    'business-units:manage',
    'vendors:read',
    'vendors:manage',
    'vendor-contacts:manage',
    'service-routes:read',
    'service-routes:manage',
    'service-stops:manage',
    'organization-invitations:read',
    'organization-invitations:manage',
    'vendor-categories:read',
    'vendor-categories:manage',
    'vendor-contracts:read',
    'vendor-contracts:manage',
    'service-areas:read',
    'service-areas:manage',
    'service-area-locations:manage',
    'service-route-groups:read',
    'service-route-groups:manage',
    'service-route-templates:read',
    'service-route-templates:manage',
    'service-route-template-stops:manage',
    'notifications:send',
    'vehicle-types:read',
    'vehicle-types:manage',
    'vehicle-groups:read',
    'vehicle-groups:manage',
    'vehicle-makes:read',
    'vehicle-makes:manage',
    'vehicle-models:read',
    'vehicle-models:manage',
    'vehicles:read',
    'vehicles:manage',
    'vehicle-documents:read',
    'vehicle-documents:manage',
    'vehicle-devices:read',
    'vehicle-devices:manage',
    'driver-groups:read',
    'driver-groups:manage',
    'driver-skills:read',
    'driver-skills:manage',
    'drivers:read',
    'drivers:manage',
    'driver-licenses:read',
    'driver-licenses:manage',
    'driver-documents:read',
    'driver-documents:manage',
    'driver-vehicle-assignments:read',
    'driver-vehicle-assignments:manage',
    'fleet-readiness:read',
    'fleet-readiness:manage',
    'vehicle-compliance-types:read',
    'vehicle-compliance-types:manage',
    'vehicle-compliance-records:read',
    'vehicle-compliance-records:manage',
    'driver-compliance-types:read',
    'driver-compliance-types:manage',
    'driver-compliance-records:read',
    'driver-compliance-records:manage',
    'assignment-policies:read',
    'assignment-policies:manage',
    'trip-templates:read',
    'trip-templates:manage',
    'trip-template-stops:manage',
    'planned-trips:read',
    'planned-trips:manage',
    'planned-trip-stops:manage',
    'dispatch-queues:read',
    'dispatch-queues:manage',
    'dispatch-validation:read',
    'dispatch-status:manage',
    'trips:read',
    'trips:manage',
    'trips:start',
    'trips:complete',
    'trips:cancel',
    'trips:force-start',
    'trip-stops:manage',
    'trip-events:read',
    'dispatch-actions:read',
    'dispatch-actions:manage',
    'tracking-providers:read',
    'tracking-providers:manage',
    'tracking-credentials:manage',
    'tracking-ingest:write',
    'vehicle-positions:read',
    'vehicle-telemetry-events:read',
    'tracking-health:read',
    'tracking-external-devices:read',
    'tracking-external-devices:manage',
    'tracking-device-mappings:read',
    'tracking-device-mappings:manage',
    'tracking-provider-sync:read',
    'tracking-provider-sync:manage',
    'tracking-alert-rules:read',
    'tracking-alert-rules:manage',
    'tracking-alert-events:read',
    'tracking-alert-events:manage',
    'geofences:read',
    'geofences:manage',
    'tracking-sync:manage',
    'geofence-events:read',
    'geofence-evaluation:manage',
    'tracking-evaluation:read',
    'tracking-evaluation:manage',
    'trip-replay:read',
    'vehicle-replay:read',
    'tracking-notification-rules:read',
    'tracking-notification-rules:manage',
    'tracking-notification-events:read',
    'traccar-webhook:write',
    'traccar-pull:manage',
    'background-jobs:read',
    'background-jobs:manage',
    'background-job-runs:read',
    'queues:read',
    'queues:manage',
    'job-schedules:read',
    'job-schedules:manage',
    'workers:run',
    'notification-providers:read',
    'notification-providers:manage',
    'notification-templates:read',
    'notification-templates:manage',
    'notification-deliveries:read',
    'notification-deliveries:manage',
    'notification-retries:manage',
    'webhook-providers:manage',
    'smtp-providers:manage',
    'maintenance-categories:read',
    'maintenance-categories:manage',
    'maintenance-service-tasks:read',
    'maintenance-service-tasks:manage',
    'inspection-checklists:read',
    'inspection-checklists:manage',
    'vehicle-maintenance-plans:read',
    'vehicle-maintenance-plans:manage',
    'maintenance-requests:read',
    'maintenance-requests:manage',
    'maintenance-work-orders:read',
    'maintenance-work-orders:manage',
    'maintenance-due:read',
    'fuel-types:read',
    'fuel-types:manage',
    'fuel-vendor-profiles:read',
    'fuel-vendor-profiles:manage',
    'fuel-cards:read',
    'fuel-cards:manage',
    'fuel-tanks:read',
    'fuel-tanks:manage',
    'fuel-policies:read',
    'fuel-policies:manage',
    'fuel-requests:read',
    'fuel-requests:manage',
    'fuel-entries:read',
    'fuel-entries:manage',
    'fuel-alerts:read',
    'reports:read',
    'reports:manage',
    'report-runs:read',
    'report-exports:manage',
    'dashboard:read',
    'dashboard:manage',
    'navigation:read',
    'navigation:manage',
    'feature-flags:read',
    'feature-flags:manage',
    'storage-providers:read',
    'storage-providers:manage',
    'storage-buckets:read',
    'storage-buckets:manage',
    'files:read',
    'files:manage',
    'file-attachments:read',
    'file-attachments:manage',
    'file-access-logs:read',
    'document-retention:read',
    'document-retention:manage',
    'escalation-policies:read',
    'escalation-policies:manage',
    'escalation-events:read',
    'escalation-events:manage',
  ],
  MANAGER: [
    'system:health:read',
    'auth:self:read',
    'auth:self:logout',
    'iam:users:read',
    'iam:roles:read',
    'iam:permissions:read',
    'iam:sessions:read',
    'audit:logs:write',
    'audit:logs:read',
    'settings:read',
    'organizations:read',
    'organization-users:read',
    'customer-accounts:read',
    'departments:read',
    'business-units:read',
    'vendors:read',
    'service-routes:read',
    'organization-invitations:read',
    'vendor-categories:read',
    'vendor-contracts:read',
    'service-areas:read',
    'service-route-groups:read',
    'service-route-templates:read',
    'vehicle-types:read',
    'vehicle-groups:read',
    'vehicle-makes:read',
    'vehicle-models:read',
    'vehicles:read',
    'vehicle-documents:read',
    'vehicle-devices:read',
    'driver-groups:read',
    'driver-skills:read',
    'drivers:read',
    'driver-licenses:read',
    'driver-documents:read',
    'driver-vehicle-assignments:read',
    'fleet-readiness:read',
    'vehicle-compliance-types:read',
    'vehicle-compliance-records:read',
    'driver-compliance-types:read',
    'driver-compliance-records:read',
    'assignment-policies:read',
    'trip-templates:read',
    'planned-trips:read',
    'dispatch-queues:read',
    'dispatch-validation:read',
    'trips:read',
    'trips:start',
    'trips:complete',
    'trips:cancel',
    'trip-events:read',
    'dispatch-actions:read',
    'tracking-providers:read',
    'vehicle-positions:read',
    'vehicle-telemetry-events:read',
    'tracking-health:read',
    'tracking-external-devices:read',
    'tracking-device-mappings:read',
    'tracking-provider-sync:read',
    'tracking-alert-rules:read',
    'tracking-alert-events:read',
    'geofences:read',
    'geofence-events:read',
    'tracking-evaluation:read',
    'trip-replay:read',
    'vehicle-replay:read',
    'tracking-notification-rules:read',
    'tracking-notification-events:read',
    'background-jobs:read',
    'background-job-runs:read',
    'queues:read',
    'job-schedules:read',
    'notification-providers:read',
    'notification-templates:read',
    'notification-deliveries:read',
    'maintenance-categories:read',
    'maintenance-service-tasks:read',
    'inspection-checklists:read',
    'vehicle-maintenance-plans:read',
    'maintenance-requests:read',
    'maintenance-work-orders:read',
    'maintenance-due:read',
    'fuel-types:read',
    'fuel-vendor-profiles:read',
    'fuel-cards:read',
    'fuel-tanks:read',
    'fuel-policies:read',
    'fuel-requests:read',
    'fuel-entries:read',
    'fuel-alerts:read',
    'reports:read',
    'report-runs:read',
    'dashboard:read',
    'navigation:read',
    'feature-flags:read',
    'storage-providers:read',
    'storage-buckets:read',
    'files:read',
    'file-attachments:read',
    'file-access-logs:read',
    'document-retention:read',
    'escalation-policies:read',
    'escalation-events:read',
  ],
  STAFF: ['system:health:read', 'auth:self:read', 'auth:self:logout'],
  VIEWER: ['system:health:read', 'auth:self:read', 'auth:self:logout'],
};
