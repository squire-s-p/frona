-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "recurrenceRule" TEXT;

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
