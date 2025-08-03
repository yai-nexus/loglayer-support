/**
 * Next.js 统一日志接口
 */

import type { NextjsServerConfig } from '../server';
import type { NextjsBrowserConfig } from '../browser';
import { isServer } from '../utils';

/**
 * Next.js日志器配置
 */
export interface NextjsLoggerConfig {
  appName: string;
  environment?: 'development' | 'test' | 'staging' | 'production';
  level?: 'debug' | 'info' | 'warn' | 'error';
  server?: Partial<NextjsServerConfig>;
  browser?: Partial<NextjsBrowserConfig>;
}

/**
 * Next.js日志器对
 */
export interface NextjsLoggerPair {
  server: any;
  browser: any;
}

/**
 * 创建Next.js统一日志器
 */
export async function createNextjsLogger(config: NextjsLoggerConfig) {
  if (isServer()) {
    const { createNextjsServerLogger } = await import('../server');
    const serverConfig: NextjsServerConfig = {
      appName: config.appName,
      environment: config.environment,
      level: config.level,
      ...config.server,
    };
    return createNextjsServerLogger(serverConfig);
  } else {
    const { createNextjsBrowserLogger } = await import('../browser');
    const browserConfig: NextjsBrowserConfig = {
      appName: config.appName,
      environment: config.environment,
      level: config.level,
      ...config.browser,
    };
    return createNextjsBrowserLogger(browserConfig);
  }
}

/**
 * 创建Next.js日志器对
 */
export async function createNextjsLoggerPair(
  config: NextjsLoggerConfig
): Promise<NextjsLoggerPair> {
  const { createNextjsServerLogger } = await import('../server');
  const { createNextjsBrowserLogger } = await import('../browser');

  const serverConfig: NextjsServerConfig = {
    appName: config.appName,
    environment: config.environment,
    level: config.level,
    ...config.server,
  };

  const browserConfig: NextjsBrowserConfig = {
    appName: config.appName,
    environment: config.environment,
    level: config.level,
    ...config.browser,
  };

  return {
    server: await createNextjsServerLogger(serverConfig),
    browser: createNextjsBrowserLogger(browserConfig),
  };
}
