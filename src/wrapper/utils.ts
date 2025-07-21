/**
 * Logger 包装器工具函数
 * 
 * 提供各种实用工具，如ID生成、性能测量、错误边界等
 */

import type { IEnhancedLogger, LogMetadata } from '../core';

/**
 * 工具函数：生成请求 ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * 工具函数：生成追踪 ID
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 工具函数：创建性能测量器
 */
export function createPerformanceMeasurer(logger: IEnhancedLogger, operation: string) {
  const startTime = Date.now();

  return {
    /**
     * 完成测量并记录性能日志
     */
    finish(metadata?: LogMetadata): number {
      const duration = Date.now() - startTime;
      logger.logPerformance(operation, duration, metadata);
      return duration;
    },

    /**
     * 获取当前已用时间（不记录日志）
     */
    getElapsed(): number {
      return Date.now() - startTime;
    },
  };
}

/**
 * 工具函数：错误边界包装器
 */
export function withErrorLogging<T extends (...args: any[]) => any>(
  logger: IEnhancedLogger,
  fn: T,
  context?: LogMetadata
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      logger.logError(error as Error, context, `Error in function ${fn.name || 'anonymous'}`);
      throw error;
    }
  }) as T;
}

/**
 * 工具函数：异步函数错误边界包装器
 */
export function withAsyncErrorLogging<T extends (...args: any[]) => Promise<any>>(
  logger: IEnhancedLogger,
  fn: T,
  context?: LogMetadata
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.logError(error as Error, context, `Async error in function ${fn.name || 'anonymous'}`);
      throw error;
    }
  }) as T;
}