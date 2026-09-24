-- CreateTable
CREATE TABLE "TestRunStepCheck" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "testStepId" TEXT NOT NULL,
    "checkedById" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestRunStepCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestRunStepCheck_testRunId_testStepId_key" ON "TestRunStepCheck"("testRunId", "testStepId");
CREATE INDEX "TestRunStepCheck_testRunId_idx" ON "TestRunStepCheck"("testRunId");
CREATE INDEX "TestRunStepCheck_testStepId_idx" ON "TestRunStepCheck"("testStepId");

-- AddForeignKey
ALTER TABLE "TestRunStepCheck" ADD CONSTRAINT "TestRunStepCheck_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestRunStepCheck" ADD CONSTRAINT "TestRunStepCheck_testStepId_fkey" FOREIGN KEY ("testStepId") REFERENCES "TestStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestRunStepCheck" ADD CONSTRAINT "TestRunStepCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
