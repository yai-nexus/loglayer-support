/**
 * 示例3: 增强功能使用
 * 
 * 展示 LogLayer 的高级功能
 */

import { createServerLogger } from '@yai-loglayer/server';
import { createDevelopmentConfig } from '@yai-loglayer/core';
import type { LoggerConfig } from '@yai-loglayer/core';
import { createExampleRunner, delay, getSLSConfig, getLogsDir } from '../lib/shared-utils.js';

/**
 * 增强功能示例
 */
async function runEnhancedFeaturesExample(): Promise<void> {
  const devConfig = createDevelopmentConfig();
  const slsConfig = getSLSConfig();

  // 创建包含 SLS 输出的配置
  const config: LoggerConfig = {
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

  const logger = await createServerLogger('enhanced-demo', config);
  
  // 上下文绑定 - 使用 LogLayer 的 withContext 方法
  const requestLogger = logger.withContext({ requestId: 'req_123', traceId: 'trace_456' });
  const userLogger = logger.withContext({ userId: 'user_789' });
  const moduleLogger = logger.withContext({ module: 'payment' });
  
  requestLogger.withMetadata({ endpoint: '/api/payment' }).info('处理用户请求');
  userLogger.withMetadata({ action: 'purchase' }).info('用户操作');
  moduleLogger.withMetadata({ amount: 99.99 }).debug('支付流程开始');
  
  // 错误记录
  try {
    throw new Error('模拟错误');
  } catch (error) {
    const err = error as Error;
    logger.withMetadata({
      context: 'payment-processing',
      error: err,
      errorName: err.name,
      errorStack: err.stack
    }).error('支付处理错误');
  }
  
  // 性能记录
  const startTime = Date.now();
  await delay(100); // 模拟异步操作
  const duration = Date.now() - startTime;
  
  logger.withMetadata({
    operation: 'database-query',
    duration,
    performanceType: 'measurement',
    query: 'SELECT * FROM users',
    rowCount: 150
  }).info('Performance: database-query');
  
  // 链式调用 - 使用 LogLayer 的复合上下文
  const contextLogger = logger.withContext({
    requestId: 'req_456',
    userId: 'user_123',
    module: 'billing'
  });
    
  contextLogger.withMetadata({
    operation: 'create-invoice',
    amount: 199.99
  }).info('复合上下文日志');
  
  console.log('✅ 增强功能示例完成');
}

// 导出示例运行器
export const enhancedFeaturesExample = createExampleRunner(
  runEnhancedFeaturesExample,
  '示例3: 增强功能使用'
);

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  enhancedFeaturesExample();
}
