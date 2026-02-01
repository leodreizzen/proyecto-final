-- AlterTable
ALTER TABLE "MaintenanceTask" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "MaintenanceTask_order_id_idx" ON "MaintenanceTask"("order", "id");
