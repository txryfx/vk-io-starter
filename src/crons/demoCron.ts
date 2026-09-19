import logger from '../logger';

export default {
  name: 'demoHeartbeatCron',
  cronTime: '0 */30 * * * *',
  onTick: async () => {
    logger.debug('[Cron] Фоновый пульс: системы бота работают стабильно');
  },
};
