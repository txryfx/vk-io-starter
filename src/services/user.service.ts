import BaseService from '../structures/BaseService';
import pool from '../db';
import { BOT_CONFIG } from '../config/bot';
import { IUserRecord } from '../types';

class UserService extends BaseService {
  private readonly memoryUsers = new Map<number, IUserRecord>();
  private isDbAvailable = false;

  async init(): Promise<void> {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          vk_id BIGINT PRIMARY KEY,
          access_level TINYINT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      this.isDbAvailable = true;
      this.logger.info('UserService: Таблица пользователей в MySQL инициализирована');
    } catch {
      this.isDbAvailable = false;
      this.logger.warn('UserService: MySQL недоступна, используется in-memory хранилище пользователей');
    }
  }

  async getByVkId(vkId: number): Promise<IUserRecord | null> {
    if (this.isDbAvailable) {
      try {
        const [rows] = await pool.execute(
          'SELECT vk_id as vkId, access_level as accessLevel, created_at as createdAt, updated_at as updatedAt FROM users WHERE vk_id = ? LIMIT 1',
          [vkId]
        );
        const list = rows as IUserRecord[];
        if (list[0]) return list[0];
      } catch {
        // ignore
      }
    }

    return this.memoryUsers.get(vkId) || null;
  }

  async ensure(vkId: number): Promise<IUserRecord> {
    const existing = await this.getByVkId(vkId);
    if (existing) return existing;

    const isDeveloper = Boolean(BOT_CONFIG.developers[vkId]);
    const initialAccess = isDeveloper ? 3 : 0;

    const newUser: IUserRecord = {
      vkId,
      accessLevel: initialAccess,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isDbAvailable) {
      try {
        await pool.execute(
          'INSERT INTO users (vk_id, access_level) VALUES (?, ?) ON DUPLICATE KEY UPDATE access_level = VALUES(access_level)',
          [vkId, initialAccess]
        );
      } catch {
        // ignore
      }
    }

    this.memoryUsers.set(vkId, newUser);
    return newUser;
  }

  async setAccessLevel(vkId: number, level: number): Promise<void> {
    const user = await this.ensure(vkId);
    user.accessLevel = level;
    user.updatedAt = new Date();
    this.memoryUsers.set(vkId, user);

    if (this.isDbAvailable) {
      try {
        await pool.execute('UPDATE users SET access_level = ? WHERE vk_id = ?', [level, vkId]);
      } catch {
        // ignore
      }
    }
  }

  isDeveloper(vkId: number): boolean {
    return Boolean(BOT_CONFIG.developers[vkId]);
  }
}

export default new UserService();
