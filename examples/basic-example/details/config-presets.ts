/**
 * 示例1: 使用预设配置
 * 
 * 展示如何使用 LogLayer 提供的预设配置
 */

import { createServerLogger } from '@yai-loglayer/server';
import { createDefaultConfig, createDevelopmentConfig } from '@yai-loglayer/core';
import type { LoggerConfig } from '@yai-loglayer/core';
import { printExampleTitle, createExampleRunner, getLogsDir, getSLSConfig } from '../lib/shared-utils.js';

/**
 * 使用预设配置示例
 */
async function runPresetsExample(): Promise<void> {
  // 使用默认配置（只输出到控制台）
  const defaultConfig = createDefaultConfig();
  const logger1 = await createServerLogger('app', defaultConfig);
  
  logger1.info('使用默认配置的日志', { userId: 123 });
  
  // 使用开发环境配置（包含文件输出和 SLS 输出）
  const devConfig = createDevelopmentConfig();
  const slsConfig = getSLSConfig();

  // 修改配置，添加 SLS 输出
  const serverConfig: LoggerConfig = {
    level: devConfig.level,
    server: {
      outputs: [
        { type: 'stdout' },
        {
          type: 'file',
          config: {
            dir: getLogsDir(),
            filename: 'app.log',
          },
        },
        {
          type: 'sls',
          level: 'info', // 只发送 info 及以上级别到 SLS
          config: slsConfig
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' }
      ]
    }
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
