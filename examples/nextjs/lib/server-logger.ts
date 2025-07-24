/**
 * 服务端专用日志功能 - 使用新的框架预设 API
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 */

import { createNextjsServerLogger } from '@yai-nexus/loglayer-support'
import type { ServerLoggerInstance } from '@yai-nexus/loglayer-support'

// 获取项目根目录路径（相对于当前工作目录）
const getProjectLogsDir = () => {
  // 如果当前工作目录已经是项目根目录，直接使用 ./logs
  // 如果在 examples/nextjs 目录下运行，使用 ../../logs
  const cwd = process.cwd();
  if (cwd.endsWith('examples/nextjs')) {
    return '../../logs';
  } else {
    return './logs';
  }
};

const logsDir = getProjectLogsDir();

// 创建 Next.js 服务端日志器实例
console.log('[DEBUG] Creating server logger with new framework preset API...');
console.log('[DEBUG] Current working directory:', process.cwd());
console.log('[DEBUG] Logs directory:', logsDir);

// 使用新的框架预设 API 创建服务端日志器
const createServerInstance = async (): Promise<ServerLoggerInstance> => {
  const serverInstance = await createNextjsServerLogger({
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    paths: {
      logsDir: logsDir,
      autoDetectRoot: true
    },
    outputs: [
      { type: 'stdout' }, // 控制台输出
      {
        type: 'file',
        config: {
          filename: 'nextjs.log'
        }
      }
    ],
    modules: {
      api: { level: 'info', context: { service: 'nextjs-api' } },
      database: { level: 'debug', context: { component: 'db-layer' } },
      'client-log-receiver': { level: 'debug', context: { service: 'log-receiver' } },
      'client-log-status': { level: 'info', context: { service: 'status-api' } }
    },
    initialization: {
      logStartupInfo: true,
      fallbackToConsole: true
    },
    performance: {
      enabled: true,
      interval: 60000,
      memoryThreshold: 256
    },
    healthCheck: {
      enabled: true,
      interval: 30000
    }
  });

  console.log('[DEBUG] Server logger created successfully with new API');

  // 记录 Next.js 应用启动日志
  serverInstance.logger.info('Next.js 应用启动', {
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd(),
    logsDirectory: logsDir,
    pid: process.pid,
    apiVersion: 'v0.6.0-frameworks'
  });

  return serverInstance;
};

// 创建服务端实例
const serverInstancePromise = createServerInstance();
let serverInstanceCache: ServerLoggerInstance | null = null;

// 获取服务端实例的辅助函数
const getServerInstanceSync = (): ServerLoggerInstance => {
  if (!serverInstanceCache) {
    throw new Error('Server logger not initialized yet. Use await getServerInstance() instead.');
  }
  return serverInstanceCache;
};

// 初始化缓存
serverInstancePromise.then(instance => {
  serverInstanceCache = instance;
});

// 导出服务端实例和便捷访问器
export const getServerInstance = async (): Promise<ServerLoggerInstance> => {
  if (serverInstanceCache) {
    return serverInstanceCache;
  }
  const instance = await serverInstancePromise;
  serverInstanceCache = instance;
  return instance;
};

// 导出主要的日志器（使用延迟访问模式）
export const serverLogger = {
  get logger() {
    return getServerInstanceSync().logger;
  },
  debug: (...args: any[]) => getServerInstanceSync().logger.debug(...args),
  info: (...args: any[]) => getServerInstanceSync().logger.info(...args),
  warn: (...args: any[]) => getServerInstanceSync().logger.warn(...args),
  error: (...args: any[]) => getServerInstanceSync().logger.error(...args),
  logError: (...args: any[]) => getServerInstanceSync().logger.logError(...args),
  forModule: (name: string) => getServerInstanceSync().forModule(name),
  forRequest: (...args: any[]) => getServerInstanceSync().logger.forRequest(...args)
};

export const apiLogger = {
  get moduleLogger() {
    return getServerInstanceSync().forModule('api');
  },
  debug: (...args: any[]) => getServerInstanceSync().forModule('api').debug(...args),
  info: (...args: any[]) => getServerInstanceSync().forModule('api').info(...args),
  warn: (...args: any[]) => getServerInstanceSync().forModule('api').warn(...args),
  error: (...args: any[]) => getServerInstanceSync().forModule('api').error(...args),
  logError: (...args: any[]) => getServerInstanceSync().forModule('api').logError(...args),
  forModule: (name: string) => getServerInstanceSync().forModule('api').forModule(name)
};

export const dbLogger = {
  get moduleLogger() {
    return getServerInstanceSync().forModule('database');
  },
  debug: (...args: any[]) => getServerInstanceSync().forModule('database').debug(...args),
  info: (...args: any[]) => getServerInstanceSync().forModule('database').info(...args),
  warn: (...args: any[]) => getServerInstanceSync().forModule('database').warn(...args),
  error: (...args: any[]) => getServerInstanceSync().forModule('database').error(...args),
  logError: (...args: any[]) => getServerInstanceSync().forModule('database').logError(...args),
  forModule: (name: string) => getServerInstanceSync().forModule('database').forModule(name)
};

// 兼容性导出
export const logger = serverLogger;