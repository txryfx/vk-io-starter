import { MessageContext } from 'vk-io';
import { ICommandInfoVK, IConstructorParams, ISettingsCommand, TBeforeExecuteFunction } from '../types';

abstract class BaseCommand {
  private readonly beforeExecute: TBeforeExecuteFunction[];
  settings: ISettingsCommand;
  data: ICommandInfoVK;

  protected constructor({ beforeExecute = [], settings, data }: IConstructorParams) {
    this.beforeExecute = beforeExecute || [];
    this.settings = {
      chatsId: [],
      aliases: [],
      devOnly: false,
      canUseInDirect: true,
      canUseInChats: true,
      cooldown: 3,
      disabled: false,
      access: 0,
      ...settings,
    };
    this.data = data;
  }

  protected abstract cmd(ctx: MessageContext, args?: string[] | null): Promise<void>;

  async execute(ctx: MessageContext, args?: string[] | null): Promise<void> {
    if (Array.isArray(this.beforeExecute)) {
      for (const fn of this.beforeExecute) {
        if (typeof fn === 'function') {
          await fn.call(this, ctx);
        }
      }
    }

    await this.cmd(ctx, args ?? null);
  }
}

export default BaseCommand;
