/**
 * Создает промис, который разрешается через указанное количество миллисекунд.
 *
 * @param {number} ms - Количество миллисекунд, через которое промис будет разрешен.
 * @param {AbortSignal} signal - Опциональный сигнал для отмены операции.
 * @returns {Promise<void>} - Промис, который разрешается после указанного времени.
 *
 * @example
 * // Ждет 2 секунды перед выполнением следующего кода
 * await delay(2000);
 * logger.info('Две секунды прошли!');
 */
export default (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('canceled'));
      return;
    }

    const timeout = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }

      resolve();
    }, ms);

    const abortHandler = () => {
      clearTimeout(timeout);
      reject(new Error('canceled'));
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
};
