import { Router, Request, Response } from 'express';
import { aggregatorService } from '../services/aggregator.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const tokenAddressesSchema = z.object({
  addresses: z.array(z.string()).min(1).max(50),
});

const searchSchema = z.object({
  query: z.string().min(1).max(100),
});

// GET /api/tokens?addresses=0x123,0x456
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

    const data = await aggregatorService.aggregateTokenData(validation.data.addresses);
    
    return res.json({
      success: true,
      data,
      count: data.length,
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

// GET /api/search?query=pepe
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

    const data = await aggregatorService.searchTokens(validation.data.query);
    
    return res.json({
      success: true,
      data,
      count: data.length,
      query: validation.data.query,
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

