-- CreateEnum
CREATE TYPE "TrackingProviderCredentialAuthType" AS ENUM ('API_KEY', 'BEARER_TOKEN');

-- CreateEnum
CREATE TYPE "TrackingHealthStatus" AS ENUM ('UNKNOWN', 'ONLINE', 'DEGRADED', 'OFFLINE', 'ERROR');

-- CreateTable
CREATE TABLE "TrackingProvider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "baseUrl" TEXT,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingProviderCredential" (
    "id" TEXT NOT NULL,
    "trackingProviderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "authType" "TrackingProviderCredentialAuthType" NOT NULL DEFAULT 'API_KEY',
    "secretHash" TEXT NOT NULL,
    "secretHint" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingProviderHealth" (
    "id" TEXT NOT NULL,
    "trackingProviderId" TEXT NOT NULL,
    "status" "TrackingHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "message" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastIngestAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingProviderHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePosition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleDeviceId" TEXT,
    "trackingProviderId" TEXT,
    "tripId" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(10,2),
    "altitude" DECIMAL(10,2),
    "accuracy" DECIMAL(10,2),
    "ignition" BOOLEAN,
    "battery" DECIMAL(10,2),
    "odometer" INTEGER,
    "eventType" TEXT,
    "providerTimestamp" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleTelemetryEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleDeviceId" TEXT,
    "trackingProviderId" TEXT,
    "tripId" TEXT,
    "providerEventId" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(10,2),
    "altitude" DECIMAL(10,2),
    "accuracy" DECIMAL(10,2),
    "ignition" BOOLEAN,
    "battery" DECIMAL(10,2),
    "odometer" INTEGER,
    "eventType" TEXT,
    "providerTimestamp" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackingProvider_organizationId_status_idx" ON "TrackingProvider"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TrackingProvider_name_idx" ON "TrackingProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingProvider_organizationId_code_key" ON "TrackingProvider"("organizationId", "code");

-- CreateIndex
CREATE INDEX "TrackingProviderCredential_trackingProviderId_status_idx" ON "TrackingProviderCredential"("trackingProviderId", "status");

-- CreateIndex
CREATE INDEX "TrackingProviderCredential_expiresAt_idx" ON "TrackingProviderCredential"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingProviderCredential_trackingProviderId_keyId_key" ON "TrackingProviderCredential"("trackingProviderId", "keyId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingProviderHealth_trackingProviderId_key" ON "TrackingProviderHealth"("trackingProviderId");

-- CreateIndex
CREATE INDEX "TrackingProviderHealth_status_idx" ON "TrackingProviderHealth"("status");

-- CreateIndex
CREATE INDEX "TrackingProviderHealth_lastIngestAt_idx" ON "TrackingProviderHealth"("lastIngestAt");

-- CreateIndex
CREATE INDEX "VehiclePosition_organizationId_providerTimestamp_idx" ON "VehiclePosition"("organizationId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehiclePosition_vehicleDeviceId_providerTimestamp_idx" ON "VehiclePosition"("vehicleDeviceId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehiclePosition_trackingProviderId_providerTimestamp_idx" ON "VehiclePosition"("trackingProviderId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehiclePosition_tripId_providerTimestamp_idx" ON "VehiclePosition"("tripId", "providerTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePosition_vehicleId_key" ON "VehiclePosition"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_organizationId_providerTimestamp_idx" ON "VehicleTelemetryEvent"("organizationId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_vehicleId_providerTimestamp_idx" ON "VehicleTelemetryEvent"("vehicleId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_vehicleDeviceId_providerTimestamp_idx" ON "VehicleTelemetryEvent"("vehicleDeviceId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_trackingProviderId_providerTimestamp_idx" ON "VehicleTelemetryEvent"("trackingProviderId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_tripId_providerTimestamp_idx" ON "VehicleTelemetryEvent"("tripId", "providerTimestamp");

-- CreateIndex
CREATE INDEX "VehicleTelemetryEvent_providerEventId_idx" ON "VehicleTelemetryEvent"("providerEventId");

-- AddForeignKey
ALTER TABLE "TrackingProvider" ADD CONSTRAINT "TrackingProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderCredential" ADD CONSTRAINT "TrackingProviderCredential_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingProviderHealth" ADD CONSTRAINT "TrackingProviderHealth_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePosition" ADD CONSTRAINT "VehiclePosition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePosition" ADD CONSTRAINT "VehiclePosition_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePosition" ADD CONSTRAINT "VehiclePosition_vehicleDeviceId_fkey" FOREIGN KEY ("vehicleDeviceId") REFERENCES "VehicleDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePosition" ADD CONSTRAINT "VehiclePosition_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePosition" ADD CONSTRAINT "VehiclePosition_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryEvent" ADD CONSTRAINT "VehicleTelemetryEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryEvent" ADD CONSTRAINT "VehicleTelemetryEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryEvent" ADD CONSTRAINT "VehicleTelemetryEvent_vehicleDeviceId_fkey" FOREIGN KEY ("vehicleDeviceId") REFERENCES "VehicleDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryEvent" ADD CONSTRAINT "VehicleTelemetryEvent_trackingProviderId_fkey" FOREIGN KEY ("trackingProviderId") REFERENCES "TrackingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryEvent" ADD CONSTRAINT "VehicleTelemetryEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
