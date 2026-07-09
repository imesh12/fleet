import type { FastifyPluginAsync } from 'fastify';

import { adminAuditLogRoutes } from './audit-logs/routes.js';
import { adminBusinessUnitRoutes } from './business-units/routes.js';
import { adminBackgroundJobRoutes } from './background-jobs/routes.js';
import { adminCustomerAccountRoutes } from './customer-accounts/routes.js';
import { adminDepartmentRoutes } from './departments/routes.js';
import { adminDispatchRoutes } from './dispatch/routes.js';
import { adminDispatchActionRoutes } from './dispatch-actions/routes.js';
import { adminDispatchQueueRoutes } from './dispatch-queues/routes.js';
import { adminDriverComplianceRecordRoutes } from './driver-compliance-records/routes.js';
import { adminDriverComplianceTypeRoutes } from './driver-compliance-types/routes.js';
import { adminDriverGroupRoutes } from './driver-groups/routes.js';
import { adminDriverSkillRoutes } from './driver-skills/routes.js';
import { adminDriverVehicleAssignmentRoutes } from './driver-vehicle-assignments/routes.js';
import { adminDriverRoutes } from './drivers/routes.js';
import { adminGeofenceRoutes } from './geofences/routes.js';
import { adminAssignmentPolicyRoutes } from './assignment-policies/routes.js';
import { adminFleetReadinessRoutes } from './fleet-readiness/routes.js';
import { adminFleetReadinessProfileRoutes } from './fleet-readiness-profiles/routes.js';
import { adminEscalationPolicyRoutes } from './escalation-policies/routes.js';
import { adminOrganizationRoutes } from './organizations/routes.js';
import { adminNotificationDeliveryRoutes } from './notification-deliveries/routes.js';
import { adminNotificationProviderRoutes } from './notification-providers/routes.js';
import { adminNotificationTemplateRoutes } from './notification-templates/routes.js';
import { adminOrganizationInvitationRoutes } from './organization-invitations/routes.js';
import { adminPermissionRoutes } from './permissions/routes.js';
import { adminRoleRoutes } from './roles/routes.js';
import { adminServiceAreaRoutes } from './service-areas/routes.js';
import { adminServiceRouteGroupRoutes } from './service-route-groups/routes.js';
import { adminServiceRouteTemplateRoutes } from './service-route-templates/routes.js';
import { adminSessionRoutes } from './sessions/routes.js';
import { adminSettingRoutes } from './settings/routes.js';
import { adminServiceRouteRoutes } from './service-routes/routes.js';
import { adminUserRoutes } from './users/routes.js';
import { adminPlannedTripRoutes } from './planned-trips/routes.js';
import { adminTripTemplateRoutes } from './trip-templates/routes.js';
import { adminTripRoutes } from './trips/routes.js';
import { adminTrackingRoutes } from './tracking/routes.js';
import { adminTrackingAlertRuleRoutes } from './tracking-alert-rules/routes.js';
import { adminTrackingDeviceMappingRoutes } from './tracking-device-mappings/routes.js';
import { adminTrackingEvaluationRoutes } from './tracking-evaluations/routes.js';
import { adminTrackingExternalDeviceRoutes } from './tracking-external-devices/routes.js';
import { adminTrackingNotificationRoutes } from './tracking-notifications/routes.js';
import { adminTrackingProviderSyncRoutes } from './tracking-provider-sync/routes.js';
import { adminTrackingProviderRoutes } from './tracking-providers/routes.js';
import { adminVehicleGroupRoutes } from './vehicle-groups/routes.js';
import { adminVehicleMakeRoutes } from './vehicle-makes/routes.js';
import { adminVehicleModelRoutes } from './vehicle-models/routes.js';
import { adminVehicleTypeRoutes } from './vehicle-types/routes.js';
import { adminVehicleComplianceRecordRoutes } from './vehicle-compliance-records/routes.js';
import { adminVehicleComplianceTypeRoutes } from './vehicle-compliance-types/routes.js';
import { adminVehicleRoutes } from './vehicles/routes.js';
import { adminVendorCategoryRoutes } from './vendor-categories/routes.js';
import { adminVendorRoutes } from './vendors/routes.js';

const adminRoutePlugins: FastifyPluginAsync[] = [
  adminBackgroundJobRoutes,
  adminUserRoutes,
  adminOrganizationRoutes,
  adminOrganizationInvitationRoutes,
  adminDepartmentRoutes,
  adminBusinessUnitRoutes,
  adminFleetReadinessProfileRoutes,
  adminFleetReadinessRoutes,
  adminEscalationPolicyRoutes,
  adminVehicleComplianceTypeRoutes,
  adminVehicleComplianceRecordRoutes,
  adminDriverComplianceTypeRoutes,
  adminDriverComplianceRecordRoutes,
  adminAssignmentPolicyRoutes,
  adminTripTemplateRoutes,
  adminPlannedTripRoutes,
  adminTripRoutes,
  adminTrackingProviderRoutes,
  adminTrackingProviderSyncRoutes,
  adminTrackingExternalDeviceRoutes,
  adminTrackingDeviceMappingRoutes,
  adminTrackingAlertRuleRoutes,
  adminTrackingEvaluationRoutes,
  adminTrackingRoutes,
  adminTrackingNotificationRoutes,
  adminNotificationProviderRoutes,
  adminNotificationTemplateRoutes,
  adminNotificationDeliveryRoutes,
  adminGeofenceRoutes,
  adminDispatchQueueRoutes,
  adminDispatchRoutes,
  adminDispatchActionRoutes,
  adminDriverGroupRoutes,
  adminDriverSkillRoutes,
  adminDriverRoutes,
  adminDriverVehicleAssignmentRoutes,
  adminVehicleTypeRoutes,
  adminVehicleGroupRoutes,
  adminVehicleMakeRoutes,
  adminVehicleModelRoutes,
  adminVehicleRoutes,
  adminVendorCategoryRoutes,
  adminVendorRoutes,
  adminServiceAreaRoutes,
  adminServiceRouteGroupRoutes,
  adminServiceRouteTemplateRoutes,
  adminServiceRouteRoutes,
  adminCustomerAccountRoutes,
  adminRoleRoutes,
  adminPermissionRoutes,
  adminSessionRoutes,
  adminAuditLogRoutes,
  adminSettingRoutes,
];

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  for (const routePlugin of adminRoutePlugins) {
    await fastify.register(routePlugin);
  }
};
