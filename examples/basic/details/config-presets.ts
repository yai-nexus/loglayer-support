/**
 * 示例1: 使用预设配置
 * 
 * 展示如何使用 LogLayer 提供的预设配置
 */

import { createLogger, createDefaultConfig, createDevelopmentConfig } from 'loglayer-support';
import { printExampleTitle, createExampleRunner } from '../lib/shared-utils.js';

/**
 * 使用预设配置示例
 */
async function runPresetsExample(): Promise<void> {
  // 使用默认配置
  const defaultConfig = createDefaultConfig();
  const logger1 = await createLogger('app', defaultConfig);
  
  logger1.info('使用默认配置的日志', { userId: 123 });
  
  // 使用开发环境配置
  const devConfig = createDevelopmentConfig();
  const logger2 = await createLogger('api', devConfig);
  
  logger2.debug('开发环境调试信息', { endpoint: '/api/users' });
  logger2.info('API 请求完成', { statusCode: 200, duration: 150 });
  
  console.log('✅ 预设配置示例完成');
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
