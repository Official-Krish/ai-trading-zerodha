/*
  Warnings:

  - You are about to drop the column `modelName` on the `Invocations` table. All the data in the column will be lost.
  - Added the required column `modelId` to the `Invocations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invocations" DROP COLUMN "modelName",
ADD COLUMN     "modelId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invocationCount" INTEGER NOT NULL DEFAULT 0,
    "accountIndex" TEXT NOT NULL,

    CONSTRAINT "Models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Models_name_key" ON "Models"("name");

-- CreateIndex
CREATE INDEX "Models_name_idx" ON "Models"("name");

-- AddForeignKey
ALTER TABLE "Invocations" ADD CONSTRAINT "Invocations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
