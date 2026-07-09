-- CreateEnum
CREATE TYPE "VendorContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "lastSentAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "vendorCategoryId" TEXT;

-- CreateTable
CREATE TABLE "VendorCategory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorContract" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "VendorContractStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAreaLocation" (
    "id" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "customerLocationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAreaLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRouteGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRouteGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRouteGroupRoute" (
    "id" TEXT NOT NULL,
    "serviceRouteGroupId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRouteGroupRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRouteTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceRouteGroupId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRouteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRouteTemplateStop" (
    "id" TEXT NOT NULL,
    "serviceRouteTemplateId" TEXT NOT NULL,
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

    CONSTRAINT "ServiceRouteTemplateStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorCategory_organizationId_status_idx" ON "VendorCategory"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VendorCategory_name_idx" ON "VendorCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCategory_organizationId_code_key" ON "VendorCategory"("organizationId", "code");

-- CreateIndex
CREATE INDEX "VendorContract_vendorId_status_idx" ON "VendorContract"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorContract_vendorId_contractNumber_key" ON "VendorContract"("vendorId", "contractNumber");

-- CreateIndex
CREATE INDEX "ServiceArea_organizationId_status_idx" ON "ServiceArea"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ServiceArea_name_idx" ON "ServiceArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_organizationId_code_key" ON "ServiceArea"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ServiceAreaLocation_customerLocationId_idx" ON "ServiceAreaLocation"("customerLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAreaLocation_serviceAreaId_customerLocationId_key" ON "ServiceAreaLocation"("serviceAreaId", "customerLocationId");

-- CreateIndex
CREATE INDEX "ServiceRouteGroup_organizationId_status_idx" ON "ServiceRouteGroup"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ServiceRouteGroup_name_idx" ON "ServiceRouteGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRouteGroup_organizationId_code_key" ON "ServiceRouteGroup"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ServiceRouteGroupRoute_serviceRouteId_idx" ON "ServiceRouteGroupRoute"("serviceRouteId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRouteGroupRoute_serviceRouteGroupId_serviceRouteId_key" ON "ServiceRouteGroupRoute"("serviceRouteGroupId", "serviceRouteId");

-- CreateIndex
CREATE INDEX "ServiceRouteTemplate_organizationId_status_idx" ON "ServiceRouteTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ServiceRouteTemplate_serviceRouteGroupId_idx" ON "ServiceRouteTemplate"("serviceRouteGroupId");

-- CreateIndex
CREATE INDEX "ServiceRouteTemplate_name_idx" ON "ServiceRouteTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRouteTemplate_organizationId_code_key" ON "ServiceRouteTemplate"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ServiceRouteTemplateStop_serviceRouteTemplateId_isActive_idx" ON "ServiceRouteTemplateStop"("serviceRouteTemplateId", "isActive");

-- CreateIndex
CREATE INDEX "ServiceRouteTemplateStop_name_idx" ON "ServiceRouteTemplateStop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRouteTemplateStop_serviceRouteTemplateId_sequence_key" ON "ServiceRouteTemplateStop"("serviceRouteTemplateId", "sequence");

-- CreateIndex
CREATE INDEX "Vendor_vendorCategoryId_idx" ON "Vendor"("vendorCategoryId");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_vendorCategoryId_fkey" FOREIGN KEY ("vendorCategoryId") REFERENCES "VendorCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCategory" ADD CONSTRAINT "VendorCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContract" ADD CONSTRAINT "VendorContract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAreaLocation" ADD CONSTRAINT "ServiceAreaLocation_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAreaLocation" ADD CONSTRAINT "ServiceAreaLocation_customerLocationId_fkey" FOREIGN KEY ("customerLocationId") REFERENCES "CustomerLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteGroup" ADD CONSTRAINT "ServiceRouteGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteGroupRoute" ADD CONSTRAINT "ServiceRouteGroupRoute_serviceRouteGroupId_fkey" FOREIGN KEY ("serviceRouteGroupId") REFERENCES "ServiceRouteGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteGroupRoute" ADD CONSTRAINT "ServiceRouteGroupRoute_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteTemplate" ADD CONSTRAINT "ServiceRouteTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteTemplate" ADD CONSTRAINT "ServiceRouteTemplate_serviceRouteGroupId_fkey" FOREIGN KEY ("serviceRouteGroupId") REFERENCES "ServiceRouteGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRouteTemplateStop" ADD CONSTRAINT "ServiceRouteTemplateStop_serviceRouteTemplateId_fkey" FOREIGN KEY ("serviceRouteTemplateId") REFERENCES "ServiceRouteTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
