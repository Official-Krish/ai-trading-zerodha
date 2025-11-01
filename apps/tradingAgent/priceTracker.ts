import { prisma } from "@ai-trading/db/client";
import type { Connect } from "kiteconnect";

export async function updatePortfolioSize(kc: Connect) {
    const model = await prisma.models.findFirst({
        where: {
            name: 'gemini-2.5-pro'
        }
    });
    if (!model) {
        throw new Error("Model not found in database.");
    }

    const portfolio = await kc.getMargins();
    await prisma.portfolioSize.create({
        data: {
            modelId: model.id,
            netPortfolio: (portfolio.equity?.available.live_balance)?.toString() || "0",
        }
    });
}