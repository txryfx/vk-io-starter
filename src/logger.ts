function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info: (...args: any[]) => {
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
  },
  warn: (...args: any[]) => {
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
    }
  },
  cmd: (senderId: number, text: string) => {
    console.log(`[${getTimestamp()}] [CMD] [id${senderId}]: ${text}`);
  }
};

export default logger;
