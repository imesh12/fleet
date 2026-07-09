-- CreateEnum
CREATE TYPE "DriverGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "DriverEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'OUTSOURCED', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DriverLicenseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DriverDocumentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DriverVehicleAssignmentType" AS ENUM ('PRIMARY', 'SECONDARY', 'TEMPORARY', 'RELIEF', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverVehicleAssignmentStatus" AS ENUM ('ACTIVE', 'ENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "DriverGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverSkill" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT,
    "departmentId" TEXT,
    "businessUnitId" TEXT,
    "driverGroupId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "DriverGender",
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "hireDate" TIMESTAMP(3),
    "employmentType" "DriverEmploymentType",
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverSkillAssignment" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverSkillId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverSkillAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLicense" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "issuingCountry" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "DriverLicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "status" "DriverDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverVehicleAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignmentType" "DriverVehicleAssignmentType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "DriverVehicleAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverVehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverGroup_organizationId_status_idx" ON "DriverGroup"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DriverGroup_name_idx" ON "DriverGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DriverGroup_organizationId_code_key" ON "DriverGroup"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DriverSkill_organizationId_status_idx" ON "DriverSkill"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DriverSkill_name_idx" ON "DriverSkill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DriverSkill_organizationId_code_key" ON "DriverSkill"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Driver_organizationId_status_idx" ON "Driver"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Driver_organizationId_driverGroupId_idx" ON "Driver"("organizationId", "driverGroupId");

-- CreateIndex
CREATE INDEX "Driver_organizationId_customerAccountId_idx" ON "Driver"("organizationId", "customerAccountId");

-- CreateIndex
CREATE INDEX "Driver_organizationId_firstName_lastName_idx" ON "Driver"("organizationId", "firstName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_organizationId_employeeNumber_key" ON "Driver"("organizationId", "employeeNumber");

-- CreateIndex
CREATE INDEX "DriverSkillAssignment_driverSkillId_idx" ON "DriverSkillAssignment"("driverSkillId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverSkillAssignment_driverId_driverSkillId_key" ON "DriverSkillAssignment"("driverId", "driverSkillId");

-- CreateIndex
CREATE INDEX "DriverLicense_driverId_status_idx" ON "DriverLicense"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverLicense_expiryDate_idx" ON "DriverLicense"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DriverLicense_driverId_licenseNumber_key" ON "DriverLicense"("driverId", "licenseNumber");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_status_idx" ON "DriverDocument"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverDocument_expiryDate_idx" ON "DriverDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "DriverDocument_documentType_idx" ON "DriverDocument"("documentType");

-- CreateIndex
CREATE INDEX "DriverVehicleAssignment_organizationId_status_idx" ON "DriverVehicleAssignment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DriverVehicleAssignment_driverId_status_idx" ON "DriverVehicleAssignment"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverVehicleAssignment_vehicleId_status_idx" ON "DriverVehicleAssignment"("vehicleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DriverVehicleAssignment_driverId_vehicleId_startDate_key" ON "DriverVehicleAssignment"("driverId", "vehicleId", "startDate");

-- AddForeignKey
ALTER TABLE "DriverGroup" ADD CONSTRAINT "DriverGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverSkill" ADD CONSTRAINT "DriverSkill_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_driverGroupId_fkey" FOREIGN KEY ("driverGroupId") REFERENCES "DriverGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverSkillAssignment" ADD CONSTRAINT "DriverSkillAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverSkillAssignment" ADD CONSTRAINT "DriverSkillAssignment_driverSkillId_fkey" FOREIGN KEY ("driverSkillId") REFERENCES "DriverSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLicense" ADD CONSTRAINT "DriverLicense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
