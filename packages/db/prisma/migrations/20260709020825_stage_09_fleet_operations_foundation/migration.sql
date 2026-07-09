-- CreateEnum
CREATE TYPE "ComplianceRecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssignmentPolicyRuleCode" AS ENUM ('VEHICLE_ACTIVE', 'DRIVER_ACTIVE', 'DRIVER_VALID_LICENSE', 'VEHICLE_VALID_DOCUMENTS', 'VEHICLE_ACTIVE_DEVICE', 'ACTIVE_ASSIGNMENT_REQUIRED', 'NO_OVERLAPPING_ACTIVE_ASSIGNMENT', 'SAME_ORGANIZATION', 'SAME_CUSTOMER', 'CUSTOM');

-- CreateTable
CREATE TABLE "FleetReadinessProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requireActiveVehicle" BOOLEAN NOT NULL DEFAULT true,
    "requireActiveDriver" BOOLEAN NOT NULL DEFAULT true,
    "requireValidVehicleDocuments" BOOLEAN NOT NULL DEFAULT false,
    "requireValidDriverLicense" BOOLEAN NOT NULL DEFAULT false,
    "requireActiveDevice" BOOLEAN NOT NULL DEFAULT false,
    "requireActiveAssignment" BOOLEAN NOT NULL DEFAULT false,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetReadinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleComplianceType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleComplianceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleComplianceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleComplianceTypeId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "ComplianceRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverComplianceType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverComplianceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverComplianceRecord" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverComplianceTypeId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "ComplianceRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentPolicyRule" (
    "id" TEXT NOT NULL,
    "assignmentPolicyId" TEXT NOT NULL,
    "ruleCode" "AssignmentPolicyRuleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "isBlocking" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentPolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FleetReadinessProfile_organizationId_status_idx" ON "FleetReadinessProfile"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FleetReadinessProfile_organizationId_name_key" ON "FleetReadinessProfile"("organizationId", "name");

-- CreateIndex
CREATE INDEX "VehicleComplianceType_organizationId_status_idx" ON "VehicleComplianceType"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VehicleComplianceType_name_idx" ON "VehicleComplianceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleComplianceType_organizationId_code_key" ON "VehicleComplianceType"("organizationId", "code");

-- CreateIndex
CREATE INDEX "VehicleComplianceRecord_vehicleId_status_idx" ON "VehicleComplianceRecord"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "VehicleComplianceRecord_vehicleComplianceTypeId_status_idx" ON "VehicleComplianceRecord"("vehicleComplianceTypeId", "status");

-- CreateIndex
CREATE INDEX "VehicleComplianceRecord_expiryDate_idx" ON "VehicleComplianceRecord"("expiryDate");

-- CreateIndex
CREATE INDEX "DriverComplianceType_organizationId_status_idx" ON "DriverComplianceType"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DriverComplianceType_name_idx" ON "DriverComplianceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DriverComplianceType_organizationId_code_key" ON "DriverComplianceType"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DriverComplianceRecord_driverId_status_idx" ON "DriverComplianceRecord"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverComplianceRecord_driverComplianceTypeId_status_idx" ON "DriverComplianceRecord"("driverComplianceTypeId", "status");

-- CreateIndex
CREATE INDEX "DriverComplianceRecord_expiryDate_idx" ON "DriverComplianceRecord"("expiryDate");

-- CreateIndex
CREATE INDEX "AssignmentPolicy_organizationId_status_idx" ON "AssignmentPolicy"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentPolicy_organizationId_name_key" ON "AssignmentPolicy"("organizationId", "name");

-- CreateIndex
CREATE INDEX "AssignmentPolicyRule_assignmentPolicyId_isActive_idx" ON "AssignmentPolicyRule"("assignmentPolicyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentPolicyRule_assignmentPolicyId_sequence_key" ON "AssignmentPolicyRule"("assignmentPolicyId", "sequence");

-- AddForeignKey
ALTER TABLE "FleetReadinessProfile" ADD CONSTRAINT "FleetReadinessProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleComplianceType" ADD CONSTRAINT "VehicleComplianceType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleComplianceRecord" ADD CONSTRAINT "VehicleComplianceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleComplianceRecord" ADD CONSTRAINT "VehicleComplianceRecord_vehicleComplianceTypeId_fkey" FOREIGN KEY ("vehicleComplianceTypeId") REFERENCES "VehicleComplianceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverComplianceType" ADD CONSTRAINT "DriverComplianceType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverComplianceRecord" ADD CONSTRAINT "DriverComplianceRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverComplianceRecord" ADD CONSTRAINT "DriverComplianceRecord_driverComplianceTypeId_fkey" FOREIGN KEY ("driverComplianceTypeId") REFERENCES "DriverComplianceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentPolicy" ADD CONSTRAINT "AssignmentPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentPolicyRule" ADD CONSTRAINT "AssignmentPolicyRule_assignmentPolicyId_fkey" FOREIGN KEY ("assignmentPolicyId") REFERENCES "AssignmentPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
