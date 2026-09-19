import path from 'path';
import { MessageContext, MessageEventContext, VK } from 'vk-io';
import BaseCommand from './BaseCommand';
import BaseButton from './BaseButton';
import CommandsLoading from './CommandsLoading';
import SendVK from './SendVK';
import logger from '../logger';
import checkCooldown from '../helpers/checkCooldown';
import buildMessageAsHTML from '../helpers/buildMessageAsHTML';
import userService from '../services/user.service';
import { BOT_CONFIG, IDeveloperInfo } from '../config/bot';
import { ISettingsCommand, ISettingsButton, IUserRecord } from '../types';

export type VKClientPaths = {
  commands: string;
  buttons: string;
};

export type VKClientOptions = {
  paths: VKClientPaths;
  developers?: Record<number, IDeveloperInfo>;
};

class VKClient {
  readonly client: VK;
  private readonly developers: Record<number, IDeveloperInfo>;
  private readonly paths: VKClientPaths;
  private readonly commands = new Map<string, BaseCommand>();
  private readonly buttons = new Map<string, BaseButton>();
  private readonly buttonCooldowns = new Map<string, Map<number, number>>();
  private readonly commandsLoader: CommandsLoading;
  private commandsInitialized = false;
  private techWorksMode = false;

  constructor(options: VKClientOptions) {
    const token = process.env.VK_TOKEN;
    if (!token) {
      throw new Error('VK_TOKEN не задан в переменных окружения (.env)');
    }

    this.client = new VK({ token });
    this.paths = options.paths;
    this.developers = options.developers || BOT_CONFIG.developers;
    this.commandsLoader = new CommandsLoading(this, this.paths);
  }

  async start(): Promise<void> {
    logger.info('Запуск клиента VK...');

    await userService.init();
    await this.commandsLoader.init();

    this.client.updates.on('message_new', (ctx) => this.handleMessage(ctx));
    this.client.updates.on('message_event', (ctx) => this.handleButton(ctx));

    await this.client.updates.start();

    const uniqueCommands = new Set(this.commands.values()).size;
    const uniqueButtons = new Set(this.buttons.values()).size;

    logger.info(`VK бот успешно запущен! Загружено команд: ${uniqueCommands}, кнопок: ${uniqueButtons}`);

    const startupChatId = Number(process.env.STARTUP_CHAT_ID);
    if (startupChatId && startupChatId > 2_000_000_000) {
      this.client.api.messages
        .send({
          peer_id: startupChatId,
          message: '🚀 Бот успешно запущен и готов к работе!',
          random_id: 0,
        })
        .catch((err) => {
          logger.warn('Не удалось отправить уведомление о запуске:', err?.message || err);
        });
    }
  }

  public setCommandsInitialized(value: boolean) {
    this.commandsInitialized = value;
  }

  public isCommandsInitialized(): boolean {
    return this.commandsInitialized;
  }

  public resetCommands() {
    this.commands.clear();
  }

  public resetButtons() {
    this.buttons.clear();
  }

  public registerCommand(name: string, command: BaseCommand) {
    const lowerName = name.toLowerCase();
    this.commands.set(lowerName, command);

    const aliases = command.settings?.aliases || [];
    for (const alias of aliases) {
      this.commands.set(alias.toLowerCase(), command);
    }
  }

  public registerButton(name: string, button: BaseButton) {
    this.buttons.set(name.toLowerCase(), button);
  }

  public getCommandByName(name: string): BaseCommand | undefined {
    return this.commands.get(name.toLowerCase());
  }

  public getAllCommands(): BaseCommand[] {
    return Array.from(new Set(this.commands.values()));
  }

  public async reloadCommands() {
    return this.commandsLoader.reloadCommands(true);
  }

  public async reloadButtons() {
    return this.commandsLoader.reloadButtons(true);
  }

  public async reloadAll() {
    const [commands, buttons] = await Promise.all([
      this.commandsLoader.reloadCommands(true),
      this.commandsLoader.reloadButtons(true),
    ]);
    return { commands, buttons };
  }

  public clearModuleCacheByDir(dir: string): number {
    const req = typeof require === 'function' ? require : null;
    const cache = req?.cache as Record<string, unknown> | undefined;
    if (!cache) return 0;
    const normalized = path.resolve(dir);
    let cleared = 0;
    for (const key of Object.keys(cache)) {
      if (key.startsWith(normalized)) {
        delete cache[key];
        cleared++;
      }
    }
    return cleared;
  }

  public isDeveloper(userId: number): boolean {
    return Boolean(this.developers[userId]) || userService.isDeveloper(userId);
  }

  public setTechWorks(enabled: boolean) {
    this.techWorksMode = enabled;
  }

  public isTechWorks(): boolean {
    return this.techWorksMode;
  }

  public isCommandAllowed(
    command: BaseCommand,
    senderId: number,
    isChat: boolean,
    peerId: number | null,
    user: IUserRecord
  ): boolean {
    const settings: ISettingsCommand = command.settings;

    if (settings.disabled) return false;

    if (settings.devOnly && !this.isDeveloper(senderId)) {
      return false;
    }

    if (isChat && !settings.canUseInChats) return false;
    if (!isChat && !settings.canUseInDirect) return false;

    if (settings.chatsId && settings.chatsId.length > 0) {
      if (!peerId || !settings.chatsId.includes(peerId)) {
        if (!this.isDeveloper(senderId)) return false;
      }
    }

    const requiredAccess = settings.access ?? 0;
    if (user.accessLevel < requiredAccess && !this.isDeveloper(senderId)) {
      return false;
    }

    return true;
  }

  public getAvailableCommands(
    senderId: number,
    isChat: boolean,
    peerId: number | null,
    user: IUserRecord
  ): BaseCommand[] {
    const unique = this.getAllCommands();
    return unique.filter((cmd) => this.isCommandAllowed(cmd, senderId, isChat, peerId, user));
  }

  private parseCommand(ctx: MessageContext): { name: string; args: string[] } | null {
    const payloadCommand = (ctx.messagePayload as any)?.command;
    if (payloadCommand && typeof payloadCommand === 'string') {
      return { name: payloadCommand.toLowerCase(), args: [] };
    }

    if (!ctx.text) return null;
    const text = ctx.text.trim();

    const prefix = BOT_CONFIG.prefixes.find((p) => text.startsWith(p));
    if (!prefix) return null;

    const withoutPrefix = text.slice(prefix.length).trim();
    const parts = withoutPrefix.split(/\s+/u);
    const name = parts.shift();
    if (!name) return null;

    return { name: name.toLowerCase(), args: parts };
  }

  private async handleMessage(ctx: MessageContext): Promise<void> {
    if (ctx.isOutbox) return;

    const parsed = this.parseCommand(ctx);
    if (!parsed) return;

    const command = this.commands.get(parsed.name);
    if (!command) return;

    if (!this.commandsInitialized) {
      await ctx.reply(buildMessageAsHTML('⚠️ Команды инициализируются, попробуйте через секунду...'));
      return;
    }

    logger.cmd(ctx.senderId, ctx.text || parsed.name);

    const user = await userService.ensure(ctx.senderId);

    if (this.techWorksMode && !this.isDeveloper(ctx.senderId)) {
      await ctx.reply(buildMessageAsHTML('⚠️ | Бот временно находится в режиме технических работ!'));
      return;
    }

    if (!this.isCommandAllowed(command, ctx.senderId, ctx.isChat, ctx.peerId ?? null, user)) {
      await ctx.reply(buildMessageAsHTML('⛔ | У вас нет доступа к этой команде.'));
      return;
    }

    if (!this.isDeveloper(ctx.senderId) && (command.settings.cooldown ?? 0) > 0) {
      const [allowed, remaining] = checkCooldown(String(ctx.senderId), command.data.name, command.settings.cooldown!);
      if (!allowed) {
        await SendVK.warn(ctx, `Подождите ${remaining.toFixed(1)} сек. перед повторным использованием команды.`);
        return;
      }
    }

    try {
      await command.execute(ctx, parsed.args);
    } catch (err: any) {
      logger.error(`Ошибка при выполнении команды ${parsed.name}:`, err);
      if (err?.code) {
        await SendVK.danger(ctx, `Ошибка VK API: ${err.message} [Код: ${err.code}]`);
      } else {
        await SendVK.danger(ctx, `Произошла непредвиденная ошибка при выполнении команды /${parsed.name}.`);
      }
    }
  }

  private parseButton(ctx: MessageEventContext): { name: string; args: string[] } | null {
    const payloadCommand = (ctx.eventPayload as any)?.command;
    if (payloadCommand && typeof payloadCommand === 'string') {
      return { name: payloadCommand.toLowerCase(), args: [] };
    }
    return null;
  }

  private isButtonOnCooldown(buttonName: string, userId: number, cooldownSeconds: number): boolean {
    if (cooldownSeconds <= 0) return false;
    const map = this.buttonCooldowns.get(buttonName) || new Map<number, number>();
    const expiresAt = map.get(userId) || 0;
    if (Date.now() < expiresAt) return true;

    map.set(userId, Date.now() + cooldownSeconds * 1000);
    this.buttonCooldowns.set(buttonName, map);
    return false;
  }

  private async handleButton(ctx: MessageEventContext): Promise<void> {
    const parsed = this.parseButton(ctx);
    if (!parsed) return;

    const button = this.buttons.get(parsed.name);
    if (!button) return;

    const user = await userService.ensure(ctx.userId);

    if (button.settings.devOnly && !this.isDeveloper(ctx.userId)) {
      await ctx.answer({ type: 'show_snackbar', text: '⛔ Доступ запрещен' }).catch(() => {});
      return;
    }

    if ((button.settings.access ?? 0) > user.accessLevel && !this.isDeveloper(ctx.userId)) {
      await ctx.answer({ type: 'show_snackbar', text: '⛔ Недостаточно прав' }).catch(() => {});
      return;
    }

    const cd = button.settings.cooldown ?? 1;
    if (!this.isDeveloper(ctx.userId) && this.isButtonOnCooldown(button.data.name, ctx.userId, cd)) {
      await ctx.answer({ type: 'show_snackbar', text: '⏳ Подождите секунду...' }).catch(() => {});
      return;
    }

    try {
      await button.execute(ctx, parsed.args);
    } catch (err: any) {
      logger.error(`Ошибка при обработке кнопки ${button.data.name}:`, err);
      await ctx.answer({ type: 'show_snackbar', text: '❌ Произошла ошибка' }).catch(() => {});
    }
  }
}

export default VKClient;