/**
 * 示例2: 自定义配置
 * 
 * 展示如何创建自定义的日志配置
 */

import { createServerLogger } from '@yai-loglayer/server';
import type { LoggerConfig } from '@yai-loglayer/core';
import { createExampleRunner, getLogsDir, getSLSConfig } from '../lib/shared-utils.js';

/**
 * 自定义配置示例
 */
async function runCustomConfigExample(): Promise<void> {
  const slsConfig = getSLSConfig();

  const customConfig: LoggerConfig = {
    level: {
      default: 'info',
      loggers: {
        'database': 'debug',  // 数据库模块显示详细信息
        'auth': 'warn',       // 认证模块只显示警告
        'ui': 'error'         // UI 模块只显示错误
      }
    },
    server: {
      outputs: [
        { type: 'stdout' },                                   // 控制台输出
        {
          type: 'file',
          config: {
            dir: getLogsDir(),
            filename: 'custom.log'
          }
        },
        {
          type: 'sls',
          level: 'warn', // 只发送 warn 及以上级别到 SLS
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

  // 创建不同模块的 logger
  const dbLogger = await createServerLogger('database', customConfig);
  const authLogger = await createServerLogger('auth', customConfig);
  const uiLogger = await createServerLogger('ui', customConfig);
  const apiLogger = await createServerLogger('api', customConfig);  // 使用默认级别

  // 测试不同级别的日志
  dbLogger.debug('数据库连接建立');        // 会输出（database 配置为 debug）
  authLogger.debug('用户认证开始');        // 不会输出（auth 配置为 warn）
  uiLogger.info('页面渲染完成');           // 不会输出（ui 配置为 error）
  apiLogger.info('API 调用成功');          // 会输出（使用默认级别 info）
  
  authLogger.withMetadata({ attempts: 3 }).warn('认证失败');
  uiLogger.withMetadata({ component: 'UserProfile' }).error('组件渲染失败');
  
  console.log('✅ 自定义配置示例完成 - 日志已保存到 custom.log');
}

// 导出示例运行器
export const customConfigExample = createExampleRunner(
  runCustomConfigExample,
  '示例2: 自定义配置'
);

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  customConfigExample();
}
