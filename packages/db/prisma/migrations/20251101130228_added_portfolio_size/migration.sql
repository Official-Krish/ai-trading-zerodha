/*
  Warnings:

  - Added the required column `modelId` to the `PortfolioSize` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."PortfolioSize_id_idx";

-- AlterTable
ALTER TABLE "PortfolioSize" ADD COLUMN     "modelId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PortfolioSize_modelId_idx" ON "PortfolioSize"("modelId");

-- AddForeignKey
ALTER TABLE "PortfolioSize" ADD CONSTRAINT "PortfolioSize_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
