import { KeyboardBuilder, MessageEventContext } from 'vk-io';
import BaseButton from '../../structures/BaseButton';
import userService from '../../services/user.service';
import { BOT_CONFIG } from '../../config/bot';
import buildMessageAsHTML from '../../helpers/buildMessageAsHTML';
import BaseCommand from '../../structures/BaseCommand';
import vk from '../../bot';

type HelpPayload =
  | { command: 'help'; action: 'open_category'; category: string; owner: number }
  | { command: 'help'; action: 'back'; owner: number };

function buildCategoriesKeyboard(categories: string[], ownerId: number): KeyboardBuilder {
  const kb = new KeyboardBuilder().inline();
  categories.forEach((cat, idx) => {
    const label = BOT_CONFIG.categories[cat] || `📁 ${cat}`;
    kb.callbackButton({
      label,
      payload: { command: 'help', action: 'open_category', category: cat, owner: ownerId },
      color: 'secondary',
    });
    if (idx % 2 === 1 && idx !== categories.length - 1) {
      kb.row();
    }
  });
  return kb;
}

function buildCommandsText(category: string, commands: BaseCommand[]): string {
  const label = BOT_CONFIG.categories[category] || category;
  const filtered = commands.filter((c) => (c.settings.category || 'Main') === category);

  if (filtered.length === 0) {
    return `📜 <b>Команды категории ${label}:</b>\n\nНет доступных команд.`;
  }

  const list = filtered
    .map((c) => {
      const aliases = c.settings.aliases?.length ? ` <i>(${c.settings.aliases.map((a) => `/${a}`).join(', ')})</i>` : '';
      return `• <b>/${c.data.name}</b>${aliases} — ${c.data.description || 'Без описания'}`;
    })
    .join('\n');

  return `📜 <b>Команды категории ${label}:</b>\n\n${list}`;
}

class HelpButton extends BaseButton {
  constructor() {
    super({
      data: {
        name: 'help',
        description: 'Навигация по меню помощи',
      },
      settings: {
        type: 'callback',
        cooldown: 1,
        access: 0,
      },
    });
  }

  protected async cmd(ctx: MessageEventContext): Promise<void> {
    const payload = ctx.eventPayload as HelpPayload | undefined;
    if (!payload || payload.command !== 'help') {
      await ctx.answer({ type: 'show_snackbar', text: '⚠️ Некорректная кнопка' }).catch(() => {});
      return;
    }

    if (payload.owner && payload.owner !== ctx.userId) {
      await ctx.answer({ type: 'show_snackbar', text: '⚠️ Эта клавиатура создана для другого пользователя!' }).catch(() => {});
      return;
    }

    const user = await userService.ensure(ctx.userId);
    const isChat = Boolean(ctx.peerId && ctx.peerId > 2_000_000_000);
    const available = vk.getAvailableCommands(ctx.userId, isChat, ctx.peerId ?? null, user);

    const categoriesSet = new Set<string>();
    for (const cmd of available) {
      categoriesSet.add(cmd.settings.category || 'Main');
    }
    const categories = Array.from(categoriesSet);

    if (payload.action === 'back') {
      const keyboard = buildCategoriesKeyboard(categories, ctx.userId);
      const text = [
        '📖 <b>Навигация по командам бота</b>',
        '',
        'Выберите интересующую категорию с помощью кнопок ниже:',
      ].join('\n');

      const formatted = buildMessageAsHTML(text);

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
          // fallback
        }
      }

      await ctx.answer({ type: 'show_snackbar', text: '⬅️ Главное меню' }).catch(() => {});
      return;
    }

    if (payload.action === 'open_category') {
      const text = buildCommandsText(payload.category, available);
      const keyboard = new KeyboardBuilder()
        .inline()
        .callbackButton({
          label: '⬅️ Назад к категориям',
          payload: { command: 'help', action: 'back', owner: ctx.userId },
          color: 'primary',
        });

      const formatted = buildMessageAsHTML(text);

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
          // fallback
        }
      }

      await ctx.answer({ type: 'show_snackbar', text: `📁 ${payload.category}` }).catch(() => {});
    }
  }
}

export default new HelpButton();
