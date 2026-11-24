import { EventEmitter } from 'events';

/**
 * Resilient Redis Connection & In-Memory Queue Fallback
 * 
 * Provides connection handling for Redis if configured (e.g. REDIS_URL).
 * If Redis is absent or unreachable in local development, it gracefully falls back
 * to an internal EventEmitter bus without crashing the Node.js process.
 */

class FallbackMessageBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  async publish(channel, message) {
    this.emit(channel, typeof message === 'string' ? JSON.parse(message) : message);
    return 1;
  }

  async subscribe(channel, callback) {
    this.on(channel, callback);
    return true;
  }
}

export const fallbackBus = new FallbackMessageBus();

let isConnected = false;
let redisClient = null;

export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('[Redis] No REDIS_URL configured. Running background jobs in lightweight in-memory mode.');
    return null;
  }

  try {
    // Attempt dynamic import if ioredis or redis is installed
    const { createClient } = await import('redis');
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection warning, using in-memory bus:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully to Redis server');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.log('[Redis] Client not active or unreachable. Falling back to internal in-memory queue:', err.message);
    isConnected = false;
    return null;
  }
};

export const isRedisReady = () => isConnected;

export const getRedisClient = () => redisClient;

export default {
  initRedis,
  isRedisReady,
  getRedisClient,
  fallbackBus,
};
