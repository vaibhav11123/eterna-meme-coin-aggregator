import { Router, Request, Response } from 'express';
import { dexscreenerClient } from '../clients/dexscreener.client';
import { geckoterminalClient } from '../clients/geckoterminal.client';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';
import { metricsCollector } from '../utils/metrics';

const router = Router();

// Debug endpoint to test API calls directly (bypasses cache)
router.get('/test-dexscreener/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    logger.info(`[DEBUG] Testing DexScreener directly for: ${address}`);
    
    // Bypass cache - call directly
    const result = await dexscreenerClient.getTokenPairs([address]);
    
    res.json({
      success: true,
      address,
      resultCount: result.length,
      results: result,
      message: 'Direct API call (cache may be used)',
    });
  } catch (error: any) {
    logger.error('[DEBUG] DexScreener test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

router.get('/test-gecko/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    logger.info(`[DEBUG] Testing GeckoTerminal directly for: ${address}`);
    
    const result = await geckoterminalClient.getTokenData(address);
    
    res.json({
      success: true,
      address,
      hasResult: !!result,
      result: result,
      message: 'Direct API call (cache may be used)',
    });
  } catch (error: any) {
    logger.error('[DEBUG] GeckoTerminal test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const testKey = 'test:connection';
    const testValue = { test: true, timestamp: Date.now() };
    
    let redisConnected = false;
    let redisLatency = 0;
    try {
      const start = Date.now();
      await redisService.set(testKey, testValue, 10);
      const retrieved = await redisService.get(testKey);
      await redisService.del(testKey);
      redisLatency = Date.now() - start;
      redisConnected = retrieved !== null;
    } catch (error) {
      redisConnected = false;
    }

    const metrics = metricsCollector.getAggregatedMetrics();
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      redis: {
        connected: redisConnected,
        latency: redisLatency,
      },
      metrics: {
        requestsLastMinute: metrics.requestsLastMinute,
        cacheHitRate: metricsCollector.getCacheHitRate(),
        avgLatency: metrics.avgLatency,
      },
    });
  } catch (error: any) {
    logger.error('[DEBUG] Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

router.get('/test-redis', async (_req: Request, res: Response) => {
  try {
    const testKey = 'test:connection';
    const testValue = { test: true, timestamp: Date.now() };
    
    await redisService.set(testKey, testValue, 10);
    const retrieved = await redisService.get(testKey);
    await redisService.del(testKey);
    
    res.json({
      success: true,
      redisConnected: true,
      writeTest: true,
      readTest: retrieved !== null,
      retrievedValue: retrieved,
    });
  } catch (error: any) {
    logger.error('[DEBUG] Redis test error:', error);
    res.status(500).json({
      success: false,
      redisConnected: false,
      error: error.message,
    });
  }
});

router.get('/cache/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const fullKey = `meme_coin:${key}`;
    const cached = await redisService.get(fullKey);
    
    res.json({
      success: true,
      key: fullKey,
      found: cached !== null,
      data: cached,
      ttl: cached ? 'Check Redis TTL' : null,
    });
  } catch (error: any) {
    logger.error('[DEBUG] Cache get error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/sources', async (_req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.getAggregatedMetrics();
    const sourceLatencies = metricsCollector.getSourceLatencies();
    
    res.json({
      success: true,
      sources: {
        dexscreener: {
          baseUrl: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
          avgLatency: sourceLatencies.dexscreener || 0,
          status: 'active',
        },
        geckoterminal: {
          baseUrl: process.env.GECKO_BASE_URL || 'https://api.geckoterminal.com/api/v2/networks/solana',
          avgLatency: sourceLatencies.geckoterminal || 0,
          status: 'active',
        },
        jupiter: {
          baseUrl: process.env.JUPITER_BASE_URL || 'https://price.jup.ag/v4',
          avgLatency: sourceLatencies.jupiter || 0,
          status: 'active',
        },
      },
      performance: {
        avgLatency: metrics.avgLatency,
        cacheHitRate: metricsCollector.getCacheHitRate(),
        requestsLastMinute: metrics.requestsLastMinute,
      },
    });
  } catch (error: any) {
    logger.error('[DEBUG] Sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/clear-cache', async (_req: Request, res: Response) => {
  try {
    // This is a simple approach - in production you'd want to be more selective
    const client = redisService.getClient();
    if (client) {
      // Get all keys with our prefix
      const keys = await client.keys('meme_coin:*');
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisService.del(key)));
      }
      res.json({
        success: true,
        clearedKeys: keys.length,
        message: `Cleared ${keys.length} cache keys`,
      });
    } else {
      res.json({
        success: false,
        message: 'Redis client not available',
      });
    }
  } catch (error: any) {
    logger.error('[DEBUG] Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

