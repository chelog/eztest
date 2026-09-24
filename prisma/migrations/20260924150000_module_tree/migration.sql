-- Nested folders: a module can live inside another module.
-- Existing modules stay top level (parentId = NULL); no data changes.

-- Folder names only need to be unique among siblings now (enforced in the app)
DROP INDEX IF EXISTS "Module_projectId_name_key";

-- AlterTable
ALTER TABLE "Module" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Module_parentId_idx" ON "Module"("parentId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
