import request from 'supertest';
import express from 'express';
import apiRoutes from '../api.routes';
import { aggregatorService } from '../../services/aggregator.service';

jest.mock('../../services/aggregator.service');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

const mockedAggregator = aggregatorService as jest.Mocked<typeof aggregatorService>;

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tokens', () => {
    it('should return aggregated token data', async () => {
      const mockData = [
        {
          token: { address: '0xabc', symbol: 'TEST', name: 'Test Token' },
          priceData: { price: 1.5, timestamp: Date.now() },
          sources: ['dexscreener'],
          chains: ['ethereum'],
          pairAddresses: [],
          bestPrice: 1.5,
          averagePrice: 1.5,
          totalVolume24h: 1000000,
          totalLiquidity: 500000,
          lastUpdated: Date.now(),
        },
      ];

      mockedAggregator.aggregateTokenData.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/tokens')
        .query({ addresses: '0xabc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 400 if addresses parameter is missing', async () => {
      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing addresses parameter');
    });
  });

  describe('GET /api/search', () => {
    it('should return search results', async () => {
      const mockData = [
        {
          token: { address: '0xabc', symbol: 'PEPE', name: 'Pepe Token' },
          priceData: { price: 0.001, timestamp: Date.now() },
          sources: ['dexscreener'],
          chains: ['ethereum'],
          pairAddresses: [],
          bestPrice: 0.001,
          averagePrice: 0.001,
          totalVolume24h: 100000,
          totalLiquidity: 50000,
          lastUpdated: Date.now(),
        },
      ];

      mockedAggregator.searchTokens.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/search')
        .query({ query: 'pepe' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 400 if query parameter is missing', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing query parameter');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});

