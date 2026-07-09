import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import { validatePasswordPolicy } from '@trackigniter8/auth';
import type { Prisma, PrismaClient, SystemSettingValueType } from '@trackigniter8/db';
import { BadRequestError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import {
  ASSIGNMENT_POLICY_RULE_CODES,
  COMPLIANCE_RECORD_STATUSES,
  CUSTOMER_ACCOUNT_STATUSES,
  DISPATCH_ACTION_TYPES,
  DISPATCH_QUEUE_ITEM_STATUSES,
  MASTER_DATA_STATUSES,
  DRIVER_DOCUMENT_STATUSES,
  DRIVER_EMPLOYMENT_TYPES,
  DRIVER_GENDERS,
  DRIVER_LICENSE_STATUSES,
  DRIVER_STATUSES,
  DRIVER_VEHICLE_ASSIGNMENT_STATUSES,
  DRIVER_VEHICLE_ASSIGNMENT_TYPES,
  ORGANIZATION_MEMBERSHIP_STATUSES,
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_STATUSES,
  ORGANIZATION_USER_ROLES,
  PLANNED_TRIP_PRIORITIES,
  PLANNED_TRIP_STATUSES,
  TRIP_EVENT_TYPES,
  TRIP_STATUSES,
  TRIP_STOP_STATUSES,
  TRACKING_HEALTH_STATUSES,
  TRACKING_DEVICE_DISCOVERY_STATUSES,
  TRACKING_PROVIDER_SYNC_ITEM_STATUSES,
  TRACKING_PROVIDER_SYNC_RUN_STATUSES,
  TRACKING_ALERT_EVENT_STATUSES,
  TRACKING_ALERT_RULE_TYPES,
  TRACKING_PROVIDER_CREDENTIAL_AUTH_TYPES,
  VEHICLE_DEVICE_MAPPING_STATUSES,
  GEOFENCE_TYPES,
  VEHICLE_DEVICE_STATUSES,
  VEHICLE_DOCUMENT_STATUSES,
  VEHICLE_FUEL_TYPES,
  VEHICLE_OWNERSHIP_TYPES,
  VEHICLE_STATUSES,
} from '@trackigniter8/shared';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userStatusSchema = z.enum(['ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED']);
export const organizationStatusSchema = z.enum(ORGANIZATION_STATUSES);
export const customerAccountStatusSchema = z.enum(CUSTOMER_ACCOUNT_STATUSES);
export const masterDataStatusSchema = z.enum(MASTER_DATA_STATUSES);
export const organizationUserRoleSchema = z.enum(ORGANIZATION_USER_ROLES);
export const organizationMembershipStatusSchema = z.enum(ORGANIZATION_MEMBERSHIP_STATUSES);
export const organizationInvitationStatusSchema = z.enum(ORGANIZATION_INVITATION_STATUSES);
export const driverGenderSchema = z.enum(DRIVER_GENDERS);
export const driverEmploymentTypeSchema = z.enum(DRIVER_EMPLOYMENT_TYPES);
export const driverStatusSchema = z.enum(DRIVER_STATUSES);
export const driverLicenseStatusSchema = z.enum(DRIVER_LICENSE_STATUSES);
export const driverDocumentStatusSchema = z.enum(DRIVER_DOCUMENT_STATUSES);
export const driverVehicleAssignmentTypeSchema = z.enum(DRIVER_VEHICLE_ASSIGNMENT_TYPES);
export const driverVehicleAssignmentStatusSchema = z.enum(DRIVER_VEHICLE_ASSIGNMENT_STATUSES);
export const complianceRecordStatusSchema = z.enum(COMPLIANCE_RECORD_STATUSES);
export const assignmentPolicyRuleCodeSchema = z.enum(ASSIGNMENT_POLICY_RULE_CODES);
export const plannedTripStatusSchema = z.enum(PLANNED_TRIP_STATUSES);
export const plannedTripPrioritySchema = z.enum(PLANNED_TRIP_PRIORITIES);
export const dispatchQueueItemStatusSchema = z.enum(DISPATCH_QUEUE_ITEM_STATUSES);
export const tripStatusSchema = z.enum(TRIP_STATUSES);
export const tripStopStatusSchema = z.enum(TRIP_STOP_STATUSES);
export const tripEventTypeSchema = z.enum(TRIP_EVENT_TYPES);
export const dispatchActionTypeSchema = z.enum(DISPATCH_ACTION_TYPES);
export const trackingProviderCredentialAuthTypeSchema = z.enum(TRACKING_PROVIDER_CREDENTIAL_AUTH_TYPES);
export const trackingHealthStatusSchema = z.enum(TRACKING_HEALTH_STATUSES);
export const trackingDeviceDiscoveryStatusSchema = z.enum(TRACKING_DEVICE_DISCOVERY_STATUSES);
export const vehicleDeviceMappingStatusSchema = z.enum(VEHICLE_DEVICE_MAPPING_STATUSES);
export const trackingProviderSyncRunStatusSchema = z.enum(TRACKING_PROVIDER_SYNC_RUN_STATUSES);
export const trackingProviderSyncItemStatusSchema = z.enum(TRACKING_PROVIDER_SYNC_ITEM_STATUSES);
export const trackingAlertRuleTypeSchema = z.enum(TRACKING_ALERT_RULE_TYPES);
export const trackingAlertEventStatusSchema = z.enum(TRACKING_ALERT_EVENT_STATUSES);
export const geofenceTypeSchema = z.enum(GEOFENCE_TYPES);
export const vehicleFuelTypeSchema = z.enum(VEHICLE_FUEL_TYPES);
export const vehicleOwnershipTypeSchema = z.enum(VEHICLE_OWNERSHIP_TYPES);
export const vehicleStatusSchema = z.enum(VEHICLE_STATUSES);
export const vehicleDocumentStatusSchema = z.enum(VEHICLE_DOCUMENT_STATUSES);
export const vehicleDeviceStatusSchema = z.enum(VEHICLE_DEVICE_STATUSES);

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export function getPagination(input: { page: number; pageSize: number }) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function getAuditContext(request: FastifyRequest) {
  const userAgent = request.headers['user-agent'];

  return {
    ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
    ipAddress: request.ip,
    ...(typeof userAgent === 'string' ? { userAgent } : {}),
  };
}

export function assertPasswordPolicy(password: string) {
  const result = validatePasswordPolicy(password);
  if (!result.valid) {
    throw new ValidationAppError('Password does not meet policy requirements', {
      password: result.errors,
    });
  }
}

export function normalizeRoleCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

export function normalizeEntityCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

export function ensureCurrentUser(request: FastifyRequest) {
  if (!request.currentUser) {
    throw new BadRequestError('Authenticated user context is required');
  }

  return request.currentUser;
}

export function parseDateRangeValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationAppError('Invalid date filter supplied', { value });
  }

  return date;
}

export type UserDetailsRecord = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export function serializeUser(user: UserDetailsRecord) {
  const roles = user.roles.map((entry) => ({
    id: entry.role.id,
    code: entry.role.code,
    name: entry.role.name,
    description: entry.role.description,
    isSystem: entry.role.isSystem,
  }));

  const permissionMap = new Map<string, { code: string; module: string; name: string }>();

  for (const roleEntry of user.roles) {
    for (const rolePermission of roleEntry.role.permissions) {
      permissionMap.set(rolePermission.permission.code, {
        code: rolePermission.permission.code,
        module: rolePermission.permission.module,
        name: rolePermission.permission.name,
      });
    }
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles,
    permissionsSummary: {
      total: permissionMap.size,
      permissions: Array.from(permissionMap.values()).sort((left, right) => left.code.localeCompare(right.code)),
    },
  };
}

export function serializeSession(session: {
  id: string;
  tokenId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    tokenId: session.tokenId,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    revokedReason: session.revokedReason,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function coerceSettingValueToStorage(valueType: SystemSettingValueType, value: unknown) {
  switch (valueType) {
    case 'STRING': {
      if (typeof value !== 'string') {
        throw new ValidationAppError('Setting value must be a string', { valueType });
      }
      return value;
    }
    case 'NUMBER': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new ValidationAppError('Setting value must be a number', { valueType });
      }
      return value.toString();
    }
    case 'BOOLEAN': {
      if (typeof value !== 'boolean') {
        throw new ValidationAppError('Setting value must be a boolean', { valueType });
      }
      return value ? 'true' : 'false';
    }
    case 'JSON': {
      if (value === undefined) {
        throw new ValidationAppError('Setting value must be provided', { valueType });
      }
      return JSON.stringify(value);
    }
    default:
      throw new ValidationAppError('Unsupported setting value type', { valueType });
  }
}

export function parseSettingValueFromStorage(valueType: SystemSettingValueType, value: string) {
  switch (valueType) {
    case 'STRING':
      return value;
    case 'NUMBER':
      return Number(value);
    case 'BOOLEAN':
      return value === 'true';
    case 'JSON':
      return JSON.parse(value);
    default:
      return value;
  }
}

export function serializeSetting(setting: {
  id: string;
  key: string;
  value: string;
  valueType: SystemSettingValueType;
  category: string;
  isSecret: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const hasValue = setting.value.length > 0;

  return {
    id: setting.id,
    key: setting.key,
    valueType: setting.valueType,
    category: setting.category,
    isSecret: setting.isSecret,
    description: setting.description,
    value: setting.isSecret ? null : parseSettingValueFromStorage(setting.valueType, setting.value),
    isMasked: setting.isSecret && hasValue,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}

export function serializeOrganization(organization: {
  id: string;
  name: string;
  code: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  taxIdentifier: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  users?: unknown[];
  customerAccounts?: unknown[];
}) {
  return {
    id: organization.id,
    name: organization.name,
    code: organization.code,
    legalName: organization.legalName,
    email: organization.email,
    phone: organization.phone,
    taxIdentifier: organization.taxIdentifier,
    status: organization.status,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    userCount: organization.users?.length ?? 0,
    customerAccountCount: organization.customerAccounts?.length ?? 0,
  };
}

export function serializeOrganizationUser(membership: {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}) {
  return {
    id: membership.id,
    organizationId: membership.organizationId,
    userId: membership.userId,
    role: membership.role,
    status: membership.status,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    user: membership.user
      ? {
          id: membership.user.id,
          email: membership.user.email,
          username: membership.user.username,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
          status: membership.user.status,
        }
      : null,
  };
}

export function serializeCustomerAccount(account: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contacts?: unknown[];
  locations?: unknown[];
}) {
  return {
    id: account.id,
    organizationId: account.organizationId,
    name: account.name,
    code: account.code,
    email: account.email,
    phone: account.phone,
    billingAddress: account.billingAddress,
    notes: account.notes,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    contactCount: account.contacts?.length ?? 0,
    locationCount: account.locations?.length ?? 0,
  };
}

export function serializeCustomerContact(contact: {
  id: string;
  customerAccountId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: contact.id,
    customerAccountId: contact.customerAccountId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    isPrimary: contact.isPrimary,
    isActive: contact.isActive,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export function serializeCustomerLocation(location: {
  id: string;
  customerAccountId: string;
  name: string;
  code: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: location.id,
    customerAccountId: location.customerAccountId,
    name: location.name,
    code: location.code,
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: location.country,
    latitude: location.latitude ? Number(location.latitude.toString()) : null,
    longitude: location.longitude ? Number(location.longitude.toString()) : null,
    isPrimary: location.isPrimary,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

export function serializeOrganizationSetting(setting: {
  id: string;
  organizationId: string;
  key: string;
  value: string;
  valueType: SystemSettingValueType;
  category: string;
  isSecret: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const base = serializeSetting(setting);
  return {
    ...base,
    organizationId: setting.organizationId,
  };
}

export function serializeDepartment(department: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: department.id,
    organizationId: department.organizationId,
    name: department.name,
    code: department.code,
    description: department.description,
    status: department.status,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

export function serializeBusinessUnit(unit: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: unit.id,
    organizationId: unit.organizationId,
    name: unit.name,
    code: unit.code,
    description: unit.description,
    status: unit.status,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

export function serializeVendor(vendor: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contacts?: unknown[];
}) {
  return {
    id: vendor.id,
    organizationId: vendor.organizationId,
    name: vendor.name,
    code: vendor.code,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    notes: vendor.notes,
    status: vendor.status,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
    contactCount: vendor.contacts?.length ?? 0,
  };
}

export function serializeVendorContact(contact: {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: contact.id,
    vendorId: contact.vendorId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    isPrimary: contact.isPrimary,
    isActive: contact.isActive,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export function serializeServiceRoute(route: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stops?: unknown[];
}) {
  return {
    id: route.id,
    organizationId: route.organizationId,
    name: route.name,
    code: route.code,
    description: route.description,
    status: route.status,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
    stopCount: route.stops?.length ?? 0,
  };
}

export function serializeServiceStop(stop: {
  id: string;
  serviceRouteId: string;
  name: string;
  code: string | null;
  description: string | null;
  sequence: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: stop.id,
    serviceRouteId: stop.serviceRouteId,
    name: stop.name,
    code: stop.code,
    description: stop.description,
    sequence: stop.sequence,
    addressLine1: stop.addressLine1,
    addressLine2: stop.addressLine2,
    city: stop.city,
    state: stop.state,
    postalCode: stop.postalCode,
    country: stop.country,
    latitude: stop.latitude ? Number(stop.latitude.toString()) : null,
    longitude: stop.longitude ? Number(stop.longitude.toString()) : null,
    isActive: stop.isActive,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function serializeOrganizationInvitation(invitation: {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  message: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  canceledAt: Date | null;
  lastSentAt: Date | null;
  sentCount: number;
  invitedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    message: invitation.message,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    canceledAt: invitation.canceledAt,
    lastSentAt: invitation.lastSentAt,
    sentCount: invitation.sentCount,
    invitedByUserId: invitation.invitedByUserId,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}

export function serializeVendorCategory(category: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vendors?: unknown[];
}) {
  return {
    id: category.id,
    organizationId: category.organizationId,
    name: category.name,
    code: category.code,
    description: category.description,
    status: category.status,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    vendorCount: category.vendors?.length ?? 0,
  };
}

export function serializeVendorContract(contract: {
  id: string;
  vendorId: string;
  contractNumber: string;
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: contract.id,
    vendorId: contract.vendorId,
    contractNumber: contract.contractNumber,
    title: contract.title,
    description: contract.description,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: contract.status,
    notes: contract.notes,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function serializeServiceArea(area: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  locations?: unknown[];
}) {
  return {
    id: area.id,
    organizationId: area.organizationId,
    name: area.name,
    code: area.code,
    description: area.description,
    status: area.status,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt,
    locationCount: area.locations?.length ?? 0,
  };
}

export function serializeServiceAreaLocation(link: {
  id: string;
  serviceAreaId: string;
  customerLocationId: string;
  createdAt: Date;
  customerLocation?: {
    id: string;
    customerAccountId: string;
    name: string;
    code: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return {
    id: link.id,
    serviceAreaId: link.serviceAreaId,
    customerLocationId: link.customerLocationId,
    createdAt: link.createdAt,
    customerLocation: link.customerLocation ? serializeCustomerLocation(link.customerLocation) : null,
  };
}

export function serializeServiceRouteGroup(group: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  routes?: unknown[];
  templates?: unknown[];
}) {
  return {
    id: group.id,
    organizationId: group.organizationId,
    name: group.name,
    code: group.code,
    description: group.description,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    routeCount: group.routes?.length ?? 0,
    templateCount: group.templates?.length ?? 0,
  };
}

export function serializeServiceRouteTemplate(template: {
  id: string;
  organizationId: string;
  serviceRouteGroupId: string | null;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stops?: unknown[];
}) {
  return {
    id: template.id,
    organizationId: template.organizationId,
    serviceRouteGroupId: template.serviceRouteGroupId,
    name: template.name,
    code: template.code,
    description: template.description,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    stopCount: template.stops?.length ?? 0,
  };
}

export function serializeServiceRouteTemplateStop(stop: {
  id: string;
  serviceRouteTemplateId: string;
  name: string;
  code: string | null;
  description: string | null;
  sequence: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: stop.id,
    serviceRouteTemplateId: stop.serviceRouteTemplateId,
    name: stop.name,
    code: stop.code,
    description: stop.description,
    sequence: stop.sequence,
    addressLine1: stop.addressLine1,
    addressLine2: stop.addressLine2,
    city: stop.city,
    state: stop.state,
    postalCode: stop.postalCode,
    country: stop.country,
    latitude: stop.latitude ? Number(stop.latitude.toString()) : null,
    longitude: stop.longitude ? Number(stop.longitude.toString()) : null,
    isActive: stop.isActive,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function serializeTripTemplate(template: {
  id: string;
  organizationId: string;
  serviceRouteId: string | null;
  serviceRouteTemplateId: string | null;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stops?: unknown[];
}) {
  return {
    id: template.id,
    organizationId: template.organizationId,
    serviceRouteId: template.serviceRouteId,
    serviceRouteTemplateId: template.serviceRouteTemplateId,
    name: template.name,
    code: template.code,
    description: template.description,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    stopCount: template.stops?.length ?? 0,
  };
}

export function serializeTripTemplateStop(stop: {
  id: string;
  tripTemplateId: string;
  serviceStopId: string | null;
  serviceRouteTemplateStopId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  sequence: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: stop.id,
    tripTemplateId: stop.tripTemplateId,
    serviceStopId: stop.serviceStopId,
    serviceRouteTemplateStopId: stop.serviceRouteTemplateStopId,
    name: stop.name,
    code: stop.code,
    description: stop.description,
    sequence: stop.sequence,
    addressLine1: stop.addressLine1,
    addressLine2: stop.addressLine2,
    city: stop.city,
    state: stop.state,
    postalCode: stop.postalCode,
    country: stop.country,
    latitude: stop.latitude ? Number(stop.latitude.toString()) : null,
    longitude: stop.longitude ? Number(stop.longitude.toString()) : null,
    isActive: stop.isActive,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function serializeVehicleType(vehicleType: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vehicles?: unknown[];
}) {
  return {
    id: vehicleType.id,
    organizationId: vehicleType.organizationId,
    name: vehicleType.name,
    code: vehicleType.code,
    description: vehicleType.description,
    status: vehicleType.status,
    createdAt: vehicleType.createdAt,
    updatedAt: vehicleType.updatedAt,
    vehicleCount: vehicleType.vehicles?.length ?? 0,
  };
}

export function serializeVehicleGroup(vehicleGroup: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vehicles?: unknown[];
}) {
  return {
    id: vehicleGroup.id,
    organizationId: vehicleGroup.organizationId,
    name: vehicleGroup.name,
    code: vehicleGroup.code,
    description: vehicleGroup.description,
    status: vehicleGroup.status,
    createdAt: vehicleGroup.createdAt,
    updatedAt: vehicleGroup.updatedAt,
    vehicleCount: vehicleGroup.vehicles?.length ?? 0,
  };
}

export function serializeVehicleMake(vehicleMake: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  models?: unknown[];
  vehicles?: unknown[];
}) {
  return {
    id: vehicleMake.id,
    organizationId: vehicleMake.organizationId,
    name: vehicleMake.name,
    code: vehicleMake.code,
    description: vehicleMake.description,
    status: vehicleMake.status,
    createdAt: vehicleMake.createdAt,
    updatedAt: vehicleMake.updatedAt,
    modelCount: vehicleMake.models?.length ?? 0,
    vehicleCount: vehicleMake.vehicles?.length ?? 0,
  };
}

export function serializeVehicleModel(vehicleModel: {
  id: string;
  organizationId: string;
  vehicleMakeId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vehicleMake?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  vehicles?: unknown[];
}) {
  return {
    id: vehicleModel.id,
    organizationId: vehicleModel.organizationId,
    vehicleMakeId: vehicleModel.vehicleMakeId,
    name: vehicleModel.name,
    code: vehicleModel.code,
    description: vehicleModel.description,
    status: vehicleModel.status,
    createdAt: vehicleModel.createdAt,
    updatedAt: vehicleModel.updatedAt,
    vehicleCount: vehicleModel.vehicles?.length ?? 0,
    vehicleMake: vehicleModel.vehicleMake ? serializeVehicleMake(vehicleModel.vehicleMake) : null,
  };
}

export function serializeVehicle(vehicle: {
  id: string;
  organizationId: string;
  customerAccountId: string | null;
  departmentId: string | null;
  businessUnitId: string | null;
  vehicleTypeId: string | null;
  vehicleGroupId: string | null;
  makeId: string | null;
  modelId: string | null;
  serviceRouteTemplateId: string | null;
  registrationNumber: string | null;
  plateNumber: string | null;
  vin: string | null;
  chassisNumber: string | null;
  engineNumber: string | null;
  year: number | null;
  color: string | null;
  fuelType: string | null;
  ownershipType: string | null;
  status: string;
  odometer: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerAccount?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    billingAddress: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    contacts?: unknown[];
    locations?: unknown[];
  } | null;
  department?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  businessUnit?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  vehicleType?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  vehicleGroup?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  make?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  model?: {
    id: string;
    organizationId: string;
    vehicleMakeId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  serviceRouteTemplate?: {
    id: string;
    organizationId: string;
    serviceRouteGroupId: string | null;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    stops?: unknown[];
  } | null;
  documents?: unknown[];
  devices?: unknown[];
}) {
  return {
    id: vehicle.id,
    organizationId: vehicle.organizationId,
    customerAccountId: vehicle.customerAccountId,
    departmentId: vehicle.departmentId,
    businessUnitId: vehicle.businessUnitId,
    vehicleTypeId: vehicle.vehicleTypeId,
    vehicleGroupId: vehicle.vehicleGroupId,
    makeId: vehicle.makeId,
    modelId: vehicle.modelId,
    serviceRouteTemplateId: vehicle.serviceRouteTemplateId,
    registrationNumber: vehicle.registrationNumber,
    plateNumber: vehicle.plateNumber,
    vin: vehicle.vin,
    chassisNumber: vehicle.chassisNumber,
    engineNumber: vehicle.engineNumber,
    year: vehicle.year,
    color: vehicle.color,
    fuelType: vehicle.fuelType,
    ownershipType: vehicle.ownershipType,
    status: vehicle.status,
    odometer: vehicle.odometer,
    notes: vehicle.notes,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    documentCount: vehicle.documents?.length ?? 0,
    deviceCount: vehicle.devices?.length ?? 0,
    customerAccount: vehicle.customerAccount ? serializeCustomerAccount(vehicle.customerAccount) : null,
    department: vehicle.department ? serializeDepartment(vehicle.department) : null,
    businessUnit: vehicle.businessUnit ? serializeBusinessUnit(vehicle.businessUnit) : null,
    vehicleType: vehicle.vehicleType ? serializeVehicleType(vehicle.vehicleType) : null,
    vehicleGroup: vehicle.vehicleGroup ? serializeVehicleGroup(vehicle.vehicleGroup) : null,
    make: vehicle.make ? serializeVehicleMake(vehicle.make) : null,
    model: vehicle.model ? serializeVehicleModel(vehicle.model) : null,
    serviceRouteTemplate: vehicle.serviceRouteTemplate ? serializeServiceRouteTemplate(vehicle.serviceRouteTemplate) : null,
  };
}

export function serializeVehicleDocument(document: {
  id: string;
  vehicleId: string;
  documentType: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: document.id,
    vehicleId: document.vehicleId,
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    fileMimeType: document.fileMimeType,
    fileSizeBytes: document.fileSizeBytes,
    status: document.status,
    notes: document.notes,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function serializeVehicleDevice(device: {
  id: string;
  vehicleId: string;
  provider: string;
  externalDeviceId: string;
  imei: string | null;
  serialNumber: string | null;
  status: string;
  installedAt: Date | null;
  removedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: device.id,
    vehicleId: device.vehicleId,
    provider: device.provider,
    externalDeviceId: device.externalDeviceId,
    imei: device.imei,
    serialNumber: device.serialNumber,
    status: device.status,
    installedAt: device.installedAt,
    removedAt: device.removedAt,
    metadata: device.metadata,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

export function serializeDriverGroup(group: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  drivers?: unknown[];
}) {
  return {
    id: group.id,
    organizationId: group.organizationId,
    name: group.name,
    code: group.code,
    description: group.description,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    driverCount: group.drivers?.length ?? 0,
  };
}

export function serializeDriverSkill(skill: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  assignments?: unknown[];
}) {
  return {
    id: skill.id,
    organizationId: skill.organizationId,
    name: skill.name,
    code: skill.code,
    description: skill.description,
    status: skill.status,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    assignmentCount: skill.assignments?.length ?? 0,
  };
}

export function serializeDriverSkillAssignment(assignment: {
  id: string;
  driverId: string;
  driverSkillId: string;
  assignedAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  driverSkill?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}) {
  return {
    id: assignment.id,
    driverId: assignment.driverId,
    driverSkillId: assignment.driverSkillId,
    assignedAt: assignment.assignedAt,
    notes: assignment.notes,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    driverSkill: assignment.driverSkill ? serializeDriverSkill(assignment.driverSkill) : null,
  };
}

export function serializeDriver(driver: {
  id: string;
  organizationId: string;
  customerAccountId: string | null;
  departmentId: string | null;
  businessUnitId: string | null;
  driverGroupId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  hireDate: Date | null;
  employmentType: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerAccount?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    billingAddress: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    contacts?: unknown[];
    locations?: unknown[];
  } | null;
  department?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  businessUnit?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  driverGroup?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  skillAssignments?: unknown[];
  licenses?: unknown[];
  documents?: unknown[];
  vehicleAssignments?: unknown[];
}) {
  return {
    id: driver.id,
    organizationId: driver.organizationId,
    customerAccountId: driver.customerAccountId,
    departmentId: driver.departmentId,
    businessUnitId: driver.businessUnitId,
    driverGroupId: driver.driverGroupId,
    employeeNumber: driver.employeeNumber,
    firstName: driver.firstName,
    lastName: driver.lastName,
    displayName: driver.displayName,
    email: driver.email,
    phone: driver.phone,
    dateOfBirth: driver.dateOfBirth,
    gender: driver.gender,
    addressLine1: driver.addressLine1,
    addressLine2: driver.addressLine2,
    city: driver.city,
    state: driver.state,
    postalCode: driver.postalCode,
    country: driver.country,
    emergencyContactName: driver.emergencyContactName,
    emergencyContactPhone: driver.emergencyContactPhone,
    emergencyContactRelationship: driver.emergencyContactRelationship,
    hireDate: driver.hireDate,
    employmentType: driver.employmentType,
    status: driver.status,
    notes: driver.notes,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
    skillCount: driver.skillAssignments?.length ?? 0,
    licenseCount: driver.licenses?.length ?? 0,
    documentCount: driver.documents?.length ?? 0,
    vehicleAssignmentCount: driver.vehicleAssignments?.length ?? 0,
    customerAccount: driver.customerAccount ? serializeCustomerAccount(driver.customerAccount) : null,
    department: driver.department ? serializeDepartment(driver.department) : null,
    businessUnit: driver.businessUnit ? serializeBusinessUnit(driver.businessUnit) : null,
    driverGroup: driver.driverGroup ? serializeDriverGroup(driver.driverGroup) : null,
  };
}

export function serializeDriverLicense(license: {
  id: string;
  driverId: string;
  licenseNumber: string;
  licenseType: string;
  issuingCountry: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: license.id,
    driverId: license.driverId,
    licenseNumber: license.licenseNumber,
    licenseType: license.licenseType,
    issuingCountry: license.issuingCountry,
    issueDate: license.issueDate,
    expiryDate: license.expiryDate,
    status: license.status,
    notes: license.notes,
    createdAt: license.createdAt,
    updatedAt: license.updatedAt,
  };
}

export function serializeDriverDocument(document: {
  id: string;
  driverId: string;
  documentType: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: document.id,
    driverId: document.driverId,
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    fileMimeType: document.fileMimeType,
    fileSizeBytes: document.fileSizeBytes,
    status: document.status,
    notes: document.notes,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function serializeDriverVehicleAssignment(assignment: {
  id: string;
  organizationId: string;
  driverId: string;
  vehicleId: string;
  assignmentType: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  driver?: {
    id: string;
    organizationId: string;
    customerAccountId: string | null;
    departmentId: string | null;
    businessUnitId: string | null;
    driverGroupId: string | null;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    hireDate: Date | null;
    employmentType: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  vehicle?: {
    id: string;
    organizationId: string;
    customerAccountId: string | null;
    departmentId: string | null;
    businessUnitId: string | null;
    vehicleTypeId: string | null;
    vehicleGroupId: string | null;
    makeId: string | null;
    modelId: string | null;
    serviceRouteTemplateId: string | null;
    registrationNumber: string | null;
    plateNumber: string | null;
    vin: string | null;
    chassisNumber: string | null;
    engineNumber: string | null;
    year: number | null;
    color: string | null;
    fuelType: string | null;
    ownershipType: string | null;
    status: string;
    odometer: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}) {
  return {
    id: assignment.id,
    organizationId: assignment.organizationId,
    driverId: assignment.driverId,
    vehicleId: assignment.vehicleId,
    assignmentType: assignment.assignmentType,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    status: assignment.status,
    notes: assignment.notes,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    driver: assignment.driver ? serializeDriver(assignment.driver) : null,
    vehicle: assignment.vehicle ? serializeVehicle(assignment.vehicle) : null,
  };
}

export function serializePlannedTrip(trip: {
  id: string;
  organizationId: string;
  customerAccountId: string | null;
  serviceRouteId: string | null;
  serviceRouteTemplateId: string | null;
  tripTemplateId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  assignmentId: string | null;
  title: string;
  referenceCode: string | null;
  plannedStartAt: Date;
  plannedEndAt: Date | null;
  status: string;
  priority: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerAccount?: Parameters<typeof serializeCustomerAccount>[0] | null;
  serviceRoute?: Parameters<typeof serializeServiceRoute>[0] | null;
  serviceRouteTemplate?: Parameters<typeof serializeServiceRouteTemplate>[0] | null;
  tripTemplate?: Parameters<typeof serializeTripTemplate>[0] | null;
  vehicle?: Parameters<typeof serializeVehicle>[0] | null;
  driver?: Parameters<typeof serializeDriver>[0] | null;
  assignment?: Parameters<typeof serializeDriverVehicleAssignment>[0] | null;
  stops?: unknown[];
  dispatchQueueItems?: unknown[];
}) {
  return {
    id: trip.id,
    organizationId: trip.organizationId,
    customerAccountId: trip.customerAccountId,
    serviceRouteId: trip.serviceRouteId,
    serviceRouteTemplateId: trip.serviceRouteTemplateId,
    tripTemplateId: trip.tripTemplateId,
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    assignmentId: trip.assignmentId,
    title: trip.title,
    referenceCode: trip.referenceCode,
    plannedStartAt: trip.plannedStartAt,
    plannedEndAt: trip.plannedEndAt,
    status: trip.status,
    priority: trip.priority,
    notes: trip.notes,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    customerAccount: trip.customerAccount ? serializeCustomerAccount(trip.customerAccount) : null,
    serviceRoute: trip.serviceRoute ? serializeServiceRoute(trip.serviceRoute) : null,
    serviceRouteTemplate: trip.serviceRouteTemplate ? serializeServiceRouteTemplate(trip.serviceRouteTemplate) : null,
    tripTemplate: trip.tripTemplate ? serializeTripTemplate(trip.tripTemplate) : null,
    vehicle: trip.vehicle ? serializeVehicle(trip.vehicle) : null,
    driver: trip.driver ? serializeDriver(trip.driver) : null,
    assignment: trip.assignment ? serializeDriverVehicleAssignment(trip.assignment) : null,
    stopCount: trip.stops?.length ?? 0,
    dispatchQueueItemCount: trip.dispatchQueueItems?.length ?? 0,
  };
}

export function serializePlannedTripStop(stop: {
  id: string;
  plannedTripId: string;
  serviceStopId: string | null;
  serviceRouteTemplateStopId: string | null;
  tripTemplateStopId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  sequence: number;
  plannedArrivalAt: Date | null;
  plannedDepartureAt: Date | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: stop.id,
    plannedTripId: stop.plannedTripId,
    serviceStopId: stop.serviceStopId,
    serviceRouteTemplateStopId: stop.serviceRouteTemplateStopId,
    tripTemplateStopId: stop.tripTemplateStopId,
    name: stop.name,
    code: stop.code,
    description: stop.description,
    sequence: stop.sequence,
    plannedArrivalAt: stop.plannedArrivalAt,
    plannedDepartureAt: stop.plannedDepartureAt,
    addressLine1: stop.addressLine1,
    addressLine2: stop.addressLine2,
    city: stop.city,
    state: stop.state,
    postalCode: stop.postalCode,
    country: stop.country,
    latitude: stop.latitude ? Number(stop.latitude.toString()) : null,
    longitude: stop.longitude ? Number(stop.longitude.toString()) : null,
    isActive: stop.isActive,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function serializeDispatchQueue(queue: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items?: unknown[];
}) {
  return {
    id: queue.id,
    organizationId: queue.organizationId,
    name: queue.name,
    code: queue.code,
    description: queue.description,
    status: queue.status,
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
    itemCount: queue.items?.length ?? 0,
  };
}

export function serializeDispatchQueueItem(item: {
  id: string;
  dispatchQueueId: string;
  plannedTripId: string;
  sequence: number;
  status: string;
  notes: string | null;
  holdReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  plannedTrip?: Parameters<typeof serializePlannedTrip>[0] | null;
}) {
  return {
    id: item.id,
    dispatchQueueId: item.dispatchQueueId,
    plannedTripId: item.plannedTripId,
    sequence: item.sequence,
    status: item.status,
    notes: item.notes,
    holdReason: item.holdReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    plannedTrip: item.plannedTrip ? serializePlannedTrip(item.plannedTrip) : null,
  };
}

export function serializeTrip(trip: {
  id: string;
  organizationId: string;
  plannedTripId: string | null;
  dispatchQueueItemId: string | null;
  customerAccountId: string | null;
  serviceRouteId: string | null;
  serviceRouteTemplateId: string | null;
  tripTemplateId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  assignmentId: string | null;
  title: string;
  referenceCode: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date | null;
  dispatchedAt: Date | null;
  startedAt: Date | null;
  holdStartedAt: Date | null;
  resumedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  failedAt: Date | null;
  holdReason: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerAccount?: Parameters<typeof serializeCustomerAccount>[0] | null;
  plannedTrip?: Parameters<typeof serializePlannedTrip>[0] | null;
  dispatchQueueItem?: Parameters<typeof serializeDispatchQueueItem>[0] | null;
  serviceRoute?: Parameters<typeof serializeServiceRoute>[0] | null;
  serviceRouteTemplate?: Parameters<typeof serializeServiceRouteTemplate>[0] | null;
  tripTemplate?: Parameters<typeof serializeTripTemplate>[0] | null;
  vehicle?: Parameters<typeof serializeVehicle>[0] | null;
  driver?: Parameters<typeof serializeDriver>[0] | null;
  assignment?: Parameters<typeof serializeDriverVehicleAssignment>[0] | null;
  stops?: unknown[];
  events?: unknown[];
  dispatchActions?: unknown[];
}) {
  return {
    id: trip.id,
    organizationId: trip.organizationId,
    plannedTripId: trip.plannedTripId,
    dispatchQueueItemId: trip.dispatchQueueItemId,
    customerAccountId: trip.customerAccountId,
    serviceRouteId: trip.serviceRouteId,
    serviceRouteTemplateId: trip.serviceRouteTemplateId,
    tripTemplateId: trip.tripTemplateId,
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    assignmentId: trip.assignmentId,
    title: trip.title,
    referenceCode: trip.referenceCode,
    scheduledStartAt: trip.scheduledStartAt,
    scheduledEndAt: trip.scheduledEndAt,
    dispatchedAt: trip.dispatchedAt,
    startedAt: trip.startedAt,
    holdStartedAt: trip.holdStartedAt,
    resumedAt: trip.resumedAt,
    completedAt: trip.completedAt,
    cancelledAt: trip.cancelledAt,
    failedAt: trip.failedAt,
    holdReason: trip.holdReason,
    status: trip.status,
    notes: trip.notes,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    customerAccount: trip.customerAccount ? serializeCustomerAccount(trip.customerAccount) : null,
    plannedTrip: trip.plannedTrip ? serializePlannedTrip(trip.plannedTrip) : null,
    dispatchQueueItem: trip.dispatchQueueItem ? serializeDispatchQueueItem(trip.dispatchQueueItem) : null,
    serviceRoute: trip.serviceRoute ? serializeServiceRoute(trip.serviceRoute) : null,
    serviceRouteTemplate: trip.serviceRouteTemplate ? serializeServiceRouteTemplate(trip.serviceRouteTemplate) : null,
    tripTemplate: trip.tripTemplate ? serializeTripTemplate(trip.tripTemplate) : null,
    vehicle: trip.vehicle ? serializeVehicle(trip.vehicle) : null,
    driver: trip.driver ? serializeDriver(trip.driver) : null,
    assignment: trip.assignment ? serializeDriverVehicleAssignment(trip.assignment) : null,
    stopCount: trip.stops?.length ?? 0,
    eventCount: trip.events?.length ?? 0,
    dispatchActionCount: trip.dispatchActions?.length ?? 0,
  };
}

export function serializeTripStop(stop: {
  id: string;
  tripId: string;
  plannedTripStopId: string | null;
  serviceStopId: string | null;
  serviceRouteTemplateStopId: string | null;
  tripTemplateStopId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  sequence: number;
  scheduledArrivalAt: Date | null;
  scheduledDepartureAt: Date | null;
  actualArrivalAt: Date | null;
  actualDepartureAt: Date | null;
  status: string;
  note: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: stop.id,
    tripId: stop.tripId,
    plannedTripStopId: stop.plannedTripStopId,
    serviceStopId: stop.serviceStopId,
    serviceRouteTemplateStopId: stop.serviceRouteTemplateStopId,
    tripTemplateStopId: stop.tripTemplateStopId,
    name: stop.name,
    code: stop.code,
    description: stop.description,
    sequence: stop.sequence,
    scheduledArrivalAt: stop.scheduledArrivalAt,
    scheduledDepartureAt: stop.scheduledDepartureAt,
    actualArrivalAt: stop.actualArrivalAt,
    actualDepartureAt: stop.actualDepartureAt,
    status: stop.status,
    note: stop.note,
    addressLine1: stop.addressLine1,
    addressLine2: stop.addressLine2,
    city: stop.city,
    state: stop.state,
    postalCode: stop.postalCode,
    country: stop.country,
    latitude: stop.latitude ? Number(stop.latitude.toString()) : null,
    longitude: stop.longitude ? Number(stop.longitude.toString()) : null,
    isActive: stop.isActive,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function serializeTripEvent(event: {
  id: string;
  tripId: string;
  actorUserId: string | null;
  eventType: string;
  statusFrom: string | null;
  statusTo: string | null;
  note: string | null;
  metadata: Prisma.JsonValue | null;
  happenedAt: Date;
  createdAt: Date;
  actorUser?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    status: string;
  } | null;
}) {
  return {
    id: event.id,
    tripId: event.tripId,
    actorUserId: event.actorUserId,
    eventType: event.eventType,
    statusFrom: event.statusFrom,
    statusTo: event.statusTo,
    note: event.note,
    metadata: event.metadata,
    happenedAt: event.happenedAt,
    createdAt: event.createdAt,
    actorUser: event.actorUser
      ? {
          id: event.actorUser.id,
          email: event.actorUser.email,
          username: event.actorUser.username,
          firstName: event.actorUser.firstName,
          lastName: event.actorUser.lastName,
          status: event.actorUser.status,
        }
      : null,
  };
}

export function serializeDispatchAction(action: {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  tripId: string | null;
  plannedTripId: string | null;
  dispatchQueueItemId: string | null;
  actionType: string;
  note: string | null;
  metadata: Prisma.JsonValue | null;
  happenedAt: Date;
  createdAt: Date;
  actorUser?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    status: string;
  } | null;
}) {
  return {
    id: action.id,
    organizationId: action.organizationId,
    actorUserId: action.actorUserId,
    tripId: action.tripId,
    plannedTripId: action.plannedTripId,
    dispatchQueueItemId: action.dispatchQueueItemId,
    actionType: action.actionType,
    note: action.note,
    metadata: action.metadata,
    happenedAt: action.happenedAt,
    createdAt: action.createdAt,
    actorUser: action.actorUser
      ? {
          id: action.actorUser.id,
          email: action.actorUser.email,
          username: action.actorUser.username,
          firstName: action.actorUser.firstName,
          lastName: action.actorUser.lastName,
          status: action.actorUser.status,
        }
      : null,
  };
}

export function serializeTrackingProvider(provider: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  providerType: string;
  baseUrl: string | null;
  description: string | null;
  status: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  credentials?: unknown[];
  health?: {
    id: string;
    status: string;
    lastCheckedAt: Date | null;
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
    lastIngestAt: Date | null;
    message: string | null;
  } | null;
}) {
  return {
    id: provider.id,
    organizationId: provider.organizationId,
    name: provider.name,
    code: provider.code,
    providerType: provider.providerType,
    baseUrl: provider.baseUrl,
    description: provider.description,
    status: provider.status,
    metadata: provider.metadata,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    credentialCount: provider.credentials?.length ?? 0,
    health: provider.health
      ? {
          id: provider.health.id,
          status: provider.health.status,
          lastCheckedAt: provider.health.lastCheckedAt,
          lastSuccessAt: provider.health.lastSuccessAt,
          lastFailureAt: provider.health.lastFailureAt,
          lastIngestAt: provider.health.lastIngestAt,
          message: provider.health.message,
        }
      : null,
  };
}

export function serializeTrackingProviderCredential(credential: {
  id: string;
  trackingProviderId: string;
  name: string;
  keyId: string;
  authType: string;
  secretHint: string | null;
  status: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: credential.id,
    trackingProviderId: credential.trackingProviderId,
    name: credential.name,
    keyId: credential.keyId,
    authType: credential.authType,
    secretHint: credential.secretHint,
    status: credential.status,
    lastUsedAt: credential.lastUsedAt,
    expiresAt: credential.expiresAt,
    metadata: credential.metadata,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

export function serializeTrackingProviderHealth(health: {
  id: string;
  trackingProviderId: string;
  status: string;
  message: string | null;
  lastCheckedAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastIngestAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: health.id,
    trackingProviderId: health.trackingProviderId,
    status: health.status,
    message: health.message,
    lastCheckedAt: health.lastCheckedAt,
    lastSuccessAt: health.lastSuccessAt,
    lastFailureAt: health.lastFailureAt,
    lastIngestAt: health.lastIngestAt,
    metadata: health.metadata,
    createdAt: health.createdAt,
    updatedAt: health.updatedAt,
  };
}

export function serializeVehiclePosition(position: {
  id: string;
  organizationId: string;
  vehicleId: string;
  vehicleDeviceId: string | null;
  trackingProviderId: string | null;
  tripId: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  speed: Prisma.Decimal | null;
  heading: Prisma.Decimal | null;
  altitude: Prisma.Decimal | null;
  accuracy: Prisma.Decimal | null;
  ignition: boolean | null;
  battery: Prisma.Decimal | null;
  odometer: number | null;
  eventType: string | null;
  providerTimestamp: Date;
  receivedAt: Date;
  rawPayload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: position.id,
    organizationId: position.organizationId,
    vehicleId: position.vehicleId,
    vehicleDeviceId: position.vehicleDeviceId,
    trackingProviderId: position.trackingProviderId,
    tripId: position.tripId,
    latitude: Number(position.latitude.toString()),
    longitude: Number(position.longitude.toString()),
    speed: position.speed ? Number(position.speed.toString()) : null,
    heading: position.heading ? Number(position.heading.toString()) : null,
    altitude: position.altitude ? Number(position.altitude.toString()) : null,
    accuracy: position.accuracy ? Number(position.accuracy.toString()) : null,
    ignition: position.ignition,
    battery: position.battery ? Number(position.battery.toString()) : null,
    odometer: position.odometer,
    eventType: position.eventType,
    providerTimestamp: position.providerTimestamp,
    receivedAt: position.receivedAt,
    rawPayload: position.rawPayload,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

export function serializeVehicleTelemetryEvent(event: {
  id: string;
  organizationId: string;
  vehicleId: string;
  vehicleDeviceId: string | null;
  trackingProviderId: string | null;
  tripId: string | null;
  providerEventId: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  speed: Prisma.Decimal | null;
  heading: Prisma.Decimal | null;
  altitude: Prisma.Decimal | null;
  accuracy: Prisma.Decimal | null;
  ignition: boolean | null;
  battery: Prisma.Decimal | null;
  odometer: number | null;
  eventType: string | null;
  providerTimestamp: Date;
  receivedAt: Date;
  rawPayload: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  return {
    id: event.id,
    organizationId: event.organizationId,
    vehicleId: event.vehicleId,
    vehicleDeviceId: event.vehicleDeviceId,
    trackingProviderId: event.trackingProviderId,
    tripId: event.tripId,
    providerEventId: event.providerEventId,
    latitude: Number(event.latitude.toString()),
    longitude: Number(event.longitude.toString()),
    speed: event.speed ? Number(event.speed.toString()) : null,
    heading: event.heading ? Number(event.heading.toString()) : null,
    altitude: event.altitude ? Number(event.altitude.toString()) : null,
    accuracy: event.accuracy ? Number(event.accuracy.toString()) : null,
    ignition: event.ignition,
    battery: event.battery ? Number(event.battery.toString()) : null,
    odometer: event.odometer,
    eventType: event.eventType,
    providerTimestamp: event.providerTimestamp,
    receivedAt: event.receivedAt,
    rawPayload: event.rawPayload,
    createdAt: event.createdAt,
  };
}

export function serializeExternalTrackingDevice(device: {
  id: string;
  organizationId: string;
  trackingProviderId: string;
  externalDeviceId: string;
  providerUniqueId: string | null;
  name: string | null;
  imei: string | null;
  model: string | null;
  phoneNumber: string | null;
  status: string;
  discoveredAt: Date;
  lastSeenAt: Date | null;
  lastPayload: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: device.id,
    organizationId: device.organizationId,
    trackingProviderId: device.trackingProviderId,
    externalDeviceId: device.externalDeviceId,
    providerUniqueId: device.providerUniqueId,
    name: device.name,
    imei: device.imei,
    model: device.model,
    phoneNumber: device.phoneNumber,
    status: device.status,
    discoveredAt: device.discoveredAt,
    lastSeenAt: device.lastSeenAt,
    lastPayload: device.lastPayload,
    metadata: device.metadata,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

export function serializeVehicleDeviceMapping(mapping: {
  id: string;
  organizationId: string;
  trackingProviderId: string;
  externalTrackingDeviceId: string;
  vehicleId: string;
  vehicleDeviceId: string | null;
  status: string;
  mappedAt: Date;
  unmappedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: mapping.id,
    organizationId: mapping.organizationId,
    trackingProviderId: mapping.trackingProviderId,
    externalTrackingDeviceId: mapping.externalTrackingDeviceId,
    vehicleId: mapping.vehicleId,
    vehicleDeviceId: mapping.vehicleDeviceId,
    status: mapping.status,
    mappedAt: mapping.mappedAt,
    unmappedAt: mapping.unmappedAt,
    notes: mapping.notes,
    createdAt: mapping.createdAt,
    updatedAt: mapping.updatedAt,
  };
}

export function serializeTrackingProviderSyncRun(run: {
  id: string;
  organizationId: string;
  trackingProviderId: string;
  runType: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  triggeredByUserId: string | null;
  summary: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  items?: unknown[];
}) {
  return {
    id: run.id,
    organizationId: run.organizationId,
    trackingProviderId: run.trackingProviderId,
    runType: run.runType,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    triggeredByUserId: run.triggeredByUserId,
    summary: run.summary,
    metadata: run.metadata,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    itemCount: run.items?.length ?? 0,
  };
}

export function serializeTrackingProviderSyncItem(item: {
  id: string;
  trackingProviderSyncRunId: string;
  externalEntityType: string;
  externalEntityId: string;
  status: string;
  message: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    trackingProviderSyncRunId: item.trackingProviderSyncRunId,
    externalEntityType: item.externalEntityType,
    externalEntityId: item.externalEntityId,
    status: item.status,
    message: item.message,
    payload: item.payload,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function serializeTrackingAlertRule(rule: {
  id: string;
  organizationId: string;
  trackingProviderId: string | null;
  vehicleId: string | null;
  name: string;
  code: string;
  ruleType: string;
  severity: string;
  condition: Prisma.JsonValue | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  events?: unknown[];
}) {
  return {
    id: rule.id,
    organizationId: rule.organizationId,
    trackingProviderId: rule.trackingProviderId,
    vehicleId: rule.vehicleId,
    name: rule.name,
    code: rule.code,
    ruleType: rule.ruleType,
    severity: rule.severity,
    condition: rule.condition,
    status: rule.status,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    eventCount: rule.events?.length ?? 0,
  };
}

export function serializeTrackingAlertEvent(event: {
  id: string;
  organizationId: string;
  trackingAlertRuleId: string | null;
  vehicleId: string | null;
  tripId: string | null;
  vehiclePositionId: string | null;
  vehicleTelemetryEventId: string | null;
  status: string;
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: event.id,
    organizationId: event.organizationId,
    trackingAlertRuleId: event.trackingAlertRuleId,
    vehicleId: event.vehicleId,
    tripId: event.tripId,
    vehiclePositionId: event.vehiclePositionId,
    vehicleTelemetryEventId: event.vehicleTelemetryEventId,
    status: event.status,
    title: event.title,
    message: event.message,
    triggeredAt: event.triggeredAt,
    acknowledgedAt: event.acknowledgedAt,
    resolvedAt: event.resolvedAt,
    metadata: event.metadata,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function serializeGeofence(geofence: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  geofenceType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  points?: unknown[];
}) {
  return {
    id: geofence.id,
    organizationId: geofence.organizationId,
    name: geofence.name,
    code: geofence.code,
    description: geofence.description,
    geofenceType: geofence.geofenceType,
    status: geofence.status,
    createdAt: geofence.createdAt,
    updatedAt: geofence.updatedAt,
    pointCount: geofence.points?.length ?? 0,
  };
}

export function serializeGeofencePoint(point: {
  id: string;
  geofenceId: string;
  sequence: number;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: point.id,
    geofenceId: point.geofenceId,
    sequence: point.sequence,
    latitude: Number(point.latitude.toString()),
    longitude: Number(point.longitude.toString()),
    createdAt: point.createdAt,
    updatedAt: point.updatedAt,
  };
}

export function serializeFleetReadinessProfile(profile: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  requireActiveVehicle: boolean;
  requireActiveDriver: boolean;
  requireValidVehicleDocuments: boolean;
  requireValidDriverLicense: boolean;
  requireActiveDevice: boolean;
  requireActiveAssignment: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: profile.id,
    organizationId: profile.organizationId,
    name: profile.name,
    description: profile.description,
    requireActiveVehicle: profile.requireActiveVehicle,
    requireActiveDriver: profile.requireActiveDriver,
    requireValidVehicleDocuments: profile.requireValidVehicleDocuments,
    requireValidDriverLicense: profile.requireValidDriverLicense,
    requireActiveDevice: profile.requireActiveDevice,
    requireActiveAssignment: profile.requireActiveAssignment,
    status: profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function serializeVehicleComplianceType(type: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  records?: unknown[];
}) {
  return {
    id: type.id,
    organizationId: type.organizationId,
    name: type.name,
    code: type.code,
    description: type.description,
    status: type.status,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
    recordCount: type.records?.length ?? 0,
  };
}

export function serializeVehicleComplianceRecord(record: {
  id: string;
  vehicleId: string;
  vehicleComplianceTypeId: string;
  referenceNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicleComplianceType?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}) {
  return {
    id: record.id,
    vehicleId: record.vehicleId,
    vehicleComplianceTypeId: record.vehicleComplianceTypeId,
    referenceNumber: record.referenceNumber,
    issueDate: record.issueDate,
    expiryDate: record.expiryDate,
    status: record.status,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    vehicleComplianceType: record.vehicleComplianceType ? serializeVehicleComplianceType(record.vehicleComplianceType) : null,
  };
}

export function serializeDriverComplianceType(type: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  records?: unknown[];
}) {
  return {
    id: type.id,
    organizationId: type.organizationId,
    name: type.name,
    code: type.code,
    description: type.description,
    status: type.status,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
    recordCount: type.records?.length ?? 0,
  };
}

export function serializeDriverComplianceRecord(record: {
  id: string;
  driverId: string;
  driverComplianceTypeId: string;
  referenceNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  driverComplianceType?: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}) {
  return {
    id: record.id,
    driverId: record.driverId,
    driverComplianceTypeId: record.driverComplianceTypeId,
    referenceNumber: record.referenceNumber,
    issueDate: record.issueDate,
    expiryDate: record.expiryDate,
    status: record.status,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    driverComplianceType: record.driverComplianceType ? serializeDriverComplianceType(record.driverComplianceType) : null,
  };
}

export function serializeAssignmentPolicy(policy: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  rules?: unknown[];
}) {
  return {
    id: policy.id,
    organizationId: policy.organizationId,
    name: policy.name,
    description: policy.description,
    status: policy.status,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
    ruleCount: policy.rules?.length ?? 0,
  };
}

export function serializeAssignmentPolicyRule(rule: {
  id: string;
  assignmentPolicyId: string;
  ruleCode: string;
  name: string;
  description: string | null;
  sequence: number;
  isBlocking: boolean;
  isActive: boolean;
  config: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: rule.id,
    assignmentPolicyId: rule.assignmentPolicyId,
    ruleCode: rule.ruleCode,
    name: rule.name,
    description: rule.description,
    sequence: rule.sequence,
    isBlocking: rule.isBlocking,
    isActive: rule.isActive,
    config: rule.config,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

export async function findUserOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function findOrganizationOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  organizationId: string
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: true,
      customerAccounts: true,
    },
  });

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  return organization;
}

export async function findCustomerAccountOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  customerAccountId: string
) {
  const account = await prisma.customerAccount.findUnique({
    where: { id: customerAccountId },
    include: {
      contacts: true,
      locations: true,
      organization: true,
    },
  });

  if (!account) {
    throw new NotFoundError('Customer account not found');
  }

  return account;
}

export async function findDepartmentOrThrow(prisma: Prisma.TransactionClient | PrismaClient, departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new NotFoundError('Department not found');
  }

  return department;
}

export async function findBusinessUnitOrThrow(prisma: Prisma.TransactionClient | PrismaClient, businessUnitId: string) {
  const unit = await prisma.businessUnit.findUnique({
    where: { id: businessUnitId },
  });

  if (!unit) {
    throw new NotFoundError('Business unit not found');
  }

  return unit;
}

export async function findVendorOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      contacts: true,
      vendorCategory: true,
      contracts: true,
    },
  });

  if (!vendor) {
    throw new NotFoundError('Vendor not found');
  }

  return vendor;
}

export async function findServiceRouteOrThrow(prisma: Prisma.TransactionClient | PrismaClient, serviceRouteId: string) {
  const route = await prisma.serviceRoute.findUnique({
    where: { id: serviceRouteId },
    include: {
      stops: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!route) {
    throw new NotFoundError('Service route not found');
  }

  return route;
}

export async function findOrganizationInvitationOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  invitationId: string
) {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new NotFoundError('Organization invitation not found');
  }

  return invitation;
}

export async function findVendorCategoryOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vendorCategoryId: string) {
  const category = await prisma.vendorCategory.findUnique({
    where: { id: vendorCategoryId },
    include: {
      vendors: true,
    },
  });

  if (!category) {
    throw new NotFoundError('Vendor category not found');
  }

  return category;
}

export async function findVendorContractOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vendorContractId: string) {
  const contract = await prisma.vendorContract.findUnique({
    where: { id: vendorContractId },
  });

  if (!contract) {
    throw new NotFoundError('Vendor contract not found');
  }

  return contract;
}

export async function findServiceAreaOrThrow(prisma: Prisma.TransactionClient | PrismaClient, serviceAreaId: string) {
  const area = await prisma.serviceArea.findUnique({
    where: { id: serviceAreaId },
    include: {
      locations: {
        include: {
          customerLocation: true,
        },
      },
    },
  });

  if (!area) {
    throw new NotFoundError('Service area not found');
  }

  return area;
}

export async function findServiceRouteGroupOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  serviceRouteGroupId: string
) {
  const group = await prisma.serviceRouteGroup.findUnique({
    where: { id: serviceRouteGroupId },
    include: {
      routes: true,
      templates: true,
    },
  });

  if (!group) {
    throw new NotFoundError('Service route group not found');
  }

  return group;
}

export async function findServiceRouteTemplateOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  serviceRouteTemplateId: string
) {
  const template = await prisma.serviceRouteTemplate.findUnique({
    where: { id: serviceRouteTemplateId },
    include: {
      stops: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!template) {
    throw new NotFoundError('Service route template not found');
  }

  return template;
}

export async function findTripTemplateOrThrow(prisma: Prisma.TransactionClient | PrismaClient, tripTemplateId: string) {
  const template = await prisma.tripTemplate.findUnique({
    where: { id: tripTemplateId },
    include: {
      serviceRoute: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      serviceRouteTemplate: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      stops: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!template) {
    throw new NotFoundError('Trip template not found');
  }

  return template;
}

export async function findVehicleTypeOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleTypeId: string) {
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: vehicleTypeId },
    include: {
      vehicles: true,
    },
  });

  if (!vehicleType) {
    throw new NotFoundError('Vehicle type not found');
  }

  return vehicleType;
}

export async function findVehicleGroupOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleGroupId: string) {
  const vehicleGroup = await prisma.vehicleGroup.findUnique({
    where: { id: vehicleGroupId },
    include: {
      vehicles: true,
    },
  });

  if (!vehicleGroup) {
    throw new NotFoundError('Vehicle group not found');
  }

  return vehicleGroup;
}

export async function findVehicleMakeOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleMakeId: string) {
  const vehicleMake = await prisma.vehicleMake.findUnique({
    where: { id: vehicleMakeId },
    include: {
      models: true,
      vehicles: true,
    },
  });

  if (!vehicleMake) {
    throw new NotFoundError('Vehicle make not found');
  }

  return vehicleMake;
}

export async function findVehicleModelOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleModelId: string) {
  const vehicleModel = await prisma.vehicleModel.findUnique({
    where: { id: vehicleModelId },
    include: {
      vehicleMake: true,
      vehicles: true,
    },
  });

  if (!vehicleModel) {
    throw new NotFoundError('Vehicle model not found');
  }

  return vehicleModel;
}

export async function findVehicleOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      customerAccount: {
        include: {
          contacts: true,
          locations: true,
        },
      },
      department: true,
      businessUnit: true,
      vehicleType: true,
      vehicleGroup: true,
      make: true,
      model: true,
      serviceRouteTemplate: {
        include: {
          stops: true,
        },
      },
      documents: true,
      devices: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return vehicle;
}

export async function findVehicleDocumentOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  vehicleDocumentId: string
) {
  const document = await prisma.vehicleDocument.findUnique({
    where: { id: vehicleDocumentId },
  });

  if (!document) {
    throw new NotFoundError('Vehicle document not found');
  }

  return document;
}

export async function findVehicleDeviceOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehicleDeviceId: string) {
  const device = await prisma.vehicleDevice.findUnique({
    where: { id: vehicleDeviceId },
  });

  if (!device) {
    throw new NotFoundError('Vehicle device not found');
  }

  return device;
}

export async function findDriverGroupOrThrow(prisma: Prisma.TransactionClient | PrismaClient, driverGroupId: string) {
  const group = await prisma.driverGroup.findUnique({
    where: { id: driverGroupId },
    include: {
      drivers: true,
    },
  });

  if (!group) {
    throw new NotFoundError('Driver group not found');
  }

  return group;
}

export async function findDriverSkillOrThrow(prisma: Prisma.TransactionClient | PrismaClient, driverSkillId: string) {
  const skill = await prisma.driverSkill.findUnique({
    where: { id: driverSkillId },
    include: {
      assignments: true,
    },
  });

  if (!skill) {
    throw new NotFoundError('Driver skill not found');
  }

  return skill;
}

export async function findDriverOrThrow(prisma: Prisma.TransactionClient | PrismaClient, driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      customerAccount: {
        include: {
          contacts: true,
          locations: true,
        },
      },
      department: true,
      businessUnit: true,
      driverGroup: true,
      skillAssignments: {
        include: {
          driverSkill: true,
        },
      },
      licenses: true,
      documents: true,
      vehicleAssignments: true,
    },
  });

  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  return driver;
}

export async function findDriverLicenseOrThrow(prisma: Prisma.TransactionClient | PrismaClient, driverLicenseId: string) {
  const license = await prisma.driverLicense.findUnique({
    where: { id: driverLicenseId },
  });

  if (!license) {
    throw new NotFoundError('Driver license not found');
  }

  return license;
}

export async function findDriverDocumentOrThrow(prisma: Prisma.TransactionClient | PrismaClient, driverDocumentId: string) {
  const document = await prisma.driverDocument.findUnique({
    where: { id: driverDocumentId },
  });

  if (!document) {
    throw new NotFoundError('Driver document not found');
  }

  return document;
}

export async function findDriverVehicleAssignmentOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  driverVehicleAssignmentId: string
) {
  const assignment = await prisma.driverVehicleAssignment.findUnique({
    where: { id: driverVehicleAssignmentId },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  if (!assignment) {
    throw new NotFoundError('Driver vehicle assignment not found');
  }

  return assignment;
}

export async function findFleetReadinessProfileOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  fleetReadinessProfileId: string
) {
  const profile = await prisma.fleetReadinessProfile.findUnique({
    where: { id: fleetReadinessProfileId },
  });

  if (!profile) {
    throw new NotFoundError('Fleet readiness profile not found');
  }

  return profile;
}

export async function findVehicleComplianceTypeOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  vehicleComplianceTypeId: string
) {
  const type = await prisma.vehicleComplianceType.findUnique({
    where: { id: vehicleComplianceTypeId },
    include: {
      records: true,
    },
  });

  if (!type) {
    throw new NotFoundError('Vehicle compliance type not found');
  }

  return type;
}

export async function findVehicleComplianceRecordOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  vehicleComplianceRecordId: string
) {
  const record = await prisma.vehicleComplianceRecord.findUnique({
    where: { id: vehicleComplianceRecordId },
    include: {
      vehicleComplianceType: true,
    },
  });

  if (!record) {
    throw new NotFoundError('Vehicle compliance record not found');
  }

  return record;
}

export async function findDriverComplianceTypeOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  driverComplianceTypeId: string
) {
  const type = await prisma.driverComplianceType.findUnique({
    where: { id: driverComplianceTypeId },
    include: {
      records: true,
    },
  });

  if (!type) {
    throw new NotFoundError('Driver compliance type not found');
  }

  return type;
}

export async function findDriverComplianceRecordOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  driverComplianceRecordId: string
) {
  const record = await prisma.driverComplianceRecord.findUnique({
    where: { id: driverComplianceRecordId },
    include: {
      driverComplianceType: true,
    },
  });

  if (!record) {
    throw new NotFoundError('Driver compliance record not found');
  }

  return record;
}

export async function findAssignmentPolicyOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  assignmentPolicyId: string
) {
  const policy = await prisma.assignmentPolicy.findUnique({
    where: { id: assignmentPolicyId },
    include: {
      rules: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!policy) {
    throw new NotFoundError('Assignment policy not found');
  }

  return policy;
}

export async function findAssignmentPolicyRuleOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  assignmentPolicyRuleId: string
) {
  const rule = await prisma.assignmentPolicyRule.findUnique({
    where: { id: assignmentPolicyRuleId },
  });

  if (!rule) {
    throw new NotFoundError('Assignment policy rule not found');
  }

  return rule;
}

export async function findPlannedTripOrThrow(prisma: Prisma.TransactionClient | PrismaClient, plannedTripId: string) {
  const trip = await prisma.plannedTrip.findUnique({
    where: { id: plannedTripId },
    include: {
      customerAccount: {
        include: {
          contacts: true,
          locations: true,
        },
      },
      serviceRoute: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      serviceRouteTemplate: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      tripTemplate: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      vehicle: {
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: { include: { stops: true } },
          documents: true,
          devices: true,
        },
      },
      driver: {
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          driverGroup: true,
          skillAssignments: { include: { driverSkill: true } },
          licenses: true,
          documents: true,
          vehicleAssignments: true,
        },
      },
      assignment: {
        include: {
          driver: true,
          vehicle: true,
        },
      },
      stops: {
        orderBy: { sequence: 'asc' },
      },
      dispatchQueueItems: true,
    },
  });

  if (!trip) {
    throw new NotFoundError('Planned trip not found');
  }

  return trip;
}

export async function findDispatchQueueOrThrow(prisma: Prisma.TransactionClient | PrismaClient, dispatchQueueId: string) {
  const queue = await prisma.dispatchQueue.findUnique({
    where: { id: dispatchQueueId },
    include: {
      items: {
        orderBy: { sequence: 'asc' },
        include: {
          plannedTrip: {
            include: {
              customerAccount: {
                include: {
                  contacts: true,
                  locations: true,
                },
              },
              serviceRoute: {
                include: {
                  stops: {
                    orderBy: { sequence: 'asc' },
                  },
                },
              },
              serviceRouteTemplate: {
                include: {
                  stops: {
                    orderBy: { sequence: 'asc' },
                  },
                },
              },
              tripTemplate: {
                include: {
                  stops: {
                    orderBy: { sequence: 'asc' },
                  },
                },
              },
              vehicle: {
                include: {
                  customerAccount: { include: { contacts: true, locations: true } },
                  department: true,
                  businessUnit: true,
                  vehicleType: true,
                  vehicleGroup: true,
                  make: true,
                  model: true,
                  serviceRouteTemplate: { include: { stops: true } },
                  documents: true,
                  devices: true,
                },
              },
              driver: {
                include: {
                  customerAccount: { include: { contacts: true, locations: true } },
                  department: true,
                  businessUnit: true,
                  driverGroup: true,
                  skillAssignments: { include: { driverSkill: true } },
                  licenses: true,
                  documents: true,
                  vehicleAssignments: true,
                },
              },
              assignment: {
                include: {
                  driver: true,
                  vehicle: true,
                },
              },
              stops: {
                orderBy: { sequence: 'asc' },
              },
              dispatchQueueItems: true,
            },
          },
        },
      },
    },
  });

  if (!queue) {
    throw new NotFoundError('Dispatch queue not found');
  }

  return queue;
}

export async function findDispatchQueueItemOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  dispatchQueueItemId: string
) {
  const item = await prisma.dispatchQueueItem.findUnique({
    where: { id: dispatchQueueItemId },
    include: {
      plannedTrip: {
        include: {
          customerAccount: {
            include: {
              contacts: true,
              locations: true,
            },
          },
          serviceRoute: {
            include: {
              stops: {
                orderBy: { sequence: 'asc' },
              },
            },
          },
          serviceRouteTemplate: {
            include: {
              stops: {
                orderBy: { sequence: 'asc' },
              },
            },
          },
          tripTemplate: {
            include: {
              stops: {
                orderBy: { sequence: 'asc' },
              },
            },
          },
          vehicle: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              vehicleType: true,
              vehicleGroup: true,
              make: true,
              model: true,
              serviceRouteTemplate: { include: { stops: true } },
              documents: true,
              devices: true,
            },
          },
          driver: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              driverGroup: true,
              skillAssignments: { include: { driverSkill: true } },
              licenses: true,
              documents: true,
              vehicleAssignments: true,
            },
          },
          assignment: {
            include: {
              driver: true,
              vehicle: true,
            },
          },
          stops: {
            orderBy: { sequence: 'asc' },
          },
          dispatchQueueItems: true,
        },
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Dispatch queue item not found');
  }

  return item;
}

export async function findTripOrThrow(prisma: Prisma.TransactionClient | PrismaClient, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      customerAccount: {
        include: {
          contacts: true,
          locations: true,
        },
      },
      plannedTrip: {
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          serviceRoute: { include: { stops: { orderBy: { sequence: 'asc' } } } },
          serviceRouteTemplate: { include: { stops: { orderBy: { sequence: 'asc' } } } },
          tripTemplate: { include: { stops: { orderBy: { sequence: 'asc' } } } },
          vehicle: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              vehicleType: true,
              vehicleGroup: true,
              make: true,
              model: true,
              serviceRouteTemplate: { include: { stops: true } },
              documents: true,
              devices: true,
            },
          },
          driver: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              driverGroup: true,
              skillAssignments: { include: { driverSkill: true } },
              licenses: true,
              documents: true,
              vehicleAssignments: true,
            },
          },
          assignment: { include: { driver: true, vehicle: true } },
          stops: { orderBy: { sequence: 'asc' } },
          dispatchQueueItems: true,
        },
      },
      serviceRoute: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      serviceRouteTemplate: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      tripTemplate: {
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      vehicle: {
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: { include: { stops: true } },
          documents: true,
          devices: true,
        },
      },
      driver: {
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          driverGroup: true,
          skillAssignments: { include: { driverSkill: true } },
          licenses: true,
          documents: true,
          vehicleAssignments: true,
        },
      },
      assignment: {
        include: {
          driver: true,
          vehicle: true,
        },
      },
      stops: {
        orderBy: { sequence: 'asc' },
      },
      events: {
        orderBy: { happenedAt: 'asc' },
        include: {
          actorUser: true,
        },
      },
      dispatchActions: {
        orderBy: { happenedAt: 'asc' },
        include: {
          actorUser: true,
        },
      },
    },
  });

  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  return trip;
}

export async function findTripStopOrThrow(prisma: Prisma.TransactionClient | PrismaClient, tripStopId: string) {
  const stop = await prisma.tripStop.findUnique({
    where: { id: tripStopId },
  });

  if (!stop) {
    throw new NotFoundError('Trip stop not found');
  }

  return stop;
}

export async function findTripEventOrThrow(prisma: Prisma.TransactionClient | PrismaClient, tripEventId: string) {
  const event = await prisma.tripEvent.findUnique({
    where: { id: tripEventId },
    include: {
      actorUser: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Trip event not found');
  }

  return event;
}

export async function findDispatchActionOrThrow(prisma: Prisma.TransactionClient | PrismaClient, dispatchActionId: string) {
  const action = await prisma.dispatchAction.findUnique({
    where: { id: dispatchActionId },
    include: {
      actorUser: true,
    },
  });

  if (!action) {
    throw new NotFoundError('Dispatch action not found');
  }

  return action;
}

export async function findTrackingProviderOrThrow(prisma: Prisma.TransactionClient | PrismaClient, trackingProviderId: string) {
  const provider = await prisma.trackingProvider.findUnique({
    where: { id: trackingProviderId },
    include: {
      credentials: true,
      health: true,
    },
  });

  if (!provider) {
    throw new NotFoundError('Tracking provider not found');
  }

  return provider;
}

export async function findTrackingProviderCredentialOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingProviderCredentialId: string
) {
  const credential = await prisma.trackingProviderCredential.findUnique({
    where: { id: trackingProviderCredentialId },
  });

  if (!credential) {
    throw new NotFoundError('Tracking provider credential not found');
  }

  return credential;
}

export async function findTrackingProviderHealthOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingProviderHealthId: string
) {
  const health = await prisma.trackingProviderHealth.findUnique({
    where: { id: trackingProviderHealthId },
  });

  if (!health) {
    throw new NotFoundError('Tracking provider health record not found');
  }

  return health;
}

export async function findVehiclePositionOrThrow(prisma: Prisma.TransactionClient | PrismaClient, vehiclePositionId: string) {
  const position = await prisma.vehiclePosition.findUnique({
    where: { id: vehiclePositionId },
  });

  if (!position) {
    throw new NotFoundError('Vehicle position not found');
  }

  return position;
}

export async function findVehicleTelemetryEventOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  vehicleTelemetryEventId: string
) {
  const event = await prisma.vehicleTelemetryEvent.findUnique({
    where: { id: vehicleTelemetryEventId },
  });

  if (!event) {
    throw new NotFoundError('Vehicle telemetry event not found');
  }

  return event;
}

export async function findExternalTrackingDeviceOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  externalTrackingDeviceId: string
) {
  const device = await prisma.externalTrackingDevice.findUnique({
    where: { id: externalTrackingDeviceId },
    include: {
      mappings: true,
      trackingProvider: true,
    },
  });

  if (!device) {
    throw new NotFoundError('External tracking device not found');
  }

  return device;
}

export async function findVehicleDeviceMappingOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  vehicleDeviceMappingId: string
) {
  const mapping = await prisma.vehicleDeviceMapping.findUnique({
    where: { id: vehicleDeviceMappingId },
    include: {
      externalTrackingDevice: true,
      vehicle: true,
      vehicleDevice: true,
      trackingProvider: true,
    },
  });

  if (!mapping) {
    throw new NotFoundError('Vehicle device mapping not found');
  }

  return mapping;
}

export async function findTrackingProviderSyncRunOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingProviderSyncRunId: string
) {
  const run = await prisma.trackingProviderSyncRun.findUnique({
    where: { id: trackingProviderSyncRunId },
    include: {
      items: true,
      trackingProvider: true,
    },
  });

  if (!run) {
    throw new NotFoundError('Tracking provider sync run not found');
  }

  return run;
}

export async function findTrackingProviderSyncItemOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingProviderSyncItemId: string
) {
  const item = await prisma.trackingProviderSyncItem.findUnique({
    where: { id: trackingProviderSyncItemId },
  });

  if (!item) {
    throw new NotFoundError('Tracking provider sync item not found');
  }

  return item;
}

export async function findTrackingAlertRuleOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingAlertRuleId: string
) {
  const rule = await prisma.trackingAlertRule.findUnique({
    where: { id: trackingAlertRuleId },
    include: {
      events: true,
    },
  });

  if (!rule) {
    throw new NotFoundError('Tracking alert rule not found');
  }

  return rule;
}

export async function findTrackingAlertEventOrThrow(
  prisma: Prisma.TransactionClient | PrismaClient,
  trackingAlertEventId: string
) {
  const event = await prisma.trackingAlertEvent.findUnique({
    where: { id: trackingAlertEventId },
  });

  if (!event) {
    throw new NotFoundError('Tracking alert event not found');
  }

  return event;
}

export async function findGeofenceOrThrow(prisma: Prisma.TransactionClient | PrismaClient, geofenceId: string) {
  const geofence = await prisma.geofence.findUnique({
    where: { id: geofenceId },
    include: {
      points: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!geofence) {
    throw new NotFoundError('Geofence not found');
  }

  return geofence;
}

export async function findGeofencePointOrThrow(prisma: Prisma.TransactionClient | PrismaClient, geofencePointId: string) {
  const point = await prisma.geofencePoint.findUnique({
    where: { id: geofencePointId },
  });

  if (!point) {
    throw new NotFoundError('Geofence point not found');
  }

  return point;
}
