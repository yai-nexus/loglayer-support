/**
 * 示例2: 自定义配置
 * 
 * 展示如何创建自定义的日志配置
 */

import { createLogger } from '@yai-nexus/loglayer-support';
import type { LoggerConfig } from '@yai-nexus/loglayer-support';
import { createExampleRunner, createFileLogConfig } from '../lib/shared-utils.ts';

/**
 * 自定义配置示例
 */
async function runCustomConfigExample(): Promise<void> {
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
          config: createFileLogConfig('basic.log')
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' },                                  // 浏览器控制台
        { 
          type: 'http',
          level: 'error',                                     // 只上报错误到服务器
          config: { endpoint: '/api/client-logs' }
        }
      ]
    }
  };

  // 创建不同模块的 logger
  const dbLogger = await createLogger('database', customConfig);
  const authLogger = await createLogger('auth', customConfig);
  const uiLogger = await createLogger('ui', customConfig);
  const apiLogger = await createLogger('api', customConfig);  // 使用默认级别

  // 测试不同级别的日志
  dbLogger.debug('数据库连接建立');        // 会输出（database 配置为 debug）
  authLogger.debug('用户认证开始');        // 不会输出（auth 配置为 warn）
  uiLogger.info('页面渲染完成');           // 不会输出（ui 配置为 error）
  apiLogger.info('API 调用成功');          // 会输出（使用默认级别 info）
  
  authLogger.warn('认证失败', { attempts: 3 });
  uiLogger.error('组件渲染失败', { component: 'UserProfile' });
  
  console.log('✅ 自定义配置示例完成');
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
