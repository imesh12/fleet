-- CreateEnum
CREATE TYPE "BackgroundJobScheduleType" AS ENUM ('MANUAL', 'INTERVAL', 'CRON');

-- CreateEnum
CREATE TYPE "BackgroundJobBackoffStrategy" AS ENUM ('NONE', 'FIXED', 'EXPONENTIAL');

-- AlterTable
ALTER TABLE "BackgroundJobDefinition" ADD COLUMN     "backoffStrategy" "BackgroundJobBackoffStrategy" NOT NULL DEFAULT 'EXPONENTIAL',
ADD COLUMN     "cronExpression" TEXT,
ADD COLUMN     "intervalSeconds" INTEGER,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "scheduleType" "BackgroundJobScheduleType" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "NotificationDelivery" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "providerResponse" JSONB;

-- CreateIndex
CREATE INDEX "BackgroundJobDefinition_scheduleType_status_nextRunAt_idx" ON "BackgroundJobDefinition"("scheduleType", "status", "nextRunAt");

-- CreateIndex
CREATE INDEX "BackgroundJobDefinition_lockedAt_idx" ON "BackgroundJobDefinition"("lockedAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt");
