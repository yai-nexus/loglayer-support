/**
 * Next.js特定的服务端日志器 - 基于main分支的@yai-loglayer/server
 */

import type { LoggerConfig } from '@yai-loglayer/core';
import { createServerLogger } from '@yai-loglayer/server';
import { detectEnvironment } from '../utils';

/**
 * Next.js服务端配置
 */
export interface NextjsServerConfig {
  appName: string;
  environment?: 'development' | 'test' | 'staging' | 'production';
  level?: 'debug' | 'info' | 'warn' | 'error';
  enableFileLogging?: boolean;
  enableSls?: boolean;
  logDir?: string;
  outputs?: {
    console?: { enabled?: boolean };
    file?: { enabled?: boolean; path?: string };
    sls?: { enabled?: boolean };
  };
}

/**
 * 创建Next.js服务端日志器 - 极简版本，基于main分支API
 */
export async function createNextjsServerLogger(config: NextjsServerConfig) {
  const env = detectEnvironment();
  const environment = config.environment || (env.nodeEnv as any) || 'development';

  // 基于main分支API的配置
  const loggerConfig: LoggerConfig = {
    level: {
      default: (config.level || (env.isDevelopment ? 'debug' : 'info')) as any,
    },
    server: {
      outputs: [
        { type: 'stdout' },
        ...((config.enableFileLogging ?? env.isProduction)
          ? [
              {
                type: 'file' as const,
                config: {
                  dir: config.logDir || './logs',
                  filename: `${config.appName}.log`,
                },
              },
            ]
          : []),
      ],
    },
    client: {
      outputs: [],
    },
  };

  return createServerLogger(config.appName, loggerConfig);
}

/**
 * 极简服务端日志器 - 一行代码创建
 */
export function createAutoServerLogger(appName: string) {
  return createNextjsServerLogger({ appName });
}

// =============================================================================
// 预定义的日志器实例 - 极简主义接入
// =============================================================================

// 获取应用名称，优先级：环境变量 > package.json > 默认值
function getAppName(): string {
  if (process.env.NEXT_PUBLIC_APP_NAME) {
    return process.env.NEXT_PUBLIC_APP_NAME;
  }

  try {
    // 尝试从package.json读取
    const packageJson = require(process.cwd() + '/package.json');
    if (packageJson.name) {
      return packageJson.name;
    }
  } catch {
    // 忽略错误，使用默认值
  }

  return 'nextjs-app';
}

// 创建默认配置
const defaultConfig: NextjsServerConfig = {
  appName: getAppName(),
  environment: (process.env.NODE_ENV as any) || 'development',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableFileLogging: process.env.NODE_ENV === 'production',
  logDir: './logs',
};

// 创建日志器实例的Promise，确保只初始化一次
const loggerPromise = createNextjsServerLogger(defaultConfig);

// 缓存已创建的日志器实例
let mainLoggerInstance: any = null;

/**
 * 获取主日志器实例
 */
async function getMainLogger() {
  if (!mainLoggerInstance) {
    mainLoggerInstance = await loggerPromise;
  }
  return mainLoggerInstance;
}

/**
 * 主日志器 - 可直接导入使用
 *
 * @example
 * import { logger } from '@yai-loglayer/next/server-only'
 *
 * logger.info('用户登录', { userId: '123' })
 * logger.error('数据库连接失败', { error: err.message })
 */
export const logger = {
  info: async (message: string, data?: any) => {
    const instance = await getMainLogger();
    instance.info(message, data);
  },
  debug: async (message: string, data?: any) => {
    const instance = await getMainLogger();
    instance.debug(message, data);
  },
  warn: async (message: string, data?: any) => {
    const instance = await getMainLogger();
    instance.warn(message, data);
  },
  error: async (message: string, data?: any) => {
    const instance = await getMainLogger();
    instance.error(message, data);
  },
  withContext: async (context: any) => {
    const instance = await getMainLogger();
    return instance.withContext(context);
  },
};
