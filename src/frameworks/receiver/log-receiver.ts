/**
 * 日志接收器实现
 */

import type { LogLayer } from 'loglayer'
import type {
  ILogReceiver,
  LogReceiverConfig,
  LogReceiverHandler,
  ClientLogData,
  ClientInfo,
  ValidationResult,
  ProcessResult,
  ResponseData,
  FrameworkAdapter
} from '../receiver'

import { LogDataValidator } from './validator'
import { AdapterFactory } from './adapters'

export class LogReceiver implements ILogReceiver {
  private readonly logger: LogLayer
  private readonly config: LogReceiverConfig
  private readonly validator: LogDataValidator
  private readonly adapter: FrameworkAdapter
  private _isDestroyed = false

  constructor(
    logger: LogLayer,
    config: LogReceiverConfig = {},
    adapterType: 'nextjs' | 'express' | 'generic' | 'auto' = 'auto'
  ) {
    this.logger = logger
    this.config = this.normalizeConfig(config)
    
    // 初始化组件（简化）
    this.validator = new LogDataValidator(this.config.validation)
    this.adapter = AdapterFactory.create(adapterType)
  }

  /**
   * 标准化配置
   */
  private normalizeConfig(config: LogReceiverConfig): LogReceiverConfig {
    return {
      validation: {
        requireLevel: true,
        requireMessage: true,
        allowedLevels: ['debug', 'info', 'warn', 'error'],
        maxMessageLength: 1000,
        maxMetadataSize: 10240,
        validateTimestamp: false,
        ...config.validation
      },
      processing: {
        preserveClientLevel: true,
        addServerContext: true,
        logSuccessfulReceives: false,
        supportBatch: true,
        maxBatchSize: 100,
        messagePrefix: '[客户端]',
        reconstructErrors: true,
        ...config.processing
      },
      security: {
        validateOrigin: false,
        allowedOrigins: [],
        rateLimiting: {
          maxRequestsPerMinute: 60,
          windowMs: 60000,
          byIP: true,
          bySession: false
        },
        contentFilter: {
          filterSensitive: false,
          sensitiveFields: ['password', 'token', 'apiKey'],
        },
        ...config.security
      },
      response: {
        successMessage: '日志已成功接收',
        errorMessage: '日志处理失败',
        includeDetails: false,
        includeStats: true,
        ...config.response
      },
      debug: config.debug || false
    }
  }

  /**
   * 处理单条日志（简化版）
   */
  async processSingle(data: ClientLogData, context?: any): Promise<ProcessResult> {
    if (this._isDestroyed) {
      throw new Error('LogReceiver has been destroyed')
    }

    // 基本验证
    const validationResult = this.validate(data)
    if (!validationResult.valid) {
      return {
        success: false,
        processed: 0,
        failed: 1,
        errors: [{
          item: data,
          error: `Validation failed: ${validationResult.errors.join(', ')}`
        }]
      }
    }

    try {
      // 直接转发到 LogLayer 实例
      const level = data.level as 'debug' | 'info' | 'warn' | 'error'
      const message = `[Client] ${data.message}`

      this.logger[level](message)

      return {
        success: true,
        processed: 1,
        failed: 0
      }
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: 1,
        errors: [{
          item: data,
          error: (error as Error).message
        }]
      }
    }
  }

  /**
   * 处理批量日志（简化版）
   */
  async processBatch(data: ClientLogData[], context?: any): Promise<ProcessResult> {
    if (this._isDestroyed) {
      throw new Error('LogReceiver has been destroyed')
    }

    let processed = 0
    let failed = 0
    const errors: Array<{ item: any; error: string }> = []

    // 逐条处理日志
    for (const logData of data) {
      try {
        const result = await this.processSingle(logData, context)
        if (result.success) {
          processed++
        } else {
          failed++
          if (result.errors) {
            errors.push(...result.errors)
          }
        }
      } catch (error) {
        failed++
        errors.push({
          item: logData,
          error: (error as Error).message
        })
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * 验证日志数据
   */
  validate(data: any): ValidationResult {
    return this.validator.validate(data)
  }

  /**
   * 提取客户端信息
   */
  extractClientInfo(data: any, request?: any): ClientInfo {
    const clientInfo: ClientInfo = {
      timestamp: new Date().toISOString()
    }

    // 从数据中提取信息
    if (data.userAgent) {
      clientInfo.userAgent = data.userAgent
    }
    if (data.url) {
      clientInfo.url = data.url
    }
    if (data.sessionId) {
      clientInfo.sessionId = data.sessionId
    }
    if (data.timestamp) {
      clientInfo.timestamp = data.timestamp
    }

    // 从请求中提取信息（如果可用）
    if (request && this.adapter) {
      if (!clientInfo.userAgent) {
        clientInfo.userAgent = this.adapter.getHeader(request, 'user-agent') || undefined
      }
      
      clientInfo.ip = this.adapter.getClientIP(request)
      clientInfo.origin = this.adapter.getHeader(request, 'origin') || undefined
      clientInfo.referer = this.adapter.getHeader(request, 'referer') || undefined
    }

    return clientInfo
  }

  /**
   * 构建响应
   */
  buildResponse(result: ProcessResult, data?: any): ResponseData {
    const config = this.config.response!

    if (config.customResponseBuilder) {
      return config.customResponseBuilder(result, data)
    }

    const response: ResponseData = {
      success: result.success,
      timestamp: new Date().toISOString()
    }

    if (result.success) {
      response.message = config.successMessage
    } else {
      response.message = config.errorMessage
      if (config.includeDetails && result.errors) {
        response.details = result.errors
      }
    }

    if (config.includeStats) {
      response.data = {
        processed: result.processed,
        failed: result.failed,
        total: result.processed + result.failed
      }
    }

    return response
  }

  /**
   * 获取配置
   */
  getConfig(): LogReceiverConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LogReceiverConfig>): void {
    Object.assign(this.config, config)
    
    // 更新子组件配置
    if (config.validation) {
      this.validator.updateConfig(config.validation)
    }
  }

  /**
   * 获取适配器
   */
  getAdapter(): FrameworkAdapter {
    return this.adapter
  }

  /**
   * 销毁接收器
   */
  async destroy(): Promise<void> {
    this._isDestroyed = true
    // 这里可以添加清理逻辑
  }

  /**
   * 检查是否已销毁
   */
  isDestroyed(): boolean {
    return this._isDestroyed
  }
}
