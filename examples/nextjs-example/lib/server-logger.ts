/**
 * 服务端专用日志功能 - 适配 v0.7.0-alpha.2 LogLayer API
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 * 支持 SLS (Simple Log Service) 日志收集
 */

import { createServerLogger } from '@yai-loglayer/server'
import type { LoggerConfig } from '@yai-loglayer/core'
import { LogLayer } from 'loglayer'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 获取 SLS 配置
 * 从环境变量中读取 SLS 配置，如果缺少必需变量则返回空对象
 */
function getSLSConfig(): Record<string, string> {
  const requiredVars = ['SLS_ENDPOINT', 'SLS_PROJECT', 'SLS_LOGSTORE', 'SLS_ACCESS_KEY_ID', 'SLS_ACCESS_KEY_SECRET', 'SLS_APP_NAME'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(`[LogLayer WARN] Missing SLS environment variables: ${missingVars.join(', ')}. SLS logging will be disabled.`);
    return {};
  }

  return {
    endpoint: process.env.SLS_ENDPOINT!,
    project: process.env.SLS_PROJECT!,
    logstore: process.env.SLS_LOGSTORE!,
    accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
    appName: process.env.SLS_APP_NAME!
  };
}

// 获取项目根目录路径（相对于当前工作目录）
const getProjectLogsDir = () => {
  // 如果当前工作目录已经是项目根目录，直接使用 ./logs
  // 如果在 examples/nextjs-example 目录下运行，使用 ../../logs
  const cwd = process.cwd();
  if (cwd.endsWith('examples/nextjs-example')) {
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

// 使用 v0.7.0-alpha.2 createServerLogger API 创建服务端日志器
const createServerInstance = async (): Promise<LogLayer> => {
  const slsConfig = getSLSConfig();
  const outputs: LoggerConfig['server']['outputs'] = [
    { type: 'stdout' }, // 控制台输出
    {
      type: 'file',
      config: {
        dir: logsDir,
        filename: 'nextjs.log'
      }
    }
  ];

  // 动态添加 SLS 输出（仅当所有必需的环境变量都存在时）
  if (slsConfig.endpoint) {
    outputs.push({
      type: 'sls',
      level: 'warn', // 与 basic-example 对齐，只收集警告及以上级别
      config: slsConfig
    });
    console.log('[DEBUG] SLS logging enabled for nextjs-server');
  } else {
    console.log('[DEBUG] SLS logging disabled - missing environment variables');
  }

  const logger = await createServerLogger('nextjs-server', {
    level: { default: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
    server: {
      outputs: outputs // 使用更新后的 outputs 数组
    },
    client: {
      outputs: [{ type: 'console' }] // 必需的客户端配置
    }
  });

  console.log('[DEBUG] Server logger created successfully with v0.7.0-alpha.2 API');

  // 记录 Next.js 应用启动日志
  logger.withMetadata({
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd(),
    logsDirectory: logsDir,
    pid: process.pid,
    apiVersion: 'v0.7.0-alpha.2'
  }).info('Next.js 应用启动');

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

// 导出主要的日志器（使用 getter 延迟初始化）
export const serverLogger = {
  get instance() {
    return getServerInstanceSync();
  },
  withMetadata: (metadata: any) => getServerInstanceSync().withMetadata(metadata),
  withContext: (context: any) => getServerInstanceSync().withContext(context),
  debug: (...args: any[]) => getServerInstanceSync().debug(...args),
  info: (...args: any[]) => getServerInstanceSync().info(...args),
  warn: (...args: any[]) => getServerInstanceSync().warn(...args),
  error: (...args: any[]) => getServerInstanceSync().error(...args),
  trace: (...args: any[]) => getServerInstanceSync().trace(...args),
  fatal: (...args: any[]) => getServerInstanceSync().fatal(...args),
};

// 导出模块化日志器（使用 getter 延迟初始化）
export const apiLogger = {
  get instance() {
    return getServerInstanceSync().withContext({ module: 'api' });
  },
  withMetadata: (metadata: any) => getServerInstanceSync().withContext({ module: 'api' }).withMetadata(metadata),
  withContext: (context: any) => getServerInstanceSync().withContext({ module: 'api', ...context }),
  debug: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).debug(...args),
  info: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).info(...args),
  warn: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).warn(...args),
  error: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).error(...args),
  trace: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).trace(...args),
  fatal: (...args: any[]) => getServerInstanceSync().withContext({ module: 'api' }).fatal(...args),
};

export const dbLogger = {
  get instance() {
    return getServerInstanceSync().withContext({ module: 'database' });
  },
  withMetadata: (metadata: any) => getServerInstanceSync().withContext({ module: 'database' }).withMetadata(metadata),
  withContext: (context: any) => getServerInstanceSync().withContext({ module: 'database', ...context }),
  debug: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).debug(...args),
  info: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).info(...args),
  warn: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).warn(...args),
  error: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).error(...args),
  trace: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).trace(...args),
  fatal: (...args: any[]) => getServerInstanceSync().withContext({ module: 'database' }).fatal(...args),
};

// 兼容性导出
export const logger = serverLogger;