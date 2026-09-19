import { MessageContext } from 'vk-io';
import { START_TIME } from '../../envs';
import BaseCommand from '../../structures/BaseCommand';
import buildMessageAsHTML from '../../helpers/buildMessageAsHTML';
import { BOT_INFO } from '../../constants';
import vk from '../../bot';

class PingCommand extends BaseCommand {
  constructor() {
    super({
      data: {
        name: 'ping',
        description: 'Проверить работоспособность и задержку бота',
      },
      settings: {
        aliases: ['пинг', 'uptime'],
        category: 'Main',
        canUseInDirect: true,
        canUseInChats: true,
        cooldown: 3,
        access: 0,
      },
    });
  }

  private calculateUptime(): string {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0) parts.push(`${hours}ч`);
    if (minutes > 0) parts.push(`${minutes}м`);
    parts.push(`${seconds}с`);

    return parts.join(' ');
  }

  protected async cmd(ctx: MessageContext): Promise<void> {
    const startTime = Date.now();
    await vk.client.api.messages.markAsRead({}).catch(() => {});
    const pingTime = Date.now() - startTime;

    const memoryUsage = process.memoryUsage();
    const heapUsedMb = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);

    const message: string[] = [
      '✅ <b>Бот успешно функционирует!</b>',
      '',
      `🏷️ <b>Проект:</b> ${BOT_INFO.name} v${BOT_INFO.version}`,
      `⏱️ <b>Задержка VK API:</b> ${pingTime} мс`,
      `⏳ <b>Время непрерывной работы:</b> ${this.calculateUptime()}`,
      `🧠 <b>Использование памяти:</b> ${heapUsedMb} MB`,
      `🟢 <b>Платформа:</b> Node.js ${process.version}`,
    ];

    await ctx.reply(buildMessageAsHTML(message.join('\n')));
  }
}

export default new PingCommand();
