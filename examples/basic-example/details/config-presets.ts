/**
 * 示例1: 使用预设配置
 * 
 * 展示如何使用 LogLayer 提供的预设配置
 */

import { createServerLogger } from '@yai-loglayer/server';
import { createDefaultConfig, createDevelopmentConfig } from '@yai-loglayer/core';
import type { ServerLoggerConfig } from '@yai-loglayer/server';
import { printExampleTitle, createExampleRunner, getLogsDir } from '../lib/shared-utils.js';

/**
 * 使用预设配置示例
 */
async function runPresetsExample(): Promise<void> {
  // 使用默认配置（只输出到控制台）
  const defaultConfig = createDefaultConfig();
  const logger1 = await createServerLogger('app', defaultConfig);
  
  logger1.info('使用默认配置的日志', { userId: 123 });
  
  // 使用开发环境配置（包含文件输出）
  const devConfig = createDevelopmentConfig();
  // 修改文件输出路径为正确的 logs 目录
  const serverConfig: ServerLoggerConfig = {
    level: devConfig.level,
    outputs: [
      { type: 'stdout' },
      {
        type: 'file',
        config: {
          dir: getLogsDir(),
          filename: 'app.log',
        },
      },
    ]
  };
  const logger2 = await createServerLogger('api', serverConfig);
  
  logger2.debug('开发环境调试信息', { endpoint: '/api/users' });
  logger2.info('API 请求完成', { statusCode: 200, duration: 150 });
  
  console.log('✅ 预设配置示例完成 - 日志已保存到 ./logs/app.log');
}

// 导出示例运行器
export const configPresetsExample = createExampleRunner(
  runPresetsExample,
  '示例1: 使用预设配置'
);

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  configPresetsExample();
}
