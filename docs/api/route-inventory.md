# API Route Inventory

Generated at: 2026-07-16T01:24:13.417Z

Total routes: 584

## Modules

### admin/assignment-policies

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/assignment-policies` | yes | `assignment-policies:read` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:80
POST | `/api/v1/admin/assignment-policies` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:110
GET | `/api/v1/admin/assignment-policies/:assignmentPolicyId` | yes | `assignment-policies:read` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:103
PATCH | `/api/v1/admin/assignment-policies/:assignmentPolicyId` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:130
POST | `/api/v1/admin/assignment-policies/:assignmentPolicyId/activate` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:144
POST | `/api/v1/admin/assignment-policies/:assignmentPolicyId/deactivate` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:153
POST | `/api/v1/admin/assignment-policies/:assignmentPolicyId/rules` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:162
DELETE | `/api/v1/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:215
PATCH | `/api/v1/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:187
POST | `/api/v1/admin/assignment-policies/:assignmentPolicyId/rules/reorder` | yes | `assignment-policies:manage` | guarded | apps/api/src/modules/admin/assignment-policies/routes.ts:237

### admin/audit-logs

Routes: 2

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/audit-logs` | yes | `audit:logs:read` | guarded | apps/api/src/modules/admin/audit-logs/routes.ts:66
GET | `/api/v1/admin/audit-logs/:auditLogId` | yes | `audit:logs:read` | guarded | apps/api/src/modules/admin/audit-logs/routes.ts:119

### admin/background-jobs

Routes: 15

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/background-jobs` | yes | `background-jobs:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:203
POST | `/api/v1/admin/background-jobs` | yes | `background-jobs:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:231
GET | `/api/v1/admin/background-jobs/:jobDefinitionId` | yes | `background-jobs:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:291
PATCH | `/api/v1/admin/background-jobs/:jobDefinitionId` | yes | `background-jobs:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:303
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/activate` | yes | `background-jobs:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:342
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/deactivate` | yes | `background-jobs:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:356
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/run` | yes | `background-jobs:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:436
GET | `/api/v1/admin/background-jobs/:jobDefinitionId/runs` | yes | `background-job-runs:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:456
GET | `/api/v1/admin/background-jobs/:jobDefinitionId/runs/:runId` | yes | `background-job-runs:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:483
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/schedule/disable` | yes | `job-schedules:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:390
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/schedule/enable` | yes | `job-schedules:manage` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:370
GET | `/api/v1/admin/background-jobs/:jobDefinitionId/schedule/preview` | yes | `job-schedules:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:404
POST | `/api/v1/admin/background-jobs/:jobDefinitionId/trigger-now` | yes | `workers:run` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:416
GET | `/api/v1/admin/background-jobs/due` | yes | `job-schedules:read` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:266
POST | `/api/v1/admin/background-jobs/run-due` | yes | `workers:run` | guarded | apps/api/src/modules/admin/background-jobs/routes.ts:277

### admin/business-units

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/business-units` | yes | `business-units:read` | guarded | apps/api/src/modules/admin/business-units/routes.ts:45
POST | `/api/v1/admin/business-units` | yes | `business-units:manage` | guarded | apps/api/src/modules/admin/business-units/routes.ts:115
GET | `/api/v1/admin/business-units/:businessUnitId` | yes | `business-units:read` | guarded | apps/api/src/modules/admin/business-units/routes.ts:101
PATCH | `/api/v1/admin/business-units/:businessUnitId` | yes | `business-units:manage` | guarded | apps/api/src/modules/admin/business-units/routes.ts:161
POST | `/api/v1/admin/business-units/:businessUnitId/activate` | yes | `business-units:manage` | guarded | apps/api/src/modules/admin/business-units/routes.ts:194
POST | `/api/v1/admin/business-units/:businessUnitId/deactivate` | yes | `business-units:manage` | guarded | apps/api/src/modules/admin/business-units/routes.ts:220

### admin/customer-accounts

Routes: 12

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/customer-accounts` | yes | `customer-accounts:read` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:124
POST | `/api/v1/admin/customer-accounts` | yes | `customer-accounts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:214
GET | `/api/v1/admin/customer-accounts/:customerAccountId` | yes | `customer-accounts:read` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:194
PATCH | `/api/v1/admin/customer-accounts/:customerAccountId` | yes | `customer-accounts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:267
POST | `/api/v1/admin/customer-accounts/:customerAccountId/activate` | yes | `customer-accounts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:307
POST | `/api/v1/admin/customer-accounts/:customerAccountId/contacts` | yes | `customer-contacts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:361
DELETE | `/api/v1/admin/customer-accounts/:customerAccountId/contacts/:contactId` | yes | `customer-contacts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:446
PATCH | `/api/v1/admin/customer-accounts/:customerAccountId/contacts/:contactId` | yes | `customer-contacts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:397
POST | `/api/v1/admin/customer-accounts/:customerAccountId/deactivate` | yes | `customer-accounts:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:334
POST | `/api/v1/admin/customer-accounts/:customerAccountId/locations` | yes | `customer-locations:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:478
DELETE | `/api/v1/admin/customer-accounts/:customerAccountId/locations/:locationId` | yes | `customer-locations:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:570
PATCH | `/api/v1/admin/customer-accounts/:customerAccountId/locations/:locationId` | yes | `customer-locations:manage` | guarded | apps/api/src/modules/admin/customer-accounts/routes.ts:519

### admin/departments

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/departments` | yes | `departments:read` | guarded | apps/api/src/modules/admin/departments/routes.ts:45
POST | `/api/v1/admin/departments` | yes | `departments:manage` | guarded | apps/api/src/modules/admin/departments/routes.ts:115
GET | `/api/v1/admin/departments/:departmentId` | yes | `departments:read` | guarded | apps/api/src/modules/admin/departments/routes.ts:101
PATCH | `/api/v1/admin/departments/:departmentId` | yes | `departments:manage` | guarded | apps/api/src/modules/admin/departments/routes.ts:161
POST | `/api/v1/admin/departments/:departmentId/activate` | yes | `departments:manage` | guarded | apps/api/src/modules/admin/departments/routes.ts:194
POST | `/api/v1/admin/departments/:departmentId/deactivate` | yes | `departments:manage` | guarded | apps/api/src/modules/admin/departments/routes.ts:220

### admin/dispatch

Routes: 1

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
POST | `/api/v1/admin/dispatch/validate` | yes | `dispatch-validation:read` | guarded | apps/api/src/modules/admin/dispatch/routes.ts:40

### admin/dispatch-actions

Routes: 3

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/dispatch/actions` | yes | `dispatch-actions:read` | guarded | apps/api/src/modules/admin/dispatch-actions/routes.ts:58
POST | `/api/v1/admin/dispatch/actions` | yes | `dispatch-actions:manage` | guarded | apps/api/src/modules/admin/dispatch-actions/routes.ts:113
GET | `/api/v1/admin/dispatch/actions/:dispatchActionId` | yes | `dispatch-actions:read` | guarded | apps/api/src/modules/admin/dispatch-actions/routes.ts:106

### admin/dispatch-queues

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/dispatch-queues` | yes | `dispatch-queues:read` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:108
POST | `/api/v1/admin/dispatch-queues` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:172
GET | `/api/v1/admin/dispatch-queues/:dispatchQueueId` | yes | `dispatch-queues:read` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:159
PATCH | `/api/v1/admin/dispatch-queues/:dispatchQueueId` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:193
POST | `/api/v1/admin/dispatch-queues/:dispatchQueueId/activate` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:209
POST | `/api/v1/admin/dispatch-queues/:dispatchQueueId/deactivate` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:218
POST | `/api/v1/admin/dispatch-queues/:dispatchQueueId/items` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:227
DELETE | `/api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:301
POST | `/api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId/status` | yes | `dispatch-status:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:349
POST | `/api/v1/admin/dispatch-queues/:dispatchQueueId/items/reorder` | yes | `dispatch-queues:manage` | guarded | apps/api/src/modules/admin/dispatch-queues/routes.ts:326

### admin/driver-compliance-records

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/drivers/:driverId/compliance-records` | yes | `driver-compliance-records:read` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:88
POST | `/api/v1/admin/drivers/:driverId/compliance-records` | yes | `driver-compliance-records:manage` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:107
GET | `/api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId` | yes | `driver-compliance-records:read` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:96
PATCH | `/api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId` | yes | `driver-compliance-records:manage` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:124
POST | `/api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId/archive` | yes | `driver-compliance-records:manage` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:154
GET | `/api/v1/admin/drivers/compliance-records/expiring` | yes | `driver-compliance-records:read` | guarded | apps/api/src/modules/admin/driver-compliance-records/routes.ts:56

### admin/driver-compliance-types

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/driver-compliance-types` | yes | `driver-compliance-types:read` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:45
POST | `/api/v1/admin/driver-compliance-types` | yes | `driver-compliance-types:manage` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:75
GET | `/api/v1/admin/driver-compliance-types/:driverComplianceTypeId` | yes | `driver-compliance-types:read` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:68
PATCH | `/api/v1/admin/driver-compliance-types/:driverComplianceTypeId` | yes | `driver-compliance-types:manage` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:97
POST | `/api/v1/admin/driver-compliance-types/:driverComplianceTypeId/activate` | yes | `driver-compliance-types:manage` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:111
POST | `/api/v1/admin/driver-compliance-types/:driverComplianceTypeId/deactivate` | yes | `driver-compliance-types:manage` | guarded | apps/api/src/modules/admin/driver-compliance-types/routes.ts:120

### admin/driver-groups

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/driver-groups` | yes | `driver-groups:read` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:45
POST | `/api/v1/admin/driver-groups` | yes | `driver-groups:manage` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:83
GET | `/api/v1/admin/driver-groups/:driverGroupId` | yes | `driver-groups:read` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:76
PATCH | `/api/v1/admin/driver-groups/:driverGroupId` | yes | `driver-groups:manage` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:102
POST | `/api/v1/admin/driver-groups/:driverGroupId/activate` | yes | `driver-groups:manage` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:114
POST | `/api/v1/admin/driver-groups/:driverGroupId/deactivate` | yes | `driver-groups:manage` | guarded | apps/api/src/modules/admin/driver-groups/routes.ts:123

### admin/driver-skills

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/driver-skills` | yes | `driver-skills:read` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:45
POST | `/api/v1/admin/driver-skills` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:83
GET | `/api/v1/admin/driver-skills/:driverSkillId` | yes | `driver-skills:read` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:76
PATCH | `/api/v1/admin/driver-skills/:driverSkillId` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:102
POST | `/api/v1/admin/driver-skills/:driverSkillId/activate` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:113
POST | `/api/v1/admin/driver-skills/:driverSkillId/deactivate` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/driver-skills/routes.ts:122

### admin/driver-vehicle-assignments

Routes: 7

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/driver-vehicle-assignments` | yes | `driver-vehicle-assignments:read` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:54
POST | `/api/v1/admin/driver-vehicle-assignments` | yes | `driver-vehicle-assignments:manage` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:89
GET | `/api/v1/admin/driver-vehicle-assignments/:assignmentId` | yes | `driver-vehicle-assignments:read` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:82
PATCH | `/api/v1/admin/driver-vehicle-assignments/:assignmentId` | yes | `driver-vehicle-assignments:manage` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:107
POST | `/api/v1/admin/driver-vehicle-assignments/:assignmentId/activate` | yes | `driver-vehicle-assignments:manage` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:119
POST | `/api/v1/admin/driver-vehicle-assignments/:assignmentId/cancel` | yes | `driver-vehicle-assignments:manage` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:137
POST | `/api/v1/admin/driver-vehicle-assignments/:assignmentId/end` | yes | `driver-vehicle-assignments:manage` | guarded | apps/api/src/modules/admin/driver-vehicle-assignments/routes.ts:128

### admin/drivers

Routes: 22

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/drivers` | yes | `drivers:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:317
POST | `/api/v1/admin/drivers` | yes | `drivers:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:388
GET | `/api/v1/admin/drivers/:driverId` | yes | `drivers:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:374
PATCH | `/api/v1/admin/drivers/:driverId` | yes | `drivers:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:439
POST | `/api/v1/admin/drivers/:driverId/activate` | yes | `drivers:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:495
POST | `/api/v1/admin/drivers/:driverId/archive` | yes | `drivers:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:513
POST | `/api/v1/admin/drivers/:driverId/deactivate` | yes | `drivers:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:504
GET | `/api/v1/admin/drivers/:driverId/documents` | yes | `driver-documents:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:644
POST | `/api/v1/admin/drivers/:driverId/documents` | yes | `driver-documents:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:662
GET | `/api/v1/admin/drivers/:driverId/documents/:documentId` | yes | `driver-documents:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:651
PATCH | `/api/v1/admin/drivers/:driverId/documents/:documentId` | yes | `driver-documents:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:688
POST | `/api/v1/admin/drivers/:driverId/documents/:documentId/archive` | yes | `driver-documents:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:716
GET | `/api/v1/admin/drivers/:driverId/licenses` | yes | `driver-licenses:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:564
POST | `/api/v1/admin/drivers/:driverId/licenses` | yes | `driver-licenses:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:582
GET | `/api/v1/admin/drivers/:driverId/licenses/:licenseId` | yes | `driver-licenses:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:571
PATCH | `/api/v1/admin/drivers/:driverId/licenses/:licenseId` | yes | `driver-licenses:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:605
POST | `/api/v1/admin/drivers/:driverId/licenses/:licenseId/archive` | yes | `driver-licenses:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:630
GET | `/api/v1/admin/drivers/:driverId/skills` | yes | `driver-skills:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:522
POST | `/api/v1/admin/drivers/:driverId/skills` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:529
DELETE | `/api/v1/admin/drivers/:driverId/skills/:driverSkillId` | yes | `driver-skills:manage` | guarded | apps/api/src/modules/admin/drivers/routes.ts:550
GET | `/api/v1/admin/drivers/documents/expiring` | yes | `driver-documents:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:279
GET | `/api/v1/admin/drivers/licenses/expiring` | yes | `driver-licenses:read` | guarded | apps/api/src/modules/admin/drivers/routes.ts:241

### admin/escalation-policies

Routes: 15

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/escalation-events` | yes | `escalation-events:read` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:249
POST | `/api/v1/admin/escalation-events` | yes | `escalation-events:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:270
GET | `/api/v1/admin/escalation-events/:eventId` | yes | `escalation-events:read` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:297
POST | `/api/v1/admin/escalation-events/:eventId/acknowledge` | yes | `escalation-events:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:305
POST | `/api/v1/admin/escalation-events/:eventId/resolve` | yes | `escalation-events:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:326
GET | `/api/v1/admin/escalation-policies` | yes | `escalation-policies:read` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:78
POST | `/api/v1/admin/escalation-policies` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:98
GET | `/api/v1/admin/escalation-policies/:policyId` | yes | `escalation-policies:read` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:119
PATCH | `/api/v1/admin/escalation-policies/:policyId` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:127
POST | `/api/v1/admin/escalation-policies/:policyId/activate` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:152
POST | `/api/v1/admin/escalation-policies/:policyId/deactivate` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:162
POST | `/api/v1/admin/escalation-policies/:policyId/steps` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:172
DELETE | `/api/v1/admin/escalation-policies/:policyId/steps/:stepId` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:217
PATCH | `/api/v1/admin/escalation-policies/:policyId/steps/:stepId` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:194
POST | `/api/v1/admin/escalation-policies/:policyId/steps/reorder` | yes | `escalation-policies:manage` | guarded | apps/api/src/modules/admin/escalation-policies/routes.ts:228

### admin/fleet-readiness

Routes: 1

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/fleet-readiness/evaluate` | yes | `fleet-readiness:read` | guarded | apps/api/src/modules/admin/fleet-readiness/routes.ts:46

### admin/fleet-readiness-profiles

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/fleet-readiness-profiles` | yes | `fleet-readiness:read` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:55
POST | `/api/v1/admin/fleet-readiness-profiles` | yes | `fleet-readiness:manage` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:88
GET | `/api/v1/admin/fleet-readiness-profiles/:readinessProfileId` | yes | `fleet-readiness:read` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:81
PATCH | `/api/v1/admin/fleet-readiness-profiles/:readinessProfileId` | yes | `fleet-readiness:manage` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:114
POST | `/api/v1/admin/fleet-readiness-profiles/:readinessProfileId/activate` | yes | `fleet-readiness:manage` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:137
POST | `/api/v1/admin/fleet-readiness-profiles/:readinessProfileId/deactivate` | yes | `fleet-readiness:manage` | guarded | apps/api/src/modules/admin/fleet-readiness-profiles/routes.ts:146

### admin/fuel

Routes: 40

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/fuel-cards` | yes | `fuel-cards:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:437
POST | `/api/v1/admin/fuel-cards` | yes | `fuel-cards:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:452
GET | `/api/v1/admin/fuel-cards/:id` | yes | `fuel-cards:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:461
PATCH | `/api/v1/admin/fuel-cards/:id` | yes | `fuel-cards:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:469
POST | `/api/v1/admin/fuel-cards/:id/${action}` | yes | `fuel-cards:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:482
GET | `/api/v1/admin/fuel-entries` | yes | `fuel-entries:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:704
POST | `/api/v1/admin/fuel-entries` | yes | `fuel-entries:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:719
GET | `/api/v1/admin/fuel-entries/:id` | yes | `fuel-entries:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:728
PATCH | `/api/v1/admin/fuel-entries/:id` | yes | `fuel-entries:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:736
POST | `/api/v1/admin/fuel-entries/:id/${action}` | yes | `fuel-entries:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:749
GET | `/api/v1/admin/fuel-policies` | yes | `fuel-policies:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:560
POST | `/api/v1/admin/fuel-policies` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:575
GET | `/api/v1/admin/fuel-policies/:id` | yes | `fuel-policies:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:583
PATCH | `/api/v1/admin/fuel-policies/:id` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:591
POST | `/api/v1/admin/fuel-policies/:id/${action}` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:603
POST | `/api/v1/admin/fuel-policies/:id/rules` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:614
DELETE | `/api/v1/admin/fuel-policies/:id/rules/:ruleId` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:638
PATCH | `/api/v1/admin/fuel-policies/:id/rules/:ruleId` | yes | `fuel-policies:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:626
GET | `/api/v1/admin/fuel-requests` | yes | `fuel-requests:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:648
POST | `/api/v1/admin/fuel-requests` | yes | `fuel-requests:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:663
GET | `/api/v1/admin/fuel-requests/:id` | yes | `fuel-requests:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:672
PATCH | `/api/v1/admin/fuel-requests/:id` | yes | `fuel-requests:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:680
POST | `/api/v1/admin/fuel-requests/:id/${action}` | yes | `fuel-requests:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:693
GET | `/api/v1/admin/fuel-tanks` | yes | `fuel-tanks:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:493
POST | `/api/v1/admin/fuel-tanks` | yes | `fuel-tanks:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:508
GET | `/api/v1/admin/fuel-tanks/:id` | yes | `fuel-tanks:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:517
PATCH | `/api/v1/admin/fuel-tanks/:id` | yes | `fuel-tanks:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:525
POST | `/api/v1/admin/fuel-tanks/:id/${action}` | yes | `fuel-tanks:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:549
POST | `/api/v1/admin/fuel-tanks/:id/update-level` | yes | `fuel-tanks:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:537
GET | `/api/v1/admin/fuel-types` | yes | `fuel-types:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:327
POST | `/api/v1/admin/fuel-types` | yes | `fuel-types:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:342
GET | `/api/v1/admin/fuel-types/:id` | yes | `fuel-types:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:350
PATCH | `/api/v1/admin/fuel-types/:id` | yes | `fuel-types:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:358
POST | `/api/v1/admin/fuel-types/:id/${action}` | yes | `fuel-types:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:370
GET | `/api/v1/admin/fuel-vendor-profiles` | yes | `fuel-vendor-profiles:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:381
POST | `/api/v1/admin/fuel-vendor-profiles` | yes | `fuel-vendor-profiles:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:396
GET | `/api/v1/admin/fuel-vendor-profiles/:id` | yes | `fuel-vendor-profiles:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:405
PATCH | `/api/v1/admin/fuel-vendor-profiles/:id` | yes | `fuel-vendor-profiles:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:413
POST | `/api/v1/admin/fuel-vendor-profiles/:id/${action}` | yes | `fuel-vendor-profiles:manage` | guarded | apps/api/src/modules/admin/fuel/routes.ts:426
GET | `/api/v1/admin/fuel/alerts` | yes | `fuel-alerts:read` | guarded | apps/api/src/modules/admin/fuel/routes.ts:311

### admin/geofences

Routes: 13

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/geofence-events` | yes | `geofence-events:read` | guarded | apps/api/src/modules/admin/geofences/routes.ts:676
GET | `/api/v1/admin/geofence-events/:eventId` | yes | `geofence-events:read` | guarded | apps/api/src/modules/admin/geofences/routes.ts:744
GET | `/api/v1/admin/geofences` | yes | `geofences:read` | guarded | apps/api/src/modules/admin/geofences/routes.ts:196
POST | `/api/v1/admin/geofences` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:264
GET | `/api/v1/admin/geofences/:geofenceId` | yes | `geofences:read` | guarded | apps/api/src/modules/admin/geofences/routes.ts:249
PATCH | `/api/v1/admin/geofences/:geofenceId` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:304
POST | `/api/v1/admin/geofences/:geofenceId/activate` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:349
POST | `/api/v1/admin/geofences/:geofenceId/deactivate` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:367
POST | `/api/v1/admin/geofences/:geofenceId/points` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:385
DELETE | `/api/v1/admin/geofences/:geofenceId/points/:pointId` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:439
PATCH | `/api/v1/admin/geofences/:geofenceId/points/:pointId` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:409
POST | `/api/v1/admin/geofences/:geofenceId/points/reorder` | yes | `geofences:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:458
POST | `/api/v1/admin/geofences/evaluate` | yes | `geofence-evaluation:manage` | guarded | apps/api/src/modules/admin/geofences/routes.ts:488

### admin/maintenance

Routes: 41

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/inspection-checklists` | yes | `inspection-checklists:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:495
POST | `/api/v1/admin/inspection-checklists` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:515
GET | `/api/v1/admin/inspection-checklists/:id` | yes | `inspection-checklists:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:525
PATCH | `/api/v1/admin/inspection-checklists/:id` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:533
POST | `/api/v1/admin/inspection-checklists/:id/${action}` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:549
POST | `/api/v1/admin/inspection-checklists/:id/items` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:560
DELETE | `/api/v1/admin/inspection-checklists/:id/items/:itemId` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:587
PATCH | `/api/v1/admin/inspection-checklists/:id/items/:itemId` | yes | `inspection-checklists:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:573
GET | `/api/v1/admin/maintenance-categories` | yes | `maintenance-categories:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:336
POST | `/api/v1/admin/maintenance-categories` | yes | `maintenance-categories:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:356
GET | `/api/v1/admin/maintenance-categories/:id` | yes | `maintenance-categories:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:366
PATCH | `/api/v1/admin/maintenance-categories/:id` | yes | `maintenance-categories:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:374
POST | `/api/v1/admin/maintenance-categories/:id/${action}` | yes | `maintenance-categories:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:389
GET | `/api/v1/admin/maintenance-requests` | yes | `maintenance-requests:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:716
POST | `/api/v1/admin/maintenance-requests` | yes | `maintenance-requests:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:731
GET | `/api/v1/admin/maintenance-requests/:id` | yes | `maintenance-requests:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:741
PATCH | `/api/v1/admin/maintenance-requests/:id` | yes | `maintenance-requests:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:749
POST | `/api/v1/admin/maintenance-requests/:id/cancel` | yes | `maintenance-requests:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:761
GET | `/api/v1/admin/maintenance-service-tasks` | yes | `maintenance-service-tasks:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:400
POST | `/api/v1/admin/maintenance-service-tasks` | yes | `maintenance-service-tasks:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:421
GET | `/api/v1/admin/maintenance-service-tasks/:id` | yes | `maintenance-service-tasks:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:447
PATCH | `/api/v1/admin/maintenance-service-tasks/:id` | yes | `maintenance-service-tasks:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:455
POST | `/api/v1/admin/maintenance-service-tasks/:id/${action}` | yes | `maintenance-service-tasks:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:484
GET | `/api/v1/admin/maintenance-work-orders` | yes | `maintenance-work-orders:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:771
POST | `/api/v1/admin/maintenance-work-orders` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:786
GET | `/api/v1/admin/maintenance-work-orders/:id` | yes | `maintenance-work-orders:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:796
PATCH | `/api/v1/admin/maintenance-work-orders/:id` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:804
POST | `/api/v1/admin/maintenance-work-orders/:id/cancel` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:816
POST | `/api/v1/admin/maintenance-work-orders/:id/tasks` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:826
DELETE | `/api/v1/admin/maintenance-work-orders/:id/tasks/:taskId` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:850
PATCH | `/api/v1/admin/maintenance-work-orders/:id/tasks/:taskId` | yes | `maintenance-work-orders:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:838
GET | `/api/v1/admin/maintenance/due` | yes | `maintenance-due:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:597
GET | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans` | yes | `vehicle-maintenance-plans:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:630
POST | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:638
GET | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId` | yes | `vehicle-maintenance-plans:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:650
PATCH | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:659
POST | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/${action}` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:671
POST | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:682
DELETE | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:706
PATCH | `/api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId` | yes | `vehicle-maintenance-plans:manage` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:694
GET | `/api/v1/admin/vehicles/:vehicleId/maintenance/due` | yes | `maintenance-due:read` | guarded | apps/api/src/modules/admin/maintenance/routes.ts:613

### admin/navigation

Routes: 18

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/feature-flags` | yes | `feature-flags:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:264
POST | `/api/v1/admin/feature-flags` | yes | `feature-flags:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:279
GET | `/api/v1/admin/feature-flags/:id` | yes | `feature-flags:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:287
PATCH | `/api/v1/admin/feature-flags/:id` | yes | `feature-flags:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:295
GET | `/api/v1/admin/navigation/menu-groups` | yes | `navigation:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:110
POST | `/api/v1/admin/navigation/menu-groups` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:125
GET | `/api/v1/admin/navigation/menu-groups/:id` | yes | `navigation:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:133
PATCH | `/api/v1/admin/navigation/menu-groups/:id` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:141
GET | `/api/v1/admin/navigation/menu-items` | yes | `navigation:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:152
POST | `/api/v1/admin/navigation/menu-items` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:167
GET | `/api/v1/admin/navigation/menu-items/:id` | yes | `navigation:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:186
PATCH | `/api/v1/admin/navigation/menu-items/:id` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:194
POST | `/api/v1/admin/navigation/menu-items/:id/${action}` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:207
PATCH | `/api/v1/admin/navigation/menu-items/reorder` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:176
GET | `/api/v1/admin/navigation/pages` | yes | `navigation:read` | guarded | apps/api/src/modules/admin/navigation/routes.ts:218
POST | `/api/v1/admin/navigation/pages` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:233
PATCH | `/api/v1/admin/navigation/pages/:id` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:241
POST | `/api/v1/admin/navigation/pages/:id/${action}` | yes | `navigation:manage` | guarded | apps/api/src/modules/admin/navigation/routes.ts:253

### admin/notification-deliveries

Routes: 7

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/notification-deliveries` | yes | `notification-deliveries:read` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:30
GET | `/api/v1/admin/notification-deliveries/:deliveryId` | yes | `notification-deliveries:read` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:63
POST | `/api/v1/admin/notification-deliveries/:deliveryId/cancel` | yes | `notification-retries:manage` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:101
POST | `/api/v1/admin/notification-deliveries/:deliveryId/mark-failed` | yes | `notification-deliveries:manage` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:91
POST | `/api/v1/admin/notification-deliveries/:deliveryId/mark-sent` | yes | `notification-deliveries:manage` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:81
POST | `/api/v1/admin/notification-deliveries/:deliveryId/retry` | yes | `notification-retries:manage` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:71
POST | `/api/v1/admin/notification-deliveries/retry-due` | yes | `notification-retries:manage` | guarded | apps/api/src/modules/admin/notification-deliveries/routes.ts:52

### admin/notification-providers

Routes: 7

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/notification-providers` | yes | `notification-providers:read` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:71
POST | `/api/v1/admin/notification-providers` | yes | `notification-providers:manage` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:94
GET | `/api/v1/admin/notification-providers/:providerId` | yes | `notification-providers:read` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:118
PATCH | `/api/v1/admin/notification-providers/:providerId` | yes | `notification-providers:manage` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:126
POST | `/api/v1/admin/notification-providers/:providerId/activate` | yes | `notification-providers:manage` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:152
POST | `/api/v1/admin/notification-providers/:providerId/deactivate` | yes | `notification-providers:manage` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:162
POST | `/api/v1/admin/notification-providers/:providerId/test-send` | yes | `notification-providers:manage` | guarded | apps/api/src/modules/admin/notification-providers/routes.ts:172

### admin/notification-templates

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/notification-templates` | yes | `notification-templates:read` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:50
POST | `/api/v1/admin/notification-templates` | yes | `notification-templates:manage` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:71
GET | `/api/v1/admin/notification-templates/:templateId` | yes | `notification-templates:read` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:99
PATCH | `/api/v1/admin/notification-templates/:templateId` | yes | `notification-templates:manage` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:107
POST | `/api/v1/admin/notification-templates/:templateId/activate` | yes | `notification-templates:manage` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:139
POST | `/api/v1/admin/notification-templates/:templateId/deactivate` | yes | `notification-templates:manage` | guarded | apps/api/src/modules/admin/notification-templates/routes.ts:149

### admin/organization-invitations

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/organization-invitations` | yes | `organization-invitations:read` | guarded | apps/api/src/modules/admin/organization-invitations/routes.ts:59
POST | `/api/v1/admin/organization-invitations` | yes | `organization-invitations:manage` | guarded | apps/api/src/modules/admin/organization-invitations/routes.ts:110
POST | `/api/v1/admin/organization-invitations/:invitationId/cancel` | yes | `organization-invitations:manage` | guarded | apps/api/src/modules/admin/organization-invitations/routes.ts:270
POST | `/api/v1/admin/organization-invitations/:invitationId/expire` | yes | `organization-invitations:manage` | guarded | apps/api/src/modules/admin/organization-invitations/routes.ts:304
POST | `/api/v1/admin/organization-invitations/:invitationId/resend` | yes | `organization-invitations:manage` | guarded | apps/api/src/modules/admin/organization-invitations/routes.ts:197
POST | `/api/v1/admin/organization-invitations/accept` | yes |  | authenticated | apps/api/src/modules/admin/organization-invitations/routes.ts:338

### admin/organizations

Routes: 14

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/organizations` | yes | `organizations:read` | guarded | apps/api/src/modules/admin/organizations/routes.ts:101
POST | `/api/v1/admin/organizations` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:198
GET | `/api/v1/admin/organizations/:organizationId` | yes | `organizations:read` | guarded | apps/api/src/modules/admin/organizations/routes.ts:157
PATCH | `/api/v1/admin/organizations/:organizationId` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:246
POST | `/api/v1/admin/organizations/:organizationId/activate` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:288
POST | `/api/v1/admin/organizations/:organizationId/deactivate` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:313
GET | `/api/v1/admin/organizations/:organizationId/settings` | yes | `organizations:read` | guarded | apps/api/src/modules/admin/organizations/routes.ts:511
DELETE | `/api/v1/admin/organizations/:organizationId/settings/:key` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:619
GET | `/api/v1/admin/organizations/:organizationId/settings/:key` | yes | `organizations:read` | guarded | apps/api/src/modules/admin/organizations/routes.ts:545
PUT | `/api/v1/admin/organizations/:organizationId/settings/:key` | yes | `organizations:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:571
GET | `/api/v1/admin/organizations/:organizationId/users` | yes | `organization-users:read` | guarded | apps/api/src/modules/admin/organizations/routes.ts:338
POST | `/api/v1/admin/organizations/:organizationId/users` | yes | `organization-users:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:375
DELETE | `/api/v1/admin/organizations/:organizationId/users/:membershipId` | yes | `organization-users:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:472
PATCH | `/api/v1/admin/organizations/:organizationId/users/:membershipId` | yes | `organization-users:manage` | guarded | apps/api/src/modules/admin/organizations/routes.ts:423

### admin/permissions

Routes: 2

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/permissions` | yes | `iam:permissions:read` | guarded | apps/api/src/modules/admin/permissions/routes.ts:12
GET | `/api/v1/admin/permissions/:permissionId` | yes | `iam:permissions:read` | guarded | apps/api/src/modules/admin/permissions/routes.ts:52

### admin/planned-trips

Routes: 12

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/planned-trips` | yes | `planned-trips:read` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:384
POST | `/api/v1/admin/planned-trips` | yes | `planned-trips:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:494
GET | `/api/v1/admin/planned-trips/:plannedTripId` | yes | `planned-trips:read` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:481
PATCH | `/api/v1/admin/planned-trips/:plannedTripId` | yes | `planned-trips:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:575
POST | `/api/v1/admin/planned-trips/:plannedTripId/assign` | yes | `planned-trips:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:763
POST | `/api/v1/admin/planned-trips/:plannedTripId/cancel` | yes | `planned-trips:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:713
POST | `/api/v1/admin/planned-trips/:plannedTripId/status` | yes | `dispatch-status:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:652
POST | `/api/v1/admin/planned-trips/:plannedTripId/stops` | yes | `planned-trip-stops:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:877
DELETE | `/api/v1/admin/planned-trips/:plannedTripId/stops/:stopId` | yes | `planned-trip-stops:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:963
PATCH | `/api/v1/admin/planned-trips/:plannedTripId/stops/:stopId` | yes | `planned-trip-stops:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:918
POST | `/api/v1/admin/planned-trips/:plannedTripId/stops/reorder` | yes | `planned-trip-stops:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:989
POST | `/api/v1/admin/planned-trips/:plannedTripId/unassign` | yes | `planned-trips:manage` | guarded | apps/api/src/modules/admin/planned-trips/routes.ts:827

### admin/reports-dashboard

Routes: 19

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/dashboard/summary` | yes | `dashboard:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:345
GET | `/api/v1/admin/dashboard/widgets` | yes | `dashboard:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:309
POST | `/api/v1/admin/dashboard/widgets` | yes | `dashboard:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:324
PATCH | `/api/v1/admin/dashboard/widgets/:id` | yes | `dashboard:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:333
GET | `/api/v1/admin/report-categories` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:138
POST | `/api/v1/admin/report-categories` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:153
GET | `/api/v1/admin/report-categories/:id` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:161
PATCH | `/api/v1/admin/report-categories/:id` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:169
GET | `/api/v1/admin/report-definitions` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:180
POST | `/api/v1/admin/report-definitions` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:195
GET | `/api/v1/admin/report-definitions/:id` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:204
PATCH | `/api/v1/admin/report-definitions/:id` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:212
GET | `/api/v1/admin/report-export-jobs` | yes | `report-runs:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:284
POST | `/api/v1/admin/report-export-jobs` | yes | `report-exports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:299
GET | `/api/v1/admin/report-filter-presets` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:224
POST | `/api/v1/admin/report-filter-presets` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:239
PATCH | `/api/v1/admin/report-filter-presets/:id` | yes | `reports:manage` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:248
GET | `/api/v1/admin/report-runs` | yes | `report-runs:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:260
POST | `/api/v1/admin/report-runs` | yes | `reports:read` | guarded | apps/api/src/modules/admin/reports-dashboard/routes.ts:275

### admin/roles

Routes: 7

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/roles` | yes | `iam:roles:read` | guarded | apps/api/src/modules/admin/roles/routes.ts:129
POST | `/api/v1/admin/roles` | yes | `iam:roles:manage` | guarded | apps/api/src/modules/admin/roles/routes.ts:185
DELETE | `/api/v1/admin/roles/:roleId` | yes | `iam:roles:manage` | guarded | apps/api/src/modules/admin/roles/routes.ts:300
GET | `/api/v1/admin/roles/:roleId` | yes | `iam:roles:read` | guarded | apps/api/src/modules/admin/roles/routes.ts:170
PATCH | `/api/v1/admin/roles/:roleId` | yes | `iam:roles:manage` | guarded | apps/api/src/modules/admin/roles/routes.ts:252
POST | `/api/v1/admin/roles/:roleId/permissions` | yes | `iam:roles:manage` | guarded | apps/api/src/modules/admin/roles/routes.ts:330
DELETE | `/api/v1/admin/roles/:roleId/permissions/:permissionCode` | yes | `iam:roles:manage` | guarded | apps/api/src/modules/admin/roles/routes.ts:388

### admin/service-areas

Routes: 8

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/service-areas` | yes | `service-areas:read` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:55
POST | `/api/v1/admin/service-areas` | yes | `service-areas:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:128
GET | `/api/v1/admin/service-areas/:serviceAreaId` | yes | `service-areas:read` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:109
PATCH | `/api/v1/admin/service-areas/:serviceAreaId` | yes | `service-areas:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:175
POST | `/api/v1/admin/service-areas/:serviceAreaId/activate` | yes | `service-areas:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:209
POST | `/api/v1/admin/service-areas/:serviceAreaId/deactivate` | yes | `service-areas:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:236
POST | `/api/v1/admin/service-areas/:serviceAreaId/locations` | yes | `service-area-locations:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:263
DELETE | `/api/v1/admin/service-areas/:serviceAreaId/locations/:customerLocationId` | yes | `service-area-locations:manage` | guarded | apps/api/src/modules/admin/service-areas/routes.ts:318

### admin/service-route-groups

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/service-route-groups` | yes | `service-route-groups:read` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:68
POST | `/api/v1/admin/service-route-groups` | yes | `service-route-groups:manage` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:155
GET | `/api/v1/admin/service-route-groups/:serviceRouteGroupId` | yes | `service-route-groups:read` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:125
PATCH | `/api/v1/admin/service-route-groups/:serviceRouteGroupId` | yes | `service-route-groups:manage` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:217
POST | `/api/v1/admin/service-route-groups/:serviceRouteGroupId/activate` | yes | `service-route-groups:manage` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:277
POST | `/api/v1/admin/service-route-groups/:serviceRouteGroupId/deactivate` | yes | `service-route-groups:manage` | guarded | apps/api/src/modules/admin/service-route-groups/routes.ts:304

### admin/service-route-templates

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/service-route-templates` | yes | `service-route-templates:read` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:93
POST | `/api/v1/admin/service-route-templates` | yes | `service-route-templates:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:170
GET | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId` | yes | `service-route-templates:read` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:151
PATCH | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId` | yes | `service-route-templates:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:224
POST | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/activate` | yes | `service-route-templates:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:266
POST | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/deactivate` | yes | `service-route-templates:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:293
POST | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/stops` | yes | `service-route-template-stops:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:320
DELETE | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/stops/:stopId` | yes | `service-route-template-stops:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:425
PATCH | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/stops/:stopId` | yes | `service-route-template-stops:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:370
POST | `/api/v1/admin/service-route-templates/:serviceRouteTemplateId/stops/reorder` | yes | `service-route-template-stops:manage` | guarded | apps/api/src/modules/admin/service-route-templates/routes.ts:471

### admin/service-routes

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/service-routes` | yes | `service-routes:read` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:89
POST | `/api/v1/admin/service-routes` | yes | `service-routes:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:167
GET | `/api/v1/admin/service-routes/:serviceRouteId` | yes | `service-routes:read` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:148
PATCH | `/api/v1/admin/service-routes/:serviceRouteId` | yes | `service-routes:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:216
POST | `/api/v1/admin/service-routes/:serviceRouteId/activate` | yes | `service-routes:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:252
POST | `/api/v1/admin/service-routes/:serviceRouteId/deactivate` | yes | `service-routes:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:279
POST | `/api/v1/admin/service-routes/:serviceRouteId/stops` | yes | `service-stops:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:306
DELETE | `/api/v1/admin/service-routes/:serviceRouteId/stops/:stopId` | yes | `service-stops:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:413
PATCH | `/api/v1/admin/service-routes/:serviceRouteId/stops/:stopId` | yes | `service-stops:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:357
POST | `/api/v1/admin/service-routes/:serviceRouteId/stops/reorder` | yes | `service-stops:manage` | guarded | apps/api/src/modules/admin/service-routes/routes.ts:461

### admin/sessions

Routes: 3

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/sessions` | yes | `iam:sessions:read` | guarded | apps/api/src/modules/admin/sessions/routes.ts:28
POST | `/api/v1/admin/sessions/:sessionId/revoke` | yes | `iam:sessions:manage` | guarded | apps/api/src/modules/admin/sessions/routes.ts:69
POST | `/api/v1/admin/sessions/revoke-all` | yes | `iam:sessions:manage` | guarded | apps/api/src/modules/admin/sessions/routes.ts:112

### admin/settings

Routes: 4

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/settings` | yes | `settings:read` | guarded | apps/api/src/modules/admin/settings/routes.ts:34
DELETE | `/api/v1/admin/settings/:key` | yes | `settings:manage` | guarded | apps/api/src/modules/admin/settings/routes.ts:141
GET | `/api/v1/admin/settings/:key` | yes | `settings:read` | guarded | apps/api/src/modules/admin/settings/routes.ts:71
PUT | `/api/v1/admin/settings/:key` | yes | `settings:manage` | guarded | apps/api/src/modules/admin/settings/routes.ts:92

### admin/storage

Routes: 27

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/attachments` | yes | `file-attachments:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:357
POST | `/api/v1/admin/attachments` | yes | `file-attachments:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:372
POST | `/api/v1/admin/attachments/:id/archive` | yes | `file-attachments:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:381
GET | `/api/v1/admin/document-retention-policies` | yes | `document-retention:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:391
POST | `/api/v1/admin/document-retention-policies` | yes | `document-retention:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:406
GET | `/api/v1/admin/document-retention-policies/:id` | yes | `document-retention:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:414
PATCH | `/api/v1/admin/document-retention-policies/:id` | yes | `document-retention:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:422
POST | `/api/v1/admin/document-retention-policies/:id/${action}` | yes | `document-retention:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:434
GET | `/api/v1/admin/files` | yes | `files:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:256
POST | `/api/v1/admin/files` | yes | `files:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:271
GET | `/api/v1/admin/files/:id` | yes | `files:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:287
PATCH | `/api/v1/admin/files/:id` | yes | `files:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:295
POST | `/api/v1/admin/files/:id/${action}` | yes | `files:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:308
GET | `/api/v1/admin/files/:id/access-logs` | yes | `file-access-logs:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:330
POST | `/api/v1/admin/files/:id/signed-download-url` | yes | `files:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:339
POST | `/api/v1/admin/files/:id/versions` | yes | `files:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:319
POST | `/api/v1/admin/files/signed-upload-url` | yes | `files:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:280
GET | `/api/v1/admin/storage/buckets` | yes | `storage-buckets:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:199
POST | `/api/v1/admin/storage/buckets` | yes | `storage-buckets:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:214
GET | `/api/v1/admin/storage/buckets/:id` | yes | `storage-buckets:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:225
PATCH | `/api/v1/admin/storage/buckets/:id` | yes | `storage-buckets:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:233
POST | `/api/v1/admin/storage/buckets/:id/${action}` | yes | `storage-buckets:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:245
GET | `/api/v1/admin/storage/providers` | yes | `storage-providers:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:145
POST | `/api/v1/admin/storage/providers` | yes | `storage-providers:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:160
GET | `/api/v1/admin/storage/providers/:id` | yes | `storage-providers:read` | guarded | apps/api/src/modules/admin/storage/routes.ts:168
PATCH | `/api/v1/admin/storage/providers/:id` | yes | `storage-providers:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:176
POST | `/api/v1/admin/storage/providers/:id/${action}` | yes | `storage-providers:manage` | guarded | apps/api/src/modules/admin/storage/routes.ts:188

### admin/tracking

Routes: 4

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking/health` | yes | `tracking-health:read` | guarded | apps/api/src/modules/admin/tracking/routes.ts:295
GET | `/api/v1/admin/tracking/vehicles/:vehicleId/history` | yes | `vehicle-telemetry-events:read` | guarded | apps/api/src/modules/admin/tracking/routes.ts:231
GET | `/api/v1/admin/tracking/vehicles/:vehicleId/latest` | yes | `vehicle-positions:read` | guarded | apps/api/src/modules/admin/tracking/routes.ts:166
GET | `/api/v1/admin/tracking/vehicles/latest` | yes | `vehicle-positions:read` | guarded | apps/api/src/modules/admin/tracking/routes.ts:46

### admin/tracking-alert-rules

Routes: 13

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking-alert-events` | yes | `tracking-alert-events:read` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:340
POST | `/api/v1/admin/tracking-alert-events` | yes | `tracking-alert-events:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:397
GET | `/api/v1/admin/tracking-alert-events/:alertEventId` | yes | `tracking-alert-events:read` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:386
POST | `/api/v1/admin/tracking-alert-events/:alertEventId/acknowledge` | yes | `tracking-alert-events:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:468
POST | `/api/v1/admin/tracking-alert-events/:alertEventId/deliver` | yes | `notification-deliveries:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:526
POST | `/api/v1/admin/tracking-alert-events/:alertEventId/escalate` | yes | `escalation-events:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:564
POST | `/api/v1/admin/tracking-alert-events/:alertEventId/resolve` | yes | `tracking-alert-events:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:497
GET | `/api/v1/admin/tracking-alert-rules` | yes | `tracking-alert-rules:read` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:111
POST | `/api/v1/admin/tracking-alert-rules` | yes | `tracking-alert-rules:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:169
GET | `/api/v1/admin/tracking-alert-rules/:alertRuleId` | yes | `tracking-alert-rules:read` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:158
PATCH | `/api/v1/admin/tracking-alert-rules/:alertRuleId` | yes | `tracking-alert-rules:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:226
POST | `/api/v1/admin/tracking-alert-rules/:alertRuleId/activate` | yes | `tracking-alert-rules:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:290
POST | `/api/v1/admin/tracking-alert-rules/:alertRuleId/deactivate` | yes | `tracking-alert-rules:manage` | guarded | apps/api/src/modules/admin/tracking-alert-rules/routes.ts:315

### admin/tracking-device-mappings

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking/device-mappings` | yes | `tracking-device-mappings:read` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:52
POST | `/api/v1/admin/tracking/device-mappings` | yes | `tracking-device-mappings:manage` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:108
GET | `/api/v1/admin/tracking/device-mappings/:mappingId` | yes | `tracking-device-mappings:read` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:97
PATCH | `/api/v1/admin/tracking/device-mappings/:mappingId` | yes | `tracking-device-mappings:manage` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:179
POST | `/api/v1/admin/tracking/device-mappings/:mappingId/deactivate` | yes | `tracking-device-mappings:manage` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:233
POST | `/api/v1/admin/tracking/device-mappings/:mappingId/unmap` | yes | `tracking-device-mappings:manage` | guarded | apps/api/src/modules/admin/tracking-device-mappings/routes.ts:257

### admin/tracking-evaluations

Routes: 3

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
POST | `/api/v1/admin/tracking/evaluate` | yes | `tracking-evaluation:manage` | guarded | apps/api/src/modules/admin/tracking-evaluations/routes.ts:132
GET | `/api/v1/admin/tracking/evaluation-runs` | yes | `tracking-evaluation:read` | guarded | apps/api/src/modules/admin/tracking-evaluations/routes.ts:420
GET | `/api/v1/admin/tracking/evaluation-runs/:runId` | yes | `tracking-evaluation:read` | guarded | apps/api/src/modules/admin/tracking-evaluations/routes.ts:467

### admin/tracking-external-devices

Routes: 3

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking/external-devices` | yes | `tracking-external-devices:read` | guarded | apps/api/src/modules/admin/tracking-external-devices/routes.ts:48
POST | `/api/v1/admin/tracking/external-devices` | yes | `tracking-external-devices:manage` | guarded | apps/api/src/modules/admin/tracking-external-devices/routes.ts:114
GET | `/api/v1/admin/tracking/external-devices/:externalDeviceId` | yes | `tracking-external-devices:read` | guarded | apps/api/src/modules/admin/tracking-external-devices/routes.ts:102

### admin/tracking-notifications

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking-notification-events` | yes | `tracking-notification-events:read` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:389
GET | `/api/v1/admin/tracking-notification-events/:notificationEventId` | yes | `tracking-notification-events:read` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:435
POST | `/api/v1/admin/tracking-notification-events/:notificationEventId/acknowledge` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:453
POST | `/api/v1/admin/tracking-notification-events/:notificationEventId/resolve` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:491
GET | `/api/v1/admin/tracking-notification-rules` | yes | `tracking-notification-rules:read` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:154
POST | `/api/v1/admin/tracking-notification-rules` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:216
GET | `/api/v1/admin/tracking-notification-rules/:notificationRuleId` | yes | `tracking-notification-rules:read` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:198
PATCH | `/api/v1/admin/tracking-notification-rules/:notificationRuleId` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:266
POST | `/api/v1/admin/tracking-notification-rules/:notificationRuleId/activate` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:329
POST | `/api/v1/admin/tracking-notification-rules/:notificationRuleId/deactivate` | yes | `tracking-notification-rules:manage` | guarded | apps/api/src/modules/admin/tracking-notifications/routes.ts:359

### admin/tracking-provider-sync

Routes: 8

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
POST | `/api/v1/admin/tracking-providers/:providerId/sync-now` | yes | `tracking-sync:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:430
GET | `/api/v1/admin/tracking-providers/:providerId/sync-runs` | yes | `tracking-provider-sync:read` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:224
POST | `/api/v1/admin/tracking-providers/:providerId/sync-runs` | yes | `tracking-provider-sync:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:256
GET | `/api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId` | yes | `tracking-provider-sync:read` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:292
POST | `/api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items` | yes | `tracking-provider-sync:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:312
PATCH | `/api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items/:syncItemId` | yes | `tracking-provider-sync:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:349
POST | `/api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/run` | yes | `tracking-sync:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:389
POST | `/api/v1/admin/tracking-providers/:providerId/traccar/pull` | yes | `traccar-pull:manage` | guarded | apps/api/src/modules/admin/tracking-provider-sync/routes.ts:484

### admin/tracking-providers

Routes: 13

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/tracking-providers` | yes | `tracking-providers:read` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:127
POST | `/api/v1/admin/tracking-providers` | yes | `tracking-providers:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:202
GET | `/api/v1/admin/tracking-providers/:providerId` | yes | `tracking-providers:read` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:186
PATCH | `/api/v1/admin/tracking-providers/:providerId` | yes | `tracking-providers:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:250
POST | `/api/v1/admin/tracking-providers/:providerId/activate` | yes | `tracking-providers:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:306
GET | `/api/v1/admin/tracking-providers/:providerId/credentials` | yes | `tracking-providers:read` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:356
POST | `/api/v1/admin/tracking-providers/:providerId/credentials` | yes | `tracking-credentials:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:384
GET | `/api/v1/admin/tracking-providers/:providerId/credentials/:credentialId` | yes | `tracking-providers:read` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:367
PATCH | `/api/v1/admin/tracking-providers/:providerId/credentials/:credentialId` | yes | `tracking-credentials:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:435
POST | `/api/v1/admin/tracking-providers/:providerId/credentials/:credentialId/deactivate` | yes | `tracking-credentials:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:490
POST | `/api/v1/admin/tracking-providers/:providerId/deactivate` | yes | `tracking-providers:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:331
GET | `/api/v1/admin/tracking-providers/:providerId/health` | yes | `tracking-providers:read` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:519
PUT | `/api/v1/admin/tracking-providers/:providerId/health` | yes | `tracking-providers:manage` | guarded | apps/api/src/modules/admin/tracking-providers/routes.ts:533

### admin/trip-templates

Routes: 10

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/trip-templates` | yes | `trip-templates:read` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:166
POST | `/api/v1/admin/trip-templates` | yes | `trip-templates:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:230
GET | `/api/v1/admin/trip-templates/:tripTemplateId` | yes | `trip-templates:read` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:217
PATCH | `/api/v1/admin/trip-templates/:tripTemplateId` | yes | `trip-templates:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:261
POST | `/api/v1/admin/trip-templates/:tripTemplateId/activate` | yes | `trip-templates:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:292
POST | `/api/v1/admin/trip-templates/:tripTemplateId/deactivate` | yes | `trip-templates:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:301
POST | `/api/v1/admin/trip-templates/:tripTemplateId/stops` | yes | `trip-template-stops:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:310
DELETE | `/api/v1/admin/trip-templates/:tripTemplateId/stops/:stopId` | yes | `trip-template-stops:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:406
PATCH | `/api/v1/admin/trip-templates/:tripTemplateId/stops/:stopId` | yes | `trip-template-stops:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:357
POST | `/api/v1/admin/trip-templates/:tripTemplateId/stops/reorder` | yes | `trip-template-stops:manage` | guarded | apps/api/src/modules/admin/trip-templates/routes.ts:441

### admin/trips

Routes: 16

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/trips` | yes | `trips:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:529
POST | `/api/v1/admin/trips` | yes | `trips:manage` | guarded | apps/api/src/modules/admin/trips/routes.ts:680
GET | `/api/v1/admin/trips/:tripId` | yes | `trips:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:665
POST | `/api/v1/admin/trips/:tripId/cancel` | yes | `trips:cancel` | guarded | apps/api/src/modules/admin/trips/routes.ts:1170
POST | `/api/v1/admin/trips/:tripId/complete` | yes | `trips:complete` | guarded | apps/api/src/modules/admin/trips/routes.ts:1127
POST | `/api/v1/admin/trips/:tripId/fail` | yes | `trips:cancel` | guarded | apps/api/src/modules/admin/trips/routes.ts:1213
POST | `/api/v1/admin/trips/:tripId/hold` | yes | `trips:manage` | guarded | apps/api/src/modules/admin/trips/routes.ts:1038
GET | `/api/v1/admin/trips/:tripId/positions` | yes | `trip-replay:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:1373
GET | `/api/v1/admin/trips/:tripId/replay` | yes | `trip-replay:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:1404
POST | `/api/v1/admin/trips/:tripId/resume` | yes | `trips:manage` | guarded | apps/api/src/modules/admin/trips/routes.ts:1083
POST | `/api/v1/admin/trips/:tripId/start` | yes | `trips:start` | guarded | apps/api/src/modules/admin/trips/routes.ts:870
GET | `/api/v1/admin/trips/:tripId/stops` | yes | `trips:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:1256
PATCH | `/api/v1/admin/trips/:tripId/stops/:stopId` | yes | `trip-stops:manage` | guarded | apps/api/src/modules/admin/trips/routes.ts:1263
POST | `/api/v1/admin/trips/:tripId/stops/reorder` | yes | `trip-stops:manage` | guarded | apps/api/src/modules/admin/trips/routes.ts:1319
GET | `/api/v1/admin/trips/:tripId/timeline` | yes | `trip-events:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:1350
GET | `/api/v1/admin/vehicles/:vehicleId/replay` | yes | `vehicle-replay:read` | guarded | apps/api/src/modules/admin/trips/routes.ts:1460

### admin/users

Routes: 9

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/users` | yes | `iam:users:read` | guarded | apps/api/src/modules/admin/users/routes.ts:168
POST | `/api/v1/admin/users` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:246
GET | `/api/v1/admin/users/:userId` | yes | `iam:users:read` | guarded | apps/api/src/modules/admin/users/routes.ts:231
PATCH | `/api/v1/admin/users/:userId` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:309
POST | `/api/v1/admin/users/:userId/activate` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:354
POST | `/api/v1/admin/users/:userId/deactivate` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:385
POST | `/api/v1/admin/users/:userId/reset-password` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:417
POST | `/api/v1/admin/users/:userId/roles` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:463
DELETE | `/api/v1/admin/users/:userId/roles/:roleCode` | yes | `iam:users:manage` | guarded | apps/api/src/modules/admin/users/routes.ts:514

### admin/vehicle-compliance-records

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicles/:vehicleId/compliance-records` | yes | `vehicle-compliance-records:read` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:92
POST | `/api/v1/admin/vehicles/:vehicleId/compliance-records` | yes | `vehicle-compliance-records:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:111
GET | `/api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId` | yes | `vehicle-compliance-records:read` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:100
PATCH | `/api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId` | yes | `vehicle-compliance-records:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:130
POST | `/api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId/archive` | yes | `vehicle-compliance-records:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:165
GET | `/api/v1/admin/vehicles/compliance-records/expiring` | yes | `vehicle-compliance-records:read` | guarded | apps/api/src/modules/admin/vehicle-compliance-records/routes.ts:56

### admin/vehicle-compliance-types

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicle-compliance-types` | yes | `vehicle-compliance-types:read` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:45
POST | `/api/v1/admin/vehicle-compliance-types` | yes | `vehicle-compliance-types:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:78
GET | `/api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId` | yes | `vehicle-compliance-types:read` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:71
PATCH | `/api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId` | yes | `vehicle-compliance-types:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:101
POST | `/api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId/activate` | yes | `vehicle-compliance-types:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:115
POST | `/api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId/deactivate` | yes | `vehicle-compliance-types:manage` | guarded | apps/api/src/modules/admin/vehicle-compliance-types/routes.ts:124

### admin/vehicle-groups

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicle-groups` | yes | `vehicle-groups:read` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:45
POST | `/api/v1/admin/vehicle-groups` | yes | `vehicle-groups:manage` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:113
GET | `/api/v1/admin/vehicle-groups/:vehicleGroupId` | yes | `vehicle-groups:read` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:99
PATCH | `/api/v1/admin/vehicle-groups/:vehicleGroupId` | yes | `vehicle-groups:manage` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:159
POST | `/api/v1/admin/vehicle-groups/:vehicleGroupId/activate` | yes | `vehicle-groups:manage` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:193
POST | `/api/v1/admin/vehicle-groups/:vehicleGroupId/deactivate` | yes | `vehicle-groups:manage` | guarded | apps/api/src/modules/admin/vehicle-groups/routes.ts:220

### admin/vehicle-makes

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicle-makes` | yes | `vehicle-makes:read` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:45
POST | `/api/v1/admin/vehicle-makes` | yes | `vehicle-makes:manage` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:113
GET | `/api/v1/admin/vehicle-makes/:vehicleMakeId` | yes | `vehicle-makes:read` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:99
PATCH | `/api/v1/admin/vehicle-makes/:vehicleMakeId` | yes | `vehicle-makes:manage` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:159
POST | `/api/v1/admin/vehicle-makes/:vehicleMakeId/activate` | yes | `vehicle-makes:manage` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:193
POST | `/api/v1/admin/vehicle-makes/:vehicleMakeId/deactivate` | yes | `vehicle-makes:manage` | guarded | apps/api/src/modules/admin/vehicle-makes/routes.ts:220

### admin/vehicle-models

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicle-models` | yes | `vehicle-models:read` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:49
POST | `/api/v1/admin/vehicle-models` | yes | `vehicle-models:manage` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:118
GET | `/api/v1/admin/vehicle-models/:vehicleModelId` | yes | `vehicle-models:read` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:104
PATCH | `/api/v1/admin/vehicle-models/:vehicleModelId` | yes | `vehicle-models:manage` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:175
POST | `/api/v1/admin/vehicle-models/:vehicleModelId/activate` | yes | `vehicle-models:manage` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:217
POST | `/api/v1/admin/vehicle-models/:vehicleModelId/deactivate` | yes | `vehicle-models:manage` | guarded | apps/api/src/modules/admin/vehicle-models/routes.ts:244

### admin/vehicle-types

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicle-types` | yes | `vehicle-types:read` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:45
POST | `/api/v1/admin/vehicle-types` | yes | `vehicle-types:manage` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:113
GET | `/api/v1/admin/vehicle-types/:vehicleTypeId` | yes | `vehicle-types:read` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:99
PATCH | `/api/v1/admin/vehicle-types/:vehicleTypeId` | yes | `vehicle-types:manage` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:159
POST | `/api/v1/admin/vehicle-types/:vehicleTypeId/activate` | yes | `vehicle-types:manage` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:193
POST | `/api/v1/admin/vehicle-types/:vehicleTypeId/deactivate` | yes | `vehicle-types:manage` | guarded | apps/api/src/modules/admin/vehicle-types/routes.ts:220

### admin/vehicles

Routes: 19

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vehicles` | yes | `vehicles:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:345
POST | `/api/v1/admin/vehicles` | yes | `vehicles:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:447
GET | `/api/v1/admin/vehicles/:vehicleId` | yes | `vehicles:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:427
PATCH | `/api/v1/admin/vehicles/:vehicleId` | yes | `vehicles:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:526
POST | `/api/v1/admin/vehicles/:vehicleId/activate` | yes | `vehicles:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:611
POST | `/api/v1/admin/vehicles/:vehicleId/archive` | yes | `vehicles:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:687
POST | `/api/v1/admin/vehicles/:vehicleId/deactivate` | yes | `vehicles:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:649
GET | `/api/v1/admin/vehicles/:vehicleId/devices` | yes | `vehicle-devices:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:874
POST | `/api/v1/admin/vehicles/:vehicleId/devices` | yes | `vehicle-devices:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:907
GET | `/api/v1/admin/vehicles/:vehicleId/devices/:deviceId` | yes | `vehicle-devices:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:888
PATCH | `/api/v1/admin/vehicles/:vehicleId/devices/:deviceId` | yes | `vehicle-devices:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:955
POST | `/api/v1/admin/vehicles/:vehicleId/devices/:deviceId/deactivate` | yes | `vehicle-devices:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:1015
POST | `/api/v1/admin/vehicles/:vehicleId/devices/:deviceId/detach` | yes | `vehicle-devices:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:1046
GET | `/api/v1/admin/vehicles/:vehicleId/documents` | yes | `vehicle-documents:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:725
POST | `/api/v1/admin/vehicles/:vehicleId/documents` | yes | `vehicle-documents:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:758
GET | `/api/v1/admin/vehicles/:vehicleId/documents/:documentId` | yes | `vehicle-documents:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:739
PATCH | `/api/v1/admin/vehicles/:vehicleId/documents/:documentId` | yes | `vehicle-documents:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:797
POST | `/api/v1/admin/vehicles/:vehicleId/documents/:documentId/archive` | yes | `vehicle-documents:manage` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:843
GET | `/api/v1/admin/vehicles/documents/expiring` | yes | `vehicle-documents:read` | guarded | apps/api/src/modules/admin/vehicles/routes.ts:286

### admin/vendor-categories

Routes: 6

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vendor-categories` | yes | `vendor-categories:read` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:45
POST | `/api/v1/admin/vendor-categories` | yes | `vendor-categories:manage` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:121
GET | `/api/v1/admin/vendor-categories/:vendorCategoryId` | yes | `vendor-categories:read` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:107
PATCH | `/api/v1/admin/vendor-categories/:vendorCategoryId` | yes | `vendor-categories:manage` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:170
POST | `/api/v1/admin/vendor-categories/:vendorCategoryId/activate` | yes | `vendor-categories:manage` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:206
POST | `/api/v1/admin/vendor-categories/:vendorCategoryId/deactivate` | yes | `vendor-categories:manage` | guarded | apps/api/src/modules/admin/vendor-categories/routes.ts:233

### admin/vendors

Routes: 16

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/admin/vendors` | yes | `vendors:read` | guarded | apps/api/src/modules/admin/vendors/routes.ts:110
POST | `/api/v1/admin/vendors` | yes | `vendors:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:193
GET | `/api/v1/admin/vendors/:vendorId` | yes | `vendors:read` | guarded | apps/api/src/modules/admin/vendors/routes.ts:172
PATCH | `/api/v1/admin/vendors/:vendorId` | yes | `vendors:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:254
POST | `/api/v1/admin/vendors/:vendorId/activate` | yes | `vendors:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:302
POST | `/api/v1/admin/vendors/:vendorId/contacts` | yes | `vendor-contacts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:356
DELETE | `/api/v1/admin/vendors/:vendorId/contacts/:contactId` | yes | `vendor-contacts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:441
PATCH | `/api/v1/admin/vendors/:vendorId/contacts/:contactId` | yes | `vendor-contacts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:392
GET | `/api/v1/admin/vendors/:vendorId/contracts` | yes | `vendor-contracts:read` | guarded | apps/api/src/modules/admin/vendors/routes.ts:478
POST | `/api/v1/admin/vendors/:vendorId/contracts` | yes | `vendor-contracts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:518
GET | `/api/v1/admin/vendors/:vendorId/contracts/:contractId` | yes | `vendor-contracts:read` | guarded | apps/api/src/modules/admin/vendors/routes.ts:499
PATCH | `/api/v1/admin/vendors/:vendorId/contracts/:contractId` | yes | `vendor-contracts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:554
POST | `/api/v1/admin/vendors/:vendorId/contracts/:contractId/activate` | yes | `vendor-contracts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:596
POST | `/api/v1/admin/vendors/:vendorId/contracts/:contractId/cancel` | yes | `vendor-contracts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:661
POST | `/api/v1/admin/vendors/:vendorId/contracts/:contractId/expire` | yes | `vendor-contracts:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:627
POST | `/api/v1/admin/vendors/:vendorId/deactivate` | yes | `vendors:manage` | guarded | apps/api/src/modules/admin/vendors/routes.ts:329

### api-contract

Routes: 2

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/docs` | no |  | public | apps/api/src/modules/api-contract/routes.ts:290
GET | `/api/v1/openapi.json` | no |  | public | apps/api/src/modules/api-contract/routes.ts:286

### auth

Routes: 4

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
POST | `/api/v1/auth/login` | no |  | public | apps/api/src/modules/auth/routes.ts:18
POST | `/api/v1/auth/logout` | no |  | public | apps/api/src/modules/auth/routes.ts:50
GET | `/api/v1/auth/me` | yes |  | authenticated | apps/api/src/modules/auth/routes.ts:97
POST | `/api/v1/auth/refresh` | no |  | public | apps/api/src/modules/auth/routes.ts:66

### health

Routes: 3

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/health` | no |  | public | apps/api/src/modules/health/routes.ts:32
GET | `/api/v1/health/live` | no |  | public | apps/api/src/modules/health/routes.ts:37
GET | `/api/v1/health/ready` | no |  | public | apps/api/src/modules/health/routes.ts:49

### navigation

Routes: 1

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
GET | `/api/v1/navigation/menu` | yes |  | authenticated | apps/api/src/modules/navigation/routes.ts:5

### tracking

Routes: 2

| Method | Path | Auth | Permission | Status | Source |
| --- | --- | --- | --- | --- | --- |
POST | `/api/v1/tracking/ingest` | no |  | public | apps/api/src/modules/tracking/routes.ts:538
POST | `/api/v1/tracking/traccar/webhook` | no |  | public | apps/api/src/modules/tracking/routes.ts:825


