import request from 'supertest';
import express from 'express';
import metricsRoutes from '../metrics.routes';
import { metricsCollector } from '../../utils/metrics';

jest.mock('../../utils/metrics');

const app = express();
app.use(express.json());
app.use('/api/metrics', metricsRoutes);

const mockedMetrics = metricsCollector as jest.Mocked<typeof metricsCollector>;

describe('Metrics Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMetrics.getAggregatedMetrics.mockReturnValue({
      totalRequests: 100,
      cacheHits: 80,
      cacheMisses: 20,
      avgLatency: 150,
      sourceLatencies: {
        dexscreener: [180, 200],
        geckoterminal: [150, 170],
      },
      requestsLastMinute: 10,
    });
    mockedMetrics.getSourceLatencies.mockReturnValue({
      dexscreener: 190,
      geckoterminal: 160,
    });
    mockedMetrics.getCacheHitRate.mockReturnValue(0.8);
  });

  describe('GET /api/metrics', () => {
    it('should return metrics data', async () => {
      const response = await request(app).get('/api/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requests_last_min');
      expect(response.body).toHaveProperty('cache_hit_rate');
      expect(response.body).toHaveProperty('avg_latency_ms');
      expect(response.body.cache_hit_rate).toBe(0.8);
    });

    it('should include source latencies', async () => {
      const response = await request(app).get('/api/metrics');

      expect(response.body).toHaveProperty('source_latencies');
      expect(response.body.source_latencies).toHaveProperty('dexscreener');
      expect(response.body.source_latencies).toHaveProperty('geckoterminal');
    });
  });
});

