/**
 * 日志数据构建器
 * 负责构建标准化的日志数据对象
 */

import type { LogMetadata } from '../../core'
import type { BrowserLogData, BrowserLoggerConfig } from '../browser'
import { formatTimestamp, getUserAgent, getCurrentUrl, serializeError, deepMerge } from './utils'

export interface LogDataBuilderOptions {
  sessionId: string
  config: BrowserLoggerConfig
  context?: LogMetadata
}

export class LogDataBuilder {
  private readonly sessionId: string
  private readonly config: BrowserLoggerConfig
  private readonly context: LogMetadata

  constructor(options: LogDataBuilderOptions) {
    this.sessionId = options.sessionId
    this.config = options.config
    this.context = options.context || {}
  }

  /**
   * 构建日志数据对象
   */
  build(
    level: string,
    message: string,
    metadata: LogMetadata = {},
    error?: Error
  ): BrowserLogData {
    const logData: BrowserLogData = {
      level,
      message,
      metadata: this.buildMetadata(metadata),
      timestamp: formatTimestamp(),
      sessionId: this.sessionId
    }

    // 添加上下文信息
    if (this.config.context?.includeUserAgent !== false) {
      const userAgent = getUserAgent()
      if (userAgent) {
        logData.userAgent = userAgent
      }
    }

    if (this.config.context?.includeUrl !== false) {
      const url = getCurrentUrl()
      if (url) {
        logData.url = url
      }
    }

    // 添加错误信息
    if (error) {
      logData.error = serializeError(error)
    }

    // 添加自定义上下文字段
    if (this.config.context?.customFields) {
      const customFields: Record<string, any> = {}
      
      for (const [key, getter] of Object.entries(this.config.context.customFields)) {
        try {
          customFields[key] = getter()
        } catch (err) {
          console.warn(`Failed to get custom field "${key}":`, err)
        }
      }
      
      if (Object.keys(customFields).length > 0) {
        logData.metadata = deepMerge(logData.metadata || {}, { customFields })
      }
    }

    return logData
  }

  /**
   * 构建元数据对象
   */
  private buildMetadata(metadata: LogMetadata): LogMetadata {
    // 合并上下文和传入的元数据
    return deepMerge(this.context, metadata)
  }

  /**
   * 创建子构建器（用于上下文继承）
   */
  child(context: LogMetadata): LogDataBuilder {
    return new LogDataBuilder({
      sessionId: this.sessionId,
      config: this.config,
      context: deepMerge(this.context, context)
    })
  }

  /**
   * 更新上下文
   */
  withContext(context: LogMetadata): LogDataBuilder {
    return new LogDataBuilder({
      sessionId: this.sessionId,
      config: this.config,
      context: deepMerge(this.context, context)
    })
  }

  /**
   * 构建性能日志数据
   */
  buildPerformanceLog(
    operation: string,
    duration: number,
    metadata: LogMetadata = {}
  ): BrowserLogData {
    const perfData = {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration,
      timestamp: formatTimestamp(),
      ...metadata
    }

    const level = this.config.performance?.performanceLogLevel || 'info'
    const message = `Performance: ${operation} completed in ${duration.toFixed(2)}ms`

    return this.build(level, message, {
      performance: perfData,
      ...metadata
    })
  }

  /**
   * 构建错误日志数据
   */
  buildErrorLog(
    error: Error,
    metadata: LogMetadata = {},
    customMessage?: string
  ): BrowserLogData {
    const message = customMessage || error.message
    
    return this.build('error', message, metadata, error)
  }

  /**
   * 获取当前配置
   */
  getConfig(): BrowserLoggerConfig {
    return this.config
  }

  /**
   * 获取当前上下文
   */
  getContext(): LogMetadata {
    return { ...this.context }
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId
  }
}
