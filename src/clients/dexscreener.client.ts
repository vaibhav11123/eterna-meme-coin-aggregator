import axios from 'axios';
import https from 'https';
import { config } from '../config';
import { logger } from '../utils/logger';
import { DexScreenerResponse, MemeCoinData } from '../types';
import { redisService } from '../services/redis.service';

export class DexScreenerClient {
  private client: ReturnType<typeof axios.create>;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: config.dexscreener.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Handle SSL certificate issues in development
      ...(config.server.nodeEnv === 'development' && {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }),
    });

    // Reset rate limit counter every minute
    setInterval(() => {
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }, 60000);
  }

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    if (now - this.lastResetTime >= windowMs) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= config.dexscreener.rateLimitPerMinute) {
      logger.warn('DexScreener rate limit reached');
      return false;
    }

    this.requestCount++;
    return true;
  }

  async getTokenPairs(tokenAddresses: string[]): Promise<MemeCoinData[]> {
    const results: MemeCoinData[] = [];

    // Fetch each address individually to handle errors gracefully
    for (const address of tokenAddresses) {
      if (!(await this.checkRateLimit())) {
        logger.warn('DexScreener rate limit reached, skipping remaining requests');
        break;
      }

      try {
        const cacheKey = `${config.cache.keyPrefix}dexscreener:${address}`;

        // Check cache first
        const cached = await redisService.get<MemeCoinData[]>(cacheKey);
        if (cached) {
          logger.debug(`DexScreener cache hit for ${address}`);
          results.push(...cached);
          continue;
        }

        logger.info(`Fetching from DexScreener for address: ${address}`);
        const url = `${config.dexscreener.baseUrl}/tokens/${address}`;
        logger.debug(`DexScreener URL: ${url}`);

        // Retry with exponential backoff
        let response;
        let attempt = 0;
        const maxAttempts = 3;
        
        while (attempt < maxAttempts) {
          try {
            const fullUrl = `${config.dexscreener.baseUrl}/tokens/${address}`;
            logger.debug(`Attempting DexScreener request ${attempt + 1}/${maxAttempts} to: ${fullUrl}`);
            
            response = await this.client.get<DexScreenerResponse>(
              `/tokens/${address}`,
              { 
                timeout: 8000,
                validateStatus: (status: number) => status < 500, // Don't throw on 4xx, we'll handle it
              }
            );
            
            logger.debug(`DexScreener response status: ${response.status}`);
            
            // Handle 403 specifically
            if (response.status === 403) {
              logger.error(`DexScreener 403 Forbidden - API blocked. This may be due to network/firewall restrictions.`);
              throw new Error('403 Forbidden - API access blocked');
            }
            
            if (response.status >= 200 && response.status < 300) {
              break; // Success, exit retry loop
            }
            
            // For other 4xx errors, don't retry
            if (response.status >= 400 && response.status < 500) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
          } catch (error: unknown) {
            attempt++;
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const axiosError = error as { response?: { status?: number }; message?: string };
            
            // Don't retry on 403 or other 4xx errors
            if (errorMessage?.includes('403') || errorMessage?.includes('Forbidden')) {
              logger.error(`DexScreener permanently blocked (403). Check network/VPN/firewall settings.`);
              throw error;
            }
            
            if (attempt >= maxAttempts || (axiosError.response?.status && axiosError.response.status !== 429 && axiosError.response.status !== 503)) {
              logger.error(`DexScreener request failed after ${attempt} attempts:`, errorMessage);
              throw error;
            }
            
            logger.warn(`DexScreener rate limited, retrying (attempt ${attempt}/${maxAttempts})...`);
            // Exponential backoff: 300ms, 600ms, 900ms
            await new Promise(resolve => setTimeout(resolve, attempt * 300));
          }
        }

        if (!response) {
          logger.warn(`No response from DexScreener for ${address}`);
          continue;
        }

        // Log raw response structure for debugging
        logger.debug(`DexScreener response data keys:`, Object.keys(response.data || {}));
        
        if (response.data && response.data.pairs) {
          logger.info(`DexScreener returned ${response.data.pairs.length} pairs for ${address}`);
          
          if (response.data.pairs.length > 0) {
            const memeCoins = this.transformResponse(response.data);
            logger.info(`Transformed ${memeCoins.length} meme coins from DexScreener`);
            results.push(...memeCoins);

            // Cache the result
            await redisService.set(cacheKey, memeCoins, config.cache.ttlSeconds);
          } else {
            logger.warn(`DexScreener returned empty pairs array for ${address}`);
          }
        } else {
          logger.warn(`DexScreener response missing pairs data for ${address}. Response:`, JSON.stringify(response.data).substring(0, 200));
        }
        } catch (error: unknown) {
          const axiosError = error as { response?: { status?: number }; request?: unknown; message?: string };
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (axiosError.response || axiosError.request) {
          if (axiosError.response?.status === 403) {
            logger.error(`DexScreener 403 Forbidden for ${address} - Possible network/firewall block. Check VPN/firewall settings.`);
          } else {
            logger.error(`DexScreener API error for ${address}:`, axiosError.response?.status, errorMessage);
          }
        } else {
          logger.error(`DexScreener API error for ${address}:`, errorMessage);
        }
        // Continue to next address instead of throwing
        continue;
      }
    }

    return results;
  }

  async searchTokens(query: string): Promise<MemeCoinData[]> {
    if (!(await this.checkRateLimit())) {
      throw new Error('Rate limit exceeded for DexScreener');
    }

    try {
      const cacheKey = `${config.cache.keyPrefix}dexscreener:search:${query}`;

      const cached = await redisService.get<MemeCoinData[]>(cacheKey);
      if (cached) {
        logger.debug('DexScreener search cache hit');
        return cached;
      }

      const response = await this.client.get<DexScreenerResponse>(
        `/latest/dex/search?q=${encodeURIComponent(query)}`
      );

      const memeCoins = this.transformResponse(response.data);

      await redisService.set(cacheKey, memeCoins, config.cache.ttlSeconds);

      return memeCoins;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; statusText?: string }; request?: unknown; message?: string };
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DexScreener search error:', errorMessage);
      if (axiosError.response || axiosError.request) {
        throw new Error(`DexScreener search error: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
      }
      throw error;
    }
  }

  private transformResponse(data: DexScreenerResponse): MemeCoinData[] {
    return data.pairs.map((pair) => ({
      token: {
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
      },
      priceData: {
        price: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChangePercent24h: pair.priceChange?.h24 ? (pair.priceChange.h24 / parseFloat(pair.priceUsd || '1')) * 100 : 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.fdv || 0,
        timestamp: Date.now(),
      },
      source: 'dexscreener',
      chain: pair.chainId,
      pairAddress: pair.pairAddress,
      fdv: pair.fdv,
      pairCreatedAt: pair.pairCreatedAt,
    }));
  }
}

export const dexscreenerClient = new DexScreenerClient();

