import { CronJob } from 'cron';
import demoCron from './demoCron';
import logger from '../logger';

const JOBS: CronJob[] = [];

export function startCrons(): void {
  logger.info('Запуск системы фоновых задач (Crons)...');

  const cronConfigs = [demoCron];

  for (const config of cronConfigs) {
    try {
      const job = new CronJob(
        config.cronTime,
        config.onTick,
        null,
        true,
        'Europe/Moscow'
      );

      JOBS.push(job);
      logger.info(`Крон запланирован: ${config.name} (${config.cronTime})`);
    } catch (error) {
      logger.error(`Не удалось запустить крон ${config.name}:`, error);
    }
  }
}

export function stopCrons(): void {
  for (const job of JOBS) {
    job.stop();
  }
  logger.info('Все фоновые задачи остановлены');
}