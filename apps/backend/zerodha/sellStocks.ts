import type { Connect, Exchanges } from "kiteconnect";

export async function sellStocks(kc: Connect, exchange: Exchanges, tradingsymbol: string, quantity: number, order_type: "MARKET" | "LIMIT") {
    try {
        const holdings = await kc.getPositions();
        const currentHolding = holdings.net.find(holding => holding.tradingsymbol === tradingsymbol);
        if (!currentHolding || currentHolding.quantity < quantity) {
            throw new Error("Insufficient holdings");
        }
        const order_id = await kc.placeOrder("regular",{
            exchange: exchange,
            tradingsymbol: tradingsymbol,
            transaction_type: "SELL",
            quantity: quantity,
            order_type: order_type,
            product: "MIS",
        })
        //TODO: db calls to save order_id 
    } catch (error) {
        console.error("Error creating order:", error);
    }
}