import { DexScreenerClient } from '../dexscreener.client';
import axios from 'axios';
import { redisService } from '../../services/redis.service';

jest.mock('axios');
jest.mock('../../services/redis.service');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedRedis = redisService as jest.Mocked<typeof redisService>;

describe('DexScreenerClient', () => {
  let client: DexScreenerClient;

  beforeEach(() => {
    client = new DexScreenerClient();
    jest.clearAllMocks();
  });

  describe('getTokenPairs', () => {
    it('should fetch and transform token pairs', async () => {
      const mockResponse = {
        data: {
          pairs: [
            {
              chainId: 'ethereum',
              dexId: 'uniswap',
              pairAddress: '0x123',
              baseToken: {
                address: '0xabc',
                name: 'Test Token',
                symbol: 'TEST',
              },
              quoteToken: {
                address: '0xdef',
                name: 'WETH',
                symbol: 'WETH',
              },
              priceUsd: '1.5',
              priceChange: { h24: 0.1 },
              volume: { h24: 1000000 },
              liquidity: { usd: 500000 },
              fdv: 10000000,
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      } as unknown as ReturnType<typeof axios.create>);

      mockedRedis.get.mockResolvedValue(null);
      mockedRedis.set.mockResolvedValue(undefined);

      const result = await client.getTokenPairs(['0xabc']);

      expect(result).toHaveLength(1);
      expect(result[0].token.symbol).toBe('TEST');
      expect(result[0].priceData.price).toBe(1.5);
      expect(result[0].source).toBe('dexscreener');
    });

    it('should return cached data if available', async () => {
      const cachedData = [
        {
          token: { address: '0xabc', symbol: 'TEST', name: 'Test Token' },
          priceData: { price: 1.5, timestamp: Date.now() },
          source: 'dexscreener' as const,
        },
      ];

      mockedRedis.get.mockResolvedValue(cachedData);

      const result = await client.getTokenPairs(['0xabc']);

      expect(result).toEqual(cachedData);
      expect(mockedAxios.create).not.toHaveBeenCalled();
    });
  });
});

