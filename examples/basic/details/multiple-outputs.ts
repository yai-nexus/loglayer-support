/**
 * 示例5: 多输出手段配置
 * 
 * 展示如何配置多种输出方式
 */

import { createLogger } from 'loglayer-support';
import type { LoggerConfig } from 'loglayer-support';
import { createExampleRunner, getSLSConfig, getLogsDir } from '../lib/shared-utils.js';

/**
 * 多输出配置示例
 */
async function runMultipleOutputsExample(): Promise<void> {
  const multiOutputConfig: LoggerConfig = {
    level: { default: 'debug' },
    server: {
      outputs: [
        { type: 'stdout' },                                   // 控制台实时查看
        { 
          type: 'file', 
          config: { dir: getLogsDir(), filename: 'all.log' }     // 完整日志文件
        },
        { 
          type: 'file',
          level: 'error',                                     // 只记录错误的文件
          config: { dir: getLogsDir(), filename: 'errors.log' }
        },
        {
          type: 'http',
          level: 'warn',                                      // 警告及以上发送到监控系统
          config: { 
            url: 'http://monitoring.example.com/logs',
            headers: { 'Authorization': 'Bearer token123' }
          }
        },
        {
          type: 'sls',                                        // 阿里云日志服务
          level: 'info',                                      // 信息及以上发送到 SLS
          config: getSLSConfig()
        }
      ]
    },
    client: {
      outputs: [
        { type: 'console' },                                  // 开发者工具
        { 
          type: 'localstorage',
          config: { 
            key: 'app-logs',
            maxEntries: 50,
            ttl: 24 * 60 * 60 * 1000  // 24小时
          }
        },
        {
          type: 'http',
          level: 'error',
          config: { endpoint: '/api/client-errors' }
        }
      ]
    }
  };

  const multiLogger = await createLogger('multi-output', multiOutputConfig);
  
  multiLogger.debug('调试信息');           // 只输出到 stdout 和 all.log
  multiLogger.info('普通信息');            // 输出到 stdout 和 all.log  
  multiLogger.warn('警告信息');            // 输出到 stdout、all.log 和 HTTP
  multiLogger.error('错误信息');           // 输出到所有地方
  
  console.log('✅ 多输出配置示例完成');
}

// 导出示例运行器
export const multipleOutputsExample = createExampleRunner(
  runMultipleOutputsExample,
  '示例5: 多输出手段配置'
);

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  multipleOutputsExample();
}
