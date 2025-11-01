import { type Connect } from 'kiteconnect';
import { getEma, getMacd, getMidPrices } from './indicators';

export async function getIndicators(duration: "5minute" | "3minute" | "minute", instrument_token: number, kc: Connect): Promise<{ midPrices: number[], macd: number[], ema20s: number[] }> {
    const intervalMap = {
        "5minute": 1000 * 60 * 5,
        "3minute": 1000 * 60 * 3,
        "minute": 1000 * 60,
    };

    const startTime = new Date(Date.now() - intervalMap[duration]);
    const klines = await kc.getHistoricalData(instrument_token, duration, startTime, new Date());
    const midPrices = getMidPrices(klines);
    const macd = getMacd(midPrices).slice(-10);
    const ema20s = getEma(midPrices, 20);

    return {
        midPrices: midPrices.slice(-10).map(x => Number(x.toFixed(3))),
        macd: macd.slice(-10).map(x => Number(x.toFixed(3))),
        ema20s: ema20s.slice(-10).map(x => Number(x.toFixed(3))),
    }
}