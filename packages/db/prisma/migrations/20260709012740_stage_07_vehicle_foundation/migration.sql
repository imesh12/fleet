-- CreateEnum
CREATE TYPE "VehicleFuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleOwnershipType" AS ENUM ('OWNED', 'LEASED', 'CONTRACTED', 'CUSTOMER_PROVIDED', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VehicleDocumentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VehicleDeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DETACHED');

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMake" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleMakeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT,
    "departmentId" TEXT,
    "businessUnitId" TEXT,
    "vehicleTypeId" TEXT,
    "vehicleGroupId" TEXT,
    "makeId" TEXT,
    "modelId" TEXT,
    "serviceRouteTemplateId" TEXT,
    "registrationNumber" TEXT,
    "plateNumber" TEXT,
    "vin" TEXT,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "fuelType" "VehicleFuelType",
    "ownershipType" "VehicleOwnershipType",
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "odometer" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "status" "VehicleDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDevice" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalDeviceId" TEXT NOT NULL,
    "imei" TEXT,
    "serialNumber" TEXT,
    "status" "VehicleDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "installedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleType_organizationId_status_idx" ON "VehicleType"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleType_name_idx" ON "VehicleType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_organizationId_code_key" ON "VehicleType"("organizationId", "code");

-- CreateIndex
CREATE INDEX "VehicleGroup_organizationId_status_idx" ON "VehicleGroup"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleGroup_name_idx" ON "VehicleGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleGroup_organizationId_code_key" ON "VehicleGroup"("organizationId", "code");

-- CreateIndex
CREATE INDEX "VehicleMake_organizationId_status_idx" ON "VehicleMake"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleMake_name_idx" ON "VehicleMake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_organizationId_code_key" ON "VehicleMake"("organizationId", "code");

-- CreateIndex
CREATE INDEX "VehicleModel_organizationId_vehicleMakeId_status_idx" ON "VehicleModel"("organizationId", "vehicleMakeId", "status");

-- CreateIndex
CREATE INDEX "VehicleModel_name_idx" ON "VehicleModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_organizationId_code_key" ON "VehicleModel"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_status_idx" ON "Vehicle"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_vehicleTypeId_idx" ON "Vehicle"("organizationId", "vehicleTypeId");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_vehicleGroupId_idx" ON "Vehicle"("organizationId", "vehicleGroupId");

-- CreateIndex
CREATE INDEX "Vehicle_organizationId_customerAccountId_idx" ON "Vehicle"("organizationId", "customerAccountId");

-- CreateIndex
CREATE INDEX "Vehicle_departmentId_idx" ON "Vehicle"("departmentId");

-- CreateIndex
CREATE INDEX "Vehicle_businessUnitId_idx" ON "Vehicle"("businessUnitId");

-- CreateIndex
CREATE INDEX "Vehicle_makeId_idx" ON "Vehicle"("makeId");

-- CreateIndex
CREATE INDEX "Vehicle_modelId_idx" ON "Vehicle"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organizationId_plateNumber_key" ON "Vehicle"("organizationId", "plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organizationId_registrationNumber_key" ON "Vehicle"("organizationId", "registrationNumber");

-- CreateIndex
CREATE INDEX "VehicleDocument_vehicleId_status_idx" ON "VehicleDocument"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "VehicleDocument_expiryDate_idx" ON "VehicleDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "VehicleDocument_documentType_idx" ON "VehicleDocument"("documentType");

-- CreateIndex
CREATE INDEX "VehicleDevice_vehicleId_status_idx" ON "VehicleDevice"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "VehicleDevice_provider_externalDeviceId_idx" ON "VehicleDevice"("provider", "externalDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDevice_vehicleId_externalDeviceId_key" ON "VehicleDevice"("vehicleId", "externalDeviceId");

-- AddForeignKey
ALTER TABLE "VehicleType" ADD CONSTRAINT "VehicleType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleGroup" ADD CONSTRAINT "VehicleGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMake" ADD CONSTRAINT "VehicleMake_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_vehicleMakeId_fkey" FOREIGN KEY ("vehicleMakeId") REFERENCES "VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vehicleGroupId_fkey" FOREIGN KEY ("vehicleGroupId") REFERENCES "VehicleGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_serviceRouteTemplateId_fkey" FOREIGN KEY ("serviceRouteTemplateId") REFERENCES "ServiceRouteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDevice" ADD CONSTRAINT "VehicleDevice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
