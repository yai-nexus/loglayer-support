/**
 * 示例4: 生产环境配置
 * 
 * 展示适合生产环境的配置
 */

import { createLogger } from 'loglayer-support';
import type { LoggerConfig } from 'loglayer-support';
import { createExampleRunner, getSLSConfig } from '../lib/shared-utils.js';

/**
 * 生产环境配置示例
 */
async function runProductionConfigExample(): Promise<void> {
  const productionConfig: LoggerConfig = {
    level: {
      default: 'info',
      loggers: {
        'debug': 'error',       // 生产环境禁用调试模块
        'test': 'error'         // 生产环境禁用测试模块
      }
    },
    server: {
      outputs: [
        { type: 'stdout' },     // 容器化部署标准输出
        { 
          type: 'file',
          config: { 
            dir: '/var/log/app',
            filename: 'production.log',
            maxSize: '50MB',
            maxFiles: 10
          }
        },
        {
          type: 'sls',          // 云端日志收集
          level: 'warn',        // 只收集警告及以上级别
          config: getSLSConfig()
        }
      ]
    },
    client: {
      outputs: [
        {
          type: 'http',         // 生产环境只上报到服务器
          level: 'warn',
          config: {
            endpoint: '/api/client-logs',
            bufferSize: 10,
            flushInterval: 5000
          }
        }
      ]
    }
  };

  const prodLogger = await createLogger('production-app', productionConfig);
  
  prodLogger.info('生产环境应用启动', { 
    version: '1.2.0',
    environment: 'production',
    node_version: process.version
  });
  
  prodLogger.warn('配置警告', { 
    message: 'Using default database connection pool size',
    defaultSize: 10
  });
  
  prodLogger.error('生产环境错误', {
    error: 'Database connection timeout',
    retryCount: 3,
    lastAttempt: new Date().toISOString()
  });
  
  console.log('✅ 生产环境配置示例完成');
}

// 导出示例运行器
export const productionConfigExample = createExampleRunner(
  runProductionConfigExample,
  '示例4: 生产环境配置'
);

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  productionConfigExample();
}
