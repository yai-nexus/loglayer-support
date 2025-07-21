/**
 * Logger 包装器模块
 *
 * 提供增强的 Logger 接口，适配新的内部引擎架构
 * 不再依赖 LogLayer，直接包装内部引擎
 */

import type { IEnhancedLogger, ILogger, LogMetadata, LoggerConfig } from './types';
import { getLoggerLevel, shouldLog } from './config';

/**
 * Logger 包装器类
 * 将内部引擎适配为增强的 Logger 接口
 */
export class LogLayerWrapper implements IEnhancedLogger {
  private engine: ILogger;
  private loggerName: string;
  private config: LoggerConfig;
  private context: LogMetadata = {};

  constructor(
    engine: ILogger,
    loggerName: string,
    config: LoggerConfig,
    context: LogMetadata = {}
  ) {
    this.engine = engine;
    this.loggerName = loggerName;
    this.config = config;
    this.context = context;
  }

  /**
   * 检查是否应该记录此级别的日志
   */
  private shouldLogLevel(messageLevel: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const configLevel = getLoggerLevel(this.loggerName, this.config);
    return shouldLog(messageLevel, configLevel);
  }

  /**
   * 合并元数据
   */
  private mergeMetadata(metadata?: LogMetadata): LogMetadata {
    return {
      ...this.context,
      ...(metadata || {}),
      loggerName: this.loggerName,
    };
  }

  // 基础日志方法
  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLogLevel('debug')) return;
    this.engine.debug(message, this.mergeMetadata(metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLogLevel('info')) return;
    this.engine.info(message, this.mergeMetadata(metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLogLevel('warn')) return;
    this.engine.warn(message, this.mergeMetadata(metadata));
  }

  error(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLogLevel('error')) return;
    this.engine.error(message, this.mergeMetadata(metadata));
  }

  // 上下文绑定方法
  child(bindings: LogMetadata): IEnhancedLogger {
    const newContext = { ...this.context, ...bindings };
    return new LogLayerWrapper(this.engine, this.loggerName, this.config, newContext);
  }

  forRequest(requestId: string, traceId?: string): IEnhancedLogger {
    const context = {
      requestId,
      ...(traceId && { traceId }),
      requestTimestamp: new Date().toISOString(),
    };
    return this.child(context);
  }

  forUser(userId: string): IEnhancedLogger {
    return this.child({ userId });
  }

  forModule(moduleName: string): IEnhancedLogger {
    return this.child({ module: moduleName });
  }

  // 增强方法
  logError(error: Error, context?: LogMetadata, message = 'Error occurred'): void {
    const errorMetadata = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      ...context,
    };

    this.error(message, errorMetadata);
  }

  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void {
    const performanceMetadata = {
      performance: {
        operation,
        duration: `${duration}ms`,
        durationMs: duration,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    this.info(`Performance: ${operation} completed in ${duration}ms`, performanceMetadata);
  }

  // 原始 logger 访问（兼容性）
  get raw(): any {
    // 为了向后兼容，返回一个模拟的 LogLayer 接口
    return {
      debug: (message: string) => this.debug(message),
      info: (message: string) => this.info(message),
      warn: (message: string) => this.warn(message),
      error: (message: string) => this.error(message),
      withContext: (context: LogMetadata) => this.child(context).raw,
      withMetadata: (metadata: LogMetadata) => ({
        debug: (message: string) => this.debug(message, metadata),
        info: (message: string) => this.info(message, metadata),
        warn: (message: string) => this.warn(message, metadata),
        error: (message: string) => this.error(message, metadata),
      }),
    };
  }

  // 新增：获取当前配置
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // 新增：获取当前上下文
  getContext(): LogMetadata {
    return { ...this.context };
  }

  // 新增：获取 logger 名称
  getName(): string {
    return this.loggerName;
  }
}

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
