import { MessageContext } from 'vk-io';
import BaseCommand from '../../structures/BaseCommand';
import SendVK from '../../structures/SendVK';
import vk from '../../bot';

type ReloadTarget = 'commands' | 'buttons' | 'all';
const VALID_TARGETS: ReloadTarget[] = ['commands', 'buttons', 'all'];

class ReloadCommand extends BaseCommand {
  constructor() {
    super({
      data: {
        name: 'reload',
        description: 'Горячая перезагрузка модулей бота',
      },
      settings: {
        aliases: ['rld', 'релоад'],
        devOnly: true,
        category: 'Developers',
        canUseInDirect: true,
        canUseInChats: true,
        cooldown: 2,
        access: 3,
      },
    });
  }

  protected async cmd(ctx: MessageContext, args: string[] = []): Promise<void> {
    const target = (args[0] || 'all').toLowerCase() as ReloadTarget;

    if (!VALID_TARGETS.includes(target)) {
      await SendVK.usage(ctx, `/reload [${VALID_TARGETS.join(' | ')}]`);
      return;
    }

    if (target === 'commands') {
      const res = await vk.reloadCommands();
      await SendVK.success(
        ctx,
        `Команды перезагружены!\nЗагружено: ${res.loaded} (дубликатов: ${res.duplicates}, ошибок: ${res.errors})`
      );
      return;
    }

    if (target === 'buttons') {
      const res = await vk.reloadButtons();
      await SendVK.success(
        ctx,
        `Кнопки перезагружены!\nЗагружено: ${res.loaded} (дубликатов: ${res.duplicates}, ошибок: ${res.errors})`
      );
      return;
    }

    if (target === 'all') {
      const res = await vk.reloadAll();
      await SendVK.success(
        ctx,
        `Все модули перезагружены!\n` +
          `• Команды: ${res.commands.loaded} (дубл: ${res.commands.duplicates}, ошибок: ${res.commands.errors})\n` +
          `• Кнопки: ${res.buttons.loaded} (дубл: ${res.buttons.duplicates}, ошибок: ${res.buttons.errors})`
      );
    }
  }
}

export default new ReloadCommand();
