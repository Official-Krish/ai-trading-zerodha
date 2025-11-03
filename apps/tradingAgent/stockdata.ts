import { getEma, getMacd, getMidPrices } from './indicators';
import axios from 'axios';

export async function getIndicators(duration: "5minute" | "3minute" | "minute", instrument_token: number): Promise<{ midPrices: number[], macd: number[], ema20s: number[] }> {
    try {
        const intervalMap = {
            "5minute": 1000 * 60 * 5,
            "3minute": 1000 * 60 * 3,
            "minute": 1000 * 60,
        };

        const startTime = new Date(Date.now() - intervalMap[duration]);
    
        const klines = await axios.get(`https://kite.zerodha.com/oms/instruments/historical/${instrument_token}/${duration}?user_id=${process.env.KITE_USER_ID}&oi=1&from=${(startTime.toISOString()).slice(0, 10)}&to=${(new Date().toISOString()).slice(0, 10)}`, {
            headers: {
                Authorization: process.env.KITE_AUTH_TOKEN!,
            }
        })
        const midPrices = getMidPrices(klines.data.data.candles);
        const macd = getMacd(midPrices).slice(-10);
        const ema20s = getEma(midPrices, 20);

        return {
            midPrices: midPrices.slice(-10).map(x => Number(x.toFixed(3))),
            macd: macd.slice(-10).map(x => Number(x.toFixed(3))),
            ema20s: ema20s.slice(-10).map(x => Number(x.toFixed(3))),
        }
    } catch (error) {
        console.error("Error fetching indicators:", error);
        throw error;
    }
}