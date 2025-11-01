-- CreateEnum
CREATE TYPE "ToolCallType" AS ENUM ('BUY_STOCK', 'SELL_STOCK', 'HOLD_STOCK', 'NO_IDEA_STOCK');

-- CreateTable
CREATE TABLE "Invocations" (
    "id" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCalls" (
    "id" TEXT NOT NULL,
    "invocationId" TEXT NOT NULL,
    "toolCallType" "ToolCallType" NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolCalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSize" (
    "id" TEXT NOT NULL,
    "netPortfolio" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolCalls_invocationId_idx" ON "ToolCalls"("invocationId");

-- CreateIndex
CREATE INDEX "PortfolioSize_id_idx" ON "PortfolioSize"("id");

-- AddForeignKey
ALTER TABLE "ToolCalls" ADD CONSTRAINT "ToolCalls_invocationId_fkey" FOREIGN KEY ("invocationId") REFERENCES "Invocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
