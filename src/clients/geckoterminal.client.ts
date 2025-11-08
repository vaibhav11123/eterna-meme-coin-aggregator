import axios from 'axios';
import https from 'https';
import { config } from '../config';
import { logger } from '../utils/logger';
import { GeckoTerminalResponse, MemeCoinData } from '../types';
import { redisService } from '../services/redis.service';

export class GeckoTerminalClient {
  private client: ReturnType<typeof axios.create>;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: config.geckoterminal.baseUrl,
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

    if (this.requestCount >= config.geckoterminal.rateLimitPerMinute) {
      logger.warn('GeckoTerminal rate limit reached');
      return false;
    }

    this.requestCount++;
    return true;
  }

  async getTokenData(tokenAddress: string): Promise<MemeCoinData | null> {
    if (!(await this.checkRateLimit())) {
      logger.warn('GeckoTerminal rate limit reached');
      return null;
    }

    try {
      const cacheKey = `${config.cache.keyPrefix}geckoterminal:${tokenAddress}`;

      const cached = await redisService.get<MemeCoinData>(cacheKey);
      if (cached) {
        logger.debug(`GeckoTerminal cache hit for ${tokenAddress}`);
        return cached;
      }

      logger.info(`Fetching from GeckoTerminal for address: ${tokenAddress}`);
      const url = `${config.geckoterminal.baseUrl}/tokens/${tokenAddress}`;
      logger.debug(`GeckoTerminal URL: ${url}`);

      // Retry with exponential backoff
      let response;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          const fullUrl = `${config.geckoterminal.baseUrl}/tokens/${tokenAddress}`;
          logger.debug(`Attempting GeckoTerminal request ${attempt + 1}/${maxAttempts} to: ${fullUrl}`);
          
          response = await this.client.get<GeckoTerminalResponse>(
            `/tokens/${tokenAddress}`,
            { 
              timeout: 8000,
                  validateStatus: (status: number) => status < 500, // Don't throw on 4xx
            }
          );
          
          logger.debug(`GeckoTerminal response status: ${response.status}`);
          
          // Handle 403 specifically
          if (response.status === 403) {
            logger.error(`GeckoTerminal 403 Forbidden - API blocked. This may be due to network/firewall restrictions.`);
            throw new Error('403 Forbidden - API access blocked');
          }
          
          if (response.status >= 200 && response.status < 300) {
            break; // Success, exit retry loop
          }
          
          // For other 4xx errors, don't retry
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
        } catch (error: any) {
          attempt++;
          
          // Don't retry on 403 or other 4xx errors
          if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            logger.error(`GeckoTerminal permanently blocked (403). Check network/VPN/firewall settings.`);
            throw error;
          }
          
          if (attempt >= maxAttempts || (error.response?.status && error.response.status !== 429 && error.response.status !== 503)) {
            logger.error(`GeckoTerminal request failed after ${attempt} attempts:`, error.message);
            throw error;
          }
          
          logger.warn(`GeckoTerminal rate limited, retrying (attempt ${attempt}/${maxAttempts})...`);
          // Exponential backoff: 300ms, 600ms, 900ms
          await new Promise(resolve => setTimeout(resolve, attempt * 300));
        }
      }

      if (!response) {
        logger.warn(`No response from GeckoTerminal for ${tokenAddress}`);
        return null;
      }

      // Log raw response structure for debugging
      logger.debug(`GeckoTerminal response data keys:`, Object.keys(response.data || {}));

      if (!response.data?.data) {
        logger.warn(`GeckoTerminal response missing data for ${tokenAddress}`);
        return null;
      }

      // Handle both single object and array responses
      const data = Array.isArray(response.data.data) 
        ? response.data.data[0] 
        : response.data.data;

      if (!data) {
        logger.warn(`GeckoTerminal data is null/undefined for ${tokenAddress}`);
        return null;
      }

      logger.info(`GeckoTerminal returned data for ${tokenAddress}, symbol: ${data.attributes?.symbol || 'unknown'}`);
      const memeCoin = this.transformResponse(data, 'solana');

      await redisService.set(cacheKey, memeCoin, config.cache.ttlSeconds);

      return memeCoin;
        } catch (error: any) {
          if (error.response || error.request) {
        if (error.response?.status === 403) {
          logger.error(`GeckoTerminal 403 Forbidden for ${tokenAddress} - Possible network/firewall block. Check VPN/firewall settings.`);
        } else if (error.response?.status === 404) {
          logger.debug(`GeckoTerminal 404 - Token not found: ${tokenAddress}`);
          return null;
        } else {
          logger.error(`GeckoTerminal API error for ${tokenAddress}:`, error.response?.status, error.message);
        }
      } else {
        logger.error(`GeckoTerminal API error for ${tokenAddress}:`, error.message);
      }
      return null; // Return null instead of throwing
    }
  }

  async searchTokens(query: string): Promise<MemeCoinData[]> {
    if (!(await this.checkRateLimit())) {
      throw new Error('Rate limit exceeded for GeckoTerminal');
    }

    try {
      const cacheKey = `${config.cache.keyPrefix}geckoterminal:search:${query}`;

      const cached = await redisService.get<MemeCoinData[]>(cacheKey);
      if (cached) {
        logger.debug('GeckoTerminal search cache hit');
        return cached;
      }

      // Note: GeckoTerminal may have different search endpoints
      // This is a placeholder - adjust based on actual API
      const response = await this.client.get<GeckoTerminalResponse>(
        `/api/v2/search?query=${encodeURIComponent(query)}`
      );

      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const memeCoins = response.data.data.map((item: any) =>
        this.transformResponse(item, item.relationships?.network?.data?.id || 'unknown')
      );

      await redisService.set(cacheKey, memeCoins, config.cache.ttlSeconds);

      return memeCoins;
    } catch (error: any) {
      logger.error('GeckoTerminal search error:', error.message);
      if (error.response || error.request) {
        throw new Error(`GeckoTerminal search error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  private transformResponse(data: GeckoTerminalResponse['data'][0], network: string): MemeCoinData {
    const attrs = data.attributes;
    return {
      token: {
        address: attrs.address,
        symbol: attrs.symbol,
        name: attrs.name,
        decimals: attrs.decimals,
      },
      priceData: {
        price: parseFloat(attrs.price_usd || '0'),
        priceChangePercent24h: attrs.price_change_percentage?.h24 || 0,
        volume24h: parseFloat(attrs.volume_usd || '0'),
        liquidity: parseFloat(attrs.reserve_in_usd || '0'),
        marketCap: parseFloat(attrs.fdv_usd || '0'),
        timestamp: Date.now(),
      },
      source: 'geckoterminal',
      chain: network,
      fdv: parseFloat(attrs.fdv_usd || '0'),
    };
  }
}

export const geckoterminalClient = new GeckoTerminalClient();

