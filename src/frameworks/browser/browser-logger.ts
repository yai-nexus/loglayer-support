/**
 * 浏览器端日志器实现
 */

import type { LogMetadata } from '../../core'
import { ErrorHandler, createErrorHandler, ErrorCategory, ErrorSeverity } from '../../core'
import type { 
  IBrowserLogger, 
  BrowserLoggerConfig, 
  LogOutput, 
  BrowserLogLevel 
} from '../browser'
import { SessionManager } from './session-manager'
import { LogDataBuilder } from './log-data-builder'
import { ConsoleOutput } from './outputs/console-output'
import { LocalStorageOutput } from './outputs/localstorage-output'
import { HttpOutput } from './outputs/http-output'
import { shouldLog, shouldSample, deepMerge, getPerformanceNow } from './utils'

export class BrowserLogger implements IBrowserLogger {
  private readonly config: BrowserLoggerConfig
  private readonly sessionManager: SessionManager
  private readonly logDataBuilder: LogDataBuilder
  private readonly outputs: Map<string, LogOutput> = new Map()
  private readonly errorHandler: ErrorHandler
  private isDestroyed = false

  constructor(config: BrowserLoggerConfig = {}) {
    this.config = this.normalizeConfig(config)

    // 初始化错误处理器
    this.errorHandler = createErrorHandler({
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      logErrors: true
    })

    // 初始化会话管理器
    this.sessionManager = new SessionManager(
      this.config.sessionId,
      'log-session-id'
    )
    
    // 初始化日志数据构建器
    this.logDataBuilder = new LogDataBuilder({
      sessionId: this.sessionManager.getSessionId(),
      config: this.config
    })
    
    // 初始化输出器
    this.initializeOutputs()
    
    // 设置全局错误处理
    this.setupGlobalErrorHandling()
    
    // 设置性能监控
    this.setupPerformanceMonitoring()
  }

  /**
   * 标准化配置
   */
  private normalizeConfig(config: BrowserLoggerConfig): BrowserLoggerConfig {
    const defaultConfig: BrowserLoggerConfig = {
      level: 'info' as BrowserLogLevel,
      outputs: {
        console: true,
        localStorage: false,
        http: false,
        indexedDB: false
      },
      context: {
        includeUserAgent: true,
        includeUrl: true,
        includeTimestamp: true
      },
      performance: {
        enablePerformanceLogging: false,
        performanceLogLevel: 'info' as BrowserLogLevel,
        autoLogPageLoad: false,
        autoLogResourceLoad: false
      },
      errorHandling: {
        captureGlobalErrors: false,
        captureUnhandledRejections: false
      },
      sampling: {
        rate: 1.0
      }
    }

    return deepMerge(defaultConfig, config)
  }

  /**
   * 初始化输出器
   */
  private initializeOutputs(): void {
    const { outputs } = this.config

    // 控制台输出器
    if (outputs?.console) {
      const consoleConfig = typeof outputs.console === 'boolean' 
        ? { enabled: true }
        : outputs.console
      
      this.outputs.set('console', new ConsoleOutput(consoleConfig))
    }

    // 本地存储输出器
    if (outputs?.localStorage) {
      const localStorageConfig = typeof outputs.localStorage === 'boolean'
        ? { enabled: true }
        : outputs.localStorage
      
      this.outputs.set('localStorage', new LocalStorageOutput(localStorageConfig))
    }

    // HTTP 输出器
    if (outputs?.http) {
      const httpConfig = typeof outputs.http === 'boolean'
        ? { enabled: true }
        : outputs.http
      
      this.outputs.set('http', new HttpOutput(httpConfig))
    }

    // TODO: IndexedDB 输出器将在第二阶段实现
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    if (!this.config.errorHandling?.captureGlobalErrors) {
      return
    }

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      if (this.config.errorHandling?.errorFilter) {
        if (!this.config.errorHandling.errorFilter(event.error)) {
          return
        }
      }

      this.logError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'global-error'
      }, 'Global JavaScript Error')
    })

    // 捕获未处理的 Promise 拒绝
    if (this.config.errorHandling?.captureUnhandledRejections) {
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason))

        if (this.config.errorHandling?.errorFilter) {
          if (!this.config.errorHandling.errorFilter(error)) {
            return
          }
        }

        this.logError(error, {
          source: 'unhandled-rejection'
        }, 'Unhandled Promise Rejection')
      })
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.performance?.enablePerformanceLogging) {
      return
    }

    // 页面加载性能
    if (this.config.performance.autoLogPageLoad) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.logPageLoadPerformance()
        }, 0)
      })
    }

    // 资源加载性能
    if (this.config.performance.autoLogResourceLoad) {
      // TODO: 实现资源加载性能监控
    }
  }

  /**
   * 记录页面加载性能
   */
  private logPageLoadPerformance(): void {
    if (!('performance' in window) || !performance.timing) {
      return
    }

    const timing = performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart

    this.logPerformance('page-load', loadTime, {
      domReady: `${domReady}ms`,
      domReadyMs: domReady,
      firstPaint: this.getFirstPaintTime(),
      resources: performance.getEntriesByType('resource').length
    })
  }

  /**
   * 获取首次绘制时间
   */
  private getFirstPaintTime(): string | undefined {
    if ('getEntriesByName' in performance) {
      const firstPaint = performance.getEntriesByName('first-paint')[0]
      return firstPaint ? `${firstPaint.startTime.toFixed(2)}ms` : undefined
    }
    return undefined
  }

  // ==================== 公共 API ====================

  debug(message: string, metadata: LogMetadata = {}): void {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata: LogMetadata = {}): void {
    this.log('error', message, metadata)
  }

  async logError(error: Error, metadata: LogMetadata = {}, customMessage?: string): Promise<void> {
    try {
      // 使用错误处理器处理错误
      const standardError = await this.errorHandler.handle(error, {
        ...metadata,
        customMessage,
        source: 'browser-logger'
      })

      // 构建日志数据
      const logData = this.logDataBuilder.buildErrorLog(error, {
        ...metadata,
        errorCode: standardError.code,
        errorCategory: standardError.category,
        errorSeverity: standardError.severity
      }, customMessage)

      this.writeToOutputs(logData)
    } catch (handlingError) {
      // 如果错误处理失败，回退到基本日志记录
      console.error('Error handling failed:', handlingError)
      const logData = this.logDataBuilder.buildErrorLog(error, metadata, customMessage)
      this.writeToOutputs(logData)
    }
  }

  logPerformance(operation: string, duration: number, metadata: LogMetadata = {}): void {
    const logData = this.logDataBuilder.buildPerformanceLog(operation, duration, metadata)
    this.writeToOutputs(logData)
  }

  child(context: LogMetadata): IBrowserLogger {
    const childBuilder = this.logDataBuilder.child(context)
    const childLogger = new BrowserLogger(this.config)
    ;(childLogger as any).logDataBuilder = childBuilder
    return childLogger
  }

  withContext(context: LogMetadata): IBrowserLogger {
    return this.child(context)
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId()
  }

  setSessionId(sessionId: string): void {
    this.sessionManager.setSessionId(sessionId)
  }

  addOutput(output: LogOutput): void {
    this.outputs.set(output.name, output)
  }

  removeOutput(output: LogOutput): void {
    this.outputs.delete(output.name)
  }

  async flush(): Promise<void> {
    const flushPromises = Array.from(this.outputs.values())
      .filter(output => output.flush)
      .map(output => output.flush!())

    await Promise.all(flushPromises)
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true

    // 销毁所有输出器
    const destroyPromises = Array.from(this.outputs.values())
      .filter(output => output.destroy)
      .map(output => output.destroy!())

    await Promise.all(destroyPromises)
    this.outputs.clear()
  }

  isReady(): boolean {
    return !this.isDestroyed
  }

  getConfig(): BrowserLoggerConfig {
    return deepMerge({}, this.config)
  }

  // ==================== 私有方法 ====================

  /**
   * 核心日志方法
   */
  private log(level: BrowserLogLevel, message: string, metadata: LogMetadata = {}): void {
    if (this.isDestroyed) {
      return
    }

    // 检查日志级别
    if (!shouldLog(level, this.config.level!)) {
      return
    }

    // 检查采样
    if (!this.shouldSample(level)) {
      return
    }

    // 构建日志数据
    const logData = this.logDataBuilder.build(level, message, metadata)
    
    // 写入到所有输出器
    this.writeToOutputs(logData)
  }

  /**
   * 检查是否应该采样
   */
  private shouldSample(level: BrowserLogLevel): boolean {
    const sampling = this.config.sampling
    if (!sampling) {
      return true
    }

    // 检查级别特定的采样率
    if (sampling.levelRates && sampling.levelRates[level] !== undefined) {
      return shouldSample(sampling.levelRates[level]!)
    }

    // 使用全局采样率
    return shouldSample(sampling.rate || 1.0)
  }

  /**
   * 写入到所有输出器
   */
  private writeToOutputs(logData: any): void {
    for (const output of this.outputs.values()) {
      try {
        output.write(logData)
      } catch (error) {
        console.warn(`Failed to write to output ${output.name}:`, error)
      }
    }
  }
}
