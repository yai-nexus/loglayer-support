/**
 * 客户端日志器实现 - 基于 LogLayer
 */

import { ConsoleTransport, LogLayer } from 'loglayer';
import type { ClientLoggerInstance, NextjsLogConfig } from '../shared/types';
import { detectEnvironment } from './utils';

/**
 * 创建客户端日志器
 */
export function createClientLogger(config?: NextjsLogConfig): ClientLoggerInstance {
  const appName = config?.appName || 'nextjs-app';
  const env = detectEnvironment();

  // 创建 LogLayer 实例
  const logLayer = new LogLayer({
    transport: new ConsoleTransport({
      logger: console,
    }),
  });

  // 添加上下文
  const contextLogger = logLayer.withContext({
    service: appName,
    environment: config?.environment || env.nodeEnv,
    framework: 'nextjs',
    platform: 'browser',
  });

  return wrapLogLayer(contextLogger);
}

/**
 * 包装 LogLayer 为客户端日志器实例
 */
function wrapLogLayer(logLayer: any): ClientLoggerInstance {
  return {
    info: (message: string, data?: any) => logLayer.info(message, data),
    debug: (message: string, data?: any) => logLayer.debug(message, data),
    warn: (message: string, data?: any) => logLayer.warn(message, data),
    error: (message: string, data?: any) => logLayer.error(message, data),
    withContext: (context: Record<string, any>) => {
      return wrapLogLayer(logLayer.withContext(context));
    },
    forModule: (moduleName: string) => {
      return wrapLogLayer(logLayer.withContext({ module: moduleName }));
    },
    flush: async () => {
      // 占位符
    },
    getStoredLogs: () => [],
    clearStoredLogs: () => {
      // 占位符
    },
  };
}

/**
 * 创建自动配置的客户端日志器
 */
export function createAutoClientLogger(appName: string): ClientLoggerInstance {
  return createClientLogger({ appName });
}
