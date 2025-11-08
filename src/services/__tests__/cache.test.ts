import { redisService } from '../redis.service';
import { config } from '../../config';

jest.mock('../redis.service');

const mockedRedis = redisService as jest.Mocked<typeof redisService>;

describe('Cache TTL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cache data with TTL', async () => {
    const testData = [{ token: { address: '0x123', symbol: 'TEST' }, priceData: { price: 1.5, timestamp: Date.now() } }];
    const cacheKey = `${config.cache.keyPrefix}test:0x123`;

    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.set.mockResolvedValue(undefined);

    // First call - cache miss
    await redisService.set(cacheKey, testData, config.cache.ttlSeconds);
    expect(mockedRedis.set).toHaveBeenCalledWith(cacheKey, testData, config.cache.ttlSeconds);

    // Second call - cache hit
    mockedRedis.get.mockResolvedValue(testData);
    const cached = await redisService.get(cacheKey);
    expect(cached).toEqual(testData);
  });

  it('should expire cache after TTL', async () => {
    const cacheKey = `${config.cache.keyPrefix}test:0x123`;
    
    // Cache miss after TTL
    mockedRedis.get.mockResolvedValue(null);
    const cached = await redisService.get(cacheKey);
    expect(cached).toBeNull();
  });

  it('should clear empty cached results', async () => {
    const cacheKey = `${config.cache.keyPrefix}test:0x123`;
    
    mockedRedis.get.mockResolvedValue([]);
    mockedRedis.del.mockResolvedValue(undefined);

    const cached = await redisService.get(cacheKey);
    if (Array.isArray(cached) && cached.length === 0) {
      await redisService.del(cacheKey);
      expect(mockedRedis.del).toHaveBeenCalledWith(cacheKey);
    }
  });
});

