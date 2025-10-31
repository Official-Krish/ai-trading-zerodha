import { KiteConnect } from "kiteconnect";
import { apiKey, apiSecret, requestToken } from "./config";

const kc = new KiteConnect({ api_key: apiKey! });

console.log(kc.getLoginURL());

export async function generateSession() {
    try {
        const response = await kc.generateSession(requestToken!, apiSecret!);
        console.log(response.access_token);
        kc.setAccessToken(response.access_token);
        console.log('Session generated:', response);
    } catch (err) {
        console.error('Error generating session:', err);
    }
}