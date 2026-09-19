import { KeyboardBuilder, MessageContext } from 'vk-io';
import BaseCommand from '../../structures/BaseCommand';
import userService from '../../services/user.service';
import { BOT_CONFIG } from '../../config/bot';
import buildMessageAsHTML from '../../helpers/buildMessageAsHTML';
import vk from '../../bot';

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

class HelpCommand extends BaseCommand {
  constructor() {
    super({
      data: {
        name: 'help',
        description: 'Интерактивное меню команд бота',
      },
      settings: {
        aliases: ['помощь', 'команды', 'хелп'],
        category: 'Main',
        canUseInDirect: true,
        canUseInChats: true,
        cooldown: 2,
        access: 0,
      },
    });
  }

  protected async cmd(ctx: MessageContext): Promise<void> {
    const user = await userService.ensure(ctx.senderId);
    const available = vk.getAvailableCommands(ctx.senderId, ctx.isChat, ctx.peerId ?? null, user);

    const categoriesSet = new Set<string>();
    for (const cmd of available) {
      categoriesSet.add(cmd.settings.category || 'Main');
    }
    const categories = Array.from(categoriesSet);

    if (categories.length === 0) {
      await ctx.reply('Нет доступных команд.');
      return;
    }

    const keyboard = buildCategoriesKeyboard(categories, ctx.senderId);
    const text = [
      '📖 <b>Навигация по командам бота</b>',
      '',
      'Выберите интересующую категорию с помощью кнопок ниже:',
    ].join('\n');

    await ctx.reply({
      ...buildMessageAsHTML(text),
      keyboard,
    });
  }
}

export default new HelpCommand();
