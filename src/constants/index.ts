export const BOT_INFO = {
  name: 'VK Bot Boilerplate',
  version: '1.0.0',
  description: 'Масштабируемый шаблон VK-бота на TypeScript',
  githubUrl: 'https://github.com/your-username/vk-bot-boilerplate',
};

export const COLORS = {
  Main: 0x4a76a8,
  Success: 0x4bb34b,
  Error: 0xe64646,
  Warning: 0xffa000,
  Info: 0x5181b8,
};

export const DEMO_CONSTANTS = {
  TITLE: '🚀 Демонстрация архитектуры VK-бота',
  DESCRIPTION: 'Эта команда и связанные с ней сервисы иллюстрируют сквозное взаимодействие модулей.',
  SYSTEM_STATUS: '🟢 Все модули функционируют в штатном режиме',
  FEATURES: [
    '⚡ Динамический загрузчик команд и callback-кнопок',
    '🛡️ Проверка прав доступа и настраиваемый Cooldown',
    '💾 Сервисный слой с поддержкой кеширования и fallback',
    '🔄 Интерактивное редактирование сообщений и Snackbars',
    '⏰ Планировщик фоновых периодических задач (Cron)',
  ],
  DEFAULT_ACCENT_COLOR: 'positive' as const,
};

export const DAY_IN_MS = 86_400_000;
export const HOUR_IN_MS = 3_600_000;
export const MINUTE_IN_MS = 60_000;
export const SECOND_IN_MS = 1_000;