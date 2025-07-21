/**
 * 服务端专用日志功能
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 */

import { createLogger } from 'loglayer-support'
import type { LoggerConfig, IEnhancedLogger } from 'loglayer-support'

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

// 创建适用于 Next.js 服务端的配置
const serverConfig: LoggerConfig = {
  level: {
    default: 'debug',
    loggers: {
      'api': 'info',
      'database': 'debug'
    }
  },
  server: {
    outputs: [
      { type: 'stdout' }, // 控制台输出
      {
        type: 'file',
        config: {
          dir: logsDir,  // 动态计算的相对路径
          filename: 'nextjs.log'  // 与示例名称一致
        }
      }
    ]
  },
  client: {
    outputs: [
      { type: 'console' }
    ]
  }
}

// 创建异步初始化的服务端 logger
console.log('[DEBUG] Creating server logger with public API...');
console.log('[DEBUG] Current working directory:', process.cwd());
console.log('[DEBUG] Logs directory:', logsDir);

let serverLoggerInstance: IEnhancedLogger | null = null;
const serverLoggerPromise = createLogger('nextjs-server', serverConfig).then(logger => {
  serverLoggerInstance = logger;
  console.log('[DEBUG] Server logger created successfully');
  
  // 记录 Next.js 应用启动日志
  logger.info('Next.js 应用启动', {
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd(),
    logsDirectory: logsDir,
    pid: process.pid
  });
  
  return logger;
});

// 导出 promise 和同步访问器
export const getServerLogger = () => {
  if (!serverLoggerInstance) {
    throw new Error('Server logger not initialized yet. Use await getServerLoggerAsync() instead.');
  }
  return serverLoggerInstance;
};

export const getServerLoggerAsync = async () => {
  return await serverLoggerPromise;
};

// 兼容导出 - 延迟访问
export const serverLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger();
    return (logger as any)[prop];
  }
});

// 模块特定的 logger - 延迟访问
export const apiLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger().forModule('api');
    return (logger as any)[prop];
  }
});

export const dbLogger = new Proxy({} as IEnhancedLogger, {
  get(target, prop) {
    const logger = getServerLogger().forModule('database');
    return (logger as any)[prop];
  }
});

// 兼容导出
export const logger = serverLogger;