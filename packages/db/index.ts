import { PrismaClient } from "./generated/prisma/client"

export const prisma = new PrismaClient();
export type { PortfolioSize } from "./generated/prisma/client"