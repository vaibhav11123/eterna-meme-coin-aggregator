import { Router, Request, Response } from 'express';
import { aggregatorService } from '../services/aggregator.service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { decodeCursor, paginate } from '../utils/pagination';
import { adjustIntervalData } from '../utils/intervalFilter';
import { AggregatedMemeCoin } from '../types';

const router = Router();

const tokenAddressesSchema = z.object({
  addresses: z.array(z.string()).min(1).max(50),
});

const searchSchema = z.object({
  query: z.string().min(1).max(100),
});

/**
 * GET /api/tokens?addresses=0x123,0x456&limit=20&cursor=...&interval=24h
 * 
 * Query Parameters:
 * - addresses (required): Comma-separated list of token addresses
 * - limit (optional): Number of results per page (default: 20, max: 100)
 * - cursor (optional): Base64-encoded cursor for pagination
 * - interval (optional): Time period filter - '1h' | '24h' | '7d' (default: '24h')
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const addressesParam = req.query.addresses as string;
    if (!addressesParam) {
      return res.status(400).json({
        error: 'Missing addresses parameter',
        message: 'Please provide token addresses as a comma-separated list',
      });
    }

    const addresses = addressesParam.split(',').map((addr) => addr.trim()).filter(Boolean);
    
    const validation = tokenAddressesSchema.safeParse({ addresses });
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid addresses parameter',
        details: validation.error.errors,
      });
    }

    // Parse pagination parameters
    const limit = Math.min(Number(req.query.limit) || 20, 100); // Default 20, max 100
    const cursor = decodeCursor(req.query.cursor as string);
    const interval = (req.query.interval as string) || '24h';

    // Validate interval
    const validIntervals = ['1h', '24h', '7d'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval parameter',
        message: `Interval must be one of: ${validIntervals.join(', ')}`,
      });
    }

    // Fetch aggregated data
    const data = await aggregatorService.aggregateTokenData(validation.data.addresses);
    
    // Apply interval filtering
    const adjustedData: AggregatedMemeCoin[] = data.map((token) => ({
      ...token,
      priceData: adjustIntervalData(token.priceData, interval),
    }));

    // Apply pagination
    const { data: paginatedData, nextCursor, hasMore } = paginate(adjustedData, limit, cursor);
    
    return res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      next_cursor: nextCursor,
      has_more: hasMore,
      interval,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('GET /api/tokens error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch token data',
    });
  }
});

/**
 * GET /api/search?query=pepe&limit=20&cursor=...&interval=24h
 * 
 * Query Parameters:
 * - query (required): Search query string
 * - limit (optional): Number of results per page (default: 20, max: 100)
 * - cursor (optional): Base64-encoded cursor for pagination
 * - interval (optional): Time period filter - '1h' | '24h' | '7d' (default: '24h')
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Please provide a search query',
      });
    }

    const validation = searchSchema.safeParse({ query });
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameter',
        details: validation.error.errors,
      });
    }

    // Parse pagination parameters
    const limit = Math.min(Number(req.query.limit) || 20, 100); // Default 20, max 100
    const cursor = decodeCursor(req.query.cursor as string);
    const interval = (req.query.interval as string) || '24h';

    // Validate interval
    const validIntervals = ['1h', '24h', '7d'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval parameter',
        message: `Interval must be one of: ${validIntervals.join(', ')}`,
      });
    }

    const data = await aggregatorService.searchTokens(validation.data.query);
    
    // Apply interval filtering
    const adjustedData: AggregatedMemeCoin[] = data.map((token) => ({
      ...token,
      priceData: adjustIntervalData(token.priceData, interval),
    }));

    // Apply pagination
    const { data: paginatedData, nextCursor, hasMore } = paginate(adjustedData, limit, cursor);
    
    return res.json({
      success: true,
      data: paginatedData,
      count: paginatedData.length,
      next_cursor: nextCursor,
      has_more: hasMore,
      query: validation.data.query,
      interval,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('GET /api/search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to search tokens',
    });
  }
});

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

export default router;

