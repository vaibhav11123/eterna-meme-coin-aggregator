import { adjustIntervalData } from '../intervalFilter';
import { PriceData } from '../../types';

describe('Interval Filter', () => {
  const basePriceData: PriceData = {
    price: 100,
    volume24h: 2400000,
    liquidity: 1000000,
    marketCap: 5000000,
    priceChange24h: 2.4,
    priceChangePercent24h: 2.4,
    timestamp: Date.now(),
  };

  describe('adjustIntervalData', () => {
    it('should scale down volume for 1h interval', () => {
      const result = adjustIntervalData(basePriceData, '1h');
      expect(result.volume24h).toBe(100000); // 2400000 / 24
      expect(result.priceChange24h).toBe(0.1); // 2.4 / 24
      expect(result.priceChangePercent24h).toBe(0.1); // 2.4 / 24
    });

    it('should scale up volume for 7d interval', () => {
      const result = adjustIntervalData(basePriceData, '7d');
      expect(result.volume24h).toBe(16800000); // 2400000 * 7
      expect(result.priceChange24h).toBe(16.8); // 2.4 * 7
      expect(result.priceChangePercent24h).toBe(16.8); // 2.4 * 7
    });

    it('should return original data for 24h interval', () => {
      const result = adjustIntervalData(basePriceData, '24h');
      expect(result.volume24h).toBe(2400000);
      expect(result.priceChange24h).toBe(2.4);
      expect(result.priceChangePercent24h).toBe(2.4);
    });

    it('should handle default/unknown interval as 24h', () => {
      const result = adjustIntervalData(basePriceData, 'unknown' as any);
      expect(result.volume24h).toBe(2400000);
    });

    it('should handle zero values gracefully', () => {
      const zeroData: PriceData = {
        ...basePriceData,
        volume24h: 0,
        priceChange24h: 0,
        priceChangePercent24h: 0,
      };
      const result = adjustIntervalData(zeroData, '1h');
      expect(result.volume24h).toBe(0);
    });
  });
});

