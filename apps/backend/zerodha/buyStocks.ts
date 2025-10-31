import type { Connect, Exchanges } from "kiteconnect";

export async function buyStocks(kc: Connect, exchange: Exchanges, tradingsymbol: string, quantity: number, order_type: "MARKET" | "LIMIT") {
    try {
        const order_id = await kc.placeOrder("regular",{
            exchange: exchange,
            tradingsymbol: tradingsymbol,
            transaction_type: "BUY",
            quantity: quantity,
            order_type: order_type,
            product: "MIS",
        })
        //TODO: db calls to save order_id 
    } catch (error) {
        console.error("Error creating order:", error);
    }
}