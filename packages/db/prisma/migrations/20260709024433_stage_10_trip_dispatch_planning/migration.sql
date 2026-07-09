-- CreateEnum
CREATE TYPE "PlannedTripStatus" AS ENUM ('DRAFT', 'PLANNED', 'READY', 'BLOCKED', 'CANCELED', 'DISPATCHED_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "PlannedTripPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DispatchQueueItemStatus" AS ENUM ('DRAFT', 'PLANNED', 'READY', 'BLOCKED', 'HELD', 'CANCELED', 'DISPATCHED_PLACEHOLDER');

-- CreateTable
CREATE TABLE "TripTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceRouteId" TEXT,
    "serviceRouteTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTemplateStop" (
    "id" TEXT NOT NULL,
    "tripTemplateId" TEXT NOT NULL,
    "serviceStopId" TEXT,
    "serviceRouteTemplateStopId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplateStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedTrip" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT,
    "serviceRouteId" TEXT,
    "serviceRouteTemplateId" TEXT,
    "tripTemplateId" TEXT,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "assignmentId" TEXT,
    "title" TEXT NOT NULL,
    "referenceCode" TEXT,
    "plannedStartAt" TIMESTAMP(3) NOT NULL,
    "plannedEndAt" TIMESTAMP(3),
    "status" "PlannedTripStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "PlannedTripPriority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedTripStop" (
    "id" TEXT NOT NULL,
    "plannedTripId" TEXT NOT NULL,
    "serviceStopId" TEXT,
    "serviceRouteTemplateStopId" TEXT,
    "tripTemplateStopId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "plannedArrivalAt" TIMESTAMP(3),
    "plannedDepartureAt" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedTripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchQueue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchQueueItem" (
    "id" TEXT NOT NULL,
    "dispatchQueueId" TEXT NOT NULL,
    "plannedTripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "DispatchQueueItemStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "holdReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripTemplate_organizationId_status_idx" ON "TripTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TripTemplate_serviceRouteId_idx" ON "TripTemplate"("serviceRouteId");

-- CreateIndex
CREATE INDEX "TripTemplate_serviceRouteTemplateId_idx" ON "TripTemplate"("serviceRouteTemplateId");

-- CreateIndex
CREATE INDEX "TripTemplate_name_idx" ON "TripTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TripTemplate_organizationId_code_key" ON "TripTemplate"("organizationId", "code");

-- CreateIndex
CREATE INDEX "TripTemplateStop_tripTemplateId_isActive_idx" ON "TripTemplateStop"("tripTemplateId", "isActive");

-- CreateIndex
CREATE INDEX "TripTemplateStop_serviceStopId_idx" ON "TripTemplateStop"("serviceStopId");

-- CreateIndex
CREATE INDEX "TripTemplateStop_serviceRouteTemplateStopId_idx" ON "TripTemplateStop"("serviceRouteTemplateStopId");

-- CreateIndex
CREATE INDEX "TripTemplateStop_name_idx" ON "TripTemplateStop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TripTemplateStop_tripTemplateId_sequence_key" ON "TripTemplateStop"("tripTemplateId", "sequence");

-- CreateIndex
CREATE INDEX "PlannedTrip_organizationId_status_idx" ON "PlannedTrip"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PlannedTrip_organizationId_plannedStartAt_idx" ON "PlannedTrip"("organizationId", "plannedStartAt");

-- CreateIndex
CREATE INDEX "PlannedTrip_customerAccountId_idx" ON "PlannedTrip"("customerAccountId");

-- CreateIndex
CREATE INDEX "PlannedTrip_vehicleId_idx" ON "PlannedTrip"("vehicleId");

-- CreateIndex
CREATE INDEX "PlannedTrip_driverId_idx" ON "PlannedTrip"("driverId");

-- CreateIndex
CREATE INDEX "PlannedTrip_assignmentId_idx" ON "PlannedTrip"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedTrip_organizationId_referenceCode_key" ON "PlannedTrip"("organizationId", "referenceCode");

-- CreateIndex
CREATE INDEX "PlannedTripStop_plannedTripId_isActive_idx" ON "PlannedTripStop"("plannedTripId", "isActive");

-- CreateIndex
CREATE INDEX "PlannedTripStop_serviceStopId_idx" ON "PlannedTripStop"("serviceStopId");

-- CreateIndex
CREATE INDEX "PlannedTripStop_serviceRouteTemplateStopId_idx" ON "PlannedTripStop"("serviceRouteTemplateStopId");

-- CreateIndex
CREATE INDEX "PlannedTripStop_tripTemplateStopId_idx" ON "PlannedTripStop"("tripTemplateStopId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedTripStop_plannedTripId_sequence_key" ON "PlannedTripStop"("plannedTripId", "sequence");

-- CreateIndex
CREATE INDEX "DispatchQueue_organizationId_status_idx" ON "DispatchQueue"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DispatchQueue_name_idx" ON "DispatchQueue"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchQueue_organizationId_code_key" ON "DispatchQueue"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DispatchQueueItem_dispatchQueueId_status_idx" ON "DispatchQueueItem"("dispatchQueueId", "status");

-- CreateIndex
CREATE INDEX "DispatchQueueItem_plannedTripId_idx" ON "DispatchQueueItem"("plannedTripId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchQueueItem_dispatchQueueId_plannedTripId_key" ON "DispatchQueueItem"("dispatchQueueId", "plannedTripId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchQueueItem_dispatchQueueId_sequence_key" ON "DispatchQueueItem"("dispatchQueueId", "sequence");

-- AddForeignKey
ALTER TABLE "TripTemplate" ADD CONSTRAINT "TripTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplate" ADD CONSTRAINT "TripTemplate_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplate" ADD CONSTRAINT "TripTemplate_serviceRouteTemplateId_fkey" FOREIGN KEY ("serviceRouteTemplateId") REFERENCES "ServiceRouteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateStop" ADD CONSTRAINT "TripTemplateStop_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "TripTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateStop" ADD CONSTRAINT "TripTemplateStop_serviceStopId_fkey" FOREIGN KEY ("serviceStopId") REFERENCES "ServiceStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateStop" ADD CONSTRAINT "TripTemplateStop_serviceRouteTemplateStopId_fkey" FOREIGN KEY ("serviceRouteTemplateStopId") REFERENCES "ServiceRouteTemplateStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_serviceRouteTemplateId_fkey" FOREIGN KEY ("serviceRouteTemplateId") REFERENCES "ServiceRouteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "TripTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTrip" ADD CONSTRAINT "PlannedTrip_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DriverVehicleAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTripStop" ADD CONSTRAINT "PlannedTripStop_plannedTripId_fkey" FOREIGN KEY ("plannedTripId") REFERENCES "PlannedTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTripStop" ADD CONSTRAINT "PlannedTripStop_serviceStopId_fkey" FOREIGN KEY ("serviceStopId") REFERENCES "ServiceStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTripStop" ADD CONSTRAINT "PlannedTripStop_serviceRouteTemplateStopId_fkey" FOREIGN KEY ("serviceRouteTemplateStopId") REFERENCES "ServiceRouteTemplateStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTripStop" ADD CONSTRAINT "PlannedTripStop_tripTemplateStopId_fkey" FOREIGN KEY ("tripTemplateStopId") REFERENCES "TripTemplateStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchQueue" ADD CONSTRAINT "DispatchQueue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchQueueItem" ADD CONSTRAINT "DispatchQueueItem_dispatchQueueId_fkey" FOREIGN KEY ("dispatchQueueId") REFERENCES "DispatchQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchQueueItem" ADD CONSTRAINT "DispatchQueueItem_plannedTripId_fkey" FOREIGN KEY ("plannedTripId") REFERENCES "PlannedTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
