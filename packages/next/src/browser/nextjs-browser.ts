/**
 * Next.js特定的浏览器端日志器 - 基于main分支的@yai-loglayer/browser
 */

import { createBrowserLoggerSync, type BrowserLoggerConfig } from '@yai-loglayer/browser';
import { detectEnvironment } from '../utils';

/**
 * Next.js浏览器端配置
 */
export interface NextjsBrowserConfig {
  appName: string;
  environment?: 'development' | 'test' | 'staging' | 'production';
  level?: 'debug' | 'info' | 'warn' | 'error';
  httpEndpoint?: string;
}

/**
 * 创建Next.js浏览器端日志器 - 基于main分支API
 */
export function createNextjsBrowserLogger(config: NextjsBrowserConfig) {
  const env = detectEnvironment();
  const environment = config.environment || (env.nodeEnv as any) || 'development';

  // 基于main分支API的配置
  const browserConfig: BrowserLoggerConfig = {
    level: config.level || (env.isDevelopment ? 'debug' : 'info'),
    outputs: {
      console: {
        enabled: env.isDevelopment,
      },
      http: {
        enabled: !env.isDevelopment,
        endpoint: config.httpEndpoint || '/api/client-logs',
        batchSize: 10,
      },
      localStorage: {
        enabled: env.isDevelopment,
        maxEntries: 1000,
      },
    },
    context: {
      includeUserAgent: true,
      includeUrl: true,
      includeTimestamp: true,
      customFields: {
        service: () => config.appName,
        environment: () => environment,
        version: () =>
          typeof window !== 'undefined'
            ? (window as any).__NEXT_DATA__?.buildId || '1.0.0'
            : '1.0.0',
        framework: () => 'nextjs',
      },
    },
  };

  return createBrowserLoggerSync(browserConfig);
}

/**
 * 极简浏览器日志器 - 一行代码创建
 */
export function createAutoBrowserLogger(appName: string) {
  return createNextjsBrowserLogger({ appName });
}
