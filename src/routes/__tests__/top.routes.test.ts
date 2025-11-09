import request from 'supertest';
import express from 'express';
import topRoutes from '../top.routes';

const app = express();
app.use(express.json());
app.use('/api/top', topRoutes);

describe('GET /api/top', () => {
  it('should return top tokens by volume', async () => {
    const response = await request(app)
      .get('/api/top?metric=volume24h&limit=5')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should support different metrics', async () => {
    const metrics = ['volume24h', 'priceChangePercent24h', 'marketCap', 'liquidity'];
    
    for (const metric of metrics) {
      const response = await request(app)
        .get(`/api/top?metric=${metric}&limit=3`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
    }
  });

  it('should support pagination with cursor', async () => {
    const firstPage = await request(app)
      .get('/api/top?limit=2')
      .expect(200);

    if (firstPage.body.has_more && firstPage.body.next_cursor) {
      const secondPage = await request(app)
        .get(`/api/top?limit=2&cursor=${firstPage.body.next_cursor}`)
        .expect(200);

      expect(secondPage.body.success).toBe(true);
      expect(secondPage.body).toHaveProperty('data');
    }
  });

  it('should support interval filtering', async () => {
    const intervals = ['1h', '24h', '7d'];
    
    for (const interval of intervals) {
      const response = await request(app)
        .get(`/api/top?interval=${interval}`)
        .expect(200);
      
      expect(response.body.interval).toBe(interval);
    }
  });

  it('should validate limit parameter', async () => {
    const response = await request(app)
      .get('/api/top?limit=200') // Exceeds max
      .expect(200);

    // Should cap at max limit
    expect(response.body.data.length).toBeLessThanOrEqual(100);
  });
});

