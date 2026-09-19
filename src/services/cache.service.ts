import logger from '../logger';
import BaseService from '../structures/BaseService';
import redis from '../redis';

type CacheValue = string | number | boolean | object | any[];
type CacheOptions = {
  lifetime?: number;
};

class CacheService extends BaseService {
  public readonly DEFAULT_CACHE_TIME = 3600;
  private readonly memoryCache = new Map<string, { value: any; expiresAt: number }>();

  async set(key: string, data: CacheValue, options: CacheOptions = {}): Promise<boolean> {
    const lifetime = options.lifetime ?? this.DEFAULT_CACHE_TIME;

    try {
      let serialized: string;
      if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        serialized = String(data);
      } else {
        serialized = JSON.stringify(data);
      }

      await redis.set(key, serialized, { EX: lifetime });
      return true;
    } catch {
      this.memoryCache.set(key, {
        value: data,
        expiresAt: Date.now() + lifetime * 1000,
      });
      return true;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      if (raw !== null) {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }
    } catch {
      // ignore
    }

    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  async del(key: string): Promise<boolean> {
    this.memoryCache.delete(key);
    try {
      await redis.del(key);
      return true;
    } catch {
      return true;
    }
  }
}

export default new CacheService();
