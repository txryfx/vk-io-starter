import BaseService from '../structures/BaseService';
import { DEMO_CONSTANTS, BOT_INFO } from '../constants';
import cacheService from './cache.service';

export interface IDemoData {
  title: string;
  description: string;
  systemStatus: string;
  features: string[];
  interactionCount: number;
  botVersion: string;
  timestamp: string;
}

class DemoService extends BaseService {
  private readonly CACHE_KEY_PREFIX = 'demo:interactions:';

  async getDemoOverview(userId: number): Promise<IDemoData> {
    this.logger.debug(`DemoService: сбор данных для пользователя id${userId}`);

    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
    const interactionCount = (await cacheService.get<number>(cacheKey)) || 0;

    return {
      title: DEMO_CONSTANTS.TITLE,
      description: DEMO_CONSTANTS.DESCRIPTION,
      systemStatus: DEMO_CONSTANTS.SYSTEM_STATUS,
      features: DEMO_CONSTANTS.FEATURES,
      interactionCount,
      botVersion: BOT_INFO.version,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
    };
  }

  async incrementInteraction(userId: number): Promise<number> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
    const current = (await cacheService.get<number>(cacheKey)) || 0;
    const updated = current + 1;

    await cacheService.set(cacheKey, updated, { lifetime: 86400 });
    this.logger.info(`DemoService: пользователь id${userId} кликнул кнопку, счетчик: ${updated}`);
    return updated;
  }
}

export default new DemoService();
