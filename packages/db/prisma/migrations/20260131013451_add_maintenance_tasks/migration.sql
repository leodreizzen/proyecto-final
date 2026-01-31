-- CreateEnum
CREATE TYPE "MaintenanceTaskType" AS ENUM ('EVALUATE_IMPACT', 'PROCESS_ADVANCED_CHANGES', 'CALCULATE_EMBEDDINGS');

-- CreateEnum
CREATE TYPE "MaintenanceTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" "MaintenanceTaskType" NOT NULL,
    "status" "MaintenanceTaskStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionId" UUID NOT NULL,
    "triggerEventId" TEXT NOT NULL,
    "payload" JSONB,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceTask_status_idx" ON "MaintenanceTask"("status");

-- CreateIndex
CREATE INDEX "MaintenanceTask_triggerEventId_idx" ON "MaintenanceTask"("triggerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceTask_resolutionId_type_triggerEventId_key" ON "MaintenanceTask"("resolutionId", "type", "triggerEventId");

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheck
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_status_errorMsg_check" CHECK (status = 'FAILED' OR "errorMsg" IS NULL);
