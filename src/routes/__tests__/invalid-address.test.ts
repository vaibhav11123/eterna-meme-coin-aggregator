import request from 'supertest';
import express from 'express';
import apiRoutes from '../api.routes';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Invalid Address Handling', () => {
  it('should handle invalid token addresses gracefully', async () => {
    const response = await request(app)
      .get('/api/tokens?addresses=invalid-address-123')
      .expect(200);

    expect(response.body).toHaveProperty('success');
    // Should return empty array or error message, not crash
    expect(response.body).toHaveProperty('data');
  });

  it('should handle empty addresses parameter', async () => {
    const response = await request(app)
      .get('/api/tokens?addresses=')
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  it('should handle malformed addresses', async () => {
    const response = await request(app)
      .get('/api/tokens?addresses=not-a-valid-solana-address')
      .expect(200);

    // Should handle gracefully, return empty or error
    expect(response.body).toHaveProperty('success');
  });

  it('should validate address format', async () => {
    const response = await request(app)
      .get('/api/tokens?addresses=So11111111111111111111111111111111111111112')
      .expect(200);

    // Valid Solana address should work
    expect(response.body.success).toBe(true);
  });
});

