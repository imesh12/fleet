-- CreateEnum
CREATE TYPE "BackgroundJobType" AS ENUM ('TRACKING_PROVIDER_SYNC', 'TRACKING_EVALUATION', 'GEOFENCE_EVALUATION', 'NOTIFICATION_DELIVERY', 'CLEANUP_EXPIRED_INVITATIONS');

-- CreateEnum
CREATE TYPE "BackgroundJobRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WEBHOOK', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationProviderType" AS ENUM ('CONSOLE', 'EMAIL', 'WEBHOOK', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EscalationEventStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELED');

-- AlterTable
ALTER TABLE "TrackingNotificationRule" ADD COLUMN     "escalationPolicyId" TEXT,
ADD COLUMN     "notificationProviderId" TEXT,
ADD COLUMN     "notificationTemplateId" TEXT;

-- CreateTable
CREATE TABLE "BackgroundJobDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "jobType" "BackgroundJobType" NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "schedule" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJobDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJobRun" (
    "id" TEXT NOT NULL,
    "backgroundJobDefinitionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" "BackgroundJobRunStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "summary" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJobRunLog" (
    "id" TEXT NOT NULL,
    "backgroundJobRunId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundJobRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationProvider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "providerType" "NotificationProviderType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "notificationProviderId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subjectTemplate" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "trackingAlertEventId" TEXT,
    "trackingNotificationRuleId" TEXT,
    "trackingNotificationEventId" TEXT,
    "notificationProviderId" TEXT,
    "notificationTemplateId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "externalMessageId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationPolicyStep" (
    "id" TEXT NOT NULL,
    "escalationPolicyId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "recipientMetadata" JSONB,
    "templateOverride" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationPolicyStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "trackingAlertEventId" TEXT,
    "escalationPolicyId" TEXT,
    "actorUserId" TEXT,
    "status" "EscalationEventStatus" NOT NULL DEFAULT 'OPEN',
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackgroundJobDefinition_organizationId_status_idx" ON "BackgroundJobDefinition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BackgroundJobDefinition_jobType_status_idx" ON "BackgroundJobDefinition"("jobType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundJobDefinition_organizationId_code_key" ON "BackgroundJobDefinition"("organizationId", "code");

-- CreateIndex
CREATE INDEX "BackgroundJobRun_backgroundJobDefinitionId_status_idx" ON "BackgroundJobRun"("backgroundJobDefinitionId", "status");

-- CreateIndex
CREATE INDEX "BackgroundJobRun_organizationId_status_idx" ON "BackgroundJobRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BackgroundJobRun_triggeredByUserId_idx" ON "BackgroundJobRun"("triggeredByUserId");

-- CreateIndex
CREATE INDEX "BackgroundJobRun_idempotencyKey_idx" ON "BackgroundJobRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BackgroundJobRunLog_backgroundJobRunId_createdAt_idx" ON "BackgroundJobRunLog"("backgroundJobRunId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationProvider_organizationId_status_idx" ON "NotificationProvider"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NotificationProvider_channel_status_idx" ON "NotificationProvider"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationProvider_organizationId_code_key" ON "NotificationProvider"("organizationId", "code");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_status_idx" ON "NotificationTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_status_idx" ON "NotificationTemplate"("channel", "status");

-- CreateIndex
CREATE INDEX "NotificationTemplate_notificationProviderId_status_idx" ON "NotificationTemplate"("notificationProviderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_organizationId_code_key" ON "NotificationTemplate"("organizationId", "code");

-- CreateIndex
CREATE INDEX "NotificationDelivery_organizationId_status_idx" ON "NotificationDelivery"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_trackingAlertEventId_status_idx" ON "NotificationDelivery"("trackingAlertEventId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_trackingNotificationRuleId_status_idx" ON "NotificationDelivery"("trackingNotificationRuleId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_trackingNotificationEventId_status_idx" ON "NotificationDelivery"("trackingNotificationEventId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationProviderId_status_idx" ON "NotificationDelivery"("notificationProviderId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_status_idx" ON "NotificationDelivery"("channel", "status");

-- CreateIndex
CREATE INDEX "EscalationPolicy_organizationId_status_idx" ON "EscalationPolicy"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EscalationPolicy_organizationId_code_key" ON "EscalationPolicy"("organizationId", "code");

-- CreateIndex
CREATE INDEX "EscalationPolicyStep_escalationPolicyId_isActive_idx" ON "EscalationPolicyStep"("escalationPolicyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EscalationPolicyStep_escalationPolicyId_sequence_key" ON "EscalationPolicyStep"("escalationPolicyId", "sequence");

-- CreateIndex
CREATE INDEX "EscalationEvent_organizationId_status_idx" ON "EscalationEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "EscalationEvent_trackingAlertEventId_status_idx" ON "EscalationEvent"("trackingAlertEventId", "status");

-- CreateIndex
CREATE INDEX "EscalationEvent_escalationPolicyId_status_idx" ON "EscalationEvent"("escalationPolicyId", "status");

-- CreateIndex
CREATE INDEX "EscalationEvent_actorUserId_idx" ON "EscalationEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "TrackingNotificationRule_notificationProviderId_status_idx" ON "TrackingNotificationRule"("notificationProviderId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationRule_notificationTemplateId_status_idx" ON "TrackingNotificationRule"("notificationTemplateId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationRule_escalationPolicyId_status_idx" ON "TrackingNotificationRule"("escalationPolicyId", "status");

-- AddForeignKey
ALTER TABLE "TrackingNotificationRule" ADD CONSTRAINT "TrackingNotificationRule_notificationProviderId_fkey" FOREIGN KEY ("notificationProviderId") REFERENCES "NotificationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationRule" ADD CONSTRAINT "TrackingNotificationRule_notificationTemplateId_fkey" FOREIGN KEY ("notificationTemplateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationRule" ADD CONSTRAINT "TrackingNotificationRule_escalationPolicyId_fkey" FOREIGN KEY ("escalationPolicyId") REFERENCES "EscalationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobDefinition" ADD CONSTRAINT "BackgroundJobDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobRun" ADD CONSTRAINT "BackgroundJobRun_backgroundJobDefinitionId_fkey" FOREIGN KEY ("backgroundJobDefinitionId") REFERENCES "BackgroundJobDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobRun" ADD CONSTRAINT "BackgroundJobRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobRun" ADD CONSTRAINT "BackgroundJobRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobRunLog" ADD CONSTRAINT "BackgroundJobRunLog_backgroundJobRunId_fkey" FOREIGN KEY ("backgroundJobRunId") REFERENCES "BackgroundJobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationProvider" ADD CONSTRAINT "NotificationProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_notificationProviderId_fkey" FOREIGN KEY ("notificationProviderId") REFERENCES "NotificationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_trackingAlertEventId_fkey" FOREIGN KEY ("trackingAlertEventId") REFERENCES "TrackingAlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_trackingNotificationRuleId_fkey" FOREIGN KEY ("trackingNotificationRuleId") REFERENCES "TrackingNotificationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_trackingNotificationEventId_fkey" FOREIGN KEY ("trackingNotificationEventId") REFERENCES "TrackingNotificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationProviderId_fkey" FOREIGN KEY ("notificationProviderId") REFERENCES "NotificationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationTemplateId_fkey" FOREIGN KEY ("notificationTemplateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationPolicy" ADD CONSTRAINT "EscalationPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationPolicyStep" ADD CONSTRAINT "EscalationPolicyStep_escalationPolicyId_fkey" FOREIGN KEY ("escalationPolicyId") REFERENCES "EscalationPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_trackingAlertEventId_fkey" FOREIGN KEY ("trackingAlertEventId") REFERENCES "TrackingAlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_escalationPolicyId_fkey" FOREIGN KEY ("escalationPolicyId") REFERENCES "EscalationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
