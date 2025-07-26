/**
 * 统一错误处理系统
 * 
 * 提供标准化的错误分类、错误码、错误恢复和降级策略
 */

/**
 * 错误类别
 */
export enum ErrorCategory {
  /** 配置错误 */
  CONFIGURATION = 'configuration',
  /** 网络错误 */
  NETWORK = 'network',
  /** 验证错误 */
  VALIDATION = 'validation',
  /** 处理错误 */
  PROCESSING = 'processing',
  /** 系统错误 */
  SYSTEM = 'system',
  /** 用户错误 */
  USER = 'user',
  /** 未知错误 */
  UNKNOWN = 'unknown'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  /** 低 - 不影响功能 */
  LOW = 'low',
  /** 中 - 部分功能受影响 */
  MEDIUM = 'medium',
  /** 高 - 主要功能受影响 */
  HIGH = 'high',
  /** 严重 - 系统不可用 */
  CRITICAL = 'critical'
}

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
  /** 重试 */
  RETRY = 'retry',
  /** 降级 */
  FALLBACK = 'fallback',
  /** 忽略 */
  IGNORE = 'ignore',
  /** 停止 */
  STOP = 'stop'
}

/**
 * 标准化错误信息
 */
export interface StandardError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误类别 */
  category: ErrorCategory
  /** 严重程度 */
  severity: ErrorSeverity
  /** 恢复策略 */
  recovery: RecoveryStrategy
  /** 原始错误 */
  originalError?: Error
  /** 上下文信息 */
  context?: Record<string, any>
  /** 时间戳 */
  timestamp: string
  /** 堆栈跟踪 */
  stack?: string
}

/**
 * 错误处理选项
 */
export interface ErrorHandlingOptions {
  /** 是否启用自动重试 */
  enableRetry?: boolean
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟 */
  retryDelay?: number
  /** 是否启用降级 */
  enableFallback?: boolean
  /** 是否记录错误 */
  logErrors?: boolean
  /** 自定义错误处理器 */
  customHandler?: (error: StandardError) => void
}

/**
 * 错误码定义
 */
export const ERROR_CODES = {
  // 配置错误 (1000-1999)
  CONFIG_INVALID: 'E1001',
  CONFIG_MISSING: 'E1002',
  CONFIG_TYPE_MISMATCH: 'E1003',
  
  // 网络错误 (2000-2999)
  NETWORK_TIMEOUT: 'E2001',
  NETWORK_CONNECTION_FAILED: 'E2002',
  NETWORK_INVALID_RESPONSE: 'E2003',
  NETWORK_RATE_LIMITED: 'E2004',
  
  // 验证错误 (3000-3999)
  VALIDATION_REQUIRED_FIELD: 'E3001',
  VALIDATION_INVALID_FORMAT: 'E3002',
  VALIDATION_OUT_OF_RANGE: 'E3003',
  VALIDATION_CUSTOM_FAILED: 'E3004',
  
  // 处理错误 (4000-4999)
  PROCESSING_FAILED: 'E4001',
  PROCESSING_TIMEOUT: 'E4002',
  PROCESSING_QUEUE_FULL: 'E4003',
  PROCESSING_INVALID_STATE: 'E4004',
  
  // 系统错误 (5000-5999)
  SYSTEM_OUT_OF_MEMORY: 'E5001',
  SYSTEM_DISK_FULL: 'E5002',
  SYSTEM_PERMISSION_DENIED: 'E5003',
  SYSTEM_RESOURCE_UNAVAILABLE: 'E5004',
  
  // 用户错误 (6000-6999)
  USER_UNAUTHORIZED: 'E6001',
  USER_FORBIDDEN: 'E6002',
  USER_NOT_FOUND: 'E6003',
  USER_INVALID_INPUT: 'E6004'
} as const

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private options: Required<ErrorHandlingOptions>
  private retryCount = new Map<string, number>()

  constructor(options: ErrorHandlingOptions = {}) {
    this.options = {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      logErrors: true,
      ...options
    } as Required<ErrorHandlingOptions>
  }

  /**
   * 处理错误
   */
  async handle(error: Error | StandardError, context?: Record<string, any>): Promise<StandardError> {
    const standardError = this.standardizeError(error, context)
    
    // 记录错误
    if (this.options.logErrors) {
      this.logError(standardError)
    }
    
    // 执行恢复策略
    await this.executeRecoveryStrategy(standardError)
    
    // 调用自定义处理器
    if (this.options.customHandler) {
      try {
        this.options.customHandler(standardError)
      } catch (handlerError) {
        console.error('Custom error handler failed:', handlerError)
      }
    }
    
    return standardError
  }

  /**
   * 标准化错误
   */
  private standardizeError(error: Error | StandardError, context?: Record<string, any>): StandardError {
    if (this.isStandardError(error)) {
      return {
        ...error,
        context: { ...error.context, ...context },
        timestamp: new Date().toISOString()
      }
    }

    // 根据错误类型和消息推断错误信息
    const errorInfo = this.inferErrorInfo(error)
    
    return {
      code: errorInfo.code,
      message: error.message || 'Unknown error',
      category: errorInfo.category,
      severity: errorInfo.severity,
      recovery: errorInfo.recovery,
      originalError: error,
      context: context || {},
      timestamp: new Date().toISOString(),
      stack: error.stack
    }
  }

  /**
   * 推断错误信息
   */
  private inferErrorInfo(error: Error): {
    code: string
    category: ErrorCategory
    severity: ErrorSeverity
    recovery: RecoveryStrategy
  } {
    const message = error.message.toLowerCase()
    
    // 网络相关错误
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        code: ERROR_CODES.NETWORK_TIMEOUT,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        recovery: RecoveryStrategy.RETRY
      }
    }
    
    if (message.includes('connection') || message.includes('fetch')) {
      return {
        code: ERROR_CODES.NETWORK_CONNECTION_FAILED,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        recovery: RecoveryStrategy.RETRY
      }
    }
    
    // 验证相关错误
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        recovery: RecoveryStrategy.IGNORE
      }
    }
    
    // 配置相关错误
    if (message.includes('config') || message.includes('configuration')) {
      return {
        code: ERROR_CODES.CONFIG_INVALID,
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.HIGH,
        recovery: RecoveryStrategy.FALLBACK
      }
    }
    
    // 默认为未知错误
    return {
      code: 'E9999',
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recovery: RecoveryStrategy.FALLBACK
    }
  }

  /**
   * 执行恢复策略
   */
  private async executeRecoveryStrategy(error: StandardError): Promise<void> {
    const errorKey = `${error.code}-${JSON.stringify(error.context)}`
    
    switch (error.recovery) {
      case RecoveryStrategy.RETRY:
        if (this.options.enableRetry) {
          await this.handleRetry(errorKey)
        }
        break
        
      case RecoveryStrategy.FALLBACK:
        if (this.options.enableFallback) {
          await this.handleFallback(error)
        }
        break
        
      case RecoveryStrategy.IGNORE:
        // 忽略错误，不做任何处理
        break
        
      case RecoveryStrategy.STOP:
        // 停止处理，抛出错误
        throw new Error(`Critical error: ${error.message}`)
    }
  }

  /**
   * 处理重试
   */
  private async handleRetry(errorKey: string): Promise<void> {
    const currentRetries = this.retryCount.get(errorKey) || 0
    
    if (currentRetries < this.options.maxRetries) {
      this.retryCount.set(errorKey, currentRetries + 1)
      
      // 指数退避延迟
      const delay = this.options.retryDelay * Math.pow(2, currentRetries)
      await new Promise(resolve => setTimeout(resolve, delay))
    } else {
      // 达到最大重试次数，清除计数
      this.retryCount.delete(errorKey)
    }
  }

  /**
   * 处理降级
   */
  private async handleFallback(error: StandardError): Promise<void> {
    // 这里可以实现具体的降级逻辑
    // 例如：切换到备用服务、使用缓存数据等
    console.warn(`Fallback triggered for error: ${error.code}`)
  }

  /**
   * 记录错误
   */
  private logError(error: StandardError): void {
    const logLevel = this.getLogLevel(error.severity)
    const logMessage = `[${error.code}] ${error.message}`
    
    console[logLevel](logMessage, {
      category: error.category,
      severity: error.severity,
      recovery: error.recovery,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack
    })
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'info'
      default:
        return 'error'
    }
  }

  /**
   * 检查是否为标准错误
   */
  private isStandardError(error: any): error is StandardError {
    return error && typeof error === 'object' && 'code' in error && 'category' in error
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(errorKey?: string): void {
    if (errorKey) {
      this.retryCount.delete(errorKey)
    } else {
      this.retryCount.clear()
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalRetries: number
    activeRetries: number
  } {
    const totalRetries = Array.from(this.retryCount.values()).reduce((sum, count) => sum + count, 0)
    
    return {
      totalRetries,
      activeRetries: this.retryCount.size
    }
  }
}

/**
 * 创建错误处理器
 */
export function createErrorHandler(options?: ErrorHandlingOptions): ErrorHandler {
  return new ErrorHandler(options)
}

/**
 * 全局错误处理器实例
 */
export const globalErrorHandler = createErrorHandler()
