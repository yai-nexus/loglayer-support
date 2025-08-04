/**
 * 服务端日志器实现 - 基于 LogLayer
 */

import { ConsoleTransport, LogLayer } from 'loglayer';
import type { NextjsLogConfig, ServerLoggerInstance } from '../shared/types';
import { detectEnvironment } from './utils';

/**
 * 创建服务端日志器
 */
export async function createServerLogger(config?: NextjsLogConfig): Promise<ServerLoggerInstance> {
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
    platform: 'server',
    nodeVersion: process.version,
    pid: process.pid,
  });

  return wrapServerLogger(contextLogger);
}

/**
 * 获取应用版本
 */
function getAppVersion(): string {
  try {
    const pkg = require(process.cwd() + '/package.json');
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * 包装 LogLayer 为服务端日志器实例
 */
function wrapServerLogger(logLayer: any): ServerLoggerInstance {
  return {
    info: (message: string, data?: any) => logLayer.info(message, data),
    debug: (message: string, data?: any) => logLayer.debug(message, data),
    warn: (message: string, data?: any) => logLayer.warn(message, data),
    error: (message: string, data?: any) => logLayer.error(message, data),
    withContext: (context: Record<string, any>) => {
      return wrapServerLogger(logLayer.withContext(context));
    },
    forModule: (moduleName: string) => {
      return wrapServerLogger(logLayer.withContext({ module: moduleName }));
    },
    createReceiver: () => {
      // 简化的接收器创建
      return createSimpleReceiver();
    },
    getLogFiles: () => [],
    rotateLogs: async () => {
      // 占位符
    },
  };
}

/**
 * 创建简化的接收器
 */
function createSimpleReceiver() {
  return {
    POST: async (request: Request) => {
      try {
        const logs = await request.json();
        console.log('Received logs:', logs);
        return new Response('OK', { status: 200 });
      } catch (error) {
        return new Response('Bad Request', { status: 400 });
      }
    },
    OPTIONS: () => {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    },
  };
}

// 删除不需要的函数

/**
 * 创建自动配置的服务端日志器
 */
export async function createAutoServerLogger(appName: string): Promise<ServerLoggerInstance> {
  return createServerLogger({ appName });
}

/**
 * 同步创建服务端日志器（用于兼容性）
 */
export function createServerLoggerSync(config?: NextjsLogConfig): ServerLoggerInstance {
  // 创建一个同步的包装器，内部使用异步初始化
  let loggerPromise: Promise<ServerLoggerInstance> | null = null;
  let resolvedLogger: ServerLoggerInstance | null = null;
  
  const getLogger = async (): Promise<ServerLoggerInstance> => {
    if (resolvedLogger) {
      return resolvedLogger;
    }
    
    if (!loggerPromise) {
      loggerPromise = createServerLogger(config);
    }
    
    resolvedLogger = await loggerPromise;
    return resolvedLogger;
  };
  
  // 返回同步接口，内部异步处理
  return {
    info: (message: string, data?: any) => {
      getLogger().then(logger => logger.info(message, data)).catch(console.error);
    },
    debug: (message: string, data?: any) => {
      getLogger().then(logger => logger.debug(message, data)).catch(console.error);
    },
    warn: (message: string, data?: any) => {
      getLogger().then(logger => logger.warn(message, data)).catch(console.error);
    },
    error: (message: string, data?: any) => {
      getLogger().then(logger => logger.error(message, data)).catch(console.error);
    },
    withContext: (context: Record<string, any>) => {
      return createServerLoggerSync({ appName: 'default', ...config });
    },
    forModule: (moduleName: string) => {
      return createServerLoggerSync({ appName: 'default', ...config });
    },
    createReceiver: () => {
      return createSimpleReceiver();
    },
    getLogFiles: () => [],
    rotateLogs: async () => {
      // 占位符
    },
  };
}
