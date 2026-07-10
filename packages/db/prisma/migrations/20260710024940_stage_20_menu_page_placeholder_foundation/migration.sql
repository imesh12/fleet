-- CreateEnum
CREATE TYPE "NavigationStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'COMING_SOON', 'DISABLED');

-- CreateEnum
CREATE TYPE "FeatureRolloutStatus" AS ENUM ('PLANNED', 'PREVIEW', 'ENABLED', 'DISABLED');

-- CreateTable
CREATE TABLE "AppMenuGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "NavigationStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiredPermission" TEXT,
    "moduleKey" TEXT NOT NULL,
    "description" TEXT,
    "comingSoonMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMenuGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppMenuItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "menuGroupId" TEXT,
    "parentId" TEXT,
    "appPageId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "NavigationStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiredPermission" TEXT,
    "moduleKey" TEXT NOT NULL,
    "description" TEXT,
    "comingSoonMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppPage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "status" "NavigationStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiredPermission" TEXT,
    "moduleKey" TEXT NOT NULL,
    "description" TEXT,
    "comingSoonMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutStatus" "FeatureRolloutStatus" NOT NULL DEFAULT 'PLANNED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppMenuGroup_organizationId_status_idx" ON "AppMenuGroup"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AppMenuGroup_moduleKey_idx" ON "AppMenuGroup"("moduleKey");

-- CreateIndex
CREATE INDEX "AppMenuGroup_sortOrder_idx" ON "AppMenuGroup"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AppMenuGroup_organizationId_slug_key" ON "AppMenuGroup"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "AppMenuItem_organizationId_status_idx" ON "AppMenuItem"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AppMenuItem_menuGroupId_sortOrder_idx" ON "AppMenuItem"("menuGroupId", "sortOrder");

-- CreateIndex
CREATE INDEX "AppMenuItem_parentId_idx" ON "AppMenuItem"("parentId");

-- CreateIndex
CREATE INDEX "AppMenuItem_moduleKey_idx" ON "AppMenuItem"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppMenuItem_organizationId_slug_key" ON "AppMenuItem"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "AppPage_organizationId_status_idx" ON "AppPage"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AppPage_parentId_idx" ON "AppPage"("parentId");

-- CreateIndex
CREATE INDEX "AppPage_moduleKey_idx" ON "AppPage"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppPage_organizationId_slug_key" ON "AppPage"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "FeatureFlag_organizationId_enabled_idx" ON "FeatureFlag"("organizationId", "enabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_rolloutStatus_idx" ON "FeatureFlag"("rolloutStatus");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_organizationId_key_key" ON "FeatureFlag"("organizationId", "key");

-- AddForeignKey
ALTER TABLE "AppMenuGroup" ADD CONSTRAINT "AppMenuGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMenuItem" ADD CONSTRAINT "AppMenuItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMenuItem" ADD CONSTRAINT "AppMenuItem_menuGroupId_fkey" FOREIGN KEY ("menuGroupId") REFERENCES "AppMenuGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMenuItem" ADD CONSTRAINT "AppMenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AppMenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMenuItem" ADD CONSTRAINT "AppMenuItem_appPageId_fkey" FOREIGN KEY ("appPageId") REFERENCES "AppPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppPage" ADD CONSTRAINT "AppPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppPage" ADD CONSTRAINT "AppPage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AppPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
