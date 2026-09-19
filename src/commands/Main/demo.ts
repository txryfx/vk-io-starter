import { KeyboardBuilder, MessageContext } from 'vk-io';
import BaseCommand from '../../structures/BaseCommand';
import demoService from '../../services/demo.service';
import buildMessageAsHTML from '../../helpers/buildMessageAsHTML';

class DemoCommand extends BaseCommand {
  constructor() {
    super({
      data: {
        name: 'demo',
        description: 'Демонстрация архитектуры и сквозных систем бота',
      },
      settings: {
        aliases: ['демо', 'test', 'тест'],
        category: 'Main',
        canUseInChats: true,
        canUseInDirect: true,
        cooldown: 2,
        access: 0,
      },
    });
  }

  protected async cmd(ctx: MessageContext): Promise<void> {
    const data = await demoService.getDemoOverview(ctx.senderId);

    const messageLines: string[] = [
      `<b>${data.title}</b>`,
      `<i>${data.description}</i>`,
      '',
      `<b>📊 Статус:</b> ${data.systemStatus}`,
      `<b>🏷️ Версия сборки:</b> v${data.botVersion}`,
      `<b>⏱️ Время генерации:</b> ${data.timestamp}`,
      `<b>🔘 Ваши взаимодействия с кнопкой:</b> <code>${data.interactionCount}</code>`,
      '',
      '<b>✨ Задействованные архитектурные компоненты:</b>',
      ...data.features.map((f) => `• ${f}`),
      '',
      '👇 <i>Нажмите на инлайн-кнопку ниже для проверки работы Callback-событий:</i>',
    ];

    const keyboard = new KeyboardBuilder()
      .inline()
      .callbackButton({
        label: '🔄 Обновить данные',
        payload: { command: 'demo_action', action: 'refresh', owner: ctx.senderId },
        color: 'positive',
      })
      .callbackButton({
        label: '⚡ Тестовый Snackbar',
        payload: { command: 'demo_action', action: 'snackbar', owner: ctx.senderId },
        color: 'primary',
      })
      .row()
      .callbackButton({
        label: '📚 Открыть помощь',
        payload: { command: 'help', action: 'open_category', category: 'Main', owner: ctx.senderId },
        color: 'secondary',
      });

    const formatted = buildMessageAsHTML(messageLines.join('\n'));

    await ctx.reply({
      message: formatted.message,
      format_data: formatted.format_data,
      keyboard,
    });
  }
}

export default new DemoCommand();
