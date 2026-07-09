-- CreateEnum
CREATE TYPE "TrackingDeviceDiscoveryStatus" AS ENUM ('DISCOVERED', 'MAPPED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VehicleDeviceMappingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNMAPPED');

-- CreateEnum
CREATE TYPE "TrackingProviderSyncRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TrackingProviderSyncItemStatus" AS ENUM ('PENDING', 'PROCESSED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrackingAlertRuleType" AS ENUM ('DEVICE_OFFLINE', 'SPEED_THRESHOLD', 'IGNITION_ON', 'IGNITION_OFF', 'STALE_POSITION', 'TRIP_STARTED', 'TRIP_COMPLETED');

-- CreateEnum
CREATE TYPE "TrackingAlertEventStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "GeofenceType" AS ENUM ('POLYGON', 'POLYLINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripEventType" ADD VALUE 'TELEMETRY_RECEIVED';
ALTER TYPE "TripEventType" ADD VALUE 'MOVEMENT_STARTED';
ALTER TYPE "TripEventType" ADD VALUE 'MOVEMENT_STOPPED';

-- CreateTable
CREATE TABLE "ExternalTrackingDevice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingProviderId" TEXT NOT NULL,
    "externalDeviceId" TEXT NOT NULL,
    "providerUniqueId" TEXT,
    "name" TEXT,
    "imei" TEXT,
    "model" TEXT,
    "phoneNumber" TEXT,
    "status" "TrackingDeviceDiscoveryStatus" NOT NULL DEFAULT 'DISCOVERED',
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "lastPayload" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalTrackingDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDeviceMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingProviderId" TEXT NOT NULL,
    "externalTrackingDeviceId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleDeviceId" TEXT,
    "status" "VehicleDeviceMappingStatus" NOT NULL DEFAULT 'ACTIVE',
    "mappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmappedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDeviceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingProviderSyncRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingProviderId" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "status" "TrackingProviderSyncRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "summary" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingProviderSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingProviderSyncItem" (
    "id" TEXT NOT NULL,
    "trackingProviderSyncRunId" TEXT NOT NULL,
    "externalEntityType" TEXT NOT NULL,
    "externalEntityId" TEXT NOT NULL,
    "status" "TrackingProviderSyncItemStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingProviderSyncItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingAlertRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingProviderId" TEXT,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ruleType" "TrackingAlertRuleType" NOT NULL,
    "severity" TEXT NOT NULL,
    "condition" JSONB,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingAlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingAlertEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trackingAlertRuleId" TEXT,
    "vehicleId" TEXT,
    "tripId" TEXT,
    "vehiclePositionId" TEXT,
    "vehicleTelemetryEventId" TEXT,
    "status" "TrackingAlertEventStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingAlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "geofenceType" "GeofenceType" NOT NULL,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofencePoint" (
    "id" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofencePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalTrackingDevice_organizationId_status_idx" ON "ExternalTrackingDevice"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ExternalTrackingDevice_providerUniqueId_idx" ON "ExternalTrackingDevice"("providerUniqueId");

-- CreateIndex
CREATE INDEX "ExternalTrackingDevice_lastSeenAt_idx" ON "ExternalTrackingDevice"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTrackingDevice_trackingProviderId_externalDeviceId_key" ON "ExternalTrackingDevice"("trackingProviderId", "externalDeviceId");

-- CreateIndex
CREATE INDEX "VehicleDeviceMapping_organizationId_status_idx" ON "VehicleDeviceMapping"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleDeviceMapping_trackingProviderId_status_idx" ON "VehicleDeviceMapping"("trackingProviderId", "status");

-- CreateIndex
CREATE INDEX "VehicleDeviceMapping_vehicleId_status_idx" ON "VehicleDeviceMapping"("vehicleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDeviceMapping_externalTrackingDeviceId_key" ON "VehicleDeviceMapping"("externalTrackingDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDeviceMapping_vehicleDeviceId_key" ON "VehicleDeviceMapping"("vehicleDeviceId");

-- CreateIndex
CREATE INDEX "TrackingProviderSyncRun_organizationId_status_idx" ON "TrackingProviderSyncRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingProviderSyncRun_trackingProviderId_status_idx" ON "TrackingProviderSyncRun"("trackingProviderId", "status");

-- CreateIndex
CREATE INDEX "TrackingProviderSyncRun_triggeredByUserId_idx" ON "TrackingProviderSyncRun"("triggeredByUserId");

-- CreateIndex
CREATE INDEX "TrackingProviderSyncItem_trackingProviderSyncRunId_status_idx" ON "TrackingProviderSyncItem"("trackingProviderSyncRunId", "status");

-- CreateIndex
CREATE INDEX "TrackingProviderSyncItem_externalEntityType_externalEntityI_idx" ON "TrackingProviderSyncItem"("externalEntityType", "externalEntityId");

-- CreateIndex
CREATE INDEX "TrackingAlertRule_organizationId_status_idx" ON "TrackingAlertRule"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertRule_trackingProviderId_status_idx" ON "TrackingAlertRule"("trackingProviderId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertRule_vehicleId_status_idx" ON "TrackingAlertRule"("vehicleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingAlertRule_organizationId_code_key" ON "TrackingAlertRule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "TrackingAlertEvent_organizationId_status_idx" ON "TrackingAlertEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertEvent_trackingAlertRuleId_status_idx" ON "TrackingAlertEvent"("trackingAlertRuleId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertEvent_vehicleId_status_idx" ON "TrackingAlertEvent"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertEvent_tripId_status_idx" ON "TrackingAlertEvent"("tripId", "status");

-- CreateIndex
CREATE INDEX "TrackingAlertEvent_triggeredAt_idx" ON "TrackingAlertEvent"("triggeredAt");

-- CreateIndex
CREATE INDEX "Geofence_organizationId_status_idx" ON "Geofence"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Geofence_name_idx" ON "Geofence"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Geofence_organizationId_code_key" ON "Geofence"("organizationId", "code");

-- CreateIndex
CREATE INDEX "GeofencePoint_geofenceId_idx" ON "GeofencePoint"("geofenceId");

-- CreateIndex
CREATE UNIQUE INDEX "GeofencePoint_geofenceId_sequence_key" ON "GeofencePoint"("geofenceId", "sequence");

-- AddForeignKey
ALTER TABLE "ExternalTrackingDevice" ADD CONSTRAINT "ExternalTrackingDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalTrackingDevice" ADD CONSTRAINT "ExternalTrackingDevice_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDeviceMapping" ADD CONSTRAINT "VehicleDeviceMapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDeviceMapping" ADD CONSTRAINT "VehicleDeviceMapping_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDeviceMapping" ADD CONSTRAINT "VehicleDeviceMapping_externalTrackingDeviceId_fkey" FOREIGN KEY ("externalTrackingDeviceId") REFERENCES "ExternalTrackingDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDeviceMapping" ADD CONSTRAINT "VehicleDeviceMapping_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDeviceMapping" ADD CONSTRAINT "VehicleDeviceMapping_vehicleDeviceId_fkey" FOREIGN KEY ("vehicleDeviceId") REFERENCES "VehicleDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderSyncRun" ADD CONSTRAINT "TrackingProviderSyncRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderSyncRun" ADD CONSTRAINT "TrackingProviderSyncRun_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderSyncRun" ADD CONSTRAINT "TrackingProviderSyncRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderSyncItem" ADD CONSTRAINT "TrackingProviderSyncItem_trackingProviderSyncRunId_fkey" FOREIGN KEY ("trackingProviderSyncRunId") REFERENCES "TrackingProviderSyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertRule" ADD CONSTRAINT "TrackingAlertRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertRule" ADD CONSTRAINT "TrackingAlertRule_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertRule" ADD CONSTRAINT "TrackingAlertRule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_trackingAlertRuleId_fkey" FOREIGN KEY ("trackingAlertRuleId") REFERENCES "TrackingAlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_vehiclePositionId_fkey" FOREIGN KEY ("vehiclePositionId") REFERENCES "VehiclePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingAlertEvent" ADD CONSTRAINT "TrackingAlertEvent_vehicleTelemetryEventId_fkey" FOREIGN KEY ("vehicleTelemetryEventId") REFERENCES "VehicleTelemetryEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geofence" ADD CONSTRAINT "Geofence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofencePoint" ADD CONSTRAINT "GeofencePoint_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "Geofence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
