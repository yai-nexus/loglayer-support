/**
 * 服务端专用日志功能 - 使用新的 SLS Transport
 * 在 API 路由中使用，支持文件输出到项目根目录的 logs 目录
 * 支持 SLS (Simple Log Service) 日志收集，使用原生 @yai-loglayer/sls-transport
 */

import { LogLayer } from 'loglayer'
import { ServerTransport } from '@yai-loglayer/server'
import { SlsTransport } from '@yai-loglayer/sls-transport'
import type { LoggerConfig } from '@yai-loglayer/core'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 检查 SLS 配置是否完整
 */
function checkSLSConfig(): boolean {
  const requiredVars = [
    'SLS_ENDPOINT', 
    'SLS_PROJECT', 
    'SLS_LOGSTORE', 
    'SLS_ACCESS_KEY_ID', 
    'SLS_ACCESS_KEY_SECRET'
  ];
  
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(`[LogLayer] 缺少 SLS 环境变量: ${missingVars.join(', ')}。SLS 日志传输已禁用。`);
    return false;
  }

  return true;
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
console.log('[DEBUG] 创建使用新 SLS Transport 的服务端日志器...');
console.log('[DEBUG] 当前工作目录:', process.cwd());
console.log('[DEBUG] 日志目录:', logsDir);

// 使用新的架构创建服务端日志器
const createServerInstance = async (): Promise<LogLayer> => {
  // 创建传输器列表
  const transports = [];

  // 1. 添加服务端传输器 (stdout + file)
  const serverConfig: LoggerConfig = {
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
  };

  const serverTransport = new ServerTransport(serverConfig.server.outputs);
  transports.push(serverTransport);

  // 2. 添加 SLS 传输器（如果配置完整）
  if (checkSLSConfig()) {
    const slsTransport = new SlsTransport({
      endpoint: process.env.SLS_ENDPOINT!,
      accessKeyId: process.env.SLS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.SLS_ACCESS_KEY_SECRET!,
      project: process.env.SLS_PROJECT!,
      logstore: process.env.SLS_LOGSTORE!,
      topic: process.env.SLS_TOPIC || 'nextjs-app',
      source: process.env.SLS_SOURCE || 'nextjs-server',
      batchSize: parseInt(process.env.SLS_BATCH_SIZE || '50'),
      flushInterval: parseInt(process.env.SLS_FLUSH_INTERVAL || '5000'),
      maxRetries: parseInt(process.env.SLS_MAX_RETRIES || '3'),
    });
    
    transports.push(slsTransport);
    console.log('[DEBUG] SLS Transport 已启用');
  } else {
    console.log('[DEBUG] SLS Transport 已禁用 - 缺少环境变量');
  }

  // 创建 LogLayer 实例
  const logger = new LogLayer({
    transport: transports,
    plugins: []
  });

  console.log('[DEBUG] 服务端日志器创建成功，使用新的 SLS Transport');

  // 记录 Next.js 应用启动日志
  logger.withMetadata({
    nodeVersion: process.version,
    platform: process.platform,
    workingDirectory: process.cwd(),
    logsDirectory: logsDir,
    pid: process.pid,
    transportCount: transports.length,
    slsEnabled: transports.length > 1
  }).info('Next.js 应用启动 - 使用新 SLS Transport');

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
}).catch(error => {
  console.error('[LogLayer] 服务端日志器初始化失败:', error);
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