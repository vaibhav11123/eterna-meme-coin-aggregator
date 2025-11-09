import request from 'supertest';
import express from 'express';
import statusRoutes from '../status.routes';

const app = express();
app.use(express.json());
app.use('/api', statusRoutes);

describe('GET /api/status', () => {
  it('should return service status', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('cache');
    expect(response.body).toHaveProperty('performance');
    expect(response.body).toHaveProperty('websocket');
  });

  it('should include cache metrics', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.cache).toHaveProperty('hits');
    expect(response.body.cache).toHaveProperty('misses');
    expect(response.body.cache).toHaveProperty('hit_rate');
    expect(response.body.cache).toHaveProperty('total_requests');
  });

  it('should include performance metrics', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.performance).toHaveProperty('avg_latency_ms');
    expect(response.body.performance).toHaveProperty('requests_last_minute');
  });

  it('should include websocket connection count', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.websocket).toHaveProperty('active_connections');
    expect(typeof response.body.websocket.active_connections).toBe('number');
  });

  it('should return valid timestamp', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
  });
});

