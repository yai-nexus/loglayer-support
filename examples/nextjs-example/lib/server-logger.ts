/**
 * 服务端专用日志功能 - 适配 v0.7.0-alpha.2 LogLayer API
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 */

import { createLogger } from '@yai-loglayer/server'
import type { LogLayer } from 'loglayer'

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

// 使用 v0.7.0-alpha.2 createLogger API 创建服务端日志器
const createServerInstance = async (): Promise<LogLayer> => {
  const logger = await createLogger('nextjs-server', {
    level: { default: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
    server: {
      outputs: [
        { type: 'stdout' }, // 控制台输出
        {
          type: 'file',
          config: {
            dir: logsDir,
            filename: 'nextjs.log'
          }
        }
      ]
    },
    client: {
      outputs: [{ type: 'console' }] // 必需的客户端配置
    }
  });

  console.log('[DEBUG] Server logger created successfully with v0.7.0-alpha.2 API');

  // 记录 Next.js 应用启动日志
  logger.info('Next.js 应用启动', {
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd(),
    logsDirectory: logsDir,
    pid: process.pid,
    apiVersion: 'v0.7.0-alpha.2'
  });

  return logger;
};

// 创建服务端实例
const serverInstancePromise = createServerInstance();
let serverInstanceCache: LogLayer | null = null;

// 获取服务端实例的辅助函数
const getServerInstanceSync = (): LogLayer => {
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
export const getServerInstance = async (): Promise<LogLayer> => {
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
    return getServerInstanceSync();
  },
  debug: (message: string, metadata?: any) => getServerInstanceSync().debug(message, metadata),
  info: (message: string, metadata?: any) => getServerInstanceSync().info(message, metadata),
  warn: (message: string, metadata?: any) => getServerInstanceSync().warn(message, metadata),
  error: (message: string, metadata?: any) => getServerInstanceSync().error(message, metadata),
  // LogLayer 没有 logError 方法，使用 error 替代
  logError: (error: Error, metadata?: any, customMessage?: string) => {
    const message = customMessage || error.message;
    getServerInstanceSync().error(message, { ...metadata, error, errorName: error.name, errorStack: error.stack });
  }
};

export const apiLogger = {
  get moduleLogger() {
    return getServerInstanceSync();
  },
  debug: (message: string, metadata?: any) => getServerInstanceSync().debug(`[API] ${message}`, { ...metadata, module: 'api' }),
  info: (message: string, metadata?: any) => getServerInstanceSync().info(`[API] ${message}`, { ...metadata, module: 'api' }),
  warn: (message: string, metadata?: any) => getServerInstanceSync().warn(`[API] ${message}`, { ...metadata, module: 'api' }),
  error: (message: string, metadata?: any) => getServerInstanceSync().error(`[API] ${message}`, { ...metadata, module: 'api' }),
  logError: (error: Error, metadata?: any, customMessage?: string) => {
    const message = customMessage || error.message;
    getServerInstanceSync().error(`[API] ${message}`, { ...metadata, module: 'api', error, errorName: error.name, errorStack: error.stack });
  }
};

export const dbLogger = {
  get moduleLogger() {
    return getServerInstanceSync();
  },
  debug: (message: string, metadata?: any) => getServerInstanceSync().debug(`[DB] ${message}`, { ...metadata, module: 'database' }),
  info: (message: string, metadata?: any) => getServerInstanceSync().info(`[DB] ${message}`, { ...metadata, module: 'database' }),
  warn: (message: string, metadata?: any) => getServerInstanceSync().warn(`[DB] ${message}`, { ...metadata, module: 'database' }),
  error: (message: string, metadata?: any) => getServerInstanceSync().error(`[DB] ${message}`, { ...metadata, module: 'database' }),
  logError: (error: Error, metadata?: any, customMessage?: string) => {
    const message = customMessage || error.message;
    getServerInstanceSync().error(`[DB] ${message}`, { ...metadata, module: 'database', error, errorName: error.name, errorStack: error.stack });
  }
};

// 兼容性导出
export const logger = serverLogger;