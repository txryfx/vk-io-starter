import logger from '../logger';

abstract class BaseService {
  protected readonly logger = logger;

  async init?(): Promise<void>;
}

export default BaseService;
