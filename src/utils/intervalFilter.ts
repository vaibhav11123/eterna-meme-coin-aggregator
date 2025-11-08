import { PriceData } from '../types';

/**
 * Adjusts price data based on time interval
 * Since APIs only provide 24h data, we scale it for 1h and 7d intervals
 */
export function adjustIntervalData(priceData: PriceData, interval: string): PriceData {
  switch (interval) {
    case '1h':
      return {
        ...priceData,
        volume24h: (priceData.volume24h || 0) / 24,
        priceChange24h: (priceData.priceChange24h || 0) / 24,
        priceChangePercent24h: (priceData.priceChangePercent24h || 0) / 24,
      };
    case '7d':
      return {
        ...priceData,
        volume24h: (priceData.volume24h || 0) * 7,
        priceChange24h: (priceData.priceChange24h || 0) * 7,
        priceChangePercent24h: (priceData.priceChangePercent24h || 0) * 7,
      };
    case '24h':
    default:
      return priceData;
  }
}

