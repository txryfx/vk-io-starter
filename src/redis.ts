import { createClient, RedisClientType } from '@redis/client';
import logger from './logger';

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<void> | null = null;
let connectionAttempted = false;

function getRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) return false;
          return Math.min(retries * 200, 2000);
        },
      },
    });

    redisClient.on('error', (err: Error) => {
      const msg = err?.message || String(err);
      if (!msg.includes('ECONNREFUSED') && !msg.includes('connect')) {
        logger.debug('Redis Client Error:', msg);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis: соединение успешно установлено');
    });
  }
  return redisClient;
}

async function ensureConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (client.isOpen) return true;

  if (!client.isOpen && connectionAttempted) {
    connectionAttempted = false;
    connectionPromise = null;
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
      return client.isOpen;
    } catch {
      return false;
    }
  }

  connectionAttempted = true;
  connectionPromise = (async () => {
    try {
      await client.connect();
    } catch (err) {
      connectionPromise = null;
      connectionAttempted = false;
      throw err;
    }
  })();

  try {
    await connectionPromise;
    return true;
  } catch {
    return false;
  }
}

const client = getRedisClient();

const redisProxy = new Proxy(client, {
  get(target, prop: string | symbol) {
    const originalValue = (target as any)[prop];

    if (typeof originalValue === 'function') {
      return async (...args: any[]) => {
        const connected = await ensureConnection();
        if (!connected || !target.isOpen) {
          throw new Error('Redis client is not connected');
        }
        return originalValue.apply(target, args);
      };
    }

    return originalValue;
  },
});

export default redisProxy;
