-- CreateEnum
CREATE TYPE "ReportDefinitionType" AS ENUM ('VEHICLE_SUMMARY', 'DRIVER_SUMMARY', 'TRIP_SUMMARY', 'MAINTENANCE_SUMMARY', 'FUEL_SUMMARY', 'TRACKING_HEALTH_SUMMARY', 'ALERT_SUMMARY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReportExportJobStatus" AS ENUM ('PENDING', 'QUEUED', 'COMPLETED_PLACEHOLDER', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReportExportFormat" AS ENUM ('CSV', 'EXCEL_PLACEHOLDER', 'PDF_PLACEHOLDER', 'JSON');

-- CreateEnum
CREATE TYPE "DashboardWidgetType" AS ENUM ('VEHICLE_SUMMARY', 'DRIVER_SUMMARY', 'TRIP_SUMMARY', 'MAINTENANCE_SUMMARY', 'FUEL_SUMMARY', 'TRACKING_HEALTH_SUMMARY', 'ALERT_SUMMARY', 'CUSTOM');

-- AlterEnum
ALTER TYPE "BackgroundJobType" ADD VALUE 'REPORT_EXPORT_PLACEHOLDER';

-- CreateTable
CREATE TABLE "ReportCategory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reportType" "ReportDefinitionType" NOT NULL,
    "description" TEXT,
    "queryConfig" JSONB,
    "defaultFilters" JSONB,
    "columns" JSONB,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFilterPreset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportFilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "status" "ReportRunStatus" NOT NULL DEFAULT 'PENDING',
    "filters" JSONB,
    "resultSummary" JSONB,
    "rowCount" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "reportRunId" TEXT,
    "format" "ReportExportFormat" NOT NULL,
    "status" "ReportExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "requestedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidgetDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "widgetType" "DashboardWidgetType" NOT NULL,
    "config" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidgetDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCategory_organizationId_status_idx" ON "ReportCategory"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReportCategory_name_idx" ON "ReportCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCategory_organizationId_code_key" ON "ReportCategory"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ReportDefinition_organizationId_status_idx" ON "ReportDefinition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReportDefinition_categoryId_idx" ON "ReportDefinition"("categoryId");

-- CreateIndex
CREATE INDEX "ReportDefinition_reportType_idx" ON "ReportDefinition"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "ReportDefinition_organizationId_code_key" ON "ReportDefinition"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ReportFilterPreset_organizationId_status_idx" ON "ReportFilterPreset"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReportFilterPreset_reportDefinitionId_idx" ON "ReportFilterPreset"("reportDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportFilterPreset_organizationId_code_key" ON "ReportFilterPreset"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ReportRun_organizationId_status_idx" ON "ReportRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReportRun_reportDefinitionId_idx" ON "ReportRun"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportRun_triggeredByUserId_idx" ON "ReportRun"("triggeredByUserId");

-- CreateIndex
CREATE INDEX "ReportRun_createdAt_idx" ON "ReportRun"("createdAt");

-- CreateIndex
CREATE INDEX "ReportExportJob_organizationId_status_idx" ON "ReportExportJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ReportExportJob_reportDefinitionId_idx" ON "ReportExportJob"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportExportJob_reportRunId_idx" ON "ReportExportJob"("reportRunId");

-- CreateIndex
CREATE INDEX "ReportExportJob_requestedByUserId_idx" ON "ReportExportJob"("requestedByUserId");

-- CreateIndex
CREATE INDEX "DashboardWidgetDefinition_organizationId_status_idx" ON "DashboardWidgetDefinition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DashboardWidgetDefinition_widgetType_idx" ON "DashboardWidgetDefinition"("widgetType");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgetDefinition_organizationId_code_key" ON "DashboardWidgetDefinition"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_organizationId_snapshotAt_idx" ON "DashboardSnapshot"("organizationId", "snapshotAt");

-- AddForeignKey
ALTER TABLE "ReportCategory" ADD CONSTRAINT "ReportCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ReportCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFilterPreset" ADD CONSTRAINT "ReportFilterPreset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFilterPreset" ADD CONSTRAINT "ReportFilterPreset_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportJob" ADD CONSTRAINT "ReportExportJob_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "ReportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidgetDefinition" ADD CONSTRAINT "DashboardWidgetDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidgetDefinition" ADD CONSTRAINT "DashboardWidgetDefinition_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
