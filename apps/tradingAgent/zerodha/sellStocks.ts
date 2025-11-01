import type { Connect, Exchanges } from "kiteconnect";

export async function sellStocks(kc: Connect, exchange: string, tradingsymbol: string, quantity: number) {
    try {
        const holdings = await kc.getPositions();
        const currentHolding = holdings.net.find(holding => holding.tradingsymbol === tradingsymbol);
        if (!currentHolding || currentHolding.quantity < quantity) {
            throw new Error("Insufficient holdings");
        }
        if(!exchange.includes("NSE") && !exchange.includes("BSE") && !exchange.includes("NFO") && !exchange.includes("CDS") && !exchange.includes("BCD") && !exchange.includes("BFO") && !exchange.includes("MCX")) {
            throw new Error(`Invalid exchange: ${exchange}`);
        }
        const exchanges = exchange as "NSE" | "BSE" | "NFO" | "CDS" | "BCD" | "BFO" | "MCX";
        const order_id = await kc.placeOrder("regular",{
            exchange: exchanges,
            tradingsymbol: tradingsymbol,
            transaction_type: "SELL",
            quantity: quantity,
            order_type: "MARKET",
            product: "MIS",
        })
        //TODO: db calls to save order_id 
    } catch (error) {
        console.error("Error creating order:", error);
    }
}