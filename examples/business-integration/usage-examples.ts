/**
 * 日志器使用示例集合
 * 
 * 展示各种场景下的日志记录最佳实践
 */

import { logger, generateTraceId, logApiRequest, logApiResponse } from './server-logger-new';

// ==================== 基础使用示例 ====================

/**
 * 基础日志记录
 */
export function basicLoggingExample() {
  logger.info('应用启动成功');
  logger.error('数据库连接失败', { error: 'Connection timeout' });
  logger.debug('调试信息', { userId: 123, action: 'login' });
  logger.warn('性能警告', { responseTime: 2000 });
}

/**
 * 带上下文的日志记录
 */
export function contextualLoggingExample() {
  const userId = 123;
  const sessionId = 'sess_abc123';
  
  logger.info('用户登录', { 
    userId, 
    sessionId, 
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  });
  
  logger.info('用户操作', { 
    userId, 
    sessionId, 
    action: 'view_profile',
    timestamp: new Date().toISOString()
  });
}

// ==================== API 路由示例 ====================

/**
 * Next.js API 路由示例
 */
export async function nextjsApiExample(request: Request) {
  const traceId = logApiRequest('POST', '/api/users', { body: 'user data' });
  
  try {
    // 模拟业务逻辑
    const result = await createUser({ name: 'John', email: 'john@example.com' });
    
    logApiResponse(traceId, 'POST', '/api/users', 200, 150);
    return Response.json(result);
  } catch (error: any) {
    logApiResponse(traceId, 'POST', '/api/users', 500, 150, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Express.js 路由示例
 */
export function expressApiExample(req: any, res: any) {
  const traceId = logApiRequest(req.method, req.path, req.body);
  const startTime = Date.now();
  
  try {
    // 模拟业务逻辑
    const result = { id: 1, name: 'John' };
    const duration = Date.now() - startTime;
    
    logApiResponse(traceId, req.method, req.path, 200, duration);
    res.json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse(traceId, req.method, req.path, 500, duration, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ==================== 业务逻辑示例 ====================

/**
 * 数据库操作示例
 */
export async function createUser(userData: { name: string; email: string }) {
  logger.info('开始创建用户', { userData });
  
  try {
    // 模拟数据库操作
    const user = { id: Date.now(), ...userData };
    
    logger.info('用户创建成功', { userId: user.id, email: user.email });
    return user;
  } catch (error: any) {
    logger.error('用户创建失败', { 
      error: error.message, 
      userData,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * 外部服务调用示例
 */
export async function callExternalService(serviceUrl: string, data: any) {
  const traceId = generateTraceId();
  
  logger.info('调用外部服务', { 
    traceId, 
    serviceUrl, 
    data,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 模拟外部服务调用
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    logger.info('外部服务调用成功', { 
      traceId, 
      serviceUrl, 
      status: response.status,
      result 
    });
    
    return result;
  } catch (error: any) {
    logger.error('外部服务调用失败', { 
      traceId, 
      serviceUrl, 
      error: error.message,
      data 
    });
    throw error;
  }
}

// ==================== 错误处理示例 ====================

/**
 * 全局错误处理示例
 */
export function setupGlobalErrorHandling() {
  // 未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { 
      error: error.message, 
      stack: error.stack,
      type: 'uncaughtException'
    });
    process.exit(1);
  });
  
  // 未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 拒绝', { 
      reason: String(reason), 
      promise: String(promise),
      type: 'unhandledRejection'
    });
  });
}

// ==================== 性能监控示例 ====================

/**
 * 性能监控示例
 */
export function performanceMonitoringExample() {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  // 模拟一些工作
  setTimeout(() => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    logger.info('性能指标', {
      duration: endTime - startTime,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      },
      type: 'performance'
    });
  }, 1000);
}

// ==================== 定时任务示例 ====================

/**
 * 定时任务日志示例
 */
export function scheduledTaskExample() {
  const taskId = `task_${Date.now()}`;
  
  logger.info('定时任务开始', { 
    taskId, 
    taskName: 'data_cleanup',
    scheduledTime: new Date().toISOString()
  });
  
  try {
    // 模拟任务执行
    const result = { processed: 100, deleted: 50 };
    
    logger.info('定时任务完成', { 
      taskId, 
      taskName: 'data_cleanup',
      result,
      duration: 5000
    });
  } catch (error: any) {
    logger.error('定时任务失败', { 
      taskId, 
      taskName: 'data_cleanup',
      error: error.message
    });
  }
}
