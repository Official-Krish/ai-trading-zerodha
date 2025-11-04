import express from "express";
import cors from "cors";
import { prisma, type PortfolioSize } from "@ai-trading/db/client";

const app = express();
app.use(express.json());
app.use(cors());

let timeseriesDataGlobal: PortfolioSize[] = [];
let lastUpdatedGlobal: Date | null = null;
let invocationsCacheGlobal: any[] = [];
let invocationsLastUpdatedGlobal: Date | null = null;
let invocationsRefreshInFlight = false;

async function refreshInvocations(take: number) {
    if (invocationsRefreshInFlight) return;
    invocationsRefreshInFlight = true;
    try {
        const safeTake = Math.min(Math.max(take || 30, 1), 200);
        const invocations = await prisma.invocations.findMany({
            orderBy: { createdAt: "desc" },
            take: safeTake,
            include: {
                model: { select: { name: true } },
                toolCalls: {
                    select: { toolCallType: true, metadata: true, createdAt: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        invocationsCacheGlobal = invocations;
        invocationsLastUpdatedGlobal = new Date();
    } catch (err) {
        console.error("Error refreshing invocations:", err);
    } finally {
        invocationsRefreshInFlight = false;
    }
}

app.get("/performance", async (req, res) => {
    if (lastUpdatedGlobal && lastUpdatedGlobal.getTime() + 1000 * 60 * 5 > Date.now()) {
        res.json({data: timeseriesDataGlobal, lastUpdated: lastUpdatedGlobal});
        return;
    }
    const timeseriesData = await prisma.portfolioSize.findMany({
        orderBy: {
            createdAt: "asc",
        },
        include: {
            model: {
                select: { name: true, invocationCount: true },
            },
        },
    });
    timeseriesDataGlobal = timeseriesData;
    lastUpdatedGlobal = new Date();
    res.json({data: timeseriesDataGlobal, lastUpdated: lastUpdatedGlobal});
});

app.get("/invocations", async (req, res) => {
    const limitParam = Number(req.query.limit);
    const take = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200 ? limitParam : 30;
    const now = Date.now();
    const isFresh = invocationsLastUpdatedGlobal && invocationsLastUpdatedGlobal.getTime() + 1000 * 60 * 2 > now;

    if (!invocationsCacheGlobal.length) {
        await refreshInvocations(take);
        res.json({ data: invocationsCacheGlobal.slice(0, take), lastUpdated: invocationsLastUpdatedGlobal });
        return;
    }

    res.json({ data: invocationsCacheGlobal.slice(0, take), lastUpdated: invocationsLastUpdatedGlobal, stale: !isFresh });

    if (!isFresh && !invocationsRefreshInFlight) {
        void refreshInvocations(take);
    }
});

app.listen(3000, () => {
    console.log("Backend API server running on http://localhost:3000");
});