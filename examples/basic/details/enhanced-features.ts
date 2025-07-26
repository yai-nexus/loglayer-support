/**
 * 示例3: 增强功能使用
 * 
 * 展示 LogLayer 的高级功能
 */

import { createLogger, createDevelopmentConfig } from '@yai-nexus/loglayer-support';
import { createExampleRunner, delay } from '../lib/shared-utils.ts';

/**
 * 增强功能示例
 */
async function runEnhancedFeaturesExample(): Promise<void> {
  const config = createDevelopmentConfig();
  const logger = await createLogger('enhanced-demo', config);
  
  // 上下文绑定 - LogLayer 不支持这些方法，使用消息前缀和元数据替代
  const requestLogger = {
    info: (msg: string, meta?: any) => logger.info(`[REQ req_123] ${msg}`, { ...meta, requestId: 'req_123', traceId: 'trace_456' }),
    debug: (msg: string, meta?: any) => logger.debug(`[REQ req_123] ${msg}`, { ...meta, requestId: 'req_123', traceId: 'trace_456' }),
    warn: (msg: string, meta?: any) => logger.warn(`[REQ req_123] ${msg}`, { ...meta, requestId: 'req_123', traceId: 'trace_456' }),
    error: (msg: string, meta?: any) => logger.error(`[REQ req_123] ${msg}`, { ...meta, requestId: 'req_123', traceId: 'trace_456' })
  };
  const userLogger = {
    info: (msg: string, meta?: any) => logger.info(`[USER user_789] ${msg}`, { ...meta, userId: 'user_789' }),
    debug: (msg: string, meta?: any) => logger.debug(`[USER user_789] ${msg}`, { ...meta, userId: 'user_789' }),
    warn: (msg: string, meta?: any) => logger.warn(`[USER user_789] ${msg}`, { ...meta, userId: 'user_789' }),
    error: (msg: string, meta?: any) => logger.error(`[USER user_789] ${msg}`, { ...meta, userId: 'user_789' })
  };
  const moduleLogger = {
    info: (msg: string, meta?: any) => logger.info(`[MODULE payment] ${msg}`, { ...meta, module: 'payment' }),
    debug: (msg: string, meta?: any) => logger.debug(`[MODULE payment] ${msg}`, { ...meta, module: 'payment' }),
    warn: (msg: string, meta?: any) => logger.warn(`[MODULE payment] ${msg}`, { ...meta, module: 'payment' }),
    error: (msg: string, meta?: any) => logger.error(`[MODULE payment] ${msg}`, { ...meta, module: 'payment' })
  };
  
  requestLogger.info('处理用户请求', { endpoint: '/api/payment' });
  userLogger.info('用户操作', { action: 'purchase' });
  moduleLogger.debug('支付流程开始', { amount: 99.99 });
  
  // 错误记录
  try {
    throw new Error('模拟错误');
  } catch (error) {
    const err = error as Error;
    logger.error('支付处理错误', { 
      context: 'payment-processing',
      error: err,
      errorName: err.name,
      errorStack: err.stack
    });
  }
  
  // 性能记录
  const startTime = Date.now();
  await delay(100); // 模拟异步操作
  const duration = Date.now() - startTime;
  
  logger.info('Performance: database-query', {
    operation: 'database-query',
    duration,
    performanceType: 'measurement',
    query: 'SELECT * FROM users',
    rowCount: 150 
  });
  
  // 链式调用 - LogLayer 不支持链式调用，使用复合上下文
  const contextLogger = {
    info: (msg: string, meta?: any) => logger.info(`[REQ req_456][USER user_123][MODULE billing] ${msg}`, {
      ...meta,
      requestId: 'req_456',
      userId: 'user_123',
      module: 'billing'
    }),
    debug: (msg: string, meta?: any) => logger.debug(`[REQ req_456][USER user_123][MODULE billing] ${msg}`, {
      ...meta,
      requestId: 'req_456',
      userId: 'user_123',
      module: 'billing'
    }),
    warn: (msg: string, meta?: any) => logger.warn(`[REQ req_456][USER user_123][MODULE billing] ${msg}`, {
      ...meta,
      requestId: 'req_456',
      userId: 'user_123',
      module: 'billing'
    }),
    error: (msg: string, meta?: any) => logger.error(`[REQ req_456][USER user_123][MODULE billing] ${msg}`, {
      ...meta,
      requestId: 'req_456',
      userId: 'user_123',
      module: 'billing'
    })
  };
    
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
