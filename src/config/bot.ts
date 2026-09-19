export interface IDeveloperInfo {
  name: string;
  role: string;
  icon: string;
}

export const BOT_CONFIG = {
  prefixes: ['/', '!'],
  paths: {
    commands: './src/commands/',
    buttons: './src/buttons/',
  },
  developers: {
    1: {
      name: 'Pavel Durov',
      role: 'Главный разработчик',
      icon: '👑',
    },
  } as Record<number, IDeveloperInfo>,
  categories: {
    Main: '💼 | Основные',
    Developers: '💻 | Разработчики',
    Info: 'ℹ️ | Информация',
  } as Record<string, string>,
  defaultCooldown: 3,
};
