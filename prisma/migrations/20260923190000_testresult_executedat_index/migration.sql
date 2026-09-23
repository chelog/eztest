-- Speeds up period-based project statistics (executedAt >= from)
CREATE INDEX "TestResult_executedAt_idx" ON "TestResult"("executedAt");
