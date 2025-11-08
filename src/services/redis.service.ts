import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor() {
    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      logger.warn('Redis operations may fail - check if Redis is running on', `${config.redis.host}:${config.redis.port}`);
    });

    // Test connection on startup
    this.client.ping().then(() => {
      logger.info('Redis ping successful');
    }).catch((err) => {
      logger.error('Redis ping failed:', err.message);
      logger.warn('Redis may not be running. Cache operations will fail silently.');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error: any) {
      // Don't log errors if Redis is just not connected - it's expected in some setups
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
        logger.debug(`Redis not available for key ${key}, returning null`);
      } else {
        logger.error(`Redis get error for key ${key}:`, error.message);
      }
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error: any) {
      // Don't log errors if Redis is just not connected - it's expected in some setups
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
        logger.debug(`Redis not available, skipping cache for key ${key}`);
      } else {
        logger.error(`Redis set error for key ${key}:`, error.message);
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Redis del error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const count = await this.client.incr(key);
      if (ttlSeconds && count === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      logger.error(`Redis increment error for key ${key}:`, error);
      return 0;
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error(`Redis publish error for channel ${channel}:`, error);
    }
  }

  subscribe(channel: string, callback: (message: any) => void): void {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(msg);
          callback(parsed);
        } catch (error) {
          logger.error(`Redis subscribe parse error for channel ${channel}:`, error);
        }
      }
    });
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }

  getClient(): Redis {
    return this.client;
  }
}

export const redisService = new RedisService();

