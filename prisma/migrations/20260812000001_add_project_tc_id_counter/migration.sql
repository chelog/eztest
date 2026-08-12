-- AlterTable: add monotonic tcId counter to Project for atomic, non-reusing TC-N allocation
ALTER TABLE "Project" ADD COLUMN "tcIdCounter" INTEGER NOT NULL DEFAULT 0;
