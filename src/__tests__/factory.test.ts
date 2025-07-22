import { createLogger } from '../factory/core';
import { LoggerConfig } from '../core';

describe('Logger Factory', () => {
  it('should create a logger without errors', async () => {
    const config: LoggerConfig = {
      level: { default: 'info' },
      server: { outputs: [{ type: 'stdout' }] },
      client: { outputs: [{ type: 'console' }] },
    };
    await expect(createLogger('test-logger', config)).resolves.toBeDefined();
  });
});