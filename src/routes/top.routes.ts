import { Router, Request, Response } from 'express';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { AggregatedMemeCoin } from '../types';

const router = Router();

/**
 * GET /api/top - Top Movers Leaderboard
 * 
 * Fetches top tokens from cache by metric (volume24h, priceChangePercent24h, marketCap)
 * 
 * Query Parameters:
 * - metric: 'volume24h' | 'priceChangePercent24h' | 'marketCap' (default: 'volume24h')
 * - limit: number of results (default: 10, max: 100)
 * - interval: '1h' | '24h' | '7d' (for future use, currently uses 24h data)
 * 
 * Example:
 * GET /api/top?metric=volume24h&limit=5
 * GET /api/top?metric=priceChangePercent24h&limit=10
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as string) || 'volume24h';
    const limit = Math.min(Number(req.query.limit) || 10, 100); // Max 100 results
    const interval = (req.query.interval as string) || '24h';

    // Validate metric
    const validMetrics = ['volume24h', 'priceChangePercent24h', 'marketCap', 'liquidity'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      });
    }

    // Get all cached aggregated token keys
    const client = redisService.getClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Redis not available',
      });
    }

    // Fetch all cached aggregated tokens
    const keys = await client.keys(`${config.cache.keyPrefix}aggregated:*`);
    
    if (!keys.length) {
      logger.debug('[TOP] No cached tokens found');
      return res.json({
        success: true,
        data: [],
        count: 0,
        metric,
        message: 'No cached tokens yet. Make some API calls first to populate cache.',
        timestamp: Date.now(),
      });
    }

    logger.debug(`[TOP] Found ${keys.length} cached token groups, fetching data...`);

    // Fetch all cached token data
    const rawTokens: AggregatedMemeCoin[][] = [];
    for (const key of keys) {
      const cached = await redisService.get<AggregatedMemeCoin[]>(key);
      if (cached && Array.isArray(cached)) {
        rawTokens.push(cached);
      }
    }

    // Flatten and deduplicate by token address
    const tokenMap = new Map<string, AggregatedMemeCoin>();
    for (const tokenArray of rawTokens) {
      for (const token of tokenArray) {
        const address = token.token.address.toLowerCase();
        // Keep the most recent or best data
        if (!tokenMap.has(address) || token.lastUpdated > (tokenMap.get(address)?.lastUpdated || 0)) {
          tokenMap.set(address, token);
        }
      }
    }

    const allTokens = Array.from(tokenMap.values());

    if (allTokens.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        metric,
        message: 'No token data available',
        timestamp: Date.now(),
      });
    }

    // Sort by metric
    const sorted = allTokens.sort((a, b) => {
      const getValue = (token: AggregatedMemeCoin): number => {
        switch (metric) {
          case 'priceChangePercent24h':
            return token.priceData?.priceChange24h || 0;
          case 'marketCap':
            return token.priceData?.marketCap || token.totalLiquidity || 0;
          case 'liquidity':
            return token.totalLiquidity || token.priceData?.liquidity || 0;
          case 'volume24h':
          default:
            return token.totalVolume24h || token.priceData?.volume24h || 0;
        }
      };

      return getValue(b) - getValue(a); // Descending order
    });

    // Take top N
    const topTokens = sorted.slice(0, limit);

    logger.info(`[TOP] Returning top ${topTokens.length} tokens by ${metric}`);

    // Format response
    const formatted = topTokens.map((token, index) => ({
      rank: index + 1,
      token: {
        address: token.token.address,
        symbol: token.token.symbol,
        name: token.token.name,
      },
      priceData: {
        price: token.priceData?.price || token.averagePrice || 0,
        volume24h: token.totalVolume24h || token.priceData?.volume24h || 0,
        priceChange24h: token.priceData?.priceChange24h || 0,
        priceChangePercent24h: token.priceData?.priceChangePercent24h || 0,
        liquidity: token.totalLiquidity || token.priceData?.liquidity || 0,
        marketCap: token.priceData?.marketCap || 0,
      },
      sources: token.sources || [],
      chains: token.chains || [],
      lastUpdated: token.lastUpdated,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      metric,
      interval,
      data: formatted,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('[TOP] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;

