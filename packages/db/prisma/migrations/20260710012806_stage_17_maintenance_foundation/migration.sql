-- CreateEnum
CREATE TYPE "InspectionChecklistItemType" AS ENUM ('BOOLEAN', 'TEXT', 'NUMBER', 'PHOTO', 'PASS_FAIL');

-- CreateEnum
CREATE TYPE "MaintenancePlanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceRequestStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER', 'COMPLETED_PLACEHOLDER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceWorkOrderStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER', 'COMPLETED_PLACEHOLDER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "BackgroundJobType" ADD VALUE 'MAINTENANCE_DUE_EVALUATION';

-- CreateTable
CREATE TABLE "MaintenanceCategory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceServiceTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "defaultIntervalKm" INTEGER,
    "defaultIntervalDays" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "estimatedCost" DECIMAL(12,2),
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceServiceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionChecklistTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistTemplateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "itemType" "InspectionChecklistItemType" NOT NULL DEFAULT 'BOOLEAN',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenancePlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MaintenancePlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "nextDueOdometer" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenancePlanTask" (
    "id" TEXT NOT NULL,
    "vehicleMaintenancePlanId" TEXT NOT NULL,
    "maintenanceServiceTaskId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intervalKm" INTEGER,
    "intervalDays" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "estimatedCost" DECIMAL(12,2),
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "nextDueOdometer" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMaintenancePlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWorkOrder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "vendorId" TEXT,
    "maintenanceRequestId" TEXT,
    "inspectionChecklistTemplateId" TEXT,
    "workOrderNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceWorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWorkOrderTask" (
    "id" TEXT NOT NULL,
    "maintenanceWorkOrderId" TEXT NOT NULL,
    "maintenanceServiceTaskId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "estimatedCost" DECIMAL(12,2),
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWorkOrderTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceCategory_organizationId_status_idx" ON "MaintenanceCategory"("organizationId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceCategory_name_idx" ON "MaintenanceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceCategory_organizationId_code_key" ON "MaintenanceCategory"("organizationId", "code");

-- CreateIndex
CREATE INDEX "MaintenanceServiceTask_organizationId_status_idx" ON "MaintenanceServiceTask"("organizationId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceServiceTask_organizationId_categoryId_idx" ON "MaintenanceServiceTask"("organizationId", "categoryId");

-- CreateIndex
CREATE INDEX "MaintenanceServiceTask_name_idx" ON "MaintenanceServiceTask"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceServiceTask_organizationId_code_key" ON "MaintenanceServiceTask"("organizationId", "code");

-- CreateIndex
CREATE INDEX "InspectionChecklistTemplate_organizationId_status_idx" ON "InspectionChecklistTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InspectionChecklistTemplate_name_idx" ON "InspectionChecklistTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionChecklistTemplate_organizationId_code_key" ON "InspectionChecklistTemplate"("organizationId", "code");

-- CreateIndex
CREATE INDEX "InspectionChecklistItem_checklistTemplateId_sequence_idx" ON "InspectionChecklistItem"("checklistTemplateId", "sequence");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlan_organizationId_status_idx" ON "VehicleMaintenancePlan"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlan_vehicleId_status_idx" ON "VehicleMaintenancePlan"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlan_nextDueAt_idx" ON "VehicleMaintenancePlan"("nextDueAt");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlan_nextDueOdometer_idx" ON "VehicleMaintenancePlan"("nextDueOdometer");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlanTask_vehicleMaintenancePlanId_status_idx" ON "VehicleMaintenancePlanTask"("vehicleMaintenancePlanId", "status");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlanTask_maintenanceServiceTaskId_idx" ON "VehicleMaintenancePlanTask"("maintenanceServiceTaskId");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlanTask_nextDueAt_idx" ON "VehicleMaintenancePlanTask"("nextDueAt");

-- CreateIndex
CREATE INDEX "VehicleMaintenancePlanTask_nextDueOdometer_idx" ON "VehicleMaintenancePlanTask"("nextDueOdometer");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_organizationId_status_idx" ON "MaintenanceRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_vehicleId_status_idx" ON "MaintenanceRequest"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_driverId_idx" ON "MaintenanceRequest"("driverId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_requestedAt_idx" ON "MaintenanceRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_organizationId_status_idx" ON "MaintenanceWorkOrder"("organizationId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_vehicleId_status_idx" ON "MaintenanceWorkOrder"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_driverId_idx" ON "MaintenanceWorkOrder"("driverId");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_vendorId_idx" ON "MaintenanceWorkOrder"("vendorId");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_maintenanceRequestId_idx" ON "MaintenanceWorkOrder"("maintenanceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorkOrder_organizationId_workOrderNumber_key" ON "MaintenanceWorkOrder"("organizationId", "workOrderNumber");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrderTask_maintenanceWorkOrderId_sequence_idx" ON "MaintenanceWorkOrderTask"("maintenanceWorkOrderId", "sequence");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrderTask_maintenanceServiceTaskId_idx" ON "MaintenanceWorkOrderTask"("maintenanceServiceTaskId");

-- AddForeignKey
ALTER TABLE "MaintenanceCategory" ADD CONSTRAINT "MaintenanceCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceServiceTask" ADD CONSTRAINT "MaintenanceServiceTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceServiceTask" ADD CONSTRAINT "MaintenanceServiceTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaintenanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionChecklistTemplate" ADD CONSTRAINT "InspectionChecklistTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionChecklistItem" ADD CONSTRAINT "InspectionChecklistItem_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "InspectionChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenancePlan" ADD CONSTRAINT "VehicleMaintenancePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenancePlan" ADD CONSTRAINT "VehicleMaintenancePlan_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenancePlanTask" ADD CONSTRAINT "VehicleMaintenancePlanTask_vehicleMaintenancePlanId_fkey" FOREIGN KEY ("vehicleMaintenancePlanId") REFERENCES "VehicleMaintenancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenancePlanTask" ADD CONSTRAINT "VehicleMaintenancePlanTask_maintenanceServiceTaskId_fkey" FOREIGN KEY ("maintenanceServiceTaskId") REFERENCES "MaintenanceServiceTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_inspectionChecklistTemplateId_fkey" FOREIGN KEY ("inspectionChecklistTemplateId") REFERENCES "InspectionChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrderTask" ADD CONSTRAINT "MaintenanceWorkOrderTask_maintenanceWorkOrderId_fkey" FOREIGN KEY ("maintenanceWorkOrderId") REFERENCES "MaintenanceWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrderTask" ADD CONSTRAINT "MaintenanceWorkOrderTask_maintenanceServiceTaskId_fkey" FOREIGN KEY ("maintenanceServiceTaskId") REFERENCES "MaintenanceServiceTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
