import type { Connect } from "kiteconnect";

export async function sellStocks(kc: Connect) {
    try {
        const holdings = await kc.getPositions();
        for (const holding of holdings.net) {
            if (holding.quantity > 0) {
            const exchange = holding.exchange;
            const tradingsymbol = holding.tradingsymbol;
            const quantity = holding.quantity;

            if (!exchange.includes("NSE") && !exchange.includes("BSE") && !exchange.includes("NFO") && !exchange.includes("CDS") && !exchange.includes("BCD") && !exchange.includes("BFO") && !exchange.includes("MCX")) {
                console.warn(`Skipping invalid exchange: ${exchange}`);
                continue;
            }

            const exchanges = exchange as "NSE" | "BSE" | "NFO" | "CDS" | "BCD" | "BFO" | "MCX";
            try {
                const order_id = await kc.placeOrder("regular", {
                    exchange: exchanges,
                    tradingsymbol: tradingsymbol,
                    transaction_type: "SELL",
                    quantity: quantity,
                    order_type: "MARKET",
                    product: "MIS",
                });
                console.log(`Order placed successfully for ${tradingsymbol} with order_id: ${order_id}`);
            } catch (error) {
                console.error(`Error placing order for ${tradingsymbol}:`, error);
            }
            }
        }
        //TODO: db calls to save order_id 
    } catch (error) {
        console.error("Error creating order:", error);
    }
}