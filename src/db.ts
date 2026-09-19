import mysql from 'mysql2/promise';
import logger from './logger';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vk_bot',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false,
});

const KEEP_ALIVE_INTERVAL_MS = 60_000;
let keepAliveTimer: NodeJS.Timeout | null = null;

export async function testDbConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logger.info('MySQL: соединение успешно установлено');

    if (!keepAliveTimer) {
      keepAliveTimer = setInterval(() => {
        pool.query('SELECT 1').catch(() => {});
      }, KEEP_ALIVE_INTERVAL_MS);
    }
    return true;
  } catch {
    logger.warn('MySQL: сервер БД недоступен. Работа продолжится в автономном режиме (in-memory).');
    return false;
  }
}

export default pool;