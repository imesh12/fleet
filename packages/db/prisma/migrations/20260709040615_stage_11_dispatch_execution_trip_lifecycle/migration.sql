-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'READY', 'DISPATCHED', 'STARTED', 'ON_HOLD', 'RESUMED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TripStopStatus" AS ENUM ('PENDING', 'ARRIVED', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('CREATED', 'READINESS_VALIDATED', 'DISPATCHED', 'STARTED', 'FORCE_STARTED', 'HELD', 'RESUMED', 'COMPLETED', 'CANCELLED', 'FAILED', 'STOP_STATUS_UPDATED', 'STOP_REORDERED', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "DispatchActionType" AS ENUM ('VALIDATED', 'ASSIGNED', 'DISPATCHED', 'STARTED', 'HELD', 'RESUMED', 'COMPLETED', 'CANCELLED', 'FAILED', 'FORCE_STARTED', 'NOTE');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plannedTripId" TEXT,
    "dispatchQueueItemId" TEXT,
    "customerAccountId" TEXT,
    "serviceRouteId" TEXT,
    "serviceRouteTemplateId" TEXT,
    "tripTemplateId" TEXT,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "assignmentId" TEXT,
    "title" TEXT NOT NULL,
    "referenceCode" TEXT,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "holdStartedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "holdReason" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "plannedTripStopId" TEXT,
    "serviceStopId" TEXT,
    "serviceRouteTemplateStopId" TEXT,
    "tripTemplateStopId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "scheduledArrivalAt" TIMESTAMP(3),
    "scheduledDepartureAt" TIMESTAMP(3),
    "actualArrivalAt" TIMESTAMP(3),
    "actualDepartureAt" TIMESTAMP(3),
    "status" "TripStopStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
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

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" "TripEventType" NOT NULL,
    "statusFrom" "TripStatus",
    "statusTo" "TripStatus",
    "note" TEXT,
    "metadata" JSONB,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchAction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "tripId" TEXT,
    "plannedTripId" TEXT,
    "dispatchQueueItemId" TEXT,
    "actionType" "DispatchActionType" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_organizationId_status_idx" ON "Trip"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Trip_organizationId_scheduledStartAt_idx" ON "Trip"("organizationId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "Trip_customerAccountId_idx" ON "Trip"("customerAccountId");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_idx" ON "Trip"("vehicleId");

-- CreateIndex
CREATE INDEX "Trip_driverId_idx" ON "Trip"("driverId");

-- CreateIndex
CREATE INDEX "Trip_assignmentId_idx" ON "Trip"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_plannedTripId_key" ON "Trip"("plannedTripId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_dispatchQueueItemId_key" ON "Trip"("dispatchQueueItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_organizationId_referenceCode_key" ON "Trip"("organizationId", "referenceCode");

-- CreateIndex
CREATE INDEX "TripStop_tripId_status_idx" ON "TripStop"("tripId", "status");

-- CreateIndex
CREATE INDEX "TripStop_plannedTripStopId_idx" ON "TripStop"("plannedTripStopId");

-- CreateIndex
CREATE UNIQUE INDEX "TripStop_tripId_sequence_key" ON "TripStop"("tripId", "sequence");

-- CreateIndex
CREATE INDEX "TripEvent_tripId_happenedAt_idx" ON "TripEvent"("tripId", "happenedAt");

-- CreateIndex
CREATE INDEX "TripEvent_actorUserId_idx" ON "TripEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "TripEvent_eventType_idx" ON "TripEvent"("eventType");

-- CreateIndex
CREATE INDEX "DispatchAction_organizationId_happenedAt_idx" ON "DispatchAction"("organizationId", "happenedAt");

-- CreateIndex
CREATE INDEX "DispatchAction_tripId_happenedAt_idx" ON "DispatchAction"("tripId", "happenedAt");

-- CreateIndex
CREATE INDEX "DispatchAction_plannedTripId_happenedAt_idx" ON "DispatchAction"("plannedTripId", "happenedAt");

-- CreateIndex
CREATE INDEX "DispatchAction_dispatchQueueItemId_happenedAt_idx" ON "DispatchAction"("dispatchQueueItemId", "happenedAt");

-- CreateIndex
CREATE INDEX "DispatchAction_actorUserId_idx" ON "DispatchAction"("actorUserId");

-- CreateIndex
CREATE INDEX "DispatchAction_actionType_idx" ON "DispatchAction"("actionType");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_plannedTripId_fkey" FOREIGN KEY ("plannedTripId") REFERENCES "PlannedTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_dispatchQueueItemId_fkey" FOREIGN KEY ("dispatchQueueItemId") REFERENCES "DispatchQueueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_serviceRouteTemplateId_fkey" FOREIGN KEY ("serviceRouteTemplateId") REFERENCES "ServiceRouteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "TripTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DriverVehicleAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_plannedTripStopId_fkey" FOREIGN KEY ("plannedTripStopId") REFERENCES "PlannedTripStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_serviceStopId_fkey" FOREIGN KEY ("serviceStopId") REFERENCES "ServiceStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_serviceRouteTemplateStopId_fkey" FOREIGN KEY ("serviceRouteTemplateStopId") REFERENCES "ServiceRouteTemplateStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripTemplateStopId_fkey" FOREIGN KEY ("tripTemplateStopId") REFERENCES "TripTemplateStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_plannedTripId_fkey" FOREIGN KEY ("plannedTripId") REFERENCES "PlannedTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAction" ADD CONSTRAINT "DispatchAction_dispatchQueueItemId_fkey" FOREIGN KEY ("dispatchQueueItemId") REFERENCES "DispatchQueueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
