import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'meme_coin:',
  },
  dexscreener: {
    baseUrl: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
    rateLimitPerMinute: parseInt(process.env.DEXSCREENER_RATE_LIMIT_PER_MINUTE || '60', 10),
  },
  geckoterminal: {
    baseUrl: process.env.GECKO_BASE_URL || 'https://api.geckoterminal.com/api/v2/networks/solana',
    rateLimitPerMinute: parseInt(process.env.GECKOTERMINAL_RATE_LIMIT_PER_MINUTE || '60', 10),
  },
  jupiter: {
    baseUrl: process.env.JUPITER_BASE_URL || 'https://price.jup.ag/v4',
  },
  websocket: {
    heartbeatIntervalMs: parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '30000', 10),
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
  },
};

