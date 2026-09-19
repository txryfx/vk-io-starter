import { MessageEventContext } from 'vk-io';
import { ICommandInfoVK, IConstructorParamsButton, ISettingsButton, TBeforeExecuteButtonFunction } from '../types';

abstract class BaseButton {
  private readonly beforeExecute: TBeforeExecuteButtonFunction[];
  settings: ISettingsButton;
  data: ICommandInfoVK;
  type: 'text' | 'callback';

  protected constructor({ beforeExecute = [], settings, data }: IConstructorParamsButton) {
    this.beforeExecute = beforeExecute || [];
    this.settings = {
      category: 'Main',
      cooldown: 1,
      disabled: false,
      access: 0,
      ...settings,
    };
    this.data = data;
    this.type = this.settings.type;
  }

  protected abstract cmd(ctx: MessageEventContext, args: string[] | null): Promise<void>;

  async execute(ctx: MessageEventContext, args: string[] | null = null): Promise<void> {
    if (Array.isArray(this.beforeExecute)) {
      for (const fn of this.beforeExecute) {
        if (typeof fn === 'function') {
          await fn.call(this, ctx);
        }
      }
    }

    await this.cmd(ctx, args);
  }
}

export default BaseButton;
