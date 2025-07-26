/**
 * Next.js Logger 配置示例
 * 
 * 展示如何在 Next.js 项目中配置和使用 Logger
 */

import { createLoggerSync, detectEnvironment } from 'loglayer-support';
import type { LoggerConfig } from 'loglayer-support';

// =============================================================================
// Next.js 专用配置
// =============================================================================

function createNextjsConfig(): LoggerConfig {
  const env = detectEnvironment();
  
  return {
    level: {
      default: env.environment === 'development' ? 'debug' : 'info',
      loggers: {
        'ui': env.environment === 'production' ? 'warn' : 'debug',
        'api': 'info',
        'auth': env.environment === 'production' ? 'warn' : 'debug'
      }
    },
    server: {
      outputs: [
        { type: 'stdout' },                                 // 服务端控制台
        ...(env.environment === 'development' ? [
          { 
            type: 'file' as const,
            config: { 
              dir: './logs',
              filename: 'nextjs-development.log'
            }
          }
        ] : []),
        ...(env.environment === 'production' ? [
          {
            type: 'sls' as const,
            level: 'warn' as const,
            config: {
              endpoint: process.env.SLS_ENDPOINT,
              project: process.env.SLS_PROJECT,
              logstore: 'nextjs-server-logs'
            }
          }
        ] : [])
      ]
    },
    client: {
      outputs: [
        { type: 'console' },                                // 浏览器控制台
        ...(env.environment === 'production' ? [
          {
            type: 'http' as const,
            level: 'error' as const,
            config: {
              endpoint: '/api/client-logs',
              bufferSize: 5,
              flushInterval: 10000
            }
          }
        ] : [])
      ]
    }
  };
}

// =============================================================================
// 创建应用级别的 Logger
// =============================================================================

// 同步创建（简化版，适用于演示）
export const logger = createLoggerSync('nextjs-demo');

// =============================================================================
// 创建模块特定的 Logger
// =============================================================================

// UI 组件日志
export const uiLogger = logger.forModule('ui');

// API 路由日志
export const apiLogger = logger.forModule('api');

// 认证模块日志
export const authLogger = logger.forModule('auth');

// 数据库模块日志  
export const dbLogger = logger.forModule('database');

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 为 API 路由创建请求特定的 Logger
 */
export function createApiLogger(req: any) {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
  const traceId = req.headers['x-trace-id'];
  
  return apiLogger.forRequest(requestId, traceId);
}

/**
 * 为用户相关操作创建 Logger
 */
export function createUserLogger(userId: string) {
  return logger.forUser(userId);
}

/**
 * 记录页面性能
 */
export function logPagePerformance(page: string, loadTime: number) {
  uiLogger.logPerformance(`page-load-${page}`, loadTime, {
    page,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
  });
}

/**
 * 记录API性能
 */
export function logApiPerformance(endpoint: string, method: string, duration: number, statusCode: number) {
  apiLogger.logPerformance(`api-${method.toLowerCase()}-${endpoint.replace(/\//g, '-')}`, duration, {
    endpoint,
    method,
    statusCode,
    timestamp: new Date().toISOString()
  });
}

// =============================================================================
// Next.js 中间件辅助函数
// =============================================================================

/**
 * API 路由中间件 - 添加请求日志
 */
export function withRequestLogging(handler: any) {
  return async (req: any, res: any) => {
    const requestLogger = createApiLogger(req);
    const startTime = Date.now();
    
    requestLogger.info(`API Request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    
    try {
      const result = await handler(req, res);
      
      const duration = Date.now() - startTime;
      logApiPerformance(req.url, req.method, duration, res.statusCode || 200);
      
      requestLogger.info(`API Response: ${res.statusCode || 200}`, {
        statusCode: res.statusCode || 200,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      requestLogger.logError(error as Error, {
        method: req.method,
        url: req.url,
        duration
      }, 'API Error');
      
      throw error;
    }
  };
}

/**
 * 错误边界日志记录
 */
export function logErrorBoundary(error: Error, errorInfo: any) {
  uiLogger.logError(error, {
    errorBoundary: true,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString()
  }, 'React Error Boundary');
}

// =============================================================================
// 使用示例
// =============================================================================

export function demonstrateUsage() {
  // 基础使用
  logger.info('Next.js 应用启动', { 
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
  
  // 模块特定日志
  uiLogger.debug('组件渲染', { component: 'HomePage' });
  apiLogger.info('API 调用', { endpoint: '/api/users' });
  authLogger.warn('认证失败', { attempts: 3 });
  
  // 用户特定日志
  const userLogger = createUserLogger('user_123');
  userLogger.info('用户操作', { action: 'profile_update' });
  
  // 性能日志
  logPagePerformance('home', 1500);
  logApiPerformance('/api/users', 'GET', 250, 200);
  
  // 错误日志
  try {
    throw new Error('示例错误');
  } catch (error) {
    logger.logError(error as Error, { context: 'demo' });
  }
}