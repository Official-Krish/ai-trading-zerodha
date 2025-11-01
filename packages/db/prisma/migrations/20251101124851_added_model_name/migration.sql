/*
  Warnings:

  - Added the required column `modelName` to the `Invocations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invocations" ADD COLUMN     "modelName" TEXT NOT NULL;
