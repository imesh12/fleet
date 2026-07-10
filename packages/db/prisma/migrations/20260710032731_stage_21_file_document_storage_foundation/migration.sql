-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('LOCAL', 'S3_PLACEHOLDER', 'GCS_PLACEHOLDER', 'AZURE_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "FileObjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'ORGANIZATION', 'PUBLIC_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "FileAttachmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "BackgroundJobType" ADD VALUE 'DOCUMENT_RETENTION_EVALUATION';

-- CreateTable
CREATE TABLE "StorageProvider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "providerType" "StorageProviderType" NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageBucket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "storageProviderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileObject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bucketId" TEXT,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" "FileObjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdByUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVersion" (
    "id" TEXT NOT NULL,
    "fileObjectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAccessLog" (
    "id" TEXT NOT NULL,
    "fileObjectId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileObjectId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "attachmentType" TEXT NOT NULL,
    "description" TEXT,
    "status" "FileAttachmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRetentionPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "entityType" TEXT,
    "retentionDays" INTEGER NOT NULL,
    "archiveAfterDays" INTEGER,
    "description" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageProvider_organizationId_status_idx" ON "StorageProvider"("organizationId", "status");

-- CreateIndex
CREATE INDEX "StorageProvider_providerType_idx" ON "StorageProvider"("providerType");

-- CreateIndex
CREATE UNIQUE INDEX "StorageProvider_organizationId_code_key" ON "StorageProvider"("organizationId", "code");

-- CreateIndex
CREATE INDEX "StorageBucket_organizationId_status_idx" ON "StorageBucket"("organizationId", "status");

-- CreateIndex
CREATE INDEX "StorageBucket_storageProviderId_idx" ON "StorageBucket"("storageProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageBucket_organizationId_code_key" ON "StorageBucket"("organizationId", "code");

-- CreateIndex
CREATE INDEX "FileObject_organizationId_status_idx" ON "FileObject"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FileObject_bucketId_idx" ON "FileObject"("bucketId");

-- CreateIndex
CREATE INDEX "FileObject_createdByUserId_idx" ON "FileObject"("createdByUserId");

-- CreateIndex
CREATE INDEX "FileObject_originalFileName_idx" ON "FileObject"("originalFileName");

-- CreateIndex
CREATE INDEX "FileVersion_fileObjectId_idx" ON "FileVersion"("fileObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_fileObjectId_versionNumber_key" ON "FileVersion"("fileObjectId", "versionNumber");

-- CreateIndex
CREATE INDEX "FileAccessLog_fileObjectId_createdAt_idx" ON "FileAccessLog"("fileObjectId", "createdAt");

-- CreateIndex
CREATE INDEX "FileAccessLog_userId_idx" ON "FileAccessLog"("userId");

-- CreateIndex
CREATE INDEX "FileAccessLog_action_idx" ON "FileAccessLog"("action");

-- CreateIndex
CREATE INDEX "FileAttachment_organizationId_entityType_entityId_idx" ON "FileAttachment"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "FileAttachment_fileObjectId_idx" ON "FileAttachment"("fileObjectId");

-- CreateIndex
CREATE INDEX "FileAttachment_status_idx" ON "FileAttachment"("status");

-- CreateIndex
CREATE INDEX "DocumentRetentionPolicy_organizationId_status_idx" ON "DocumentRetentionPolicy"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DocumentRetentionPolicy_entityType_idx" ON "DocumentRetentionPolicy"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRetentionPolicy_organizationId_code_key" ON "DocumentRetentionPolicy"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "StorageProvider" ADD CONSTRAINT "StorageProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageBucket" ADD CONSTRAINT "StorageBucket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageBucket" ADD CONSTRAINT "StorageBucket_storageProviderId_fkey" FOREIGN KEY ("storageProviderId") REFERENCES "StorageProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "StorageBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_fileObjectId_fkey" FOREIGN KEY ("fileObjectId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessLog" ADD CONSTRAINT "FileAccessLog_fileObjectId_fkey" FOREIGN KEY ("fileObjectId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessLog" ADD CONSTRAINT "FileAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_fileObjectId_fkey" FOREIGN KEY ("fileObjectId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRetentionPolicy" ADD CONSTRAINT "DocumentRetentionPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
