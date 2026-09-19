import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import vk from './bot';
import { startCrons, stopCrons } from './crons';
import { testDbConnection } from './db';
import { BOT_INFO } from './constants';
import { START_TIME, LOCAL_SERVER_PORT } from './envs';
import logger from './logger';

const app = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
  res.json({
    status: 'ok',
    bot: BOT_INFO.name,
    version: BOT_INFO.version,
    uptimeSeconds,
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

const httpServer = createServer(app);

async function bootstrap(): Promise<void> {
  logger.info(`Инициализация ${BOT_INFO.name} v${BOT_INFO.version}...`);

  await testDbConnection();
  await vk.start();
  startCrons();

  httpServer.listen(LOCAL_SERVER_PORT, '0.0.0.0', () => {
    logger.info(`Healthcheck HTTP-сервер запущен: http://0.0.0.0:${LOCAL_SERVER_PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Критическая ошибка при запуске бота:', error);
  process.exit(1);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Получен сигнал ${signal}. Завершение работы бота...`);
  stopCrons();
  httpServer.close(() => {
    logger.info('HTTP-сервер остановлен. Выход.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default vk;
