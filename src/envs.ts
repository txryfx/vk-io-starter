import 'dotenv/config';
import env from 'env-var';

const { get } = env;

export const START_TIME = new Date();
export const NODE_ENV = get('NODE_ENV').default('development').asString();
export const VK_TOKEN = get('VK_TOKEN').default('').asString();
export const VK_GROUP_ID = get('VK_GROUP_ID').default(0).asInt();
export const LOCAL_SERVER_PORT = get('LOCAL_SERVER_PORT').default(8777).asPortNumber();
export const REDIS_URL = get('REDIS_URL').default('redis://localhost:6379').asString();