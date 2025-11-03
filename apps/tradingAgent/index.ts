import { KiteConnect } from "kiteconnect";
import { apiKey, apiSecret } from "./config";
import { GoogleGenAI, Type } from "@google/genai";
import { PROMPT } from "./prompt";
import { buyStocks } from "./zerodha/buyStocks";
import { sellStocks } from "./zerodha/sellStocks";
import { MARKETS } from "./market";
import { getIndicators } from "./stockdata";
import { prisma } from "@ai-trading/db/client";
import { updatePortfolioSize } from "./priceTracker";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const kc = new KiteConnect({ api_key: apiKey! });

async function invokeTradingAgent() {
    const buyStock = {
        name: 'buy_stock',
        description: 'Buys a specified quantity of a stock.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                exchange: {
                    type: Type.STRING,
                    description: 'The exchange to buy the stock on.',
                },
                symbol: {
                    type: Type.STRING,
                    description: 'The stock symbol to buy.',
                },
                quantity: {
                    type: Type.NUMBER,
                    description: 'The number of shares to buy.',
                },
            },
            required: ['symbol', 'quantity', 'exchange'],
        },
    };

    const sellStock = {
        name: 'sell_stock',
        description: 'Sells a specified quantity of a stock.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                exchange: {
                    type: Type.STRING,
                    description: 'The exchange to sell the stock on.',
                },
                symbol: {
                    type: Type.STRING,
                    description: 'The stock symbol to sell.',
                },
                quantity: {
                    type: Type.NUMBER,
                    description: 'The number of shares to sell.',
                },
            },
            required: ['symbol', 'quantity', 'exchange'],
        },
    };

    const holdStock = {
        name: 'hold_stock',
        description: 'Hold the current position of a stock.',
    }

    const no_ideal_stocks = {
        name: 'no_ideal_stock',
        description: 'Indicates that there are no ideal stocks to trade at the moment.',
    }   

    const model = await prisma.models.update({
        where: {
            name: 'gemini-2.5-pro'
        },
        data: {
            invocationCount: {
                increment: 1
            }
        }
    });
    if (!model) {
        throw new Error("Model not found in database.");
    }

    const modelInvocation = await prisma.invocations.create({
        data: {
            modelId: model.id,
            response: '',
        },
    });

    let ALL_INDICATOR_DATA = "";
    for (const market of MARKETS) {
        const five_minute = await getIndicators("5minute", market.instrumentToken);
        const minute = await getIndicators("minute", market.instrumentToken);
        const three_minute = await getIndicators("3minute", market.instrumentToken);

        ALL_INDICATOR_DATA += `
        MARKET - ${market.exchange} | ${market.symbol}
        
        5m candles (oldest → latest):
        Mid prices - [${five_minute.midPrices.join(",")}]
        EMA20 - [${five_minute.ema20s.join(",")}]
        MACD - [${five_minute.macd.join(",")}]

        1m candles (oldest → latest):
        Mid prices - [${minute.midPrices.join(",")}]
        EMA20 - [${minute.ema20s.join(",")}]
        MACD - [${minute.macd.join(",")}]

        3m candles (oldest → latest):
        Mid prices - [${three_minute.midPrices.join(",")}]
        EMA20 - [${three_minute.ema20s.join(",")}]
        MACD - [${three_minute.macd.join(",")}]

        `;
    }

    const portfolio = await kc.getMargins();
    const openPositions = await kc.getHoldings();

    const enrichedPrompt = PROMPT.replace("{{INVOKATION_TIMES}}", model.invocationCount.toString())
    .replace("{{OPEN_POSITIONS}}", openPositions?.map((position) => `${position.tradingsymbol} ${position.exchange} ${position.pnl}`).join(", ") ?? "")
    .replace("{{ALL_INDICATOR_DATA}}", ALL_INDICATOR_DATA)
    .replace("{{AVAILABLE_CASH}}", `$${portfolio.equity?.available.cash ?? 0}`)
    .replace("{{CURRENT_ACCOUNT_VALUE}}", `$${portfolio.equity?.available.live_balance ?? 0}`)
    .replace("{{CURRENT_ACCOUNT_POSITIONS}}", JSON.stringify(openPositions))

    console.log("Enriched Prompt:", enrichedPrompt);

    // Send request with function declarations
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: enrichedPrompt,
        config: {
            tools: [{
                functionDeclarations: [buyStock, sellStock, holdStock, no_ideal_stocks]
            }],
            thinkingConfig: {
                thinkingBudget: -1,
                includeThoughts: true,
            }
        },
    });

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
        if (!part?.text) {
            continue;
        }
        else if (part.thought) {
            await prisma.invocations.update({
                where: { id: modelInvocation.id },
                data: { response: part.text },
            });
        }
    }

    if (response.functionCalls && response.functionCalls.length > 0) {
        console.log("Function call detected:", response.functionCalls);
        const functionCall = response.functionCalls[0]; 
        if (!functionCall) {
            throw new Error("No function call found in the response.");
        }
        console.log(`Function to call: ${functionCall?.name}`);
        console.log(`Arguments: ${JSON.stringify(functionCall?.args)}`);
        if (functionCall.name === 'buy_stock') {
            buyStocks(kc, functionCall.args?.exchange as string, functionCall.args?.symbol as string, functionCall.args?.quantity as number);
            await prisma.toolCalls.create({
                data: {
                    invocationId: modelInvocation.id,
                    toolCallType: 'BUY_STOCK',
                    metadata: JSON.stringify(functionCall.args)
                }
            })
        } else if (functionCall.name === 'sell_stock') {
            sellStocks(kc, functionCall.args?.exchange as string, functionCall.args?.symbol as string, functionCall.args?.quantity as number);
            await prisma.toolCalls.create({
                data: {
                    invocationId: modelInvocation.id,
                    toolCallType: 'SELL_STOCK',
                    metadata: JSON.stringify(functionCall.args)
                }
            })
        } else if (functionCall.name === 'hold_stock') {
            await prisma.toolCalls.create({
                data: {
                    invocationId: modelInvocation.id,
                    toolCallType: 'HOLD_STOCK',
                    metadata: "Holding current positions as per agent's decision."
                }
            })
            return;
        }
        else if (functionCall.name === 'no_ideal_stock') {
            await prisma.toolCalls.create({
                data: {
                    invocationId: modelInvocation.id,
                    toolCallType: 'NO_IDEA_STOCK',
                    metadata: "Agent decided there are no ideal stocks to trade at the moment."
                }
            })
            return;
        }
    } else {
        console.log("No function call found in the response.");
        console.log(response.text);
    }
}


async function main() {
    kc.setAccessToken(process.env.KITE_ACCESS_TOKEN!);
    setInterval(async () => {
        await invokeTradingAgent();
        await updatePortfolioSize(kc);
    }, 1000 * 60);
}

main();