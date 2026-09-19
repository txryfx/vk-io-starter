import { MessageContext, IMessageContextSendOptions } from 'vk-io';

class SendVK {
  async success(ctx: MessageContext, text: string | IMessageContextSendOptions, params?: IMessageContextSendOptions) {
    if (typeof text === 'string') {
      return await ctx.send(`✅ | ${text}`, params);
    }
    text.message = `✅ | ${text.message}`;
    return await ctx.send(text);
  }

  async usage(ctx: MessageContext, text: string | IMessageContextSendOptions, params?: IMessageContextSendOptions) {
    if (typeof text === 'string') {
      return await ctx.send(`🎲 | Формат команды: ${text}`, params);
    }
    text.message = `🎲 | Формат команды: ${text.message}`;
    return await ctx.send(text);
  }

  async warn(ctx: MessageContext, text: string | IMessageContextSendOptions, params?: IMessageContextSendOptions) {
    if (typeof text === 'string') {
      return await ctx.send(`⚠️ | ${text}`, params);
    }
    text.message = `⚠️ | ${text.message}`;
    return await ctx.send(text);
  }

  async danger(ctx: MessageContext, text: string | IMessageContextSendOptions, params?: IMessageContextSendOptions) {
    if (typeof text === 'string') {
      return await ctx.send(`⛔ | ${text}`, params);
    }
    text.message = `⛔ | ${text.message}`;
    return await ctx.send(text);
  }

  async info(ctx: MessageContext, text: string | IMessageContextSendOptions, params?: IMessageContextSendOptions) {
    if (typeof text === 'string') {
      return await ctx.send(`ℹ️ | ${text}`, params);
    }
    text.message = `ℹ️ | ${text.message}`;
    return await ctx.send(text);
  }
}

export default new SendVK();