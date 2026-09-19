import 'dotenv/config';
import VKClient from './structures/VKClient';
import { BOT_CONFIG } from './config/bot';

const vk = new VKClient({
  paths: BOT_CONFIG.paths,
  developers: BOT_CONFIG.developers,
});

export default vk;
