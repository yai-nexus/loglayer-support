/**
 * 日志处理器
 * 负责将客户端日志转换并记录到服务端日志器
 */

import type { LogLayer } from 'loglayer'
import type { 
  ClientLogData, 
  ClientInfo, 
  ProcessResult, 
  ProcessingConfig 
} from '../receiver'

export class LogProcessor {
  private readonly logger: LogLayer
  private readonly config: ProcessingConfig

  constructor(logger: LogLayer, config: ProcessingConfig = {}) {
    this.logger = logger
    this.config = {
      preserveClientLevel: true,
      addServerContext: true,
      logSuccessfulReceives: false,
      supportBatch: true,
      maxBatchSize: 100,
      messagePrefix: '[客户端]',
      reconstructErrors: true,
      ...config
    }
  }

  /**
   * 处理单条日志
   */
  async processSingle(
    data: ClientLogData, 
    clientInfo: ClientInfo,
    context?: any
  ): Promise<ProcessResult> {
    try {
      await this.processLogEntry(data, clientInfo, context)
      
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
          error: error instanceof Error ? error.message : String(error)
        }]
      }
    }
  }

  /**
   * 处理批量日志
   */
  async processBatch(
    dataArray: ClientLogData[], 
    clientInfo: ClientInfo,
    context?: any
  ): Promise<ProcessResult> {
    if (!this.config.supportBatch) {
      throw new Error('Batch processing is not enabled')
    }

    if (dataArray.length > this.config.maxBatchSize!) {
      throw new Error(`Batch size ${dataArray.length} exceeds maximum ${this.config.maxBatchSize}`)
    }

    const results: ProcessResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    }

    for (const data of dataArray) {
      try {
        await this.processLogEntry(data, clientInfo, context)
        results.processed++
      } catch (error) {
        results.failed++
        results.errors!.push({
          item: data,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    results.success = results.failed === 0

    return results
  }

  /**
   * 处理单个日志条目
   */
  private async processLogEntry(
    data: ClientLogData,
    clientInfo: ClientInfo,
    context?: any
  ): Promise<void> {
    // 构建日志消息
    const message = this.buildMessage(data.message)
    
    // 构建元数据
    const metadata = this.buildMetadata(data, clientInfo, context)
    
    // 根据级别记录日志
    await this.logByLevel(this.logger, data.level, message, metadata, data.error)

    // 记录成功接收的统计信息
    if (this.config.logSuccessfulReceives) {
      this.logger.debug('客户端日志接收成功', {
        logLevel: data.level,
        messageLength: data.message.length,
        hasMetadata: !!(data.metadata && Object.keys(data.metadata).length > 0),
        hasError: !!data.error,
        clientInfo
      })
    }
  }

  /**
   * 构建日志消息
   */
  private buildMessage(originalMessage: string): string {
    if (this.config.messagePrefix) {
      return `${this.config.messagePrefix} ${originalMessage}`
    }
    return originalMessage
  }

  /**
   * 构建元数据
   */
  private buildMetadata(
    data: ClientLogData,
    clientInfo: ClientInfo,
    context?: any
  ): Record<string, any> {
    const metadata: Record<string, any> = {}

    // 添加原始级别
    if (this.config.preserveClientLevel) {
      metadata.originalLevel = data.level
    }

    // 添加客户端信息
    metadata.clientInfo = clientInfo

    // 添加客户端元数据
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      metadata.clientMetadata = data.metadata
    }

    // 添加服务端上下文
    if (this.config.addServerContext) {
      metadata.receivedAt = new Date().toISOString()
      metadata.source = 'client-browser'
      
      if (context) {
        metadata.serverContext = context
      }
    }

    return metadata
  }

  /**
   * 根据级别记录日志
   */
  private async logByLevel(
    logger: LogLayer,
    level: string,
    message: string,
    metadata: Record<string, any>,
    error?: ClientLogData['error']
  ): Promise<void> {
    const normalizedLevel = level.toLowerCase()

    switch (normalizedLevel) {
      case 'debug':
        logger.debug(message, metadata)
        break
      
      case 'info':
        logger.info(message, metadata)
        break
      
      case 'warn':
        logger.warn(message, metadata)
        break
      
      case 'error':
        if (error && this.config.reconstructErrors) {
          // 重建错误对象
          const reconstructedError = this.reconstructError(error, message)
          logger.error(`客户端错误: ${message}`, {
            ...metadata,
            clientErrorName: error.name,
            clientErrorStack: error.stack,
            error: reconstructedError
          })
        } else {
          logger.error(message, metadata)
        }
        break
      
      default:
        // 未知级别，使用 info 级别记录
        logger.info(message, {
          ...metadata,
          unknownLevel: level
        })
    }
  }

  /**
   * 重建错误对象
   */
  private reconstructError(errorData: ClientLogData['error'], fallbackMessage: string): Error {
    const error = new Error(errorData?.message || fallbackMessage)
    
    if (errorData?.name) {
      error.name = errorData.name
    }
    
    if (errorData?.stack) {
      error.stack = errorData.stack
    } else {
      error.stack = 'No stack trace available'
    }
    
    return error
  }

  /**
   * 获取配置
   */
  getConfig(): ProcessingConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ProcessingConfig>): void {
    Object.assign(this.config, config)
  }
}
