import type { Connect, Exchanges } from "kiteconnect";

export async function buyStocks(kc: Connect, exchange: string, tradingsymbol: string, quantity: number) {
    try {
        if(!exchange.includes("NSE") && !exchange.includes("BSE") && !exchange.includes("NFO") && !exchange.includes("CDS") && !exchange.includes("BCD") && !exchange.includes("BFO") && !exchange.includes("MCX")) {
            throw new Error(`Invalid exchange: ${exchange}`);
        }
        const exchanges = exchange as "NSE" | "BSE" | "NFO" | "CDS" | "BCD" | "BFO" | "MCX";
        const order_id = await kc.placeOrder("regular",{
            exchange: exchanges,
            tradingsymbol: tradingsymbol,
            transaction_type: "BUY",
            quantity: quantity,
            order_type: "MARKET",
            product: "MIS",
        })
        //TODO: db calls to save order_id 
    } catch (error) {
        console.error("Error creating order:", error);
    }
}