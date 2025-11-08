import { Router, Request, Response } from 'express';
import { metricsCollector } from '../utils/metrics';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/metrics - Analytics dashboard endpoint
router.get('/', (_req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.getAggregatedMetrics();
    const sourceLatencies = metricsCollector.getSourceLatencies();
    const cacheHitRate = metricsCollector.getCacheHitRate();

    res.json({
      requests_last_min: metrics.requestsLastMinute,
      requests_total: metrics.totalRequests,
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
      cache_hits: metrics.cacheHits,
      cache_misses: metrics.cacheMisses,
      avg_latency_ms: metrics.avgLatency,
      source_latencies: sourceLatencies,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message,
    });
  }
});

export default router;

