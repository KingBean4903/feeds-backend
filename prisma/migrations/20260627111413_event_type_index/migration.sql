-- DropIndex
DROP INDEX "outbox_status_createdAt_idx";

-- AlterTable
ALTER TABLE "outbox" ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "outbox_status_createdAt_eventType_idx" ON "outbox"("status", "createdAt", "eventType");
