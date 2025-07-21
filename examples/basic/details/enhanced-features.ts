/**
 * 示例3: 增强功能使用
 * 
 * 展示 LogLayer 的高级功能
 */

import { createLogger, createDevelopmentConfig } from 'loglayer-support';
import { createExampleRunner, delay } from '../lib/shared-utils.ts';

/**
 * 增强功能示例
 */
async function runEnhancedFeaturesExample(): Promise<void> {
  const config = createDevelopmentConfig();
  const logger = await createLogger('enhanced-demo', config);
  
  // 上下文绑定
  const requestLogger = logger.forRequest('req_123', 'trace_456');
  const userLogger = logger.forUser('user_789');
  const moduleLogger = logger.forModule('payment');
  
  requestLogger.info('处理用户请求', { endpoint: '/api/payment' });
  userLogger.info('用户操作', { action: 'purchase' });
  moduleLogger.debug('支付流程开始', { amount: 99.99 });
  
  // 错误记录
  try {
    throw new Error('模拟错误');
  } catch (error) {
    logger.logError(error as Error, { context: 'payment-processing' });
  }
  
  // 性能记录
  const startTime = Date.now();
  await delay(100); // 模拟异步操作
  const duration = Date.now() - startTime;
  
  logger.logPerformance('database-query', duration, { 
    query: 'SELECT * FROM users',
    rowCount: 150 
  });
  
  // 链式调用
  const contextLogger = logger
    .forRequest('req_456')
    .forUser('user_123')
    .forModule('billing');
    
  contextLogger.info('复合上下文日志', { 
    operation: 'create-invoice',
    amount: 199.99 
  });
  
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
