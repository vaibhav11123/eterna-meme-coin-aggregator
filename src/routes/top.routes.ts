import { Router, Request, Response } from 'express';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { AggregatedMemeCoin } from '../types';
import { decodeCursor, paginate } from '../utils/pagination';
import { adjustIntervalData } from '../utils/intervalFilter';

const router = Router();

/**
 * GET /api/top - Top Movers Leaderboard
 * 
 * Fetches top tokens from cache by metric (volume24h, priceChangePercent24h, marketCap)
 * 
 * Query Parameters:
 * - metric: 'volume24h' | 'priceChangePercent24h' | 'marketCap' | 'liquidity' (default: 'volume24h')
 * - limit: number of results per page (default: 20, max: 100)
 * - cursor: Base64-encoded cursor for pagination
 * - interval: '1h' | '24h' | '7d' (default: '24h') - applies adaptive scaling
 * 
 * Example:
 * GET /api/top?metric=volume24h&limit=20
 * GET /api/top?metric=priceChangePercent24h&limit=10&interval=1h
 * GET /api/top?metric=volume24h&limit=20&cursor=eyJpbmRleCI6MjB9
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as string) || 'volume24h';
    const limit = Math.min(Number(req.query.limit) || 20, 100); // Default 20, max 100
    const cursor = decodeCursor(req.query.cursor as string);
    const interval = (req.query.interval as string) || '24h';

    // Validate metric
    const validMetrics = ['volume24h', 'priceChangePercent24h', 'marketCap', 'liquidity'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      });
    }

    // Validate interval
    const validIntervals = ['1h', '24h', '7d'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
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

    // Apply interval filtering to all tokens
    const adjustedTokens = allTokens.map((token) => ({
      ...token,
      priceData: adjustIntervalData(token.priceData, interval),
    }));

    // Sort by metric (using adjusted data)
    const sorted = adjustedTokens.sort((a, b) => {
      const getValue = (token: AggregatedMemeCoin): number => {
        switch (metric) {
          case 'priceChangePercent24h':
            return token.priceData?.priceChangePercent24h || 0;
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

    // Apply pagination
    const { data: paginatedTokens, nextCursor, hasMore } = paginate(sorted, limit, cursor);

    logger.info(`[TOP] Returning ${paginatedTokens.length} tokens by ${metric} (interval: ${interval})`);

    // Format response with rank based on pagination
    const startRank = (cursor?.index || 0) + 1;
    const formatted = paginatedTokens.map((token, index) => ({
      rank: startRank + index,
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
      next_cursor: nextCursor,
      has_more: hasMore,
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

