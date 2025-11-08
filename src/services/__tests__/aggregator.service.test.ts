import { AggregatorService } from '../aggregator.service';
import { dexscreenerClient } from '../../clients/dexscreener.client';
import { geckoterminalClient } from '../../clients/geckoterminal.client';
import { redisService } from '../redis.service';
import { MemeCoinData } from '../../types';

jest.mock('../../clients/dexscreener.client');
jest.mock('../../clients/geckoterminal.client');
jest.mock('../redis.service');

const mockedDexScreener = dexscreenerClient as jest.Mocked<typeof dexscreenerClient>;
const mockedGeckoTerminal = geckoterminalClient as jest.Mocked<typeof geckoterminalClient>;
const mockedRedis = redisService as jest.Mocked<typeof redisService>;

describe('AggregatorService', () => {
  let service: AggregatorService;

  beforeEach(() => {
    service = new AggregatorService();
    jest.clearAllMocks();
  });

  describe('aggregateTokenData', () => {
    it('should merge data from multiple sources', async () => {
      const dexscreenerData: MemeCoinData[] = [
        {
          token: { address: '0xabc', symbol: 'TEST', name: 'Test Token' },
          priceData: { price: 1.5, volume24h: 1000000, timestamp: Date.now() },
          source: 'dexscreener',
          chain: 'ethereum',
        },
      ];

      const geckoterminalData: MemeCoinData[] = [
        {
          token: { address: '0xabc', symbol: 'TEST', name: 'Test Token' },
          priceData: { price: 1.6, volume24h: 500000, timestamp: Date.now() },
          source: 'geckoterminal',
          chain: 'ethereum',
        },
      ];

      mockedRedis.get.mockResolvedValue(null);
      mockedDexScreener.getTokenPairs.mockResolvedValue(dexscreenerData);
      mockedGeckoTerminal.getTokenData.mockResolvedValue(geckoterminalData[0]);

      const result = await service.aggregateTokenData(['0xabc']);

      expect(result).toHaveLength(1);
      expect(result[0].sources).toContain('dexscreener');
      expect(result[0].sources).toContain('geckoterminal');
      expect(result[0].averagePrice).toBeCloseTo(1.55);
      expect(result[0].totalVolume24h).toBe(1500000);
    });

    it('should return cached data if available', async () => {
      const cachedData = [
        {
          token: { address: '0xabc', symbol: 'TEST', name: 'Test Token' },
          priceData: { price: 1.5, timestamp: Date.now() },
          sources: ['dexscreener'],
          chains: ['ethereum'],
          pairAddresses: [],
          bestPrice: 1.5,
          averagePrice: 1.5,
          totalVolume24h: 1000000,
          totalLiquidity: 500000,
          lastUpdated: Date.now(),
        },
      ];

      mockedRedis.get.mockResolvedValue(cachedData);

      const result = await service.aggregateTokenData(['0xabc']);

      expect(result).toEqual(cachedData);
      expect(mockedDexScreener.getTokenPairs).not.toHaveBeenCalled();
    });
  });

  describe('searchTokens', () => {
    it('should search and aggregate tokens', async () => {
      const dexscreenerResults: MemeCoinData[] = [
        {
          token: { address: '0xabc', symbol: 'PEPE', name: 'Pepe Token' },
          priceData: { price: 0.001, timestamp: Date.now() },
          source: 'dexscreener',
        },
      ];

      mockedRedis.get.mockResolvedValue(null);
      mockedDexScreener.searchTokens.mockResolvedValue(dexscreenerResults);
      mockedGeckoTerminal.searchTokens.mockResolvedValue([]);

      const result = await service.searchTokens('pepe');

      expect(result).toHaveLength(1);
      expect(result[0].token.symbol).toBe('PEPE');
    });
  });
});

