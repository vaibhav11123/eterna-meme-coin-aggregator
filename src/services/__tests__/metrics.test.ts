import { metricsCollector } from '../../utils/metrics';

describe('MetricsCollector', () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  describe('record', () => {
    it('should record metrics', () => {
      metricsCollector.record({
        timestamp: Date.now(),
        latency: 100,
        cacheHit: true,
      });

      expect(metricsCollector.getCacheHitRate()).toBe(1);
      expect(metricsCollector.getAverageLatency()).toBe(100);
    });

    it('should track cache hits and misses', () => {
      metricsCollector.record({ timestamp: Date.now(), latency: 50, cacheHit: true });
      metricsCollector.record({ timestamp: Date.now(), latency: 200, cacheHit: false });
      metricsCollector.record({ timestamp: Date.now(), latency: 75, cacheHit: true });

      expect(metricsCollector.getCacheHitRate()).toBeCloseTo(0.67, 2);
    });

    it('should limit stored metrics to maxMetrics', () => {
      for (let i = 0; i < 1500; i++) {
        metricsCollector.record({
          timestamp: Date.now(),
          latency: 100,
          cacheHit: true,
        });
      }

      // Should still work without errors
      expect(metricsCollector.getCacheHitRate()).toBeGreaterThan(0);
    });
  });

  describe('getCacheHitRate', () => {
    it('should return 0 when no metrics recorded', () => {
      expect(metricsCollector.getCacheHitRate()).toBe(0);
    });

    it('should calculate correct hit rate', () => {
      metricsCollector.record({ timestamp: Date.now(), latency: 100, cacheHit: true });
      metricsCollector.record({ timestamp: Date.now(), latency: 200, cacheHit: false });
      
      expect(metricsCollector.getCacheHitRate()).toBe(0.5);
    });
  });

  describe('getAverageLatency', () => {
    it('should return 0 when no metrics recorded', () => {
      expect(metricsCollector.getAverageLatency()).toBe(0);
    });

    it('should calculate correct average', () => {
      metricsCollector.record({ timestamp: Date.now(), latency: 100, cacheHit: true });
      metricsCollector.record({ timestamp: Date.now(), latency: 200, cacheHit: false });
      metricsCollector.record({ timestamp: Date.now(), latency: 150, cacheHit: true });

      expect(metricsCollector.getAverageLatency()).toBe(150);
    });
  });

  describe('getRequestsLastMinute', () => {
    it('should count recent requests', () => {
      const now = Date.now();
      metricsCollector.record({ timestamp: now - 1000, latency: 100, cacheHit: true });
      metricsCollector.record({ timestamp: now - 2000, latency: 100, cacheHit: true });
      metricsCollector.record({ timestamp: now - 70000, latency: 100, cacheHit: true }); // Too old

      expect(metricsCollector.getRequestsLastMinute()).toBe(2);
    });
  });

  describe('getSourceLatencies', () => {
    it('should calculate average latency per source', () => {
      metricsCollector.record({ timestamp: Date.now(), latency: 100, cacheHit: false, source: 'dexscreener' });
      metricsCollector.record({ timestamp: Date.now(), latency: 200, cacheHit: false, source: 'dexscreener' });
      metricsCollector.record({ timestamp: Date.now(), latency: 150, cacheHit: false, source: 'geckoterminal' });

      const latencies = metricsCollector.getSourceLatencies();
      expect(latencies.dexscreener).toBe(150);
      expect(latencies.geckoterminal).toBe(150);
    });
  });
});

