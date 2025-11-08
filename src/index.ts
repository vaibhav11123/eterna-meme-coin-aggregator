import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { redisService } from './services/redis.service';
import { WebSocketService } from './services/websocket.service';
import { rateLimiter } from './middleware/rateLimiter';
import apiRoutes from './routes/api.routes';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api', apiRoutes);
app.use('/api/metrics', require('./routes/metrics.routes').default);
app.use('/api/top', require('./routes/top.routes').default);

// Debug routes (only in development)
if (config.server.nodeEnv === 'development') {
  const debugRoutes = require('./routes/debug.routes').default;
  app.use('/debug', debugRoutes);
  logger.info('Debug routes enabled at /debug');
}

// Root endpoint
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'Eterna Meme Coin Aggregator',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tokens: '/api/tokens?addresses=So11111111111111111111111111111111111111112',
      search: '/api/search?query=pepe',
      top: '/api/top?metric=volume24h&limit=10',
      metrics: '/api/metrics',
      websocket: '/ws',
    },
  });
});

// WebSocket
const wsService = new WebSocketService(server);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  wsService.shutdown();
  await redisService.disconnect();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  logger.info(`🔥 Top Movers available at: http://localhost:${PORT}/api/top?metric=volume24h&limit=10`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
});

// Error handling
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

