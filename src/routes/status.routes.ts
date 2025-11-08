import { Router, Request, Response } from 'express';
import { metricsCollector } from '../utils/metrics';
import { logger } from '../utils/logger';
import { WebSocketService } from '../services/websocket.service';

const router = Router();

// Track server start time
const startTime = Date.now();

// Store websocket service reference (set by index.ts)
let websocketServiceInstance: WebSocketService | null = null;

export function setWebSocketService(wsService: WebSocketService): void {
  websocketServiceInstance = wsService;
}

/**
 * GET /api/status - Service status and observability endpoint
 * 
 * Returns comprehensive service health, performance metrics, and system status
 * 
 * Response includes:
 * - Service name and status
 * - Uptime
 * - Cache performance (hits, misses, hit rate)
 * - Active WebSocket connections
 * - Performance metrics
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const uptimeFormatted = formatUptime(uptimeSeconds);
    
    // Get metrics from metrics collector
    const aggregatedMetrics = metricsCollector.getAggregatedMetrics();
    const cacheHitRate = metricsCollector.getCacheHitRate();
    const avgLatency = metricsCollector.getAverageLatency();
    
    // Get WebSocket connections
    const activeSockets = websocketServiceInstance?.getClientCount() || 0;
    
    const status = {
      service: 'Eterna Meme Coin Aggregator',
      version: '1.0.0',
      status: 'healthy',
      uptime: uptimeFormatted,
      uptime_seconds: uptimeSeconds,
      cache: {
        hits: aggregatedMetrics.cacheHits,
        misses: aggregatedMetrics.cacheMisses,
        hit_rate: `${(cacheHitRate * 100).toFixed(2)}%`,
        total_requests: aggregatedMetrics.totalRequests,
      },
      performance: {
        avg_latency_ms: Math.round(avgLatency),
        requests_last_minute: aggregatedMetrics.requestsLastMinute,
        source_latencies: Object.entries(aggregatedMetrics.sourceLatencies).reduce(
          (acc, [source, latencies]) => {
            const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            acc[source] = Math.round(avg);
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      websocket: {
        active_connections: activeSockets,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  } catch (error: any) {
    logger.error('GET /api/status error:', error);
    res.status(500).json({
      service: 'Eterna Meme Coin Aggregator',
      status: 'error',
      error: error.message || 'Failed to get status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

export default router;

