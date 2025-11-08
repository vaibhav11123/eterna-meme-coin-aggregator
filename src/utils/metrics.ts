/**
 * Metrics tracking for performance monitoring
 * Tracks latency, cache hit rates, and API performance
 */

interface MetricData {
  timestamp: number;
  latency: number;
  cacheHit: boolean;
  source?: string;
}

interface AggregatedMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  avgLatency: number;
  sourceLatencies: Record<string, number[]>;
  requestsLastMinute: number;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly windowMs = 60000; // 1 minute window

  record(metric: MetricData): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const hits = this.metrics.filter(m => m.cacheHit).length;
    return hits / this.metrics.length;
  }

  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.latency, 0);
    return sum / this.metrics.length;
  }

  getRequestsLastMinute(): number {
    const now = Date.now();
    return this.metrics.filter(m => now - m.timestamp < this.windowMs).length;
  }

  getSourceLatencies(): Record<string, number> {
    const sourceLatencies: Record<string, number[]> = {};
    
    this.metrics.forEach(metric => {
      if (metric.source) {
        if (!sourceLatencies[metric.source]) {
          sourceLatencies[metric.source] = [];
        }
        sourceLatencies[metric.source].push(metric.latency);
      }
    });

    const averages: Record<string, number> = {};
    Object.keys(sourceLatencies).forEach(source => {
      const latencies = sourceLatencies[source];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      averages[source] = Math.round(avg);
    });

    return averages;
  }

  getAggregatedMetrics(): AggregatedMetrics {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < this.windowMs
    );

    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheMisses = recentMetrics.filter(m => !m.cacheHit).length;
    const avgLatency = recentMetrics.length > 0
      ? recentMetrics.reduce((acc, m) => acc + m.latency, 0) / recentMetrics.length
      : 0;

    const sourceLatencies: Record<string, number[]> = {};
    recentMetrics.forEach(metric => {
      if (metric.source) {
        if (!sourceLatencies[metric.source]) {
          sourceLatencies[metric.source] = [];
        }
        sourceLatencies[metric.source].push(metric.latency);
      }
    });

    return {
      totalRequests: this.metrics.length,
      cacheHits,
      cacheMisses,
      avgLatency: Math.round(avgLatency),
      sourceLatencies,
      requestsLastMinute: recentMetrics.length,
    };
  }

  reset(): void {
    this.metrics = [];
  }
}

export const metricsCollector = new MetricsCollector();

