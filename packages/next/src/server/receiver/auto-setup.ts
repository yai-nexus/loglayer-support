/**
 * 自动化API路由设置
 * 
 * 提供自动生成API路由的功能
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ServerLoggerInstance } from '../../shared/types';
import { createLogReceiverHandler, createOptionsHandler, type LogReceiverConfig } from './handler';

/**
 * API路由处理器集合
 */
export interface ApiRouteHandlers {
  POST: (request: NextRequest) => Promise<NextResponse>;
  OPTIONS: () => NextResponse;
}

/**
 * 创建自动API路由
 */
export function createAutoApiRoute(
  logger: ServerLoggerInstance,
  config?: LogReceiverConfig
): ApiRouteHandlers {
  const postHandler = createLogReceiverHandler(logger, config);
  const optionsHandler = createOptionsHandler();

  return {
    POST: postHandler,
    OPTIONS: optionsHandler,
  };
}

/**
 * 创建默认配置的API路由
 */
export function createDefaultApiRoute(logger: ServerLoggerInstance): ApiRouteHandlers {
  const defaultConfig: LogReceiverConfig = {
    validation: {
      requireLevel: true,
      maxMessageLength: 2000,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxBatchSize: 50,
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 50,
      enableEnrichment: true,
    },
    security: {
      rateLimiting: {
        maxRequestsPerMinute: 100,
      },
    },
  };

  return createAutoApiRoute(logger, defaultConfig);
}

/**
 * 创建生产环境API路由
 */
export function createProductionApiRoute(logger: ServerLoggerInstance): ApiRouteHandlers {
  const productionConfig: LogReceiverConfig = {
    validation: {
      requireLevel: true,
      maxMessageLength: 1000,
      allowedLevels: ['warn', 'error'], // 生产环境只接收警告和错误
      maxBatchSize: 100,
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 100,
      enableEnrichment: true,
    },
    security: {
      rateLimiting: {
        maxRequestsPerMinute: 200,
      },
    },
  };

  return createAutoApiRoute(logger, productionConfig);
}

/**
 * 创建开发环境API路由
 */
export function createDevelopmentApiRoute(logger: ServerLoggerInstance): ApiRouteHandlers {
  const developmentConfig: LogReceiverConfig = {
    validation: {
      requireLevel: false, // 开发环境更宽松
      maxMessageLength: 5000,
      allowedLevels: ['debug', 'info', 'warn', 'error'],
      maxBatchSize: 20,
    },
    processing: {
      supportBatch: true,
      maxBatchSize: 20,
      enableEnrichment: true,
    },
    security: {
      rateLimiting: {
        maxRequestsPerMinute: 500, // 开发环境更高的限制
      },
    },
  };

  return createAutoApiRoute(logger, developmentConfig);
}

/**
 * 根据环境自动选择API路由配置
 */
export function createEnvironmentApiRoute(logger: ServerLoggerInstance): ApiRouteHandlers {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return createProductionApiRoute(logger);
    case 'development':
      return createDevelopmentApiRoute(logger);
    default:
      return createDefaultApiRoute(logger);
  }
}

/**
 * 生成API路由文件内容
 */
export function generateApiRouteFile(
  configType: 'default' | 'production' | 'development' | 'environment' = 'environment'
): string {
  const imports = `import { NextRequest } from 'next/server';
import { serverQuickStart, createEnvironmentApiRoute, createDefaultApiRoute, createProductionApiRoute, createDevelopmentApiRoute } from '@yai-loglayer/next/server';

// 初始化服务端日志器
const logger = serverQuickStart.prod('my-app'); // 请替换为您的应用名称`;

  const handlerCreation = (() => {
    switch (configType) {
      case 'production':
        return 'const { POST, OPTIONS } = createProductionApiRoute(logger);';
      case 'development':
        return 'const { POST, OPTIONS } = createDevelopmentApiRoute(logger);';
      case 'environment':
        return 'const { POST, OPTIONS } = createEnvironmentApiRoute(logger);';
      default:
        return 'const { POST, OPTIONS } = createDefaultApiRoute(logger);';
    }
  })();

  const exports = `
// 导出API路由处理器
export { POST, OPTIONS };`;

  return `${imports}

${handlerCreation}
${exports}`;
}

/**
 * 写入API路由文件
 */
export async function writeApiRouteFile(
  filePath: string,
  configType: 'default' | 'production' | 'development' | 'environment' = 'environment'
): Promise<void> {
  const { writeFile } = await import('fs/promises');
  const { dirname } = await import('path');
  const { ensureDir } = await import('../utils');
  
  const content = generateApiRouteFile(configType);
  
  // 确保目录存在
  await ensureDir(dirname(filePath));
  
  // 写入文件
  await writeFile(filePath, content, 'utf-8');
}

/**
 * CLI命令：生成API路由文件
 */
export async function generateApiRouteCommand(options: {
  output?: string;
  type?: 'default' | 'production' | 'development' | 'environment';
  appName?: string;
}): Promise<void> {
  const {
    output = 'app/api/logs/route.ts',
    type = 'environment',
    appName = 'my-app',
  } = options;

  try {
    await writeApiRouteFile(output, type);
    console.log(`✅ API route file generated: ${output}`);
    console.log(`📝 Please update the app name from 'my-app' to '${appName}' in the generated file.`);
  } catch (error) {
    console.error('❌ Failed to generate API route file:', error);
    throw error;
  }
}
