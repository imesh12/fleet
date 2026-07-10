-- CreateEnum
CREATE TYPE "FuelCardStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FuelTankStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FuelPolicyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FuelRequestStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "FuelEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FuelUnit" AS ENUM ('LITER', 'GALLON', 'KWH');

-- AlterEnum
ALTER TYPE "BackgroundJobType" ADD VALUE 'FUEL_ALERT_EVALUATION';

-- CreateTable
CREATE TABLE "FuelType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelVendorProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "stationCode" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "metadata" JSONB,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelVendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelCard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "cardNumberMasked" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "status" "FuelCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "limitAmount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelTank" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerLocationId" TEXT,
    "fuelTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" DECIMAL(12,2) NOT NULL,
    "currentLevel" DECIMAL(12,2),
    "unit" "FuelUnit" NOT NULL DEFAULT 'LITER',
    "status" "FuelTankStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelTank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "FuelPolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPolicyRule" (
    "id" TEXT NOT NULL,
    "fuelPolicyId" TEXT NOT NULL,
    "fuelTypeId" TEXT,
    "ruleCode" TEXT NOT NULL,
    "description" TEXT,
    "value" JSONB,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "fuelTypeId" TEXT NOT NULL,
    "fuelVendorProfileId" TEXT,
    "fuelCardId" TEXT,
    "requestedQuantity" DECIMAL(12,2),
    "unit" "FuelUnit" NOT NULL DEFAULT 'LITER',
    "estimatedAmount" DECIMAL(12,2),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FuelRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "fuelTypeId" TEXT NOT NULL,
    "fuelVendorProfileId" TEXT,
    "fuelCardId" TEXT,
    "fuelTankId" TEXT,
    "fuelRequestId" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" "FuelUnit" NOT NULL DEFAULT 'LITER',
    "unitPrice" DECIMAL(12,4),
    "totalAmount" DECIMAL(12,2),
    "odometer" INTEGER,
    "filledAt" TIMESTAMP(3) NOT NULL,
    "receiptFileName" TEXT,
    "receiptFileUrl" TEXT,
    "receiptMimeType" TEXT,
    "receiptSizeBytes" INTEGER,
    "status" "FuelEntryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuelType_organizationId_status_idx" ON "FuelType"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelType_name_idx" ON "FuelType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FuelType_organizationId_code_key" ON "FuelType"("organizationId", "code");

-- CreateIndex
CREATE INDEX "FuelVendorProfile_organizationId_status_idx" ON "FuelVendorProfile"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelVendorProfile_vendorId_idx" ON "FuelVendorProfile"("vendorId");

-- CreateIndex
CREATE INDEX "FuelVendorProfile_stationName_idx" ON "FuelVendorProfile"("stationName");

-- CreateIndex
CREATE UNIQUE INDEX "FuelVendorProfile_organizationId_vendorId_stationName_key" ON "FuelVendorProfile"("organizationId", "vendorId", "stationName");

-- CreateIndex
CREATE INDEX "FuelCard_organizationId_status_idx" ON "FuelCard"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelCard_vehicleId_idx" ON "FuelCard"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelCard_driverId_idx" ON "FuelCard"("driverId");

-- CreateIndex
CREATE INDEX "FuelCard_expiryDate_idx" ON "FuelCard"("expiryDate");

-- CreateIndex
CREATE INDEX "FuelTank_organizationId_status_idx" ON "FuelTank"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelTank_customerLocationId_idx" ON "FuelTank"("customerLocationId");

-- CreateIndex
CREATE INDEX "FuelTank_fuelTypeId_idx" ON "FuelTank"("fuelTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "FuelTank_organizationId_name_key" ON "FuelTank"("organizationId", "name");

-- CreateIndex
CREATE INDEX "FuelPolicy_organizationId_status_idx" ON "FuelPolicy"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelPolicy_name_idx" ON "FuelPolicy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FuelPolicy_organizationId_code_key" ON "FuelPolicy"("organizationId", "code");

-- CreateIndex
CREATE INDEX "FuelPolicyRule_fuelPolicyId_sequence_idx" ON "FuelPolicyRule"("fuelPolicyId", "sequence");

-- CreateIndex
CREATE INDEX "FuelPolicyRule_fuelTypeId_idx" ON "FuelPolicyRule"("fuelTypeId");

-- CreateIndex
CREATE INDEX "FuelRequest_organizationId_status_idx" ON "FuelRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelRequest_vehicleId_status_idx" ON "FuelRequest"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "FuelRequest_driverId_idx" ON "FuelRequest"("driverId");

-- CreateIndex
CREATE INDEX "FuelRequest_fuelTypeId_idx" ON "FuelRequest"("fuelTypeId");

-- CreateIndex
CREATE INDEX "FuelEntry_organizationId_status_idx" ON "FuelEntry"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_filledAt_idx" ON "FuelEntry"("vehicleId", "filledAt");

-- CreateIndex
CREATE INDEX "FuelEntry_driverId_idx" ON "FuelEntry"("driverId");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelTypeId_idx" ON "FuelEntry"("fuelTypeId");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelCardId_idx" ON "FuelEntry"("fuelCardId");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelTankId_idx" ON "FuelEntry"("fuelTankId");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelRequestId_idx" ON "FuelEntry"("fuelRequestId");

-- AddForeignKey
ALTER TABLE "FuelType" ADD CONSTRAINT "FuelType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelVendorProfile" ADD CONSTRAINT "FuelVendorProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelVendorProfile" ADD CONSTRAINT "FuelVendorProfile_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelCard" ADD CONSTRAINT "FuelCard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelCard" ADD CONSTRAINT "FuelCard_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelCard" ADD CONSTRAINT "FuelCard_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTank" ADD CONSTRAINT "FuelTank_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTank" ADD CONSTRAINT "FuelTank_customerLocationId_fkey" FOREIGN KEY ("customerLocationId") REFERENCES "CustomerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTank" ADD CONSTRAINT "FuelTank_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPolicy" ADD CONSTRAINT "FuelPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPolicyRule" ADD CONSTRAINT "FuelPolicyRule_fuelPolicyId_fkey" FOREIGN KEY ("fuelPolicyId") REFERENCES "FuelPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPolicyRule" ADD CONSTRAINT "FuelPolicyRule_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_fuelVendorProfileId_fkey" FOREIGN KEY ("fuelVendorProfileId") REFERENCES "FuelVendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_fuelCardId_fkey" FOREIGN KEY ("fuelCardId") REFERENCES "FuelCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_fuelVendorProfileId_fkey" FOREIGN KEY ("fuelVendorProfileId") REFERENCES "FuelVendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_fuelCardId_fkey" FOREIGN KEY ("fuelCardId") REFERENCES "FuelCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_fuelTankId_fkey" FOREIGN KEY ("fuelTankId") REFERENCES "FuelTank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_fuelRequestId_fkey" FOREIGN KEY ("fuelRequestId") REFERENCES "FuelRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
