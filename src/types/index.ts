import { MessageContext, MessageEventContext } from 'vk-io';

export type TBeforeExecuteFunction = (ctx: MessageContext) => void | Promise<void>;
export type TBeforeExecuteButtonFunction = (ctx: MessageEventContext) => void | Promise<void>;

export interface ICommandInfoVK {
  name: string;
  description?: string;
}

export interface ISettingsCommand {
  chatsId?: number[];
  aliases?: string[];
  devOnly?: boolean;
  category: string;
  canUseInDirect?: boolean;
  canUseInChats?: boolean;
  cooldown?: number;
  disabled?: boolean;
  access?: number;
}

export interface IConstructorParams {
  data: ICommandInfoVK;
  settings: ISettingsCommand;
  beforeExecute?: TBeforeExecuteFunction[];
}

export interface ISettingsButton {
  type: 'text' | 'callback';
  devOnly?: boolean;
  category?: string;
  cooldown?: number;
  disabled?: boolean;
  access?: number;
}

export interface IConstructorParamsButton {
  data: ICommandInfoVK;
  settings: ISettingsButton;
  beforeExecute?: TBeforeExecuteButtonFunction[];
}

export interface IUserRecord {
  vkId: number;
  accessLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
