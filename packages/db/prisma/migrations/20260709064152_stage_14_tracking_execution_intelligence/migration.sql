-- CreateEnum
CREATE TYPE "GeofenceEventType" AS ENUM ('ENTER', 'EXIT', 'INSIDE', 'OUTSIDE');

-- CreateEnum
CREATE TYPE "EvaluationRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EvaluationItemStatus" AS ENUM ('PENDING', 'PROCESSED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrackingNotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WEBHOOK', 'IN_APP');

-- CreateEnum
CREATE TYPE "TrackingNotificationEventStatus" AS ENUM ('PENDING', 'GENERATED', 'SKIPPED', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "GeofenceEvaluationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "geofenceId" TEXT,
    "vehicleId" TEXT,
    "vehiclePositionId" TEXT,
    "status" "EvaluationRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "summary" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofenceEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehiclePositionId" TEXT NOT NULL,
    "geofenceEvaluationRunId" TEXT,
    "tripId" TEXT,
    "eventType" "GeofenceEventType" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvaluationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "status" "EvaluationRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "summary" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvaluationItem" (
    "id" TEXT NOT NULL,
    "trackingEvaluationRunId" TEXT NOT NULL,
    "trackingAlertRuleId" TEXT,
    "trackingAlertEventId" TEXT,
    "trackingProviderId" TEXT,
    "vehicleId" TEXT,
    "tripId" TEXT,
    "evaluationType" TEXT NOT NULL,
    "status" "EvaluationItemStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "metadata" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingEvaluationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingNotificationRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingAlertRuleId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "TrackingNotificationChannel" NOT NULL,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "recipientMetadata" JSONB,
    "messageTemplate" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingNotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingNotificationEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingNotificationRuleId" TEXT,
    "trackingAlertEventId" TEXT,
    "tripId" TEXT,
    "channel" "TrackingNotificationChannel" NOT NULL,
    "status" "TrackingNotificationEventStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "recipientMetadata" JSONB,
    "metadata" JSONB,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingNotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeofenceEvaluationRun_organizationId_status_idx" ON "GeofenceEvaluationRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "GeofenceEvaluationRun_geofenceId_status_idx" ON "GeofenceEvaluationRun"("geofenceId", "status");

-- CreateIndex
CREATE INDEX "GeofenceEvaluationRun_vehicleId_status_idx" ON "GeofenceEvaluationRun"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "GeofenceEvent_organizationId_happenedAt_idx" ON "GeofenceEvent"("organizationId", "happenedAt");

-- CreateIndex
CREATE INDEX "GeofenceEvent_geofenceId_happenedAt_idx" ON "GeofenceEvent"("geofenceId", "happenedAt");

-- CreateIndex
CREATE INDEX "GeofenceEvent_vehicleId_happenedAt_idx" ON "GeofenceEvent"("vehicleId", "happenedAt");

-- CreateIndex
CREATE INDEX "GeofenceEvent_tripId_happenedAt_idx" ON "GeofenceEvent"("tripId", "happenedAt");

-- CreateIndex
CREATE INDEX "TrackingEvaluationRun_organizationId_status_idx" ON "TrackingEvaluationRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingEvaluationRun_triggeredByUserId_idx" ON "TrackingEvaluationRun"("triggeredByUserId");

-- CreateIndex
CREATE INDEX "TrackingEvaluationItem_trackingEvaluationRunId_status_idx" ON "TrackingEvaluationItem"("trackingEvaluationRunId", "status");

-- CreateIndex
CREATE INDEX "TrackingEvaluationItem_trackingAlertRuleId_status_idx" ON "TrackingEvaluationItem"("trackingAlertRuleId", "status");

-- CreateIndex
CREATE INDEX "TrackingEvaluationItem_trackingAlertEventId_status_idx" ON "TrackingEvaluationItem"("trackingAlertEventId", "status");

-- CreateIndex
CREATE INDEX "TrackingEvaluationItem_vehicleId_status_idx" ON "TrackingEvaluationItem"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "TrackingEvaluationItem_tripId_status_idx" ON "TrackingEvaluationItem"("tripId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationRule_organizationId_status_idx" ON "TrackingNotificationRule"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationRule_trackingAlertRuleId_status_idx" ON "TrackingNotificationRule"("trackingAlertRuleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingNotificationRule_organizationId_code_key" ON "TrackingNotificationRule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "TrackingNotificationEvent_organizationId_status_idx" ON "TrackingNotificationEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationEvent_trackingNotificationRuleId_status_idx" ON "TrackingNotificationEvent"("trackingNotificationRuleId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationEvent_trackingAlertEventId_status_idx" ON "TrackingNotificationEvent"("trackingAlertEventId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationEvent_tripId_status_idx" ON "TrackingNotificationEvent"("tripId", "status");

-- CreateIndex
CREATE INDEX "TrackingNotificationEvent_triggeredAt_idx" ON "TrackingNotificationEvent"("triggeredAt");

-- AddForeignKey
ALTER TABLE "GeofenceEvaluationRun" ADD CONSTRAINT "GeofenceEvaluationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvaluationRun" ADD CONSTRAINT "GeofenceEvaluationRun_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "Geofence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvaluationRun" ADD CONSTRAINT "GeofenceEvaluationRun_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvaluationRun" ADD CONSTRAINT "GeofenceEvaluationRun_vehiclePositionId_fkey" FOREIGN KEY ("vehiclePositionId") REFERENCES "VehiclePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "Geofence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_vehiclePositionId_fkey" FOREIGN KEY ("vehiclePositionId") REFERENCES "VehiclePosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_geofenceEvaluationRunId_fkey" FOREIGN KEY ("geofenceEvaluationRunId") REFERENCES "GeofenceEvaluationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationRun" ADD CONSTRAINT "TrackingEvaluationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationRun" ADD CONSTRAINT "TrackingEvaluationRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_trackingEvaluationRunId_fkey" FOREIGN KEY ("trackingEvaluationRunId") REFERENCES "TrackingEvaluationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_trackingAlertRuleId_fkey" FOREIGN KEY ("trackingAlertRuleId") REFERENCES "TrackingAlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_trackingAlertEventId_fkey" FOREIGN KEY ("trackingAlertEventId") REFERENCES "TrackingAlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvaluationItem" ADD CONSTRAINT "TrackingEvaluationItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationRule" ADD CONSTRAINT "TrackingNotificationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationRule" ADD CONSTRAINT "TrackingNotificationRule_trackingAlertRuleId_fkey" FOREIGN KEY ("trackingAlertRuleId") REFERENCES "TrackingAlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationEvent" ADD CONSTRAINT "TrackingNotificationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationEvent" ADD CONSTRAINT "TrackingNotificationEvent_trackingNotificationRuleId_fkey" FOREIGN KEY ("trackingNotificationRuleId") REFERENCES "TrackingNotificationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationEvent" ADD CONSTRAINT "TrackingNotificationEvent_trackingAlertEventId_fkey" FOREIGN KEY ("trackingAlertEventId") REFERENCES "TrackingAlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNotificationEvent" ADD CONSTRAINT "TrackingNotificationEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
