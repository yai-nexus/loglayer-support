/**
 * Next.js日志组件测试
 */

import {
  createNextjsLogger,
  createNextjsLoggerPair,
  createNextjsServerLogger,
  createNextjsBrowserLogger,
  createDevelopmentLogger,
  createProductionLogger,
} from '../src/index';

// Mock环境
const originalEnv = process.env;
const originalWindow = global.window;

beforeEach(() => {
  process.env = { ...originalEnv };
  // @ts-ignore
  delete global.window;
});

afterEach(() => {
  process.env = originalEnv;
  global.window = originalWindow;
});

describe('Next.js Logger Integration', () => {
  test('createNextjsLogger should work with minimal config', () => {
    const logger = createNextjsLogger({ appName: 'test-app' });

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('createNextjsLoggerPair should create both server and browser loggers', () => {
    const loggerPair = createNextjsLoggerPair({ appName: 'test-app' });

    expect(loggerPair.server).toBeDefined();
    expect(loggerPair.browser).toBeDefined();
    expect(typeof loggerPair.server.info).toBe('function');
    expect(typeof loggerPair.browser.info).toBe('function');
  });

  test('createNextjsServerLogger should work', () => {
    const logger = createNextjsServerLogger({
      appName: 'test-app',
      environment: 'development',
    });

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  test('createNextjsBrowserLogger should work', () => {
    // Mock browser environment
    global.window = {} as any;

    const logger = createNextjsBrowserLogger({
      appName: 'test-app',
      environment: 'development',
    });

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  test('preset loggers should work', () => {
    const devLogger = createDevelopmentLogger('test-app');
    const prodLogger = createProductionLogger('test-app');

    expect(devLogger).toBeDefined();
    expect(prodLogger).toBeDefined();
  });

  test('logger should be immediately usable', () => {
    const logger = createNextjsLogger({ appName: 'test-app' });

    // Should not throw
    expect(() => {
      logger.info('Test message');
      logger.debug('Debug message');
      logger.warn('Warning message');
      logger.error('Error message');
    }).not.toThrow();
  });

  test('logger with shared config should work', () => {
    const logger = createNextjsLogger({
      appName: 'test-app',
      shared: {
        environment: 'production',
        level: 'warn',
        enableSls: true,
      },
    });

    expect(logger).toBeDefined();
  });

  test('logger with custom server config should work', () => {
    const logger = createNextjsLogger({
      appName: 'test-app',
      server: {
        outputs: {
          file: { enabled: true, path: './test-logs' },
        },
      },
    });

    expect(logger).toBeDefined();
  });

  test('logger with custom browser config should work', () => {
    global.window = {} as any;

    const logger = createNextjsLogger({
      appName: 'test-app',
      browser: {
        enableConsole: true,
        enableHttp: false,
        httpEndpoint: '/api/test-logs',
      },
    });

    expect(logger).toBeDefined();
  });

  test('environment detection should work', () => {
    // Test development environment
    process.env.NODE_ENV = 'development';
    const devLogger = createNextjsLogger({ appName: 'test-app' });
    expect(devLogger).toBeDefined();

    // Test production environment
    process.env.NODE_ENV = 'production';
    const prodLogger = createNextjsLogger({ appName: 'test-app' });
    expect(prodLogger).toBeDefined();
  });
});
