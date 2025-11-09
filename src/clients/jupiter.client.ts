import axios from 'axios';
import https from 'https';
import { config } from '../config';
import { logger } from '../utils/logger';
import { redisService } from '../services/redis.service';

export interface JupiterPriceData {
  [tokenId: string]: {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
  };
}

export interface JupiterResponse {
  data: JupiterPriceData;
  timeTaken: number;
}

export class JupiterClient {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: config.jupiter.baseUrl,
      timeout: 8000,
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
  }

  async getPrices(tokenIds: string[]): Promise<JupiterPriceData> {
    try {
      if (tokenIds.length === 0) {
        return {};
      }

      const joined = tokenIds.join(',');
      const cacheKey = `${config.cache.keyPrefix}jupiter:${joined}`;

      // Check cache first
      const cached = await redisService.get<JupiterPriceData>(cacheKey);
      if (cached) {
        logger.debug('Jupiter cache hit');
        return cached;
      }

      const response = await this.client.get<JupiterResponse>(
        `/price?ids=${joined}`,
        { timeout: 8000 }
      );

      const prices = response.data?.data || {};

      // Cache the result (shorter TTL for price data)
      await redisService.set(cacheKey, prices, 15); // 15 seconds

      return prices;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Jupiter API error:', errorMessage);
      return {};
    }
  }

  async getSolPrice(): Promise<number> {
    try {
      const prices = await this.getPrices(['SOL']);
      return prices?.SOL?.price || 0;
    } catch (error) {
      logger.error('Failed to get SOL price from Jupiter:', error);
      return 0;
    }
  }
}

export const jupiterClient = new JupiterClient();

