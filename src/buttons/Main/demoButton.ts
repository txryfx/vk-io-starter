import { KeyboardBuilder, MessageEventContext } from 'vk-io';
import BaseButton from '../../structures/BaseButton';
import demoService from '../../services/demo.service';
import buildMessageAsHTML from '../../helpers/buildMessageAsHTML';
import vk from '../../bot';

type DemoPayload = {
  command: 'demo_action';
  action: 'refresh' | 'snackbar';
  owner: number;
};

class DemoButton extends BaseButton {
  constructor() {
    super({
      data: {
        name: 'demo_action',
        description: 'Обработчик демонстрационных действий кнопки',
      },
      settings: {
        type: 'callback',
        cooldown: 1,
        access: 0,
      },
    });
  }

  protected async cmd(ctx: MessageEventContext): Promise<void> {
    const payload = ctx.eventPayload as DemoPayload | undefined;

    if (!payload || payload.command !== 'demo_action') {
      await ctx.answer({ type: 'show_snackbar', text: '⚠️ Некорректное действие' }).catch(() => {});
      return;
    }

    if (payload.owner && payload.owner !== ctx.userId) {
      await ctx.answer({ type: 'show_snackbar', text: '⚠️ Эта клавиатура не для вас!' }).catch(() => {});
      return;
    }

    if (payload.action === 'snackbar') {
      await ctx.answer({
        type: 'show_snackbar',
        text: '🔔 Тестовое всплывающее уведомление! Системы работают стабильно.',
      }).catch(() => {});
      return;
    }

    if (payload.action === 'refresh') {
      await demoService.incrementInteraction(ctx.userId);
      const data = await demoService.getDemoOverview(ctx.userId);

      const messageLines: string[] = [
        `<b>${data.title}</b>`,
        `<i>${data.description}</i>`,
        '',
        `<b>📊 Статус:</b> ${data.systemStatus}`,
        `<b>🏷️ Версия сборки:</b> v${data.botVersion}`,
        `<b>⏱️ Время обновления:</b> ${data.timestamp}`,
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
          payload: { command: 'demo_action', action: 'refresh', owner: ctx.userId },
          color: 'positive',
        })
        .callbackButton({
          label: '⚡ Тестовый Snackbar',
          payload: { command: 'demo_action', action: 'snackbar', owner: ctx.userId },
          color: 'primary',
        })
        .row()
        .callbackButton({
          label: '📚 Открыть помощь',
          payload: { command: 'help', action: 'open_category', category: 'Main', owner: ctx.userId },
          color: 'secondary',
        });

      const formatted = buildMessageAsHTML(messageLines.join('\n'));

      if (ctx.peerId && ctx.conversationMessageId) {
        try {
          await vk.client.api.messages.edit({
            peer_id: ctx.peerId,
            conversation_message_id: ctx.conversationMessageId,
            message: formatted.message,
            format_data: formatted.format_data,
            keyboard,
          });
        } catch {
          // ignore
        }
      }

      await ctx.answer({
        type: 'show_snackbar',
        text: `✅ Сообщение обновлено! Взаимодействий: ${data.interactionCount}`,
      }).catch(() => {});
    }
  }
}

export default new DemoButton();
